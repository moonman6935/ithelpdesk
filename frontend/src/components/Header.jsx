import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

const NAV_ITEMS = [
  { path: '/', labelKey: 'header.home', hover: 'nav-hover-red' },
  { path: '/pc-setup', labelKey: 'header.pcSetup', hover: 'nav-hover-blue' },
  { path: '/headset-test', labelKey: 'header.headsetTest', hover: 'nav-hover-emerald' },
  { path: '/troubleshooting', labelKey: 'header.troubleshooting', hover: 'nav-hover-orange' },
  { path: '/faq', labelKey: 'header.faq', hover: 'nav-hover-violet' },
  { path: '/asset-confirmation', labelKey: 'assetConfirmation.title', hover: 'nav-hover-rose' },
];

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const languages = [
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
  ];

  const isActive = (path) => location.pathname === path;

  const navButtonClass = (path, hover) =>
    isActive(path)
      ? 'bg-white text-red-600 hover:bg-white shadow-md font-semibold'
      : `text-white ${hover}`;

  return (
    <header className="bg-gradient-to-r from-red-600 via-red-600 to-red-700 border-b border-red-800/30 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity group">
            <img
              src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/8rtz75f4_image.png"
              alt="DCS Logo"
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold text-white group-hover:text-orange-100 transition-colors">
              {t('header.title')}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={`transition-all duration-300 ${navButtonClass(item.path, item.hover)}`}
                >
                  {t(item.labelKey)}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-2 rounded-lg text-2xl transition-all duration-300 border-2 ${
                  language === lang.code
                    ? 'bg-white border-white scale-110 shadow-lg'
                    : 'bg-red-700/50 border-red-500/50 hover:bg-gradient-to-br hover:from-violet-500 hover:to-blue-500 hover:border-white/50 hover:scale-105'
                }`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>

        <nav className="lg:hidden flex flex-wrap items-center justify-center gap-1 mt-4 pt-4 border-t border-red-500/40">
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
    </header>
  );
};

export default Header;
