import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppOpenTransition } from '../contexts/AppOpenTransitionContext';
import { Button } from './ui/button';
import BrandLogo from './BrandLogo';
import SiteSearch from './SiteSearch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from './ui/sheet';
import {
  Home,
  Monitor,
  Headphones,
  AlertCircle,
  HelpCircle,
  ClipboardCheck,
  Truck,
  Video,
  Menu,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    path: '/',
    labelKey: 'header.home',
    hover: 'nav-hover-red',
    Icon: Home,
    gradientClasses: 'bg-gradient-to-br from-red-500 via-red-600 to-orange-500',
    blob: 'bg-yellow-300/25',
    accent: 'bg-orange-300/20',
  },
  {
    path: '/pc-setup',
    labelKey: 'header.pcSetup',
    hover: 'nav-hover-blue',
    Icon: Monitor,
    gradientClasses: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
    blob: 'bg-sky-300/25',
    accent: 'bg-sky-400/20',
  },
  {
    path: '/headset-test',
    labelKey: 'header.headsetTest',
    hover: 'nav-hover-emerald',
    Icon: Headphones,
    gradientClasses: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700',
    blob: 'bg-lime-300/25',
    accent: 'bg-emerald-400/20',
  },
  {
    path: '/troubleshooting',
    labelKey: 'header.troubleshooting',
    hover: 'nav-hover-orange',
    Icon: AlertCircle,
    gradientClasses: 'bg-gradient-to-br from-orange-500 via-amber-500 to-red-600',
    blob: 'bg-yellow-300/25',
    accent: 'bg-amber-400/20',
  },
  {
    path: '/faq',
    labelKey: 'header.faq',
    hover: 'nav-hover-violet',
    Icon: HelpCircle,
    gradientClasses: 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700',
    blob: 'bg-pink-300/25',
    accent: 'bg-fuchsia-400/20',
  },
  {
    path: '/asset-confirmation',
    labelKey: 'assetConfirmation.title',
    hover: 'nav-hover-rose',
    Icon: ClipboardCheck,
    gradientClasses: 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-700',
    blob: 'bg-rose-300/25',
    accent: 'bg-pink-400/20',
  },
  {
    path: '/cargo-status',
    labelKey: 'cargoTracking.nav',
    hover: 'nav-hover-orange',
    Icon: Truck,
    gradientClasses: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
    blob: 'bg-amber-300/25',
    accent: 'bg-orange-400/20',
  },
  {
    path: '/video-tutorials',
    labelKey: 'header.videoTutorials',
    hover: 'nav-hover-cyan',
    Icon: Video,
    gradientClasses: 'bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700',
    blob: 'bg-sky-300/25',
    accent: 'bg-blue-400/20',
  },
];

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: 'https://flagcdn.com/w80/tr.png' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w80/de.png' },
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/us.png' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w80/fr.png' },
  { code: 'ka', name: 'ქართული', flag: 'https://flagcdn.com/w80/ge.png' },
];

function NavLinkButton({ item, active, className, size = 'sm', onNavigate }) {
  const { t } = useLanguage();
  const location = useLocation();
  const { openFromElement } = useAppOpenTransition();
  const label = t(item.labelKey);
  const useDirectNav = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login');

  const handleClick = (e) => {
    if (active || useDirectNav) {
      onNavigate?.();
      return;
    }
    e.preventDefault();
    onNavigate?.();
    openFromElement(e.currentTarget, {
      to: item.path,
      gradientClasses: item.gradientClasses,
      blob: item.blob,
      accent: item.accent,
      Icon: item.Icon,
      title: label,
    });
  };

  return (
    <Link to={item.path} onClick={handleClick} className="block">
      <Button
        data-app-card
        variant="ghost"
        size={size}
        className={`app-card-source transition-all duration-300 ${className}`}
      >
        {item.Icon && <item.Icon className="w-4 h-4 mr-2 shrink-0 lg:hidden" />}
        {label}
      </Button>
    </Link>
  );
}

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navButtonClass = (path, hover) =>
    isActive(path)
      ? 'bg-white text-red-600 shadow-md font-semibold rounded-xl'
      : `text-white rounded-xl ${hover}`;

  return (
    <header className="z-50 site-container pt-3 pb-1">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-500 via-red-600 to-orange-500 shadow-xl border border-white/25">
          <div className="absolute inset-0 pointer-events-none overflow-hidden decorative-blur">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-yellow-300/25 blur-2xl" />
            <div className="absolute -bottom-10 left-1/4 w-32 h-32 rounded-full bg-orange-300/20 blur-xl" />
          </div>

          <div className="relative px-3 sm:px-5 py-2.5 sm:py-3 md:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <Link
                to="/"
                className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-95 transition-opacity group"
              >
                <BrandLogo
                  framed
                  frame="header"
                  crop="mark"
                  variant="light"
                  className="h-9 sm:h-11 md:h-12 w-auto"
                />
                <span className="text-sm sm:text-base md:text-lg font-bold text-white truncate group-hover:text-orange-100 transition-colors">
                  {t('header.title')}
                </span>
              </Link>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <SiteSearch />
                <div className="hidden sm:flex items-center gap-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      title={lang.name}
                      className={`relative rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                        language === lang.code
                          ? 'border-white scale-105 shadow-lg ring-1 ring-white/50'
                          : 'border-white/30 opacity-80 hover:opacity-100 hover:border-white/60'
                      }`}
                    >
                      <img
                        src={lang.flag}
                        alt={lang.name}
                        className="w-7 h-5 sm:w-9 sm:h-6 md:w-10 md:h-7 object-cover block"
                      />
                    </button>
                  ))}
                </div>

                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="lg:hidden text-white hover:bg-white/15 rounded-xl h-9 w-9"
                      aria-label={t('header.menu')}
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[min(100%,20rem)] p-0 border-0">
                    <div className="h-full flex flex-col bg-gradient-to-b from-red-600 via-red-600 to-orange-600 text-white">
                      <SheetHeader className="px-5 pt-5 pb-3 text-left border-b border-white/20">
                        <SheetTitle className="text-white text-lg">{t('header.menu')}</SheetTitle>
                      </SheetHeader>

                      <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-white/15">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => setLanguage(lang.code)}
                            title={lang.name}
                            className={`rounded-lg overflow-hidden border-2 transition-all ${
                              language === lang.code
                                ? 'border-white scale-105'
                                : 'border-white/30 opacity-80'
                            }`}
                          >
                            <img src={lang.flag} alt={lang.name} className="w-9 h-6 object-cover block" />
                          </button>
                        ))}
                      </div>

                      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                        {NAV_ITEMS.map((item) => (
                          <SheetClose asChild key={item.path}>
                            <div>
                              <NavLinkButton
                                item={item}
                                active={isActive(item.path)}
                                onNavigate={() => setMenuOpen(false)}
                                className={`w-full justify-start text-sm py-5 ${
                                  isActive(item.path)
                                    ? 'bg-white text-red-600 font-semibold'
                                    : 'text-white hover:bg-white/15'
                                }`}
                              />
                            </div>
                          </SheetClose>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <nav className="hidden lg:flex items-center justify-center flex-wrap gap-1 mt-3 pt-3 border-t border-white/20">
              {NAV_ITEMS.map((item) => (
                <NavLinkButton
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  className={navButtonClass(item.path, item.hover)}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
