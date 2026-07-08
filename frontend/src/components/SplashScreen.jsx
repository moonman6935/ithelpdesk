import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import BrandLogo from './BrandLogo';
import { Loader2 } from 'lucide-react';

const MIN_DISPLAY_MS = 2800;
const EXIT_MS = 650;

const SplashScreen = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const minTime = reducedMotion ? 800 : MIN_DISPLAY_MS;
    const exitTime = reducedMotion ? 200 : EXIT_MS;
    const startedAt = Date.now();

    const beginExit = () => {
      const wait = Math.max(0, minTime - (Date.now() - startedAt));
      window.setTimeout(() => {
        setExiting(true);
        window.setTimeout(() => setVisible(false), exitTime);
      }, wait);
    };

    if (document.readyState === 'complete') {
      beginExit();
    } else {
      window.addEventListener('load', beginExit, { once: true });
      window.setTimeout(beginExit, minTime + 1500);
    }

    return () => window.removeEventListener('load', beginExit);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`splash-screen ${exiting ? 'splash-screen--exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('splash.title')}
    >
      <div className="splash-screen__grid" aria-hidden="true" />
      <div className="splash-screen__glow splash-screen__glow--left" aria-hidden="true" />
      <div className="splash-screen__glow splash-screen__glow--right" aria-hidden="true" />

      <div className="splash-screen__content">
        <div className="splash-screen__logo-wrap">
          <BrandLogo
            framed
            frame="header"
            crop="mark"
            variant="light"
            className="h-16 sm:h-20 w-auto"
            loading="eager"
          />
        </div>

        <h1 className="splash-screen__title">{t('splash.title')}</h1>
        <p className="splash-screen__desc">{t('splash.description')}</p>

        <p className="splash-screen__team">{t('splash.team')}</p>

        <div className="splash-screen__loader" aria-hidden="true">
          <Loader2 className="w-6 h-6 animate-spin text-white/90" />
          <span>{t('splash.loading')}</span>
          <div className="splash-screen__progress">
            <div className="splash-screen__progress-bar" />
          </div>
        </div>
      </div>

      <footer className="splash-screen__footer">
        <span>{t('splash.creator')}</span>
      </footer>
    </div>
  );
};

export default SplashScreen;
