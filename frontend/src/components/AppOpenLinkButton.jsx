import React from 'react';
import { Link } from 'react-router-dom';
import { useAppOpenTransition } from '../contexts/AppOpenTransitionContext';
import { Button } from './ui/button';

/**
 * Button that triggers iPhone-style expand transition before navigating.
 */
export function AppOpenLinkButton({
  to,
  gradientClasses,
  blob = 'bg-white/20',
  accent = 'bg-white/10',
  Icon,
  title,
  children,
  buttonClassName = '',
  variant = 'brand',
}) {
  const { openFromElement } = useAppOpenTransition();

  const handleClick = (e) => {
    e.preventDefault();
    const el = e.currentTarget.querySelector('[data-app-card]');
    if (!el) return;
    openFromElement(el, {
      to,
      gradientClasses,
      blob,
      accent,
      Icon,
      title: title || (typeof children === 'string' ? children : ''),
    });
  };

  return (
    <Link to={to} onClick={handleClick}>
      <Button
        data-app-card
        size="lg"
        variant={variant}
        className={`app-card-source shadow-lg ${buttonClassName}`}
      >
        {children}
      </Button>
    </Link>
  );
}

export default AppOpenLinkButton;
