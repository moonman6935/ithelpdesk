import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Images, Plus, Trash2, Pencil, Save, X, Eye } from 'lucide-react';
import api from '../lib/api';
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

const LANG_FIELDS = [
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇹🇷', suffix: 'tr' },
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇩🇪', suffix: 'de' },
  { titleKey: 'title', messageKey: 'message', ctaKey: 'cta_label', flag: '🇺🇸', suffix: 'en' },
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
  const [form, setForm] = useState(EMPTY_CAROUSEL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_CAROUSEL_FORM);
  const [saving, setSaving] = useState(false);

  const fetchSlides = async () => {
    try {
      const res = await api.get('/api/admin/carousel-slides');
      setSlides(res.data || []);
    } catch {
      console.error('Slaytlar yüklenemedi');
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

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
    if (payload.cta_link && !payload.cta_labels.tr && !payload.cta_labels.de && !payload.cta_labels.en) {
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

  const startEdit = (slide) => {
    setEditingId(slide.id);
    setEditForm(slideToForm(slide));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_CAROUSEL_FORM);
  };

  const handleSaveEdit = async (slideId) => {
    const payload = validateForm(editForm);
    if (!payload) return;

    setSaving(true);
    try {
      await api.put(`/api/admin/carousel-slides/${slideId}`, payload);
      cancelEdit();
      alert(t('admin.carousel.updated'));
      fetchSlides();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.carousel.deleteConfirm'))) return;
    setSaving(true);
    try {
      await api.delete(`/api/admin/carousel-slides/${id}`);
      if (editingId === id) cancelEdit();
      fetchSlides();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.carousel.error'));
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

      {slides.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{t('admin.carousel.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {slides.map((slide) => {
            const normalized = normalizeCarouselSlide(slide);
            const isEditing = editingId === slide.id;
            const displayTitle = getCarouselText(normalized.titles, language);
            const meta = buildSlideMeta(slide.template, slide.icon);
            const { Icon, gradient } = meta;

            return (
              <Card key={slide.id} className="border-2 overflow-hidden">
                {isEditing ? (
                  <CardContent className="pt-6 space-y-4">
                    {renderForm(
                      editForm,
                      setEditForm,
                      (e) => {
                        e.preventDefault();
                        handleSaveEdit(slide.id);
                      },
                      (
                        <>
                          <Save className="w-4 h-4 mr-2 inline" />
                          {saving ? '...' : t('admin.carousel.save')}
                        </>
                      )
                    )}
                    <Button type="button" variant="outline" disabled={saving} onClick={cancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      {t('admin.carousel.cancel')}
                    </Button>
                  </CardContent>
                ) : (
                  <>
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-lg truncate">{displayTitle}</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline">{slide.template}</Badge>
                              <Badge variant="outline">{slide.icon}</Badge>
                              {slide.active === false && (
                                <Badge className="bg-gray-400">{t('admin.carousel.inactive')}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => startEdit(slide)}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => handleDelete(slide.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {getCarouselText(normalized.messages, language)}
                      </p>
                      {slide.cta_link && (
                        <p className="text-xs text-gray-400 mt-2 font-mono">{slide.cta_link}</p>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CarouselSlidesAdmin;
