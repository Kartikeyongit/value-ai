import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#f8fafc",
  fontSize: "13px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
};

const LABEL_STYLE = { color: "#f8fafc", fontWeight: 500 };
const ITEM_STYLE = { color: "#f8fafc" };

function safePieData(data: any[]): any[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((d) => d != null && typeof d === "object")
    .map((d, i) => {
      const cost = typeof d.cost === "number" && !isNaN(d.cost) && isFinite(d.cost)
        ? d.cost
        : typeof d.cost === "string"
        ? parseFloat(d.cost) || 0
        : 0;
      return {
        name: d.name || d.providerName || `Provider ${i + 1}`,
        cost: Math.max(0, cost),
        slug: d.slug || d.providerSlug || `p${i}`,
        percentage: typeof d.percentage === "number" && !isNaN(d.percentage) ? d.percentage : 0,
      };
    })
    .filter((d) => d.cost > 0);
}

export function ProviderBreakdown({ data }: { data: any[] }) {
  const cleanData = safePieData(data);

  if (cleanData.length === 0) {
    return (
      <div className="h-56 md:h-64 flex items-center justify-center text-gray-400">
        No provider data available
      </div>
    );
  }

  const total = cleanData.reduce((sum, d) => sum + d.cost, 0);
  const withPct = cleanData.map((d) => ({
    ...d,
    percentage: total > 0 ? ((d.cost / total) * 100).toFixed(1) : "0.0",
  }));

  return (
    <div className="w-full">
      <div className="h-48 md:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withPct}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="cost"
              nameKey="name"
              isAnimationActive={false}
            >
              {withPct.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={LABEL_STYLE}
              itemStyle={ITEM_STYLE}
              formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
        {withPct.slice(0, 5).map((provider, i) => (
          <div key={provider.slug || i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-400 truncate">{provider.name}</span>
            </div>
            <span className="font-medium text-white shrink-0 ml-2">{provider.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}