import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, FileText, Code } from 'lucide-react';

export default function ShareModal({
  isOpen,
  onClose,
  conversation
}) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen || !conversation) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const getChatPlainText = () => {
    return conversation.messages
      .map(m => `[${m.sender.toUpperCase()}]:\n${m.text}`)
      .join('\n\n---\n\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getChatPlainText());
    setCopied(true);
    showToast('Conversation copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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
    showToast('Markdown file downloaded!');
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
    showToast('JSON export downloaded!');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversation.title || 'ASTRX Chat',
          text: getChatPlainText()
        });
        showToast('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-[32px] p-6 text-white font-victor relative animate-in zoom-in-95 duration-200 select-none shadow-2xl"
        style={{
          background: 'rgba(18, 22, 30, 0.55)',
          backdropFilter: 'blur(36px) saturate(160%)',
          WebkitBackdropFilter: 'blur(36px) saturate(160%)',
          border: 'none',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Toast notification */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top duration-150 z-50">
            <Check size={13} strokeWidth={2.4} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
              <Share2 size={15} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Share Conversation</h3>
              <p className="text-[10.5px] text-white/40">Export or distribute transcript</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-2.5 text-xs">
          {/* Option 1: Copy Text */}
          <button
            onClick={handleCopyText}
            className="w-full p-3 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-between transition-all duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[14px] bg-white/8 flex items-center justify-center text-white shrink-0">
                {copied ? <Check size={16} className="text-emerald-400" strokeWidth={2.4} /> : <Copy size={15} className="text-white/70" />}
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-[12.5px]">Copy Formatted Text</p>
                <p className="text-[11px] text-white/40">Plain text transcript with markdown</p>
              </div>
            </div>
            <span className="text-[11px] text-white/40 group-hover:text-white transition-colors">Copy</span>
          </button>

          {/* Option 2: Export Markdown */}
          <button
            onClick={handleDownloadMarkdown}
            className="w-full p-3 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-between transition-all duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[14px] bg-white/8 flex items-center justify-center text-white shrink-0">
                <FileText size={15} className="text-white/70" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-[12.5px]">Export as Markdown (.md)</p>
                <p className="text-[11px] text-white/40">Standard GitHub-flavored format</p>
              </div>
            </div>
            <Download size={14} className="text-white/40 group-hover:text-white transition-colors" />
          </button>

          {/* Option 3: Export JSON */}
          <button
            onClick={handleDownloadJSON}
            className="w-full p-3 rounded-[20px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-between transition-all duration-150 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[14px] bg-white/8 flex items-center justify-center text-white shrink-0">
                <Code size={15} className="text-white/70" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-[12.5px]">Export as JSON (.json)</p>
                <p className="text-[11px] text-white/40">Structured data with timestamps</p>
              </div>
            </div>
            <Download size={14} className="text-white/40 group-hover:text-white transition-colors" />
          </button>

          {/* Option 4: Native Share */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full p-3 rounded-[20px] bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 text-white font-medium text-xs transition-all duration-150 cursor-pointer mt-1"
            >
              <Share2 size={14} />
              <span>Share via Device Menu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
