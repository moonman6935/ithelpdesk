import React, { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
import { Loader2 } from 'lucide-react';
import { translations } from '../translations/translations';

const MIN_DISPLAY_MS = 5200;
const EXIT_MS = 700;

const SPLASH_LANGS = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const minTime = reducedMotion ? 1000 : MIN_DISPLAY_MS;
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

    return () => window.removeEventListener('load', beginExit);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`splash-screen ${exiting ? 'splash-screen--exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={translations.tr.splash.title}
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
      </footer>
    </div>
  );
};

export default SplashScreen;
