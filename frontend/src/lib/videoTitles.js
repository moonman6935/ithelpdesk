const LANGS = ['tr', 'de', 'en', 'ka'];

export function normalizeVideoTitles(video) {
  if (!video) return { tr: '', de: '', en: '', ka: '' };
  if (video.titles && typeof video.titles === 'object') {
    const legacy = String(video.title || '').trim();
    return {
      tr: String(video.titles.tr || legacy).trim(),
      de: String(video.titles.de || legacy).trim(),
      en: String(video.titles.en || legacy).trim(),
      ka: String(video.titles.ka || legacy).trim(),
    };
  }
  const legacy = String(video.title || '').trim();
  return { tr: legacy, de: legacy, en: legacy, ka: legacy };
}

export function getVideoTitle(video, language = 'tr') {
  const titles = normalizeVideoTitles(video);
  const lang = LANGS.includes(language) ? language : 'tr';
  return titles[lang] || titles.tr || titles.de || titles.en || titles.ka || '';
}

export const EMPTY_VIDEO_FORM = {
  title_tr: '',
  title_de: '',
  title_en: '',
  title_ka: '',
  video_url: '',
};

export function videoToForm(video) {
  const titles = normalizeVideoTitles(video);
  return {
    title_tr: titles.tr,
    title_de: titles.de,
    title_en: titles.en,
    title_ka: titles.ka,
    video_url: video.video_url || '',
  };
}

export function formToTitles(form) {
  return {
    tr: String(form.title_tr || '').trim(),
    de: String(form.title_de || '').trim(),
    en: String(form.title_en || '').trim(),
    ka: String(form.title_ka || '').trim(),
  };
}

export function hasAnyTitle(titles) {
  return Boolean(titles.tr || titles.de || titles.en || titles.ka);
}

export { LANGS };
