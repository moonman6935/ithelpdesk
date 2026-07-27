import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Images, Plus, Trash2, Pencil, Save, X, Eye, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import api from '../lib/api';
import { buildDefaultSlideForm } from '../lib/carouselDefaultForm';
import {
  CAROUSEL_TEMPLATES,
  CAROUSEL_ICON_MAP,
  CAROUSEL_ICONS,
  buildSlideMeta,
} from '../lib/carouselThemes';
import {
  EMPTY_CAROUSEL_FORM,
  formToPayload,
  getCarouselText,
  hasAnyCarouselMessage,
  hasAnyCarouselTitle,
  normalizeCarouselSlide,
  slideToForm,
} from '../lib/carouselSlideContent';
import {
  buildDefaultCarouselOrder,
  getSlideLabelFromId,
  isDefaultSlideId,
  getDefaultSlideIndex,
  DEFAULT_SLIDE_META,
  DEFAULT_CAROUSEL_DURATION_MS,
  MIN_CAROUSEL_DURATION_MS,
  MAX_CAROUSEL_DURATION_MS,
  durationMsToSeconds,
  durationSecondsToMs,
  getSlideDurationMs,
} from '../lib/carouselOrder';

const LANG_FIELDS = [
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇹🇷', suffix: 'tr' },
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇩🇪', suffix: 'de' },
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇺🇸', suffix: 'en' },
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇫🇷', suffix: 'fr' },
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇬🇪', suffix: 'ka' },
];

