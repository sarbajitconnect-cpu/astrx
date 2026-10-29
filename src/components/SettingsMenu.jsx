import React, { useRef, useEffect } from 'react';
import { Sun, Trash2 } from 'lucide-react';

export default function SettingsMenu({
  isOpen,
  onClose,
  ambientMode,
  isLight = false,
  onToggleTheme,
  onClearAllData
}) {
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute bottom-2 left-full ml-3 w-56 rounded-[24px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-[12.5px] font-victor"
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(20, 22, 28, 0.90)',
        backdropFilter: 'blur(40px) saturate(140%)',
        WebkitBackdropFilter: 'blur(40px) saturate(140%)',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        boxShadow: isLight ? '0 20px 40px -10px rgba(0, 0, 0, 0.15)' : '0 24px 48px -12px rgba(0, 0, 0, 0.75)'
      }}
    >
      <div className="flex flex-col gap-0.5">
        {/* Toggle Theme */}
        <button
          onClick={() => {
            onToggleTheme();
          }}
          className={`w-full flex items-center justify-between px-3.5 h-9 rounded-[18px] text-left transition-all duration-150 cursor-pointer ${
            isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <span>Toggle theme</span>
          <span className={`text-[10.5px] px-2 py-0.5 rounded-[10px] font-medium capitalize ${
            isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/[0.08] text-white/80'
          }`}>
            {ambientMode}
          </span>
        </button>

        {/* Concentric Divider */}
        <div className={`my-1 mx-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`} />

        {/* Clear Data */}
        <button
          onClick={() => {
            if (confirm('Clear all conversation history?')) {
              onClearAllData();
              onClose();
            }
          }}
          className="w-full flex items-center justify-between px-3.5 h-9 rounded-[18px] text-left text-rose-500/90 hover:text-rose-600 hover:bg-rose-500/[0.08] transition-all duration-150 cursor-pointer"
        >
          <span>Clear all data</span>
          <Trash2 size={13} className="text-rose-500/60" />
        </button>
      </div>
    </div>
  );
}
