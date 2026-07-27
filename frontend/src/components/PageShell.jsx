import React from 'react';

export const PAGE_THEMES = {
  red: {
    gradient: 'from-red-500 via-red-600 to-orange-500',
    blob: 'bg-yellow-300/20',
    accent: 'bg-orange-300/15',
  },
  blue: {
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    blob: 'bg-sky-300/20',
    accent: 'bg-indigo-300/15',
  },
  emerald: {
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    blob: 'bg-lime-300/20',
    accent: 'bg-cyan-300/15',
  },
  orange: {
    gradient: 'from-orange-500 via-amber-500 to-red-500',
    blob: 'bg-yellow-300/20',
    accent: 'bg-amber-300/15',
  },
  violet: {
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-700',
    blob: 'bg-pink-300/20',
    accent: 'bg-fuchsia-300/15',
  },
  rose: {
    gradient: 'from-rose-500 via-pink-600 to-red-600',
    blob: 'bg-rose-300/20',
    accent: 'bg-pink-300/15',
  },
  cyan: {
    gradient: 'from-cyan-500 via-sky-600 to-blue-700',
    blob: 'bg-sky-300/20',
    accent: 'bg-blue-300/15',
  },
  slate: {
    gradient: 'from-slate-700 via-slate-800 to-gray-900',
    blob: 'bg-slate-300/20',
    accent: 'bg-slate-400/15',
  },
};

const PageShell = ({
  theme = 'red',
  icon: Icon,
  title,
  subtitle,
  children,
  maxWidth = '',
  centered = false,
  hideHero = false,
}) => {
  const colors = PAGE_THEMES[theme] || PAGE_THEMES.red;

  if (centered) {
    return (
      <div className="site-container py-12 flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className={`w-full ${maxWidth}`}>{children}</div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 md:py-14">
      <div className={`site-container ${maxWidth}`.trim()}>
        {!hideHero && Icon && title && (
          <div
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg sm:shadow-xl border border-white/20 mb-5 sm:mb-10 p-5 sm:p-8 md:p-12 ft-page-enter`}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden decorative-blur">
              <div className={`absolute -top-10 -right-10 w-36 sm:w-48 h-36 sm:h-48 rounded-full ${colors.blob} blur-2xl`} />
              <div className={`absolute bottom-0 left-8 w-24 sm:w-32 h-24 sm:h-32 rounded-full ${colors.accent} blur-xl`} />
            </div>
            <div className="relative flex flex-row items-center gap-3 sm:gap-6 text-left">
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/15 sm:backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-2">{title}</h1>
                {subtitle && <p className="text-sm sm:text-lg text-white/90 max-w-2xl line-clamp-2 sm:line-clamp-none">{subtitle}</p>}
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export function StaggerChildren({ children, className = '' }) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        return (
          <div
            className="ft-stagger-item"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default PageShell;
