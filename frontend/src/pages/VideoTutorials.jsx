import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import PageShell from '../components/PageShell';
import { Card, CardContent } from '../components/ui/card';
import { Video, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { getVideoTitle } from '../lib/videoTitles';
import VideoTutorialGrid from '../components/VideoTutorialGrid';

const VideoTutorials = () => {
  const { t, language } = useLanguage();
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
        <VideoTutorialGrid
          videos={videos}
          language={language}
          getTitle={getVideoTitle}
        />
      )}
    </PageShell>
  );
};

export default VideoTutorials;
