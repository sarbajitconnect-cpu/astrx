import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  FileText, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  Search, 
  Share2,
  GraduationCap
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function AcademicReportViewer({ 
  report, 
  topic, 
  papers = [], 
  onBack, 
  onNewSearch 
}) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await fetch('/api/backend/api/study/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic || 'Academic Research Report',
          content: report
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(topic || 'Research').replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`;
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
    setIsExportingDocx(true);
    try {
      const res = await fetch('/api/backend/api/study/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic || 'Academic Research Report',
          content: report
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(topic || 'Research').replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('DOCX export failed:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d1a] text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all flex items-center space-x-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Research Hub</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-white truncate max-w-sm">
              {topic}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-medium transition-all"
            title="Download PDF Document"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-medium transition-all"
            title="Download Word DOCX Document"
          >
            {isExportingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            <span>Export DOCX</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-medium transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: 13-Section Academic Report */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6">
          <div className="max-w-4xl mx-auto bg-slate-900/60 border border-white/10 rounded-2xl p-6 lg:p-10 shadow-2xl backdrop-blur-md">
            <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-medium text-purple-400 tracking-wider uppercase">
                  Peer-Reviewed Academic Synthesis Report
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {topic}
                </h1>
              </div>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-mono">
                Astra Study Mode
              </span>
            </div>

            <div className="prose prose-invert prose-slate max-w-none text-slate-200 leading-relaxed text-sm sm:text-base">
              <MarkdownRenderer content={report} />
            </div>
          </div>
        </div>

        {/* Right: Verified Academic Papers Sidebar */}
        {papers && papers.length > 0 && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-950/80 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Indexed Preprints & Papers ({papers.length})
              </span>
            </div>

            <div className="space-y-3">
              {papers.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/70 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all"
                >
                  <span className="text-[10px] font-mono font-semibold text-purple-400">
                    {p.source_db || 'Crossref'} • {p.year || '2025'}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200 mt-1 leading-snug">
                    {p.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">
                    {p.authors}
                  </p>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    {p.venue}
                  </p>
                  {p.doi_or_url && (
                    <a
                      href={p.doi_or_url.startsWith('http') ? p.doi_or_url : `https://doi.org/${p.doi_or_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] text-purple-400 hover:text-purple-300 mt-2 font-mono"
                    >
                      <span>View Publication</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
