import React from 'react';
import { X, Sliders, Moon, Sun, Sparkles, Shield, Trash2 } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  ambientMode,
  onToggleTheme,
  onClearAllData
}) {
  const isLight = ambientMode === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-[32px] p-6 font-victor animate-in zoom-in-95 duration-200 select-none shadow-2xl ${
          isLight ? 'bg-white/95 text-slate-900 border border-slate-200' : 'text-white'
        }`}
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(18, 22, 30, 0.55)',
          backdropFilter: 'blur(36px) saturate(160%)',
          WebkitBackdropFilter: 'blur(36px) saturate(160%)',
          boxShadow: isLight ? '0 32px 64px -16px rgba(0, 0, 0, 0.2)' : '0 32px 64px -16px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-800' : 'bg-white/5 border border-white/10 text-white/80'
            }`}>
              <Sliders size={15} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>System Settings</h3>
              <p className={`text-[10.5px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>Astrx Intelligence Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/8'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          {/* Ambient Mode */}
          <div className={`flex items-center justify-between p-3.5 rounded-[20px] border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/[0.06]'
          }`}>
            <div className="space-y-0.5">
              <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Lighting Atmosphere</span>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Current: <span className={`capitalize font-medium ${isLight ? 'text-slate-800' : 'text-white/70'}`}>{ambientMode}</span></p>
            </div>
            <button
              onClick={onToggleTheme}
              className={`px-3.5 py-1.5 rounded-[14px] text-xs transition-colors cursor-pointer capitalize font-medium ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-900' : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              Toggle Theme
            </button>
          </div>

          {/* Model Engine */}
          <div className={`p-3.5 rounded-[20px] border space-y-1 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/[0.06]'
          }`}>
            <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>Neural Reasoning Core</span>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
              Astracore 4 & Groq LLM integration with Multimodal Vision & PDF extraction.
            </p>
          </div>

          {/* Clear Cache */}
          <div className={`flex items-center justify-between p-3.5 rounded-[20px] border ${
            isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/[0.08] border-rose-500/20'
          }`}>
            <div className="space-y-0.5">
              <span className="font-medium text-rose-600">Reset Local Storage</span>
              <p className={`text-[11px] ${isLight ? 'text-rose-500/80' : 'text-rose-400/70'}`}>Clear saved chats and preferences</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all chat data?')) {
                  onClearAllData();
                  onClose();
                }
              }}
              className={`px-3.5 py-1.5 rounded-[14px] text-xs transition-colors cursor-pointer font-medium ${
                isLight ? 'bg-rose-100 hover:bg-rose-200 text-rose-700' : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        <div className={`pt-3 border-t flex items-center justify-between text-[11px] ${
          isLight ? 'border-slate-200 text-slate-400' : 'border-white/[0.08] text-white/40'
        }`}>
          <span>ASTRX Intelligence v2.0</span>
          <span>© 2026 ASTRX</span>
        </div>
      </div>
    </div>
  );
}
