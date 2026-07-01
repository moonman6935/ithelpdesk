const { MongoClient } = require('mongodb');
const { randomUUID } = require('crypto');
const { hashPassword } = require('./auth');

let cachedClient = null;
let cachedDb = null;

function mongoErrorMessage(err) {
    const msg = err?.message || '';
    if (err?.code === 8000 || msg.includes('bad auth') || msg.includes('Authentication failed')) {
        const e = new Error('MongoDB sifre veya kullanici adi hatali. Vercel MONGO_URL icindeki sifreyi kontrol edin.');
        e.statusCode = 503;
        return e;
    }
    if (err?.name === 'MongoServerSelectionError' || msg.includes('timed out') || msg.includes('ECONNREFUSED')) {
        const e = new Error('MongoDB baglantisi kurulamadi. Atlas → Network Access → 0.0.0.0/0 ekleyin.');
        e.statusCode = 503;
        return e;
    }
    return err;
}

async function getDb() {
    if (!process.env.MONGO_URL) {
        const error = new Error('MONGO_URL ortam degiskeni tanimli degil. Vercel ayarlarindan MongoDB Atlas baglanti dizesini ekleyin.');
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
    if (adminCount === 0) {
        await db.collection('users').insertOne({
            id: randomUUID(),
            username: 'admin',
            password_hash: hashPassword('admin123'),
            role: 'system_admin',
            created_at: new Date().toISOString(),
        });
    }
}

module.exports = { getDb, ensureDefaultAdmin };
