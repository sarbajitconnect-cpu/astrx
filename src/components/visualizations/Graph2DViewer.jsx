import React, { useRef, useEffect, useState, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

function createFunctionFromFormula(rawStr) {
  if (!rawStr || typeof rawStr !== "string") return () => 0;

  let clean = rawStr.trim();
  clean = clean.replace(/^(?:y\s*=\s*|f\(x\)\s*=\s*|z\s*=\s*)/i, "");
  clean = clean.replace(/\^/g, "**");
  clean = clean.replace(/(\d+)\s*([a-zA-Z\(])/g, "$1 * $2");
  clean = clean.replace(/(\))\s*([a-zA-Z\d\(])/g, "$1 * $2");
  clean = clean.replace(/([xX])\s*([a-zA-Z\d\(])/g, "$1 * $2");

  clean = clean.replace(/\bsin\b/gi, "Math.sin");
  clean = clean.replace(/\bcos\b/gi, "Math.cos");
  clean = clean.replace(/\btan\b/gi, "Math.tan");
  clean = clean.replace(/\bsqrt\b/gi, "Math.sqrt");
  clean = clean.replace(/\babs\b/gi, "Math.abs");
  clean = clean.replace(/\bexp\b/gi, "Math.exp");
  clean = clean.replace(/\b(?:ln|log)\b/gi, "Math.log");
  clean = clean.replace(/\bpi\b/gi, "Math.PI");
  clean = clean.replace(/\be\b/gi, "Math.E");

  try {
    const fn = new Function("x", `
      try {
        const val = ${clean};
        if (typeof val !== "number" || isNaN(val) || !isFinite(val)) return null;
        return val;
      } catch (e) {
        return null;
      }
    `);
    fn(0);
    fn(1);
    return fn;
  } catch (err) {
    console.warn("Failed to compile function:", rawStr, err);
    return (x) => 0;
  }
}

export default function Graph2DViewer({ 
  formula = "5/6 * x^6", 
  title = "", 
  data = null,
  initialRange = { xMin: -2.5, xMax: 2.5, yMin: -0.5, yMax: 5 }
}) {
  const canvasRef = useRef(null);
  const [range, setRange] = useState(initialRange);
  const [hoverCoord, setHoverCoord] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const plotFunctions = useMemo(() => {
    if (data && Array.isArray(data.functions)) {
      return data.functions.map(f => ({
        fn: createFunctionFromFormula(f.formula || f),
        label: f.label || f.formula || f,
        color: f.color || "#38bdf8"
      }));
    }
    
    const parts = (formula || "5/6 * x^6").split(",").map(s => s.trim()).filter(Boolean);
    const colors = ["#38bdf8", "#fbbf24", "#34d399", "#f43f5e", "#a78bfa"];
    return parts.map((part, idx) => ({
      fn: createFunctionFromFormula(part),
      label: part.replace(/^(?:y\s*=\s*|f\(x\)\s*=\s*)/i, "y = "),
      color: colors[idx % colors.length]
    }));
  }, [formula, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 340;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#111722";
    ctx.fillRect(0, 0, width, height);

    const { xMin, xMax, yMin, yMax } = range;
    const toScreenX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;
    const toMathX = (px) => xMin + (px / width) * (xMax - xMin);

    // Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "10px monospace";

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xStep = calculateStep(xRange);
    const yStep = calculateStep(yRange);

    const firstX = Math.ceil(xMin / xStep) * xStep;
    for (let x = firstX; x <= xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();

      if (Math.abs(x) > 0.0001) {
        ctx.fillText(x.toFixed(xStep < 1 ? 1 : 0), sx + 3, height - 6);
      }
    }

    const firstY = Math.ceil(yMin / yStep) * yStep;
    for (let y = firstY; y <= yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();

      if (Math.abs(y) > 0.0001) {
        ctx.fillText(y.toFixed(yStep < 1 ? 1 : 0), 6, sy - 3);
      }
    }

    // Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";

    if (yMin <= 0 && yMax >= 0) {
      const sy = toScreenY(0);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    if (xMin <= 0 && xMax >= 0) {
      const sx = toScreenX(0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    // Plot functions
    plotFunctions.forEach(({ fn, color }) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      let isDrawing = false;
      const numSamples = width * 2;

      for (let i = 0; i <= numSamples; i++) {
        const px = (i / numSamples) * width;
        const x = toMathX(px);
        const y = fn(x);

        if (y === null || isNaN(y) || !isFinite(y)) {
          isDrawing = false;
          continue;
        }

        const py = toScreenY(y);
        if (py < -height * 2 || py > height * 3) {
          isDrawing = false;
          continue;
        }

        if (!isDrawing) {
          ctx.moveTo(px, py);
          isDrawing = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    });

    // Crosshair
    if (hoverCoord) {
      const hx = toScreenX(hoverCoord.x);
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";

      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      plotFunctions.forEach(({ fn, color }) => {
        const y = fn(hoverCoord.x);
        if (y !== null && isFinite(y)) {
          const hy = toScreenY(y);
          if (hy >= 0 && hy <= height) {
            ctx.fillStyle = color;
            ctx.shadowColor = "#000";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(hx, hy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "#fff";
            ctx.stroke();
          }
        }
      });
    }
  }, [range, plotFunctions, hoverCoord]);

  function calculateStep(span) {
    const rough = span / 8;
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const fraction = rough / power;
    if (fraction < 1.5) return power;
    if (fraction < 3) return 2 * power;
    if (fraction < 7) return 5 * power;
    return 10 * power;
  }

  const handleZoom = (factor) => {
    setRange(prev => {
      const xMid = (prev.xMin + prev.xMax) / 2;
      const yMid = (prev.yMin + prev.yMax) / 2;
      const xHalf = ((prev.xMax - prev.xMin) * factor) / 2;
      const yHalf = ((prev.yMax - prev.yMin) * factor) / 2;
      return {
        xMin: xMid - xHalf,
        xMax: xMid + xHalf,
        yMin: yMid - yHalf,
        yMax: yMid + yHalf
      };
    });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const xVal = range.xMin + (px / rect.width) * (range.xMax - range.xMin);
    const yVal = range.yMax - (py / rect.height) * (range.yMax - range.yMin);

    setHoverCoord({ x: xVal, y: yVal });

    if (isPanning) {
      const dxPx = e.clientX - panStart.x;
      const dyPx = e.clientY - panStart.y;
      setPanStart({ x: e.clientX, y: e.clientY });

      const dxMath = (dxPx / rect.width) * (range.xMax - range.xMin);
      const dyMath = (dyPx / rect.height) * (range.yMax - range.yMin);

      setRange(prev => ({
        xMin: prev.xMin - dxMath,
        xMax: prev.xMax - dxMath,
        yMin: prev.yMin + dyMath,
        yMax: prev.yMax + dyMath
      }));
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111722] shadow-2xl select-none">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#161e2c]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-medium font-victor text-white/90">
            {title || plotFunctions.map(p => p.label).join(" & ") || "2D Function Plot"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/60">
          {hoverCoord && (
            <span className="font-mono text-[11px] text-sky-300 mr-2 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
              x: {hoverCoord.x.toFixed(2)}, y: {plotFunctions[0]?.fn(hoverCoord.x)?.toFixed(2) ?? hoverCoord.y.toFixed(2)}
            </span>
          )}

          <button
            onClick={() => handleZoom(0.8)}
            title="Zoom In"
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            title="Zoom Out"
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setRange(initialRange)}
            title="Reset View"
            className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[320px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseDown={(e) => { setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY }); }}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => { setIsPanning(false); setHoverCoord(null); }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-[#161e2c]/40 text-[11px] font-victor text-white/50">
        <div className="flex items-center gap-4">
          {plotFunctions.map((p, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-white/80 font-mono">{p.label}</span>
            </div>
          ))}
        </div>
        <span className="italic text-[10px] text-white/40">Drag to pan • Hover to inspect coordinates</span>
      </div>
    </div>
  );
}
