import React from 'react';

const LOGO_SOURCES = {
  mark: `${process.env.PUBLIC_URL}/brand/dcs-logo-mark.png`,
  full: `${process.env.PUBLIC_URL}/brand/dcs-logo-tight.png`,
};

const VARIANTS = {
  light: 'brand-logo brand-logo--light',
  dark: 'brand-logo brand-logo--dark',
  muted: 'brand-logo brand-logo--light brand-logo--muted',
};

const FRAMES = {
  header: 'brand-logo-frame brand-logo-frame--header',
  footer: 'brand-logo-frame brand-logo-frame--footer',
  subtle: 'brand-logo-frame brand-logo-frame--subtle',
};

const BrandLogo = ({
  variant = 'light',
  framed = false,
  frame = 'header',
  crop = 'mark',
  className = '',
  alt = 'DCS Logo',
  ...props
}) => {
  const image = (
    <img
      src={LOGO_SOURCES[crop] || LOGO_SOURCES.mark}
      alt={alt}
      className={`${VARIANTS[variant] || VARIANTS.light} ${className}`.trim()}
      loading="lazy"
      {...props}
    />
  );

  if (!framed) return image;

  return <div className={FRAMES[frame] || FRAMES.header}>{image}</div>;
};

export default BrandLogo;
