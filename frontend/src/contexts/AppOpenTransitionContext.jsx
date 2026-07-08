import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppOpenOverlay from '../components/AppOpenOverlay';

const AppOpenTransitionContext = createContext(null);

/** Expand animation duration (matches CSS) */
const EXPAND_MS = 520;
/** Pause on full screen so title can be read */
const HOLD_MS = 1100;
const REVEAL_MS = 450;

export function AppOpenTransitionProvider({ children }) {
  const navigate = useNavigate();
  const [transition, setTransition] = useState(null);
  const skipNextRouteTransition = useRef(false);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const consumeSkipRouteTransition = useCallback(() => {
    if (skipNextRouteTransition.current) {
      skipNextRouteTransition.current = false;
      return true;
    }
    return false;
  }, []);

  const openFromElement = useCallback((element, { to, gradientClasses, blob, accent, Icon, title }) => {
    if (!element || !to) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      navigate(to);
      return;
    }

    clearTimers();
    const rect = element.getBoundingClientRect();

    skipNextRouteTransition.current = true;
    element.classList.add('app-card-hidden');
    setTransition({
      phase: 'start',
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      gradientClasses,
      blob,
      accent,
      Icon,
      title,
      to,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransition((prev) => (prev ? { ...prev, phase: 'expand' } : null));
      });
    });

    timersRef.current.push(
      setTimeout(() => {
        setTransition((prev) => (prev ? { ...prev, phase: 'hold' } : null));
      }, EXPAND_MS),
      setTimeout(() => {
        navigate(to);
        setTransition((prev) => (prev ? { ...prev, phase: 'reveal' } : null));
      }, EXPAND_MS + HOLD_MS),
      setTimeout(() => {
        element.classList.remove('app-card-hidden');
        setTransition(null);
      }, EXPAND_MS + HOLD_MS + REVEAL_MS)
    );
  }, [navigate]);

  const isTransitioning = transition !== null;

  return (
    <AppOpenTransitionContext.Provider
      value={{ openFromElement, isTransitioning, consumeSkipRouteTransition }}
    >
      {children}
      {transition && <AppOpenOverlay {...transition} />}
    </AppOpenTransitionContext.Provider>
  );
}

export function useAppOpenTransition() {
  const ctx = useContext(AppOpenTransitionContext);
  if (!ctx) {
    throw new Error('useAppOpenTransition must be used within AppOpenTransitionProvider');
  }
  return ctx;
}

export default AppOpenTransitionContext;
