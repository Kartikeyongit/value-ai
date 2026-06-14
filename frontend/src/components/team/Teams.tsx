import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Users, Plus, DollarSign, Hash } from "lucide-react";

function safeNum(v: any): number {
  if (typeof v === "number" && !isNaN(v) && isFinite(v)) return v;
  if (typeof v === "string") { const n = parseFloat(v); return !isNaN(n) && isFinite(n) ? n : 0; }
  if (v && typeof v === "object" && "toString" in v) { const n = parseFloat(v.toString()); return !isNaN(n) && isFinite(n) ? n : 0; }
  return 0;
}

export function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [spend, setSpend] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  useEffect(() => {
    Promise.all([api.get("/teams"), api.get("/teams/spend?days=30")]).then(([tRes, sRes]) => {
      setTeams(Array.isArray(tRes.data) ? tRes.data : []);
      setSpend(Array.isArray(sRes.data) ? sRes.data : []);
    });
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/teams", { name, color });
    setTeams([...teams, res.data]);
    setShowForm(false);
    setName("");
  };

  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-text-secondary mt-1">Allocate and track spend by team</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover flex items-center gap-2">
          <Plus size={16} /> New Team
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="glass-panel p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Team Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary" required />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Color</label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-lg ${color === c ? "ring-2 ring-white" : ""}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover">Create Team</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => {
          const teamSpend = spend.find((s) => s.team_id === team.id);
          return (
            <div key={team.id} className="glass-panel p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: team.color + "20" }}>
                  <Users size={20} style={{ color: team.color }} />
                </div>
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="text-xs text-text-secondary">{team.projects?.length || 0} projects</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary flex items-center gap-1"><DollarSign size={14} /> 30-day spend</span>
                  <span className="font-medium">${safeNum(teamSpend?.total_cost).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary flex items-center gap-1"><Hash size={14} /> Requests</span>
                  <span className="font-medium">{safeNum(teamSpend?.request_count).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(safeNum(teamSpend?.total_cost) / 1000 * 100, 100)}%`, backgroundColor: team.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}