import { translations } from '../translations/translations';
import { DEFAULT_SLIDE_META, getDefaultSlideIndex } from './carouselOrder';
import { EMPTY_CAROUSEL_FORM, normalizeCarouselSlide } from './carouselSlideContent';

const LANGS = ['tr', 'de', 'en', 'fr', 'ka'];

export function buildDefaultSlideForm(slideId, override) {
  const index = getDefaultSlideIndex(slideId);
  if (index < 0) return { ...EMPTY_CAROUSEL_FORM };

  const titles = { tr: '', de: '', en: '', fr: '', ka: '' };
  const messages = { tr: '', de: '', en: '', fr: '', ka: '' };
  const cta_labels = { tr: '', de: '', en: '', fr: '', ka: '' };
  let cta_link = '';

  for (const lang of LANGS) {
    const slide = translations[lang]?.home?.carouselSlides?.[index];
    if (slide) {
      titles[lang] = slide.title || '';
      messages[lang] = slide.message || '';
      if (slide.ctaLabel) cta_labels[lang] = slide.ctaLabel;
      if (slide.ctaLink) cta_link = slide.ctaLink;
    }
  }

  const preset = DEFAULT_SLIDE_META[index] || DEFAULT_SLIDE_META[0];
  let template = preset.template;
  let icon = preset.icon;

  if (override) {
    const normalized = normalizeCarouselSlide(override);
    for (const lang of LANGS) {
      if (normalized.titles[lang]) titles[lang] = normalized.titles[lang];
      if (normalized.messages[lang]) messages[lang] = normalized.messages[lang];
      if (normalized.cta_labels[lang]) cta_labels[lang] = normalized.cta_labels[lang];
    }
    if (normalized.cta_link) cta_link = normalized.cta_link;
    if (override.template) template = override.template;
    if (override.icon) icon = override.icon;
  }

  return {
    title_tr: titles.tr,
    title_de: titles.de,
    title_en: titles.en,
    title_fr: titles.fr,
    title_ka: titles.ka,
    message_tr: messages.tr,
    message_de: messages.de,
    message_en: messages.en,
    message_fr: messages.fr,
    message_ka: messages.ka,
    cta_link,
    cta_label_tr: cta_labels.tr,
    cta_label_de: cta_labels.de,
    cta_label_en: cta_labels.en,
    cta_label_fr: cta_labels.fr,
    cta_label_ka: cta_labels.ka,
    template,
    icon,
    active: true,
  };
}
