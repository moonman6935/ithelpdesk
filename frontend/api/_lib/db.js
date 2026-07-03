const { MongoClient } = require('mongodb');
const { randomUUID } = require('crypto');
const { hashPassword } = require('./auth');

let cachedClient = null;
let cachedDb = null;

function mongoErrorMessage(err) {
    const msg = err?.message || '';
    if (err?.code === 8000 || msg.includes('bad auth') || msg.includes('Authentication failed')) {
        const e = new Error('Veritabanı bağlantı hatası');
        e.statusCode = 503;
        return e;
    }
    if (err?.name === 'MongoServerSelectionError' || msg.includes('timed out') || msg.includes('ECONNREFUSED')) {
        const e = new Error('Veritabanı bağlantı hatası');
        e.statusCode = 503;
        return e;
    }
    return err;
}

async function getDb() {
    if (!process.env.MONGO_URL) {
        const error = new Error('Veritabanı yapılandırması eksik');
        error.statusCode = 503;
        throw error;
    }

    if (cachedDb) {
        return cachedDb;
    }

    try {
        if (!cachedClient) {
            cachedClient = new MongoClient(process.env.MONGO_URL, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
            });
            await cachedClient.connect();
        }
        cachedDb = cachedClient.db(process.env.DB_NAME || 'it_helpdesk');
        return cachedDb;
    } catch (err) {
        cachedClient = null;
        cachedDb = null;
        throw mongoErrorMessage(err);
    }
}

async function ensureDefaultAdmin(db) {
    const adminCount = await db.collection('users').countDocuments({ role: 'system_admin' });
    if (adminCount > 0) return;

    const username = String(process.env.BOOTSTRAP_ADMIN_USER ?? '').trim();
    const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD ?? '').trim();

    if (!username || !password || password.length < 10) {
        console.warn(
            'Sistem yöneticisi yok. İlk kurulum için BOOTSTRAP_ADMIN_USER ve BOOTSTRAP_ADMIN_PASSWORD tanımlayın.'
        );
        return;
    }

    await db.collection('users').insertOne({
        id: randomUUID(),
        username,
        password_hash: hashPassword(password),
        role: 'system_admin',
        created_at: new Date().toISOString(),
    });
}

module.exports = { getDb, ensureDefaultAdmin };
