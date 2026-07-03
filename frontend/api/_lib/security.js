const rateBuckets = new Map();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.length) return realIp;
    return 'unknown';
}

function checkRateLimit(req, action, { max = 30, windowMs = 60_000 } = {}) {
    const ip = getClientIp(req);
    const key = `${action}:${ip}`;
    const now = Date.now();

    let bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
    }

    bucket.count += 1;
    rateBuckets.set(key, bucket);

    if (rateBuckets.size > 5000) {
        for (const [k, v] of rateBuckets) {
            if (now > v.resetAt) rateBuckets.delete(k);
        }
    }

    return bucket.count <= max;
}

function applySecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'no-store');
}

function safeErrorDetail(err, fallback = 'Sunucu hatası') {
    const status = err?.statusCode || 500;
    if (status < 500) {
        return err?.message || fallback;
    }
    if (status === 503) {
        if (String(err?.message || '').includes('SECRET_KEY')) {
            return 'Servis yapılandırması eksik';
        }
        return 'Servis geçici olarak kullanılamıyor';
    }
    return fallback;
}

function requireRateLimit(req, res, action, options) {
    if (checkRateLimit(req, action, options)) return true;
    sendRateLimitError(res);
    return false;
}

function sendRateLimitError(res) {
    res.status(429).json({ detail: 'Çok fazla istek. Lütfen bir süre sonra tekrar deneyin.' });
}

function coerceString(value, maxLen = 200) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return '';
    return String(value).trim().slice(0, maxLen);
}

function isValidPersonnelId(value) {
    return /^\d{6}$/.test(String(value ?? '').trim());
}

module.exports = {
    getClientIp,
    checkRateLimit,
    applySecurityHeaders,
    safeErrorDetail,
    requireRateLimit,
    sendRateLimitError,
    coerceString,
    isValidPersonnelId,
};
