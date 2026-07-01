import React from 'react';
import { getVideoEmbedInfo } from '../lib/videoEmbed';

const VideoEmbed = ({ url, title }) => {
  const info = getVideoEmbedInfo(url);
  if (!info) return null;

  if (info.type === 'direct') {
    return (
      <video
        src={info.embedUrl}
        controls
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

  return (
    <iframe
      src={info.embedUrl}
      title={title}
      className="w-full aspect-video rounded-xl bg-black"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export default VideoEmbed;
