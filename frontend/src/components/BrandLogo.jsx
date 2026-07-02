import React from 'react';

const LOGO_SRC = `${process.env.PUBLIC_URL}/brand/dcs-logo-transparent.png`;

const VARIANTS = {
  light: 'brand-logo brand-logo--light',
  dark: 'brand-logo brand-logo--dark',
  muted: 'brand-logo brand-logo--dark brand-logo--muted',
};

const BrandLogo = ({
  variant = 'dark',
  className = '',
  alt = 'DCS Logo',
  ...props
}) => (
  <img
    src={LOGO_SRC}
    alt={alt}
    className={`${VARIANTS[variant] || VARIANTS.dark} ${className}`.trim()}
    loading="lazy"
    {...props}
  />
);

export default BrandLogo;
