import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Megaphone } from 'lucide-react';
import api from '../lib/api';
import { getBackgroundGradient, PRIORITY_STYLES } from '../lib/announcementThemes';
import { resetBodyInteraction } from '../lib/resetBodyInteraction';

const SPLASH_DONE_EVENT = 'ithelpdesk:splash-done';
const SESSION_PREFIX = 'announcement-dismissed:';

function waitForSplashDone(maxMs = 9000) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    if (!document.querySelector('.splash-screen')) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener(SPLASH_DONE_EVENT, finish);
      clearInterval(poll);
      clearTimeout(timeout);
      resolve();
    };

    window.addEventListener(SPLASH_DONE_EVENT, finish, { once: true });
    const poll = window.setInterval(() => {
      if (!document.querySelector('.splash-screen')) finish();
    }, 150);
    const timeout = window.setTimeout(finish, maxMs);
  });
}

const AnnouncementPopup = () => {
  const { t } = useLanguage();
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (announcement?.id) {
      try {
        sessionStorage.setItem(`${SESSION_PREFIX}${announcement.id}`, '1');
      } catch {
        // private mode
      }
    }
    window.setTimeout(resetBodyInteraction, 0);
  }, [announcement?.id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await waitForSplashDone();
        if (cancelled) return;

        const res = await api.get('/api/announcement/active');
        const data = res.data;
        if (!data?.id || !data?.active) return;

        try {
          if (sessionStorage.getItem(`${SESSION_PREFIX}${data.id}`)) return;
        } catch {
          // ignore
        }

        if (cancelled) return;
        setAnnouncement(data);
        setOpen(true);
      } catch {
        // Sessizce geç — duyuru yoksa veya API kapalıysa popup gösterme
      }
    };

    load();
    return () => {
      cancelled = true;
      resetBodyInteraction();
    };
  }, []);

  if (!announcement || !open) return null;

  const priorityStyle = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.medium;
  const gradient = getBackgroundGradient(announcement.background);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent
        className={`announcement-dialog-content max-w-lg p-0 overflow-hidden border-0 ring-2 ${priorityStyle.ring}`}
        onPointerDownOutside={handleClose}
        onInteractOutside={handleClose}
        onEscapeKeyDown={handleClose}
      >
        <div className="announcement-dialog-body">
          <div className={`bg-gradient-to-br ${gradient} text-white p-5 sm:p-6`}>
            <DialogHeader className="text-left space-y-3">
              <div className="flex items-center gap-2 flex-wrap pr-8">
                <Megaphone className="w-5 h-5 shrink-0" />
                <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${priorityStyle.badge}`}>
                  {t(`announcement.priority.${announcement.priority}`)}
                </span>
              </div>
              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {announcement.title}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                {announcement.message}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="announcement-dialog-footer p-4 bg-white sm:justify-center border-t border-gray-100">
          <Button
            type="button"
            onClick={handleClose}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-8 min-h-[48px] text-base touch-manipulation"
          >
            {t('announcement.understood')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementPopup;
