import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 3D extruded toy shell */}
      <rect x="6" y="8" width="52" height="52" rx="16" fill="#C92A5B" />
      <rect x="6" y="5" width="52" height="51" rx="16" fill="#FF5E8E" />
      <rect
        x="8"
        y="7"
        width="48"
        height="47"
        rx="14"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {/* Glossy dark display */}
      <rect x="13" y="12" width="38" height="14" rx="5" fill="#161829" />
      <path
        d="M15 14.5C15 13.6716 15.6716 13 16.5 13H47.5C48.3284 13 49 13.6716 49 14.5V16.5C39 17.8 25 17.8 15 16.5V14.5Z"
        fill="white"
        fillOpacity="0.12"
      />
      <circle cx="43.5" cy="19" r="2" fill="#2EE59D" />

      {/* Playful 3D buttons */}
      <rect x="13" y="32" width="11" height="10" rx="3.5" fill="#D4A11E" />
      <rect x="13" y="30.5" width="11" height="9.5" rx="3.5" fill="#FFE066" />

      <rect x="26.5" y="32" width="11" height="10" rx="3.5" fill="#2396A8" />
      <rect x="26.5" y="30.5" width="11" height="9.5" rx="3.5" fill="#56CFE1" />

      <rect x="13" y="45" width="24.5" height="9.5" rx="3.5" fill="#D5D0DC" />
      <rect x="13" y="43.5" width="24.5" height="9" rx="3.5" fill="#FFFFFF" />

      {/* Prominent playful Equal key */}
      <rect x="40.5" y="32" width="10.5" height="22.5" rx="4" fill="#109E66" />
      <rect x="40.5" y="30.5" width="10.5" height="21.5" rx="4" fill="#2EE59D" />
      <rect x="43" y="38.5" width="5.5" height="1.8" rx="0.9" fill="#053321" />
      <rect x="43" y="42.2" width="5.5" height="1.8" rx="0.9" fill="#053321" />
    </svg>
  );
};
