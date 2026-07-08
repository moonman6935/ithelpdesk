import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppOpenTransition } from '../contexts/AppOpenTransitionContext';
import { Button } from '../components/ui/button';
import {
  Monitor,
  Headphones,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  ClipboardCheck,
  Sparkles,
  MessageSquare,
  Ticket,
  Truck,
} from 'lucide-react';
import HomeHeroCarousel from '../components/HomeHeroCarousel';
import { StaggerChildren } from '../components/PageShell';

const FEATURE_CARDS = [
  {
    key: 'setup',
    to: '/pc-setup',
    Icon: Monitor,
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    blob: 'bg-sky-300/25',
    accent: 'bg-sky-400/20',
    titleKey: 'home.features.setup',
    descKey: 'home.features.setupDesc',
    ctaKey: 'home.getStarted',
  },
  {
    key: 'test',
    to: '/headset-test',
    Icon: Headphones,
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    blob: 'bg-lime-300/25',
    accent: 'bg-emerald-400/20',
    titleKey: 'home.features.test',
    descKey: 'home.features.testDesc',
    ctaKey: 'home.testHeadset',
  },
  {
    key: 'support',
    to: '/troubleshooting',
    Icon: AlertCircle,
    gradient: 'from-orange-500 via-amber-500 to-red-600',
    blob: 'bg-yellow-300/25',
    accent: 'bg-amber-400/20',
    titleKey: 'home.features.support',
    descKey: 'home.features.supportDesc',
    ctaKey: 'header.troubleshooting',
  },
];

const EXTRA_CARDS = [
  {
    key: 'faq',
    to: '/faq',
    Icon: HelpCircle,
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-700',
    blob: 'bg-pink-300/25',
    accent: 'bg-fuchsia-400/20',
    titleKey: 'header.faq',
    descKey: 'home.features.faqDesc',
  },
  {
    key: 'assets',
    to: '/asset-confirmation',
    Icon: ClipboardCheck,
    gradient: 'from-rose-500 via-pink-600 to-red-700',
    blob: 'bg-rose-300/25',
    accent: 'bg-pink-400/20',
    titleKey: 'home.features.assets',
    descKey: 'home.features.assetsDesc',
    ctaKey: 'home.fillAssetForm',
  },
  {
    key: 'cargo',
    to: '/cargo-status',
    Icon: Truck,
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    blob: 'bg-amber-300/25',
    accent: 'bg-orange-400/20',
    titleKey: 'home.features.cargo',
    descKey: 'home.features.cargoDesc',
    ctaKey: 'home.trackCargo',
  },
];

