import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Video, Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import api from '../lib/api';
import VideoEmbed from './VideoEmbed';
import {
  EMPTY_VIDEO_FORM,
  formToTitles,
  getVideoTitle,
  hasAnyTitle,
  normalizeVideoTitles,
  videoToForm,
} from '../lib/videoTitles';

const LANG_FIELDS = [
  { key: 'title_tr', labelKey: 'admin.videoTutorials.titleTr', flag: '🇹🇷' },
  { key: 'title_de', labelKey: 'admin.videoTutorials.titleDe', flag: '🇩🇪' },
  { key: 'title_en', labelKey: 'admin.videoTutorials.titleEn', flag: '🇺🇸' },
];

const TitleFields = ({ form, setForm, t }) => (
  <div className="grid grid-cols-1 gap-3">
    {LANG_FIELDS.map(({ key, labelKey, flag }) => (
      <div key={key}>
        <label className="block text-sm font-medium mb-1">
          {flag} {t(labelKey)}
        </label>
        <Input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={t('admin.videoTutorials.headingPlaceholder')}
        />
      </div>
    ))}
  </div>
);

const VideoTutorialsAdmin = () => {
  const { t, language } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(EMPTY_VIDEO_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_VIDEO_FORM);
  const [saving, setSaving] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await api.get('/api/admin/troubleshooting-videos');
      setVideos(res.data || []);
    } catch {
      console.error('Videolar yüklenemedi');
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const validateForm = (data) => {
    const titles = formToTitles(data);
    if (!hasAnyTitle(titles) || !data.video_url.trim()) {
      alert(t('admin.videoTutorials.required'));
      return null;
    }
    return { titles, video_url: data.video_url.trim() };
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const payload = validateForm(form);
    if (!payload) return;

    setSaving(true);
    try {
      await api.post('/api/admin/troubleshooting-videos', payload);
      setForm(EMPTY_VIDEO_FORM);
      alert(t('admin.videoTutorials.added'));
      fetchVideos();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.videoTutorials.error'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (video) => {
    setEditingId(video.id);
    setEditForm(videoToForm(video));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_VIDEO_FORM);
  };

  const handleSaveEdit = async (videoId) => {
    const payload = validateForm(editForm);
    if (!payload) return;

    setSaving(true);
    try {
      await api.put(`/api/admin/troubleshooting-videos/${videoId}`, payload);
      setEditingId(null);
      setEditForm(EMPTY_VIDEO_FORM);
      alert(t('admin.videoTutorials.updated'));
      fetchVideos();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.videoTutorials.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.videoTutorials.deleteConfirm'))) return;
    setSaving(true);
    try {
      await api.delete(`/api/admin/troubleshooting-videos/${id}`);
      if (editingId === id) cancelEdit();
      fetchVideos();
    } catch (err) {
      alert(err.response?.data?.detail || t('admin.videoTutorials.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-600" />
            {t('admin.videoTutorials.title')}
          </CardTitle>
          <CardDescription>{t('admin.videoTutorials.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <TitleFields form={form} setForm={setForm} t={t} />
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.videoTutorials.videoUrl')}</label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder={t('admin.videoTutorials.videoUrlPlaceholder')}
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              {saving ? '...' : t('admin.videoTutorials.add')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {videos.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{t('admin.videoTutorials.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {videos.map((video) => {
            const isEditing = editingId === video.id;
            const displayTitle = getVideoTitle(video, language);
            const titles = normalizeVideoTitles(video);

            return (
              <Card key={video.id} className="border-2 overflow-hidden">
                <CardHeader className="pb-2">
                  {isEditing ? (
                    <div className="space-y-4">
                      <TitleFields form={editForm} setForm={setEditForm} t={t} />
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('admin.videoTutorials.videoUrl')}</label>
                        <Input
                          value={editForm.video_url}
                          onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                          placeholder={t('admin.videoTutorials.videoUrlPlaceholder')}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving}
                          onClick={() => handleSaveEdit(video.id)}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {t('admin.videoTutorials.save')}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={cancelEdit}>
                          <X className="w-4 h-4 mr-1" />
                          {t('admin.videoTutorials.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-lg">{displayTitle}</CardTitle>
                        <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                          {titles.tr && <p>🇹🇷 {titles.tr}</p>}
                          {titles.de && titles.de !== titles.tr && <p>🇩🇪 {titles.de}</p>}
                          {titles.en && titles.en !== titles.tr && <p>🇺🇸 {titles.en}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() => startEdit(video)}
                          className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <VideoEmbed
                    url={isEditing ? editForm.video_url : video.video_url}
                    title={isEditing ? editForm.title_tr || displayTitle : displayTitle}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoTutorialsAdmin;
