const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function getSecretKey() {
    const key = process.env.SECRET_KEY;
    if (!key || String(key).length < 32) {
        const error = new Error('SECRET_KEY yapılandırması eksik veya çok kısa (min 32 karakter)');
        error.statusCode = 503;
        throw error;
    }
    return key;
}

function hashPassword(password) {
    return bcrypt.hashSync(password, 12);
}

function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
}

function createAccessToken(username) {
    return jwt.sign({ sub: username }, getSecretKey(), { expiresIn: '8h' });
}

function verifyAccessToken(token) {
    return jwt.verify(token, getSecretKey());
}

function isStrongPassword(password) {
    const value = String(password ?? '');
    return value.length >= 10;
}

module.exports = {
    getSecretKey,
    hashPassword,
    verifyPassword,
    createAccessToken,
    verifyAccessToken,
    isStrongPassword,
};
