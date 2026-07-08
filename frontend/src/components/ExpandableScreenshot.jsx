import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';

function ImageExpandOverlay({ src, alt, title, sourceRect, onClose, darkFrame }) {
  const [phase, setPhase] = useState('start');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('expand'));
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleClose = () => {
    setPhase('close');
    window.setTimeout(onClose, 450);
  };

  const isExpanded = phase === 'expand' || phase === 'close';
  const isClosing = phase === 'close';

  return (
    <>
      <div
        className={`video-expand-backdrop ${isExpanded ? 'video-expand-backdrop--visible' : ''} ${isClosing ? 'video-expand-backdrop--hide' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={`video-expand-shell image-expand-shell ${isClosing ? 'video-expand-shell--close' : ''}`}
        style={
          isExpanded
            ? undefined
            : {
                top: sourceRect.top,
                left: sourceRect.left,
                width: sourceRect.width,
                height: sourceRect.height,
              }
        }
        data-phase={phase}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="video-expand-shell__header image-expand-shell__header">
          <h3 className="video-expand-shell__title">{title}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="video-expand-shell__close"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`image-expand-shell__body ${darkFrame ? 'bg-[#0d4f5c]' : 'bg-white'}`}>
          <img src={src} alt={alt} className="w-full block" />
        </div>
      </div>
    </>
  );
}

const ExpandableScreenshot = ({
  src,
  alt,
  title,
  darkFrame = false,
  className = '',
}) => {
  const thumbRef = useRef(null);
  const [active, setActive] = useState(null);

  const handleClick = () => {
    const el = thumbRef.current;
    if (!el) return;
    setActive({ rect: el.getBoundingClientRect() });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`group relative w-full rounded-xl overflow-hidden border-2 shadow-md hover:shadow-xl transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-left ${className} ${
          darkFrame ? 'border-gray-200 bg-[#0d4f5c]' : 'border-gray-200 bg-white'
        }`}
      >
        <div ref={thumbRef} className="relative overflow-hidden">
          <img
            src={src}
            alt={alt}
            className="w-full h-44 sm:h-48 object-cover object-top block"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="w-12 h-12 rounded-full bg-white/90 text-indigo-700 flex items-center justify-center shadow-lg">
              <ZoomIn className="w-6 h-6" />
            </span>
          </div>
        </div>
        <p className="text-xs text-center text-indigo-600 font-medium py-2 px-2 bg-indigo-50/80 group-hover:bg-indigo-100/90 transition-colors">
          {title}
        </p>
      </button>

      {active &&
        createPortal(
          <ImageExpandOverlay
            src={src}
            alt={alt}
            title={title}
            sourceRect={active.rect}
            onClose={() => setActive(null)}
            darkFrame={darkFrame}
          />,
          document.body
        )}
    </>
  );
};

export default ExpandableScreenshot;
