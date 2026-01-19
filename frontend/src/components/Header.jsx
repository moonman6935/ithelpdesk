import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Monitor } from 'lucide-react';

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
    <header className="bg-white border-b-2 border-red-600 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="bg-red-600 p-2 rounded-lg">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{t('header.title')}</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'}
                className={isActive('/') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
              >
                {t('header.home')}
              </Button>
            </Link>
            <Link to="/pc-setup">
              <Button 
                variant={isActive('/pc-setup') ? 'default' : 'ghost'}
                className={isActive('/pc-setup') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
              >
                {t('header.pcSetup')}
              </Button>
            </Link>
            <Link to="/headset-test">
              <Button 
                variant={isActive('/headset-test') ? 'default' : 'ghost'}
                className={isActive('/headset-test') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
              >
                {t('header.headsetTest')}
              </Button>
            </Link>
            <Link to="/troubleshooting">
              <Button 
                variant={isActive('/troubleshooting') ? 'default' : 'ghost'}
                className={isActive('/troubleshooting') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
              >
                {t('header.troubleshooting')}
              </Button>
            </Link>
          </nav>

          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-2 rounded-lg text-2xl transition-all duration-200 ${
                  language === lang.code
                    ? 'bg-red-600 scale-110 shadow-md'
                    : 'bg-gray-100 hover:bg-red-50 hover:scale-105'
                }`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-around mt-4 pt-4 border-t border-gray-200">
          <Link to="/">
            <Button 
              size="sm"
              variant={isActive('/') ? 'default' : 'ghost'}
              className={isActive('/') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
            >
              {t('header.home')}
            </Button>
          </Link>
          <Link to="/pc-setup">
            <Button 
              size="sm"
              variant={isActive('/pc-setup') ? 'default' : 'ghost'}
              className={isActive('/pc-setup') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
            >
              {t('header.pcSetup')}
            </Button>
          </Link>
          <Link to="/headset-test">
            <Button 
              size="sm"
              variant={isActive('/headset-test') ? 'default' : 'ghost'}
              className={isActive('/headset-test') ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50 hover:text-red-600'}
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
