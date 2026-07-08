import React from 'react';
import { getVideoEmbedInfo, getVideoEmbedUrl } from '../lib/videoEmbed';

const VideoEmbed = ({ url, title, autoplay = false }) => {
  const info = getVideoEmbedInfo(url);
  if (!info) return null;

  if (info.type === 'direct') {
    return (
      <video
        src={info.embedUrl}
        controls
        autoPlay={autoplay}
        className="w-full aspect-video rounded-xl bg-black"
        title={title}
      >
        <track kind="captions" />
      </video>
    );
  }

  if (info.type === 'link') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center aspect-video rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        {title}
      </a>
    );
  }

  const embedUrl = getVideoEmbedUrl(url, { autoplay }) || info.embedUrl;

  return (
    <iframe
      src={embedUrl}
      title={title}
      className="w-full aspect-video rounded-xl bg-black"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export default VideoEmbed;
