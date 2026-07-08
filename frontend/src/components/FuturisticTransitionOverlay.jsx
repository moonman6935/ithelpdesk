import React from 'react';

const FuturisticTransitionOverlay = ({ active }) => {
  if (!active) return null;

  return (
    <div className="ft-overlay" aria-hidden="true">
      <div className="ft-overlay__flash" />
      <div className="ft-overlay__grid" />
      <div className="ft-overlay__sweep" />
      <div className="ft-overlay__scanline" />
    </div>
  );
};

export default FuturisticTransitionOverlay;
