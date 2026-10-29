import React, { useState, useEffect } from 'react';
import Background from './components/Background';
import Sidebar from './components/Sidebar';
import HeroView from './components/HeroView';
import ChatView from './components/ChatView';
import CodeStudio from './components/CodeStudio';
import { AssetsView, StudyView } from './components/ExtraViews';
import { AVAILABLE_MODELS } from './data/mockData';
import { askGroqAI } from './utils/aiResponse';
import { processUploadedFile } from './utils/fileReader';
import { conductAutonomousResearch } from './utils/researchGenerator';



export default function App() {
  // Sidebar open/collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Ambient lighting theme state: only 2 modes ('cosmic' | 'light')
  const [ambientMode, setAmbientMode] = useState(() => {
    try {
      const saved = localStorage.getItem('astrx_theme');
      return (saved === 'light') ? 'light' : 'cosmic';
    } catch {
      return 'cosmic';
    }
  });
  
  // Active selected model
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  
  // Conversations list & active chat (starts completely clean, persists real user chats)
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('astrx_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'assets' | 'code' | 'study'
  const [codeStudioData, setCodeStudioData] = useState({ code: '', language: 'python' });
  const [researchStudioData, setResearchStudioData] = useState({ topic: '', initialCode: '' });

  // Temporary ephemeral chat state
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [tempConversation, setTempConversation] = useState(null);

  // Authenticated user profile state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('astrx_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      username: 'Astrx User',
      email: 'user@astrxai.com',
      queryLimit: 50,
      queriesUsed: 0,
      createdAt: new Date().toISOString()
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('astrx_user', JSON.stringify(user));
    } catch {}
  }, [user]);

  // Modals state
  const [isAllConversationsOpen, setIsAllConversationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Search, Deep Research & tools state
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [researchModeActive, setResearchModeActive] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ isUploading: false, progress: 0, status: '', fileName: '' });


  useEffect(() => {
    try {
      localStorage.setItem('astrx_theme', ambientMode);
    } catch {}
  }, [ambientMode]);

  useEffect(() => {
    try {
      localStorage.setItem('astrx_chats', JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const handleUpdateUsername = (newUsername) => {
    setUser(prev => ({
      ...prev,
      username: newUsername
    }));
  };

  const handleUpdateAvatar = (avatarId) => {
    setUser(prev => ({
      ...prev,
      avatarId: avatarId
    }));
  };

  const handleDeleteAccount = () => {
    try {
      localStorage.removeItem('astrx_user');
      localStorage.removeItem('astrx_chats');
      localStorage.removeItem('astrx_assets');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/login.html';
  };

  const handleLogout = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.href = '/login.html';
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleToggleTheme = () => {
    setAmbientMode(prev => prev === 'cosmic' ? 'light' : 'cosmic');
  };

  const handleToggleTemporaryChat = () => {
    if (!isTemporaryChat) {
      setIsTemporaryChat(true);
      setTempConversation({
        id: 'temp-session',
        title: 'Temporary Chat',
        category: 'Ephemeral',
        date: 'Just now',
        messages: []
      });
      setCurrentChatId(null);
      setActiveTab('home');
      setAttachedFile(null);
    } else {
      setIsTemporaryChat(false);
      setTempConversation(null);
      setCurrentChatId(null);
      setActiveTab('home');
      setAttachedFile(null);
    }
  };

  const handleSelectConversation = (chatId) => {
    if (isTemporaryChat) {
      setIsTemporaryChat(false);
      setTempConversation(null);
    }
    setCurrentChatId(chatId);
    setActiveTab('chat');
  };

  const handleNewConversation = () => {
    if (isTemporaryChat) {
      setIsTemporaryChat(false);
      setTempConversation(null);
    }
    setCurrentChatId(null);
    setActiveTab('home');
    setAttachedFile(null);
  };


  const handleDeleteConversation = (chatId) => {
    setConversations(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      handleNewConversation();
    }
  };

  const handleClearAllConversations = () => {
    setConversations([]);
    handleNewConversation();
  };

  const handleAttachFile = async (rawFile) => {
    if (rawFile) {
      // If it's already an existing asset from Assets Archive
      if (rawFile.id && (rawFile.content !== undefined || rawFile.extractedText !== undefined || rawFile.previewUrl !== undefined)) {
        setAttachedFile({
          name: rawFile.name,
          size: typeof rawFile.size === 'number' ? rawFile.size : 10240,
          extractedText: rawFile.content || rawFile.extractedText || '',
          previewUrl: rawFile.previewUrl || rawFile.base64Data,
          base64Data: rawFile.previewUrl || rawFile.base64Data,
          isImage: rawFile.type === 'image' || rawFile.isImage,
          mimeType: rawFile.type === 'image' ? 'image/png' : 'application/pdf'
        });
        return;
      }

      setUploadProgress({
        isUploading: true,
        progress: 15,
        status: `Reading ${rawFile.name}...`,
        fileName: rawFile.name
      });
      try {
        const processed = await processUploadedFile(rawFile, (pct, statusText) => {
          setUploadProgress({
            isUploading: true,
            progress: pct,
            status: statusText,
            fileName: rawFile.name
          });
        });
        setAttachedFile(processed);
        setUploadProgress({
          isUploading: true,
          progress: 100,
          status: 'Context indexed!',
          fileName: rawFile.name
        });
        setTimeout(() => {
          setUploadProgress({ isUploading: false, progress: 0, status: '', fileName: '' });
        }, 800);
      } catch (err) {
        console.error("Error processing file:", err);
        setUploadProgress({ isUploading: false, progress: 0, status: '', fileName: '' });
      }
    }
  };

  // Submit prompt from hero or chat
  const handleSubmitPrompt = async (text, fileAttachment = attachedFile) => {
    // Clear draft attachment chip immediately upon submission so it doesn't linger in chatbox
    setAttachedFile(null);

    // Decrement query remaining counter by tracking queriesUsed
    setUser(prev => ({
      ...prev,
      queriesUsed: (prev.queriesUsed || 0) + 1
    }));

    const attachmentData = fileAttachment
      ? {
          name: fileAttachment.name,
          type: fileAttachment.type,
          size: fileAttachment.size,
          isImage: fileAttachment.isImage,
          isPdf: fileAttachment.isPdf,
          isText: fileAttachment.isText,
          url: fileAttachment.previewUrl || '',
          previewUrl: fileAttachment.previewUrl || '',
          base64Data: fileAttachment.base64Data || '',
          extractedText: fileAttachment.extractedText || ''
        }
      : null;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text,
      attachment: attachmentData,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const convHistory = isTemporaryChat 
      ? (tempConversation?.messages || [])
      : (conversations.find(c => c.id === currentChatId)?.messages || []);

    const isResearchIntent = (query, history) => {
      if (researchModeActive) return true;
      if (!query) return false;
      const q = query.toLowerCase().trim();
      const triggers = [
        'research on',
        'research about',
        'deep research',
        'conduct research',
        'academic paper',
        'research paper',
        'latex paper',
        'write a paper on',
        'generate a paper on',
        'scientific paper on'
      ];
      if (triggers.some(t => q.includes(t)) || q.startsWith('research ')) {
        return true;
      }
      return false;
    };

    if (isResearchIntent(text, convHistory)) {
      let targetChatId = currentChatId;
      const aiMsgId = `msg-${Date.now() + 1}`;

      const loadingAiMsg = {
        id: aiMsgId,
        sender: 'assistant',
        isResearching: true,
        progress: 10,
        timeLeftSec: 15,
        currentStage: 'Scraping preprint databases, ArXiv & scientific literature...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'ASTRX Research Kernel'
      };

      if (!targetChatId || activeTab === 'home') {
        const newConvId = `conv-${Date.now()}`;
        const titleText = text.replace(/^research\s*(on|about)?\s*/i, '') || 'Research Analysis';
        const newConv = {
          id: newConvId,
          title: titleText.length > 28 ? `${titleText.slice(0, 28)}...` : titleText,
          category: 'Research',
          date: 'Just now',
          messages: [userMsg, loadingAiMsg]
        };
        setConversations(prev => [newConv, ...prev]);
        setCurrentChatId(newConvId);
        targetChatId = newConvId;
        setActiveTab('chat');
      } else {
        setConversations(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: [...c.messages, userMsg, loadingAiMsg]
            };
          }
          return c;
        }));
      }

      // Live progress and time left countdown simulation
      const startTime = Date.now();
      const duration = 14000;
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(94, Math.round((elapsed / duration) * 94));
        const rem = Math.max(1, Math.ceil((duration - elapsed) / 1000));
        let stage = 'Scraping preprint databases, ArXiv & scientific literature...';
        if (pct > 25 && pct < 50) stage = 'Synthesizing empirical findings & quantitative datasets...';
        else if (pct >= 50 && pct < 75) stage = 'Deriving mathematical equations & theoretical proofs...';
        else if (pct >= 75) stage = 'Typesetting publication-grade academic LaTeX code...';

        setConversations(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMsgId ? {
                ...m,
                progress: pct,
                timeLeftSec: rem,
                currentStage: stage
              } : m)
            };
          }
          return c;
        }));
      }, 400);

      try {
        const researchResult = await conductAutonomousResearch(text, convHistory);
        clearInterval(progressTimer);

        setConversations(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMsgId ? {
                ...m,
                isResearching: false,
                progress: 100,
                timeLeftSec: 0,
                text: researchResult.latexCode,
                researchData: researchResult
              } : m)
            };
          }
          return c;
        }));

        // Auto-save research paper to Assets Archive
        try {
          const savedAssets = JSON.parse(localStorage.getItem('astrx_assets') || '[]');
          const now = new Date();
          const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          const docTitle = text.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 32) + '_Research.pdf';
          const newAsset = {
            id: `asset-${Date.now()}`,
            name: docTitle,
            type: 'research',
            size: '4.8 MB',
            dateTime: `${formattedDate} • ${formattedTime}`,
            tag: 'Research',
            category: 'research',
            content: researchResult.latexCode
          };
          localStorage.setItem('astrx_assets', JSON.stringify([newAsset, ...savedAssets]));
        } catch (e) {
          console.error("Failed to archive research paper:", e);
        }
      } catch (err) {
        clearInterval(progressTimer);
        console.error("Research execution error:", err);
      }
      return;
    }

    const aiMsgId = `msg-${Date.now() + 1}`;
    const aiThinkingMsg = {
      id: aiMsgId,
      sender: 'assistant',
      isThinking: true,
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel.name
    };

    if (isTemporaryChat) {
      const existingTemp = tempConversation?.messages || [];
      const priorTempHistory = existingTemp.filter(m => !m.isThinking && !m.isResearching && m.text);
      const updatedMessages = [...existingTemp, userMsg, aiThinkingMsg];
      setTempConversation(prev => ({
        ...(prev || { id: 'temp-session', title: 'Temporary Chat' }),
        messages: updatedMessages
      }));
      setActiveTab('chat');

      try {
        const reply = await askGroqAI(
          priorTempHistory, 
          text, 
          selectedModel.name, 
          webSearchActive, 
          attachmentData
        );
        
        setTempConversation(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === aiMsgId ? {
            ...m,
            isThinking: false,
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } : m)
        }));
      } catch (err) {
        console.error("AI response error in temporary chat:", err);
        setTempConversation(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === aiMsgId ? {
            ...m,
            isThinking: false,
            text: 'I encountered an issue generating a response. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } : m)
        }));
      }
      return;
    }


    if (attachmentData) {
      try {
        const savedAssets = JSON.parse(localStorage.getItem('astrx_assets') || '[]');
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        let assetType = 'doc';
        let assetCategory = 'documents';
        let assetTag = 'Document';

        if (attachmentData.isImage) {
          assetType = 'image';
          assetCategory = 'images';
          assetTag = 'Image';
        } else if (attachmentData.name.endsWith('.py') || attachmentData.name.endsWith('.js') || attachmentData.name.endsWith('.ts')) {
          assetType = 'code';
          assetCategory = 'code';
          assetTag = 'Script';
        } else if (attachmentData.name.toLowerCase().includes('research') || attachmentData.name.toLowerCase().includes('report') || attachmentData.name.toLowerCase().includes('paper')) {
          assetType = 'research';
          assetCategory = 'research';
          assetTag = 'Research';
        }

        const sizeStr = typeof attachmentData.size === 'number'
          ? (attachmentData.size > 1024 * 1024 
              ? `${(attachmentData.size / (1024 * 1024)).toFixed(1)} MB` 
              : `${Math.max(1, Math.round(attachmentData.size / 1024))} KB`)
          : String(attachmentData.size || '12 KB');

        const newArchiveAsset = {
          id: `asset-${Date.now()}`,
          name: attachmentData.name,
          type: assetType,
          size: sizeStr,
          dateTime: `${formattedDate} • ${formattedTime}`,
          tag: assetTag,
          category: assetCategory,
          previewUrl: attachmentData.previewUrl || attachmentData.base64Data,
          content: attachmentData.extractedText || ''
        };

        const updatedAssets = [newArchiveAsset, ...savedAssets.filter(a => a.name !== attachmentData.name)];
        localStorage.setItem('astrx_assets', JSON.stringify(updatedAssets));
      } catch (err) {
        console.error("Auto archive error:", err);
      }
    }

    const isNew = !currentChatId || activeTab === 'home';
    const targetChatId = isNew ? `conv-${Date.now()}` : currentChatId;
    const existingMessages = isNew ? [] : (conversations.find(c => c.id === currentChatId)?.messages || []);
    const priorHistory = existingMessages.filter(m => !m.isThinking && !m.isResearching && m.text);

    if (isNew) {
      // Create new conversation
      const titleText = text || fileAttachment?.name || 'New Conversation';
      const newConv = {
        id: targetChatId,
        title: titleText.length > 24 ? `${titleText.slice(0, 24)}...` : titleText,
        category: 'Discussion',
        date: 'Just now',
        messages: [userMsg, aiThinkingMsg]
      };
      setConversations(prev => [newConv, ...prev]);
      setCurrentChatId(targetChatId);
      setActiveTab('chat');
    } else {
      // Append to current conversation
      setConversations(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: [...c.messages, userMsg, aiThinkingMsg]
          };
        }
        return c;
      }));
    }

    // Fetch real live AI response with complete history continuity
    try {
      const reply = await askGroqAI(
        priorHistory, 
        text, 
        selectedModel.name, 
        webSearchActive, 
        attachmentData
      );

      setConversations(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === aiMsgId ? {
              ...m,
              isThinking: false,
              text: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : m)
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("AI response error:", err);
      setConversations(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === aiMsgId ? {
              ...m,
              isThinking: false,
              text: 'I encountered an issue generating a response. Please try again.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : m)
          };
        }
        return c;
      }));
    }
  };

  const handleRegenerateMessage = async (msgId) => {
    if (isTemporaryChat) {
      if (!tempConversation) return;
      const msgIndex = tempConversation.messages.findIndex(m => m.id === msgId);
      if (msgIndex === -1) return;

      let priorUserMsg = null;
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (tempConversation.messages[i].sender === 'user') {
          priorUserMsg = tempConversation.messages[i];
          break;
        }
      }

      if (!priorUserMsg) return;

      const history = tempConversation.messages.slice(0, msgIndex).filter(m => !m.isThinking);
      setTempConversation(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === msgId ? { ...m, isThinking: true, text: '' } : m)
      }));

      try {
        const reply = await askGroqAI(
          history, 
          priorUserMsg.text, 
          selectedModel.name, 
          webSearchActive, 
          priorUserMsg.attachment
        );

        setTempConversation(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === msgId ? {
            ...m,
            isThinking: false,
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } : m)
        }));
      } catch (err) {
        console.error("Regenerate error in temporary chat:", err);
        setTempConversation(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === msgId ? {
            ...m,
            isThinking: false,
            text: 'I encountered an issue regenerating the response.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } : m)
        }));
      }
      return;
    }

    const conv = conversations.find(c => c.id === currentChatId);
    if (!conv) return;

    const msgIndex = conv.messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    // Find the user message right before this response
    let priorUserMsg = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (conv.messages[i].sender === 'user') {
        priorUserMsg = conv.messages[i];
        break;
      }
    }

    if (!priorUserMsg) return;

    const history = conv.messages.slice(0, msgIndex).filter(m => !m.isThinking);

    setConversations(prev => prev.map(c => {
      if (c.id === currentChatId) {
        return {
          ...c,
          messages: c.messages.map(m => m.id === msgId ? { ...m, isThinking: true, text: '' } : m)
        };
      }
      return c;
    }));

    try {
      const reply = await askGroqAI(
        history, 
        priorUserMsg.text, 
        selectedModel.name, 
        webSearchActive, 
        priorUserMsg.attachment
      );

      setConversations(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === msgId ? {
              ...m,
              isThinking: false,
              text: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : m)
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Regenerate error:", err);
      setConversations(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === msgId ? {
              ...m,
              isThinking: false,
              text: 'I encountered an issue regenerating the response.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : m)
          };
        }
        return c;
      }));
    }
  };

  const handleOpenInCodeStudio = (codeSnippet, lang) => {
    setCodeStudioData({
      code: codeSnippet,
      language: (lang || 'python').toLowerCase()
    });
    setActiveTab('code');
  };

  const activeConversation = isTemporaryChat 
    ? tempConversation 
    : conversations.find(c => c.id === currentChatId);

  const effectiveIsLight = ambientMode === 'light' && !isTemporaryChat;

  return (
    <div 
      className={`relative w-full h-[100dvh] overflow-hidden flex transition-all duration-700 ease-in-out font-victor select-none ${
        isTemporaryChat ? 'bg-[#080a0f] text-white' : effectiveIsLight ? 'light-mode bg-[#f8fafc] text-slate-900' : 'bg-[#050B14] text-white'
      }`}
    >
      {/* Dynamic Cosmic Background */}
      <Background ambientMode={ambientMode} isTemporaryChat={isTemporaryChat} />

      {/* Left Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        conversations={conversations}
        currentChatId={currentChatId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'code') {
            setCodeStudioData({ code: '', language: 'python' });
          }
          if (tab !== 'chat') setCurrentChatId(null);
        }}
        onDeleteConversation={handleDeleteConversation}
        onClearAllConversations={handleClearAllConversations}
        ambientMode={ambientMode}
        onToggleTheme={handleToggleTheme}
        isTemporaryChat={isTemporaryChat}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        user={user}
        onUpdateUsername={handleUpdateUsername}
        onUpdateAvatar={handleUpdateAvatar}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
      />

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {activeTab === 'home' && (
          <HeroView
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            ambientMode={ambientMode}
            onToggleTheme={handleToggleTheme}
            onSubmitPrompt={handleSubmitPrompt}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            webSearchActive={webSearchActive}
            onToggleWebSearch={() => setWebSearchActive(!webSearchActive)}
            researchModeActive={researchModeActive}
            onToggleResearchMode={() => setResearchModeActive(!researchModeActive)}
            onAttachFile={handleAttachFile}
            attachedFile={attachedFile}
            uploadProgress={uploadProgress}
            onRemoveAttachedFile={() => setAttachedFile(null)}
            isTemporaryChat={isTemporaryChat}
            onToggleTemporaryChat={handleToggleTemporaryChat}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            ambientMode={ambientMode}
            onToggleTheme={handleToggleTheme}
            conversation={activeConversation}
            onSendMessage={handleSubmitPrompt}
            onBackToHero={handleNewConversation}
            onRegenerate={handleRegenerateMessage}
            onOpenInCodeStudio={handleOpenInCodeStudio}
            onOpenInResearchStudio={(latexCode, topic) => {
              setResearchStudioData({ initialCode: latexCode, topic });
              setActiveTab('study');
            }}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            webSearchActive={webSearchActive}
            onToggleWebSearch={() => setWebSearchActive(!webSearchActive)}
            researchModeActive={researchModeActive}
            onToggleResearchMode={() => setResearchModeActive(!researchModeActive)}
            onAttachFile={handleAttachFile}
            attachedFile={attachedFile}
            uploadProgress={uploadProgress}
            onRemoveAttachedFile={() => setAttachedFile(null)}
            isTemporaryChat={isTemporaryChat}
            onToggleTemporaryChat={handleToggleTemporaryChat}
          />
        )}

        {activeTab === 'assets' && (
          <AssetsView onBackToChat={handleNewConversation} />
        )}

        {activeTab === 'code' && (
          <CodeStudio 
            onBackToChat={handleNewConversation} 
            initialCode={codeStudioData.code}
            initialLanguage={codeStudioData.language}
          />
        )}

        {activeTab === 'study' && (
          <StudyView 
            onBackToChat={handleNewConversation} 
            initialTopic={researchStudioData.topic}
            initialLatexCode={researchStudioData.initialCode}
          />
        )}
      </main>
    </div>
  );
}

