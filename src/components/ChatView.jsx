import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ArrowRight, 
  Copy, 
  Check, 
  RotateCw, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Plus, 
  Mic, 
  MicOff, 
  FileText, 
  X,
  Share2,
  FlaskConical,
  Clock,
  Sparkles
} from 'lucide-react';
import AstraLogo from './AstraLogo';
import MarkdownRenderer from './MarkdownRenderer';
import ModelSelector from './ModelSelector';
import ToolsMenu from './ToolsMenu';
import ShareMenu from './ShareMenu';
import SlashCommandMenu, { SLASH_COMMANDS } from './SlashCommandMenu';
import ResearchResponseCard from './ResearchResponseCard';
import { useSpeechRecognition } from '../utils/useSpeech';

const SHUFFLE_PLACEHOLDERS = [
  'Ask anything...',
  'Explore ideas & research...',
  'Summarize documents & PDFs...',
  'Analyze code & data...',
  'Type a message...'
];

export default function ChatView({
  isSidebarOpen,
  onToggleSidebar,
  ambientMode = 'cosmic',
  onToggleTheme,
  conversation,
  onSendMessage,
  onBackToHero,
  onRegenerate,
  onOpenInCodeStudio,
  onOpenInResearchStudio,
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
  const [copiedMessageId, setCopiedMessageId] = useState(null);

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
  const [messageFeedback, setMessageFeedback] = useState({}); // { [msgId]: 'like' | 'dislike' }
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Real-time continuous speech recognition
  const { isListening, toggleListening } = useSpeechRecognition((transcript) => {
    setInputText(transcript);
  });

  const messagesEndRef = useRef(null);

  // Rotate placeholders every 4.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SHUFFLE_PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const [isGlidingUp, setIsGlidingUp] = useState(false);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleBackToHeroClick = () => {
    if (isGlidingUp) return;
    setIsGlidingUp(true);
    // Smooth, reverse glide-up transition (300ms)
    setTimeout(() => {
      onBackToHero();
      setIsGlidingUp(false);
    }, 300);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

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

    onSendMessage(textToSend);
    setInputText('');
    if (onRemoveAttachedFile) onRemoveAttachedFile();
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleSpeak = (id, text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_~\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingMessageId(id);
    }
  };

  const handleFeedback = (id, type) => {
    setMessageFeedback(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type
    }));
  };

  const handleRegenerateClick = async (id) => {
    if (onRegenerate) {
      setRegeneratingId(id);
      await onRegenerate(id);
      setRegeneratingId(null);
    }
  };

  if (!conversation) return null;

  return (
    <div className="flex-1 flex flex-col h-full relative z-10 select-none overflow-hidden">
      {/* Sleek Minimal Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-[#1c222c] border border-white/[0.08] text-white text-xs font-victor shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          <Check size={13} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Chat Header */}
      <header className={`w-full md:h-14 md:pt-0 md:pb-0 border-b px-3 sm:px-4 md:px-6 flex items-center justify-between backdrop-blur-xl shrink-0 z-30 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 transition-opacity duration-200 ease-out ${
        isGlidingUp ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isLight ? 'bg-white/90 border-slate-200 text-slate-900 shadow-xs' : 'glass-panel border-white/[0.06] text-white'
      }`}>
        <div className="flex items-center gap-2">
          {/* Top Left Sidebar Toggle Button */}
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              title="Open Sidebar"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer mr-1 ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.05]' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5V35M8.33333 5H31.6667C33.5076 5 35 6.49238 35 8.33333V31.6667C35 33.5076 33.5076 35 31.6667 35H8.33333C6.49238 35 5 33.5076 5 31.6667V8.33333C5 6.49238 6.49238 5 8.33333 5Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Back to Hero Button */}
          <button
            onClick={handleBackToHeroClick}
            title="Back to Hero"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'bg-white/60 hover:bg-white border border-slate-300/80 text-slate-700 hover:text-slate-950 shadow-xs' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="ml-1 flex items-center gap-2">
            <h2 className={`text-xs md:text-sm font-semibold font-victor truncate max-w-xs sm:max-w-md ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {conversation.title}
            </h2>
            {isTemporaryChat && (
              <span className={`px-2 py-0.5 rounded-full border border-dashed text-[10px] font-victor flex items-center gap-1 shrink-0 ${
                isLight ? 'border-slate-400 bg-slate-100 text-slate-700' : 'border-white/40 bg-white/5 text-white/70'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? 'bg-slate-600' : 'bg-white/70'}`} />
                Temporary Chat
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Share / Export Trigger */}
          <button
            onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'bg-white/60 hover:bg-white border border-slate-300/80 text-slate-700 hover:text-slate-950 shadow-xs' : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Share or Export Chat"
          >
            <Share2 size={15} />
          </button>

          {/* Anchored Minimalist Share Menu */}
          <ShareMenu
            isOpen={isShareMenuOpen}
            onClose={() => setIsShareMenuOpen(false)}
            conversation={conversation}
            isLight={isLight}
            onToast={showToast}
          />
        </div>
      </header>

      {/* Messages Stream Container with Edge Scrollbar */}
      <div className={`flex-1 overflow-y-auto scrollbar-edge w-full transition-opacity duration-200 ease-out ${
        isGlidingUp ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {conversation.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const feedback = messageFeedback[msg.id];
            const isSpeaking = speakingMessageId === msg.id;
            const isRegenerating = regeneratingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  isUser ? 'justify-end' : 'justify-start items-start'
                }`}
              >
                {/* Assistant Branding SVG 'A' Logo strictly placed at TOP LEFT and top-aligned */}
                {!isUser && (
                  <div className="shrink-0 mt-0 select-none pt-0.5" title="ASTRX">
                    <AstraLogo size={30} color={isLight ? "#0f172a" : "#ffffff"} />
                  </div>
                )}

                <div
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? `max-w-[85%] sm:max-w-[78%] ${
                          isLight
                            ? `bg-slate-100/90 text-slate-900 ${
                                isTemporaryChat 
                                  ? 'border-2 border-dashed border-slate-400 ring-1 ring-slate-200' 
                                  : 'border border-slate-250 shadow-sm'
                              }`
                            : `bg-white/[0.12] text-white ${
                                isTemporaryChat 
                                  ? 'border-2 border-dashed border-white/50 ring-1 ring-white/10' 
                                  : 'border border-white/[0.08] shadow-md'
                              }`
                        } font-victor rounded-2xl p-4`
                      : `flex-1 min-w-0 font-victor pt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`
                  }`}
                >

                  {/* User Message Attachment (Claude-style card / image thumbnail) */}
                  {isUser && msg.attachment && (
                    <div className="mb-3">
                      {msg.attachment.type?.startsWith('image/') || msg.attachment.isImage ? (
                        <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl bg-black/40 max-w-xs sm:max-w-sm">
                          <img
                            src={msg.attachment.url || msg.attachment.previewUrl}
                            alt={msg.attachment.name}
                            className="w-full max-h-72 object-contain bg-black/50 rounded-xl hover:scale-[1.01] transition-transform cursor-pointer"
                            onClick={() => window.open(msg.attachment.url || msg.attachment.previewUrl, '_blank')}
                          />
                          <div className="px-3 py-1.5 bg-black/70 backdrop-blur-md flex items-center justify-between text-[11px] text-slate-300 font-victor">
                            <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                            <span className="text-slate-400 text-[10px]">
                              {msg.attachment.size ? `${(msg.attachment.size / 1024).toFixed(0)} KB` : 'Image'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-3 p-2.5 rounded-xl border max-w-xs ${
                          isLight ? 'bg-slate-200/80 border-slate-300 text-slate-800' : 'bg-white/[0.08] border-white/[0.08]'
                        }`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isLight ? 'bg-slate-300 text-slate-800' : 'bg-white/10 text-white'
                          }`}>
                            <FileText size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-victor font-medium truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{msg.attachment.name}</p>
                            <p className="text-[10px] font-victor text-slate-400">
                              {msg.attachment.size ? `${(msg.attachment.size / 1024).toFixed(1)} KB` : 'Document'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content: Research card, thinking state, standard markdown, or user text */}
                  {isUser ? (
                    msg.text ? (
                      <div className="whitespace-pre-wrap font-victor text-[13px] leading-relaxed">
                        {msg.text}
                      </div>
                    ) : null
                  ) : msg.isThinking ? (
                    /* Simple clean thinking dots */
                    <div className="flex items-center gap-1.5 py-2">
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isLight ? 'bg-slate-400' : 'bg-white/60'}`} />
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isLight ? 'bg-slate-400' : 'bg-white/60'}`} />
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLight ? 'bg-slate-400' : 'bg-white/60'}`} />
                    </div>
                  ) : msg.isResearching ? (
                    /* Live Multi-Stage Autonomous Research Progress Card */
                    <div className="p-4 rounded-2xl bg-[#1c222c] border border-white/[0.08] shadow-2xl space-y-3 w-full animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-white/80 animate-ping" />
                          <span className="text-xs font-semibold text-white uppercase tracking-wider font-victor">
                            Autonomous Research in Progress
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-white/60">
                          <Clock size={13} />
                          <span>~{msg.timeLeftSec ?? 14}s remaining</span>
                        </div>
                      </div>

                      {/* Dynamic Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-white/80 transition-all duration-300 rounded-full"
                          style={{ width: `${msg.progress ?? 50}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-victor text-white/70">
                        <span className="italic text-[11px] text-white/50">{msg.currentStage || 'Ingesting peer-reviewed literature & data...'}</span>
                        <span className="font-mono text-white/80 font-bold">{msg.progress ?? 50}%</span>
                      </div>
                    </div>
                  ) : msg.researchData ? (
                    /* Publication-Ready Academic Research Document Card with PDF Download */
                    <ResearchResponseCard 
                      researchData={msg.researchData} 
                      onOpenInResearchStudio={onOpenInResearchStudio} 
                    />
                  ) : (
                    <div className="space-y-2">
                      <MarkdownRenderer 
                        content={msg.text} 
                        onOpenInCodeStudio={onOpenInCodeStudio} 
                      />
                    </div>
                  )}


                  {/* Clean Minimal AI Response Footer (Copy, Speak, Like, Dislike, Regenerate, Timestamp - NO LINES) */}
                  {!isUser && !msg.isThinking && !msg.isResearching && (
                    <div className={`mt-3 flex items-center gap-2 font-victor select-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {/* 1. Copy button */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {copiedMessageId === msg.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      </button>

                      {/* 2. Read Aloud / Speak button */}
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.text)}
                        title={isSpeaking ? "Stop reading" : "Read aloud"}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isSpeaking 
                            ? (isLight ? 'text-slate-950 animate-pulse font-medium' : 'text-white animate-pulse') 
                            : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                        }`}
                      >
                        {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>

                      {/* 3. Like button */}
                      <button
                        onClick={() => handleFeedback(msg.id, 'like')}
                        title="Good response"
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          feedback === 'like' 
                            ? (isLight ? 'text-slate-900' : 'text-white') 
                            : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                        }`}
                      >
                        <ThumbsUp size={15} fill={feedback === 'like' ? 'currentColor' : 'none'} />
                      </button>

                      {/* 4. Dislike button */}
                      <button
                        onClick={() => handleFeedback(msg.id, 'dislike')}
                        title="Bad response"
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          feedback === 'dislike' ? 'text-rose-500' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                        }`}
                      >
                        <ThumbsDown size={15} fill={feedback === 'dislike' ? 'currentColor' : 'none'} />
                      </button>

                      {/* 5. Regenerate button */}
                      <button
                        onClick={() => handleRegenerateClick(msg.id)}
                        title="Regenerate response"
                        className={`p-1 rounded transition-all cursor-pointer ${
                          isRegenerating ? 'animate-spin text-slate-900' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
                        }`}
                      >
                        <RotateCw size={15} />
                      </button>

                      {/* 6. Simple timestamp text */}
                      <span className={`text-[11px] ml-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {msg.timestamp || 'just now'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Chat Input Bar with Concentric Left Tools Button, Integrated Mic, and Model Subtext */}
      <div className={`px-3 sm:px-4 md:p-6 pt-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] mx-auto w-full shrink-0 relative z-20 transition-all duration-320 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isGlidingUp ? '-translate-y-[calc(40vh-20px)] md:-translate-y-[calc(38vh-20px)] max-w-[94vw] sm:max-w-[620px]' : 'translate-y-0 max-w-3xl'
      }`}>
        {/* Uploading Progress Feedback Card */}
        {uploadProgress?.isUploading && (
          <div className="mb-2.5 p-3 rounded-xl border border-white/[0.08] bg-[#0d1624]/90 backdrop-blur-xl shadow-2xl max-w-md animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2">
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

        {/* Claude.ai Style Drafting Attachment Preview Card */}
        {attachedFile && !uploadProgress?.isUploading && (
          <div className="mb-2.5 flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] bg-[#0d1624]/90 backdrop-blur-xl shadow-2xl max-w-md animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-3 min-w-0">
              {attachedFile.isImage || attachedFile.type?.startsWith('image/') ? (
                <img
                  src={attachedFile.previewUrl}
                  alt={attachedFile.name}
                  className="w-10 h-10 object-cover rounded-lg border border-white/[0.08] shrink-0 bg-black/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                  <FileText size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-victor font-medium text-white truncate max-w-[240px]">
                  {attachedFile.name}
                </p>
                <p className="text-[10px] font-victor text-slate-400">
                  {attachedFile.size ? `${(attachedFile.size / 1024).toFixed(1)} KB` : 'Attached'}
                  {attachedFile.isPdf ? ' • PDF' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onRemoveAttachedFile}
              title="Remove attachment"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="flex flex-col items-center w-full">
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

          {/* Main Integrated Chat Capsule Bar with Reduced Subtle Border */}
          <form
            onSubmit={handleSubmit}
            className={`w-full h-[56px] rounded-full border px-[5px] flex items-center shadow-xl transition-all relative ${
              isLight
                ? 'bg-white/85 border-slate-300 focus-within:border-slate-400 shadow-[0_12px_36px_rgba(15,23,42,0.08)]'
                : 'border-white/[0.08] bg-white/[0.08] focus-within:border-white/[0.18]'
            }`}
            style={{
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)'
            }}
          >
            {/* Left Concentric Plus / Tools Button */}
            <div className={`relative shrink-0 flex items-center transition-opacity duration-150 ${
              isGlidingUp ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-in fade-in duration-300 delay-100 fill-mode-both'
            }`}>
              <button
                type="button"
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                title="Add Tools / Attach Files"
                className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-700 bg-slate-200/90 hover:bg-slate-300 hover:text-slate-950 border border-slate-300/80 shadow-xs'
                    : 'text-slate-900 bg-white/30 hover:bg-white/40'
                }`}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>

              <ToolsMenu
                isOpen={isToolsMenuOpen}
                onClose={() => setIsToolsMenuOpen(false)}
                onAttachFile={onAttachFile}
                webSearchActive={webSearchActive}
                onToggleWebSearch={onToggleWebSearch}
                isLight={isLight}
                position="top-left"
              />
            </div>

            {/* Middle Input Field with Inline Syntax Highlighting */}
            <div className="flex-1 relative flex items-center h-full min-w-0 px-3.5">
              {/* Underlying Formatted Syntax Layer */}
              <div 
                aria-hidden="true" 
                className="absolute inset-0 px-3.5 flex items-center pointer-events-none text-xs sm:text-[13px] font-victor whitespace-pre overflow-hidden tracking-wide select-none"
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
                className={`w-full h-full bg-transparent text-xs sm:text-[13px] font-victor focus:outline-none tracking-wide ${
                  isLight
                    ? `placeholder:text-slate-500 caret-slate-900 ${inputText ? 'text-transparent' : 'text-slate-900'}`
                    : `placeholder:text-white/30 caret-white ${inputText ? 'text-transparent' : 'text-white'}`
                }`}
              />
            </div>

            {/* Right side: Microphone Button */}
            <button
              type="button"
              onClick={() => toggleListening(inputText)}
              title={isListening ? "Microphone Active (Listening...)" : "Voice input"}
              className={`p-2 rounded-full mr-1 transition-all cursor-pointer ${
                isGlidingUp ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-in fade-in duration-300 delay-100 fill-mode-both'
              } ${
                isListening 
                  ? (isLight ? 'text-slate-950 bg-slate-200 animate-pulse ring-1 ring-slate-400' : 'text-white bg-white/20 animate-pulse ring-1 ring-white/30')
                  : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-white/35 hover:text-white/80')
              }`}
            >
              {isListening ? (
                <Mic size={17} strokeWidth={2.2} />
              ) : (
                <MicOff size={17} strokeWidth={2} />
              )}
            </button>

            {/* Right Concentric Send Arrow Button */}
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedFile}
              className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isGlidingUp ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-in fade-in duration-300 delay-100 fill-mode-both'
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

          {/* Subtext Footer (Inward Indented Away From Extreme Edges) */}
          <div className={`w-full mt-2 px-2 sm:px-6 max-w-2xl flex items-center justify-between text-[10px] sm:text-[11px] font-victor select-none gap-2 transition-opacity duration-150 ${
            isGlidingUp ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-in fade-in duration-300 delay-150 fill-mode-both'
          } ${
            isLight ? 'text-slate-400' : 'text-white/35'
          }`}>
            <span className="truncate">Astra is AI and can make mistakes.</span>

            {/* Clickable Model Indicator with Popover */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className={`transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/45 hover:text-white/80'
                }`}
                title="Change Model"
              >
                <span>{selectedModel?.name || 'Astracore 4'}</span>
              </button>

              <ModelSelector
                isOpen={isModelSelectorOpen}
                onClose={() => setIsModelSelectorOpen(false)}
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                isLight={isLight}
                position="top-right"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
