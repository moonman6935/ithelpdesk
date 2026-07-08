export function getVideoEmbedInfo(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return null;

  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:') {
        return { type: 'direct', embedUrl: trimmed };
      }
    } catch {
      return null;
    }
  }

  return { type: 'link', embedUrl: trimmed };
}

export function getVideoThumbnail(url) {
  const trimmed = String(url || '').trim();
  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  }
  return null;
}

export function getVideoEmbedUrl(url, { autoplay = false } = {}) {
  const info = getVideoEmbedInfo(url);
  if (!info) return null;
  if (info.type === 'direct' || info.type === 'link') return info.embedUrl;
  if (autoplay) {
    const sep = info.embedUrl.includes('?') ? '&' : '?';
    return `${info.embedUrl}${sep}autoplay=1`;
  }
  return info.embedUrl;
}
