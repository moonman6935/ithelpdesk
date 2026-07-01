import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Megaphone, Eye } from 'lucide-react';
import api from '../lib/api';
import { ANNOUNCEMENT_BACKGROUNDS, PRIORITY_STYLES, getBackgroundGradient } from '../lib/announcementThemes';

const AnnouncementAdmin = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'medium',
    background: 'red',
  });
  const [active, setActive] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchActive = async () => {
    try {
      const res = await api.get('/api/admin/announcement');
      setActive(res.data);
      if (res.data) {
        setForm({
          title: res.data.title || '',
          message: res.data.message || '',
          priority: res.data.priority || 'medium',
          background: res.data.background || 'red',
        });
      }
    } catch {
      console.error('Duyuru yüklenemedi');
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      alert(t('admin.announcement.required'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/announcement', form);
      alert(t('admin.announcement.published'));
      fetchActive();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.announcement.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(t('admin.announcement.deactivateConfirm'))) return;
    setSaving(true);
    try {
      await api.post('/api/admin/announcement/deactivate');
      setActive(null);
      alert(t('admin.announcement.deactivated'));
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.announcement.error'));
    } finally {
      setSaving(false);
    }
  };

  const previewGradient = getBackgroundGradient(form.background);
  const previewPriority = PRIORITY_STYLES[form.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" />
            {t('admin.announcement.title')}
          </CardTitle>
          <CardDescription>{t('admin.announcement.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.announcement.heading')}</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('admin.announcement.headingPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.announcement.priority')}</label>
              <div className="flex flex-wrap gap-2">
                {['high', 'medium', 'low'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.priority === p
                        ? `${PRIORITY_STYLES[p].badge} border-transparent scale-105 shadow-md`
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t(`announcement.priority.${p}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.announcement.background')}</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ANNOUNCEMENT_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setForm({ ...form, background: bg.id })}
                    className={`h-12 rounded-xl bg-gradient-to-br ${bg.gradient} border-2 transition-all ${
                      form.background === bg.id ? 'border-gray-900 scale-105 shadow-lg ring-2 ring-offset-2 ring-gray-400' : 'border-white/50 opacity-80 hover:opacity-100'
                    }`}
                    title={t(`admin.announcement.bg.${bg.id}`)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.announcement.message')}</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t('admin.announcement.messagePlaceholder')}
                rows={5}
                required
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none">
                <Megaphone className="w-4 h-4 mr-2" />
                {saving ? '...' : t('admin.announcement.publish')}
              </Button>
              {active && (
                <Button type="button" variant="outline" disabled={saving} onClick={handleDeactivate} className="border-gray-300">
                  {t('admin.announcement.deactivate')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4" />
            {t('admin.announcement.preview')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className={`bg-gradient-to-br ${previewGradient} text-white p-6 min-h-[220px]`}>
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-5 h-5" />
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${previewPriority.badge}`}>
                {t(`announcement.priority.${form.priority}`)}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3">{form.title || t('admin.announcement.headingPlaceholder')}</h3>
            <p className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed">
              {form.message || t('admin.announcement.messagePlaceholder')}
            </p>
          </div>
          <div className="p-4 bg-gray-50 text-sm text-gray-600">
            {active ? (
              <p>
                <Badge className="bg-green-100 text-green-700 mr-2">{t('admin.announcement.live')}</Badge>
                {new Date(active.published_at).toLocaleString()}
              </p>
            ) : (
              <p>{t('admin.announcement.noActive')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementAdmin;
