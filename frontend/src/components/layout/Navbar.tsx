import { useEffect, useState, useRef } from "react";
import { Menu, Bell, Settings, LogOut, User, Check, AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { useAuthStore } from "../../store/auth";

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "alert", title: "Budget threshold exceeded", message: "Monthly spend crossed $8,000", time: "2 min ago", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  { id: 2, type: "savings", title: "New savings opportunity", message: "Switch GPT-4o to GPT-5.4-nano", time: "1 hour ago", icon: TrendingDown, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: 3, type: "spike", title: "Usage spike detected", message: "OpenAI requests up 340%", time: "3 hours ago", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
];

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = (id: number) => {
    setNotifs(notifs.filter((n) => n.id !== id));
  };

  const markAllRead = () => setNotifs([]);

  const initials = user?.firstName?.[0] || user?.email?.[0] || "U";
  const fullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Demo User";

  return (
    <header
      className={`h-14 md:h-16 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 ${
        scrolled ? "bg-[#0f172a]/95" : "bg-[#0f172a]"
      }`}
    >
      <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white p-1">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            <Bell size={18} />
            {notifs.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {notifs.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {notifs.length > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    <Check size={24} className="mx-auto mb-2 text-emerald-500" />
                    All caught up!
                  </div>
                ) : (
                  notifs.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-700/50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <n.icon size={14} className={n.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                      </div>
                      <button
                        onClick={() => markRead(n.id)}
                        className="p-1 rounded hover:bg-slate-700 text-gray-500 hover:text-gray-300 shrink-0"
                        title="Dismiss"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 text-xs font-semibold uppercase">{initials}</span>
            </div>
            <span className="hidden md:block text-sm text-gray-300 font-medium max-w-[120px] truncate">
              {fullName}
            </span>
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || "demo@valueai.io"}</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <User size={16} />
                  Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Settings size={16} />
                  Settings
                </button>
              </div>
              <div className="border-t border-slate-700 py-1">
                <button
                  onClick={() => { logout(); setUserOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}