import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Bell, Plus, Trash2 } from "lucide-react";

export function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", alertType: "BUDGET_THRESHOLD", thresholdValue: 1000, thresholdUnit: "USD", comparison: "gt", channels: ["email"] });

  useEffect(() => {
    api.get("/alerts").then((res) => setAlerts(Array.isArray(res.data) ? res.data : []));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post("/alerts", form);
    setAlerts([res.data, ...alerts]);
    setShowForm(false);
    setForm({ name: "", alertType: "BUDGET_THRESHOLD", thresholdValue: 1000, thresholdUnit: "USD", comparison: "gt", channels: ["email"] });
  };

  const remove = async (id: string) => {
    await api.delete(`/alerts/${id}`);
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-text-secondary mt-1">Configure smart spending alerts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover flex items-center gap-2">
          <Plus size={16} /> New Alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="glass-panel p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary" required />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Type</label>
              <select value={form.alertType} onChange={(e) => setForm({ ...form, alertType: e.target.value })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary">
                <option value="BUDGET_THRESHOLD">Budget Threshold</option>
                <option value="SPIKE_DETECTION">Spike Detection</option>
                <option value="ANOMALY_DETECTION">Anomaly Detection</option>
                <option value="UNUSED_RESOURCE">Unused Resource</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Threshold ($)</label>
              <input type="number" value={form.thresholdValue} onChange={(e) => setForm({ ...form, thresholdValue: Number(e.target.value) })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Channels</label>
              <select multiple value={form.channels} onChange={(e) => setForm({ ...form, channels: Array.from(e.target.selectedOptions, (o) => o.value) })} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary">
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover">Create Alert</button>
        </form>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="glass-panel p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="font-medium">{alert.name}</h3>
                <p className="text-sm text-text-secondary">{alert.alertType} - {alert.comparison} ${alert.thresholdValue} {alert.thresholdUnit}</p>
                <div className="flex gap-2 mt-1">
                  {alert.channels.map((c: string) => (
                    <span key={c} className="px-2 py-0.5 rounded text-xs bg-panel text-text-secondary">{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${alert.isActive ? "bg-success/20 text-success" : "bg-panel text-text-secondary"}`}>{alert.isActive ? "Active" : "Paused"}</span>
              <button onClick={() => remove(alert.id)} className="p-2 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}