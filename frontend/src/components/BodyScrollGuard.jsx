import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resetBodyInteraction } from '../lib/resetBodyInteraction';

/**
 * Safety net: restore body interaction after route changes or stuck overlay cleanup.
 */
const BodyScrollGuard = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    resetBodyInteraction();
  }, [pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) resetBodyInteraction();
    };
    window.addEventListener('pageshow', resetBodyInteraction);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pageshow', resetBodyInteraction);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
};

export default BodyScrollGuard;
