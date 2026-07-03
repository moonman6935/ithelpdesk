const { randomUUID } = require('crypto');
const { getDb, ensureDefaultAdmin } = require('./_lib/db');
const { hashPassword, verifyPassword, createAccessToken } = require('./_lib/auth');
const { enrichShipmentWithYurtici, getYurticiConfig } = require('./_lib/yurticiKargo');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'b4f2c8d9e1a3c5b7a9d0e2f4a6b8c0d2';
const ALLOWED_ROLES = ['admin', 'system_admin', 'viewer'];
const WRITE_ROLES = ['system_admin'];

function getAuthUsername(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        const payload = jwt.verify(auth.slice(7), SECRET_KEY);
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

function normalizeCargoKey(value) {
    return String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}

function findCargoMatch(outgoing, incomingList) {
    const serialKey = normalizeCargoKey(outgoing.serial_number);
    if (serialKey) {
        const bySerial = incomingList.find(
            (inc) => normalizeCargoKey(inc.serial_number) === serialKey
        );
        if (bySerial) return bySerial;
    }

    const nameKey = normalizeCargoKey(outgoing.personnel_name);
    const nameMatches = incomingList.filter(
        (inc) => normalizeCargoKey(inc.personnel_name) === nameKey
    );
    if (!nameMatches.length) return null;

    const byItem = nameMatches.find(
        (inc) => normalizeCargoKey(inc.item_name) === normalizeCargoKey(outgoing.item_name)
    );
    return byItem || nameMatches[0];
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

function getShipmentPublicStatus(outgoing, incomingMatch) {
    if (incomingMatch) return 'returned';
    if (outgoing.delivery_date || outgoing.recipient) return 'delivered';
    return 'in_transit';
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

function namesMatch(inputName, storedName) {
    const inputKey = normalizeCargoKey(inputName);
    const storedKey = normalizeCargoKey(storedName);
    if (!inputKey || !storedKey) return false;
    if (inputKey === storedKey) return true;

    const inputWords = inputKey.split(/\s+/).filter((w) => w.length >= 2);
    if (!inputWords.length) return false;
    return inputWords.every((word) => storedKey.includes(word));
}

async function verifyPersonnelIdentity(db, personnelId, personnelName) {
    if (!/^\d{6}$/.test(personnelId)) return null;

    const inv = await db.collection('inventory').findOne(
        { personnel_id: personnelId },
        { projection: { _id: 0, personnel_name: 1, personnel_id: 1 } }
    );
    if (!inv?.personnel_name) return null;
    if (!namesMatch(personnelName, inv.personnel_name)) return null;

    return {
        personnel_id: personnelId,
        personnel_name: String(inv.personnel_name).trim(),
    };
}

async function personnelNameExists(db, personnelName) {
    const trimmed = String(personnelName ?? '').trim();
    if (trimmed.length < 3) return false;

    const [invNames, cargoNames] = await Promise.all([
        db.collection('inventory').distinct('personnel_name'),
        db.collection('cargo').distinct('personnel_name'),
    ]);

    const allNames = [...new Set([...invNames, ...cargoNames].filter(Boolean))];
    return allNames.some((name) => namesMatch(trimmed, name));
}

async function buildCargoStatusResponse(db, person) {
    const allCargo = await db.collection('cargo').find({}, { projection: { _id: 0 } }).toArray();
    const incoming = allCargo.filter((c) => c.direction === 'incoming');
    const personnelId = person.personnel_id;

    const shipmentMap = new Map();
    allCargo
        .filter((c) => c.direction === 'outgoing')
        .filter(
            (c) =>
                c.personnel_id === personnelId ||
                namesMatch(person.personnel_name, c.personnel_name)
        )
        .forEach((item) => shipmentMap.set(item.id, item));

    const baseShipments = [...shipmentMap.values()]
        .map((out) => {
            const match = findCargoMatch(out, incoming);
            return {
                id: out.id,
                item_name: out.item_name,
                serial_number: out.serial_number,
                status: getShipmentPublicStatus(out, match),
                ship_date: out.ship_date || '',
                delivery_date: out.delivery_date || '',
                delivery_time: out.delivery_time || '',
                recipient: out.recipient || '',
                address: out.address || '',
                arrival_city: out.arrival_city || '',
                updated_at: out.imported_at || out.created_at,
            };
        })
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const yurticiConfig = getYurticiConfig();
    const shipments = yurticiConfig.enabled
        ? await Promise.all(baseShipments.map((s) => enrichShipmentWithYurtici(s)))
        : baseShipments;

    return {
        personnel_id: personnelId,
        personnel_name: person.personnel_name,
        live_tracking: yurticiConfig.enabled,
        shipments,
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
            const { username, password } = req.body || {};
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

        if (method === 'GET' && segments[0] === 'inventory' && segments.length === 2) {
            const personnelId = segments[1];
            const items = await db.collection('inventory')
                .find({ personnel_id: personnelId, status: 'assigned' }, { projection: { _id: 0 } })
                .toArray();

            const confirmation = await db.collection('confirmations')
                .find({ personnel_id: personnelId })
                .sort({ confirmed_at: -1 })
                .limit(1)
                .next();

            const is_confirmed = Boolean(confirmation && confirmation.status === 'confirmed');
            return sendJson(res, 200, { items, is_confirmed });
        }

        if (method === 'POST' && route === 'cargo/check-name') {
            const personnelName = String(req.body?.personnel_name ?? '').trim();
            if (personnelName.length < 3) {
                return sendError(res, 400, 'Geçerli ad soyad giriniz');
            }

            const found = await personnelNameExists(db, personnelName);
            return sendJson(res, 200, { found });
        }

        if (method === 'POST' && route === 'cargo/status') {
            const personnelName = String(req.body?.personnel_name ?? '').trim();
            const personnelId = String(req.body?.personnel_id ?? '').trim();

            if (personnelName.length < 3) {
                return sendError(res, 400, 'Geçerli ad soyad giriniz');
            }
            if (!/^\d{6}$/.test(personnelId)) {
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

            const result = await buildCargoStatusResponse(db, person);
            return sendJson(res, 200, { ...result, verified: true });
        }

        if (method === 'GET' && segments[0] === 'cargo' && segments[1] === 'status' && segments.length === 3) {
            const personnelId = segments[2];
            if (!/^\d{6}$/.test(personnelId)) {
                return sendError(res, 400, 'Geçerli 6 haneli personel numarası gerekli');
            }

            const person = await resolvePersonnelById(db, personnelId);
            if (!person) {
                return sendJson(res, 200, {
                    personnel_id: personnelId,
                    personnel_name: null,
                    shipments: [],
                });
            }

            const result = await buildCargoStatusResponse(db, person);
            return sendJson(res, 200, result);
        }

        if (method === 'POST' && route === 'inventory/confirm') {
            const confirmation = { ...(req.body || {}) };
            confirmation.confirmed_at = new Date().toISOString();
            confirmation.id = randomUUID();
            confirmation.status = 'confirmed';
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

        if (method === 'GET' && route === 'admin/cargo') {
            if (!(await requireAdminAccess(db, req, res))) return;
            const direction = req.query.direction;
            if (!['outgoing', 'incoming'].includes(direction)) {
                return sendError(res, 400, 'Geçersiz kargo yönü');
            }

            const allCargo = await db.collection('cargo')
                .find({}, { projection: { _id: 0 } })
                .toArray();

            const items = allCargo
                .filter((c) => c.direction === direction)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return sendJson(res, 200, attachCargoMatches(items, direction, allCargo));
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
            if (!ALLOWED_ROLES.includes(data.role)) {
                return sendError(res, 400, 'Geçersiz rol');
            }
            const existing = await db.collection('users').findOne({ username: data.username });
            if (existing) {
                return sendError(res, 400, 'Bu kullanıcı adı zaten mevcut');
            }
            await db.collection('users').insertOne({
                id: randomUUID(),
                username: data.username,
                password_hash: hashPassword(data.password),
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
            if (new_password.length < 6) {
                return sendError(res, 400, 'Yeni şifre en az 6 karakter olmalı');
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
        const detail = err.message || 'Sunucu hatası';
        return sendError(res, status, detail);
    }
};
