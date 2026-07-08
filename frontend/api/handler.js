const { randomUUID } = require('crypto');
const { getDb, ensureDefaultAdmin } = require('./_lib/db');
const { hashPassword, verifyPassword, createAccessToken, verifyAccessToken, isStrongPassword } = require('./_lib/auth');
const { enrichShipmentWithYurtici, getYurticiConfig } = require('./_lib/yurticiKargo');
const {
    normalizeCargoKey,
    namesMatch,
    personMatchesCargo,
    isTrackableShipmentDirection,
} = require('./_lib/cargoMatch');
const {
    applySecurityHeaders,
    safeErrorDetail,
    requireRateLimit,
    coerceString,
    isValidPersonnelId,
} = require('./_lib/security');
const { isAllowedVideoUrl } = require('./_lib/videoValidate');

const ALLOWED_ROLES = ['admin', 'system_admin', 'viewer'];
const WRITE_ROLES = ['system_admin'];

function getAuthUsername(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        const payload = verifyAccessToken(auth.slice(7));
        return payload.sub || null;
    } catch {
        return null;
    }
}

async function getUserRole(db, username) {
    if (!username) return null;
    const user = await db.collection('users').findOne({ username });
    return user?.role || null;
}

async function requireAdminAccess(db, req, res) {
    const username = getAuthUsername(req);
    const role = await getUserRole(db, username);
    if (!role || !ALLOWED_ROLES.includes(role)) {
        sendError(res, 401, 'Yetkisiz erişim');
        return null;
    }
    return role;
}

async function requireWriteAccess(db, req, res) {
    const role = await requireAdminAccess(db, req, res);
    if (!role) return null;
    if (!WRITE_ROLES.includes(role)) {
        sendError(res, 403, 'Bu işlem için yetkiniz yok');
        return null;
    }
    return role;
}

async function requireSystemAdmin(db, req, res) {
    const role = await requireAdminAccess(db, req, res);
    if (!role) return null;
    if (role !== 'system_admin') {
        sendError(res, 403, 'Bu işlem için sistem yöneticisi yetkisi gerekli');
        return null;
    }
    return role;
}

function getShipmentPublicStatus(cargo, incomingMatch) {
    if (cargo.direction === 'incoming') {
        if (cargo.return_flag || cargo.return_reason) return 'returned';
        if (cargo.delivery_date || cargo.recipient) return 'delivered';
        return 'in_transit';
    }
    if (incomingMatch) return 'returned';
    if (cargo.delivery_date || cargo.recipient) return 'delivered';
    return 'in_transit';
}

function findCargoMatch(outgoing, incomingList) {
    const serialKey = normalizeCargoKey(outgoing.serial_number);
    if (serialKey && !/^(kargo|imp|sn)-/.test(serialKey)) {
        const bySerial = incomingList.find(
            (inc) => normalizeCargoKey(inc.serial_number) === serialKey
        );
        if (bySerial) return bySerial;
    }

    const nameMatches = incomingList.filter(
        (inc) =>
            namesMatch(outgoing.personnel_name, inc.personnel_name) ||
            namesMatch(outgoing.personnel_name, inc.recipient) ||
            (outgoing.recipient && namesMatch(outgoing.recipient, inc.personnel_name))
    );
    if (!nameMatches.length) return null;

    const byItem = nameMatches.find(
        (inc) => normalizeCargoKey(inc.item_name) === normalizeCargoKey(outgoing.item_name)
    );
    return byItem || nameMatches[0];
}

function filterCargoByDirection(allCargo, direction) {
    if (direction === 'outgoing') {
        return allCargo.filter((c) => c.direction !== 'incoming');
    }
    return allCargo.filter((c) => c.direction === 'incoming');
}

function looksLikeMisplacedCargoImport(item) {
    const serial = String(item.serial_number ?? '').trim();
    if (/^(KARGO|IMP)-/i.test(serial)) return true;
    const itemName = String(item.item_name ?? '').trim();
    return itemName.length > 0 && itemName !== 'Ürün' && itemName !== 'Urun';
}

async function syncInventoryToCargo(db, direction = 'outgoing') {
    if (!['outgoing', 'incoming'].includes(direction)) {
        return { imported: 0, skipped: 0, error: 'invalid_direction' };
    }

    const [inventoryItems, existingCargo] = await Promise.all([
        db.collection('inventory').find({}, { projection: { _id: 0 } }).toArray(),
        db.collection('cargo').find({}, { projection: { serial_number: 1, _id: 0 } }).toArray(),
    ]);

    const existingSerials = new Set(
        existingCargo.map((c) => String(c.serial_number ?? '').trim()).filter(Boolean)
    );

    const nameToId = {};
    for (const item of inventoryItems) {
        if (item.personnel_name && item.personnel_id) {
            const key = normalizeCargoKey(item.personnel_name);
            if (!nameToId[key]) nameToId[key] = item.personnel_id;
        }
    }

    const now = new Date().toISOString();
    const itemsToInsert = [];
    let skipped = 0;

    for (const item of inventoryItems) {
        if (!looksLikeMisplacedCargoImport(item)) {
            skipped += 1;
            continue;
        }

        const serial = String(item.serial_number ?? '').trim();
        if (!serial || existingSerials.has(serial)) {
            skipped += 1;
            continue;
        }

        existingSerials.add(serial);
        const personnelId = String(item.personnel_id ?? '').trim()
            || nameToId[normalizeCargoKey(item.personnel_name)]
            || undefined;

        itemsToInsert.push({
            id: randomUUID(),
            direction,
            personnel_id: personnelId,
            personnel_name: String(item.personnel_name ?? '').trim(),
            item_name: String(item.item_name || 'Kargo').trim(),
            serial_number: serial,
            created_at: item.created_at || now,
            imported_at: now,
            synced_from_inventory: true,
            address: '',
            phone: '',
            ship_date: '',
            delivery_date: item.returned_at || '',
            recipient: '',
        });
    }

    if (itemsToInsert.length) {
        const CHUNK = 100;
        for (let i = 0; i < itemsToInsert.length; i += CHUNK) {
            await db.collection('cargo').insertMany(itemsToInsert.slice(i, i + CHUNK));
        }
    }

    return { imported: itemsToInsert.length, skipped };
}

