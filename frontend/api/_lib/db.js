const { MongoClient } = require('mongodb');
const { randomUUID } = require('crypto');
const { hashPassword } = require('./auth');

let cachedDb = null;

async function getDb() {
    if (!process.env.MONGO_URL) {
        const error = new Error('MONGO_URL ortam degiskeni tanimli degil. Vercel ayarlarindan MongoDB Atlas baglanti dizesini ekleyin.');
        error.statusCode = 503;
        throw error;
    }

    if (cachedDb) {
        return cachedDb;
    }

    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    cachedDb = client.db(process.env.DB_NAME || 'it_helpdesk');
    return cachedDb;
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
