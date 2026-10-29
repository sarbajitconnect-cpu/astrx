import React, { useState } from "react";
import { BarChart3, PieChart, LineChart, Table } from "lucide-react";

export default function ChartViewer({ 
  data = null, 
  title = "Data Visualization", 
  type = "bar" // "bar" | "line" | "pie" | "scatter"
}) {
  const [viewMode, setViewMode] = useState("chart"); // "chart" | "table"
  const [activeType, setActiveType] = useState(type);

  // Parse chart data from JSON object or arrays
  const chartData = parseData(data);

  function parseData(raw) {
    if (!raw) {
      return {
        labels: ["A", "B", "C", "D", "E"],
        values: [12, 19, 8, 15, 22]
      };
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return parseData(parsed);
      } catch {
        return {
          labels: ["Series 1", "Series 2", "Series 3"],
          values: [30, 50, 20]
        };
      }
    }
    if (Array.isArray(raw)) {
      if (raw.length > 0 && typeof raw[0] === "object") {
        const keys = Object.keys(raw[0]);
        const labelKey = keys.find(k => typeof raw[0][k] === "string") || keys[0];
        const valKey = keys.find(k => typeof raw[0][k] === "number") || keys[1] || keys[0];
        return {
          labels: raw.map(d => String(d[labelKey])),
          values: raw.map(d => Number(d[valKey]) || 0)
        };
      }
      return {
        labels: raw.map((_, i) => `Item ${i + 1}`),
        values: raw.map(v => Number(v) || 0)
      };
    }
    return {
      labels: raw.labels || ["A", "B", "C", "D"],
      values: raw.values || raw.data || [10, 20, 15, 25]
    };
  }

  const maxVal = Math.max(...chartData.values, 1);

  const colors = [
    "#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f43f5e", 
    "#a78bfa", "#2dd4bf", "#fb923c", "#ec4899", "#60a5fa"
  ];

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111722] shadow-2xl select-none">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#161e2c]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <BarChart3 size={15} className="text-sky-400" />
          <span className="text-xs font-medium font-victor text-white/90">{title}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-white/60">
          <button
            onClick={() => setActiveType("bar")}
            className={`p-1 rounded cursor-pointer ${activeType === "bar" ? "bg-white/15 text-white" : "hover:bg-white/5"}`}
            title="Bar Chart"
          >
            <BarChart3 size={13} />
          </button>
          <button
            onClick={() => setActiveType("line")}
            className={`p-1 rounded cursor-pointer ${activeType === "line" ? "bg-white/15 text-white" : "hover:bg-white/5"}`}
            title="Line Chart"
          >
            <LineChart size={13} />
          </button>
          <button
            onClick={() => setActiveType("pie")}
            className={`p-1 rounded cursor-pointer ${activeType === "pie" ? "bg-white/15 text-white" : "hover:bg-white/5"}`}
            title="Donut / Pie Chart"
          >
            <PieChart size={13} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === "table" ? "chart" : "table")}
            className={`p-1 rounded cursor-pointer ${viewMode === "table" ? "bg-white/15 text-white" : "hover:bg-white/5"}`}
            title="Toggle Data Table"
          >
            <Table size={13} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-white/10 rounded-lg">
              <thead>
                <tr className="bg-white/5 text-white/80">
                  <th className="p-2 border-b border-white/10">Category / Label</th>
                  <th className="p-2 border-b border-white/10 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {chartData.labels.map((lbl, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 font-victor text-slate-300">
                    <td className="p-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span>{lbl}</span>
                    </td>
                    <td className="p-2 text-right font-mono text-white/90">{chartData.values[idx]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeType === "bar" ? (
          <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {chartData.labels.map((lbl, idx) => {
              const val = chartData.values[idx];
              const heightPct = Math.max(8, (val / maxVal) * 100);
              const color = colors[idx % colors.length];

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div 
                    className="w-full max-w-[48px] rounded-t-lg transition-all duration-300 hover:brightness-125 relative flex items-start justify-center pt-1.5 shadow-lg"
                    style={{ 
                      height: `${heightPct}%`, 
                      backgroundColor: color,
                      boxShadow: `0 4px 20px ${color}33`
                    }}
                  >
                    <span className="text-[10px] font-mono text-white font-bold drop-shadow-md">
                      {val}
                    </span>
                  </div>
                  <span className="text-[10px] font-victor text-white/60 mt-2 truncate w-full text-center">
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>
        ) : activeType === "line" ? (
          <div className="h-60 relative flex items-center justify-center p-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
              <defs>
                <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Draw area and line */}
              {(() => {
                const count = chartData.labels.length;
                if (count === 0) return null;
                const points = chartData.values.map((v, i) => {
                  const x = (i / Math.max(1, count - 1)) * 460 + 20;
                  const y = 180 - (v / maxVal) * 150;
                  return { x, y, v, lbl: chartData.labels[i] };
                });

                const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
                const areaD = `${pathD} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#chartLineGrad)" />
                    <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#fff" fontSize="10" fontFamily="Victor Mono">{p.v}</text>
                        <text x={p.x} y="200" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="Victor Mono">{p.lbl}</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          /* Donut / Pie View */
          <div className="h-60 flex items-center justify-around">
            <svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90">
              {(() => {
                const total = chartData.values.reduce((a, b) => a + b, 0) || 1;
                let accumulated = 0;
                return chartData.values.map((val, idx) => {
                  const strokePct = (val / total) * 100;
                  const strokeOffset = 100 - accumulated + 25;
                  accumulated += strokePct;
                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="16"
                      strokeDasharray={`${strokePct} ${100 - strokePct}`}
                      strokeDashoffset={strokeOffset}
                      className="transition-all duration-300 hover:stroke-width-[18]"
                    />
                  );
                });
              })()}
            </svg>

            {/* Legend */}
            <div className="space-y-1.5 max-w-[200px]">
              {chartData.labels.map((lbl, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs font-victor">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="text-white/80 truncate">{lbl}</span>
                  </div>
                  <span className="font-mono text-white/60 shrink-0">{chartData.values[idx]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
