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
const {
    resolveUserPermissions,
    normalizePermissions,
    canView,
    canWrite,
} = require('./_lib/permissions');

const ALLOWED_ROLES = ['admin', 'system_admin', 'viewer'];

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

async function getAuthUser(db, req) {
    const username = getAuthUsername(req);
    if (!username) return null;
    const user = await db.collection('users').findOne({ username });
    if (!user || !ALLOWED_ROLES.includes(user.role)) return null;
    return user;
}

async function requireAdminAccess(db, req, res) {
    const user = await getAuthUser(db, req);
    if (!user) {
        sendError(res, 401, 'Yetkisiz erişim');
        return null;
    }
    return user;
}

async function requireModuleAccess(db, req, res, module, { write = false } = {}) {
    const user = await requireAdminAccess(db, req, res);
    if (!user) return null;

    const permissions = resolveUserPermissions(user);
    if (!canView(permissions, module)) {
        sendError(res, 403, 'Bu bölüme erişim yetkiniz yok');
        return null;
    }
    if (write && !canWrite(permissions, module)) {
        sendError(res, 403, 'Bu işlem için yetkiniz yok');
        return null;
    }
    return user;
}

async function requireWriteAccess(db, req, res, module = 'inventory') {
    return requireModuleAccess(db, req, res, module, { write: true });
}

async function requireSystemAdmin(db, req, res) {
    const user = await requireAdminAccess(db, req, res);
    if (!user) return null;
    if (user.role !== 'system_admin') {
        sendError(res, 403, 'Bu işlem için sistem yöneticisi yetkisi gerekli');
        return null;
    }
    return user;
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
        ka: String(data.titles?.ka ?? data.title_ka ?? '').trim(),
    };
    if (!titles.tr && !titles.de && !titles.en && !titles.ka) return null;
    if (!titles.tr) titles.tr = titles.de || titles.en || titles.ka;
    if (!titles.de) titles.de = titles.tr;
    if (!titles.en) titles.en = titles.tr;
    if (!titles.ka) titles.ka = titles.tr;
    return titles;
}

function normalizeVideoDoc(video) {
    if (!video) return video;
    if (video.titles) return { ...video, title: video.titles.tr || video.title };
    const legacy = String(video.title || '').trim();
    return {
        ...video,
        titles: { tr: legacy, de: legacy, en: legacy, ka: legacy },
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
            ka: String(nested.ka ?? '').trim(),
        };
    }
    return {
        tr: String(data[`${field}_tr`] ?? '').trim(),
        de: String(data[`${field}_de`] ?? '').trim(),
        en: String(data[`${field}_en`] ?? '').trim(),
        ka: String(data[`${field}_ka`] ?? '').trim(),
    };
}

function fillCarouselLangs(obj) {
    const fallback = obj.tr || obj.de || obj.en || obj.ka || '';
    return {
        tr: obj.tr || fallback,
        de: obj.de || fallback,
        en: obj.en || fallback,
        ka: obj.ka || fallback,
    };
}

function parseCarouselTitles(data) {
    const raw = parseCarouselLangField(data, 'titles');
    if (!raw.tr && !raw.de && !raw.en && !raw.ka) return null;
    return fillCarouselLangs(raw);
}

function parseCarouselMessages(data) {
    const raw = parseCarouselLangField(data, 'messages');
    if (!raw.tr && !raw.de && !raw.en && !raw.ka) return null;
    return fillCarouselLangs(raw);
}

