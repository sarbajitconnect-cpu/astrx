import React, { useRef, useEffect, useState } from 'react';
import { 
  FileText, 
  Paperclip, 
  Globe,
  Check,
  FolderArchive,
  ArrowLeft,
  Image as ImageIcon,
  Code
} from 'lucide-react';

export default function ToolsMenu({
  isOpen,
  onClose,
  onAttachFile,
  webSearchActive,
  onToggleWebSearch,
  isLight = false,
  position = "right" // "right" | "top-left" | "top-right"
}) {
  const popupRef = useRef(null);
  const fileInputRef = useRef(null);
  const otherFileInputRef = useRef(null);
  const [showAssetsPicker, setShowAssetsPicker] = useState(false);
  const [savedAssets, setSavedAssets] = useState([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
        setShowAssetsPicker(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      try {
        const stored = localStorage.getItem('astrx_assets');
        if (stored) {
          setSavedAssets(JSON.parse(stored));
        } else {
          setSavedAssets([]);
        }
      } catch {
        setSavedAssets([]);
      }
    } else {
      setShowAssetsPicker(false);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachFile(file);
      onClose();
    }
  };

  const handleSelectAsset = (asset) => {
    onAttachFile(asset);
    onClose();
  };

  const positionClasses = {
    "center-top": "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    "center-bottom": "top-full left-1/2 -translate-x-1/2 mt-2.5",
    "top-left": "bottom-full left-0 mb-2.5",
    "top-right": "bottom-full right-0 mb-2.5",
    "bottom-left": "top-full left-0 mt-2.5",
    "bottom-right": "top-full right-0 mt-2.5",
    "right": "bottom-0 left-full ml-3"
  }[position] || "bottom-full right-0 mb-2.5";

  return (
    <div
      ref={popupRef}
      className={`absolute ${positionClasses} w-60 rounded-[22px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-[12px] font-victor ${
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
      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <input 
        type="file" 
        ref={otherFileInputRef} 
        onChange={handleFileInput} 
        className="hidden" 
      />

      {showAssetsPicker ? (
        /* Assets Picker Sub-view */
        <div className="flex flex-col gap-1 max-h-64">
          <div className={`flex items-center justify-between px-2 pt-1 pb-1.5 border-b ${
            isLight ? 'border-slate-200' : 'border-white/[0.08]'
          }`}>
            <button
              onClick={() => setShowAssetsPicker(false)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] ${
                isLight ? 'text-slate-500 hover:text-slate-900' : 'text-white/50 hover:text-white'
              }`}
            >
              <ArrowLeft size={12} />
              <span>Back</span>
            </button>
            <span className={`text-[10.5px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>
              Assets ({savedAssets.length})
            </span>
          </div>

          <div className="overflow-y-auto py-1 space-y-0.5 scrollbar-edge max-h-48">
            {savedAssets.length === 0 ? (
              <div className={`py-4 text-center text-[11px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                No saved assets
              </div>
            ) : (
              savedAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className={`w-full flex items-center justify-between px-2.5 h-8 rounded-[14px] text-left transition-all cursor-pointer group ${
                    isLight 
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {asset.type === 'image' ? (
                      <ImageIcon size={13} className={isLight ? 'text-amber-600 shrink-0' : 'text-amber-300/70 shrink-0'} />
                    ) : asset.type === 'code' ? (
                      <Code size={13} className={isLight ? 'text-indigo-600 shrink-0' : 'text-indigo-300/70 shrink-0'} />
                    ) : (
                      <FileText size={13} className={isLight ? 'text-slate-400 shrink-0' : 'text-white/40 shrink-0'} />
                    )}
                    <span className="truncate text-[11.5px]">{asset.name}</span>
                  </div>
                  <span className={`text-[10px] shrink-0 ml-1 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>{asset.size}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Standard Tools Menu View */
        <div className="flex flex-col gap-0.5">
          {/* 1) Upload photo or document */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center gap-3 px-3.5 h-8.5 rounded-[16px] text-left transition-all duration-150 cursor-pointer group ${
              isLight 
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
                : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FileText size={14} className={`shrink-0 transition-colors ${isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-white/40 group-hover:text-white'}`} />
            <span className="font-normal">Upload photo / doc</span>
          </button>

          {/* 2) Upload other */}
          <button
            onClick={() => otherFileInputRef.current?.click()}
            className={`w-full flex items-center gap-3 px-3.5 h-8.5 rounded-[16px] text-left transition-all duration-150 cursor-pointer group ${
              isLight 
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
                : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Paperclip size={14} className={`shrink-0 transition-colors ${isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-white/40 group-hover:text-white'}`} />
            <span className="font-normal">Upload any file</span>
          </button>

          {/* 3) Choose from Assets Archive */}
          <button
            onClick={() => setShowAssetsPicker(true)}
            className={`w-full flex items-center justify-between px-3.5 h-8.5 rounded-[16px] text-left transition-all duration-150 cursor-pointer group ${
              isLight 
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
                : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderArchive size={14} className={`shrink-0 transition-colors ${isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-white/40 group-hover:text-white'}`} />
              <span className="font-normal">Choose from Assets</span>
            </div>
            {savedAssets.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isLight ? 'bg-slate-100 text-slate-600 group-hover:text-slate-900' : 'bg-white/[0.08] text-white/50 group-hover:text-white/80'
              }`}>
                {savedAssets.length}
              </span>
            )}
          </button>

          {/* Concentric Divider */}
          <div className={`my-1 mx-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`} />

          {/* 4) Include web results */}
          <button
            onClick={() => {
              onToggleWebSearch?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 h-8.5 rounded-[16px] text-left transition-all duration-150 cursor-pointer group ${
              webSearchActive 
                ? (isLight ? 'bg-slate-100 text-slate-950 font-medium' : 'bg-white/[0.08] text-white font-medium')
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50' : 'text-white/65 hover:text-white hover:bg-white/[0.05]')
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe size={14} className={`shrink-0 transition-colors ${webSearchActive ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-400 group-hover:text-slate-900' : 'text-white/40 group-hover:text-white')}`} />
              <span className="font-normal">Live web search</span>
            </div>

            {webSearchActive && (
              <Check size={13} className={`shrink-0 mr-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`} strokeWidth={2.4} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}


