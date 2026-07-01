import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Megaphone } from 'lucide-react';
import api from '../lib/api';
import { getBackgroundGradient, PRIORITY_STYLES } from '../lib/announcementThemes';

const AnnouncementPopup = () => {
  const { t } = useLanguage();
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/announcement/active');
        const data = res.data;
        if (!data?.id || !data?.active) return;

        const dismissed = localStorage.getItem(`announcement_dismissed_${data.id}`);
        if (dismissed) return;

        setAnnouncement(data);
        setOpen(true);
      } catch {
        // Sessizce geç — duyuru yoksa veya API kapalıysa popup gösterme
      }
    };
    load();
  }, []);

  const handleClose = () => {
    if (announcement?.id) {
      localStorage.setItem(`announcement_dismissed_${announcement.id}`, '1');
    }
    setOpen(false);
  };

  if (!announcement) return null;

  const priorityStyle = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.medium;
  const gradient = getBackgroundGradient(announcement.background);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className={`max-w-lg p-0 overflow-hidden border-0 ring-2 ${priorityStyle.ring}`}>
        <div className={`bg-gradient-to-br ${gradient} text-white p-6`}>
          <DialogHeader className="text-left space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Megaphone className="w-5 h-5 shrink-0" />
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${priorityStyle.badge}`}>
                {t(`announcement.priority.${announcement.priority}`)}
              </span>
            </div>
            <DialogTitle className="text-xl md:text-2xl font-bold text-white">
              {announcement.title}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-base whitespace-pre-wrap leading-relaxed">
              {announcement.message}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="p-4 bg-white sm:justify-center">
          <Button onClick={handleClose} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-8">
            {t('announcement.understood')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