function parseCarouselCtaLabels(data) {
    const raw = parseCarouselLangField(data, 'cta_labels');
    if (!raw.tr && !raw.de && !raw.en && !raw.ka) return { tr: '', de: '', en: '', ka: '' };
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
        : { tr: String(slide.title || '').trim(), de: '', en: '', ka: '' };
    const messages = slide.messages
        ? fillCarouselLangs(slide.messages)
        : { tr: String(slide.message || '').trim(), de: '', en: '', ka: '' };
    const cta_labels = slide.cta_labels
        ? fillCarouselLangs(slide.cta_labels)
        : { tr: String(slide.cta_label || '').trim(), de: '', en: '', ka: '' };
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
    if (cta_link && !cta_labels.tr && !cta_labels.de && !cta_labels.en && !cta_labels.ka) {
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

const DEFAULT_CAROUSEL_COUNT = 13;
const DEFAULT_CAROUSEL_DURATION_MS = 7000;
const MIN_CAROUSEL_DURATION_MS = 3000;
const MAX_CAROUSEL_DURATION_MS = 60000;

function clampCarouselDuration(ms) {
    const value = Number(ms);
    if (!Number.isFinite(value)) return DEFAULT_CAROUSEL_DURATION_MS;
    return Math.min(MAX_CAROUSEL_DURATION_MS, Math.max(MIN_CAROUSEL_DURATION_MS, Math.round(value)));
}

function buildDefaultCarouselOrder() {
    return Array.from({ length: DEFAULT_CAROUSEL_COUNT }, (_, i) => `default-${i}`);
}

function isDefaultCarouselSlideId(id) {
    return /^default-\d+$/.test(String(id || ''));
}

function getValidCarouselSlideIds(customIds) {
    return new Set([...buildDefaultCarouselOrder(), ...customIds]);
}

function sanitizeSlideDurations(map, customIds) {
    const valid = getValidCarouselSlideIds(customIds);
    const result = {};
    if (!map || typeof map !== 'object') return result;
    for (const [id, ms] of Object.entries(map)) {
        if (valid.has(id)) result[id] = clampCarouselDuration(ms);
    }
    return result;
}

function normalizeCarouselOrderIds(order, customIds) {
    const defaultOrder = buildDefaultCarouselOrder();
    const allIds = new Set([...defaultOrder, ...customIds]);
    const seen = new Set();
    const normalized = [];

    (Array.isArray(order) ? order : []).forEach((id) => {
        if (allIds.has(id) && !seen.has(id)) {
            normalized.push(id);
            seen.add(id);
        }
    });

    defaultOrder.forEach((id) => {
        if (!seen.has(id)) {
            normalized.push(id);
            seen.add(id);
        }
    });

    customIds.forEach((id) => {
        if (!seen.has(id)) {
            normalized.push(id);
            seen.add(id);
        }
    });

    return normalized;
}

async function getCarouselConfig(db, customIds) {
    const doc = await db.collection('carousel_config').findOne({ _id: 'order' });
    return {
        order: normalizeCarouselOrderIds(doc?.slide_ids, customIds),
        default_duration_ms: clampCarouselDuration(doc?.default_duration_ms ?? DEFAULT_CAROUSEL_DURATION_MS),
        slide_durations: sanitizeSlideDurations(doc?.slide_durations, customIds),
    };
}

async function saveCarouselOrderDoc(db, order) {
    await db.collection('carousel_config').updateOne(
        { _id: 'order' },
        {
            $set: {
                slide_ids: order,
                updated_at: new Date().toISOString(),
            },
            $setOnInsert: {
                default_duration_ms: DEFAULT_CAROUSEL_DURATION_MS,
                slide_durations: {},
            },
        },
        { upsert: true }
    );
}

async function saveCarouselSettingsDoc(db, customIds, settings) {
    const current = await getCarouselConfig(db, customIds);
    const nextDurations = {
        ...current.slide_durations,
        ...(settings.slide_durations || {}),
    };
    const cleanedDurations = sanitizeSlideDurations(nextDurations, customIds);

    await db.collection('carousel_config').updateOne(
        { _id: 'order' },
        {
            $set: {
                slide_ids: current.order,
                default_duration_ms: settings.default_duration_ms ?? current.default_duration_ms,
                slide_durations: cleanedDurations,
                updated_at: new Date().toISOString(),
            },
        },
        { upsert: true }
    );

    return {
        order: current.order,
        default_duration_ms: settings.default_duration_ms ?? current.default_duration_ms,
        slide_durations: cleanedDurations,
    };
}

function validateCarouselSettings(body, customIds) {
    const valid = getValidCarouselSlideIds(customIds);
    const result = {};

    if (body?.default_duration_ms != null) {
        result.default_duration_ms = clampCarouselDuration(body.default_duration_ms);
    }

    if (body?.slide_durations && typeof body.slide_durations === 'object') {
        result.slide_durations = {};
        for (const [id, ms] of Object.entries(body.slide_durations)) {
            if (valid.has(id)) {
                result.slide_durations[id] = clampCarouselDuration(ms);
            }
        }
    }

    if (!result.default_duration_ms && !result.slide_durations) {
        return { error: 'Geçersiz süre ayarları' };
    }

    return result;
}

function validateCarouselReorder(order, customIds) {
    if (!Array.isArray(order) || order.length === 0) {
        return { error: 'Geçersiz sıra listesi' };
    }
    const defaultIds = buildDefaultCarouselOrder();
    const allValid = new Set([...defaultIds, ...customIds]);
    const unique = new Set(order);
    if (unique.size !== order.length) {
        return { error: 'Sıra listesinde tekrar eden slayt var' };
    }
    if (order.length !== allValid.size) {
        return { error: 'Tüm slaytlar sıra listesinde olmalıdır' };
    }
    for (const id of order) {
        if (!allValid.has(id)) {
            return { error: 'Geçersiz slayt kimliği' };
        }
    }
    return { order };
}

// ---------- İndirilebilir araç dosyaları ----------
const TOOL_FILES = {
    headset: {
        default_filename: 'DCS-Kulaklik-Onarim.cmd',
        static_path: '/tools/DCS-Kulaklik-Onarim.cmd',
    },
    citrix: {
        default_filename: 'DCS-Citrix-Kurulum.cmd',
        static_path: '/tools/DCS-Citrix-Kurulum.cmd',
    },
};

const MAX_TOOL_BYTES = 8 * 1024 * 1024; // 8 MB

function sanitizeToolFilename(name, fallback) {
    const base = String(name || '').split(/[\\/]/).pop().trim();
    const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, '').replace(/\s+/g, ' ').slice(0, 100).trim();
    if (!cleaned || !/\.[A-Za-z0-9]{1,10}$/.test(cleaned)) return fallback;
    return cleaned;
}

function decodeToolBase64(value) {
    const raw = String(value || '').replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
    if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
    try {
        const buf = Buffer.from(raw, 'base64');
        return buf.length ? buf : null;
    } catch {
        return null;
    }
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

    if (typeof req.body === 'string') {
        try {
            req.body = JSON.parse(req.body);
        } catch {
            req.body = {};
        }
    } else if (!req.body || typeof req.body !== 'object') {
        req.body = {};
    }

    const route = parseRoute(req);
    const segments = route ? route.split('/').filter(Boolean) : [];
    const method = req.method;

    try {
        const db = await getDb();
        await ensureDefaultAdmin(db);

        if (method === 'GET' && route === '') {
            return sendJson(res, 200, { message: 'DCS IT IT Assets API' });
        }

        if (method === 'GET' && segments[0] === 'tools' && segments.length === 2) {
            const key = segments[1];
            const meta = TOOL_FILES[key];
            if (!meta) return sendError(res, 404, 'Araç bulunamadı');
            if (!requireRateLimit(req, res, 'tool-download', { max: 40, windowMs: 60_000 })) return;

            const doc = await db.collection('tool_files').findOne({ key });
            if (!doc || !doc.content_base64) {
                res.statusCode = 302;
                res.setHeader('Location', meta.static_path);
                res.setHeader('Cache-Control', 'no-store');
                res.end();
                return;
            }

            const buffer = Buffer.from(doc.content_base64, 'base64');
            const filename = (doc.filename || meta.default_filename).replace(/"/g, '');
            res.setHeader('Content-Type', doc.content_type || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'no-store');
            res.statusCode = 200;
            res.end(buffer);
            return;
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
            const permissions = resolveUserPermissions(user);
            return sendJson(res, 200, {
                access_token,
                token_type: 'bearer',
                role: user.role,
                permissions,
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

        if (method === 'GET' && route === 'admin/me') {
            const user = await requireAdminAccess(db, req, res);
            if (!user) return;
            return sendJson(res, 200, {
                username: user.username,
                role: user.role,
                permissions: resolveUserPermissions(user),
            });
        }

        if (method === 'GET' && route === 'admin/stats') {
            if (!(await requireModuleAccess(db, req, res, 'dashboard'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'assets'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'inventory'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'inventory'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'confirmations'))) return;
            const personnel_id = req.query.personnel_id;
            await db.collection('confirmations').updateMany(
                { personnel_id, status: 'confirmed' },
                { $set: { status: 'reset', reset_at: new Date().toISOString() } }
            );
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'GET' && route === 'admin/next-personnel-id') {
            if (!(await requireWriteAccess(db, req, res, 'assets'))) return;
            const pIds = await db.collection('inventory').distinct('personnel_id');
            const numericIds = pIds.map((pid) => parseInt(pid, 10)).filter((n) => !Number.isNaN(n));
            if (!numericIds.length) {
                return sendJson(res, 200, { next_id: '100001' });
            }
            return sendJson(res, 200, { next_id: String(Math.max(...numericIds) + 1) });
        }

        if (method === 'GET' && route === 'admin/personnel/search') {
            if (!(await requireWriteAccess(db, req, res, 'assets'))) return;
            const name = req.query.name || '';
            const personnel = await db.collection('inventory').findOne(
                { personnel_name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
                { projection: { personnel_id: 1, _id: 0 } }
            );
            return sendJson(res, 200, { personnel_id: personnel?.personnel_id ?? null });
        }

        if (method === 'GET' && route === 'admin/random-personnel-id') {
            if (!(await requireWriteAccess(db, req, res, 'assets'))) return;
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
            if (!(await requireModuleAccess(db, req, res, 'confirmations'))) return;
            const confirmations = await db.collection('confirmations')
                .find({}, { projection: { _id: 0 } })
                .toArray();
            return sendJson(res, 200, confirmations);
        }

        if (method === 'GET' && route === 'admin/inventory') {
            if (!(await requireModuleAccess(db, req, res, 'inventory'))) return;
            const inventory = await db.collection('inventory')
                .find({}, { projection: { _id: 0 } })
                .toArray();
            return sendJson(res, 200, inventory);
        }

        if (method === 'GET' && segments[0] === 'admin' && segments[1] === 'personnel' && segments.length === 3 && segments[2] !== 'search') {
            if (!(await requireModuleAccess(db, req, res, 'inventory'))) return;
            const profile = await buildPersonnelProfile(db, segments[2]);
            if (!profile) {
                return sendError(res, 404, 'Personel bulunamadı');
            }
            return sendJson(res, 200, profile);
        }

        if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'inventory' && segments.length === 3) {
            const reserved = ['bulk', 'import', 'return', 'reset-confirmation'];
            if (!reserved.includes(segments[2])) {
                if (!(await requireWriteAccess(db, req, res, 'inventory'))) return;
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
            if (!(await requireModuleAccess(db, req, res, 'assets'))) return;
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
            const direction = segments[2];
            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }
            const cargoModule = direction === 'incoming' ? 'incoming_cargo' : 'outgoing_cargo';
            if (!(await requireModuleAccess(db, req, res, cargoModule))) return;

            const allCargo = await db.collection('cargo')
                .find({}, { projection: { _id: 0 } })
                .toArray();

            const items = filterCargoByDirection(allCargo, direction)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return sendJson(res, 200, attachCargoMatches(items, direction, allCargo));
        }

        if (method === 'GET' && route === 'admin/cargo') {
            const direction = req.query.direction;
            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }
            const cargoModule = direction === 'incoming' ? 'incoming_cargo' : 'outgoing_cargo';
            if (!(await requireModuleAccess(db, req, res, cargoModule))) return;

            const allCargo = await db.collection('cargo')
                .find({}, { projection: { _id: 0 } })
                .toArray();

            const items = filterCargoByDirection(allCargo, direction)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return sendJson(res, 200, attachCargoMatches(items, direction, allCargo));
        }

        if (method === 'POST' && route === 'admin/cargo/sync-from-inventory') {
            const direction = req.body?.direction === 'incoming' ? 'incoming' : 'outgoing';
            const cargoModule = direction === 'incoming' ? 'incoming_cargo' : 'outgoing_cargo';
            if (!(await requireWriteAccess(db, req, res, cargoModule))) return;
            const result = await syncInventoryToCargo(db, direction);
            return sendJson(res, 200, { status: 'success', ...result });
        }

        if (method === 'POST' && route === 'admin/cargo/import') {
            const direction = req.body?.direction;
            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }
            const cargoModule = direction === 'incoming' ? 'incoming_cargo' : 'outgoing_cargo';
            if (!(await requireWriteAccess(db, req, res, cargoModule))) return;
            const rows = Array.isArray(req.body?.items) ? req.body.items : [];
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

        if (method === 'GET' && route === 'admin/tools') {
            if (!(await requireModuleAccess(db, req, res, 'tools'))) return;
            const docs = await db.collection('tool_files')
                .find({}, { projection: { _id: 0, content_base64: 0 } })
                .toArray();
            const byKey = {};
            docs.forEach((d) => { byKey[d.key] = d; });
            const tools = Object.entries(TOOL_FILES).map(([key, meta]) => {
                const d = byKey[key];
                return {
                    key,
                    default_filename: meta.default_filename,
                    filename: d?.filename || meta.default_filename,
                    content_type: d?.content_type || 'application/octet-stream',
                    size: d?.size ?? null,
                    overridden: Boolean(d),
                    updated_at: d?.updated_at || null,
                    updated_by: d?.updated_by || null,
                };
            });
            return sendJson(res, 200, tools);
        }

        if (method === 'POST' && segments[0] === 'admin' && segments[1] === 'tools' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res, 'tools'))) return;
            const key = segments[2];
            const meta = TOOL_FILES[key];
            if (!meta) return sendError(res, 404, 'Araç bulunamadı');

            const buffer = decodeToolBase64(req.body?.content_base64);
            if (!buffer) return sendError(res, 400, 'Geçersiz dosya içeriği');
            if (buffer.length > MAX_TOOL_BYTES) {
                return sendError(res, 400, `Dosya çok büyük (en fazla ${Math.round(MAX_TOOL_BYTES / (1024 * 1024))} MB)`);
            }

            const filename = sanitizeToolFilename(req.body?.filename, meta.default_filename);
            const content_type = coerceString(req.body?.content_type, 120) || 'application/octet-stream';
            const now = new Date().toISOString();
            const updated_by = getAuthUsername(req) || 'admin';

            await db.collection('tool_files').updateOne(
                { key },
                {
                    $set: {
                        key,
                        filename,
                        content_type,
                        content_base64: buffer.toString('base64'),
                        size: buffer.length,
                        updated_at: now,
                        updated_by,
                    },
                },
                { upsert: true }
            );

            return sendJson(res, 200, {
                status: 'success',
                tool: {
                    key,
                    default_filename: meta.default_filename,
                    filename,
                    content_type,
                    size: buffer.length,
                    overridden: true,
                    updated_at: now,
                    updated_by,
                },
            });
        }

        if (method === 'DELETE' && segments[0] === 'admin' && segments[1] === 'tools' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res, 'tools'))) return;
            const key = segments[2];
            if (!TOOL_FILES[key]) return sendError(res, 404, 'Araç bulunamadı');
            await db.collection('tool_files').deleteOne({ key });
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'GET' && route === 'admin/users') {
            if (!(await requireSystemAdmin(db, req, res))) return;
            const users = await db.collection('users')
                .find({}, { projection: { _id: 0, password_hash: 0 } })
                .toArray();
            return sendJson(res, 200, users.map((user) => ({
                ...user,
                permissions: resolveUserPermissions(user),
            })));
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
            const role = data.role || 'viewer';
            const permissions = role === 'system_admin'
                ? null
                : normalizePermissions(data.permissions, role);
            await db.collection('users').insertOne({
                id: randomUUID(),
                username,
                password_hash: hashPassword(password),
                role,
                permissions,
                created_at: new Date().toISOString(),
            });
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'users' && segments.length === 3) {
            if (!(await requireSystemAdmin(db, req, res))) return;
            const username = segments[2];
            const data = req.body || {};
            const user = await db.collection('users').findOne({ username });
            if (!user) {
                return sendError(res, 404, 'Kullanıcı bulunamadı');
            }
            if (username === 'admin' && data.role && data.role !== 'system_admin') {
                return sendError(res, 400, 'Ana sistem yöneticisinin rolü değiştirilemez');
            }
            const nextRole = ALLOWED_ROLES.includes(data.role) ? data.role : user.role;
            const update = {};
            if (data.role && ALLOWED_ROLES.includes(data.role)) {
                update.role = data.role;
            }
            if (nextRole === 'system_admin') {
                update.permissions = null;
            } else if (data.permissions) {
                update.permissions = normalizePermissions(data.permissions, nextRole);
            } else if (data.role) {
                update.permissions = normalizePermissions(user.permissions, nextRole);
            }
            const newPassword = coerceString(data.password, 128);
            if (newPassword) {
                if (!isStrongPassword(newPassword)) {
                    return sendError(res, 400, 'Yeni şifre en az 10 karakter olmalı');
                }
                update.password_hash = hashPassword(newPassword);
            }
            if (!Object.keys(update).length) {
                return sendError(res, 400, 'Güncellenecek alan bulunamadı');
            }
            await db.collection('users').updateOne({ username }, { $set: update });
            const updated = await db.collection('users').findOne(
                { username },
                { projection: { _id: 0, password_hash: 0 } }
            );
            return sendJson(res, 200, {
                status: 'success',
                user: {
                    ...updated,
                    permissions: resolveUserPermissions(updated),
                },
            });
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
            if (!(await requireModuleAccess(db, req, res, 'announcement'))) return;
            const announcement = await db.collection('announcements')
                .findOne({ active: true }, { projection: { _id: 0 } });
            return sendJson(res, 200, announcement);
        }

        if (method === 'POST' && route === 'admin/announcement/deactivate') {
            if (!(await requireWriteAccess(db, req, res, 'announcement'))) return;
            await db.collection('announcements').updateMany(
                { active: true },
                { $set: { active: false, deactivated_at: new Date().toISOString() } }
            );
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'POST' && route === 'admin/announcement') {
            if (!(await requireWriteAccess(db, req, res, 'announcement'))) return;
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
            if (!(await requireModuleAccess(db, req, res, 'video_tutorials'))) return;
            const videos = await db.collection('troubleshooting_videos')
                .find({}, { projection: { _id: 0 } })
                .sort({ created_at: -1 })
                .toArray();
            return sendJson(res, 200, videos.map(normalizeVideoDoc));
        }

        if (method === 'POST' && route === 'admin/troubleshooting-videos') {
            if (!(await requireWriteAccess(db, req, res, 'video_tutorials'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'video_tutorials'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'video_tutorials'))) return;
            const videoId = segments[2];
            const result = await db.collection('troubleshooting_videos').deleteOne({ id: videoId });
            if (result.deletedCount === 0) {
                return sendError(res, 404, 'Video bulunamadı');
            }
            return sendJson(res, 200, { status: 'success' });
        }

        if (method === 'GET' && route === 'carousel-slides') {
            const allCustom = await db.collection('carousel_slides')
                .find({}, { projection: { _id: 0 } })
                .toArray();
            const customSlides = allCustom
                .filter((slide) => slide.active !== false)
                .map(normalizeCarouselDoc)
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            const customIds = allCustom.map((slide) => slide.id);
            const config = await getCarouselConfig(db, customIds);
            return sendJson(res, 200, {
                order: config.order,
                slides: customSlides,
                default_duration_ms: config.default_duration_ms,
                slide_durations: config.slide_durations,
            });
        }

        if (method === 'GET' && route === 'admin/carousel-slides') {
            if (!(await requireModuleAccess(db, req, res, 'carousel'))) return;
            const slides = await db.collection('carousel_slides')
                .find({}, { projection: { _id: 0 } })
                .sort({ sort_order: 1, created_at: 1 })
                .toArray()
                .then((rows) => rows.map(normalizeCarouselDoc));
            const customIds = slides.map((slide) => slide.id);
            const config = await getCarouselConfig(db, customIds);
            return sendJson(res, 200, {
                slides,
                order: config.order,
                default_duration_ms: config.default_duration_ms,
                slide_durations: config.slide_durations,
            });
        }

        if (method === 'PUT' && route === 'admin/carousel-slides/settings') {
            if (!(await requireWriteAccess(db, req, res, 'carousel'))) return;
            const allCustom = await db.collection('carousel_slides')
                .find({}, { projection: { id: 1, _id: 0 } })
                .toArray();
            const customIds = allCustom.map((slide) => slide.id);
            const validated = validateCarouselSettings(req.body || {}, customIds);
            if (validated.error) {
                return sendError(res, 400, validated.error);
            }
            const config = await saveCarouselSettingsDoc(db, customIds, validated);
            return sendJson(res, 200, { status: 'success', ...config });
        }

        if (method === 'PUT' && route === 'admin/carousel-slides/reorder') {
            if (!(await requireWriteAccess(db, req, res, 'carousel'))) return;
            const allCustom = await db.collection('carousel_slides')
                .find({}, { projection: { id: 1, _id: 0 } })
                .toArray();
            const customIds = allCustom.map((slide) => slide.id);
            const validated = validateCarouselReorder(req.body?.order, customIds);
            if (validated.error) {
                return sendError(res, 400, validated.error);
            }
            await saveCarouselOrderDoc(db, validated.order);
            return sendJson(res, 200, { status: 'success', order: validated.order });
        }

        if (method === 'POST' && route === 'admin/carousel-slides') {
            if (!(await requireWriteAccess(db, req, res, 'carousel'))) return;
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
            const allCustom = await db.collection('carousel_slides')
                .find({}, { projection: { id: 1, _id: 0 } })
                .toArray();
            const customIds = allCustom.map((row) => row.id);
            const config = await getCarouselConfig(db, customIds);
            const order = [...config.order];
            if (!order.includes(slide.id)) {
                order.push(slide.id);
                await saveCarouselOrderDoc(db, order);
            }
            return sendJson(res, 200, {
                status: 'success',
                slide: normalizeCarouselDoc(slide),
                order,
                default_duration_ms: config.default_duration_ms,
                slide_durations: config.slide_durations,
            });
        }

        if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'carousel-slides' && segments.length === 3) {
            if (!(await requireWriteAccess(db, req, res, 'carousel'))) return;
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
            if (!(await requireWriteAccess(db, req, res, 'carousel'))) return;
            const slideId = segments[2];
            const result = await db.collection('carousel_slides').deleteOne({ id: slideId });
            if (result.deletedCount === 0) {
                return sendError(res, 404, 'Slayt bulunamadı');
            }
            const remaining = await db.collection('carousel_slides')
                .find({}, { projection: { id: 1, _id: 0 } })
                .toArray();
            const customIds = remaining.map((row) => row.id);
            const config = await getCarouselConfig(db, customIds);
            const order = config.order.filter((id) => id !== slideId);
            const slide_durations = { ...config.slide_durations };
            delete slide_durations[slideId];
            await saveCarouselOrderDoc(db, normalizeCarouselOrderIds(order, customIds));
            await saveCarouselSettingsDoc(db, customIds, { slide_durations });
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
