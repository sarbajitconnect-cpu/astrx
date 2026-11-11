import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, 
  Play, 
  Square,
  Copy, 
  Check, 
  Download, 
  Send, 
  Loader2, 
  Code2, 
  FileCode, 
  Terminal, 
  Eye, 
  Plus, 
  Cpu,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { askGroqAI } from '../utils/aiResponse';

export default function CodeStudio({ onBackToChat, initialCode = '', initialLanguage = 'python' }) {
  // Editor is HIDDEN initially unless code already exists
  const [hasGeneratedCode, setHasGeneratedCode] = useState(Boolean(initialCode && initialCode.trim()));
  const [promptInput, setPromptInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [codeConversation, setCodeConversation] = useState([]);
  
  // Multi-file tabs state
  const [files, setFiles] = useState([
    { name: 'main.py', language: 'python', content: initialCode || '' }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Execution & Console
  const [activePanel, setActivePanel] = useState('explanation'); // 'explanation' | 'console' | 'dependencies' | 'preview'
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef(null);

  // Dependency Management
  const [dependencies, setDependencies] = useState([]);
  const [isInstallingDep, setIsInstallingDep] = useState(false);

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      parseAndSetCode(initialCode, initialLanguage);
      setHasGeneratedCode(true);
      setCodeConversation([{ role: 'assistant', content: initialCode }]);
    }
  }, [initialCode, initialLanguage]);

  // Check dependencies whenever active code changes
  useEffect(() => {
    const current = files[activeFileIndex];
    if (current && current.language === 'python' && current.content.trim()) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/backend/api/code/deps/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: current.content, language: 'python' })
          });
          if (res.ok) {
            const data = await res.json();
            setDependencies(data.dependencies || []);
          }
        } catch {}
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setDependencies([]);
    }
  }, [files, activeFileIndex]);

  const parseAndSetCode = (rawText, defaultLang = 'python') => {
    const fileMatches = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\s*(?:\/\/\s*filename:\s*([^\n]+)|<!--\s*filename:\s*([^\n]+)\s*-->)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      const lang = match[1] || defaultLang;
      const filename = match[2] || match[3] || (lang === 'python' ? 'main.py' : lang === 'html' ? 'index.html' : lang === 'javascript' ? 'index.js' : `main.${lang}`);
      const content = match[4].trim();
      fileMatches.push({ name: filename.trim(), language: normalizeLang(lang), content });
    }

    if (fileMatches.length > 0) {
      setFiles(fileMatches);
      setActiveFileIndex(0);
      const cleanExp = rawText.replace(/```[\s\S]*?```/g, '').trim();
      setExplanation(cleanExp || 'Code generated successfully by Astra Code Agent.');
    } else {
      const norm = normalizeLang(defaultLang);
      setFiles([{ name: `script.${norm === 'python' ? 'py' : norm === 'javascript' ? 'js' : norm === 'c' ? 'c' : norm === 'cpp' ? 'cpp' : 'txt'}`, language: norm, content: rawText }]);
      setActiveFileIndex(0);
      setExplanation('Code generated successfully by Astra Code Agent.');
    }
  };

  const normalizeLang = (l) => {
    const s = (l || '').toLowerCase();
    if (s.includes('py')) return 'python';
    if (s.includes('js') || s.includes('node')) return 'javascript';
    if (s.includes('ts')) return 'typescript';
    if (s.includes('html') || s.includes('htm')) return 'html';
    if (s.includes('css')) return 'css';
    if (s.includes('c++') || s.includes('cpp')) return 'cpp';
    if (s === 'c') return 'c';
    if (s.includes('json')) return 'json';
    if (s.includes('sql')) return 'sql';
    return 'python';
  };

  const handleGenerateCode = async (instruction) => {
    const text = instruction || promptInput;
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    const userTurn = { role: 'user', content: text };
    const historyPayload = codeConversation.map(m => ({ role: m.role, text: m.content }));

    try {
      const response = await askGroqAI(historyPayload, text, 'Astra Code Engine', false, null, 'code');
      parseAndSetCode(response);
      setHasGeneratedCode(true);
      setActivePanel('explanation');
      setCodeConversation(prev => [...prev, userTurn, { role: 'assistant', content: response }]);
      setPromptInput('');
      setFollowUpInput('');
    } catch (err) {
      console.error('Code generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = async () => {
    const currentFile = files[activeFileIndex];
    if (!currentFile || !currentFile.content.trim()) return;

    setIsRunning(true);
    setActivePanel('console');
    setConsoleOutput(`[Execution initiated: ${currentFile.name} (${currentFile.language.toUpperCase()})]\n`);

    if (currentFile.language === 'html' || currentFile.name.endsWith('.html')) {
      setActivePanel('preview');
      setIsRunning(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let authHeader = {};
      try {
        const savedUser = JSON.parse(localStorage.getItem('astrx_user') || '{}');
        if (savedUser && savedUser.token) authHeader['Authorization'] = `Bearer ${savedUser.token}`;
      } catch {}

      const res = await fetch('/api/backend/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ code: currentFile.content, language: currentFile.language }),
        signal: controller.signal
      });

      const data = await res.json();
      if (data.stderr) {
        if (data.stdout) {
          setConsoleOutput(prev => prev + `[Standard Output]:\n${data.stdout}\n\n[Errors / Warnings]:\n${data.stderr}\n[Exit Code: ${data.exit_code}]`);
        } else {
          setConsoleOutput(prev => prev + `[Errors]:\n${data.stderr}\n[Exit Code: ${data.exit_code}]`);
        }
      } else {
        setConsoleOutput(prev => prev + `[Standard Output]:\n${data.stdout || 'Program completed with no console output.'}\n[Exit Code: ${data.exit_code}]`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Handled via stop
      } else {
        setConsoleOutput(prev => prev + `Execution error: ${err.message}`);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopCode = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
      setConsoleOutput(prev => prev + '\n[Execution halted by user]\n');
    }
  };

  const handleInstallDep = async (pkgName) => {
    if (!pkgName || isInstallingDep) return;
    setIsInstallingDep(true);
    setActivePanel('console');
    setConsoleOutput(prev => prev + `\nInstalling dependency '${pkgName}' in execution environment...\n`);
    try {
      let authHeader = {};
      try {
        const savedUser = JSON.parse(localStorage.getItem('astrx_user') || '{}');
        if (savedUser && savedUser.token) authHeader['Authorization'] = `Bearer ${savedUser.token}`;
      } catch {}

      const res = await fetch('/api/backend/api/code/deps/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ package: pkgName })
      });
      const data = await res.json();
      if (data.success) {
        setConsoleOutput(prev => prev + `Successfully installed ${pkgName}.\n${data.stdout || ''}\n`);
        setDependencies(prev => prev.map(d => d.name === pkgName ? { ...d, installed: true } : d));
      } else {
        setConsoleOutput(prev => prev + `Failed to install ${pkgName}:\n${data.stderr || 'Unknown error'}\n`);
      }
    } catch (err) {
      setConsoleOutput(prev => prev + `Network error installing ${pkgName}: ${err.message}\n`);
    } finally {
      setIsInstallingDep(false);
    }
  };

  const handleCopy = () => {
    const currentFile = files[activeFileIndex];
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const currentFile = files[activeFileIndex];
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickPrompts = [
    { title: 'High-Performance LRU Cache', lang: 'Python', prompt: 'Implement a thread-safe LRU Cache in Python with O(1) get and put, complete with unit tests.' },
    { title: 'Interactive Analytics Dashboard', lang: 'HTML/JS', prompt: 'Build a standalone HTML/CSS/JS responsive analytics dashboard with clean monochrome cards and live chart rendering.' },
    { title: 'Red-Black Tree', lang: 'C++', prompt: 'Implement a complete Red-Black Tree in C++ with insertion, balancing rotations, and complexity analysis.' },
    { title: 'Fast Fibonacci via Matrix Exponentiation', lang: 'Python', prompt: 'Write an O(log n) Fibonacci calculator in Python using 2x2 matrix exponentiation.' }
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Initial State: Editor is HIDDEN, Display Ask Astra Code Agent Prompt
  // ─────────────────────────────────────────────────────────────────────────────
  if (!hasGeneratedCode) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#050B14] text-slate-100 overflow-y-auto">
        {/* Top Navbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToChat}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Chat</span>
            </button>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-slate-300" />
              <span className="text-sm font-semibold tracking-wide text-white">ASTRA CODE AGENT</span>
              <span className="px-2 py-0.5 text-xs bg-white/5 text-slate-300 border border-white/10 rounded-full font-mono">
                Independent Mode
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 mb-4">
              <Code2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ask Astra to Architect & Code
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto text-sm sm:text-base">
              Autonomous polyglot software engineering. Multi-file synthesis, algorithmic proofs, syntax verification, and execution.
            </p>
          </div>

          {/* Ask Astra Code Input */}
          <div className="bg-[#070d18] border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-xl relative focus-within:border-white/20 transition-all">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateCode();
                }
              }}
              placeholder="Describe your program, algorithm, or multi-file project in Python, JavaScript, HTML, C, C++..."
              rows={4}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none p-2 font-mono"
            />
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <span className="px-2 py-1 bg-white/5 rounded">Python</span>
                <span className="px-2 py-1 bg-white/5 rounded">JavaScript</span>
                <span className="px-2 py-1 bg-white/5 rounded">C</span>
                <span className="px-2 py-1 bg-white/5 rounded">C++</span>
                <span className="px-2 py-1 bg-white/5 rounded">HTML/CSS</span>
              </div>
              <button
                onClick={() => handleGenerateCode()}
                disabled={isGenerating || !promptInput.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    <span>Architecting Code...</span>
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4 text-slate-300" />
                    <span>Generate in Editor</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setPromptInput(q.prompt);
                  handleGenerateCode(q.prompt);
                }}
                className="p-4 bg-[#070d18] hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-300">{q.lang}</span>
                  <Code2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mt-1">{q.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{q.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Code Generated: Monaco Editor is Active!
  // ─────────────────────────────────────────────────────────────────────────────
  const currentFile = files[activeFileIndex] || files[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050B14] text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#070d18] backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setHasGeneratedCode(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center space-x-1.5 text-xs font-medium"
            title="Ask a new programming question"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>New Prompt</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          {/* Multi-file tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-md">
            {files.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFileIndex(idx)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeFileIndex === idx
                    ? 'bg-white/15 border border-white/25 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-slate-300" />
                <span>{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <button
              onClick={handleStopCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-lg text-xs font-medium transition-all"
              title="Stop Execution"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRunCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 rounded-lg text-xs font-medium transition-all"
              title="Execute Code in Sandbox"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Run</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-medium transition-all"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs transition-all"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={onBackToChat}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all text-xs"
          >
            Exit Code Mode
          </button>
        </div>
      </div>

      {/* Main Split: Monaco Editor (Left) & Explanation / Output Panel (Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Monaco Editor */}
        <div className="flex-1 h-full min-h-[350px] relative border-b lg:border-b-0 lg:border-r border-white/10">
          <Editor
            height="100%"
            language={currentFile.language}
            theme="vs-dark"
            value={currentFile.content}
            onChange={(val) => {
              setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, content: val || '' } : f));
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'Victor Mono', 'JetBrains Mono', Consolas, monospace",
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 12, bottom: 12 }
            }}
          />
        </div>

        {/* Right: Tabbed Inspector Panel (Explanation | Console | Dependencies | Live Preview) */}
        <div className="w-full lg:w-[450px] flex flex-col bg-[#070d18] border-l border-white/10">
          {/* Panel Selector */}
          <div className="flex items-center border-b border-white/10 px-3 bg-slate-900/50">
            <button
              onClick={() => setActivePanel('explanation')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activePanel === 'explanation' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Explanation & Complexity</span>
            </button>
            <button
              onClick={() => setActivePanel('console')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                activePanel === 'console' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>
            {currentFile.language === 'python' && (
              <button
                onClick={() => setActivePanel('dependencies')}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                  activePanel === 'dependencies' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Dependencies</span>
              </button>
            )}
            {currentFile.language === 'html' && (
              <button
                onClick={() => setActivePanel('preview')}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                  activePanel === 'preview' ? 'border-white text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            )}
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto text-xs leading-relaxed">
            {activePanel === 'explanation' && (
              <div className="space-y-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    Language: {currentFile.language.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-semibold text-white mt-1">{currentFile.name}</h4>
                </div>
                <div className="text-slate-300 font-mono whitespace-pre-wrap">
                  {explanation}
                </div>
              </div>
            )}

            {activePanel === 'console' && (
              <div className="font-mono text-slate-300 bg-black/60 p-3 rounded-xl border border-white/5 h-full overflow-y-auto whitespace-pre-wrap">
                {consoleOutput || 'Click "Run" to execute current editor contents inside the sandboxed environment.'}
              </div>
            )}

            {activePanel === 'dependencies' && (
              <div className="space-y-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <h4 className="text-sm font-semibold text-white">Detected Libraries</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Analyzes import statements in your code and manages package installation inside the sandbox.
                  </p>
                </div>

                {dependencies.length === 0 ? (
                  <p className="text-slate-400 p-2 font-mono">No external packages detected in this script.</p>
                ) : (
                  <div className="space-y-2">
                    {dependencies.map((dep, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {dep.installed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="font-mono text-white text-xs">{dep.name}</span>
                        </div>
                        {dep.installed ? (
                          <span className="text-[11px] text-emerald-400 font-mono">Installed</span>
                        ) : (
                          <button
                            onClick={() => handleInstallDep(dep.name)}
                            disabled={isInstallingDep}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded text-[11px] font-mono transition-all disabled:opacity-50"
                          >
                            {isInstallingDep ? 'Installing...' : 'Install'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePanel === 'preview' && currentFile.language === 'html' && (
              <div className="h-full bg-white rounded-xl overflow-hidden shadow-inner">
                <iframe
                  title="Web Live Preview"
                  srcDoc={currentFile.content}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>

          {/* Interactive Follow-Up Input (Conversational Continuity in Code Mode) */}
          <div className="p-3 border-t border-white/10 bg-slate-900/40">
            <div className="flex items-center space-x-2 bg-[#050B14] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-white/25 transition-all">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateCode(followUpInput);
                  }
                }}
                placeholder="Modify this code (e.g. 'Optimize it', 'Explain changes', 'Add tests')..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none font-mono py-1"
              />
              <button
                onClick={() => handleGenerateCode(followUpInput)}
                disabled={isGenerating || !followUpInput.trim()}
                className="p-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                title="Send instruction to Astra Code Agent"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
