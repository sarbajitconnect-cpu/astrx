import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Send, 
  Loader2, 
  Download, 
  ExternalLink, 
  Plus, 
  FileText,
  Search,
  Check,
  GraduationCap
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { askGroqAI } from '../utils/aiResponse';

export default function StudyStudio({ onBackToChat, initialTopic = '', initialLatexCode = '' }) {
  const [activeTopic, setActiveTopic] = useState(initialTopic || '');
  const [promptInput, setPromptInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [reportContent, setReportContent] = useState(initialLatexCode || '');
  const [academicPapers, setAcademicPapers] = useState([]);
  const [studyHistory, setStudyHistory] = useState([]);
  const [conversationId, setConversationId] = useState(() => `study-${Date.now()}`);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (initialTopic && !reportContent) {
      handleResearchQuery(initialTopic);
    }
  }, [initialTopic]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [studyHistory, isSynthesizing]);

  const handleResearchQuery = async (queryText) => {
    const q = (queryText || promptInput || followUpInput || '').trim();
    if (!q || isSynthesizing) return;

    setIsSynthesizing(true);
    if (!activeTopic) {
      setActiveTopic(q);
    }

    const userTurn = { role: 'user', content: q };
    const historyPayload = studyHistory.map(m => ({ role: m.role, text: m.content }));

    try {
      let authHeader = {};
      try {
        const savedUser = JSON.parse(localStorage.getItem('astrx_user') || '{}');
        if (savedUser && savedUser.token) authHeader['Authorization'] = `Bearer ${savedUser.token}`;
      } catch {}

      const res = await fetch('/api/backend/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          message: q,
          mode: 'study',
          history: historyPayload,
          conversation_id: conversationId
        })
      });

      if (res.ok) {
        const data = await res.json();
        const answerText = data.answer || '';
        const papers = data.academic_papers || [];

        // If this was an initial research query or deep report, set report viewer
        if (!reportContent || q.toLowerCase().includes('report') || q.toLowerCase().includes('review') || q.toLowerCase().includes('paper')) {
          setReportContent(answerText);
          if (papers.length > 0) {
            setAcademicPapers(papers);
          }
        }

        const assistantTurn = {
          role: 'assistant',
          content: answerText,
          sources: data.sources || [],
          papers: papers
        };

        setStudyHistory(prev => [...prev, userTurn, assistantTurn]);
        setPromptInput('');
        setFollowUpInput('');
      } else {
        const err = await res.json().catch(() => ({}));
        const errorTurn = {
          role: 'assistant',
          content: `Unable to complete scholarly synthesis: ${err.detail || 'Service temporarily unavailable'}. Please verify query and try again.`
        };
        setStudyHistory(prev => [...prev, userTurn, errorTurn]);
      }
    } catch (err) {
      console.error('Academic research error:', err);
      const errorTurn = {
        role: 'assistant',
        content: `Connection error reaching scholarly retrieval kernel: ${err.message}`
      };
      setStudyHistory(prev => [...prev, userTurn, errorTurn]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportContent || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch('/api/backend/api/study/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeTopic || 'Academic Research Report',
          content: reportContent
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(activeTopic || 'Report').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30)}_Report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!reportContent || isExportingDocx) return;
    setIsExportingDocx(true);
    try {
      const res = await fetch('/api/backend/api/study/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeTopic || 'Academic Research Report',
          content: reportContent
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(activeTopic || 'Report').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30)}_Report.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('DOCX export failed:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const quickResearchTopics = [
    {
      title: 'Quantum Error Correction',
      desc: 'Bosonic and surface codes in superconducting quantum architectures with syndrome decoding analysis.'
    },
    {
      title: 'CRISPR-Cas9 Off-Target Mitigation',
      desc: 'High-fidelity Cas variants, prime editing mechanisms, and experimental validation in vivo.'
    },
    {
      title: 'Attention vs State Space Models',
      desc: 'Comparative asymptotic complexity, associative recall, and hardware utilization of Mamba vs Transformers.'
    },
    {
      title: 'Chern Numbers & Topological Insulators',
      desc: 'Berry curvature formalism, quantum anomalous Hall state derivations, and lattice Hamiltonian proofs.'
    }
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Initial Empty State: Ask Astra Academic Agent
  // ─────────────────────────────────────────────────────────────────────────────
  if (!reportContent && studyHistory.length === 0) {
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
              <GraduationCap className="w-5 h-5 text-slate-300" />
              <span className="text-sm font-semibold tracking-wide text-white">ASTRA STUDY & RESEARCH AGENT</span>
              <span className="px-2 py-0.5 text-xs bg-white/5 text-slate-300 border border-white/10 rounded-full font-mono">
                Independent Academic Mode
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Academic Research & Scholarly Synthesis
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto text-sm sm:text-base">
              Autonomous literature retrieval across OpenAlex, Crossref, and arXiv. Formulates rigorous theoretical derivations, empirical findings, and publication-ready reports.
            </p>
          </div>

          {/* Research Input Box */}
          <div className="bg-[#070d18] border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-xl relative focus-within:border-white/20 transition-all">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleResearchQuery();
                }
              }}
              placeholder="Enter an academic research question, literature review request, or technical thesis..."
              rows={4}
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none p-2 font-mono"
            />
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                <span className="px-2 py-1 bg-white/5 rounded">OpenAlex</span>
                <span className="px-2 py-1 bg-white/5 rounded">Crossref</span>
                <span className="px-2 py-1 bg-white/5 rounded">arXiv</span>
                <span className="px-2 py-1 bg-white/5 rounded">LaTeX Math</span>
              </div>
              <button
                onClick={() => handleResearchQuery()}
                disabled={isSynthesizing || !promptInput.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    <span>Searching Literature...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-slate-300" />
                    <span>Synthesize Research</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Academic Topics */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickResearchTopics.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  setPromptInput(t.title);
                  handleResearchQuery(t.title);
                }}
                className="p-4 bg-[#070d18] hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-300">Academic Thesis</span>
                  <BookOpen className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mt-1">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Active Research Session: Split Report Viewer & Academic Dialogue
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-[#050B14] text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#070d18] backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setActiveTopic('');
              setReportContent('');
              setStudyHistory([]);
              setConversationId(`study-${Date.now()}`);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center space-x-1.5 text-xs font-medium"
            title="Start new research track"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>New Research Topic</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-semibold text-white tracking-wide truncate max-w-sm">
              {activeTopic || 'Scholarly Research Session'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || !reportContent}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
            title="Download Publication PDF"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-300" />}
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx || !reportContent}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
            title="Download Word Document"
          >
            {isExportingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-slate-300" />}
            <span>Export Word</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={onBackToChat}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all text-xs"
          >
            Exit Study Mode
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Academic Report / Literature Viewer */}
        <div className="flex-1 h-full overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Topic Badge */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Academic Report & Literature Review
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {academicPapers.length} Verified Sources
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{activeTopic}</h2>
            </div>

            {/* Verified Literature References List */}
            {academicPapers.length > 0 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                <h4 className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Verified Scholarly Literature (OpenAlex / Crossref / arXiv)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {academicPapers.map((paper, idx) => (
                    <div key={idx} className="p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-start justify-between">
                      <div className="pr-3">
                        <p className="text-xs font-semibold text-slate-200">{paper.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {paper.authors} ({paper.year}) · {paper.venue}
                        </p>
                      </div>
                      {paper.doi_or_url && (
                        <a
                          href={paper.doi_or_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Open DOI / Source URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Content */}
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
              <MarkdownRenderer content={reportContent} />
            </div>
          </div>
        </div>

        {/* Right Pane: Multi-Turn Academic Research Dialogue */}
        <div className="w-full lg:w-[420px] flex flex-col bg-[#070d18] border-l border-white/10">
          <div className="px-4 py-3 border-b border-white/10 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-semibold text-white tracking-wide">Research Dialogue & Inquiries</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{studyHistory.length} turns</span>
          </div>

          {/* Dialogue History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {studyHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Ask follow-up questions about this topic.</p>
                <p className="text-[11px] mt-1">E.g., "Explain equation 2 in detail", "What are the key limitations?", "Compare with alternative approaches".</p>
              </div>
            ) : (
              studyHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    msg.role === 'user'
                      ? 'bg-white/10 border-white/20 text-white ml-6'
                      : 'bg-black/40 border-white/10 text-slate-200 mr-6'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    {msg.role === 'user' ? 'Researcher' : 'Astra Study Agent'}
                  </span>
                  <div className="whitespace-pre-wrap font-mono">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                </div>
              ))
            )}

            {isSynthesizing && (
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl mr-6 flex items-center space-x-2 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono text-[11px]">Synthesizing scholarly response...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Interactive Follow-Up Input */}
          <div className="p-3 border-t border-white/10 bg-slate-900/40">
            <div className="flex items-center space-x-2 bg-[#050B14] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-white/25 transition-all">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleResearchQuery(followUpInput);
                  }
                }}
                placeholder="Ask follow-up, derive equations, or analyze gaps..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none font-mono py-1"
              />
              <button
                onClick={() => handleResearchQuery(followUpInput)}
                disabled={isSynthesizing || !followUpInput.trim()}
                className="p-1.5 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                title="Send inquiry to Astra Study Agent"
              >
                {isSynthesizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
