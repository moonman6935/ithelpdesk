const LANGS = ['tr', 'de', 'en'];

function parseLangField(data, field) {
  const nested = data[field];
  if (nested && typeof nested === 'object') {
    return {
      tr: String(nested.tr ?? '').trim(),
      de: String(nested.de ?? '').trim(),
      en: String(nested.en ?? '').trim(),
    };
  }
  return {
    tr: String(data[`${field}_tr`] ?? '').trim(),
    de: String(data[`${field}_de`] ?? '').trim(),
    en: String(data[`${field}_en`] ?? '').trim(),
  };
}

function fillMissingLangs(obj) {
  const fallback = obj.tr || obj.de || obj.en || '';
  return {
    tr: obj.tr || fallback,
    de: obj.de || fallback,
    en: obj.en || fallback,
  };
}

export function parseCarouselTitles(data) {
  const raw = parseLangField(data, 'titles');
  if (!raw.tr && !raw.de && !raw.en) return null;
  return fillMissingLangs(raw);
}

export function parseCarouselMessages(data) {
  const raw = parseLangField(data, 'messages');
  if (!raw.tr && !raw.de && !raw.en) return null;
  return fillMissingLangs(raw);
}

export function parseCarouselCtaLabels(data) {
  const raw = parseLangField(data, 'cta_labels');
  if (!raw.tr && !raw.de && !raw.en) return { tr: '', de: '', en: '' };
  return fillMissingLangs(raw);
}

export function normalizeCarouselSlide(slide) {
  if (!slide) return slide;
  const titles = slide.titles
    ? fillMissingLangs(slide.titles)
    : { tr: String(slide.title || '').trim(), de: '', en: '' };
  const messages = slide.messages
    ? fillMissingLangs(slide.messages)
    : { tr: String(slide.message || '').trim(), de: '', en: '' };
  const cta_labels = slide.cta_labels
    ? fillMissingLangs(slide.cta_labels)
    : { tr: String(slide.cta_label || '').trim(), de: '', en: '' };

  return {
    ...slide,
    titles: fillMissingLangs(titles),
    messages: fillMissingLangs(messages),
    cta_labels,
  };
}

export function getCarouselText(fields, language = 'tr') {
  const lang = LANGS.includes(language) ? language : 'tr';
  return fields[lang] || fields.tr || fields.de || fields.en || '';
}

export function slideToDisplay(slide, language = 'tr') {
  const normalized = normalizeCarouselSlide(slide);
  return {
    title: getCarouselText(normalized.titles, language),
    message: getCarouselText(normalized.messages, language),
    ctaLink: normalized.cta_link || '',
    ctaLabel: getCarouselText(normalized.cta_labels, language),
    template: normalized.template || 'red',
    icon: normalized.icon || 'sparkles',
    id: normalized.id,
    custom: true,
  };
}

export const EMPTY_CAROUSEL_FORM = {
  title_tr: '',
  title_de: '',
  title_en: '',
  message_tr: '',
  message_de: '',
  message_en: '',
  cta_link: '',
  cta_label_tr: '',
  cta_label_de: '',
  cta_label_en: '',
  template: 'red',
  icon: 'sparkles',
  active: true,
};

export function slideToForm(slide) {
  const normalized = normalizeCarouselSlide(slide);
  return {
    title_tr: normalized.titles.tr,
    title_de: normalized.titles.de,
    title_en: normalized.titles.en,
    message_tr: normalized.messages.tr,
    message_de: normalized.messages.de,
    message_en: normalized.messages.en,
    cta_link: normalized.cta_link || '',
    cta_label_tr: normalized.cta_labels.tr,
    cta_label_de: normalized.cta_labels.de,
    cta_label_en: normalized.cta_labels.en,
    template: normalized.template || 'red',
    icon: normalized.icon || 'sparkles',
    active: normalized.active !== false,
  };
}

export function formToPayload(form) {
  return {
    titles: {
      tr: String(form.title_tr || '').trim(),
      de: String(form.title_de || '').trim(),
      en: String(form.title_en || '').trim(),
    },
    messages: {
      tr: String(form.message_tr || '').trim(),
      de: String(form.message_de || '').trim(),
      en: String(form.message_en || '').trim(),
    },
    cta_link: String(form.cta_link || '').trim(),
    cta_labels: {
      tr: String(form.cta_label_tr || '').trim(),
      de: String(form.cta_label_de || '').trim(),
      en: String(form.cta_label_en || '').trim(),
    },
    template: form.template || 'red',
    icon: form.icon || 'sparkles',
    active: form.active !== false,
  };
}

export function hasAnyCarouselTitle(titles) {
  return Boolean(titles?.tr || titles?.de || titles?.en);
}

export function hasAnyCarouselMessage(messages) {
  return Boolean(messages?.tr || messages?.de || messages?.en);
}
