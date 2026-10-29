import React from 'react';

export const PREDEFINED_AVATARS = [
  {
    id: 'initial',
    name: 'Initial',
    type: 'initial'
  },
  {
    id: 'astrx-star',
    name: 'Nova',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
      </svg>
    )
  },
  {
    id: 'constellation',
    name: 'Astrx',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 3L4 20h16L12 3z" />
        <path d="M7.5 13.5h9" />
        <circle cx="12" cy="3" r="1.5" fill="currentColor" />
        <circle cx="4" cy="20" r="1.5" fill="currentColor" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'orbit',
    name: 'Orbit',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
      </svg>
    )
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 0 0 16 8 8 0 0 1 0-16z" fill="currentColor" fillOpacity="0.3" />
      </svg>
    )
  },
  {
    id: 'prism',
    name: 'Prism',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 2l8 8-8 12L4 10l8-8z" />
        <path d="M12 2v20" strokeOpacity="0.4" />
        <path d="M4 10h16" strokeOpacity="0.4" />
      </svg>
    )
  },
  {
    id: 'spiral',
    name: 'Vortex',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 12a2 2 0 1 0-2-2" />
        <path d="M12 7a5 5 0 1 1-5 5" />
        <path d="M12 2a10 10 0 1 0 10 10" />
      </svg>
    )
  },
  {
    id: 'spark',
    name: 'Spark',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 3c0 4.5-3.5 8-8 8 4.5 0 8 3.5 8 8 0-4.5 3.5-8 8-8-4.5 0-8-3.5-8-8z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    )
  }
];

export default function UserAvatar({
  avatarId,
  username = '',
  size = 20,
  isLight = false,
  className = ''
}) {
  const initial = username ? username.charAt(0).toUpperCase() : 'U';
  const selectedAvatar = PREDEFINED_AVATARS.find(a => a.id === avatarId && a.id !== 'initial');

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-semibold font-victor shrink-0 shadow-sm transition-all select-none ${
        isLight ? 'text-slate-900 bg-black/10' : 'text-white/90 bg-white/15'
      } ${className}`}
      style={{
        width: size,
        height: size,
        padding: selectedAvatar ? Math.max(2, Math.round(size * 0.18)) : 0
      }}
    >
      {selectedAvatar ? (
        <div className={`w-full h-full flex items-center justify-center ${
          isLight ? 'text-slate-900' : 'text-white/90'
        }`}>
          {selectedAvatar.svg}
        </div>
      ) : (
        <span 
          style={{ fontSize: Math.max(9, Math.round(size * 0.46)) }}
          className="leading-none flex items-center justify-center"
        >
          {initial}
        </span>
      )}
    </div>
  );
}
