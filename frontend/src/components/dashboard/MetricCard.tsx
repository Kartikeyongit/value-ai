import { TrendingDown, TrendingUp, LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
  accent?: boolean;
}

function safeChange(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === "string") { const n = parseFloat(v); return !isNaN(n) && isFinite(n) ? n : null; }
  return null;
}

export function MetricCard({ title, value, change, icon: Icon, accent }: Props) {
  const safeVal = safeChange(change);
  const isPositive = safeVal !== null && safeVal < 0;

  return (
    <div className={`glass-panel p-4 md:p-5 transition-all hover:border-indigo-500/50 ${accent ? "metric-glow" : ""}`}>
      <div className="flex items-start justify-between min-w-0">
        <div className="min-w-0 flex-1 mr-3">
          <p className="text-sm text-gray-400 truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-white mt-1 truncate">{value || "—"}</p>
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${accent ? "bg-indigo-500/20" : "bg-slate-700"}`}>
          <Icon size={18} className={accent ? "text-indigo-400" : "text-gray-400"} />
        </div>
      </div>
      {safeVal !== null && (
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <TrendingDown size={14} className="text-emerald-400" />
          ) : (
            <TrendingUp size={14} className="text-red-400" />
          )}
          <span className={`text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {Math.abs(safeVal).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}