import { useEffect, useState, useRef } from "react";
import api from "../../lib/api";
import { Plug, RefreshCw, Key } from "lucide-react";

function RegionDropdown({ regions, value, onChange }: { regions: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#0f172a]/80 border border-border rounded-lg text-sm text-text-primary hover:bg-panel hover:border-slate-600 transition-all w-full"
      >
        <span className="font-medium">{value}</span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-[#0f172a] border border-border rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                r === value
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-text-secondary hover:bg-panel hover:text-text-primary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Providers() {
  const [providers, setProviders] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [region, setRegion] = useState("us-east-1");

  useEffect(() => {
    Promise.all([api.get("/providers"), api.get("/providers/my-connections")])
      .then(([pRes, cRes]) => {
        setProviders(Array.isArray(pRes.data) ? pRes.data : []);
        setConnections(Array.isArray(cRes.data) ? cRes.data : []);
        setLoading(false);
      });
  }, []);

  const connect = async () => {
    if (!selectedProvider || !apiKey) return;
    try {
      await api.post("/providers/connect", {
        providerId: selectedProvider.id,
        credentialType: "API_KEY",
        key: apiKey,
        region,
      });
      setApiKey("");
      setSelectedProvider(null);
      const cRes = await api.get("/providers/my-connections");
      setConnections(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (err: any) {
      alert(err.response?.data?.error || "Connection failed");
    }
  };

  const disconnect = async (id: string) => {
    await api.delete(`/providers/connections/${id}`);
    setConnections(connections.filter((c) => c.id !== id));
  };

  const sync = async (id: string) => {
    await api.post(`/providers/sync/${id}`);
    alert("Sync initiated");
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Providers</h1>
        <p className="text-text-secondary mt-1">Connect and manage AI provider integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const connected = connections.find((c) => c.providerId === provider.id);
          return (
            <div key={provider.id} className="glass-panel p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Plug size={20} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-xs text-text-secondary">{provider.category}</p>
                  </div>
                </div>
                {connected ? (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">Connected</span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-panel text-text-secondary">Not Connected</span>
                )}
              </div>

              {connected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Key size={14} /> Key: ...{connected.keyLastFour}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <RefreshCw size={14} /> Last sync: {connected.lastSyncedAt ? new Date(connected.lastSyncedAt).toLocaleDateString() : "Never"}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => sync(connected.id)} className="flex-1 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors">Sync Now</button>
                    <button onClick={() => disconnect(connected.id)} className="flex-1 py-2 bg-danger/10 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors">Disconnect</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSelectedProvider(provider)} className="w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">Connect</button>
              )}
            </div>
          );
        })}
      </div>

      {selectedProvider && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Connect {selectedProvider.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">API Key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary" placeholder="Enter API key" />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Region</label>
                <RegionDropdown
                  regions={selectedProvider.regions || []}
                  value={region}
                  onChange={setRegion}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={connect} className="flex-1 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover">Connect</button>
                <button onClick={() => { setSelectedProvider(null); setApiKey(""); }} className="flex-1 py-2 bg-panel text-text-primary rounded-lg font-medium hover:bg-border">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}