async function saveProductNames(db, names) {
    const unique = [...new Set(names.map((n) => String(n).trim()).filter(Boolean))];
    if (!unique.length) return;
    const now = new Date().toISOString();
    await db.collection('product_names').bulkWrite(
        unique.map((name) => ({
            updateOne: {
                filter: { name },
                update: { $set: { name, updated_at: now } },
                upsert: true,
            },
        }))
    );
}

function attachCargoMatches(items, direction, allCargo) {
    const incoming = allCargo.filter((c) => c.direction === 'incoming');
    const outgoing = allCargo.filter((c) => c.direction === 'outgoing');

    return items.map((item) => {
        if (direction === 'outgoing') {
            const match = findCargoMatch(item, incoming);
            return {
                ...item,
                is_returned: Boolean(match),
                match_id: match?.id || null,
                match: match || null,
            };
        }

        const match = findCargoMatch(
            { personnel_name: item.personnel_name, item_name: item.item_name, serial_number: item.serial_number },
            outgoing
        );
        return {
            ...item,
            is_returned: Boolean(match),
            match_id: match?.id || null,
            match: match || null,
        };
    });
}

async function resolvePersonnelById(db, personnelId) {
    const inv = await db.collection('inventory').findOne(
        { personnel_id: personnelId },
        { projection: { _id: 0, personnel_name: 1, personnel_id: 1 } }
    );
    if (inv?.personnel_name) {
        return { personnel_id: personnelId, personnel_name: String(inv.personnel_name).trim() };
    }

    const cargo = await db.collection('cargo').findOne(
        { personnel_id: personnelId },
        { projection: { _id: 0, personnel_name: 1, personnel_id: 1 } }
    );
    if (cargo?.personnel_name) {
        return { personnel_id: personnelId, personnel_name: String(cargo.personnel_name).trim() };
    }

    return null;
}

async function verifyPersonnelIdentity(db, personnelId, personnelName) {
    if (!/^\d{6}$/.test(personnelId)) return null;

    const invRecords = await db.collection('inventory')
        .find({ personnel_id: personnelId }, { projection: { _id: 0, personnel_name: 1, personnel_id: 1 } })
        .toArray();
    if (!invRecords.length) return null;

    const canonicalName = String(invRecords[0].personnel_name ?? '').trim();
    if (!canonicalName) return null;

    const inventoryMatch = invRecords.some((inv) => namesMatch(personnelName, inv.personnel_name));
    if (inventoryMatch) {
        return { personnel_id: personnelId, personnel_name: canonicalName };
    }

    const cargoRecords = await db.collection('cargo')
        .find({}, { projection: { _id: 0, personnel_name: 1, recipient: 1, personnel_id: 1 } })
        .toArray();
    const cargoMatch = cargoRecords.some((cargo) =>
        personMatchesCargo(
            cargo,
            { personnel_id: personnelId, personnel_name: canonicalName },
            personnelName
        )
    );

    if (cargoMatch) {
        return { personnel_id: personnelId, personnel_name: canonicalName };
    }

    return null;
}

async function personnelNameExists(db, personnelName) {
    const trimmed = String(personnelName ?? '').trim();
    if (trimmed.length < 3) return false;

    const [invNames, cargoRecords] = await Promise.all([
        db.collection('inventory').distinct('personnel_name'),
        db.collection('cargo')
            .find({}, { projection: { _id: 0, personnel_name: 1, recipient: 1 } })
            .toArray(),
    ]);

    if (invNames.some((name) => namesMatch(trimmed, name))) return true;

    return cargoRecords.some(
        (cargo) =>
            namesMatch(trimmed, cargo.personnel_name) || namesMatch(trimmed, cargo.recipient)
    );
}

async function buildCargoStatusResponse(db, person, queryName = '') {
    const allCargo = await db.collection('cargo').find({}, { projection: { _id: 0 } }).toArray();
    const incoming = allCargo.filter((c) => c.direction === 'incoming');

    const matched = allCargo.filter((cargo) => personMatchesCargo(cargo, person, queryName));

    let shipmentRecords = matched.filter((cargo) => isTrackableShipmentDirection(cargo.direction));
    if (!shipmentRecords.length) {
        shipmentRecords = matched.filter((cargo) => cargo.direction === 'incoming');
    }

    const shipmentMap = new Map();
    shipmentRecords.forEach((item) => {
        const dedupeKey = item.id || normalizeCargoKey(item.gonderi_kodu) || normalizeCargoKey(item.serial_number) || item.id;
        if (!shipmentMap.has(dedupeKey)) {
            shipmentMap.set(dedupeKey, item);
        }
    });

    if (!shipmentMap.size) {
        const invItems = await db.collection('inventory').find({}, { projection: { _id: 0 } }).toArray();
        invItems
            .filter((item) => looksLikeMisplacedCargoImport(item))
            .filter((item) =>
                personMatchesCargo(
                    { personnel_name: item.personnel_name, recipient: '', personnel_id: item.personnel_id },
                    person,
                    queryName
                )
            )
            .forEach((item) => {
                const dedupeKey = normalizeCargoKey(item.serial_number) || item.id;
                if (!shipmentMap.has(dedupeKey)) {
                    shipmentMap.set(dedupeKey, {
                        id: item.id,
                        direction: 'outgoing',
                        item_name: item.item_name,
                        serial_number: item.serial_number,
                        ship_date: '',
                        delivery_date: item.returned_at ? String(item.returned_at).split('T')[0] : '',
                        delivery_time: '',
                        recipient: '',
                        address: '',
                        arrival_city: '',
                        imported_at: item.created_at,
                        created_at: item.created_at,
                    });
                }
            });
    }

    const baseShipments = [...shipmentMap.values()]
        .map((record) => {
            const match = record.direction === 'incoming' ? null : findCargoMatch(record, incoming);
            return {
                id: record.id,
                item_name: record.item_name,
                serial_number: record.serial_number,
                gonderi_kodu: record.gonderi_kodu || '',
                status: getShipmentPublicStatus(record, match),
                ship_date: record.ship_date || '',
                delivery_date: record.delivery_date || '',
                delivery_time: record.delivery_time || '',
                recipient: record.recipient || '',
                address: record.address || '',
                arrival_city: record.arrival_city || '',
                updated_at: record.imported_at || record.created_at,
            };
        })
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const yurticiConfig = getYurticiConfig();
    const shipments = await Promise.all(baseShipments.map((s) => enrichShipmentWithYurtici(s)));

    return {
        personnel_id: person.personnel_id,
        personnel_name: person.personnel_name,
        live_tracking: yurticiConfig.enabled,
        shipments,
    };
}

