import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ExternalLink,
  Trash2,
  Sparkles
} from 'lucide-react';
import UserAvatar, { PREDEFINED_AVATARS } from './UserAvatar';

export default function AccountSettingsModal({
  isOpen,
  onClose,
  user = {},
  isLight = false,
  onUpdateUsername,
  onUpdateAvatar,
  onDeleteAccount
}) {
  const [newUsername, setNewUsername] = useState(user.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarId || 'initial');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setNewUsername(user.username || '');
      setSelectedAvatar(user.avatarId || 'initial');
      setIsSavedFeedback(false);
      setShowDeletePrompt(false);
      setDeleteInputText('');
    }
  }, [isOpen, user.username, user.avatarId]);

  if (!isOpen) return null;

  const handleSaveUsername = (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    onUpdateUsername(newUsername.trim());
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleSelectAvatar = (avatarId) => {
    setSelectedAvatar(avatarId);
    onUpdateAvatar?.(avatarId);
  };

  const handleConfirmDelete = () => {
    if (deleteInputText.trim() === 'DELETE') {
      onDeleteAccount();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-[340px] rounded-[30px] p-4.5 font-victor animate-in zoom-in-95 duration-150 select-none shadow-2xl relative ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 22, 28, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isLight ? '0 24px 48px -12px rgba(0, 0, 0, 0.2)' : '0 24px 48px -12px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-2.5 border-b ${
          isLight ? 'border-slate-200' : 'border-white/[0.06]'
        }`}>
          <h3 className={`text-xs font-semibold tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Account Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="pt-3 space-y-3 text-xs">
          
          {/* Avatar Selector */}
          <div className="space-y-1.5">
            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Profile icon</span>

            <div className={`w-full h-10 px-1.5 rounded-full flex items-center justify-between border ${
              isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-white/[0.04] border-white/[0.06]'
            }`}>
              {PREDEFINED_AVATARS.map((avatar) => {
                const isCurrent = (user.avatarId || 'initial') === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar.id)}
                    title={avatar.name}
                    className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent 
                        ? (isLight ? 'ring-2 ring-slate-900 scale-105 bg-slate-200' : 'ring-2 ring-white scale-105 bg-white/20')
                        : (isLight ? 'opacity-60 hover:opacity-100 hover:bg-slate-200/60' : 'opacity-50 hover:opacity-90 hover:bg-white/10')
                    }`}
                  >
                    <UserAvatar 
                      avatarId={avatar.id} 
                      username={newUsername || user.username} 
                      size={22}
                      isLight={isLight}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Concentric Divider */}
          <div className={`border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`} />

          {/* Change Username */}
          <div className="space-y-1.5">
            <div className={`flex items-center justify-between text-[11px] ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              <span>Username</span>
              {isSavedFeedback && (
                <span className="text-emerald-500 flex items-center gap-1 font-medium">
                  <Check size={11} /> Saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Type your username"
                maxLength={30}
                className={`flex-1 h-8.5 px-3.5 rounded-full border text-xs focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400'
                    : 'bg-white/[0.05] border-white/[0.07] text-white placeholder:text-white/30 focus:border-white/30'
                }`}
              />
              <button
                type="submit"
                disabled={!newUsername.trim() || newUsername === user.username}
                className={`h-8.5 px-3.5 rounded-full disabled:opacity-35 disabled:pointer-events-none text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-slate-900 text-white hover:bg-black'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                Save
              </button>
            </form>
          </div>

          {/* Concentric Divider */}
          <div className={`border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`} />

          {/* Legal / Policy Links */}
          <div className="space-y-0.5">
            <span className={`text-[11px] block mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Policies & legal</span>
            
            <button
              onClick={() => {}}
              className={`w-full flex items-center justify-between px-3 h-8 rounded-full transition-all cursor-pointer text-left text-xs ${
                isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>View Privacy Policy</span>
              <ExternalLink size={12} className={isLight ? 'text-slate-400' : 'text-white/30'} />
            </button>

            <button
              onClick={() => {}}
              className={`w-full flex items-center justify-between px-3 h-8 rounded-full transition-all cursor-pointer text-left text-xs ${
                isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>View Terms & Conditions</span>
              <ExternalLink size={12} className={isLight ? 'text-slate-400' : 'text-white/30'} />
            </button>

            <button
              onClick={() => {}}
              className={`w-full flex items-center justify-between px-3 h-8 rounded-full transition-all cursor-pointer text-left text-xs ${
                isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span>View Cookie Policy</span>
              <ExternalLink size={12} className={isLight ? 'text-slate-400' : 'text-white/30'} />
            </button>
          </div>

          {/* Concentric Divider */}
          <div className={`border-t ${isLight ? 'border-slate-200' : 'border-white/[0.06]'}`} />

          {/* Danger Zone: Permanent Account Deletion with 2-Step 'DELETE' verification */}
          <div>
            {!showDeletePrompt ? (
              <button
                type="button"
                onClick={() => setShowDeletePrompt(true)}
                className="w-full h-8.5 rounded-full flex items-center justify-center gap-2 bg-rose-500/[0.08] hover:bg-rose-500/[0.14] text-rose-500 text-xs font-medium transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Account Permanently</span>
              </button>
            ) : (
              <div className={`p-3 rounded-[20px] border space-y-2.5 animate-in fade-in duration-150 ${
                isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/40 border-rose-500/20'
              }`}>
                <p className={`text-[11px] text-center font-medium ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                  Type <span className={`font-mono font-bold ${isLight ? 'text-rose-950' : 'text-white'}`}>DELETE</span> to confirm
                </p>
                <input
                  type="text"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  placeholder="DELETE"
                  className={`w-full h-8 px-3 rounded-full border text-center font-mono text-xs focus:outline-none uppercase tracking-wider ${
                    isLight 
                      ? 'bg-white border-rose-300 text-slate-900 placeholder:text-slate-300 focus:border-rose-500'
                      : 'bg-white/[0.08] border-rose-500/30 text-white placeholder:text-white/20 focus:border-rose-400'
                  }`}
                />
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={deleteInputText !== 'DELETE'}
                    onClick={handleConfirmDelete}
                    className="flex-1 h-7.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:pointer-events-none text-white text-[11px] font-medium transition-all cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeletePrompt(false);
                      setDeleteInputText('');
                    }}
                    className={`px-3.5 h-7.5 rounded-full text-[11px] transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-white/70'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
