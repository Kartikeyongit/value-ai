import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Check, X, TrendingDown, AlertTriangle } from "lucide-react";

function safeNum(v: any): number {
  if (typeof v === "number" && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === "string") { const n = parseFloat(v); return !isNaN(n) && isFinite(n) ? n : 0; }
  if (v && typeof v === "object" && "toString" in v) { const n = parseFloat(v.toString()); return !isNaN(n) && isFinite(n) ? n : 0; }
  return 0;
}

export function Recommendations() {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recommendations")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setRecs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const apply = async (id: string) => {
    await api.post(`/recommendations/${id}/apply`);
    setRecs(recs.map((r) => r.id === id ? { ...r, status: "APPLIED" } : r));
  };

  const dismiss = async (id: string) => {
    await api.post(`/recommendations/${id}/dismiss`);
    setRecs(recs.map((r) => r.id === id ? { ...r, status: "DISMISSED" } : r));
  };

  const generate = async () => {
    setLoading(true);
    const res = await api.post("/recommendations/generate");
    setRecs(Array.isArray(res.data?.recommendations) ? res.data.recommendations : []);
    setLoading(false);
  };

  const totalSavings = recs
    .filter((r) => r.status === "ACTIVE")
    .reduce((sum, r) => sum + safeNum(r.monthlySavings), 0);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recommendations</h1>
          <p className="text-text-secondary mt-1">AI-powered cost optimization suggestions</p>
        </div>
        <button onClick={generate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
          Regenerate
        </button>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center shrink-0">
            <TrendingDown size={24} className="text-success" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Potential Monthly Savings</p>
            <p className="text-3xl font-bold text-success">${totalSavings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {recs.map((rec) => {
          const severityConfig = {
            CRITICAL: { bg: "bg-danger/15", text: "text-danger", border: "border-danger/30" },
            HIGH: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/30" },
            MEDIUM: { bg: "bg-accent/15", text: "text-accent", border: "border-accent/30" },
            LOW: { bg: "bg-slate-700/50", text: "text-gray-400", border: "border-slate-700" },
          };
          const cfg = severityConfig[rec.severity as keyof typeof severityConfig] || severityConfig.MEDIUM;

          return (
            <div
              key={rec.id}
              className={`glass-panel p-5 md:p-6 transition-all ${rec.status === "APPLIED" ? "opacity-50" : "hover:border-accent/30"}`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Icon + Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Warning Icon - larger, better aligned */}
                  <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <AlertTriangle size={22} className={cfg.text} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-base">{rec.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                        {rec.severity}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{rec.description}</p>

                    {/* Cost comparison row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-secondary">Current</span>
                        <span className="text-sm font-medium text-white">${safeNum(rec.currentMonthlyCost).toFixed(2)}</span>
                      </div>
                      <div className="text-text-secondary">→</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-text-secondary">Recommended</span>
                        <span className="text-sm font-medium text-success">${safeNum(rec.recommendedMonthlyCost).toFixed(2)}</span>
                      </div>
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-success/15 text-success">
                        Save ${safeNum(rec.monthlySavings).toFixed(2)}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 md:pt-1">
                  {rec.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={() => apply(rec.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors text-sm font-medium"
                        title="Apply recommendation"
                      >
                        <Check size={16} />
                        <span className="hidden sm:inline">Apply</span>
                      </button>
                      <button
                        onClick={() => dismiss(rec.id)}
                        className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                        title="Dismiss"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  {rec.status === "APPLIED" && (
                    <span className="px-3 py-2 rounded-lg text-xs font-medium bg-success/15 text-success flex items-center gap-1.5">
                      <Check size={14} /> Applied
                    </span>
                  )}
                  {rec.status === "DISMISSED" && (
                    <span className="px-3 py-2 rounded-lg text-xs font-medium bg-panel text-text-secondary">
                      Dismissed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}