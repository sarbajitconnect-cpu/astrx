import React from 'react';
import { 
  ExternalLink, 
  BookOpen
} from 'lucide-react';

export default function ResearchResponseCard({ 
  researchData, 
  onOpenInResearchStudio 
}) {
  if (!researchData) return null;

  const { title, author, abstract, latexCode, bodyHtml, topic } = researchData;

  const handleOpenPaper = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const docTitle = title || 'ASTRX Research Report';
    const docAuthor = author || 'ASTRX Intelligence Laboratory';
    const docAbstract = abstract || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${docTitle}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            size: A4;
            margin: 22mm 22mm 22mm 22mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', 'Nimbus Roman No9 L', 'Times', serif;
            color: #111111;
            line-height: 1.65;
            margin: 0 auto;
            padding: 40px 48px;
            max-width: 820px;
            background: #ffffff;
            font-size: 14px;
          }
          .header-banner {
            border-bottom: 1.5px solid #111111;
            padding-bottom: 10px;
            margin-bottom: 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #555555;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .paper-title {
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            margin: 16px 0 10px 0;
            line-height: 1.35;
            color: #111111;
          }
          .author-block {
            text-align: center;
            font-size: 13.5px;
            color: #333333;
            margin-bottom: 6px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .watermark-attribution {
            text-align: center;
            font-size: 11.5px;
            font-style: italic;
            color: #444444;
            margin-bottom: 26px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .abstract-card {
            background: #f8fafc;
            border-left: 3.5px solid #1e293b;
            border-right: 1px solid #e2e8f0;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 16px 20px;
            margin: 24px 0 28px 0;
            font-size: 13px;
            font-style: italic;
            line-height: 1.6;
          }
          .abstract-heading {
            font-weight: 700;
            font-style: normal;
            font-size: 12px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .content h3 {
            font-size: 16px;
            font-weight: 700;
            margin-top: 26px;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            color: #0f172a;
          }
          .content h4 {
            font-size: 14px;
            font-weight: 700;
            margin-top: 18px;
            margin-bottom: 8px;
            color: #1e293b;
          }
          .content p {
            margin-bottom: 12px;
            text-align: justify;
            text-justify: inter-word;
          }
          .equation-box {
            text-align: center;
            font-family: 'Cambria Math', 'Latin Modern Math', 'Times New Roman', serif;
            font-size: 14.5px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12.5px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          th {
            border-top: 2px solid #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding: 9px 10px;
            text-align: left;
            font-weight: 700;
            background: #f1f5f9;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          ul, ol {
            padding-left: 24px;
            margin: 12px 0;
          }
          li {
            margin-bottom: 6px;
          }
          .footer-section {
            margin-top: 44px;
            border-top: 1px solid #cbd5e1;
            padding-top: 14px;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .action-bar {
            position: fixed;
            top: 16px;
            right: 16px;
            display: flex;
            gap: 8px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          }
          .action-bar button {
            background: #ffffff;
            color: #0f172a;
            border: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .action-bar button:hover {
            background: #f1f5f9;
          }
          @media print {
            .action-bar {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button onclick="window.print()">Print / Save PDF</button>
        </div>

        <div class="header-banner">
          <span>ASTRX Autonomous Research Repository</span>
          <span>Academic Preprint • A4</span>
        </div>

        <h1 class="paper-title">${docTitle}</h1>
        <div class="author-block">${docAuthor}</div>
        <div class="watermark-attribution">Prepared by ASTRX Research</div>

        ${docAbstract ? `
          <div class="abstract-card">
            <div class="abstract-heading">Abstract</div>
            ${docAbstract}
          </div>
        ` : ''}

        <div class="content">
          ${bodyHtml || ''}
        </div>

        <div class="footer-section">
          <span>ASTRX Research Kernel</span>
          <span>Prepared by ASTRX Research</span>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#1c222c] overflow-hidden shadow-2xl space-y-0 font-victor my-3 select-text">
      
      {/* Top Header: Just the Title on the left, Single Open Paper Option on the right */}
      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookOpen size={16} className="text-white/70 shrink-0" />
          <h3 className="text-xs md:text-sm font-semibold text-white tracking-wide truncate">
            {title || 'Research Analysis'}
          </h3>
        </div>

        {/* Single Action Option */}
        <button
          onClick={handleOpenPaper}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/[0.08] text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 hover:border-white/20 active:scale-95"
          title="Open Paper in External View"
        >
          <ExternalLink size={13} />
          <span>Open Paper</span>
        </button>
      </div>

      {/* Body Viewer: Real Typeset Academic Paper with Internal Watermark */}
      <div className="p-4 md:p-6 overflow-auto max-h-[560px] scrollbar-edge bg-black/20">
        <div className="max-w-2xl mx-auto bg-[#fafafa] text-[#111827] rounded-xl shadow-2xl p-6 sm:p-8 font-victor leading-relaxed select-text border border-slate-300">
          
          {/* Paper Header Banner */}
          <div className="border-b border-slate-300 pb-3 mb-4 flex items-center justify-between text-[10px] font-victor text-slate-500 uppercase tracking-widest">
            <span>ASTRX Research Repository</span>
            <span>Academic Preprint</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold font-victor text-slate-900 leading-snug text-center mb-2">
            {title || 'Research Analysis'}
          </h2>

          {/* Author */}
          <div className="text-xs font-victor text-slate-600 text-center mb-1">
            {author || 'ASTRX Intelligence Laboratory'}
          </div>

          {/* Inside Watermark */}
          <div className="text-[11px] font-victor italic text-slate-500 text-center mb-5 pb-3 border-b border-slate-200">
            Prepared by ASTRX Research
          </div>

          {/* Abstract Box */}
          {abstract && (
            <div className="my-5 p-4 bg-slate-100/90 rounded-lg border-l-4 border-slate-800 text-xs italic text-slate-700 leading-relaxed font-victor">
              <span className="font-bold not-italic font-victor uppercase tracking-wider text-[10px] text-slate-900 block mb-1">
                Abstract
              </span>
              {abstract}
            </div>
          )}

          {/* Formatted Academic Body */}
          <div 
            className="space-y-3 text-xs sm:text-[13px] text-slate-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: bodyHtml || '' }}
          />

          {/* Paper Footer */}
          <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] font-victor text-slate-500">
            <span>ASTRX Research Kernel</span>
            <span className="italic">Prepared by ASTRX Research</span>
          </div>
        </div>
      </div>
    </div>
  );
}
