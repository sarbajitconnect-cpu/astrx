import React, { useState } from "react";
import { Copy, Check, Terminal, Play, Loader2, Code2, Eye } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import Graph2DViewer from "./visualizations/Graph2DViewer";
import Graph3DViewer from "./visualizations/Graph3DViewer";
import ChartViewer from "./visualizations/ChartViewer";
import { runPythonCode } from "../utils/pythonRunner";

function renderLatex(rawMath, displayMode = false) {
  if (!rawMath || typeof rawMath !== "string") return "";
  const trimmed = rawMath.trim();
  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      strict: false,
      trust: true
    });
  } catch (err) {
    return `<span class="text-rose-400 font-mono">${escapeHtml(trimmed)}</span>`;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function MarkdownRenderer({ content = "", onOpenInCodeStudio }) {
  if (!content) return null;

  // Split top-level content by fenced blocks
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const sections = content.split(codeBlockRegex);

  return (
    <div className="text-sm font-victor text-slate-100 leading-relaxed space-y-3 select-text">
      {sections.map((section, secIdx) => {
        if (!section) return null;

        // Fenced code/visual block
        if (section.startsWith("```") && section.endsWith("```")) {
          const lines = section.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const hasLang = firstLine && !firstLine.includes(" ") && lines.length > 1;
          const rawLang = (hasLang ? firstLine : "code").toLowerCase();
          const code = hasLang ? lines.slice(1).join("\n") : lines.join("\n");

          // 1. 2D Graph / Plot block
          if (rawLang === "plot" || rawLang === "graph" || rawLang === "2d-plot" || rawLang === "function") {
            return (
              <VisualPlotBlock 
                key={`plot-${secIdx}`} 
                code={code} 
                onOpenInCodeStudio={onOpenInCodeStudio} 
              />
            );
          }

          // 2. 3D Graph / Surface block
          if (rawLang === "plot3d" || rawLang === "graph3d" || rawLang === "3d" || rawLang === "surface3d") {
            return (
              <Visual3DBlock 
                key={`plot3d-${secIdx}`} 
                code={code} 
                onOpenInCodeStudio={onOpenInCodeStudio} 
              />
            );
          }

          // 3. Data Chart block
          if (rawLang === "chart" || rawLang === "barchart" || rawLang === "piechart" || rawLang === "linechart") {
            return (
              <VisualChartBlock 
                key={`chart-${secIdx}`} 
                code={code} 
                type={rawLang === "chart" ? "bar" : rawLang.replace("chart", "")}
              />
            );
          }

          // 4. Interactive HTML / SVG visual block
          if (rawLang === "html" || rawLang === "svg") {
            return (
              <VisualHtmlBlock 
                key={`html-${secIdx}`} 
                code={code} 
                lang={rawLang}
                onOpenInCodeStudio={onOpenInCodeStudio} 
              />
            );
          }

          // 5. Standard Code block (with inline execution for Python / JS)
          return (
            <CodeBlock 
              key={`code-${secIdx}`} 
              code={code} 
              language={rawLang} 
              onOpenInCodeStudio={onOpenInCodeStudio}
            />
          );
        }

        // Display math and markdown text
        return <MathAndMarkdownSection key={`sec-${secIdx}`} content={section} />;
      })}
    </div>
  );
}

function VisualPlotBlock({ code, onOpenInCodeStudio }) {
  const [showCode, setShowCode] = useState(false);

  // Parse formula & options
  let formula = code.trim();
  let title = "";
  let range = { xMin: -3, xMax: 3, yMin: -1, yMax: 5 };

  if (code.includes("{") && code.includes("}")) {
    try {
      const parsed = JSON.parse(code);
      formula = parsed.formula || parsed.function || formula;
      title = parsed.title || "";
      if (parsed.xMin !== undefined) range.xMin = parsed.xMin;
      if (parsed.xMax !== undefined) range.xMax = parsed.xMax;
    } catch {}
  } else {
    const lines = code.split("\n");
    formula = lines[0].replace(/^(?:formula|function|plot|y\s*=):\s*/i, "").trim();
    lines.slice(1).forEach(line => {
      if (/^title:/i.test(line)) title = line.replace(/^title:/i, "").trim();
      if (/^range:/i.test(line)) {
        const parts = line.replace(/^range:/i, "").split(",").map(s => parseFloat(s.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          range.xMin = parts[0];
          range.xMax = parts[1];
        }
      }
    });
  }

  return (
    <div className="my-3">
      <Graph2DViewer formula={formula} title={title} initialRange={range} />
      <div className="flex justify-end mt-1">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-[11px] font-victor text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Code2 size={12} />
          <span>{showCode ? "Hide Plot Config" : "View Plot Formula"}</span>
        </button>
      </div>
      {showCode && (
        <div className="mt-2">
          <CodeBlock code={code} language="plot" onOpenInCodeStudio={onOpenInCodeStudio} />
        </div>
      )}
    </div>
  );
}

function Visual3DBlock({ code, onOpenInCodeStudio }) {
  const [showCode, setShowCode] = useState(false);
  let formula = code.trim();
  let title = "3D Interactive Model";

  if (code.includes("{") && code.includes("}")) {
    try {
      const parsed = JSON.parse(code);
      formula = parsed.formula || parsed.z || formula;
      title = parsed.title || title;
    } catch {}
  } else {
    const lines = code.split("\n");
    formula = lines[0].replace(/^(?:formula|z\s*=):\s*/i, "").trim();
    lines.slice(1).forEach(line => {
      if (/^title:/i.test(line)) title = line.replace(/^title:/i, "").trim();
    });
  }

  return (
    <div className="my-3">
      <Graph3DViewer formula={formula} title={title} />
      <div className="flex justify-end mt-1">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-[11px] font-victor text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Code2 size={12} />
          <span>{showCode ? "Hide 3D Config" : "View 3D Formula"}</span>
        </button>
      </div>
      {showCode && (
        <div className="mt-2">
          <CodeBlock code={code} language="plot3d" onOpenInCodeStudio={onOpenInCodeStudio} />
        </div>
      )}
    </div>
  );
}

function VisualChartBlock({ code, type = "bar" }) {
  let parsedData = null;
  let title = "Data Visualization";

  try {
    parsedData = JSON.parse(code);
    if (parsedData.title) title = parsedData.title;
  } catch {
    parsedData = code;
  }

  return <ChartViewer data={parsedData} title={title} type={type} />;
}

function VisualHtmlBlock({ code, lang, onOpenInCodeStudio }) {
  const [viewMode, setViewMode] = useState("preview"); // "preview" | "code"

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111722] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#161e2c]/70 text-xs font-victor text-white/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="capitalize">{lang} Visual Component</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode(viewMode === "preview" ? "code" : "preview")}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {viewMode === "preview" ? <Code2 size={13} /> : <Eye size={13} />}
            <span>{viewMode === "preview" ? "Code" : "Preview"}</span>
          </button>
        </div>
      </div>

      {viewMode === "preview" ? (
        <div className="p-4 overflow-auto max-h-[400px]">
          {lang === "svg" ? (
            <div 
              className="flex justify-center items-center" 
              dangerouslySetInnerHTML={{ __html: code }} 
            />
          ) : (
            <iframe
              srcDoc={code}
              title="Interactive HTML Preview"
              className="w-full h-[280px] border-0 rounded-lg bg-transparent"
              sandbox="allow-scripts"
            />
          )}
        </div>
      ) : (
        <CodeBlock code={code} language={lang} onOpenInCodeStudio={onOpenInCodeStudio} />
      )}
    </div>
  );
}

