import React from 'react';

const AppOpenOverlay = ({ phase, rect, gradientClasses, blob, accent, Icon, title }) => {
  const isExpanded = phase === 'expand' || phase === 'reveal';
  const isRevealing = phase === 'reveal';

  return (
    <>
      <div
        className="app-open-backdrop"
        style={{ opacity: phase === 'start' ? 0 : isRevealing ? 0 : 0.55 }}
        aria-hidden="true"
      />

      <div
        className={`app-open-shell ${gradientClasses}`}
        data-phase={phase}
        style={{
          top: isExpanded ? 0 : rect.top,
          left: isExpanded ? 0 : rect.left,
          width: isExpanded ? '100vw' : rect.width,
          height: isExpanded ? '100vh' : rect.height,
          borderRadius: isExpanded ? 0 : 24,
          opacity: isRevealing ? 0 : 1,
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-8 -right-8 w-40 h-40 rounded-full ${blob} blur-2xl opacity-80`} />
          <div className={`absolute bottom-4 left-4 w-24 h-24 rounded-full ${accent} blur-xl opacity-80`} />
        </div>

        <div className="app-open-icon-layer absolute inset-0 flex flex-col items-center justify-center text-white">
          {Icon && (
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-4 shadow-2xl">
              <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          )}
          {title && (
            <p className="text-lg font-bold text-center px-6 max-w-xs drop-shadow-lg">{title}</p>
          )}
        </div>

        <div className="app-open-shimmer" />
      </div>
    </>
  );
};

export default AppOpenOverlay;
