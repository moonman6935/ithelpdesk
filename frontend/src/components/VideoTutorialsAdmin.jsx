import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Video, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';
import VideoEmbed from './VideoEmbed';

const VideoTutorialsAdmin = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: '', video_url: '' });
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.video_url.trim()) {
      alert(t('admin.videoTutorials.required'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/troubleshooting-videos', form);
      setForm({ title: '', video_url: '' });
      alert(t('admin.videoTutorials.added'));
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
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.videoTutorials.heading')}</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('admin.videoTutorials.headingPlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.videoTutorials.videoUrl')}</label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder={t('admin.videoTutorials.videoUrlPlaceholder')}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-2" />
                {saving ? '...' : t('admin.videoTutorials.add')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {videos.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{t('admin.videoTutorials.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="border-2 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleDelete(video.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <VideoEmbed url={video.video_url} title={video.title} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoTutorialsAdmin;
