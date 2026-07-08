import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { AppOpenLinkButton } from './AppOpenLinkButton';
import { ArrowRight, ChevronLeft, ChevronRight, Monitor, Sparkles } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import api from '../lib/api';
import { buildSlideMeta } from '../lib/carouselThemes';
import { slideToDisplay } from '../lib/carouselSlideContent';

const DEFAULT_SLIDE_META = [
  { template: 'red', icon: 'sparkles' },
  { template: 'indigo', icon: 'download' },
  { template: 'blue', icon: 'monitor' },
  { template: 'emerald', icon: 'refresh' },
  { template: 'violet', icon: 'message' },
  { template: 'amber', icon: 'package' },
  { template: 'slate', icon: 'shield' },
  { template: 'cyan', icon: 'laptop' },
  { template: 'teal', icon: 'cable' },
  { template: 'amber', icon: 'truck' },
  { template: 'rose', icon: 'clipboard' },
];

function CarouselSlide({ slide, index, slidesLength, isActive, t, direction, slideKey, isWelcomeSlide }) {
  const meta = slide.meta || buildSlideMeta('red', 'sparkles');
  const { Icon, gradient, blob } = meta;
  const enterClass = direction === 'left' ? 'ft-slide-enter-left' : 'ft-slide-enter-right';

  return (
    <div className={`min-w-full bg-gradient-to-br ${gradient} text-white relative overflow-hidden`}>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
        }}
      />
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 60px rgba(0,240,255,0.15), inset 0 0 120px rgba(124,58,237,0.1)',
          }}
        />
      )}

      <div className="absolute inset-0 opacity-20 pointer-events-none decorative-blur">
        <div className={`absolute -top-10 -right-10 w-72 h-72 rounded-full ${blob} blur-2xl`} />
        <div className={`absolute bottom-0 left-10 w-56 h-56 rounded-full ${blob} blur-xl`} />
      </div>

      <div
        key={slideKey}
        className={`relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center p-8 sm:p-10 md:p-16 min-h-[340px] sm:min-h-[400px] md:min-h-[460px] lg:min-h-[500px] ${isActive ? enterClass : ''}`}
      >
        <div className="order-2 md:order-1 space-y-4 sm:space-y-5">
          <span className="inline-block px-3 py-1.5 rounded-full bg-white/20 text-sm font-medium sm:backdrop-blur-sm border border-white/20">
            {index + 1} / {slidesLength}
          </span>
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${
              isActive ? 'ft-glitch-text' : 'opacity-0 md:opacity-100'
            }`}
          >
            {slide.title}
          </h2>
          <p
            className={`text-lg sm:text-xl md:text-2xl text-white/95 leading-relaxed max-w-2xl lg:max-w-3xl ${
              isActive ? '' : 'opacity-0 md:opacity-100'
            }`}
            style={isActive ? { animation: 'ft-stagger-up 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both' } : undefined}
          >
            {slide.message}
          </p>
          {slide.ctaLink && slide.ctaLabel && isActive && (
            <div
              className="flex flex-wrap gap-3 pt-2 sm:pt-4"
              style={{ animation: 'ft-stagger-up 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <AppOpenLinkButton
                to={slide.ctaLink}
                gradientClasses={`bg-gradient-to-br ${gradient}`}
                blob={blob}
                Icon={Icon}
                title={slide.title}
                buttonClassName="ft-neon-ring text-base px-6 py-3"
              >
                {slide.ctaLabel}
                <ArrowRight className="ml-2 w-4 h-4" />
              </AppOpenLinkButton>
            </div>
          )}
          {isWelcomeSlide && isActive && !slide.ctaLink && (
            <div
              className="flex flex-wrap gap-3 pt-2 sm:pt-4"
              style={{ animation: 'ft-stagger-up 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <AppOpenLinkButton
                to="/pc-setup"
                gradientClasses="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"
                blob="bg-sky-300/25"
                Icon={Monitor}
                title={t('home.getStarted')}
                buttonClassName="ft-neon-ring text-base px-6 py-3"
              >
                {t('home.getStarted')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </AppOpenLinkButton>
              <AppOpenLinkButton
                to="/faq"
                gradientClasses="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700"
                blob="bg-pink-300/25"
                Icon={Sparkles}
                title={t('header.faq')}
                variant="outline"
                buttonClassName="border-white text-white hover:bg-white/10 text-base px-6 py-3"
              >
                {t('header.faq')}
              </AppOpenLinkButton>
            </div>
          )}
        </div>

        <div className="order-1 md:order-2 flex justify-center">
          <div className={`relative ${isActive ? 'ft-icon-burst' : ''}`}>
            {isActive && <span className="ft-energy-ring rounded-full" />}
            <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full bg-white/15 sm:backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-inner relative">
              <div
                className="absolute inset-0 rounded-full opacity-40 animate-spin"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent, rgba(0,240,255,0.4), transparent, rgba(255,0,170,0.3), transparent)',
                }}
              />
              <Icon className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 text-white drop-shadow-lg relative z-10" strokeWidth={1.25} />
            </div>
            <div className="hidden sm:block absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-white/20 rotate-12 sm:backdrop-blur-sm" />
            <div className="hidden sm:block absolute -bottom-5 -left-5 w-24 h-24 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

const HomeHeroCarousel = () => {
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const [customSlides, setCustomSlides] = useState([]);
  const defaultSlides = translations[language]?.home?.carouselSlides || translations.tr.home.carouselSlides;

  const slides = [
    ...defaultSlides.map((slide, index) => {
      const preset = DEFAULT_SLIDE_META[index] || DEFAULT_SLIDE_META[0];
      return {
        ...slide,
        slideId: `default-${index}`,
        meta: buildSlideMeta(preset.template, preset.icon),
        isWelcomeSlide: index === 0,
      };
    }),
    ...customSlides.map((slide) => {
      const display = slideToDisplay(slide, language);
      return {
        ...display,
        slideId: slide.id,
        meta: buildSlideMeta(display.template, display.icon),
        isWelcomeSlide: false,
      };
    }),
  ];

  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('right');
  const [slideKey, setSlideKey] = useState(0);
  const slidesLength = slides.length;
  const prevLengthRef = useRef(slidesLength);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/carousel-slides')
      .then((res) => {
        if (!cancelled) setCustomSlides(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setCustomSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slidesLength !== prevLengthRef.current) {
      prevLengthRef.current = slidesLength;
      if (active >= slidesLength) {
        setActive(0);
      }
    }
  }, [slidesLength, active]);

  const goTo = useCallback(
    (index, dir) => {
      if (animating) return;
      const next = (index + slidesLength) % slidesLength;
      if (next === active) return;
      setDirection(dir || (next > active ? 'right' : 'left'));
      setAnimating(true);
      setSlideKey((k) => k + 1);
      setActive(next);
      window.setTimeout(() => setAnimating(false), 850);
    },
    [animating, slidesLength, active]
  );

  const next = useCallback(() => goTo(active + 1, 'right'), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1, 'left'), [active, goTo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || animating) return;
      goTo(active + 1, 'right');
    }, 7000);

    return () => window.clearInterval(timer);
  }, [active, animating, goTo]);

  return (
    <section className="relative pt-6 md:pt-8 pb-2 md:pb-4 overflow-hidden">
      <div className="site-container">
        <div className="w-full relative">
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/50 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 z-20 bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-1 z-20 bg-gradient-to-b from-transparent via-fuchsia-400/60 to-transparent" />

            {isMobile ? (
              <CarouselSlide
                slide={slides[active]}
                index={active}
                slidesLength={slidesLength}
                isActive
                t={t}
                direction={direction}
                slideKey={slideKey}
                isWelcomeSlide={slides[active]?.isWelcomeSlide}
              />
            ) : (
              <div
                className={`flex ft-carousel-track ${animating ? 'ft-carousel-fast' : ''}`}
                style={{ transform: `translateX(-${active * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <CarouselSlide
                    key={slide.slideId || `${slide.title}-${index}`}
                    slide={slide}
                    index={index}
                    slidesLength={slidesLength}
                    isActive={index === active}
                    t={t}
                    direction={direction}
                    slideKey={index === active ? slideKey : 0}
                    isWelcomeSlide={slide.isWelcomeSlide}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-5 z-10 w-11 h-11 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 hover:shadow-cyan-200/50 hover:scale-110 transition-all duration-300"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-5 z-10 w-11 h-11 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-600 hover:shadow-fuchsia-200/50 hover:scale-110 transition-all duration-300"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-5 flex-wrap px-2">
            {slides.map((slide, index) => (
              <button
                key={`dot-${slide.slideId || slide.title}-${index}`}
                type="button"
                onClick={() => goTo(index, index > active ? 'right' : 'left')}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  index === active
                    ? 'w-8 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 ft-dot-active'
                    : 'w-2.5 bg-gray-300 hover:bg-violet-300 hover:scale-125'
                }`}
                aria-label={slide.title}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroCarousel;
