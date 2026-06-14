import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

function safeData(data: any[]): any[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((d) => d != null && typeof d === "object")
    .map((d) => {
      const cost = typeof d.cost === "number" && !isNaN(d.cost) && isFinite(d.cost)
        ? d.cost
        : typeof d.cost === "string"
        ? parseFloat(d.cost) || 0
        : 0;
      const date = d.date || d.period || "";
      return { date, cost };
    })
    .filter((d) => d.cost > 0 || d.date);
}

export function UsageChart({ data }: { data: any[] }) {
  const cleanData = safeData(data);

  if (cleanData.length === 0) {
    return (
      <div className="h-64 md:h-80 flex items-center justify-center text-gray-400">
        No usage trend data available
      </div>
    );
  }

  const formatted = cleanData.map((d) => ({
    date: d.date,
    cost: Number(d.cost.toFixed(2)),
  }));

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v ? String(v).slice(0, 6) : "")}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            width={55}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={LABEL_STYLE}
            itemStyle={ITEM_STYLE}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Cost"]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#costGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}