function MathAndMarkdownSection({ content }) {
  if (!content) return null;

  const displayMathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(?:equation|align|gather|matrix|bmatrix|pmatrix|cases|aligned|array)\*?\}[\s\S]*?\\end\{(?:equation|align|gather|matrix|bmatrix|pmatrix|cases|aligned|array)\*?\})/g;
  const chunks = content.split(displayMathRegex);

  return (
    <>
      {chunks.map((chunk, cIdx) => {
        if (!chunk) return null;

        if (chunk.startsWith("$$") && chunk.endsWith("$$")) {
          const mathInner = chunk.slice(2, -2).trim();
          const mathHtml = renderLatex(mathInner, true);
          return (
            <div 
              key={`disp-math-${cIdx}`}
              className="my-3 overflow-x-auto text-center flex justify-center items-center select-text"
              dangerouslySetInnerHTML={{ __html: mathHtml }}
            />
          );
        }

        if (chunk.startsWith("\\[") && chunk.endsWith("\\]")) {
          const mathInner = chunk.slice(2, -2).trim();
          const mathHtml = renderLatex(mathInner, true);
          return (
            <div 
              key={`disp-math-${cIdx}`}
              className="my-3 overflow-x-auto text-center flex justify-center items-center select-text"
              dangerouslySetInnerHTML={{ __html: mathHtml }}
            />
          );
        }

        if (/^\\begin\{(?:equation|align|gather|matrix|bmatrix|pmatrix|cases|aligned|array)\*?\}/.test(chunk)) {
          const mathHtml = renderLatex(chunk, true);
          return (
            <div 
              key={`disp-math-${cIdx}`}
              className="my-3 overflow-x-auto text-center flex justify-center items-center select-text"
              dangerouslySetInnerHTML={{ __html: mathHtml }}
            />
          );
        }

        return <TextBlock key={`text-${cIdx}`} text={chunk} />;
      })}
    </>
  );
}

