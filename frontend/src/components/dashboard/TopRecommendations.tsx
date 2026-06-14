import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { ArrowRight, Lightbulb, TrendingDown } from "lucide-react";

function safeRecs(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter((r) => r != null && typeof r === "object");
  return [];
}

function safeNum(v: any): number {
  if (typeof v === "number" && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === "string") { const n = parseFloat(v); return !isNaN(n) && isFinite(n) ? n : 0; }
  if (v && typeof v === "object" && "toString" in v) { const n = parseFloat(v.toString()); return !isNaN(n) && isFinite(n) ? n : 0; }
  return 0;
}

export function TopRecommendations() {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recommendations/top?limit=3")
      .then((res) => {
        setRecs(safeRecs(res.data));
        setLoading(false);
      })
      .catch(() => {
        setRecs([]);
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (recs.length === 0) return null;

  return (
    <div className="glass-panel p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Top Savings Opportunities</h3>
        </div>
        <Link to="/recommendations" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0">
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recs.map((rec, i) => (
          <div key={rec.id || `rec-${i}`} className="bg-[#0f172a] border border-slate-700 rounded-lg p-4 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2 gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                rec.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" :
                rec.severity === "HIGH" ? "bg-amber-500/20 text-amber-400" :
                "bg-indigo-500/20 text-indigo-400"
              }`}>{rec.severity || "INFO"}</span>
              <div className="flex items-center gap-1 text-emerald-400 shrink-0">
                <TrendingDown size={14} />
                <span className="text-sm font-bold">${safeNum(rec.monthlySavings).toFixed(0)}/mo</span>
              </div>
            </div>
            <h4 className="font-medium text-sm text-white mb-1 line-clamp-2">{rec.title || "Recommendation"}</h4>
            <p className="text-xs text-gray-400 line-clamp-2">{rec.description || ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}