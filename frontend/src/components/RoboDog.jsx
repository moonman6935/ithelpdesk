import React from 'react';
import { Search } from 'lucide-react';

export const ROBO_DOG_SRC = `${process.env.PUBLIC_URL}/robo/robo-dog.png`;

/**
 * Windows XP search companion dog (user-provided asset).
 * mode: roam | still | search
 */
const RoboDog = ({
  mode = 'still',
  size = 'md',
  className = '',
  showGlass = false,
}) => {
  const height =
    size === 'fab' ? 44 : size === 'sm' ? 48 : size === 'stage' ? 140 : size === 'lg' ? 100 : 64;

  const modeClass =
    mode === 'roam' ? 'robo-dog-img--roam' : mode === 'search' ? 'robo-dog-img--search' : 'robo-dog-img--still';

  return (
    <div
      className={`robo-dog-img-wrap ${modeClass} robo-dog-img-wrap--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <img
        src={ROBO_DOG_SRC}
        alt=""
        className="robo-dog-img"
        style={{ height }}
        draggable={false}
      />
      {(showGlass || mode === 'search') && (
        <div className="robo-dog-img__glass" aria-hidden="true">
          <Search className="robo-dog-img__glass-icon" strokeWidth={2.5} />
        </div>
      )}
      {mode === 'search' && (
        <div className="robo-dog-img__sniff-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
};

export function RoboDogArena({ mode, hint }) {
  return (
    <div className="robo-arena" aria-hidden="true">
      <div className="robo-arena__glow" />
      <div className="robo-arena__floor" />
      {mode === 'search' && hint && (
        <p className="robo-arena__hint">{hint}</p>
      )}
      <RoboDog mode={mode} size="stage" showGlass={mode === 'search'} />
    </div>
  );
}

export default RoboDog;
