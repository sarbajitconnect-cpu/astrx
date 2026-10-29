import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

export default function ModelSelector({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  isLight = false,
  position = "right" // "right" | "top-right" | "top-left"
}) {
  const popupRef = useRef(null);
  const [selectedEngine, setSelectedEngine] = useState('Astracore 4');
  const [selectedMode, setSelectedMode] = useState('Quick');

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

  const engines = ['Astracore 4', 'Astracore 4-O'];
  const modes = ['Quick', 'Extended', 'Code', 'Research'];

  const positionClasses = {
    "center-top": "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    "center-bottom": "top-full left-1/2 -translate-x-1/2 mt-2.5",
    "top-left": "bottom-full left-0 mb-2.5",
    "top-right": "bottom-full right-0 mb-2.5",
    "bottom-left": "top-full left-0 mt-2.5",
    "bottom-right": "top-full right-0 mt-2.5",
    "right": "bottom-0 left-full ml-3"
  }[position] || "bottom-full left-0 mb-2.5";

  return (
    <div
      ref={popupRef}
      className={`absolute ${positionClasses} w-52 rounded-[22px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-[12px] font-victor ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 22, 28, 0.90)',
        backdropFilter: 'blur(40px) saturate(140%)',
        WebkitBackdropFilter: 'blur(40px) saturate(140%)',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: isLight ? '0 20px 45px -10px rgba(0, 0, 0, 0.15)' : '0 24px 48px -12px rgba(0, 0, 0, 0.75)'
      }}
    >
      <div className="flex flex-col gap-0.5">
        {/* Engine Selection */}
        {engines.map((engine) => {
          const isSelected = (selectedModel?.name === engine) || (selectedEngine === engine);
          return (
            <button
              key={engine}
              onClick={() => {
                setSelectedEngine(engine);
                onSelectModel({ id: engine.toLowerCase().replace(/\s+/g, '-'), name: engine });
              }}
              className={`w-full flex items-center justify-between px-3 h-8 rounded-[16px] text-left transition-all duration-150 cursor-pointer ${
                isSelected 
                  ? (isLight ? 'bg-slate-100 text-slate-950 font-medium' : 'bg-white/[0.08] text-white font-medium')
                  : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50' : 'text-white/65 hover:text-white hover:bg-white/[0.05]')
              }`}
            >
              <span>{engine}</span>
              {isSelected && (
                <Check size={13} className={isLight ? 'text-slate-900 shrink-0' : 'text-white shrink-0'} strokeWidth={2.4} />
              )}
            </button>
          );
        })}

        {/* Concentric Divider */}
        <div className={`my-1 mx-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`} />

        {/* Modes Selection */}
        {modes.map((mode) => {
          const isSelected = selectedMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                setSelectedMode(mode);
              }}
              className={`w-full flex items-center justify-between px-3 h-8 rounded-[16px] text-left transition-all duration-150 cursor-pointer ${
                isSelected 
                  ? (isLight ? 'bg-slate-100 text-slate-950 font-medium' : 'bg-white/[0.08] text-white font-medium')
                  : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50' : 'text-white/65 hover:text-white hover:bg-white/[0.05]')
              }`}
            >
              <span>{mode}</span>
              {isSelected && (
                <Check size={13} className={isLight ? 'text-slate-900 shrink-0' : 'text-white shrink-0'} strokeWidth={2.4} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
