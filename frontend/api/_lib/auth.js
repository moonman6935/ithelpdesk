const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'b4f2c8d9e1a3c5b7a9d0e2f4a6b8c0d2';

function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
}

function createAccessToken(username) {
    return jwt.sign({ sub: username }, SECRET_KEY, { expiresIn: '24h' });
}

module.exports = { hashPassword, verifyPassword, createAccessToken };
