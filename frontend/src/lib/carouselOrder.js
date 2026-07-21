import { buildSlideMeta } from './carouselThemes';
import { slideToDisplay } from './carouselSlideContent';

export const DEFAULT_CAROUSEL_COUNT = 13;

export const DEFAULT_SLIDE_META = [
  { template: 'red', icon: 'sparkles' },
  { template: 'indigo', icon: 'download' },
  { template: 'blue', icon: 'laptop' },
  { template: 'slate', icon: 'laptop' },
  { template: 'blue', icon: 'monitor' },
  { template: 'emerald', icon: 'refresh' },
  { template: 'violet', icon: 'message' },
  { template: 'amber', icon: 'package' },
  { template: 'slate', icon: 'shield' },
  { template: 'cyan', icon: 'laptop' },
  { template: 'teal', icon: 'cable' },
  { template: 'amber', icon: 'truck' },
  { template: 'rose', icon: 'clipboard' },
];

export function defaultSlideId(index) {
  return `default-${index}`;
}

export function buildDefaultCarouselOrder(count = DEFAULT_CAROUSEL_COUNT) {
  return Array.from({ length: count }, (_, i) => defaultSlideId(i));
}

export function isDefaultSlideId(id) {
  return /^default-\d+$/.test(String(id || ''));
}

export function getDefaultSlideIndex(id) {
  if (!isDefaultSlideId(id)) return -1;
  return parseInt(String(id).split('-')[1], 10);
}

export function normalizeCarouselOrder(order, customIds, defaultCount = DEFAULT_CAROUSEL_COUNT) {
  const defaultOrder = buildDefaultCarouselOrder(defaultCount);
  const allIds = new Set([...defaultOrder, ...customIds]);
  const seen = new Set();
  const normalized = [];

  (Array.isArray(order) ? order : []).forEach((id) => {
    if (allIds.has(id) && !seen.has(id)) {
      normalized.push(id);
      seen.add(id);
    }
  });

  defaultOrder.forEach((id) => {
    if (!seen.has(id)) {
      normalized.push(id);
      seen.add(id);
    }
  });

  customIds.forEach((id) => {
    if (!seen.has(id)) {
      normalized.push(id);
      seen.add(id);
    }
  });

  return normalized;
}

export function resolveOrderedCarouselSlides({
  order,
  defaultSlides,
  customSlides,
  language,
  activeOnly = false,
}) {
  const customList = activeOnly
    ? customSlides.filter((slide) => slide.active !== false)
    : customSlides;
  const customIds = customList.map((slide) => slide.id);
  const activeIdSet = new Set(customIds);
  const normalizedOrder = normalizeCarouselOrder(order, customSlides.map((s) => s.id), defaultSlides.length);
  const publicOrder = activeOnly
    ? normalizedOrder.filter((id) => isDefaultSlideId(id) || activeIdSet.has(id))
    : normalizedOrder;

  const customMap = new Map(customList.map((slide) => [slide.id, slide]));

  return publicOrder
    .map((slideId) => {
      if (isDefaultSlideId(slideId)) {
        const defIndex = getDefaultSlideIndex(slideId);
        const slide = defaultSlides[defIndex];
        if (!slide) return null;
        const preset = DEFAULT_SLIDE_META[defIndex] || DEFAULT_SLIDE_META[0];
        return {
          ...slide,
          slideId,
          defIndex,
          isDefault: true,
          isWelcomeSlide: defIndex === 0,
          meta: buildSlideMeta(preset.template, preset.icon),
        };
      }

      const custom = customMap.get(slideId);
      if (!custom) return null;
      const display = slideToDisplay(custom, language);
      return {
        ...display,
        slideId,
        isDefault: false,
        isWelcomeSlide: false,
        meta: buildSlideMeta(display.template, display.icon),
      };
    })
    .filter(Boolean);
}

export function getSlideLabelFromId(slideId, { defaultSlides, customSlides, language }) {
  if (isDefaultSlideId(slideId)) {
    const index = getDefaultSlideIndex(slideId);
    const slide = defaultSlides[index];
    return slide?.title || slideId;
  }
  const custom = customSlides.find((s) => s.id === slideId);
  if (!custom) return slideId;
  const display = slideToDisplay(custom, language);
  return display.title || slideId;
}

export const DEFAULT_CAROUSEL_DURATION_MS = 7000;
export const MIN_CAROUSEL_DURATION_MS = 3000;
export const MAX_CAROUSEL_DURATION_MS = 60000;

export function clampCarouselDuration(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value)) return DEFAULT_CAROUSEL_DURATION_MS;
  return Math.min(MAX_CAROUSEL_DURATION_MS, Math.max(MIN_CAROUSEL_DURATION_MS, Math.round(value)));
}

export function getSlideDurationMs(slideId, timing) {
  const custom = timing?.slide_durations?.[slideId];
  if (custom != null) return clampCarouselDuration(custom);
  return clampCarouselDuration(timing?.default_duration_ms ?? DEFAULT_CAROUSEL_DURATION_MS);
}

export function durationMsToSeconds(ms) {
  return Math.round(clampCarouselDuration(ms) / 1000);
}

export function durationSecondsToMs(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return DEFAULT_CAROUSEL_DURATION_MS;
  return clampCarouselDuration(value * 1000);
}
