import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Megaphone, X } from 'lucide-react';
import api from '../lib/api';
import { getBackgroundGradient, PRIORITY_STYLES } from '../lib/announcementThemes';
import { resetBodyInteraction } from '../lib/resetBodyInteraction';
import '../styles/announcement-popup.css';

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

function AnnouncementModal({ announcement, onClose, t }) {
  const priorityStyle = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.medium;
  const gradient = getBackgroundGradient(announcement.background);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      resetBodyInteraction();
    };
  }, [onClose]);

  const stopPropagation = (e) => e.stopPropagation();

  return createPortal(
    <div className="announcement-root" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      <button
        type="button"
        className="announcement-root__backdrop"
        onClick={onClose}
        aria-label={t('announcement.close')}
      />

      <div className="announcement-root__panel" onClick={stopPropagation}>
        <button
          type="button"
          className="announcement-root__close"
          onClick={onClose}
          aria-label={t('announcement.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="announcement-root__scroll">
          <div className={`announcement-root__hero bg-gradient-to-br ${gradient}`}>
            <div className="announcement-root__badge-row">
              <Megaphone className="w-5 h-5 shrink-0 text-white" />
              <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${priorityStyle.badge}`}>
                {t(`announcement.priority.${announcement.priority}`)}
              </span>
            </div>
            <h2 id="announcement-title" className="announcement-root__title">
              {announcement.title}
            </h2>
            <p className="announcement-root__message">{announcement.message}</p>
          </div>
        </div>

        <div className="announcement-root__footer">
          <Button
            type="button"
            onClick={onClose}
            className="announcement-root__btn bg-red-600 hover:bg-red-700"
          >
            {t('announcement.understood')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
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
        // Sessizce geç
      }
    };

    load();
    return () => {
      cancelled = true;
      resetBodyInteraction();
    };
  }, []);

  if (!announcement || !open) return null;

  return <AnnouncementModal announcement={announcement} onClose={handleClose} t={t} />;
};

export default AnnouncementPopup;
