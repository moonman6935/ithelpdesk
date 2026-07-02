import React from 'react';

const LOGO_SRC = `${process.env.PUBLIC_URL}/brand/dcs-logo-transparent.png`;

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
  className = '',
  alt = 'DCS Logo',
  ...props
}) => {
  const image = (
    <img
      src={LOGO_SRC}
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
