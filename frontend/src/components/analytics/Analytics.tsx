import { useEffect, useState, useRef, useMemo } from "react";
import api from "../../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from "recharts";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

function CustomPeriodDropdown({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [
    { value: 7, label: "Last 7 days" },
    { value: 30, label: "Last 30 days" },
    { value: 90, label: "Last 90 days" },
  ];
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-700/80 hover:border-slate-600 transition-all w-full sm:w-44"
      >
        <span className="font-medium">{selected?.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-full sm:w-44 bg-[#0f172a] border border-slate-700 rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                option.value === value
                  ? "bg-indigo-500/15 text-indigo-400 font-medium"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function safeNum(v: any): number {
  if (typeof v === "number" && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === "string") { const n = parseFloat(v); return !isNaN(n) && isFinite(n) ? n : 0; }
  if (v && typeof v === "object" && "toString" in v) { const n = parseFloat(v.toString()); return !isNaN(n) && isFinite(n) ? n : 0; }
  return 0;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#f8fafc",
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
};

const SCATTER_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4"];

function SkeletonCard() {
  return (
    <div className="glass-panel p-5 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-slate-700 rounded w-3/4"></div>
    </div>
  );
}

export function Analytics() {
  const [burnRate, setBurnRate] = useState<any>(null);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [efficiency, setEfficiency] = useState<any[]>([]);
  const [latencyCorr, setLatencyCorr] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/burn-rate"),
      api.get(`/analytics/cost-distribution?days=${days}`),
      api.get(`/analytics/efficiency-metrics?days=${days}`),
      api.get(`/usage/latency-correlation?days=${days}`),
    ]).then(([bRes, dRes, eRes, lRes]) => {
      setBurnRate(bRes.data);
      setDistribution(Array.isArray(dRes.data) ? dRes.data : []);
      setEfficiency(Array.isArray(eRes.data) ? eRes.data : []);
      setLatencyCorr(Array.isArray(lRes.data) ? lRes.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [days]);

  // Memoize data so Recharts doesn't re-render on every state tick
  const barData = useMemo(() => distribution.slice(0, 10), [distribution]);
  const scatterData = useMemo(() => latencyCorr, [latencyCorr]);

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={TOOLTIP_STYLE} className="p-3 min-w-[180px]">
          <p style={{ fontWeight: 600, marginBottom: 6, color: "#f8fafc" }}>{data.modelName}</p>
          <div className="space-y-1">
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Latency: <span style={{ color: "#f8fafc" }}>{Math.round(safeNum(data.avgLatency))}ms</span></p>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Avg Cost: <span style={{ color: "#f8fafc" }}>${safeNum(data.avgCost).toFixed(4)}</span></p>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Requests: <span style={{ color: "#f8fafc" }}>{safeNum(data.requestCount).toLocaleString()}</span></p>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Total Cost: <span style={{ color: "#f8fafc" }}>${safeNum(data.totalCost).toFixed(2)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="text-gray-400 mt-1">Loading...</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-panel p-6 animate-pulse"><div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div><div className="h-72 bg-slate-800/50 rounded"></div></div>
          <div className="glass-panel p-6 animate-pulse"><div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div><div className="h-72 bg-slate-800/50 rounded"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Deep-dive cost and efficiency analysis</p>
        </div>
        <CustomPeriodDropdown value={days} onChange={setDays} />
      </div>

      {burnRate && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-indigo-400" /><span className="text-sm text-gray-400">Avg Daily Burn</span></div>
            <p className="text-2xl font-bold text-white">${safeNum(burnRate.avgDailyBurn).toFixed(2)}</p>
          </div>
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-indigo-400" /><span className="text-sm text-gray-400">Projected Monthly</span></div>
            <p className="text-2xl font-bold text-white">${safeNum(burnRate.projectedMonthlyBurn).toFixed(2)}</p>
          </div>
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className="text-indigo-400" /><span className="text-sm text-gray-400">Trend</span></div>
            <p className={`text-2xl font-bold ${safeNum(burnRate.trend) > 0 ? "text-red-400" : "text-emerald-400"}`}>{safeNum(burnRate.trend) > 0 ? "+" : ""}{safeNum(burnRate.trend).toFixed(1)}%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cost by Model */}
        <div className="glass-panel p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost by Model</h3>
          {/* FIXED SIZE CONTAINER - prevents flash */}
          <div className="w-full" style={{ height: 360 }}>
            {barData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="modelName" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={120} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(99, 102, 241, 0.1)" }} />
                  <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Latency vs Cost - FIXED */}
        <div className="glass-panel p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Latency vs Cost Correlation</h3>
          
          {/* FIXED SIZE CONTAINER - prevents flash */}
          <div className="w-full relative" style={{ height: 340 }}>
            {scatterData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    type="number"
                    dataKey="avgLatency"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    tickFormatter={(v) => `${Math.round(v)}`}
                    label={{ value: "Latency (ms)", position: "bottom", offset: 15, fill: "#64748b", fontSize: 12 }}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    type="number"
                    dataKey="avgCost"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    tickFormatter={(v) => `$${safeNum(v).toFixed(3)}`}
                    width={50}
                    domain={["auto", "auto"]}
                  />
                  <ZAxis type="number" dataKey="requestCount" range={[20, 80]} />
                  <Tooltip content={<ScatterTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Scatter data={scatterData} shape="circle">
                    {scatterData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SCATTER_COLORS[index % SCATTER_COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {scatterData.slice(0, 8).map((entry, i) => (
              <div key={entry.modelId || i} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SCATTER_COLORS[i % SCATTER_COLORS.length] }} />
                <span className="truncate max-w-[100px]">{entry.modelName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-5 md:p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Model Efficiency Ranking</h3>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Model</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Cost/Token</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Latency</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Cost</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Requests</th>
            </tr>
          </thead>
          <tbody>
            {efficiency.map((row) => (
              <tr key={row.modelName} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                <td className="py-3 px-4 font-medium text-white">{row.modelName}</td>
                <td className="py-3 px-4 text-right text-white">${safeNum(row.costPerToken).toExponential(2)}</td>
                <td className="py-3 px-4 text-right text-white">{Math.round(safeNum(row.avgLatency))}ms</td>
                <td className="py-3 px-4 text-right text-white">${safeNum(row.totalCost).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-gray-400">{safeNum(row.requestCount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}