function CodeBlock({ code, language, onOpenInCodeStudio }) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenConsole = () => {
    if (onOpenInCodeStudio) {
      onOpenInCodeStudio(code, language);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    if (language === "python" || language === "py") {
      const res = await runPythonCode(code);
      setIsRunning(false);
      setExecutionOutput(res);
    } else if (language === "javascript" || language === "js") {
      try {
        const logs = [];
        const customConsole = { log: (...args) => logs.push(args.map(String).join(" ")) };
        const fn = new Function("console", code);
        fn(customConsole);
        setIsRunning(false);
        setExecutionOutput({ success: true, logs });
      } catch (err) {
        setIsRunning(false);
        setExecutionOutput({ success: false, error: err.message });
      }
    } else {
      setIsRunning(false);
      handleOpenConsole();
    }
  };

  const canRunDirectly = ["python", "py", "javascript", "js"].includes(language.toLowerCase());

  return (
    <div 
      className="my-3 rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl"
      style={{ backgroundColor: "#1c222c" }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] text-xs text-white/70">
        <div className="flex items-center gap-2">
          <span className="text-white/40 font-mono text-[11px]">&lt;/&gt;</span>
          <span className="font-mono text-xs font-medium text-white/90 capitalize">{language}</span>
        </div>

        <div className="flex items-center gap-2">
          {canRunDirectly && (
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-950/40 border border-emerald-800/30 transition-colors cursor-pointer"
              title="Execute code directly"
            >
              {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              <span>{isRunning ? "Running..." : "Run"}</span>
            </button>
          )}

          <button
            onClick={handleOpenConsole}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
            title="Open in Code Studio Console"
          >
            <Terminal size={13} className="text-white/40" />
            <span>Console</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : ""}</span>
          </button>
        </div>
      </div>
      
      <pre className="p-4 text-xs text-slate-100 overflow-x-auto leading-relaxed font-mono selection:bg-white/20">
        <code>{renderSyntaxHighlighted(code, language)}</code>
      </pre>

      {/* Inline Execution Output */}
      {executionOutput && (
        <div className="border-t border-white/[0.08] bg-[#0c121c] p-3 text-xs font-mono">
          <div className="text-[11px] text-white/50 mb-1 flex items-center justify-between">
            <span>Execution Output</span>
            <button 
              onClick={() => setExecutionOutput(null)} 
              className="text-white/40 hover:text-white text-[10px]"
            >
              Clear
            </button>
          </div>
          {executionOutput.success ? (
            <div className="text-emerald-300 space-y-0.5 whitespace-pre-wrap">
              {executionOutput.logs && executionOutput.logs.length > 0 
                ? executionOutput.logs.join("\n") 
                : "(Program executed successfully with no output)"}
            </div>
          ) : (
            <div className="text-rose-400 whitespace-pre-wrap">
              {executionOutput.error || "Execution error"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderSyntaxHighlighted(code, language) {
  const lines = code.split("\n");
  return lines.map((line, i) => (
    <div key={i} className="leading-relaxed">
      {highlightCodeLine(line, language)}
    </div>
  ));
}

function highlightCodeLine(line, lang) {
  const tokens = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:def|class|return|import|from|for|in|while|if|elif|else|const|let|var|function|async|await|console|print|True|False|None|true|false|null)\b|\b\d+\b)/g);

  return tokens.map((token, idx) => {
    if (!token) return null;
    if (/^(".*"|'.*')$/.test(token)) {
      return <span key={idx} className="text-emerald-400">{token}</span>;
    }
    if (/^(def|class|return|import|from|const|let|var|function|async|await)$/.test(token)) {
      return <span key={idx} className="text-rose-400 font-semibold">{token}</span>;
    }
    if (/^(for|in|while|if|elif|else)$/.test(token)) {
      return <span key={idx} className="text-purple-400 font-semibold">{token}</span>;
    }
    if (/^(print|console)$/.test(token)) {
      return <span key={idx} className="text-sky-400">{token}</span>;
    }
    if (/^(True|False|None|true|false|null)$/.test(token)) {
      return <span key={idx} className="text-amber-400">{token}</span>;
    }
    if (/^\d+$/.test(token)) {
      return <span key={idx} className="text-amber-300">{token}</span>;
    }
    return <span key={idx}>{token}</span>;
  });
}

function TextBlock({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let tableRows = [];
  let isInsideTable = false;

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-white/15 rounded-lg overflow-hidden">
            <tbody>
              {tableRows.map((row, rIdx) => {
                const isHeader = rIdx === 0;
                return (
                  <tr key={rIdx} className={isHeader ? "bg-white/10 font-semibold text-white" : "border-t border-white/10 hover:bg-white/5"}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 border-r border-white/10 last:border-r-0">
                        {renderFormattedInline(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      isInsideTable = true;
      if (!/^\|(\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        const cells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        tableRows.push(cells);
      }
      return;
    } else if (isInsideTable) {
      flushTable();
      isInsideTable = false;
    }

    if (!trimmed) return;

    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      elements.push(<hr key={`hr-${idx}`} className="my-4 border-t border-white/10" />);
      return;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const headerText = trimmed.replace(/^#{1,6}\s+/, "");
      elements.push(
        <h3 key={idx} className="font-semibold text-white text-base tracking-wide mt-3 mb-1">
          {renderFormattedInline(headerText)}
        </h3>
      );
      return;
    }

    if (/^>\s+/.test(trimmed)) {
      const quoteText = trimmed.replace(/^>\s+/, "");
      elements.push(
        <blockquote key={idx} className="my-2 pl-3 border-l-2 border-white/30 text-slate-300 italic text-[13px]">
          {renderFormattedInline(quoteText)}
        </blockquote>
      );
      return;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-slate-200">
          <span className="text-slate-400 mt-0.5">•</span>
          <span className="flex-1">{renderFormattedInline(bulletText)}</span>
        </div>
      );
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-slate-200">
            <span className="text-slate-400 font-mono text-xs shrink-0">{numMatch[1]}</span>
            <span className="flex-1">{renderFormattedInline(numMatch[2])}</span>
          </div>
        );
        return;
      }
    }

    elements.push(
      <p key={idx} className="text-slate-200 my-1 leading-relaxed">
        {renderFormattedInline(trimmed)}
      </p>
    );
  });

  if (isInsideTable) flushTable();
  return <div className="space-y-1">{elements}</div>;
}

function renderFormattedInline(text) {
  if (!text) return null;

  const inlineRegex = /(\\\([\s\S]*?\\\)|(?<!\\)\$(?!\s)(?:\\\$|[^$\n])+?(?<!\s)\$|\*\*[\s\S]*?\*\*|`[^`\n]*?`|\*[^*\n]+?\*)/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      const mathBody = part.slice(2, -2).trim();
      const mathHtml = renderLatex(mathBody, false);
      return (
        <span 
          key={`in-math-${index}`} 
          className="inline-block px-1 align-baseline select-text font-normal"
          dangerouslySetInnerHTML={{ __html: mathHtml }}
        />
      );
    }

    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const mathBody = part.slice(1, -1).trim();
      if (!/^\d+(?:\.\d+)?$/.test(mathBody)) {
        const mathHtml = renderLatex(mathBody, false);
        return (
          <span 
            key={`in-dollar-${index}`} 
            className="inline-block px-1 align-baseline select-text font-normal"
            dangerouslySetInnerHTML={{ __html: mathHtml }}
          />
        );
      }
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`b-${index}`} className="font-semibold text-white">
          {renderFormattedInline(part.slice(2, -2))}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={`c-${index}`} className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={`em-${index}`} className="italic text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={`t-${index}`}>{part}</span>;
  });
}
