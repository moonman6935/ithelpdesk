import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Monitor, RefreshCw, MessageSquare, Package, ShieldCheck, Laptop, Cable, Truck, ClipboardCheck, Download } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

const SLIDE_META = [
  { Icon: Sparkles, gradient: 'from-red-500 via-red-600 to-orange-500', blob: 'bg-yellow-300/30' },
  { Icon: Download, gradient: 'from-indigo-600 via-blue-700 to-violet-800', blob: 'bg-indigo-300/30' },
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

function CarouselSlide({ slide, index, slidesLength, isActive, t, direction, slideKey }) {
  const { Icon, gradient, blob } = SLIDE_META[index] || SLIDE_META[0];
  const enterClass = direction === 'left' ? 'ft-slide-enter-left' : 'ft-slide-enter-right';

  return (
    <div className={`min-w-full bg-gradient-to-br ${gradient} text-white relative overflow-hidden`}>
      {/* Futuristic scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
        }}
      />
      {/* Neon edge glow on active */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 60px rgba(0,240,255,0.15), inset 0 0 120px rgba(124,58,237,0.1)',
          }}
        />
      )}

      <div className="absolute inset-0 opacity-20 pointer-events-none decorative-blur">
        <div className={`absolute -top-10 -right-10 w-64 h-64 rounded-full ${blob} blur-2xl`} />
        <div className={`absolute bottom-0 left-10 w-48 h-48 rounded-full ${blob} blur-xl`} />
      </div>

      <div
        key={slideKey}
        className={`relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center p-6 sm:p-8 md:p-14 min-h-[280px] sm:min-h-[320px] md:min-h-[340px] ${isActive ? enterClass : ''}`}
      >
        <div className="order-2 md:order-1 space-y-3 sm:space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm font-medium sm:backdrop-blur-sm border border-white/20">
            {index + 1} / {slidesLength}
          </span>
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight ${
              isActive ? 'ft-glitch-text' : 'opacity-0 md:opacity-100'
            }`}
          >
            {slide.title}
          </h2>
          <p
            className={`text-base sm:text-lg md:text-xl text-white/95 leading-relaxed max-w-2xl lg:max-w-3xl ${
              isActive ? '' : 'opacity-0 md:opacity-100'
            }`}
            style={isActive ? { animation: 'ft-stagger-up 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both' } : undefined}
          >
            {slide.message}
          </p>
          {slide.ctaLink && isActive && (
            <div
              className="flex flex-wrap gap-3 pt-2 sm:pt-4"
              style={{ animation: 'ft-stagger-up 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <Link to={slide.ctaLink}>
                <Button size="lg" variant="brand" className="shadow-lg ft-neon-ring">
                  {slide.ctaLabel}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
          {index === 0 && isActive && !slide.ctaLink && (
            <div
              className="flex flex-wrap gap-3 pt-2 sm:pt-4"
              style={{ animation: 'ft-stagger-up 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <Link to="/pc-setup">
                <Button size="lg" variant="brand" className="shadow-lg ft-neon-ring">
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
          <div className={`relative ${isActive ? 'ft-icon-burst' : ''}`}>
            {isActive && <span className="ft-energy-ring rounded-full" />}
            <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full bg-white/15 sm:backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-inner relative">
              <div className="absolute inset-0 rounded-full opacity-40 animate-spin"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(0,240,255,0.4), transparent, rgba(255,0,170,0.3), transparent)',
                }}
              />
              <Icon className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white drop-shadow-lg relative z-10" strokeWidth={1.25} />
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
  const [direction, setDirection] = useState('right');
  const [slideKey, setSlideKey] = useState(0);
  const slidesLength = slides.length;

  const goTo = useCallback((index, dir) => {
    if (animating) return;
    const next = (index + slidesLength) % slidesLength;
    if (next === active) return;
    setDirection(dir || (next > active ? 'right' : 'left'));
    setAnimating(true);
    setSlideKey((k) => k + 1);
    setActive(next);
    window.setTimeout(() => setAnimating(false), 850);
  }, [animating, slidesLength, active]);

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
    <section className="relative pt-10 md:pt-12 pb-2 md:pb-3 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
        <div className="w-full relative">
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/50 relative">
            {/* Side energy beams */}
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
              />
            ) : (
              <div
                className={`flex ft-carousel-track ${animating ? 'ft-carousel-fast' : ''}`}
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
                    direction={direction}
                    slideKey={index === active ? slideKey : 0}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 hover:shadow-cyan-200/50 hover:scale-110 transition-all duration-300"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-600 hover:shadow-fuchsia-200/50 hover:scale-110 transition-all duration-300"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {slides.map((slide, index) => (
              <button
                key={`dot-${slide.title}-${index}`}
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
