import React from 'react';

/**
 * XP search companion–style animated dog (SVG, no raster paste).
 * mode: roam | still | search
 */
const RoboDog = ({
  mode = 'still',
  size = 'md',
  className = '',
  showGlass = false,
}) => {
  const px =
    size === 'fab' ? 44 : size === 'sm' ? 40 : size === 'stage' ? 168 : size === 'lg' ? 72 : 56;

  const glassOn = showGlass || mode === 'search';

  return (
    <div
      className={`robo-dog-wrap robo-dog-wrap--${mode} robo-dog-wrap--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 88"
        width={px}
        height={px * (88 / 96)}
        className="robo-dog"
        focusable="false"
      >
        <ellipse className="robo-dog__shadow" cx="48" cy="82" rx="26" ry="4.5" fill="rgba(0,0,0,0.18)" />

        <g className="robo-dog__tail">
          <path
            d="M22 50 C10 42 6 32 12 22 C15 17 20 20 22 28 C24 36 26 44 28 48 Z"
            fill="#D4922A"
            stroke="#B8731A"
            strokeWidth="1"
          />
        </g>

        <g className="robo-dog__back-legs">
          <ellipse cx="34" cy="70" rx="8" ry="10" fill="#E8A82E" stroke="#C47A1A" strokeWidth="0.8" />
          <ellipse cx="58" cy="70" rx="8" ry="10" fill="#E8A82E" stroke="#C47A1A" strokeWidth="0.8" />
        </g>

        <g className="robo-dog__body">
          <ellipse cx="48" cy="54" rx="26" ry="22" fill="#F5C542" stroke="#D4922A" strokeWidth="1.2" />
          <ellipse cx="48" cy="58" rx="17" ry="13" fill="#F9D56E" opacity="0.5" />
        </g>

        <g className="robo-dog__front-paws">
          <g className="robo-dog__paw robo-dog__paw--left">
            <ellipse cx="32" cy="74" rx="7" ry="6" fill="#F5C542" stroke="#D4922A" strokeWidth="0.8" />
          </g>
          <g className="robo-dog__paw robo-dog__paw--right">
            <ellipse cx="64" cy="74" rx="7" ry="6" fill="#F5C542" stroke="#D4922A" strokeWidth="0.8" />
          </g>
        </g>

        <g className="robo-dog__head">
          <circle cx="48" cy="30" r="22" fill="#F5C542" stroke="#D4922A" strokeWidth="1.2" />

          <g className="robo-dog__ear robo-dog__ear--left">
            <ellipse cx="30" cy="18" rx="10" ry="14" fill="#C47A1A" transform="rotate(-28 30 18)" />
            <ellipse cx="31" cy="19" rx="5.5" ry="9" fill="#E8A04A" transform="rotate(-28 31 19)" />
          </g>
          <g className="robo-dog__ear robo-dog__ear--right">
            <ellipse cx="66" cy="18" rx="10" ry="14" fill="#C47A1A" transform="rotate(28 66 18)" />
            <ellipse cx="65" cy="19" rx="5.5" ry="9" fill="#E8A04A" transform="rotate(28 65 19)" />
          </g>

          <ellipse cx="48" cy="36" rx="13" ry="10" fill="#F9E6A8" />
          <ellipse cx="48" cy="40" rx="9" ry="6" fill="#FFF8E7" />
          <ellipse cx="48" cy="38" rx="5" ry="3.5" fill="#2D1810" />
          <ellipse cx="46.5" cy="37" rx="1.3" ry="0.9" fill="#5C3D2E" opacity="0.45" />

          <path d="M48 40 Q44 44 40 42" fill="none" stroke="#B8731A" strokeWidth="1" strokeLinecap="round" />
          <path d="M48 40 Q52 44 56 42" fill="none" stroke="#B8731A" strokeWidth="1" strokeLinecap="round" />

          <g className="robo-dog__eyes">
            <circle cx="39" cy="28" r="6" fill="#fff" stroke="#D4922A" strokeWidth="0.6" />
            <circle cx="57" cy="28" r="6" fill="#fff" stroke="#D4922A" strokeWidth="0.6" />
            <circle cx="40" cy="28.5" r="3.2" fill="#1a1a1a" />
            <circle cx="58" cy="28.5" r="3.2" fill="#1a1a1a" />
            <circle cx="41.2" cy="27" r="1.2" fill="#fff" />
            <circle cx="59.2" cy="27" r="1.2" fill="#fff" />
          </g>

          <path
            d="M30 38 Q48 46 66 38"
            fill="none"
            stroke="#E53935"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <g className="robo-dog__tag">
            <ellipse cx="48" cy="44" rx="4.5" ry="3" fill="#fff" stroke="#E0E0E0" strokeWidth="0.6" />
            <ellipse cx="48" cy="44" rx="2.8" ry="1.6" fill="#F5F5F5" />
          </g>
        </g>

        <g className={`robo-dog__glass ${glassOn ? 'robo-dog__glass--on' : ''}`}>
          <circle cx="72" cy="56" r="10" fill="rgba(255,255,255,0.4)" stroke="#5D4037" strokeWidth="2.2" />
          <circle cx="72" cy="56" r="6.5" fill="rgba(186,230,253,0.55)" stroke="#78909C" strokeWidth="1" />
          <line x1="79" y1="63" x2="86" y2="70" stroke="#5D4037" strokeWidth="3.2" strokeLinecap="round" />
        </g>
      </svg>

      {mode === 'search' && (
        <div className="robo-dog__sniff-lines" aria-hidden="true">
          <span>?</span>
          <span>?</span>
          <span>?</span>
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
      {mode === 'search' && hint && <p className="robo-arena__hint">{hint}</p>}
      <RoboDog mode={mode} size="stage" showGlass={mode === 'search'} />
    </div>
  );
}

export default RoboDog;
