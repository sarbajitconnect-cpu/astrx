import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen,
  FlaskConical,
  Settings,
  Trash2,
  ChevronDown
} from 'lucide-react';

import AllConversationsMenu from './AllConversationsMenu';
import SettingsMenu from './SettingsMenu';
import UserAccountMenu from './UserAccountMenu';
import AccountSettingsModal from './AccountSettingsModal';
import UserAvatar from './UserAvatar';

export default function Sidebar({ 
  isOpen, 
  onToggle, 
  conversations = [], 
  currentChatId,
  onSelectConversation, 
  onNewConversation, 
  activeTab,
  onSelectTab,
  onDeleteConversation,
  onClearAllConversations,
  ambientMode,
  onToggleTheme,
  isTemporaryChat = false,
  onToggleTemporaryChat,
  user = {},
  onUpdateUsername,
  onUpdateAvatar,
  onDeleteAccount,
  onLogout
}) {
  const [isAllConversationsOpen, setIsAllConversationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false);

  const handleItemClick = (callback) => {
    callback();
    if (typeof window !== 'undefined' && window.innerWidth < 768 && isOpen) {
      onToggle();
    }
  };

  const isLight = ambientMode === 'light' && !isTemporaryChat;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside 
        className={`fixed md:relative inset-y-0 left-0 h-full flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none ${
          isLight ? 'border-r border-slate-300/60 shadow-xl md:shadow-none' : 'border-r border-white/5 shadow-2xl md:shadow-none'
        } z-50 md:z-40 ${
          isOpen 
            ? 'w-[260px] translate-x-0 opacity-100' 
            : '-translate-x-full md:translate-x-0 md:w-0 opacity-0 overflow-hidden pointer-events-none'
        }`}
        style={{
          background: isLight 
            ? 'rgba(230, 237, 246, 0.78)' 
            : isTemporaryChat 
            ? 'rgba(0, 0, 0, 0.98)' 
            : 'rgba(5, 16, 29, 0.94)',
          backdropFilter: 'blur(36px)',
          WebkitBackdropFilter: 'blur(36px)',
        }}
      >
        <div className="flex flex-col h-full w-[260px] relative">
        
        {/* Top Bar: Clickable Username Pill & Collapse Toggle */}
        <div className="flex items-center justify-between px-3 pt-3.5 pb-2 shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsUserMenuOpen(prev => !prev);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="User Account & Settings"
            className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer group max-w-[190px] ${
              isLight ? 'hover:bg-white/60' : 'hover:bg-white/[0.08]'
            }`}
          >
            <UserAvatar 
              avatarId={user?.avatarId} 
              username={user?.username} 
              size={20} 
              isLight={isLight}
            />
            <span className={`font-victor text-[11px] tracking-wider uppercase font-medium truncate ${
              isLight ? 'text-slate-800' : 'text-white/80'
            }`}>
              {user?.username || 'USERNAME'}
            </span>
            <ChevronDown size={12} className={`${
              isLight ? 'text-slate-400 group-hover:text-slate-800' : 'text-white/40 group-hover:text-white/80'
            } transition-transform shrink-0`} />
          </button>

          {/* User Account Dropdown Menu */}
          <UserAccountMenu
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
            user={user}
            isLight={isLight}
            onOpenAccountSettings={() => {
              setIsAccountSettingsModalOpen(true);
            }}
            onLogout={onLogout}
          />

          <button
            onClick={onToggle}
            title="Collapse Sidebar"
            className={`p-1 rounded transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-white/60' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5V35M8.33333 5H31.6667C33.5076 5 35 6.49238 35 8.33333V31.6667C35 33.5076 33.5076 35 31.6667 35H8.33333C6.49238 35 5 33.5076 5 31.6667V8.33333C5 6.49238 6.49238 5 8.33333 5Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Center ASTRX Logo Header Banner */}
        <div 
          className={`w-full py-2 flex items-center justify-center border-y shrink-0 ${
            isLight ? 'border-slate-300/60' : 'border-white/[0.04]'
          }`}
          style={{
            background: isLight
              ? 'linear-gradient(270deg, rgba(220, 230, 242, 0.7) 0%, rgba(234, 241, 249, 0.7) 100%)'
              : isTemporaryChat
              ? 'rgba(8, 8, 10, 0.9)'
              : 'linear-gradient(270deg, rgba(12, 22, 36, 0.6) 0%, rgba(20, 34, 52, 0.6) 100%)'
          }}
        >
          <a 
            href="/"
            title="Back to Main Website"
            className={`text-2xl tracking-widest select-none hover:opacity-80 transition-opacity cursor-pointer ${
              isLight ? 'astrx-sidebar-title-light' : 'astrx-sidebar-title'
            }`}
          >
            ASTRX
          </a>
        </div>

        {/* New Conversation Capsule (with Temporary Chat Dashed Circle Icon) */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div
            onClick={() => {
              onNewConversation();
              onSelectTab('home');
            }}
            className={`w-full h-8 rounded-full flex items-center justify-between px-3.5 transition-all cursor-pointer ${
              activeTab === 'home' && !currentChatId && !isTemporaryChat
                ? (isLight ? 'bg-white/80 text-slate-950 font-medium shadow-xs border border-slate-300/50' : 'bg-[rgba(78,78,78,0.57)] text-white shadow-sm')
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/50' : 'text-white/70 hover:text-white hover:bg-white/5')
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={14} className={isLight ? 'text-slate-500' : 'text-white/60'} />
              <span className="font-victor text-xs">New Conversation</span>
            </div>

            {/* Temporary Chat Dashed Circle Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleTemporaryChat) {
                  onToggleTemporaryChat();
                }
              }}
              title={isTemporaryChat ? "Exit Temporary Chat" : "Start Temporary Chat"}
              className={`p-1 rounded-full transition-all cursor-pointer ${
                isTemporaryChat 
                  ? 'bg-[#3a3a3c] text-white border border-white/20 shadow-sm'
                  : (isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-white/70' : 'text-white/40 hover:text-white hover:bg-white/10')
              }`}
            >
              <svg 
                width="15" 
                height="15" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M16.4961 20.3687C18.3643 19.362 19.6215 20.2979 20.7302 20.4658C20.8984 20.4913 21.0659 20.4302 21.1861 20.31C21.3687 20.1274 21.4034 19.8451 21.3026 19.6074C21.0386 18.9852 20.7877 18.0249 20.7528 17M10.4961 2.61775C10.9847 2.54025 11.4857 2.5 11.9961 2.5C12.5065 2.5 13.0075 2.54025 13.4961 2.61775M6.42502 4.30418C5.61082 4.89461 4.89392 5.61108 4.30312 6.42496M2.61382 10.5C2.53632 10.9886 2.49612 11.4896 2.49612 12C2.49612 12.5104 2.53632 13.0114 2.61382 13.5M4.30312 17.575C4.89392 18.3889 5.61072 19.1053 6.42492 19.6958M10.4961 21.3822C10.9847 21.4597 11.4857 21.5 11.9961 21.5C12.5065 21.5 13.0075 21.4597 13.4961 21.3822M21.3783 13.5C21.4558 13.0114 21.4961 12.5104 21.4961 12C21.4961 11.4896 21.4558 10.9886 21.3783 10.5M19.6919 6.42883C19.1014 5.61464 18.385 4.89781 17.5711 4.30699" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex flex-col gap-0.5 px-3 py-1.5 shrink-0">
          {/* Assets Tab */}
          <div
            onClick={() => onSelectTab('assets')}
            className={`w-full h-8 rounded-full flex items-center gap-2.5 px-3.5 text-xs font-victor transition-all cursor-pointer ${
              activeTab === 'assets'
                ? (isLight ? 'bg-white/80 text-slate-950 font-medium shadow-xs border border-slate-300/50' : 'bg-[rgba(78,78,78,0.57)] text-white shadow-sm')
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/50' : 'text-white/70 hover:text-white hover:bg-white/5')
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={isLight ? 'text-slate-500' : 'text-white/60'}>
              <path d="M17.5007 6.66667V17.5H2.50065V6.66667M8.33398 10H11.6673M0.833984 2.5H19.1673V6.66667H0.833984V2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Assets</span>
          </div>

          {/* Code Tab */}
          <div
            onClick={() => onSelectTab('code')}
            className={`w-full h-8 rounded-full flex items-center gap-2.5 px-3.5 text-xs font-victor transition-all cursor-pointer ${
              activeTab === 'code'
                ? (isLight ? 'bg-white/80 text-slate-950 font-medium shadow-xs border border-slate-300/50' : 'bg-[rgba(78,78,78,0.57)] text-white shadow-sm')
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/50' : 'text-white/70 hover:text-white hover:bg-white/5')
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={isLight ? 'text-slate-500' : 'text-white/60'}>
              <path d="M13.3327 15L18.3327 10L13.3327 5M6.66602 5L1.66602 10L6.66602 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Code</span>
          </div>

          {/* Study Tab */}
          <div
            onClick={() => onSelectTab('study')}
            className={`w-full h-8 rounded-full flex items-center gap-2.5 px-3.5 text-xs font-victor transition-all cursor-pointer ${
              activeTab === 'study'
                ? (isLight ? 'bg-white/80 text-slate-950 font-medium shadow-xs border border-slate-300/50' : 'bg-[rgba(78,78,78,0.57)] text-white shadow-sm')
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-white/50' : 'text-white/70 hover:text-white hover:bg-white/5')
            }`}
          >
            <BookOpen size={14} className={isLight ? 'text-slate-500' : 'text-white/60'} />
            <span>Study</span>
          </div>
        </div>

        {/* Past Conversations Banner */}
        <div 
          className={`w-full py-1.5 px-5 flex items-center border-y shrink-0 ${
            isLight ? 'border-slate-300/60' : 'border-white/[0.04]'
          }`}
          style={{
            background: isLight
              ? 'rgba(220, 230, 242, 0.6)'
              : 'linear-gradient(270deg, rgba(12, 22, 36, 0.6) 0%, rgba(20, 34, 52, 0.6) 100%)'
          }}
        >
          <span className={`font-victor text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-white/60'}`}>
            Past Conversations
          </span>
        </div>

        {/* Past Conversations Scrollable List (Contained strictly above "View all conversations") */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1 text-xs font-victor scrollbar-edge">
          {conversations.length === 0 ? (
            <div className={`px-3 py-4 text-[11px] text-center font-victor ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              No past conversations
            </div>
          ) : (
            conversations.map((chat) => {
              const isSelected = activeTab === 'chat' && currentChatId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectConversation(chat.id)}
                  className={`w-full h-7 rounded-full flex items-center justify-between px-3 text-left transition-all cursor-pointer group ${
                    isSelected 
                      ? (isLight ? 'bg-white/80 text-slate-950 font-medium shadow-xs border border-slate-300/50' : 'bg-[rgba(78,78,78,0.57)] text-white shadow-sm')
                      : (isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-white/40' : 'text-[#8a99a8] hover:text-white hover:bg-white/5')
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Outline circle icon (○) */}
                    <div className={`w-2.5 h-2.5 rounded-full border shrink-0 transition-colors ${
                      isSelected 
                        ? (isLight ? 'border-slate-900 bg-slate-900' : 'border-white') 
                        : (isLight ? 'border-slate-400 group-hover:border-slate-800' : 'border-slate-500/60 group-hover:border-white/70')
                    }`} />
                    <span className="truncate">{chat.title}</span>
                  </div>

                  {/* Hover delete icon */}
                  {onDeleteConversation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(chat.id);
                      }}
                      title="Delete chat"
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5 rounded transition-opacity cursor-pointer shrink-0 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* View All Conversations link with Anchored Flyout Menu */}
        <div className={`px-5 py-2 shrink-0 border-t relative ${isLight ? 'border-slate-300/60' : 'border-white/[0.04]'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAllConversationsOpen(prev => !prev);
              setIsSettingsOpen(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-full text-left font-victor text-[11px] transition-colors cursor-pointer flex items-center justify-between group ${
              isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#6e7c8c] hover:text-slate-200'
            }`}
          >
            <span>View all conversations</span>
            <span className={`text-[10px] ${isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-white/40 group-hover:text-white/70'}`}>{conversations.length}</span>
          </button>

          {/* Anchored AllConversationsMenu flyout */}
          <AllConversationsMenu
            isOpen={isAllConversationsOpen}
            onClose={() => setIsAllConversationsOpen(false)}
            conversations={conversations}
            currentChatId={currentChatId}
            isLight={isLight}
            onSelectConversation={onSelectConversation}
            onNewConversation={onNewConversation}
            onDeleteConversation={onDeleteConversation}
            onClearAllConversations={onClearAllConversations}
          />
        </div>

        {/* Bottom Footer: FREE PLAN UPGRADE & Settings Icon with Anchored SettingsMenu */}
        <div className={`px-5 py-3 border-t flex items-center justify-between shrink-0 relative ${isLight ? 'border-slate-300/60' : 'border-white/5'}`}>
          <div className="flex items-center">
            <span className={`font-victor text-[11px] tracking-[0.12em] uppercase ${isLight ? 'text-slate-400' : 'text-white/50'}`}>
              FREE PLAN
            </span>
            <span 
              className="font-victor text-[11px] font-bold tracking-[0.12em] uppercase cursor-pointer hover:opacity-85 transition-opacity ml-2.5"
              style={{
                background: 'linear-gradient(135deg, #f7df9c 0%, #e2be68 45%, #b88628 80%, #9a6d1c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              UPGRADE
            </span>
          </div>

          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen(prev => !prev);
                setIsAllConversationsOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Settings"
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-white/60' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings size={15} />
            </button>

            {/* Anchored SettingsMenu flyout */}
            <SettingsMenu
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              ambientMode={ambientMode}
              isLight={isLight}
              onToggleTheme={onToggleTheme}
              onClearAllData={onClearAllConversations}
            />
          </div>
        </div>
      </div>
    </aside>

    {/* Account Settings Modal */}
    <AccountSettingsModal
      isOpen={isAccountSettingsModalOpen}
      onClose={() => setIsAccountSettingsModalOpen(false)}
      user={user}
      isLight={isLight}
      onUpdateUsername={onUpdateUsername}
      onUpdateAvatar={onUpdateAvatar}
      onDeleteAccount={onDeleteAccount}
    />
    </>
  );
}
