import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Plus, Check } from 'lucide-react';

export default function AllConversationsMenu({
  isOpen,
  onClose,
  conversations = [],
  currentChatId,
  isLight = false,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAllConversations
}) {
  const popupRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
      className={`absolute bottom-10 left-full ml-3 w-68 max-h-96 rounded-[24px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-[12.5px] font-victor flex flex-col ${
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
      {/* Top action row */}
      <div className={`flex items-center justify-between px-3 pt-1 pb-1.5 border-b shrink-0 ${
        isLight ? 'border-slate-200' : 'border-white/[0.08]'
      }`}>
        <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
          Conversations ({conversations.length})
        </span>
        {conversations.length > 0 && (
          showClearConfirm ? (
            <div className="flex items-center gap-2 text-[10.5px]">
              <button
                onClick={() => {
                  onClearAllConversations();
                  setShowClearConfirm(false);
                  onClose();
                }}
                className="px-2 py-0.5 rounded-[10px] bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 transition-colors cursor-pointer font-medium"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`px-2 py-0.5 rounded-[10px] transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900' : 'bg-white/8 text-white/60 hover:text-white'
                }`}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className={`text-[11px] transition-colors cursor-pointer px-1 py-0.5 ${
                isLight ? 'text-slate-400 hover:text-rose-500' : 'text-white/40 hover:text-rose-400'
              }`}
            >
              Clear
            </button>
          )
        )}
      </div>

      {/* Conversations scrollable list */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 scrollbar-edge max-h-64">
        {conversations.length === 0 ? (
          <div className={`py-6 text-center text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
            No conversations
          </div>
        ) : (
          conversations.map((chat) => {
            const isSelected = currentChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectConversation(chat.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 h-9 rounded-[18px] text-left transition-all duration-150 cursor-pointer group ${
                  isSelected 
                    ? (isLight ? 'bg-slate-100 text-slate-950 font-medium shadow-xs' : 'bg-white/12 text-white font-medium shadow-sm')
                    : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50' : 'text-white/70 hover:text-white hover:bg-white/8')
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                    isSelected 
                      ? (isLight ? 'bg-slate-900 shadow-[0_0_8px_rgba(0,0,0,0.3)]' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]')
                      : (isLight ? 'border border-slate-300 group-hover:border-slate-600' : 'border border-white/30 group-hover:border-white/60')
                  }`} />
                  <span className="truncate text-xs">{chat.title || 'Untitled'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(chat.id);
                  }}
                  title="Delete"
                  className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity cursor-pointer shrink-0 ml-1 rounded-full ${
                    isLight ? 'text-slate-400 hover:text-rose-500 hover:bg-slate-200' : 'text-white/40 hover:text-rose-400 hover:bg-white/10'
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