function SlidePreview({ form, language, t }) {
  const meta = buildSlideMeta(form.template, form.icon);
  const { Icon, gradient, blob } = meta;
  const title = form[`title_${language}`] || form.title_tr || t('admin.carousel.previewTitle');
  const message = form[`message_${language}`] || form.message_tr || t('admin.carousel.previewMessage');

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} text-white shadow-lg border`}>
      <div className="absolute inset-0 pointer-events-none decorative-blur opacity-30">
        <div className={`absolute -top-6 -right-6 w-32 h-32 rounded-full ${blob} blur-2xl`} />
      </div>
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-5 min-h-[180px]">
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          <p className="text-sm text-white/90 line-clamp-3">{message}</p>
        </div>
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/30">
            <Icon className="w-10 h-10 text-white" strokeWidth={1.25} />
          </div>
        </div>
      </div>
    </div>
  );
}

const CarouselSlidesAdmin = () => {
  const { t, language } = useLanguage();
  const [slides, setSlides] = useState([]);
  const [order, setOrder] = useState([]);
  const [defaultOverrides, setDefaultOverrides] = useState({});
  const [form, setForm] = useState(EMPTY_CAROUSEL_FORM);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_CAROUSEL_FORM);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [defaultDurationMs, setDefaultDurationMs] = useState(7000);
  const [slideDurations, setSlideDurations] = useState({});
  const [savingDuration, setSavingDuration] = useState(false);

  const defaultSlides =
    translations[language]?.home?.carouselSlides || translations.tr.home.carouselSlides;

  const fetchSlides = async () => {
    try {
      const res = await api.get('/api/admin/carousel-slides');
      const data = res.data;
      if (Array.isArray(data)) {
        setSlides(data);
        setOrder(buildDefaultCarouselOrder(defaultSlides.length));
        setDefaultOverrides({});
        setDefaultDurationMs(DEFAULT_CAROUSEL_DURATION_MS);
        setSlideDurations({});
        return;
      }
      setSlides(data.slides || []);
      setOrder(data.order || buildDefaultCarouselOrder(defaultSlides.length));
      setDefaultOverrides(data.default_overrides || {});
      setDefaultDurationMs(data.default_duration_ms ?? DEFAULT_CAROUSEL_DURATION_MS);
      setSlideDurations(data.slide_durations || {});
    } catch {
      console.error('Slaytlar yüklenemedi');
    }
  };

  useEffect(() => {
    fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const persistOrder = async (nextOrder) => {
    setReordering(true);
    try {
      await api.put('/api/admin/carousel-slides/reorder', { order: nextOrder });
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.reorderError'));
      fetchSlides();
    } finally {
      setReordering(false);
    }
  };

  const moveSlide = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    const nextOrder = [...order];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setOrder(nextOrder);
    await persistOrder(nextOrder);
  };

  const getSlideTitle = (slideId) => {
    if (isDefaultSlideId(slideId) && defaultOverrides[slideId]) {
      const normalized = normalizeCarouselSlide(defaultOverrides[slideId]);
      const overrideTitle = getCarouselText(normalized.titles, language);
      if (overrideTitle) return overrideTitle;
    }
    return getSlideLabelFromId(slideId, { defaultSlides, customSlides: slides, language });
  };

  const getSlidePreset = (slideId, customSlide, defIndex) => {
    const override = isDefaultSlideId(slideId) ? defaultOverrides[slideId] : null;
    if (customSlide) {
      return buildSlideMeta(customSlide.template, customSlide.icon);
    }
    if (override) {
      return buildSlideMeta(
        override.template || DEFAULT_SLIDE_META[defIndex]?.template || 'red',
        override.icon || DEFAULT_SLIDE_META[defIndex]?.icon || 'sparkles'
      );
    }
    if (defIndex >= 0) {
      return buildSlideMeta(
        DEFAULT_SLIDE_META[defIndex]?.template || 'red',
        DEFAULT_SLIDE_META[defIndex]?.icon || 'sparkles'
      );
    }
    return buildSlideMeta('red', 'sparkles');
  };

  const getDurationSecondsForSlide = (slideId) =>
    durationMsToSeconds(getSlideDurationMs(slideId, {
      default_duration_ms: defaultDurationMs,
      slide_durations: slideDurations,
    }));

  const persistSettings = async (payload) => {
    setSavingDuration(true);
    try {
      const res = await api.put('/api/admin/carousel-slides/settings', payload);
      if (res.data?.default_duration_ms != null) {
        setDefaultDurationMs(res.data.default_duration_ms);
      }
      if (res.data?.default_overrides) {
        setDefaultOverrides(res.data.default_overrides);
      }
      if (res.data?.slide_durations) {
        setSlideDurations(res.data.slide_durations);
      }
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.durationError'));
      fetchSlides();
    } finally {
      setSavingDuration(false);
    }
  };

  const handleDefaultDurationBlur = async (seconds) => {
    const ms = durationSecondsToMs(seconds);
    if (ms === defaultDurationMs) return;
    setDefaultDurationMs(ms);
    await persistSettings({ default_duration_ms: ms });
  };

  const handleSlideDurationBlur = async (slideId, seconds) => {
    const ms = durationSecondsToMs(seconds);
    const currentMs = getSlideDurationMs(slideId, {
      default_duration_ms: defaultDurationMs,
      slide_durations: slideDurations,
    });
    if (ms === currentMs) return;
    const nextDurations = { ...slideDurations, [slideId]: ms };
    setSlideDurations(nextDurations);
    await persistSettings({ slide_durations: { [slideId]: ms } });
  };

  const minDurationSec = Math.round(MIN_CAROUSEL_DURATION_MS / 1000);
  const maxDurationSec = Math.round(MAX_CAROUSEL_DURATION_MS / 1000);

  const validateForm = (data) => {
    const payload = formToPayload(data);
    if (!hasAnyCarouselTitle(payload.titles) || !hasAnyCarouselMessage(payload.messages)) {
      alert(t('admin.carousel.required'));
      return null;
    }
    if (payload.cta_link && !payload.cta_link.startsWith('/')) {
      alert(t('admin.carousel.ctaLinkInvalid'));
      return null;
    }
    if (payload.cta_link && !payload.cta_labels.tr && !payload.cta_labels.de && !payload.cta_labels.en && !payload.cta_labels.fr && !payload.cta_labels.ka) {
      alert(t('admin.carousel.ctaLabelRequired'));
      return null;
    }
    return payload;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const payload = validateForm(form);
    if (!payload) return;

    setSaving(true);
    try {
      await api.post('/api/admin/carousel-slides', payload);
      setForm(EMPTY_CAROUSEL_FORM);
      alert(t('admin.carousel.added'));
      fetchSlides();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.error'));
    } finally {
      setSaving(false);
    }
  };

  const startEditSlide = (slideId) => {
    setEditingSlideId(slideId);
    if (isDefaultSlideId(slideId)) {
      setEditForm(buildDefaultSlideForm(slideId, defaultOverrides[slideId]));
    } else {
      const slide = slides.find((s) => s.id === slideId);
      if (slide) setEditForm(slideToForm(slide));
    }
  };

  const cancelEdit = () => {
    setEditingSlideId(null);
    setEditForm(EMPTY_CAROUSEL_FORM);
  };

  const handleSaveEdit = async () => {
    if (!editingSlideId) return;
    const payload = validateForm(editForm);
    if (!payload) return;

    setSaving(true);
    try {
      if (isDefaultSlideId(editingSlideId)) {
        await api.put('/api/admin/carousel-slides/settings', {
          default_overrides: { [editingSlideId]: payload },
        });
      } else {
        await api.put(`/api/admin/carousel-slides/${editingSlideId}`, payload);
      }
      cancelEdit();
      alert(t('admin.carousel.updated'));
      fetchSlides();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSlide = async (slideId) => {
    const isDefault = isDefaultSlideId(slideId);
    const confirmMsg = isDefault
      ? t('admin.carousel.removeBuiltInConfirm')
      : t('admin.carousel.deleteConfirm');
    if (!window.confirm(confirmMsg)) return;

    setSaving(true);
    try {
      if (!isDefault) {
        await api.delete(`/api/admin/carousel-slides/${slideId}`);
      }
      const nextOrder = order.filter((id) => id !== slideId);
      setOrder(nextOrder);
      await api.put('/api/admin/carousel-slides/reorder', { order: nextOrder });
      if (isDefault) {
        await api.put('/api/admin/carousel-slides/settings', {
          default_overrides: { [slideId]: null },
        });
      }
      if (editingSlideId === slideId) cancelEdit();
      fetchSlides();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.error'));
      fetchSlides();
    } finally {
      setSaving(false);
    }
  };

  const renderLangFields = (data, setData) => (
    <div className="space-y-4">
      {LANG_FIELDS.map(({ flag, suffix }) => (
        <div key={suffix} className="rounded-xl border bg-gray-50/80 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">{flag}</p>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.carousel.heading')}</label>
            <Input
              value={data[`title_${suffix}`]}
              onChange={(e) => setData({ ...data, [`title_${suffix}`]: e.target.value })}
              placeholder={t('admin.carousel.headingPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.carousel.message')}</label>
            <Textarea
              value={data[`message_${suffix}`]}
              onChange={(e) => setData({ ...data, [`message_${suffix}`]: e.target.value })}
              placeholder={t('admin.carousel.messagePlaceholder')}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.carousel.ctaLabel')}</label>
            <Input
              value={data[`cta_label_${suffix}`]}
              onChange={(e) => setData({ ...data, [`cta_label_${suffix}`]: e.target.value })}
              placeholder={t('admin.carousel.ctaLabelPlaceholder')}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTemplatePicker = (data, setData) => (
    <div>
      <label className="block text-sm font-medium mb-2">{t('admin.carousel.template')}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {CAROUSEL_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setData({ ...data, template: tpl.id })}
            className={`h-14 rounded-xl bg-gradient-to-br ${tpl.gradient} border-2 transition-all ${
              data.template === tpl.id
                ? 'border-gray-900 scale-105 shadow-lg ring-2 ring-offset-2 ring-gray-400'
                : 'border-transparent opacity-90 hover:opacity-100 hover:scale-102'
            }`}
            title={tpl.id}
          />
        ))}
      </div>
    </div>
  );

  const renderIconPicker = (data, setData) => (
    <div>
      <label className="block text-sm font-medium mb-2">{t('admin.carousel.icon')}</label>
      <div className="flex flex-wrap gap-2">
        {CAROUSEL_ICONS.map((iconId) => {
          const Icon = CAROUSEL_ICON_MAP[iconId];
          return (
            <button
              key={iconId}
              type="button"
              onClick={() => setData({ ...data, icon: iconId })}
              className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                data.icon === iconId
                  ? 'border-red-500 bg-red-50 text-red-600 scale-110 shadow-md'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
              title={iconId}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderForm = (data, setData, onSubmit, submitLabel) => (
    <form onSubmit={onSubmit} className="space-y-5">
      {renderTemplatePicker(data, setData)}
      {renderIconPicker(data, setData)}
      {renderLangFields(data, setData)}
      <div>
        <label className="block text-sm font-medium mb-1">{t('admin.carousel.ctaLink')}</label>
        <Input
          value={data.cta_link}
          onChange={(e) => setData({ ...data, cta_link: e.target.value })}
          placeholder="/pc-setup"
        />
        <p className="text-xs text-gray-500 mt-1">{t('admin.carousel.ctaLinkHint')}</p>
      </div>
      <div className="relative">
        <p className="text-sm font-medium mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4" /> {t('admin.carousel.preview')}
        </p>
        <SlidePreview form={data} language={language} t={t} />
      </div>
      <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
        {submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-8">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-orange-600" />
            {t('admin.carousel.orderTitle')}
          </CardTitle>
          <CardDescription>{t('admin.carousel.orderDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-orange-50/60 p-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t('admin.carousel.defaultDuration')}</label>
              <p className="text-xs text-gray-500 mb-2">{t('admin.carousel.defaultDurationHint')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                min={minDurationSec}
                max={maxDurationSec}
                defaultValue={durationMsToSeconds(defaultDurationMs)}
                key={`default-duration-${defaultDurationMs}`}
                disabled={savingDuration}
                className="w-24 text-center"
                onBlur={(e) => handleDefaultDurationBlur(e.target.value)}
              />
              <span className="text-sm text-gray-600">{t('admin.carousel.seconds')}</span>
            </div>
          </div>

          <ul className="space-y-2">
            {order.map((slideId, index) => {
              const customSlide = slides.find((s) => s.id === slideId);
              const defIndex = getDefaultSlideIndex(slideId);
              const preset = getSlidePreset(slideId, customSlide, defIndex);
              const { Icon, gradient } = preset;

              return (
                <li
                  key={slideId}
                  className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 shadow-sm"
                >
                  <span className="w-8 shrink-0 text-center text-sm font-bold text-gray-500">
                    {index + 1}
                  </span>
                  {preset && (
                    <div className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{getSlideTitle(slideId)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {isDefaultSlideId(slideId) ? (
                        <Badge variant="secondary" className="text-xs">
                          {t('admin.carousel.builtIn')}
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-100">
                          {t('admin.carousel.custom')}
                        </Badge>
                      )}
                      {isDefaultSlideId(slideId) && defaultOverrides[slideId] && (
                        <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                          {t('admin.carousel.edited')}
                        </Badge>
                      )}
                      {customSlide?.active === false && (
                        <Badge className="bg-gray-400 text-xs">{t('admin.carousel.inactive')}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Input
                      type="number"
                      min={minDurationSec}
                      max={maxDurationSec}
                      defaultValue={getDurationSecondsForSlide(slideId)}
                      key={`duration-${slideId}-${getDurationSecondsForSlide(slideId)}`}
                      disabled={savingDuration || reordering}
                      className="w-16 h-9 text-center text-sm px-1"
                      title={t('admin.carousel.slideDuration')}
                      onBlur={(e) => handleSlideDurationBlur(slideId, e.target.value)}
                    />
                    <span className="text-xs text-gray-500 w-4">{t('admin.carousel.secondsShort')}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-orange-200 text-orange-700 hover:bg-orange-50"
                      disabled={saving || reordering}
                      onClick={() => startEditSlide(slideId)}
                      aria-label={t('admin.carousel.edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-red-600 border-red-200 hover:bg-red-50"
                      disabled={saving || reordering}
                      onClick={() => handleRemoveSlide(slideId)}
                      aria-label={t('admin.carousel.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={reordering || index === 0}
                      onClick={() => moveSlide(index, 'up')}
                      aria-label={t('admin.carousel.moveUp')}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={reordering || index === order.length - 1}
                      onClick={() => moveSlide(index, 'down')}
                      aria-label={t('admin.carousel.moveDown')}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingSlideId)} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.carousel.editTitle')}</DialogTitle>
            <DialogDescription>
              {editingSlideId ? getSlideTitle(editingSlideId) : ''}
            </DialogDescription>
          </DialogHeader>
          {renderForm(
            editForm,
            setEditForm,
            (e) => {
              e.preventDefault();
              handleSaveEdit();
            },
            (
              <>
                <Save className="w-4 h-4 mr-2 inline" />
                {saving ? '...' : t('admin.carousel.save')}
              </>
            )
          )}
          <Button type="button" variant="outline" disabled={saving} onClick={cancelEdit} className="mt-2">
            <X className="w-4 h-4 mr-1" />
            {t('admin.carousel.cancel')}
          </Button>
        </DialogContent>
      </Dialog>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="w-5 h-5 text-orange-600" />
            {t('admin.carousel.title')}
          </CardTitle>
          <CardDescription>{t('admin.carousel.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderForm(form, setForm, handleAdd, (
            <>
              <Plus className="w-4 h-4 mr-2 inline" />
              {saving ? '...' : t('admin.carousel.add')}
            </>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarouselSlidesAdmin;
