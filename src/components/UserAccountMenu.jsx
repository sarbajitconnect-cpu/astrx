import React, { useRef, useEffect } from 'react';
import { 
  Sliders, 
  LogOut, 
  Sparkles
} from 'lucide-react';
import UserAvatar from './UserAvatar';

export default function UserAccountMenu({
  isOpen,
  onClose,
  user = {},
  isLight = false,
  onOpenAccountSettings,
  onLogout
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  const totalLimit = user.queryLimit || 50;
  const queriesUsed = user.queriesUsed || 0;
  const queriesRemaining = Math.max(0, totalLimit - queriesUsed);

  return (
    <div
      ref={menuRef}
      className={`absolute top-12 left-3 w-64 rounded-[22px] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-xs font-victor ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 22, 28, 0.94)',
        backdropFilter: 'blur(40px) saturate(140%)',
        WebkitBackdropFilter: 'blur(40px) saturate(140%)',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: isLight ? '0 20px 45px -10px rgba(0, 0, 0, 0.15)' : '0 24px 48px -12px rgba(0, 0, 0, 0.85)'
      }}
    >
      <div className="flex flex-col gap-1">
        
        {/* User Profile & Query Counter Header */}
        <div className={`px-3 py-2.5 flex items-center gap-2.5 rounded-[16px] ${
          isLight ? 'bg-slate-100/90' : 'bg-white/[0.04]'
        }`}>
          <UserAvatar 
            avatarId={user.avatarId} 
            username={user.username} 
            size={28} 
            isLight={isLight}
          />
          <div className="min-w-0 flex-1">
            <p className={`font-medium truncate text-[12px] leading-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {user.username || 'Astrx User'}
            </p>
            <p className={`text-[10px] truncate mt-0.5 font-mono ${
              isLight ? 'text-slate-500' : 'text-white/45'
            }`}>
              {queriesRemaining} / {totalLimit} queries left
            </p>
          </div>
        </div>

        {/* Concentric Divider */}
        <div className={`my-0.5 mx-1 border-t ${
          isLight ? 'border-slate-200' : 'border-white/[0.06]'
        }`} />

        {/* Option 1: Account Settings */}
        <button
          onClick={() => {
            onClose();
            onOpenAccountSettings();
          }}
          className={`w-full flex items-center gap-2.5 px-3 h-8.5 rounded-[14px] text-left transition-all duration-150 cursor-pointer ${
            isLight 
              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
              : 'text-white/75 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Sliders size={13} className={isLight ? 'text-slate-500' : 'text-white/50'} />
          <span className="text-[11.5px] font-medium">Account Settings</span>
        </button>

        {/* Option 2: Log Out */}
        <button
          onClick={() => {
            onClose();
            onLogout();
          }}
          className={`w-full flex items-center gap-2.5 px-3 h-8.5 rounded-[14px] text-left transition-all duration-150 cursor-pointer ${
            isLight
              ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
              : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/[0.08]'
          }`}
        >
          <LogOut size={13} className={isLight ? 'text-rose-500' : 'text-rose-400/60'} />
          <span className="text-[11.5px] font-medium">Log Out</span>
        </button>

      </div>
    </div>
  );
}
