function isAllowedVideoUrl(url) {
    const trimmed = String(url ?? '').trim();
    if (!trimmed || trimmed.length > 500) return false;

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return false;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const host = parsed.hostname.toLowerCase();
    const allowedHosts = [
        'www.youtube.com',
        'youtube.com',
        'youtu.be',
        'm.youtube.com',
        'player.vimeo.com',
        'vimeo.com',
    ];

    if (allowedHosts.includes(host)) return true;

    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) {
        return parsed.protocol === 'https:';
    }

    return false;
}

module.exports = { isAllowedVideoUrl };
