import { NavLink } from "react-router-dom";
import { LayoutDashboard, Plug, BarChart3, Lightbulb, Bell, Users, LogOut, X } from "lucide-react";
import { useAuthStore } from "../../store/auth";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/providers", icon: Plug, label: "Providers" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/recommendations", icon: Lightbulb, label: "Recommendations" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/teams", icon: Users, label: "Teams" },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logout = useAuthStore((s) => s.logout);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">ValueAI</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 md:p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-gray-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}