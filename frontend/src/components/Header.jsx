import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const languages = [
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'en', flag: '🇬🇧', name: 'English' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-red-600 border-b-2 border-red-700 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <img
              src="https://customer-assets.emergentagent.com/job_techsupport-31/artifacts/8rtz75f4_image.png"
              alt="DCS Logo"
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold text-white">{t('header.title')}</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'secondary' : 'ghost'}
                className={isActive('/') ? 'bg-white text-red-600 hover:bg-gray-100' : 'text-white hover:bg-red-700'}
              >
                {t('header.home')}
              </Button>
            </Link>
            <Link to="/pc-setup">
              <Button
                variant={isActive('/pc-setup') ? 'secondary' : 'ghost'}
                className={isActive('/pc-setup') ? 'bg-white text-red-600 hover:bg-gray-100' : 'text-white hover:bg-red-700'}
              >
                {t('header.pcSetup')}
              </Button>
            </Link>
            <Link to="/headset-test">
              <Button
                variant={isActive('/headset-test') ? 'secondary' : 'ghost'}
                className={isActive('/headset-test') ? 'bg-white text-red-600 hover:bg-gray-100' : 'text-white hover:bg-red-700'}
              >
                {t('header.headsetTest')}
              </Button>
            </Link>
            <Link to="/troubleshooting">
              <Button
                variant={isActive('/troubleshooting') ? 'secondary' : 'ghost'}
                className={isActive('/troubleshooting') ? 'bg-white text-red-600 hover:bg-gray-100' : 'text-white hover:bg-red-700'}
              >
                {t('header.troubleshooting')}
              </Button>
            </Link>
            <Link to="/asset-confirmation">
              <Button
                variant={isActive('/asset-confirmation') ? 'secondary' : 'ghost'}
                className={isActive('/asset-confirmation') ? 'bg-white text-red-600 hover:bg-gray-100' : 'text-white hover:bg-red-700'}
              >
                {t('assetConfirmation.title')}
              </Button>
            </Link>
          </nav>

          {/* Language Selector with Flags */}
          <div className="flex items-center space-x-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-2 rounded-lg text-2xl transition-all duration-200 border-2 ${language === lang.code
                    ? 'bg-white border-white scale-110 shadow-lg'
                    : 'bg-red-700 border-red-700 hover:bg-red-800 hover:border-red-800 hover:scale-105'
                  }`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-around mt-4 pt-4 border-t border-red-700">
          <Link to="/">
            <Button
              size="sm"
              variant={isActive('/') ? 'secondary' : 'ghost'}
              className={isActive('/') ? 'bg-white text-red-600' : 'text-white hover:bg-red-700'}
            >
              {t('header.home')}
            </Button>
          </Link>
          <Link to="/pc-setup">
            <Button
              size="sm"
              variant={isActive('/pc-setup') ? 'secondary' : 'ghost'}
              className={isActive('/pc-setup') ? 'bg-white text-red-600' : 'text-white hover:bg-red-700'}
            >
              {t('header.pcSetup')}
            </Button>
          </Link>
          <Link to="/headset-test">
            <Button
              size="sm"
              variant={isActive('/headset-test') ? 'secondary' : 'ghost'}
              className={isActive('/headset-test') ? 'bg-white text-red-600' : 'text-white hover:bg-red-700'}
            >
              {t('header.headsetTest')}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
