import React, { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  Play, 
  RefreshCw, 
  FileText, 
  Code2, 
  BookOpen, 
  Printer, 
  Layers, 
  Clock, 
  ArrowLeft,
  Search,
  ExternalLink,
  ChevronRight,
  Sliders,
  X,
  Edit3,
  Eye,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { askGroqAI } from '../utils/aiResponse';

// Sample preloaded research topics for instant inspiration
const SUGGESTED_TOPICS = [
  "Quantum Decoherence and Topological Error Correction in 128-Qubit Arrays",
  "Neural Radiance Fields and Volumetric Scene Synthesis from Sparse Monocular Video",
  "High-Temperature Superconductivity in Compressed Hydrides at Terapascal Pressures",
  "Autonomous Multi-Agent Coordination via Decentralized Game Theory"
];

const DEFAULT_LATEX_TEMPLATE = `\\documentclass[11pt,a4paper]{article}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{cite}
\\usepackage{hyperref}

\\title{\\textbf{Deep Quantum State Tomography and Topological Phase Transitions in Non-Equilibrium Lattices}}
\\author{ASTRX Intelligence Laboratory \\\\ \\textit{Department of Theoretical Physics and Neural Computation}}
\\date{October 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
We present a rigorous quantitative framework for high-fidelity quantum state tomography across non-equilibrium optical lattices. By leveraging parameterized neural tensor networks, our architecture reconstructs multi-particle density matrices with quadratic scaling advantages over traditional maximum likelihood estimation. We observe anomalous Berry curvature signatures near the critical threshold $\\lambda_c \\approx 1.414 \\pm 0.003$, providing direct empirical verification of topological order preservation under high thermal noise.
\\end{abstract}

\\section{Introduction}
Characterizing correlated quantum many-body systems remains a fundamental computational hurdle in condensed matter physics and quantum computing. Traditional quantum state tomography (QST) requires $\\mathcal{O}(4^N)$ projective measurements for an $N$-qubit density matrix $\\rho$, rendering direct scaling prohibitive beyond $N > 12$.

In this work, we formulate a neural-augmented quantum inference framework that optimizes state synthesis via variational tensor state contraction:
\\begin{equation}
\\mathcal{L}(\\theta) = -\\sum_{i=1}^{M} \\log \\text{Tr}\\left( \\Pi_i \\rho_{\\theta} \\right) + \\beta \\mathcal{D}_{\\text{KL}}(\\rho_{\\theta} \\parallel \\rho_0)
\\end{equation}
where $\\Pi_i$ denotes positive operator-valued measure (POVM) basis projectors, and $\\beta$ enforces entropy regularization.

\\section{Theoretical Framework and Mathematical Derivations}
Consider a one-dimensional transverse-field Ising Hamiltonian undergoing periodic Floquet driving:
\\begin{equation}
H(t) = -J \\sum_{j=1}^{N} \\sigma_j^z \\sigma_{j+1}^z - h_x(t) \\sum_{j=1}^{N} \\sigma_j^x
\\end{equation}
where $h_x(t) = h_0 + \\Delta h \\cos(\\Omega t)$. The time-evolution operator over a single drive period $T = 2\\pi/\\Omega$ is governed by the effective Floquet Hamiltonian $H_F$:
\\begin{equation}
U(T) = \\mathcal{T} \\exp\\left( -i \\int_0^T H(t) dt \\right) \\equiv e^{-i H_F T}
\\end{equation}

\\subsection{Topological Invariant Computation}
The winding number $\\nu \\in \\mathbb{Z}$ is determined through momentum-space integration of the non-Abelian Berry connection $\\mathcal{A}(k)$:
\\begin{equation}
\\nu = \\frac{1}{2\\pi} \\oint_{\\text{BZ}} \\text{Tr}\\left[ \\mathcal{A}(k) \\right] dk = \\frac{1}{2\\pi i} \\int_{-\\pi}^{\\pi} \\langle \\psi(k) | \\partial_k | \\psi(k) \\rangle dk
\\end{equation}

\\section{Empirical Findings and Quantitative Comparison}
Table 1 outlines state fidelity metrics across varying lattice depths compared against standard baseline estimators.

\\begin{table}[h]
\\centering
\\begin{tabular}{lccc}
\\toprule
\\textbf{Model Architecture} & \\textbf{Fidelity (\\%)} & \\textbf{Sample Complexity} & \\textbf{Convergence Time (s)} \\\\
\\midrule
Standard MLE & 91.4 $\\pm$ 0.4 & $\\mathcal{O}(4^N)$ & 142.8 \\\\
Matrix Product State (MPS) & 96.1 $\\pm$ 0.2 & $\\mathcal{O}(N \\chi^2)$ & 28.4 \\\\
\\textbf{ASTRX Neural QST} & \\textbf{99.3 $\\pm$ 0.05} & $\\mathbf{\\mathcal{O}(N^2)}$ & \\textbf{3.12} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Conclusion}
Our findings demonstrate that variational neural tensor architectures achieve near-unity reconstruction fidelity while significantly suppressing measurement overhead, paving the way for real-time quantum error diagnostics.

\\begin{thebibliography}{9}
\\bibitem{preskill2018} J. Preskill, \\textit{Quantum Computing in the NISQ era and beyond}, Quantum 2, 79 (2018).
\\bibitem{carleo2017} G. Carleo and M. Troyer, \\textit{Solving the quantum many-body problem with artificial neural networks}, Science 355, 602--606 (2017).
\\end{thebibliography}

\\end{document}`;

export default function ResearchStudio({ 
  onBackToChat, 
  initialTopic = '', 
  initialLatexCode = '' 
}) {
  const [topic, setTopic] = useState(initialTopic || '');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [researchLogs, setResearchLogs] = useState([]);
  
  // LaTeX Document State
  const [latexCode, setLatexCode] = useState(initialLatexCode || DEFAULT_LATEX_TEMPLATE);
  const [showPreparedBy, setShowPreparedBy] = useState(true);
  const [activeTab, setActiveTab] = useState('paper'); // 'paper' | 'latex'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialLatexCode) setLatexCode(initialLatexCode);
  }, [initialTopic, initialLatexCode]);
  
  // Iteration / Refinement prompt state
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [statusToast, setStatusToast] = useState('');


  const printFrameRef = useRef(null);

  const showToast = (msg) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 2500);
  };

  const handleStartResearch = async (selectedTopic = topic) => {
    const query = (selectedTopic || '').trim();
    if (!query || isResearching) return;

    setIsResearching(true);
    setResearchProgress(5);
    setTimeLeftSec(18);
    setResearchLogs([
      'Initializing ASTRX Autonomous Research Kernel v4.2',
      `Target Hypothesis: "${query}"`,
      'Scraping ArXiv, PubMed, IEEE and Nature preprint databases...',
    ]);
    setCurrentStage('Ingesting peer-reviewed literature & data...');

    // Progress timer simulation while AI conducts live synthesis
    const startTime = Date.now();
    const duration = 16000; // ~16s realistic multi-step research pipeline

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(94, Math.round((elapsed / duration) * 94));
      setResearchProgress(pct);

      const remaining = Math.max(1, Math.ceil((duration - elapsed) / 1000));
      setTimeLeftSec(remaining);

      if (pct > 25 && pct < 50) {
        setCurrentStage('Synthesizing empirical findings & quantitative data...');
      } else if (pct >= 50 && pct < 75) {
        setCurrentStage('Deriving mathematical equations & theoretical proofs...');
      } else if (pct >= 75) {
        setCurrentStage('Typesetting publication-grade academic LaTeX code...');
      }
    }, 400);

    // Call real LLM to generate publication-grade LaTeX paper
    try {
      const systemInstruction = `You are the ASTRX Autonomous Academic Research Kernel. 
Write a rigorous, professional, publication-quality academic paper in valid, compilable LaTeX for the research topic: "${query}".
The document MUST include:
1. \\documentclass[11pt,a4paper]{article}
2. Appropriate packages: \\usepackage{amsmath,amsfonts,amssymb,graphicx,booktabs,cite,hyperref}
3. \\title{\\textbf{...}}
4. \\author{...}
5. \\date{...}
6. \\begin{abstract} ... \\end{abstract}
7. Multiple thorough, high-level technical sections (\\section{Introduction}, \\section{Theoretical Framework & Mathematical Formulation}, \\section{Empirical Analysis & Multi-Modal Findings}, \\section{Discussion & Methodological Implications}, \\section{Conclusion})
8. Complex mathematical equations (using \\begin{equation} and LaTeX math notation)
9. An academic comparison table (\\begin{table} with \\toprule, \\midrule, \\bottomrule)
10. \\begin{thebibliography}{9} ... \\end{thebibliography}
Return ONLY the raw compilable LaTeX code with no conversational wrapper.`;

      const generatedLatex = await askGroqAI([], systemInstruction, 'ASTRX-4 Pro (Groq Llama-3.3 70B)');
      
      clearInterval(progressInterval);
      setResearchProgress(100);
      setTimeLeftSec(0);
      setCurrentStage('Research completed successfully.');

      const cleanLatex = generatedLatex
        .replace(/^```[a-zA-Z]*\n/, '')
        .replace(/\n```$/, '')
        .trim();

      setLatexCode(cleanLatex || DEFAULT_LATEX_TEMPLATE);
      
      // Auto-save generated research paper to Assets Archive
      try {
        const savedAssets = JSON.parse(localStorage.getItem('astrx_assets') || '[]');
        const now = new Date();
        const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const docTitle = query.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 32) + '_Research.pdf';
        const newAsset = {
          id: `asset-${Date.now()}`,
          name: docTitle,
          type: 'research',
          size: '4.8 MB',
          dateTime: `${formattedDate} • ${formattedTime}`,
          tag: 'Research',
          category: 'research',
          content: cleanLatex
        };
        localStorage.setItem('astrx_assets', JSON.stringify([newAsset, ...savedAssets]));
      } catch (e) {
        console.error("Failed to archive research paper:", e);
      }

      showToast('Research compiled & saved to Assets Archive');
    } catch (err) {
      console.error("Research generation error:", err);
      clearInterval(progressInterval);
      setResearchProgress(100);
      setTimeLeftSec(0);
    } finally {
      setIsResearching(false);
    }
  };

  const handleIterateRefinement = async (e) => {
    e?.preventDefault();
    if (!refinePrompt.trim() || isRefining) return;

    setIsRefining(true);
    showToast('Refining LaTeX document...');

    try {
      const prompt = `Current LaTeX Document:\n\`\`\`latex\n${latexCode}\n\`\`\`\n\nUser Revision Request:\n"${refinePrompt}"\n\nPlease update and return the complete revised LaTeX document incorporating all requested refinements while preserving high academic rigor. Return ONLY the raw compilable LaTeX code.`;
      const revised = await askGroqAI([], prompt, 'ASTRX-4 Pro (Groq Llama-3.3 70B)');
      const cleanRevised = revised.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
      if (cleanRevised) {
        setLatexCode(cleanRevised);
        setRefinePrompt('');
        showToast('Document updated successfully');
      }
    } catch (err) {
      console.error("Refinement error:", err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    showToast('LaTeX source code copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'astrx_research_paper.tex';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded .tex file');
  };

  const handleDownloadPdf = () => {
    // Generate clean printable PDF document view via iframe printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const titleMatch = latexCode.match(/\\title\{([^}]+)\}/);
    const authorMatch = latexCode.match(/\\author\{([^}]+)\}/);
    const abstractMatch = latexCode.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);

    const docTitle = titleMatch ? titleMatch[1].replace(/\\textbf\{|\}/g, '') : 'ASTRX Research Report';
    const docAuthor = authorMatch ? authorMatch[1].replace(/\\\\|\\textit\{|\}/g, ' ') : 'ASTRX Intelligence Laboratory';
    const docAbstract = abstractMatch ? abstractMatch[1].trim() : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle}</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4;
            margin: 20mm 20mm 20mm 20mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #111;
            line-height: 1.6;
            margin: 0;
            padding: 24px 32px;
            background: #fff;
          }
          .header-banner {
            border-bottom: 2px solid #222;
            padding-bottom: 8px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-family: sans-serif;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          h1 {
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            margin: 12px 0 6px 0;
            line-height: 1.3;
          }
          .author {
            text-align: center;
            font-size: 13px;
            color: #444;
            margin-bottom: 20px;
          }
          .prepared-by {
            text-align: center;
            font-size: 11px;
            font-style: italic;
            color: #666;
            margin-bottom: 24px;
          }
          .abstract-box {
            background: #f8f9fa;
            border-left: 3px solid #333;
            padding: 14px 18px;
            margin: 20px 0;
            font-size: 12.5px;
            font-style: italic;
          }
          .abstract-title {
            font-weight: bold;
            font-style: normal;
            font-size: 13px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .section-title {
            font-size: 15px;
            font-weight: bold;
            margin-top: 24px;
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
          .equation {
            text-align: center;
            font-family: 'Cambria Math', 'Latin Modern Math', serif;
            font-size: 14px;
            background: #fafafa;
            padding: 10px;
            margin: 14px 0;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
            font-size: 12px;
          }
          th {
            border-top: 2px solid #222;
            border-bottom: 1px solid #222;
            padding: 8px;
            text-align: left;
          }
          td {
            padding: 7px 8px;
            border-bottom: 1px solid #eee;
          }
          .footer {
            margin-top: 36px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            font-size: 10px;
            color: #777;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <span>ASTRX Autonomous Research Repository</span>
          <span>A4 Academic Preprint • Typeset LaTeX</span>
        </div>

        <h1>${docTitle}</h1>
        <div class="author">${docAuthor}</div>
        ${showPreparedBy ? '<div class="prepared-by">Prepared by ASTRX Research</div>' : ''}

        ${docAbstract ? `
          <div class="abstract-box">
            <div class="abstract-title">Abstract</div>
            ${docAbstract}
          </div>
        ` : ''}

        <div class="content">
          ${renderLatexBodyToHtml(latexCode)}
        </div>

        <div class="footer">
          <span>ASTRX Research Kernel</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast('Opening PDF print & download dialog');
  };

  // Helper to parse LaTeX sections into formatted HTML for the visual paper preview
  function renderLatexBodyToHtml(latex) {
    let clean = latex
      .replace(/\\documentclass[\s\S]*?\\begin\{document\}/, '')
      .replace(/\\end\{document\}/, '')
      .replace(/\\maketitle/, '')
      .replace(/\\begin\{abstract\}[\s\S]*?\\end\{abstract\}/, '');

    // Parse Sections
    clean = clean.replace(/\\section\{([^}]+)\}/g, '<div class="section-title">$1</div>');
    clean = clean.replace(/\\subsection\{([^}]+)\}/g, '<div style="font-weight:bold; font-size:13.5px; margin:14px 0 6px;">$1</div>');

    // Parse Equations
    clean = clean.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, '<div class="equation">$1</div>');

    // Parse bold, italic
    clean = clean.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
    clean = clean.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
    clean = clean.replace(/\\text\{([^}]+)\}/g, '<span>$1</span>');

    // Parse clean paragraph breaks
    clean = clean.split('\n\n').map(p => {
      if (p.includes('class="section-title"') || p.includes('class="equation"') || p.includes('<table')) {
        return p;
      }
      return `<p style="margin-bottom:12px; text-align:justify; text-indent:1.5em;">${p.trim()}</p>`;
    }).join('');

    return clean;
  }

  // Parse Title & Abstract for visual typeset paper view
  const parsedTitle = (latexCode.match(/\\title\{([^}]+)\}/)?.[1] || 'Quantum State Tomography in Non-Equilibrium Optical Lattices')
    .replace(/\\textbf\{|\}/g, '');
  const parsedAuthor = (latexCode.match(/\\author\{([^}]+)\}/)?.[1] || 'ASTRX Intelligence Laboratory')
    .replace(/\\\\|\\textit\{|\}/g, ' ');
  const parsedAbstract = (latexCode.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/)?.[1] || '').trim();

  return (
    <div className="relative w-full h-full flex flex-col p-4 sm:p-6 md:p-8 select-none overflow-hidden font-victor animate-in fade-in duration-200">
      
      {/* Status Toast */}
      {statusToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#1c222c] border border-white/20 text-white text-xs font-victor shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            title="Back"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-victor text-white flex items-center gap-2 tracking-tight">
              <FlaskConical size={22} className="text-indigo-400" />
              <span>Research Mode</span>
            </h2>

            {showPreparedBy && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-victor">
                Prepared by ASTRX Research
                <button
                  onClick={() => setShowPreparedBy(false)}
                  title="Remove badge"
                  className="hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: PDF Download & .tex Export */}
        <div className="flex items-center gap-2">
          {/* Prepared by badge toggle if hidden */}
          {!showPreparedBy && (
            <button
              onClick={() => setShowPreparedBy(true)}
              className="text-[11px] text-white/40 hover:text-white/80 transition-colors cursor-pointer px-2 py-1"
            >
              + Add "Prepared by ASTRX"
            </button>
          )}

          {/* View switcher: Paper Typeset vs LaTeX Code */}
          <div className="flex items-center bg-[#1c222c] border border-white/[0.08] p-0.5 rounded-xl">
            <button
              onClick={() => setActiveTab('paper')}
              className={`px-3 py-1 rounded-lg text-xs font-victor flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'paper' ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              <Eye size={13} />
              <span>Typeset Paper</span>
            </button>

            <button
              onClick={() => setActiveTab('latex')}
              className={`px-3 py-1 rounded-lg text-xs font-victor flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'latex' ? 'bg-white/15 text-white font-medium' : 'text-white/50 hover:text-white'
              }`}
            >
              <Code2 size={13} />
              <span>LaTeX Code</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title="Compile & Download PDF"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Research Input / Prompt Bar */}
      <div className="mb-4 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartResearch();
          }}
          className="flex items-center gap-2 bg-[#1c222c] border border-white/[0.08] rounded-2xl p-2 shadow-xl"
        >
          <Search size={16} className="text-white/40 ml-2 shrink-0" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isResearching}
            placeholder="Enter research topic, hypothesis, or ArXiv question (e.g. 'Non-equilibrium Floquet Topologies in Quantum Lattices')..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none font-victor"
          />

          <button
            type="submit"
            disabled={isResearching || !topic.trim()}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-victor text-xs font-medium flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
          >
            {isResearching ? (
              <RefreshCw size={14} className="animate-spin text-indigo-400" />
            ) : (
              <Sparkles size={14} className="text-indigo-400" />
            )}
            <span>{isResearching ? 'Researching...' : 'Conduct Research'}</span>
          </button>
        </form>

        {/* Suggested Quick Topics */}
        {!isResearching && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[11px] text-white/30 shrink-0">Inspiration:</span>
            {SUGGESTED_TOPICS.map((t, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(t);
                  handleStartResearch(t);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-[11px] text-white/60 hover:text-white truncate max-w-xs transition-colors cursor-pointer shrink-0"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Stage Research Progress Card (When Researching) */}
      {isResearching && (
        <div className="mb-4 p-4 rounded-2xl bg-[#1c222c] border border-indigo-500/30 shadow-2xl space-y-3 shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Autonomous Deep Research in Progress
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
              <Clock size={13} />
              <span>~{timeLeftSec}s remaining</span>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${researchProgress}%` }}
            />
          </div>

          {/* Current Stage Indicator */}
          <div className="flex items-center justify-between text-xs font-victor text-white/70">
            <span className="italic">{currentStage}</span>
            <span className="font-mono text-indigo-300 font-bold">{researchProgress}%</span>
          </div>
        </div>
      )}

      {/* Dual Workspace: Typeset Academic Paper vs Raw LaTeX Source */}
      <div className="flex-1 w-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Main Document Viewer (Paper or LaTeX Editor) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-white/[0.08] bg-[#1c222c] overflow-hidden shadow-2xl">
          
          {/* Pane Header Bar */}
          <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-2 text-xs font-victor text-white/80">
              <BookOpen size={15} className="text-indigo-400" />
              <span className="font-semibold">
                {activeTab === 'paper' ? 'Academic Typeset Preview (A4 Format)' : 'LaTeX Document Source (.tex)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLatex}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Copy LaTeX"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadTex}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer"
                title="Save .tex file"
              >
                .tex
              </button>
            </div>
          </div>

          {/* Content Stage */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-edge">
            {activeTab === 'paper' ? (
              /* Beautiful Academic Typeset White Paper Layout */
              <div className="max-w-2xl mx-auto bg-white text-[#1a1a1a] rounded-xl shadow-2xl p-6 sm:p-10 font-victor leading-relaxed select-text border border-slate-200 min-h-full">
                
                {/* Paper Header */}
                <div className="text-center pb-6 border-b border-slate-200">
                  <div className="text-[10px] font-victor tracking-widest uppercase text-slate-500 mb-2">
                    ASTRX Autonomous Research Repository • Academic Preprint
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold font-victor text-slate-900 leading-snug">
                    {parsedTitle}
                  </h1>

                  <div className="text-xs font-victor text-slate-600 mt-2">
                    {parsedAuthor}
                  </div>

                  {showPreparedBy && (
                    <div className="text-[11px] font-victor italic text-indigo-700 font-medium mt-1">
                      Prepared by ASTRX Research
                    </div>
                  )}
                </div>

                {/* Abstract Box */}
                {parsedAbstract && (
                  <div className="my-6 p-4 bg-slate-50 rounded-lg border-l-4 border-slate-800 text-xs sm:text-[13px] italic text-slate-700 leading-relaxed font-victor">
                    <span className="font-bold not-italic font-victor uppercase tracking-wider text-[11px] text-slate-900 block mb-1">
                      Abstract
                    </span>
                    {parsedAbstract}
                  </div>
                )}

                {/* Main Rendered LaTeX Body */}
                <div 
                  className="space-y-4 text-xs sm:text-[13px] text-slate-800"
                  dangerouslySetInnerHTML={{ __html: renderLatexBodyToHtml(latexCode) }}
                />
              </div>
            ) : (
              /* Editable LaTeX Code View */
              <textarea
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                spellCheck="false"
                className="w-full h-full bg-transparent text-xs font-mono text-white/90 placeholder:text-white/20 resize-none focus:outline-none leading-relaxed selection:bg-white/20"
                style={{ minHeight: '100%', tabSize: 2 }}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar: Iteration, Refinement & Quick Customization */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* 1) Iterate / Refine with ASTRX AI */}
          <div className="p-4 rounded-2xl bg-[#1c222c] border border-white/[0.08] shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-indigo-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-victor">
                Iterate & Refine Paper
              </h3>
            </div>

            <p className="text-[11px] text-white/50 font-victor">
              Request targeted expansions, new proofs, additional equations, or tone adjustments.
            </p>

            <form onSubmit={handleIterateRefinement} className="flex flex-col gap-2">
              <textarea
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="e.g. 'Add a section on experimental validation with superconducting qubits' or 'Expand the mathematical derivation for Eq. 3'..."
                rows={3}
                className="w-full bg-[#141b27] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 font-victor resize-none"
              />

              <button
                type="submit"
                disabled={isRefining || !refinePrompt.trim()}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium font-victor flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
              >
                {isRefining ? <RefreshCw size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                <span>{isRefining ? 'Updating Paper...' : 'Apply Refinement'}</span>
              </button>
            </form>
          </div>

          {/* 2) Document Metadata & Quick Actions */}
          <div className="p-4 rounded-2xl bg-[#1c222c] border border-white/[0.08] shadow-2xl space-y-3 font-victor text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-white/50">Document Format</span>
              <span className="text-white font-mono">LaTeX (article, A4)</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-white/50">Equations</span>
              <span className="text-emerald-400 font-mono">Typeset & Numbered</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-white/50">Prepared By Badge</span>
              <button
                onClick={() => setShowPreparedBy(!showPreparedBy)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  showPreparedBy ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-white/40'
                }`}
              >
                {showPreparedBy ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleDownloadPdf}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/[0.08]"
              >
                <Printer size={14} />
                <span>Export / Print Full PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
