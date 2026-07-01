import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Monitor, RefreshCw, MessageSquare } from 'lucide-react';

const SLIDE_META = [
  { Icon: Sparkles, gradient: 'from-red-500 via-red-600 to-orange-500', blob: 'bg-yellow-300/30' },
  { Icon: Monitor, gradient: 'from-blue-600 via-blue-700 to-indigo-700', blob: 'bg-sky-300/30' },
  { Icon: RefreshCw, gradient: 'from-emerald-500 via-teal-600 to-cyan-600', blob: 'bg-lime-300/30' },
  { Icon: MessageSquare, gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', blob: 'bg-pink-300/30' },
];

const HomeHeroCarousel = () => {
  const { language, t } = useLanguage();
  const slides = translations[language]?.home?.carouselSlides || translations.tr.home.carouselSlides;
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((index) => {
    if (animating) return;
    setAnimating(true);
    setActive((index + slides.length) % slides.length);
    setTimeout(() => setAnimating(false), 600);
  }, [animating, slides.length]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative pt-10 md:pt-12 pb-2 md:pb-3 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-6 max-w-7xl">
        <div className="w-full relative">
          <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/50">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {slides.map((slide, index) => {
                const { Icon, gradient, blob } = SLIDE_META[index] || SLIDE_META[0];
                const isActive = index === active;

                return (
                  <div
                    key={slide.title}
                    className={`min-w-full bg-gradient-to-br ${gradient} text-white relative`}
                  >
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className={`absolute -top-10 -right-10 w-64 h-64 rounded-full ${blob} blur-2xl`} />
                      <div className={`absolute bottom-0 left-10 w-48 h-48 rounded-full ${blob} blur-xl`} />
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-14 min-h-[340px]">
                      <div className="order-2 md:order-1 space-y-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm">
                          {index + 1} / {slides.length}
                        </span>
                        <h2
                          className={`text-3xl md:text-4xl font-bold leading-tight transition-all duration-700 ${
                            isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                          }`}
                        >
                          {slide.title}
                        </h2>
                        <p
                          className={`text-lg md:text-xl text-white/95 leading-relaxed max-w-2xl lg:max-w-3xl transition-all duration-700 delay-150 ${
                            isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
                          }`}
                        >
                          {slide.message}
                        </p>
                        {index === 0 && (
                          <div
                            className={`flex flex-wrap gap-3 pt-4 transition-all duration-700 delay-300 ${
                              isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            }`}
                          >
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
                        <div
                          className={`relative transition-all duration-700 ${
                            isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-60'
                          }`}
                        >
                          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-inner">
                            <Icon className="w-24 h-24 md:w-28 md:h-28 text-white drop-shadow-lg" strokeWidth={1.25} />
                          </div>
                          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-2xl bg-white/20 rotate-12 backdrop-blur-sm" />
                          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
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
