import React, { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
import { Loader2 } from 'lucide-react';
import { translations } from '../translations/translations';
import { useLanguage } from '../contexts/LanguageContext';

const MIN_DISPLAY_MS_DESKTOP = 5200;
const MIN_DISPLAY_MS_MOBILE = 2200;
const EXIT_MS = 700;

const SPLASH_DONE_EVENT = 'ithelpdesk:splash-done';

const SPLASH_LANGS = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

const SplashScreen = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches;

    const minTime = reducedMotion
      ? 800
      : isMobile
        ? MIN_DISPLAY_MS_MOBILE
        : MIN_DISPLAY_MS_DESKTOP;
    const exitTime = reducedMotion ? 250 : EXIT_MS;
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
      window.setTimeout(beginExit, minTime + 2000);
    }

    const skip = () => beginExit();
    window.addEventListener('ithelpdesk:splash-skip', skip);

    return () => {
      window.removeEventListener('load', beginExit);
      window.removeEventListener('ithelpdesk:splash-skip', skip);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      window.dispatchEvent(new CustomEvent(SPLASH_DONE_EVENT));
    }
  }, [visible]);

  if (!visible) return null;

  const handleSkip = () => {
    setExiting(true);
    window.setTimeout(() => setVisible(false), 250);
  };

  return (
    <div
      className={`splash-screen ${exiting ? 'splash-screen--exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={translations.tr.splash.title}
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleSkip();
      }}
    >
      <div className="splash-screen__grid" aria-hidden="true" />
      <div className="splash-screen__glow splash-screen__glow--left" aria-hidden="true" />
      <div className="splash-screen__glow splash-screen__glow--right" aria-hidden="true" />

      <div className="splash-screen__content splash-screen__content--wide">
        <div className="splash-screen__logo-wrap">
          <BrandLogo
            framed
            frame="header"
            crop="mark"
            variant="light"
            className="h-14 sm:h-16 w-auto"
            loading="eager"
          />
        </div>

        <div className="splash-screen__langs">
          {SPLASH_LANGS.map(({ code, flag, label }) => (
            <div key={code} className="splash-screen__lang-block">
              <div className="splash-screen__lang-head">
                <span className="splash-screen__lang-flag" aria-hidden="true">{flag}</span>
                <span className="splash-screen__lang-label">{label}</span>
              </div>
              <h2 className="splash-screen__lang-title">{translations[code].splash.title}</h2>
              <p className="splash-screen__lang-desc">{translations[code].splash.description}</p>
            </div>
          ))}
        </div>

        <div className="splash-screen__teams">
          {SPLASH_LANGS.map(({ code, flag }) => (
            <span key={code} className="splash-screen__team-pill">
              {flag} {translations[code].splash.team}
            </span>
          ))}
        </div>

        <div className="splash-screen__loader" aria-hidden="true">
          <Loader2 className="w-6 h-6 animate-spin text-white/90" />
          <span>
            {translations.tr.splash.loading} · {translations.de.splash.loading} · {translations.en.splash.loading}
          </span>
          <div className="splash-screen__progress">
            <div className="splash-screen__progress-bar splash-screen__progress-bar--long" />
          </div>
        </div>
      </div>

      <footer className="splash-screen__footer">
        <span>{translations.tr.splash.creator}</span>
        <button
          type="button"
          className="mt-2 text-sm underline text-white/80 hover:text-white touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
        >
          {t('splash.skip')}
        </button>
      </footer>
    </div>
  );
};

export default SplashScreen;
