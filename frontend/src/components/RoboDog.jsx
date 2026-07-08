import React from 'react';

/**
 * XP-style search companion dog — original stylized mascot with wagging tail.
 */
const RoboDog = ({ size = 'md', className = '', animated = true }) => {
  const px = size === 'sm' ? 40 : size === 'lg' ? 64 : size === 'xl' ? 80 : 52;

  return (
    <svg
      viewBox="0 0 80 80"
      width={px}
      height={px}
      className={`robo-dog ${animated ? 'robo-dog--animated' : ''} ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      {/* Shadow */}
      <ellipse cx="42" cy="72" rx="22" ry="4" fill="rgba(0,0,0,0.12)" />

      {/* Tail */}
      <g className="robo-dog__tail">
        <path
          d="M18 44 C8 36 4 28 8 20 C10 16 14 18 16 24 C18 30 20 38 22 42 Z"
          fill="#D4922A"
          stroke="#B8731A"
          strokeWidth="1"
        />
      </g>

      {/* Back legs */}
      <ellipse cx="30" cy="62" rx="7" ry="9" fill="#E8A82E" />
      <ellipse cx="50" cy="62" rx="7" ry="9" fill="#E8A82E" />

      {/* Body */}
      <g className="robo-dog__body">
        <ellipse cx="42" cy="48" rx="24" ry="20" fill="#F5C542" stroke="#D4922A" strokeWidth="1.2" />
        <ellipse cx="42" cy="52" rx="16" ry="12" fill="#F9D56E" opacity="0.55" />

        {/* Front paws */}
        <ellipse cx="28" cy="64" rx="6" ry="5" fill="#F5C542" stroke="#D4922A" strokeWidth="0.8" />
        <ellipse cx="56" cy="64" rx="6" ry="5" fill="#F5C542" stroke="#D4922A" strokeWidth="0.8" />

        {/* Head */}
        <g className="robo-dog__head">
          <circle cx="42" cy="28" r="20" fill="#F5C542" stroke="#D4922A" strokeWidth="1.2" />

          {/* Ears */}
          <g className="robo-dog__ear robo-dog__ear--left">
            <ellipse cx="26" cy="18" rx="9" ry="13" fill="#C47A1A" transform="rotate(-25 26 18)" />
            <ellipse cx="27" cy="19" rx="5" ry="8" fill="#E8A04A" transform="rotate(-25 27 19)" />
          </g>
          <g className="robo-dog__ear robo-dog__ear--right">
            <ellipse cx="58" cy="18" rx="9" ry="13" fill="#C47A1A" transform="rotate(25 58 18)" />
            <ellipse cx="57" cy="19" rx="5" ry="8" fill="#E8A04A" transform="rotate(25 57 19)" />
          </g>

          {/* Snout */}
          <ellipse cx="42" cy="34" rx="12" ry="9" fill="#F9E6A8" />
          <ellipse cx="42" cy="38" rx="8" ry="5" fill="#FFF8E7" />

          {/* Nose */}
          <ellipse cx="42" cy="36" rx="4.5" ry="3.2" fill="#2D1810" />
          <ellipse cx="40.5" cy="35" rx="1.2" ry="0.8" fill="#5C3D2E" opacity="0.5" />

          {/* Mouth */}
          <path d="M42 38 Q38 42 35 40" fill="none" stroke="#B8731A" strokeWidth="1" strokeLinecap="round" />
          <path d="M42 38 Q46 42 49 40" fill="none" stroke="#B8731A" strokeWidth="1" strokeLinecap="round" />

          {/* Eyes */}
          <g className="robo-dog__eyes">
            <circle cx="34" cy="26" r="5.5" fill="#fff" stroke="#D4922A" strokeWidth="0.6" />
            <circle cx="50" cy="26" r="5.5" fill="#fff" stroke="#D4922A" strokeWidth="0.6" />
            <circle cx="35" cy="26.5" r="2.8" fill="#1a1a1a" />
            <circle cx="51" cy="26.5" r="2.8" fill="#1a1a1a" />
            <circle cx="36" cy="25.2" r="1" fill="#fff" />
            <circle cx="52" cy="25.2" r="1" fill="#fff" />
          </g>

          {/* Collar */}
          <path
            d="M26 36 Q42 44 58 36"
            fill="none"
            stroke="#E53935"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="42" cy="41" r="3" fill="#FFD54F" stroke="#F9A825" strokeWidth="0.8" />
        </g>

        {/* Magnifying glass — search assistant nod */}
        <g className="robo-dog__glass">
          <circle cx="62" cy="50" r="9" fill="rgba(255,255,255,0.35)" stroke="#5D4037" strokeWidth="2" />
          <circle cx="62" cy="50" r="6" fill="rgba(200,230,255,0.45)" stroke="#78909C" strokeWidth="1" />
          <line x1="68" y1="56" x2="74" y2="62" stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

export default RoboDog;
