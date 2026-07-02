import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import BrandLogo from './BrandLogo';

const NAV_ITEMS = [
  { path: '/', labelKey: 'header.home', hover: 'nav-hover-red' },
  { path: '/pc-setup', labelKey: 'header.pcSetup', hover: 'nav-hover-blue' },
  { path: '/headset-test', labelKey: 'header.headsetTest', hover: 'nav-hover-emerald' },
  { path: '/troubleshooting', labelKey: 'header.troubleshooting', hover: 'nav-hover-orange' },
  { path: '/faq', labelKey: 'header.faq', hover: 'nav-hover-violet' },
  { path: '/asset-confirmation', labelKey: 'assetConfirmation.title', hover: 'nav-hover-rose' },
  { path: '/video-tutorials', labelKey: 'header.videoTutorials', hover: 'nav-hover-cyan' },
];

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: 'https://flagcdn.com/w80/tr.png' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w80/de.png' },
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/us.png' },
];

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navButtonClass = (path, hover) =>
    isActive(path)
      ? 'bg-white text-red-600 shadow-md font-semibold rounded-xl'
      : `text-white rounded-xl ${hover}`;

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-4 pt-3 pb-1">
      <div className="container mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-500 via-red-600 to-orange-500 shadow-xl border border-white/25">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-yellow-300/25 blur-2xl" />
            <div className="absolute -bottom-10 left-1/4 w-32 h-32 rounded-full bg-orange-300/20 blur-xl" />
            <div className="absolute top-0 right-1/3 w-24 h-24 rounded-full bg-violet-400/15 blur-xl" />
          </div>

          <div className="relative px-3 sm:px-5 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/"
                className="flex items-center gap-3 sm:gap-4 min-w-0 hover:opacity-95 transition-opacity group"
              >
                <BrandLogo
                  framed
                  frame="header"
                  variant="light"
                  className="h-11 sm:h-12 md:h-[3.35rem] w-auto min-w-[7.5rem] sm:min-w-[8.5rem]"
                />
                <span className="text-base sm:text-lg font-bold text-white truncate group-hover:text-orange-100 transition-colors">
                  {t('header.title')}
                </span>
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    title={lang.name}
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                      language === lang.code
                        ? 'border-white scale-110 shadow-lg ring-2 ring-white/50'
                        : 'border-white/30 opacity-80 hover:opacity-100 hover:scale-105 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      className="w-9 h-6 sm:w-10 sm:h-7 object-cover block"
                    />
                  </button>
                ))}
              </div>
            </div>

            <nav className="hidden lg:flex items-center justify-center flex-wrap gap-1 mt-3 pt-3 border-t border-white/20">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-300 ${navButtonClass(item.path, item.hover)}`}
                  >
                    {t(item.labelKey)}
                  </Button>
                </Link>
              ))}
            </nav>

            <nav className="lg:hidden flex flex-wrap items-center justify-center gap-1 mt-3 pt-3 border-t border-white/20">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`text-xs transition-all duration-300 ${navButtonClass(item.path, item.hover)}`}
                  >
                    {t(item.labelKey)}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