async function buildPersonnelProfile(db, personnelId) {
    const items = await db.collection('inventory')
        .find({ personnel_id: personnelId }, { projection: { _id: 0 } })
        .sort({ created_at: -1 })
        .toArray();
    if (!items.length) return null;

    const person = {
        personnel_id: personnelId,
        personnel_name: items[0].personnel_name,
    };

    const allCargo = await db.collection('cargo')
        .find({}, { projection: { _id: 0 } })
        .toArray();

    const cargo_outgoing = allCargo.filter(
        (c) => c.direction !== 'incoming' && personMatchesCargo(c, person)
    );
    const cargo_incoming = allCargo.filter(
        (c) => c.direction === 'incoming' && personMatchesCargo(c, person)
    );

    const confirmation = await db.collection('confirmations')
        .find({ personnel_id: personnelId })
        .sort({ confirmed_at: -1 })
        .limit(1)
        .next();

    return {
        ...person,
        items,
        cargo_outgoing,
        cargo_incoming,
        confirmation: confirmation || null,
        is_confirmed: confirmation?.status === 'confirmed',
    };
}

function parseVideoTitles(data) {
    const titles = {
        tr: String(data.titles?.tr ?? data.title_tr ?? data.title ?? '').trim(),
        de: String(data.titles?.de ?? data.title_de ?? '').trim(),
        en: String(data.titles?.en ?? data.title_en ?? '').trim(),
    };
    if (!titles.tr && !titles.de && !titles.en) return null;
    if (!titles.tr) titles.tr = titles.de || titles.en;
    if (!titles.de) titles.de = titles.tr;
    if (!titles.en) titles.en = titles.tr;
    return titles;
}

function normalizeVideoDoc(video) {
    if (!video) return video;
    if (video.titles) return { ...video, title: video.titles.tr || video.title };
    const legacy = String(video.title || '').trim();
    return {
        ...video,
        titles: { tr: legacy, de: legacy, en: legacy },
    };
}

const CAROUSEL_TEMPLATE_IDS = [
    'red', 'indigo', 'blue', 'emerald', 'violet', 'amber', 'slate', 'cyan', 'teal', 'rose', 'orange',
];
const CAROUSEL_ICON_IDS = [
    'sparkles', 'download', 'monitor', 'refresh', 'message', 'package', 'shield', 'laptop', 'cable',
    'truck', 'clipboard', 'headphones', 'alert', 'help', 'ticket', 'video', 'home', 'megaphone',
    'wifi', 'settings', 'bell', 'star', 'zap', 'globe',
];

function parseCarouselLangField(data, field) {
    const nested = data[field];
    if (nested && typeof nested === 'object') {
        return {
            tr: String(nested.tr ?? '').trim(),
            de: String(nested.de ?? '').trim(),
            en: String(nested.en ?? '').trim(),
        };
    }
    return {
        tr: String(data[`${field}_tr`] ?? '').trim(),
        de: String(data[`${field}_de`] ?? '').trim(),
        en: String(data[`${field}_en`] ?? '').trim(),
    };
}

function fillCarouselLangs(obj) {
    const fallback = obj.tr || obj.de || obj.en || '';
    return {
        tr: obj.tr || fallback,
        de: obj.de || fallback,
        en: obj.en || fallback,
    };
}

function parseCarouselTitles(data) {
    const raw = parseCarouselLangField(data, 'titles');
    if (!raw.tr && !raw.de && !raw.en) return null;
    return fillCarouselLangs(raw);
}

function parseCarouselMessages(data) {
    const raw = parseCarouselLangField(data, 'messages');
    if (!raw.tr && !raw.de && !raw.en) return null;
    return fillCarouselLangs(raw);
}

function parseCarouselCtaLabels(data) {
    const raw = parseCarouselLangField(data, 'cta_labels');
    if (!raw.tr && !raw.de && !raw.en) return { tr: '', de: '', en: '' };
    return fillCarouselLangs(raw);
}

