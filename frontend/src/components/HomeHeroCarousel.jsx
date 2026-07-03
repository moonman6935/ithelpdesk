import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Monitor, RefreshCw, MessageSquare, Package, ShieldCheck, Laptop, Cable, Truck, ClipboardCheck } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

const SLIDE_META = [
  { Icon: Sparkles, gradient: 'from-red-500 via-red-600 to-orange-500', blob: 'bg-yellow-300/30' },
  { Icon: Monitor, gradient: 'from-blue-600 via-blue-700 to-indigo-700', blob: 'bg-sky-300/30' },
  { Icon: RefreshCw, gradient: 'from-emerald-500 via-teal-600 to-cyan-600', blob: 'bg-lime-300/30' },
  { Icon: MessageSquare, gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', blob: 'bg-pink-300/30' },
  { Icon: Package, gradient: 'from-amber-500 via-orange-600 to-red-600', blob: 'bg-amber-300/30' },
  { Icon: ShieldCheck, gradient: 'from-slate-600 via-slate-700 to-zinc-800', blob: 'bg-slate-300/30' },
  { Icon: Laptop, gradient: 'from-cyan-600 via-blue-600 to-indigo-700', blob: 'bg-cyan-300/30' },
  { Icon: Cable, gradient: 'from-teal-600 via-green-600 to-emerald-700', blob: 'bg-teal-300/30' },
  { Icon: Truck, gradient: 'from-amber-500 via-orange-600 to-red-600', blob: 'bg-amber-300/30' },
  { Icon: ClipboardCheck, gradient: 'from-rose-500 via-pink-600 to-red-700', blob: 'bg-rose-300/30' },
];

function CarouselSlide({ slide, index, slidesLength, isActive, t }) {
  const { Icon, gradient, blob } = SLIDE_META[index] || SLIDE_META[0];

  return (
    <div className={`min-w-full bg-gradient-to-br ${gradient} text-white relative`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none decorative-blur">
        <div className={`absolute -top-10 -right-10 w-64 h-64 rounded-full ${blob} blur-2xl`} />
        <div className={`absolute bottom-0 left-10 w-48 h-48 rounded-full ${blob} blur-xl`} />
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center p-6 sm:p-8 md:p-14 min-h-[280px] sm:min-h-[320px] md:min-h-[340px]">
        <div className="order-2 md:order-1 space-y-3 sm:space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm font-medium sm:backdrop-blur-sm">
            {index + 1} / {slidesLength}
          </span>
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight transition-opacity duration-500 ${
              isActive ? 'opacity-100' : 'opacity-0 md:opacity-100'
            }`}
          >
            {slide.title}
          </h2>
          <p
            className={`text-base sm:text-lg md:text-xl text-white/95 leading-relaxed max-w-2xl lg:max-w-3xl transition-opacity duration-500 ${
              isActive ? 'opacity-100' : 'opacity-0 md:opacity-100'
            }`}
          >
            {slide.message}
          </p>
          {slide.ctaLink && isActive && (
            <div className="flex flex-wrap gap-3 pt-2 sm:pt-4">
              <Link to={slide.ctaLink}>
                <Button size="lg" variant="brand" className="shadow-lg">
                  {slide.ctaLabel}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
          {index === 0 && isActive && !slide.ctaLink && (
            <div className="flex flex-wrap gap-3 pt-2 sm:pt-4">
              <Link to="/pc-setup">
                <Button size="lg" variant="brand" className="shadow-lg">
                  {t('home.getStarted')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/faq">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  {t('header.faq')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="order-1 md:order-2 flex justify-center">
          <div className={`relative transition-transform duration-500 ${isActive ? 'scale-100' : 'scale-95 md:scale-90'}`}>
            <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-white/15 sm:backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-inner">
              <Icon className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white drop-shadow-lg" strokeWidth={1.25} />
            </div>
            <div className="hidden sm:block absolute -top-3 -right-3 w-16 h-16 rounded-2xl bg-white/20 rotate-12 sm:backdrop-blur-sm" />
            <div className="hidden sm:block absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

const HomeHeroCarousel = () => {
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const slides = translations[language]?.home?.carouselSlides || translations.tr.home.carouselSlides;
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const slidesLength = slides.length;

  const goTo = useCallback((index) => {
    if (animating) return;
    setAnimating(true);
    setActive((index + slidesLength) % slidesLength);
    window.setTimeout(() => setAnimating(false), 500);
  }, [animating, slidesLength]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((prev) => (prev + 1) % slidesLength);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [slidesLength]);

  return (
    <section className="relative pt-10 md:pt-12 pb-2 md:pb-3 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
        <div className="w-full relative">
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/50">
            {isMobile ? (
              <CarouselSlide
                slide={slides[active]}
                index={active}
                slidesLength={slidesLength}
                isActive
                t={t}
              />
            ) : (
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${active * 100}%)` }}
              >
                {slides.map((slide, index) => (
                  <CarouselSlide
                    key={`${slide.title}-${index}`}
                    slide={slide}
                    index={index}
                    slidesLength={slidesLength}
                    isActive={index === active}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {slides.map((slide, index) => (
              <button
                key={`dot-${slide.title}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === active ? 'w-8 bg-red-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
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
