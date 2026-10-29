import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Play, 
  ChevronDown,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { runPythonCode } from '../utils/pythonRunner';
import { askGroqAI } from '../utils/aiResponse';

export default function CodeStudio({ 
  onBackToChat, 
  initialCode = '', 
  initialLanguage = 'python' 
}) {
  const [language, setLanguage] = useState(() => {
    const lang = (initialLanguage || 'python').toLowerCase();
    if (lang.includes('js') || lang.includes('javascript') || lang.includes('ts')) return 'javascript';
    if (lang.includes('html') || lang.includes('web') || lang.includes('css')) return 'html';
    return 'python';
  });
  const [code, setCode] = useState(initialCode || '');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('console'); // 'console' | 'preview'
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // "Ask ASTRX" AI Code Assistant
  const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      const lang = (initialLanguage || 'python').toLowerCase();
      if (lang.includes('js') || lang.includes('javascript')) setLanguage('javascript');
      else if (lang.includes('html') || lang.includes('web')) {
        setLanguage('html');
        setActiveTab('preview');
      } else {
        setLanguage('python');
      }
    }
  }, [initialCode, initialLanguage]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setIsLangDropdownOpen(false);
    if (newLang === 'html') {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  };

  const handleClear = () => {
    setCode('');
    setConsoleLogs([]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      setConsoleLogs(['No code to run.']);
      return;
    }

    setIsRunning(true);
    const runStartTime = performance.now();

    if (language === 'python') {
      setConsoleLogs([
        'Run started',
        'Initializing Python environment',
        'Running code'
      ]);

      const result = await runPythonCode(code);
      const totalTime = (performance.now() - runStartTime).toFixed(2);

      if (result.success) {
        setConsoleLogs([
          'Run started',
          'Initializing Python environment',
          'Running code',
          ...result.logs,
          `Run completed in ${totalTime}ms`
        ]);
      } else {
        setConsoleLogs([
          'Run started',
          'Initializing Python environment',
          'Running code',
          ...result.logs,
          result.error,
          `Run failed in ${totalTime}ms`
        ]);
      }
    } else if (language === 'javascript') {
      const logs = [];
      setConsoleLogs([
        'Run started',
        'Initializing JavaScript Runtime',
        'Running script'
      ]);

      const customConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
        error: (...args) => logs.push('[ERROR] ' + args.join(' '))
      };

      try {
        const runner = new Function('console', code);
        await runner(customConsole);
        const totalTime = (performance.now() - runStartTime).toFixed(2);
        setConsoleLogs([
          'Run started',
          'Initializing JavaScript Runtime',
          'Running script',
          ...logs,
          `Run completed in ${totalTime}ms`
        ]);
      } catch (err) {
        const totalTime = (performance.now() - runStartTime).toFixed(2);
        setConsoleLogs([
          'Run started',
          'Initializing JavaScript Runtime',
          'Running script',
          ...logs,
          `Uncaught ${err.name}: ${err.message}`,
          `Run failed in ${totalTime}ms`
        ]);
      }
    } else {
      setActiveTab('preview');
    }

    setIsRunning(false);
  };

  const handleAskAstrxSubmit = async (e) => {
    e?.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    const userPrompt = `Write clean, functional, executable ${language.toUpperCase()} code for the following task:\n"${aiPrompt}"\n\nReturn ONLY the raw executable code without markdown wrappers or conversational filler.`;
    
    try {
      const response = await askGroqAI([], userPrompt);
      // Clean markdown code fence if returned
      const cleanCode = response.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
      setCode(cleanCode);
      setIsAiPromptOpen(false);
      setAiPrompt('');
    } catch (err) {
      console.error("AI code generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const lineCount = Math.max(code.split('\n').length, 24);
  const linesArray = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="relative w-full h-full flex flex-col p-4 sm:p-6 md:p-8 select-none overflow-hidden font-victor animate-in fade-in duration-200">
      
      {/* Top Bar: Close (✕) & "Ask ASTRX" Capsule */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={onBackToChat}
          title="Exit Studio"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105"
        >
          <X size={17} />
        </button>

        {/* Ask ASTRX AI Button & Floating Prompt Input */}
        <div className="relative">
          {isAiPromptOpen ? (
            <form
              onSubmit={handleAskAstrxSubmit}
              className="flex items-center gap-2 bg-[#1c222c] border border-white/15 rounded-full pl-3.5 pr-1.5 py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <Sparkles size={13} className="text-white/60 shrink-0" />
              <input
                type="text"
                autoFocus
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={`Ask ASTRX to write ${language} code...`}
                className="bg-transparent text-xs font-victor text-white placeholder:text-white/30 focus:outline-none w-56 sm:w-72"
              />
              <button
                type="submit"
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-40"
              >
                {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsAiPromptOpen(false)}
                className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAiPromptOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 border border-white/[0.08] transition-all cursor-pointer shadow-md hover:scale-105"
            >
              <Sparkles size={13} className="text-white/70" />
              <span>Ask ASTRX</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Standalone Floating Panes (NO Outer Enclosure Box) */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        
        {/* LEFT PANE: Code Editor */}
        <div 
          className="flex flex-col rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#1c222c',
          }}
        >
          {/* Editor Header Bar */}
          <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0 bg-white/[0.02]">
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <span className="text-white/40 font-mono text-[11px]">&lt;/&gt;</span>
                <span className="font-medium capitalize">{language}</span>
                <ChevronDown size={13} className="text-white/40" />
              </button>

              {/* Language dropdown */}
              {isLangDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-44 rounded-[20px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 select-none text-[12px] font-victor"
                  style={{
                    background: 'rgba(20, 22, 28, 0.90)',
                    backdropFilter: 'blur(40px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(140%)',
                    border: 'none',
                    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75)'
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    {['python', 'javascript', 'html'].map((langKey) => (
                      <button
                        key={langKey}
                        onClick={() => handleLanguageChange(langKey)}
                        className={`w-full text-left px-3 h-8 rounded-[14px] transition-all duration-150 cursor-pointer flex items-center justify-between capitalize ${
                          language === langKey 
                            ? 'bg-white/[0.08] text-white font-medium' 
                            : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <span>{langKey === 'html' ? 'HTML / Web' : langKey}</span>
                        {language === langKey && <Check size={13} className="text-emerald-400" strokeWidth={2.4} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              title="Clear editor"
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Line Numbers Column */}
            <div className="w-10 py-3 select-none text-right pr-3 font-mono text-xs text-white/20 border-r border-white/[0.04] shrink-0 overflow-hidden leading-relaxed">
              {linesArray.map((lineNum) => (
                <div key={lineNum}>{lineNum}</div>
              ))}
            </div>

            {/* Code Input Textarea */}
            <div className="flex-1 relative p-3 overflow-auto scrollbar-edge">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="# Enter or write code here..."
                spellCheck="false"
                className="w-full h-full bg-transparent text-xs font-mono text-white/90 placeholder:text-white/20 resize-none focus:outline-none leading-relaxed selection:bg-white/20"
                style={{
                  minHeight: '100%',
                  tabSize: 4
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    const newCode = code.substring(0, start) + '    ' + code.substring(end);
                    setCode(newCode);
                    setTimeout(() => {
                      e.target.selectionStart = e.target.selectionEnd = start + 4;
                    }, 0);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Output Console & Live Runner */}
        <div 
          className="flex flex-col rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl"
          style={{
            backgroundColor: '#1c222c',
          }}
        >
          {/* Console Header Bar */}
          <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40 font-mono text-[11px]">&lt;/&gt;</span>
              <span className="font-medium text-white/80">Console</span>

              {language === 'html' && (
                <div className="flex items-center gap-1 ml-3 bg-white/5 p-0.5 rounded-lg">
                  <button
                    onClick={() => setActiveTab('console')}
                    className={`px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer ${
                      activeTab === 'console' ? 'bg-white/15 text-white' : 'text-white/50'
                    }`}
                  >
                    Logs
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer ${
                      activeTab === 'preview' ? 'bg-white/15 text-white' : 'text-white/50'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              )}
            </div>

            {/* Copy & Run Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                title="Copy code"
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-4 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              >
                <Play size={11} fill="currentColor" />
                <span>{isRunning ? 'Running...' : 'Run'}</span>
              </button>
            </div>
          </div>

          {/* Console Output Body */}
          <div className="flex-1 p-4 overflow-auto scrollbar-edge font-mono text-xs leading-relaxed">
            {language === 'html' && activeTab === 'preview' ? (
              <iframe
                srcDoc={code}
                title="Web Preview"
                sandbox="allow-scripts"
                className="w-full h-full rounded-xl border border-white/5 bg-black/40"
              />
            ) : consoleLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/20 text-xs">
                Click "Run" to execute code
              </div>
            ) : (
              <div className="space-y-1 text-white/60">
                {consoleLogs.map((line, idx) => {
                  const isRunStarted = line.startsWith('Run started');
                  const isCompleted = line.startsWith('Run completed');
                  const isFailed = line.startsWith('Run failed') || line.startsWith('Traceback') || line.startsWith('Uncaught');
                  const isStandard = !isRunStarted && !isCompleted && !isFailed && !line.startsWith('Initializing') && !line.startsWith('Installing') && !line.startsWith('Running');

                  return (
                    <div 
                      key={idx}
                      className={
                        isCompleted
                          ? 'text-emerald-400 font-medium mt-2'
                          : isFailed
                          ? 'text-rose-400 font-medium'
                          : isStandard
                          ? 'text-white'
                          : 'text-white/40'
                      }
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
