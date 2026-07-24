import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import FuturisticTransitionOverlay from './FuturisticTransitionOverlay';
import { useAppOpenTransition } from '../contexts/AppOpenTransitionContext';
import Home from '../pages/Home';
import PCSetup from '../pages/PCSetup';
import HeadsetTest from '../pages/HeadsetTest';
import Troubleshooting from '../pages/Troubleshooting';
import AssetConfirmation from '../pages/AssetConfirmation';
import CargoStatus from '../pages/CargoStatus';
import AdminDashboard from '../pages/AdminDashboard';
import FAQ from '../pages/FAQ';
import CitrixSetup from '../pages/CitrixSetup';
import MacSetup from '../pages/MacSetup';
import Windows11Upgrade from '../pages/Windows11Upgrade';
import AgentFirstSetup from '../pages/AgentFirstSetup';
import SystemCheck from '../pages/SystemCheck';
import VideoTutorials from '../pages/VideoTutorials';
import LoginPage from '../pages/LoginPage';

const AnimatedRoutes = () => {
  const location = useLocation();
  const { consumeSkipRouteTransition } = useAppOpenTransition();
  const [overlay, setOverlay] = useState(false);
  const [entering, setEntering] = useState(true);
  const isFirst = useRef(true);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      const t = setTimeout(() => setEntering(false), 700);
      return () => clearTimeout(t);
    }

    if (consumeSkipRouteTransition() || reducedMotion.current) {
      setEntering(false);
      setOverlay(false);
      return;
    }

    setOverlay(true);
    setEntering(true);

    const hideOverlay = setTimeout(() => setOverlay(false), 550);
    const endEnter = setTimeout(() => setEntering(false), 700);

    return () => {
      clearTimeout(hideOverlay);
      clearTimeout(endEnter);
    };
  }, [location.pathname, consumeSkipRouteTransition]);

  const pageClass = entering && !reducedMotion.current ? 'ft-page-enter' : '';

  return (
    <>
      <FuturisticTransitionOverlay active={overlay} />
      <div key={location.pathname} className={`relative ${pageClass}`}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/pc-setup" element={<PCSetup />} />
          <Route path="/headset-test" element={<HeadsetTest />} />
          <Route path="/troubleshooting" element={<Troubleshooting />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/faq/citrix-kurulum" element={<CitrixSetup />} />
          <Route path="/faq/mac-kurulum" element={<MacSetup />} />
          <Route path="/windows-11-upgrade" element={<Windows11Upgrade />} />
          <Route path="/agent-ilk-kurulum" element={<AgentFirstSetup />} />
          <Route path="/sistem-kontrol" element={<SystemCheck />} />
          <Route path="/video-tutorials" element={<VideoTutorials />} />
          <Route path="/asset-confirmation" element={<AssetConfirmation />} />
          <Route path="/cargo-status" element={<CargoStatus />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </>
  );
};

export default AnimatedRoutes;
