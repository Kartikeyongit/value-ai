import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { MetricCard } from "./MetricCard";
import { UsageChart } from "./UsageChart";
import { ProviderBreakdown } from "./ProviderBreakdown";
import { TopRecommendations } from "./TopRecommendations";
import { DollarSign, Activity, Clock, TrendingUp, AlertTriangle } from "lucide-react";

function safeNum(v: any): number {
  if (typeof v === "number" && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === "string") { const n = parseFloat(v); return !isNaN(n) && isFinite(n) ? n : 0; }
  if (v && typeof v === "object" && "toString" in v) { const n = parseFloat(v.toString()); return !isNaN(n) && isFinite(n) ? n : 0; }
  return 0;
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get("/analytics/dashboard?days=30")
      .then((res) => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message || "Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <p className="text-lg">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) {
    return <div className="flex items-center justify-center h-96 text-gray-400">No data available</div>;
  }

  const headline = metrics.headline || {};
  const providers = Array.isArray(metrics.providers) ? metrics.providers : [];
  const dailyTrend = Array.isArray(metrics.dailyTrend) ? metrics.dailyTrend : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time AI infrastructure overview</p>
      </div>

      {/* Metric Cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Burn"
          value={`$${safeNum(headline.monthlyBurn).toFixed(2)}`}
          change={safeNum(headline.burnChange)}
          icon={DollarSign}
          accent
        />
        <MetricCard
          title="Total Tokens"
          value={safeNum(headline.totalTokens).toLocaleString()}
          change={null}
          icon={Activity}
        />
        <MetricCard
          title="Avg Latency"
          value={`${Math.round(safeNum(headline.avgLatency))}ms`}
          change={null}
          icon={Clock}
        />
        <MetricCard
          title="Requests"
          value={safeNum(headline.requestCount).toLocaleString()}
          change={null}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-panel p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Usage Trend (30 Days)</h3>
          <UsageChart data={dailyTrend} />
        </div>
        <div className="glass-panel p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Provider Breakdown</h3>
          <ProviderBreakdown data={providers} />
        </div>
      </div>

      <TopRecommendations />
    </div>
  );
}