import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Video, Loader2 } from 'lucide-react';
import api from '../lib/api';
import VideoEmbed from '../components/VideoEmbed';

const VideoTutorials = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/troubleshooting-videos');
        setVideos(res.data || []);
      } catch {
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageShell
      theme="cyan"
      icon={Video}
      title={t('videoTutorials.title')}
      subtitle={t('videoTutorials.subtitle')}
      maxWidth="max-w-5xl"
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="glass-panel border-0">
          <CardContent className="py-12 text-center text-gray-500">
            {t('videoTutorials.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {videos.map((video) => (
            <Card key={video.id} className="glass-panel border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-50/80 to-white/50">
                <CardTitle className="text-xl">{video.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <VideoEmbed url={video.video_url} title={video.title} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default VideoTutorials;