function isValidCarouselPath(path) {
    if (!path) return true;
    return path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

function normalizeCarouselDoc(slide) {
    if (!slide) return slide;
    const titles = slide.titles
        ? fillCarouselLangs(slide.titles)
        : { tr: String(slide.title || '').trim(), de: '', en: '' };
    const messages = slide.messages
        ? fillCarouselLangs(slide.messages)
        : { tr: String(slide.message || '').trim(), de: '', en: '' };
    const cta_labels = slide.cta_labels
        ? fillCarouselLangs(slide.cta_labels)
        : { tr: String(slide.cta_label || '').trim(), de: '', en: '' };
    return {
        ...slide,
        titles,
        messages,
        cta_labels,
    };
}

function validateCarouselPayload(data) {
    const titles = parseCarouselTitles(data);
    const messages = parseCarouselMessages(data);
    if (!titles || !messages) {
        return { error: 'En az bir dilde başlık ve mesaj gerekli' };
    }
    const template = String(data.template || 'red').trim();
    const icon = String(data.icon || 'sparkles').trim();
    if (!CAROUSEL_TEMPLATE_IDS.includes(template)) {
        return { error: 'Geçersiz slayt şablonu' };
    }
    if (!CAROUSEL_ICON_IDS.includes(icon)) {
        return { error: 'Geçersiz ikon' };
    }
    const cta_link = String(data.cta_link || '').trim();
    if (!isValidCarouselPath(cta_link)) {
        return { error: 'Bağlantı / ile başlamalıdır' };
    }
    const cta_labels = parseCarouselCtaLabels(data);
    if (cta_link && !cta_labels.tr && !cta_labels.de && !cta_labels.en) {
        return { error: 'Bağlantı için en az bir dilde buton metni gerekli' };
    }
    return {
        titles,
        messages,
        cta_link,
        cta_labels,
        template,
        icon,
        active: data.active !== false,
    };
}

function sendJson(res, status, data) {
    res.status(status).json(data);
}

function sendError(res, status, detail) {
    sendJson(res, status, { detail });
}

function parseRoute(req) {
    const routeParam = req.query.route;
    if (typeof routeParam === 'string') {
        return routeParam.replace(/^\/+|\/+$/g, '');
    }
    return '';
}

module.exports = async (req, res) => {
    applySecurityHeaders(res);

    const route = parseRoute(req);
    const segments = route ? route.split('/').filter(Boolean) : [];
    const method = req.method;

    try {
        const db = await getDb();
        await ensureDefaultAdmin(db);

        if (method === 'GET' && route === '') {
            return sendJson(res, 200, { message: 'DCS IT IT Assets API' });
        }

        if (method === 'POST' && route === 'auth/login') {
            if (!requireRateLimit(req, res, 'auth-login', { max: 8, windowMs: 60_000 })) return;

            const username = coerceString(req.body?.username, 64);
            const password = coerceString(req.body?.password, 128);
            if (!username || !password) {
                return sendError(res, 400, 'Kullanıcı adı ve şifre gerekli');
            }

            const user = await db.collection('users').findOne({ username });
            if (!user || !verifyPassword(password, user.password_hash)) {
                return sendError(res, 401, 'Hatalı kullanıcı adı veya şifre');
            }
            const access_token = createAccessToken(user.username);
            return sendJson(res, 200, {
                access_token,
                token_type: 'bearer',
                role: user.role,
            });
        }

        if (method === 'POST' && route === 'inventory/lookup') {
            if (!requireRateLimit(req, res, 'inventory-lookup', { max: 15, windowMs: 60_000 })) return;

            const personnelName = coerceString(req.body?.personnel_name, 120);
            const personnelId = coerceString(req.body?.personnel_id, 6);

            if (personnelName.length < 3) {
                return sendError(res, 400, 'Geçerli ad soyad giriniz');
            }
            if (!isValidPersonnelId(personnelId)) {
                return sendError(res, 400, 'Geçerli 6 haneli personel numarası gerekli');
            }

            const person = await verifyPersonnelIdentity(db, personnelId, personnelName);
            if (!person) {
                return sendJson(res, 200, {
                    personnel_id: personnelId,
                    personnel_name: null,
                    verified: false,
                    items: [],
                    is_confirmed: false,
                });
            }

            const items = await db.collection('inventory')
                .find({ personnel_id: personnelId, status: 'assigned' }, { projection: { _id: 0 } })
                .toArray();

            const confirmation = await db.collection('confirmations')
                .find({ personnel_id: personnelId })
                .sort({ confirmed_at: -1 })
                .limit(1)
                .next();

            const is_confirmed = Boolean(confirmation && confirmation.status === 'confirmed');
            return sendJson(res, 200, {
                personnel_id: personnelId,
                personnel_name: person.personnel_name,
                verified: true,
                items,
                is_confirmed,
            });
        }

        if (method === 'POST' && route === 'cargo/check-name') {
            if (!requireRateLimit(req, res, 'cargo-check-name', { max: 20, windowMs: 60_000 })) return;

            const personnelName = coerceString(req.body?.personnel_name, 120);
            if (personnelName.length < 3) {
                return sendError(res, 400, 'Geçerli ad soyad giriniz');
            }

            const found = await personnelNameExists(db, personnelName);
            return sendJson(res, 200, { found });
        }

        if (method === 'POST' && route === 'cargo/status') {
            if (!requireRateLimit(req, res, 'cargo-status', { max: 15, windowMs: 60_000 })) return;

            const personnelName = coerceString(req.body?.personnel_name, 120);
            const personnelId = coerceString(req.body?.personnel_id, 6);

            if (personnelName.length < 3) {
                return sendError(res, 400, 'Geçerli ad soyad giriniz');
            }
            if (!isValidPersonnelId(personnelId)) {
                return sendError(res, 400, 'Geçerli 6 haneli personel numarası gerekli');
            }

            const person = await verifyPersonnelIdentity(db, personnelId, personnelName);
            if (!person) {
                return sendJson(res, 200, {
                    personnel_id: personnelId,
                    personnel_name: null,
                    verified: false,
                    shipments: [],
                });
            }

            const result = await buildCargoStatusResponse(db, person, personnelName);
            return sendJson(res, 200, { ...result, verified: true });
        }

        if (method === 'POST' && route === 'inventory/confirm') {
            if (!requireRateLimit(req, res, 'inventory-confirm', { max: 10, windowMs: 60_000 })) return;

            const personnelName = coerceString(req.body?.personnel_name, 120);
            const personnelId = coerceString(req.body?.personnel_id, 6);

            if (!isValidPersonnelId(personnelId) || personnelName.length < 3) {
                return sendError(res, 400, 'Kimlik doğrulama bilgileri eksik');
            }

            const person = await verifyPersonnelIdentity(db, personnelId, personnelName);
            if (!person) {
                return sendError(res, 403, 'Ad soyad ile personel numarası eşleşmiyor');
            }

            const items = Array.isArray(req.body?.items) ? req.body.items : [];
            const confirmation = {
                id: randomUUID(),
                personnel_id: personnelId,
                personnel_name: person.personnel_name,
                items: items.map((item) => ({
                    item_name: coerceString(item?.item_name, 200),
                    serial_number: coerceString(item?.serial_number, 100),
                })),
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
            };

            await db.collection('confirmations').insertOne(confirmation);
            return sendJson(res, 200, { status: 'success', id: confirmation.id });
        }

        if (method === 'GET' && route === 'admin/stats') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const total_assigned = await db.collection('inventory').countDocuments({ status: 'assigned' });
            const total_returned = await db.collection('inventory').countDocuments({ status: 'returned' });
            const personnel_ids = await db.collection('inventory').distinct('personnel_id');

            let pending_confirmations = 0;
            for (const pId of personnel_ids) {
                const items = await db.collection('inventory').countDocuments({ personnel_id: pId, status: 'assigned' });
                if (items > 0) {
                    const confirmed = await db.collection('confirmations').findOne({ personnel_id: pId, status: 'confirmed' });
                    if (!confirmed) pending_confirmations += 1;
                }
            }

            return sendJson(res, 200, {
                total_assigned_items: total_assigned,
                total_returned_items: total_returned,
                total_personnel_with_assets: personnel_ids.length,
                pending_confirmations,
            });
        }

        if (method === 'POST' && route === 'admin/inventory/bulk') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const inputs = Array.isArray(req.body) ? req.body : [];
            const now = new Date().toISOString();
            const itemsToInsert = inputs.map((input) => ({
                id: randomUUID(),
                personnel_id: input.personnel_id,
                personnel_name: input.personnel_name,
                item_name: input.item_name,
                serial_number: input.serial_number,
                created_at: input.created_at || now,
                status: input.status || 'assigned',
                return_note: null,
                returned_at: input.status === 'returned' ? (input.created_at || now) : null,
                it_notes: '',
                condition: 'undamaged',
            }));

            const personnelIds = [...new Set(inputs.map((i) => i.personnel_id).filter(Boolean))];
            if (itemsToInsert.length) {
                await db.collection('inventory').insertMany(itemsToInsert);
                await saveProductNames(db, itemsToInsert.map((i) => i.item_name));
                for (const pId of personnelIds) {
                    await db.collection('confirmations').updateMany(
                        { personnel_id: pId, status: 'confirmed' },
                        { $set: { status: 'reset', reset_at: new Date().toISOString() } }
                    );
                }
            }
            return sendJson(res, 200, { status: 'success', count: itemsToInsert.length });
        }

        if (method === 'POST' && route === 'admin/inventory/import') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const rows = Array.isArray(req.body?.items) ? req.body.items : [];
            if (!rows.length) {
                return sendError(res, 400, 'İçe aktarılacak kayıt bulunamadı');
            }

            const existingItems = await db.collection('inventory')
                .find({}, { projection: { serial_number: 1, personnel_name: 1, personnel_id: 1, _id: 0 } })
                .toArray();

            const existingSerials = new Set(
                existingItems.map((i) => i.serial_number).filter(Boolean)
            );
            const nameToId = {};
            for (const item of existingItems) {
                if (item.personnel_name && item.personnel_id) {
                    const key = normalizeCargoKey(item.personnel_name);
                    if (!nameToId[key]) nameToId[key] = item.personnel_id;
                }
            }

            const numericIds = existingItems
                .map((i) => parseInt(i.personnel_id, 10))
                .filter((n) => !Number.isNaN(n));
            let nextId = numericIds.length ? Math.max(...numericIds) + 1 : 100001;

            const batchSerials = new Set();
            const itemsToInsert = [];
            let skipped = 0;

            for (const row of rows) {
                const name = String(row.personnel_name || '').trim();
                if (!name) {
                    skipped += 1;
                    continue;
                }

                const serial = String(row.serial_number || '').trim();
                if (serial && (existingSerials.has(serial) || batchSerials.has(serial))) {
                    skipped += 1;
                    continue;
                }

                let personnelId = String(row.personnel_id || '').trim();
                if (!personnelId) {
                    const nameKey = normalizeCargoKey(name);
                    if (!nameToId[nameKey]) {
                        nameToId[nameKey] = String(nextId++);
                    }
                    personnelId = nameToId[nameKey];
                } else {
                    nameToId[normalizeCargoKey(name)] = personnelId;
                }

                const createdAt = row.created_at || new Date().toISOString();
                const status = row.status === 'returned' ? 'returned' : 'assigned';
                const finalSerial = serial || `IMP-${randomUUID().slice(0, 8)}`;

                if (serial) batchSerials.add(serial);

                itemsToInsert.push({
                    id: randomUUID(),
                    personnel_id: personnelId,
                    personnel_name: name,
                    item_name: String(row.item_name || 'Ürün').trim(),
                    serial_number: finalSerial,
                    created_at: createdAt,
                    status,
                    return_note: null,
                    returned_at: status === 'returned' ? createdAt : null,
                    it_notes: '',
                    condition: 'undamaged',
                });
            }

            if (itemsToInsert.length) {
                const CHUNK = 100;
                for (let i = 0; i < itemsToInsert.length; i += CHUNK) {
                    await db.collection('inventory').insertMany(itemsToInsert.slice(i, i + CHUNK));
                }
                await saveProductNames(db, itemsToInsert.map((i) => i.item_name));
            }

            return sendJson(res, 200, {
                status: 'success',
                imported: itemsToInsert.length,
                skipped,
            });
        }

        if (method === 'POST' && route === 'admin/inventory/return') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const item_id = req.query.item_id;
            const note = req.query.note || '';
            const result = await db.collection('inventory').updateOne(
                { id: item_id },
                { $set: { status: 'returned', return_note: note, returned_at: new Date().toISOString() } }
            );
            if (result.modifiedCount === 0) {
                return sendError(res, 404, 'Ürün bulunamadı');
            }
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'POST' && route === 'admin/inventory/reset-confirmation') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const personnel_id = req.query.personnel_id;
            await db.collection('confirmations').updateMany(
                { personnel_id, status: 'confirmed' },
                { $set: { status: 'reset', reset_at: new Date().toISOString() } }
            );
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'GET' && route === 'admin/next-personnel-id') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const pIds = await db.collection('inventory').distinct('personnel_id');
            const numericIds = pIds.map((pid) => parseInt(pid, 10)).filter((n) => !Number.isNaN(n));
            if (!numericIds.length) {
                return sendJson(res, 200, { next_id: '100001' });
            }
            return sendJson(res, 200, { next_id: String(Math.max(...numericIds) + 1) });
        }

        if (method === 'GET' && route === 'admin/personnel/search') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const name = req.query.name || '';
            const personnel = await db.collection('inventory').findOne(
                { personnel_name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
                { projection: { personnel_id: 1, _id: 0 } }
            );
            return sendJson(res, 200, { personnel_id: personnel?.personnel_id ?? null });
        }

        if (method === 'GET' && route === 'admin/random-personnel-id') {
            if (!(await requireWriteAccess(db, req, res))) return;
            for (let i = 0; i < 10; i += 1) {
                const newId = String(Math.floor(100000 + Math.random() * 900000));
                const existing = await db.collection('inventory').findOne({ personnel_id: newId });
                if (!existing) {
                    return sendJson(res, 200, { random_id: newId });
                }
            }
            const pIds = await db.collection('inventory').distinct('personnel_id');
            const numericIds = pIds.map((pid) => parseInt(pid, 10)).filter((n) => !Number.isNaN(n));
            const nextId = numericIds.length ? String(Math.max(...numericIds) + 1) : '100001';
            return sendJson(res, 200, { random_id: nextId });
        }

        if (method === 'GET' && route === 'admin/confirmations') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const confirmations = await db.collection('confirmations')
                .find({}, { projection: { _id: 0 } })
                .toArray();
            return sendJson(res, 200, confirmations);
        }

        if (method === 'GET' && route === 'admin/inventory') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const inventory = await db.collection('inventory')
                .find({}, { projection: { _id: 0 } })
                .toArray();
            return sendJson(res, 200, inventory);
        }

        if (method === 'GET' && segments[0] === 'admin' && segments[1] === 'personnel' && segments.length === 3 && segments[2] !== 'search') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const profile = await buildPersonnelProfile(db, segments[2]);
            if (!profile) {
                return sendError(res, 404, 'Personel bulunamadı');
            }
            return sendJson(res, 200, profile);
        }

        if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'inventory' && segments.length === 3) {
            const reserved = ['bulk', 'import', 'return', 'reset-confirmation'];
            if (!reserved.includes(segments[2])) {
                if (!(await requireWriteAccess(db, req, res))) return;
                const it_notes = coerceString(req.body?.it_notes, 2000);
                const condition = req.body?.condition === 'damaged' ? 'damaged' : 'undamaged';
                const result = await db.collection('inventory').updateOne(
                    { id: segments[2] },
                    { $set: { it_notes, condition } }
                );
                if (result.matchedCount === 0) {
                    return sendError(res, 404, 'Ürün bulunamadı');
                }
                return sendJson(res, 200, { status: 'success' });
            }
        }

        if (method === 'GET' && route === 'admin/product-names') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const [catalog, inventoryNames] = await Promise.all([
                db.collection('product_names').find({}, { projection: { _id: 0, name: 1 } }).toArray(),
                db.collection('inventory').distinct('item_name'),
            ]);
            const names = [...new Set([
                ...catalog.map((c) => c.name),
                ...inventoryNames,
            ])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));
            return sendJson(res, 200, names);
        }

        if (method === 'GET' && segments[0] === 'admin' && segments[1] === 'cargo' && segments.length === 3 && !segments[2].includes('.')) {
            if (!(await requireAdminAccess(db, req, res))) return;
            const direction = segments[2];
            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }

            const allCargo = await db.collection('cargo')
                .find({}, { projection: { _id: 0 } })
                .toArray();

            const items = filterCargoByDirection(allCargo, direction)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return sendJson(res, 200, attachCargoMatches(items, direction, allCargo));
        }

        if (method === 'GET' && route === 'admin/cargo') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const direction = req.query.direction;
            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }

            const allCargo = await db.collection('cargo')
                .find({}, { projection: { _id: 0 } })
                .toArray();

            const items = filterCargoByDirection(allCargo, direction)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return sendJson(res, 200, attachCargoMatches(items, direction, allCargo));
        }

        if (method === 'POST' && route === 'admin/cargo/sync-from-inventory') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const direction = req.body?.direction === 'incoming' ? 'incoming' : 'outgoing';
            const result = await syncInventoryToCargo(db, direction);
            return sendJson(res, 200, { status: 'success', ...result });
        }

        if (method === 'POST' && route === 'admin/cargo/import') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const direction = req.body?.direction;
            const rows = Array.isArray(req.body?.items) ? req.body.items : [];

            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }
            if (!rows.length) {
                return sendError(res, 400, 'İçe aktarılacak kayıt bulunamadı');
            }

            const existingCargo = await db.collection('cargo')
                .find({ direction }, { projection: { serial_number: 1, _id: 0 } })
                .toArray();
            const existingSerials = new Set(
                existingCargo.map((c) => c.serial_number).filter(Boolean)
            );
            const batchSerials = new Set();

            const itemsToInsert = [];
            let skipped = 0;
            const now = new Date().toISOString();

            for (const row of rows) {
                const name = String(row.personnel_name || '').trim();
                if (!name) {
                    skipped += 1;
                    continue;
                }

                const serial = String(row.serial_number || '').trim();
                if (serial && (existingSerials.has(serial) || batchSerials.has(serial))) {
                    skipped += 1;
                    continue;
                }

                const finalSerial = serial || `KARGO-${randomUUID().slice(0, 8)}`;
                if (serial) batchSerials.add(serial);

                itemsToInsert.push({
                    id: randomUUID(),
                    direction,
                    personnel_id: String(row.personnel_id || '').trim() || undefined,
                    personnel_name: name,
                    item_name: String(row.item_name || 'Kargo').trim(),
                    gonderi_kodu: String(row.gonderi_kodu || '').trim() || undefined,
                    serial_number: finalSerial,
                    created_at: row.created_at || now,
                    imported_at: now,
                    row_no: row.row_no ?? null,
                    address: row.address || '',
                    phone: row.phone || '',
                    ship_date: row.ship_date || '',
                    sender: row.sender || '',
                    arrival_date: row.arrival_date || '',
                    arrival_city: row.arrival_city || '',
                    delivery_type: row.delivery_type || '',
                    delivery_date: row.delivery_date || '',
                    delivery_time: row.delivery_time || '',
                    recipient: row.recipient || '',
                    recipient_unit: row.recipient_unit || '',
                    recipient_city: row.recipient_city || '',
                    package_count: row.package_count ?? null,
                    return_flag: row.return_flag || '',
                    return_reason: row.return_reason || '',
                });
            }

            if (itemsToInsert.length) {
                const CHUNK = 100;
                for (let i = 0; i < itemsToInsert.length; i += CHUNK) {
                    await db.collection('cargo').insertMany(itemsToInsert.slice(i, i + CHUNK));
                }
            }

            return sendJson(res, 200, {
                status: 'success',
                imported: itemsToInsert.length,
                skipped,
            });
        }

        if (method === 'GET' && route === 'admin/users') {
            if (!(await requireSystemAdmin(db, req, res))) return;
            const users = await db.collection('users')
                .find({}, { projection: { _id: 0, password_hash: 0 } })
                .toArray();
            return sendJson(res, 200, users);
        }

        if (method === 'POST' && route === 'admin/users') {
            if (!(await requireSystemAdmin(db, req, res))) return;
            const data = req.body || {};
            const username = coerceString(data.username, 64);
            const password = coerceString(data.password, 128);
            if (!username || !isStrongPassword(password)) {
                return sendError(res, 400, 'Geçerli kullanıcı adı ve en az 10 karakterlik şifre gerekli');
            }
            if (!ALLOWED_ROLES.includes(data.role)) {
                return sendError(res, 400, 'Geçersiz rol');
            }
            const existing = await db.collection('users').findOne({ username });
            if (existing) {
                return sendError(res, 400, 'Bu kullanıcı adı zaten mevcut');
            }
            await db.collection('users').insertOne({
                id: randomUUID(),
                username,
                password_hash: hashPassword(password),
                role: data.role || 'admin',
                created_at: new Date().toISOString(),
            });
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'POST' && route === 'admin/change-password') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const authUsername = getAuthUsername(req);
            const { current_password, new_password } = req.body || {};
            if (!authUsername || !current_password || !new_password) {
                return sendError(res, 400, 'Mevcut şifre ve yeni şifre gerekli');
            }
            if (!isStrongPassword(new_password)) {
                return sendError(res, 400, 'Yeni şifre en az 10 karakter olmalı');
            }
            const user = await db.collection('users').findOne({ username: authUsername });
            if (!user || !verifyPassword(current_password, user.password_hash)) {
                return sendError(res, 401, 'Mevcut şifre hatalı');
            }
            const result = await db.collection('users').updateOne(
                { username: authUsername },
                { $set: { password_hash: hashPassword(new_password) } }
            );
            if (result.matchedCount === 0) {
                return sendError(res, 404, 'Kullanıcı bulunamadı');
            }
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'GET' && route === 'announcement/active') {
            const announcement = await db.collection('announcements')
                .findOne({ active: true }, { projection: { _id: 0 }, sort: { published_at: -1 } });
            return sendJson(res, 200, announcement);
        }

        if (method === 'GET' && route === 'admin/announcement') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const announcement = await db.collection('announcements')
                .findOne({ active: true }, { projection: { _id: 0 } });
            return sendJson(res, 200, announcement);
        }

        if (method === 'POST' && route === 'admin/announcement/deactivate') {
            if (!(await requireWriteAccess(db, req, res))) return;
            await db.collection('announcements').updateMany(
                { active: true },
                { $set: { active: false, deactivated_at: new Date().toISOString() } }
            );
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'POST' && route === 'admin/announcement') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const data = req.body || {};
            const title = String(data.title || '').trim();
            const message = String(data.message || '').trim();
            if (!title || !message) {
                return sendError(res, 400, 'Duyuru başlığı ve mesajı gerekli');
            }
            const validPriority = ['high', 'medium', 'low'];
            const validBg = ['red', 'blue', 'green', 'orange', 'violet', 'slate'];
            const priority = validPriority.includes(data.priority) ? data.priority : 'medium';
            const background = validBg.includes(data.background) ? data.background : 'red';

            await db.collection('announcements').updateMany(
                { active: true },
                { $set: { active: false, deactivated_at: new Date().toISOString() } }
            );

            const announcement = {
                id: randomUUID(),
                title,
                message,
                priority,
                background,
                active: true,
                published_at: new Date().toISOString(),
                published_by: getAuthUsername(req) || 'admin',
            };
            await db.collection('announcements').insertOne(announcement);
            return sendJson(res, 200, { status: 'success', announcement });
        }

        if (method === 'GET' && route === 'troubleshooting-videos') {
            const videos = await db.collection('troubleshooting_videos')
                .find({}, { projection: { _id: 0 } })
                .sort({ created_at: -1 })
                .toArray();
            return sendJson(res, 200, videos.map(normalizeVideoDoc));
        }

        if (method === 'GET' && route === 'admin/troubleshooting-videos') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const videos = await db.collection('troubleshooting_videos')
                .find({}, { projection: { _id: 0 } })
                .sort({ created_at: -1 })
                .toArray();
            return sendJson(res, 200, videos.map(normalizeVideoDoc));
        }

        if (method === 'POST' && route === 'admin/troubleshooting-videos') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const data = req.body || {};
            const titles = parseVideoTitles(data);
            const video_url = String(data.video_url || '').trim();
            if (!titles || !video_url) {
                return sendError(res, 400, 'En az bir dilde başlık ve video bağlantısı gerekli');
            }
            if (!isAllowedVideoUrl(video_url)) {
                return sendError(res, 400, 'Yalnızca YouTube, Vimeo veya HTTPS video bağlantıları kabul edilir');
            }
            const video = {
                id: randomUUID(),
                titles,
                title: titles.tr,
                video_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: getAuthUsername(req) || 'admin',
            };
            await db.collection('troubleshooting_videos').insertOne(video);
            return sendJson(res, 200, { status: 'success', video: normalizeVideoDoc(video) });
        }

        if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'troubleshooting-videos' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res))) return;
            const videoId = segments[2];
            const data = req.body || {};
            const titles = parseVideoTitles(data);
            const video_url = String(data.video_url || '').trim();
            if (!titles || !video_url) {
                return sendError(res, 400, 'En az bir dilde başlık ve video bağlantısı gerekli');
            }
            if (!isAllowedVideoUrl(video_url)) {
                return sendError(res, 400, 'Yalnızca YouTube, Vimeo veya HTTPS video bağlantıları kabul edilir');
            }
            const result = await db.collection('troubleshooting_videos').updateOne(
                { id: videoId },
                {
                    $set: {
                        titles,
                        title: titles.tr,
                        video_url,
                        updated_at: new Date().toISOString(),
                        updated_by: getAuthUsername(req) || 'admin',
                    },
                }
            );
            if (result.matchedCount === 0) {
                return sendError(res, 404, 'Video bulunamadı');
            }
            const updated = await db.collection('troubleshooting_videos').findOne(
                { id: videoId },
                { projection: { _id: 0 } }
            );
            return sendJson(res, 200, { status: 'success', video: normalizeVideoDoc(updated) });
        }

        if (method === 'DELETE' && segments[0] === 'admin' && segments[1] === 'troubleshooting-videos' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res))) return;
            const videoId = segments[2];
            const result = await db.collection('troubleshooting_videos').deleteOne({ id: videoId });
            if (result.deletedCount === 0) {
                return sendError(res, 404, 'Video bulunamadı');
            }
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'GET' && route === 'carousel-slides') {
            const slides = await db.collection('carousel_slides')
                .find({ active: { $ne: false } }, { projection: { _id: 0 } })
                .sort({ sort_order: 1, created_at: 1 })
                .toArray();
            return sendJson(res, 200, slides.map(normalizeCarouselDoc));
        }

        if (method === 'GET' && route === 'admin/carousel-slides') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const slides = await db.collection('carousel_slides')
                .find({}, { projection: { _id: 0 } })
                .sort({ sort_order: 1, created_at: 1 })
                .toArray();
            return sendJson(res, 200, slides.map(normalizeCarouselDoc));
        }

        if (method === 'POST' && route === 'admin/carousel-slides') {
            if (!(await requireWriteAccess(db, req, res))) return;
            const validated = validateCarouselPayload(req.body || {});
            if (validated.error) {
                return sendError(res, 400, validated.error);
            }
            const count = await db.collection('carousel_slides').countDocuments();
            const slide = {
                id: randomUUID(),
                ...validated,
                sort_order: count,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: getAuthUsername(req) || 'admin',
            };
            await db.collection('carousel_slides').insertOne(slide);
            return sendJson(res, 200, { status: 'success', slide: normalizeCarouselDoc(slide) });
        }

        if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'carousel-slides' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res))) return;
            const slideId = segments[2];
            const validated = validateCarouselPayload(req.body || {});
            if (validated.error) {
                return sendError(res, 400, validated.error);
            }
            const result = await db.collection('carousel_slides').updateOne(
                { id: slideId },
                {
                    $set: {
                        ...validated,
                        updated_at: new Date().toISOString(),
                        updated_by: getAuthUsername(req) || 'admin',
                    },
                }
            );
            if (result.matchedCount === 0) {
                return sendError(res, 404, 'Slayt bulunamadı');
            }
            const updated = await db.collection('carousel_slides').findOne(
                { id: slideId },
                { projection: { _id: 0 } }
            );
            return sendJson(res, 200, { status: 'success', slide: normalizeCarouselDoc(updated) });
        }

        if (method === 'DELETE' && segments[0] === 'admin' && segments[1] === 'carousel-slides' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res))) return;
            const slideId = segments[2];
            const result = await db.collection('carousel_slides').deleteOne({ id: slideId });
            if (result.deletedCount === 0) {
                return sendError(res, 404, 'Slayt bulunamadı');
            }
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'DELETE' && segments[0] === 'admin' && segments[1] === 'users' && segments.length === 3) {
            if (!(await requireSystemAdmin(db, req, res))) return;
            const username = segments[2];
            if (username === 'admin') {
                return sendError(res, 400, 'Ana sistem yöneticisi silinemez');
            }
            await db.collection('users').deleteOne({ username });
            return sendJson(res, 200, { status: 'success' });
        }

        return sendError(res, 404, 'Endpoint bulunamadı');
    } catch (err) {
        console.error('API error:', err);
        const status = err.statusCode || 500;
        return sendError(res, status, safeErrorDetail(err));
    }
};
