const { randomUUID } = require('crypto');
const { getDb, ensureDefaultAdmin } = require('./_lib/db');
const { hashPassword, verifyPassword, createAccessToken } = require('./_lib/auth');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'b4f2c8d9e1a3c5b7a9d0e2f4a6b8c0d2';
const ALLOWED_ROLES = ['admin', 'system_admin', 'viewer'];
const WRITE_ROLES = ['admin', 'system_admin'];

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
                created_at: now,
                status: 'assigned',
                return_note: null,
                returned_at: null,
            }));

            const pId = inputs[0]?.personnel_id;
            if (itemsToInsert.length) {
                await db.collection('inventory').insertMany(itemsToInsert);
                if (pId) {
                    await db.collection('confirmations').updateMany(
                        { personnel_id: pId, status: 'confirmed' },
                        { $set: { status: 'reset', reset_at: new Date().toISOString() } }
                    );
                }
            }
            return sendJson(res, 200, { status: 'success', count: itemsToInsert.length });
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
            const { username, current_password, new_password } = req.body || {};
            if (!username || !current_password || !new_password) {
                return sendError(res, 400, 'Kullanıcı adı, mevcut şifre ve yeni şifre gerekli');
            }
            if (new_password.length < 6) {
                return sendError(res, 400, 'Yeni şifre en az 6 karakter olmalı');
            }
            const user = await db.collection('users').findOne({ username });
            if (!user || !verifyPassword(current_password, user.password_hash)) {
                return sendError(res, 401, 'Mevcut şifre hatalı');
            }
            await db.collection('users').updateOne(
                { username },
                { $set: { password_hash: hashPassword(new_password) } }
            );
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
