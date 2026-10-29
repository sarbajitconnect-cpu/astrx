import React from 'react';

export default function Background({ ambientMode = 'cosmic', isTemporaryChat = false }) {
  const isLight = ambientMode === 'light' && !isTemporaryChat;

  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 transition-all duration-700 ${
        isTemporaryChat 
          ? 'bg-[#080a0f]' 
          : isLight 
          ? 'bg-[#e2e9f2]' 
          : 'bg-[#18181a]'
      }`}
    >
      {/* Seamless Atmospheric Base Gradient (Mobile & Desktop backdrop) */}
      <div 
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: isTemporaryChat
            ? 'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.04) 0%, #050608 80%)'
            : isLight
            ? 'radial-gradient(ellipse at 50% 16%, #ffffff 0%, #edf2f8 35%, #dae4f0 70%, #c4d3e4 100%)'
            : 'radial-gradient(circle at 50% 15%, rgba(40, 40, 44, 0.45) 0%, rgba(20, 20, 24, 0.85) 55%, #18181a 100%)',
        }}
      />

      {/* Desktop Exact High-Res Atmospheric Background Image (Silk & Dunes) */}
      <img
        src="/background.png"
        alt="ASTRX Background"
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-center scale-[1.01] transition-all duration-700 ease-out"
        style={{
          filter: isTemporaryChat
            ? 'grayscale(100%) brightness(0.35) contrast(1.1)'
            : isLight 
            ? 'invert(1) hue-rotate(195deg) brightness(0.98) contrast(1.15) saturate(0.85)' 
            : 'none',
          opacity: isTemporaryChat ? 0.45 : isLight ? 0.95 : 1
        }}
      />

      {/* Desktop Subtle Lighting Flare / Atmosphere Glow */}
      <div 
        className="hidden md:block absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{
          background: isTemporaryChat
            ? 'radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.04) 0%, transparent 70%)'
            : isLight
            ? 'radial-gradient(ellipse at 85% 25%, rgba(255, 255, 255, 0.85) 0%, rgba(205, 222, 244, 0.5) 45%, transparent 75%)'
            : 'radial-gradient(ellipse at 85% 30%, rgba(255, 246, 224, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Soft Vignette / Ambient Framing */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: isTemporaryChat
            ? 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.85) 100%)'
            : isLight
            ? 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(148, 163, 184, 0.45) 100%)'
            : 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(4, 9, 18, 0.4) 100%)',
        }}
      />
    </div>
  );
}