function ColorCard({ gradient, blob, accent, Icon, title, description, cta, to, compact }) {
  const { openFromElement } = useAppOpenTransition();

  const handleClick = (e) => {
    const card = e.currentTarget.querySelector('[data-app-card]');
    if (!card) return;
    e.preventDefault();
    openFromElement(card, {
      to,
      gradientClasses: `bg-gradient-to-br ${gradient}`,
      blob,
      accent,
      Icon,
      title,
    });
  };

  return (
    <Link to={to} onClick={handleClick} className="block group h-full">
      <div
        data-app-card
        className={`app-card-source relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} text-white shadow-xl border border-white/10 h-full transition-shadow duration-300 sm:group-hover:shadow-2xl`}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden decorative-blur">
          <div className={`absolute -top-8 -right-8 w-40 h-40 rounded-full ${blob} blur-2xl`} />
          <div className={`absolute bottom-4 left-4 w-24 h-24 rounded-full ${accent} blur-xl`} />
        </div>

        <div className={`relative ${compact ? 'p-6' : 'p-8'} flex flex-col h-full`}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 sm:bg-white/15 sm:backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0 sm:group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <h3 className={`font-bold mb-2 ${compact ? 'text-xl' : 'text-2xl'}`}>{title}</h3>
          <p className={`text-white/90 leading-relaxed flex-1 ${compact ? 'text-sm' : 'text-base'}`}>
            {description}
          </p>

          {cta && (
            <div className="mt-6 pt-4 border-t border-white/15">
              <span className="inline-flex items-center text-sm font-semibold bg-white/15 group-hover:bg-white/25 px-4 py-2 rounded-full transition-colors">
                {cta}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

const QUICK_LINKS = [
  {
    key: 'guide',
    labelKey: 'home.subtitle',
    Icon: Sparkles,
    gradient: 'from-red-500 to-orange-500',
    blob: 'bg-orange-300/30',
    accent: 'bg-red-300/20',
    to: '/pc-setup',
  },
  {
    key: 'faq',
    labelKey: 'home.quickLinks.faq',
    Icon: HelpCircle,
    gradient: 'from-violet-500 to-purple-600',
    blob: 'bg-purple-300/30',
    accent: 'bg-violet-300/20',
    to: '/faq',
  },
  {
    key: 'rocketchat',
    labelKey: 'home.quickLinks.rocketchat',
    Icon: MessageSquare,
    gradient: 'from-blue-500 to-indigo-600',
    href: 'https://rocket.dmc-rz.com',
  },
  {
    key: 'ticket',
    labelKey: 'home.quickLinks.ticket',
    Icon: Ticket,
    gradient: 'from-emerald-500 to-teal-600',
    href: 'https://support.dmc-rz.com/otobo/customer.pl?Action=CustomerDashboard',
  },
  {
    key: 'cargo',
    labelKey: 'home.quickLinks.cargo',
    Icon: Truck,
    gradient: 'from-amber-500 to-orange-600',
    blob: 'bg-amber-300/30',
    accent: 'bg-orange-300/20',
    to: '/cargo-status',
  },
  {
    key: 'assets',
    labelKey: 'home.quickLinks.assetForm',
    Icon: ClipboardCheck,
    gradient: 'from-rose-500 to-pink-600',
    blob: 'bg-rose-300/30',
    accent: 'bg-pink-300/20',
    to: '/asset-confirmation',
  },
];

function QuickLinkPill({ label, Icon, gradient, blob, accent, to, href }) {
  const { openFromElement } = useAppOpenTransition();
  const pillGradient = gradient;
  const className = `app-card-source inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${pillGradient} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow duration-300`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </a>
    );
  }

  const handleClick = (e) => {
    e.preventDefault();
    openFromElement(e.currentTarget, {
      to,
      gradientClasses: `bg-gradient-to-r ${pillGradient}`,
      blob: blob || 'bg-white/20',
      accent: accent || 'bg-white/10',
      Icon,
      title: label,
    });
  };

  return (
    <Link to={to} onClick={handleClick} className={className}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function AppOpenButton({ to, gradientClasses, blob, accent, Icon, title, children, className, variant }) {
  const { openFromElement } = useAppOpenTransition();

  const handleClick = (e) => {
    e.preventDefault();
    const el = e.currentTarget.querySelector('[data-app-card]');
    if (!el) return;
    openFromElement(el, {
      to,
      gradientClasses,
      blob: blob || 'bg-white/20',
      accent: accent || 'bg-white/10',
      Icon,
      title,
    });
  };

  return (
    <Link to={to} onClick={handleClick} className="inline-block w-full sm:w-auto">
      <Button size="lg" variant={variant} data-app-card className={`app-card-source ${className || ''}`}>
        {children}
      </Button>
    </Link>
  );
}

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <HomeHeroCarousel />

      <section className="pt-2 md:pt-4 pb-12 md:pb-16">
        <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-red-50/60 sm:from-white/90 sm:via-white/80 sm:to-red-50/60 sm:backdrop-blur-md border border-white/70 shadow-lg p-6 md:p-10 mb-10">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-200/20 blur-3xl pointer-events-none decorative-blur" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-blue-200/20 blur-2xl pointer-events-none decorative-blur" />
            <div className="relative text-center w-full">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
                {QUICK_LINKS.map((link) => (
                  <QuickLinkPill
                    key={link.key}
                    label={t(link.labelKey)}
                    Icon={link.Icon}
                    gradient={link.gradient}
                    blob={link.blob}
                    accent={link.accent}
                    to={link.to}
                    href={link.href}
                  />
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {t('home.features.title')}
              </h2>
              <p className="text-gray-600 text-lg">{t('home.description')}</p>
            </div>
          </div>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {FEATURE_CARDS.map((card) => (
              <ColorCard
                key={card.key}
                {...card}
                title={t(card.titleKey)}
                description={t(card.descKey)}
                cta={t(card.ctaKey)}
                to={card.to}
                Icon={card.Icon}
              />
            ))}
          </StaggerChildren>

          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXTRA_CARDS.map((card) => (
              <ColorCard
                key={card.key}
                compact
                {...card}
                title={t(card.titleKey)}
                description={t(card.descKey)}
                cta={t(card.ctaKey || 'home.learnMore')}
                to={card.to}
                Icon={card.Icon}
              />
            ))}
          </StaggerChildren>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 lg:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-orange-600 text-white shadow-2xl border border-white/20">
            <div className="absolute inset-0 pointer-events-none decorative-blur">
              <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-yellow-300/20 blur-3xl" />
              <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-orange-300/20 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5" />
            </div>

            <div className="relative px-8 py-14 md:py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.cta.title')}</h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('home.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AppOpenButton
                  to="/pc-setup"
                  gradientClasses="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"
                  blob="bg-sky-300/25"
                  accent="bg-sky-400/20"
                  Icon={Monitor}
                  title={t('home.getStarted')}
                  className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-lg w-full sm:w-auto"
                >
                  {t('home.getStarted')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </AppOpenButton>
                <AppOpenButton
                  to="/headset-test"
                  gradientClasses="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700"
                  blob="bg-lime-300/25"
                  accent="bg-emerald-400/20"
                  Icon={Headphones}
                  title={t('home.testHeadset')}
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 w-full sm:w-auto"
                >
                  {t('home.testHeadset')}
                </AppOpenButton>
                <AppOpenButton
                  to="/faq"
                  gradientClasses="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700"
                  blob="bg-pink-300/25"
                  accent="bg-fuchsia-400/20"
                  Icon={HelpCircle}
                  title={t('header.faq')}
                  variant="outline"
                  className="border-2 border-white/60 text-white hover:bg-white/10 text-lg px-8 py-6 w-full sm:w-auto"
                >
                  {t('header.faq')}
                </AppOpenButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
