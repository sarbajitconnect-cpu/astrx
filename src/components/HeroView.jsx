import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  Mic,
  MicOff, 
  Plus, 
  Sun,
  Moon, 
  FileText, 
  X 
} from 'lucide-react';
import ModelSelector from './ModelSelector';
import ToolsMenu from './ToolsMenu';
import SlashCommandMenu, { SLASH_COMMANDS } from './SlashCommandMenu';
import { useSpeechRecognition } from '../utils/useSpeech';

const SHUFFLE_PLACEHOLDERS = [
  'Begin searching...',
  'Ask anything...',
  'Explore ideas & research...',
  'Summarize documents & PDFs...',
  'Analyze code & data...'
];

export default function HeroView({
  isSidebarOpen,
  onToggleSidebar,
  ambientMode = 'cosmic',
  onToggleTheme,
  onSubmitPrompt,
  selectedModel,
  onSelectModel,
  webSearchActive,
  onToggleWebSearch,
  researchModeActive = false,
  onToggleResearchMode,
  onAttachFile,
  attachedFile,
  uploadProgress,
  onRemoveAttachedFile,
  isTemporaryChat = false,
  onToggleTemporaryChat
}) {

  const isLight = ambientMode === 'light' && !isTemporaryChat;
  const [inputText, setInputText] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isGlidingDown, setIsGlidingDown] = useState(false);

  const cleanSlashQuery = inputText.startsWith('/') ? inputText.slice(1).toLowerCase().trim() : '';
  const isSlashMenuOpen = inputText.startsWith('/') && !inputText.includes(' ');
  const matchingSlashCommands = SLASH_COMMANDS.filter((cmd) => {
    if (!cleanSlashQuery) return true;
    return (
      cmd.id.includes(cleanSlashQuery) ||
      cmd.command.includes(cleanSlashQuery) ||
      cmd.title.toLowerCase().includes(cleanSlashQuery) ||
      cmd.aliases.some(a => a.includes(cleanSlashQuery))
    );
  });

  const handleSelectSlashCommand = (cmd) => {
    setInputText(`${cmd.command} `);
    setSlashIndex(0);
  };

  // Seamless landing animation when arriving from login.html condensation
  const [isTransitioningIn, setIsTransitioningIn] = useState(() => {
    try {
      const flag = sessionStorage.getItem('astrx_login_transition');
      if (flag) {
        sessionStorage.removeItem('astrx_login_transition');
        return true;
      }
    } catch(e) {}
    return false;
  });

  useEffect(() => {
    if (isTransitioningIn) {
      const timer = setTimeout(() => {
        setIsTransitioningIn(false);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isTransitioningIn]);

  // Real-time speech recognition
  const { isListening, toggleListening } = useSpeechRecognition((transcript) => {
    setInputText(transcript);
  });

  // Rotate placeholders every 4.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SHUFFLE_PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !attachedFile) || isGlidingDown) return;
    
    let textToSend = inputText.trim();

    // Execute slash command on send
    if (/^\/(temporary|temp|incognito)(\s.*)?$/i.test(textToSend)) {
      onToggleTemporaryChat?.(true);
      textToSend = textToSend.replace(/^\/(temporary|temp|incognito)\s*/i, '').trim();
    } else if (/^\/(search|web|google)(\s.*)?$/i.test(textToSend)) {
      if (!webSearchActive) onToggleWebSearch?.();
      textToSend = textToSend.replace(/^\/(search|web|google)\s*/i, '').trim();
    } else if (/^\/(research|study|paper|deep)(\s.*)?$/i.test(textToSend)) {
      if (!researchModeActive) onToggleResearchMode?.();
      textToSend = textToSend.replace(/^\/(research|study|paper|deep)\s*/i, '').trim();
    }

    if (!textToSend && !attachedFile) {
      setInputText('');
      return;
    }

    setIsGlidingDown(true);
    
    // Stage 1: Text fades out, Box glides down (320ms)
    setTimeout(() => {
      onSubmitPrompt(textToSend);
      setInputText('');
      if (onRemoveAttachedFile) onRemoveAttachedFile();
      setIsGlidingDown(false);
    }, 320);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden z-10">
      
      {/* Top Left Sidebar Toggle Button (when closed) */}
      {!isSidebarOpen && (
        <button
          onClick={onToggleSidebar}
          title="Open Sidebar"
          className={`absolute top-[max(env(safe-area-inset-top,0px),1rem)] left-3 sm:left-6 md:top-8 md:left-8 w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer z-20 ${
            isLight 
              ? 'text-slate-700 hover:text-slate-950 bg-white/60 hover:bg-white border border-slate-300/80 shadow-xs' 
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5V35M8.33333 5H31.6667C33.5076 5 35 6.49238 35 8.33333V31.6667C35 33.5076 33.5076 35 31.6667 35H8.33333C6.49238 35 5 33.5076 5 31.6667V8.33333C5 6.49238 6.49238 5 8.33333 5Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Top Right Sun/Theme Button: Shifts between Sun and Crescent Moon */}
      <button
        onClick={onToggleTheme}
        title={ambientMode === 'light' ? "Switch to Cosmic Theme" : "Switch to Light Theme"}
        className={`absolute top-[max(env(safe-area-inset-top,0px),1rem)] right-3 sm:right-6 md:top-8 md:right-8 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 z-20 ${
          isLight
            ? 'text-slate-800 hover:text-slate-950 bg-white/75 hover:bg-white border border-slate-300/90 shadow-[0_4px_16px_rgba(15,23,42,0.06)]'
            : 'text-white/80 hover:text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06]'
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {ambientMode === 'light' ? (
          <Moon size={20} strokeWidth={1.75} className="transition-transform duration-300 -rotate-12" />
        ) : (
          <Sun size={20} strokeWidth={1.75} className="transition-transform duration-300 rotate-0" />
        )}
      </button>

      {/* Main Central Stage */}
      <div className={`flex flex-col items-center w-full px-2 sm:px-4 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isGlidingDown ? 'max-w-3xl' : 'max-w-[94vw] sm:max-w-[620px]'
      } ${
        isTransitioningIn ? 'opacity-0 translate-y-3 scale-[0.97]' : 'opacity-100 translate-y-0 scale-100'
      }`}>
        
        {/* ASTRX Logo & Tagline */}
        <div className={`flex flex-col items-center text-center mb-6 sm:mb-8 transition-opacity duration-200 ease-out animate-in fade-in duration-250 ${
          isGlidingDown ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <h1 
            className={`text-6xl sm:text-7xl md:text-8xl font-normal tracking-wide leading-none select-none ${
              isLight ? 'astrx-hero-title-light' : 'astrx-hero-title'
            }`}
          >
            ASTRX
          </h1>

          <p 
            className="font-instrument text-base sm:text-lg md:text-xl font-normal tracking-[0.22em] sm:tracking-[0.25em] mt-2 sm:mt-2.5 uppercase"
            style={{ color: isLight ? 'rgba(51, 65, 85, 0.9)' : 'rgba(226, 226, 226, 0.75)' }}
          >
            LETS DIVE IN !
          </p>

          {isTemporaryChat && (
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-dashed border-white/20 bg-[#1c1c1e]/90 text-neutral-300 text-[11px] font-victor animate-in fade-in duration-200">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400">
                <path d="M16.4961 20.3687C18.3643 19.362 19.6215 20.2979 20.7302 20.4658C20.8984 20.4913 21.0659 20.4302 21.1861 20.31C21.3687 20.1274 21.4034 19.8451 21.3026 19.6074C21.0386 18.9852 20.7877 18.0249 20.7528 17M10.4961 2.61775C10.9847 2.54025 11.4857 2.5 11.9961 2.5C12.5065 2.5 13.0075 2.54025 13.4961 2.61775M6.42502 4.30418C5.61082 4.89461 4.89392 5.61108 4.30312 6.42496M2.61382 10.5C2.53632 10.9886 2.49612 11.4896 2.49612 12C2.49612 12.5104 2.53632 13.0114 2.61382 13.5M4.30312 17.575C4.89392 18.3889 5.61072 19.1053 6.42492 19.6958M10.4961 21.3822C10.9847 21.4597 11.4857 21.5 11.9961 21.5C12.5065 21.5 13.0075 21.4597 13.4961 21.3822M21.3783 13.5C21.4558 13.0114 21.4961 12.5104 21.4961 12C21.4961 11.4896 21.4558 10.9886 21.3783 10.5M19.6919 6.42883C19.1014 5.61464 18.385 4.89781 17.5711 4.30699" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Temporary Chat</span>
            </div>
          )}
        </div>


        {/* Input Bar & Controls */}
        <div className={`w-full flex flex-col items-center transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isGlidingDown ? 'translate-y-[calc(40vh-20px)] md:translate-y-[calc(38vh-20px)]' : 'translate-y-0'
        }`}>
          {/* Slash Commands Dropdown Menu */}
          {isSlashMenuOpen && matchingSlashCommands.length > 0 && (
            <SlashCommandMenu
              isOpen={true}
              query={inputText}
              selectedIndex={slashIndex}
              isLight={isLight}
              onSelectCommand={handleSelectSlashCommand}
            />
          )}

          {/* Temporary Chat Slash Command Floating Hover Chip for non-slash plain text */}
          {!isTemporaryChat && !inputText.startsWith('/') && /^\s*(temporary|temp)\b/i.test(inputText) && (
            <div 
              onClick={() => {
                onToggleTemporaryChat?.(true);
                setInputText('');
              }}
              className={`mb-2.5 self-start px-3.5 py-2 rounded-[20px] flex items-center justify-between gap-3 text-xs font-victor cursor-pointer shadow-2xl border border-dashed transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2 z-30 ${
                isLight 
                  ? 'border-slate-300 hover:border-slate-500 text-slate-900' 
                  : 'border-white/30 hover:border-white/60 text-white'
              }`}
              style={{
                background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 22, 28, 0.94)',
                backdropFilter: 'blur(36px)',
                boxShadow: isLight ? '0 16px 36px -8px rgba(0, 0, 0, 0.12)' : '0 16px 36px -8px rgba(0, 0, 0, 0.75)'
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-black/10 text-slate-900' : 'bg-white/10 text-white'
                }`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={isLight ? 'text-slate-900' : 'text-white'}>
                    <path d="M16.4961 20.3687C18.3643 19.362 19.6215 20.2979 20.7302 20.4658C20.8984 20.4913 21.0659 20.4302 21.1861 20.31C21.3687 20.1274 21.4034 19.8451 21.3026 19.6074C21.0386 18.9852 20.7877 18.0249 20.7528 17M10.4961 2.61775C10.9847 2.54025 11.4857 2.5 11.9961 2.5C12.5065 2.5 13.0075 2.54025 13.4961 2.61775M6.42502 4.30418C5.61082 4.89461 4.89392 5.61108 4.30312 6.42496M2.61382 10.5C2.53632 10.9886 2.49612 11.4896 2.49612 12C2.49612 12.5104 2.53632 13.0114 2.61382 13.5M4.30312 17.575C4.89392 18.3889 5.61072 19.1053 6.42492 19.6958M10.4961 21.3822C10.9847 21.4597 11.4857 21.5 11.9961 21.5C12.5065 21.5 13.0075 21.4597 13.4961 21.3822M21.3783 13.5C21.4558 13.0114 21.4961 12.5104 21.4961 12C21.4961 11.4896 21.4558 10.9886 21.3783 10.5M19.6919 6.42883C19.1014 5.61464 18.385 4.89781 17.5711 4.30699" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <span className={`font-medium text-[12px] ${isLight ? 'text-slate-900' : 'text-white'}`}>Turn on Temporary Chat</span>
                  <span className={`text-[10.5px] block ${isLight ? 'text-slate-500' : 'text-white/40'}`}>Incognito mode — chats won't be saved in history</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-[8px] text-[10px] transition-colors ${
                isLight ? 'bg-slate-100 text-slate-700 group-hover:text-slate-950' : 'bg-white/10 text-white/70 group-hover:text-white'
              }`}>
                Tab ↹
              </span>
            </div>
          )}

          {/* Uploading Progress Feedback Card */}
          {uploadProgress?.isUploading && (
            <div className="mb-3 self-start w-full max-w-sm p-3 rounded-2xl bg-[#141b27]/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl animate-in fade-in duration-150 space-y-2">
              <div className="flex items-center justify-between text-xs font-victor text-white/80">
                <span className="truncate max-w-[220px] font-medium">{uploadProgress.fileName}</span>
                <span className="font-mono text-[11px] text-white/60">{uploadProgress.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/80 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/50 italic font-victor">{uploadProgress.status}</p>
            </div>
          )}

          {/* Claude-style Attachment Preview Card */}
          {attachedFile && !uploadProgress?.isUploading && (
            <div className="mb-3 self-start flex items-center gap-3 p-2.5 rounded-2xl bg-[#141b27]/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl animate-in fade-in duration-150 max-w-sm">
              {attachedFile.type?.startsWith('image/') || attachedFile.isImage ? (
                <img
                  src={attachedFile.previewUrl}
                  alt={attachedFile.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white/[0.08] shrink-0 shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/70 border border-white/[0.08] shrink-0">
                  <FileText size={22} />
                </div>
              )}
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-victor font-medium text-white truncate">{attachedFile.name}</p>
                <p className="text-[10px] font-victor text-slate-400 mt-0.5">
                  {(attachedFile.size / 1024).toFixed(1)} KB • {attachedFile.type?.startsWith('image/') || attachedFile.isImage ? 'Image' : 'Document'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRemoveAttachedFile}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Search Capsule with Concentric Right Circle Button */}
          <form
            onSubmit={handleSubmit}
            className={`w-full h-[54px] sm:h-[56px] rounded-full flex items-center pl-4 sm:pl-6 pr-[4px] sm:pr-[5px] shadow-xl transition-all border ${
              isLight 
                ? 'bg-white/85 border-slate-300 focus-within:border-slate-400 shadow-[0_12px_36px_rgba(15,23,42,0.08)]' 
                : 'bg-white/[0.08] border-white/[0.08] focus-within:border-white/[0.18]'
            }`}
            style={{
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)'
            }}
          >
            {/* Search Icon */}
            <Search size={18} className={`${isLight ? 'text-slate-500' : 'text-white/35'} shrink-0 mr-2.5 sm:mr-3.5 transition-opacity duration-150 ${isGlidingDown ? 'opacity-0' : 'opacity-100'}`} strokeWidth={2} />

            {/* Input Field with Inline Syntax Highlighting: Only slash command is light blue */}
            <div className={`flex-1 relative flex items-center h-full min-w-0 transition-opacity duration-150 ${
              isGlidingDown ? 'opacity-0' : 'opacity-100'
            }`}>
              {/* Underlying Formatted Syntax Layer */}
              <div 
                aria-hidden="true" 
                className="absolute inset-0 flex items-center pointer-events-none text-xs sm:text-sm font-victor whitespace-pre overflow-hidden tracking-wide select-none"
              >
                {inputText.startsWith('/') ? (() => {
                  const spaceIdx = inputText.indexOf(' ');
                  if (spaceIdx === -1) {
                    return <span className={`${isLight ? 'text-sky-600' : 'text-sky-300'} font-medium`}>{inputText}</span>;
                  }
                  return (
                    <>
                      <span className={`${isLight ? 'text-sky-600' : 'text-sky-300'} font-medium`}>{inputText.slice(0, spaceIdx)}</span>
                      <span className={isLight ? 'text-slate-900' : 'text-white'}>{inputText.slice(spaceIdx)}</span>
                    </>
                  );
                })() : (
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>{inputText}</span>
                )}
              </div>

              {/* Real Input: Transparent text when active, caret visible */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setSlashIndex(0);
                }}
                onKeyDown={(e) => {
                  if (isSlashMenuOpen && matchingSlashCommands.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSlashIndex(prev => (prev + 1) % matchingSlashCommands.length);
                      return;
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSlashIndex(prev => (prev - 1 + matchingSlashCommands.length) % matchingSlashCommands.length);
                      return;
                    } else if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      handleSelectSlashCommand(matchingSlashCommands[slashIndex % matchingSlashCommands.length]);
                      return;
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setInputText('');
                      return;
                    }
                  }

                  if (!isTemporaryChat && /^\s*(\/temp|\/temporary|temporary|temp)\b/i.test(inputText)) {
                    if (e.key === 'Tab' || (e.key === 'Enter' && !inputText.trim().replace(/^\/temporary|\/temp|temporary|temp/i, ''))) {
                      e.preventDefault();
                      onToggleTemporaryChat?.(true);
                      setInputText('');
                    }
                  }
                }}
                placeholder={SHUFFLE_PLACEHOLDERS[placeholderIndex]}
                className={`w-full h-full bg-transparent text-xs sm:text-sm font-victor focus:outline-none tracking-wide ${
                  isLight
                    ? `placeholder:text-slate-500 caret-slate-900 ${inputText ? 'text-transparent' : 'text-slate-900'}`
                    : `placeholder:text-white/30 caret-white ${inputText ? 'text-transparent' : 'text-white'}`
                }`}
              />
            </div>

            {/* Concentric Right Arrow Button */}
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedFile}
              className={`w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer ${
                isGlidingDown ? 'opacity-0' : 'opacity-100'
              } ${
                inputText.trim() || attachedFile
                  ? isLight
                    ? 'bg-slate-900 text-white shadow-md hover:bg-black hover:scale-105'
                    : 'bg-white/50 text-slate-950 shadow-md hover:scale-105'
                  : isLight
                    ? 'bg-slate-200/90 text-slate-600 hover:bg-slate-300 hover:text-slate-900 border border-slate-300/80 shadow-xs'
                    : 'bg-white/20 text-slate-800 hover:bg-white/30'
              }`}
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </form>

          {/* Sub-Pill Controls with Concentric Action Buttons */}
          <div className={`mt-3.5 relative transition-opacity duration-200 ease-out animate-in fade-in duration-250 fill-mode-both ${
            isGlidingDown ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <div 
              className={`h-[40px] sm:h-[42px] rounded-full flex items-center pl-4 sm:pl-5 pr-[4px] border shadow-lg relative ${
                isLight 
                  ? 'bg-white/85 border-slate-300 shadow-[0_6px_20px_rgba(15,23,42,0.06)]' 
                  : 'bg-white/[0.06] border-white/[0.08]'
              }`}
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              {/* Model Selector Trigger & Popup */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                  className={`font-victor text-xs font-medium transition-colors cursor-pointer mr-3 flex items-center ${
                    isLight ? 'text-slate-800 hover:text-slate-950' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span>{selectedModel?.name || 'Astracore 4'}</span>
                </button>

                <ModelSelector
                  isOpen={isModelSelectorOpen}
                  onClose={() => setIsModelSelectorOpen(false)}
                  selectedModel={selectedModel}
                  onSelectModel={onSelectModel}
                  isLight={isLight}
                  position="top-left"
                />
              </div>

              {/* Concentric Mic Button */}
              <button
                type="button"
                onClick={() => toggleListening(inputText)}
                title={isListening ? "Microphone Active (Listening...)" : "Turn on Microphone"}
                className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all cursor-pointer mr-1.5 ${
                  isListening 
                    ? (isLight ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-400 animate-pulse' : 'bg-white text-slate-950 shadow-md ring-2 ring-white/40 animate-pulse')
                    : (isLight ? 'text-slate-700 bg-slate-200/90 hover:bg-slate-300 hover:text-slate-950 border border-slate-300/80 shadow-xs' : 'text-slate-800 bg-white/20 hover:bg-white/30')
                }`}
              >
                {isListening ? (
                  <Mic size={14} strokeWidth={2.2} />
                ) : (
                  <MicOff size={14} strokeWidth={2.2} />
                )}
              </button>

              {/* Concentric Plus Button with anchored ToolsMenu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  title="Add Tools / Files"
                  className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isLight ? 'text-slate-700 bg-slate-200/90 hover:bg-slate-300 hover:text-slate-950 border border-slate-300/80 shadow-xs' : 'text-slate-900 bg-white/25 hover:bg-white/35'
                  }`}
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>

                <ToolsMenu
                  isOpen={isToolsMenuOpen}
                  onClose={() => setIsToolsMenuOpen(false)}
                  onAttachFile={onAttachFile}
                  webSearchActive={webSearchActive}
                  onToggleWebSearch={onToggleWebSearch}
                  isLight={isLight}
                  position="top-right"
                />
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
