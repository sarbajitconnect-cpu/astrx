import React, { useRef, useEffect } from 'react';
import { Copy, FileText, Code, Check, Share2 } from 'lucide-react';

export default function ShareMenu({
  isOpen,
  onClose,
  conversation,
  isLight = false,
  onToast
}) {
  const menuRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

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

  if (!isOpen || !conversation) return null;

  const getChatPlainText = () => {
    return conversation.messages
      .map(m => `[${m.sender.toUpperCase()}]:\n${m.text}`)
      .join('\n\n---\n\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getChatPlainText());
    setCopied(true);
    onToast?.('Conversation copied to clipboard');
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = `# ${conversation.title || 'ASTRX Conversation'}\n*Exported on ${new Date().toLocaleString()}*\n\n` +
      conversation.messages.map(m => `### ${m.sender === 'user' ? 'User' : 'ASTRX'}\n\n${m.text}`).join('\n\n---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(conversation.title || 'astrx-chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    onToast?.('Downloaded Markdown file');
    onClose();
  };

  const handleDownloadJSON = () => {
    const jsonContent = JSON.stringify(conversation, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(conversation.title || 'astrx-chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onToast?.('Downloaded JSON file');
    onClose();
  };

  const handleDeviceShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: conversation.title || 'ASTRX Conversation',
          text: getChatPlainText()
        });
        onToast?.('Shared successfully');
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      ref={menuRef}
      className={`absolute top-full right-0 mt-2.5 w-56 rounded-[24px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-[12.5px] font-victor ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 22, 28, 0.88)',
        backdropFilter: 'blur(40px) saturate(140%)',
        WebkitBackdropFilter: 'blur(40px) saturate(140%)',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: isLight ? '0 20px 45px -10px rgba(0, 0, 0, 0.15)' : '0 24px 48px -12px rgba(0, 0, 0, 0.75)'
      }}
    >
      <div className="flex flex-col gap-0.5">
        {/* Copy text */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-between px-3.5 h-9 rounded-[18px] text-left transition-all duration-150 cursor-pointer ${
            isLight 
              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
              : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <span>Copy text</span>
          {copied ? <Check size={14} className="text-emerald-500" strokeWidth={2.4} /> : <Copy size={14} className={isLight ? 'text-slate-400' : 'text-white/40'} />}
        </button>

        {/* Export Markdown */}
        <button
          onClick={handleDownloadMarkdown}
          className={`w-full flex items-center justify-between px-3.5 h-9 rounded-[18px] text-left transition-all duration-150 cursor-pointer ${
            isLight 
              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
              : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <span>Export Markdown (.md)</span>
          <FileText size={14} className={isLight ? 'text-slate-400' : 'text-white/40'} />
        </button>

        {/* Export JSON */}
        <button
          onClick={handleDownloadJSON}
          className={`w-full flex items-center justify-between px-3.5 h-9 rounded-[18px] text-left transition-all duration-150 cursor-pointer ${
            isLight 
              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
              : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <span>Export JSON (.json)</span>
          <Code size={14} className={isLight ? 'text-slate-400' : 'text-white/40'} />
        </button>

        {/* Concentric Divider */}
        <div className={`my-1 mx-2 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`} />

        {/* Option: Others */}
        <button
          onClick={handleDeviceShare}
          className={`w-full flex items-center justify-between px-3.5 h-9 rounded-[18px] text-left transition-all duration-150 cursor-pointer ${
            isLight 
              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' 
              : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <span>System share</span>
          <Share2 size={14} className={isLight ? 'text-slate-400' : 'text-white/40'} />
        </button>
      </div>
    </div>
  );
}
