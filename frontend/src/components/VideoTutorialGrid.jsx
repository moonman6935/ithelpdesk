import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Play } from 'lucide-react';
import VideoEmbed from './VideoEmbed';
import { getVideoThumbnail } from '../lib/videoEmbed';

function VideoExpandPlayer({ video, title, sourceRect, onClose }) {
  const [phase, setPhase] = useState('start');
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('expand'));
    });
    const playerTimer = setTimeout(() => setShowPlayer(true), 480);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(playerTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleClose = () => {
    setPhase('close');
    setTimeout(onClose, 450);
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
        className={`video-expand-shell ${isClosing ? 'video-expand-shell--close' : ''}`}
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
      >
        <div className="video-expand-shell__header">
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
        <div className="video-expand-shell__player">
          {showPlayer && !isClosing ? (
            <VideoEmbed url={video.video_url} title={title} autoplay />
          ) : (
            <div className="w-full aspect-video bg-black/80" />
          )}
        </div>
      </div>
    </>
  );
}

export function VideoThumbnailCard({ video, title, onPlay }) {
  const thumbnail = getVideoThumbnail(video.video_url);
  const thumbRef = React.useRef(null);

  const handleClick = () => {
    const el = thumbRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    onPlay(video, title, rect);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="video-thumb-card group text-left w-full rounded-2xl overflow-hidden border border-white/60 bg-white shadow-md hover:shadow-xl transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <div
        ref={thumbRef}
        className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800 via-cyan-900 to-slate-900"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/40 via-slate-800 to-indigo-900" />
        )}
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-14 h-14 rounded-full bg-white/90 text-cyan-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Play className="w-7 h-7 ml-0.5 fill-current" />
          </span>
        </div>
      </div>
      <div className="p-4 bg-gradient-to-r from-cyan-50/90 to-white">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-cyan-800 transition-colors">
          {title}
        </p>
      </div>
    </button>
  );
}

export function VideoTutorialGrid({ videos, language, getTitle }) {
  const [active, setActive] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {videos.map((video) => {
          const title = getTitle(video, language);
          return (
            <VideoThumbnailCard
              key={video.id}
              video={video}
              title={title}
              onPlay={(v, t, rect) => setActive({ video: v, title: t, rect })}
            />
          );
        })}
      </div>

      {active &&
        createPortal(
          <VideoExpandPlayer
            video={active.video}
            title={active.title}
            sourceRect={active.rect}
            onClose={() => setActive(null)}
          />,
          document.body
        )}
    </>
  );
}

export default VideoTutorialGrid;
