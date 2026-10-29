import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Search, 
  Plus, 
  Clock
} from 'lucide-react';

export default function AllConversationsModal({
  isOpen,
  onClose,
  conversations = [],
  currentChatId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAllConversations
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredConversations = conversations.filter(conv => {
    const titleMatch = conv.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const messageMatch = conv.messages?.some(m => 
      typeof m.text === 'string' && m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return titleMatch || messageMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      <div 
        ref={modalRef}
        className="w-full max-w-lg max-h-[78vh] rounded-[32px] p-6 flex flex-col overflow-hidden text-white font-victor animate-in zoom-in-95 duration-200 shadow-2xl"
        style={{
          background: 'rgba(18, 22, 30, 0.55)',
          backdropFilter: 'blur(36px) saturate(160%)',
          WebkitBackdropFilter: 'blur(36px) saturate(160%)',
          border: 'none',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
              <Clock size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">All Conversations</h3>
                <span className="text-[11px] text-white/40">({conversations.length})</span>
              </div>
              <p className="text-[10.5px] text-white/40">History & archive logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewConversation();
                onClose();
              }}
              className="px-3 py-1.5 rounded-[14px] bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Plus size={13} strokeWidth={2.4} />
              <span>New</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="py-3 border-b border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
          <div className="flex-1 relative flex items-center">
            <Search size={14} className="absolute left-3 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 h-9 rounded-[16px] bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all font-victor"
            />
          </div>

          {conversations.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      onClearAllConversations();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-[12px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] cursor-pointer font-medium transition-colors"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 rounded-[12px] bg-white/8 text-white/60 hover:text-white text-[11px] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 h-9 rounded-[16px] text-white/40 hover:text-rose-400 hover:bg-rose-500/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* List of Conversations */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-edge">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-xs space-y-2">
              <Clock size={24} className="mx-auto text-white/20" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isCurrent = conv.id === currentChatId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  className={`w-full px-3.5 h-10 rounded-[18px] flex items-center justify-between text-xs transition-all duration-150 cursor-pointer group ${
                    isCurrent
                      ? 'bg-white/12 text-white font-medium shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                      isCurrent ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'border border-white/30 group-hover:border-white/60'
                    }`} />
                    <span className="truncate text-xs">{conv.title || 'Untitled Conversation'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-rose-400 hover:bg-white/10 rounded-full transition-all cursor-pointer shrink-0 ml-2"
                    title="Delete conversation"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
