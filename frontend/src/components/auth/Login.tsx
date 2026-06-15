import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import api from "../../lib/api";
import { ArrowRight, Sparkles, Zap, LayoutDashboard, BarChart3 } from "lucide-react";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, { email, password });
      setAuth(res.data.token, res.data.user);
    } catch (err: any) {
      alert(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@valueai.io");
    setPassword("demo1234");
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-[#f8fafc] font-[Sora,sans-serif] p-4 relative overflow-hidden selection:bg-[#6366f1]/30 selection:text-white">
      {/* ========== RICH BACKGROUND ========== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(#334155 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Vignette: darker edges, brighter center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_70%)]" />

        {/* Floating gradient orbs */}
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-[#6366f1]/[0.07] rounded-full blur-[120px] animate-float" />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#22d3ee]/[0.06] rounded-full blur-[100px] animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-[#818cf8]/[0.05] rounded-full blur-[80px] animate-float"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute top-[10%] left-[20%] w-[250px] h-[250px] bg-[#4f46e5]/[0.06] rounded-full blur-[90px] animate-float"
          style={{ animationDelay: "6s" }}
        />

        {/* Slow aurora sweep */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-30 animate-[spin_60s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(99,102,241,0.03) 60deg, transparent 120deg, rgba(34,211,238,0.02) 180deg, transparent 240deg, rgba(99,102,241,0.03) 300deg, transparent 360deg)",
          }}
        />
      </div>

      {/* ========== TOP NAVIGATION ========== */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <a
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-shadow duration-300">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:inline">
            ValueAI
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-3">
          <a
            href="/audit"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.03] transition-all duration-200"
          >
            <BarChart3 size={16} className="text-[#6366f1]" />
            <span className="hidden sm:inline">AI Spend Audit</span>
          </a>
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.03] transition-all duration-200"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Home</span>
          </a>
        </div>
      </nav>

      {/* ========== MAIN CARD ========== */}
      <div
        className={`w-full max-w-md relative z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Logo lockup */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#6366f1] rounded-xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.45)] transition-shadow duration-500">
            <Sparkles className="text-white" size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">ValueAI</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 text-[11px] font-semibold text-[#818cf8] uppercase tracking-wider">
            <LayoutDashboard size={12} />
            Dashboard
          </div>
          <p className="text-[#94a3b8] text-sm font-medium mt-3">
            Full-stack AI Infrastructure Analysis
          </p>
        </div>

        {/* Glass panel */}
        <div className="bg-[#0f172a]/70 backdrop-blur-2xl border border-[#334155] rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Toggle tabs */}
          <div className="flex p-1 bg-[#020617] rounded-xl border border-[#334155] mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isLogin
                  ? "bg-[#1e293b] text-white shadow-sm border border-[#334155]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                !isLogin
                  ? "bg-[#1e293b] text-white shadow-sm border border-[#334155]"
                  : "text-[#64748b] hover:text-[#94a3b8]"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-[#020617] border border-[#334155] rounded-xl text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 transition-all duration-300 hover:border-[#475569]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#020617] border border-[#334155] rounded-xl text-[#f8fafc] placeholder-[#475569] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30 transition-all duration-300 hover:border-[#475569]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  {isLogin ? "Sign In to Dashboard" : "Create Free Account"}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform duration-300"
                  />
                </>
              )}
            </button>
          </form>

          {/* Demo account quick-fill */}
          <div className="mt-6">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#334155]" />
              <span className="flex-shrink-0 mx-4 text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                Or try demo
              </span>
              <div className="flex-grow border-t border-[#334155]" />
            </div>

            <button
              onClick={fillDemo}
              type="button"
              className="mt-3 w-full py-3 border border-[#334155] hover:border-[#475569] bg-[#020617]/50 hover:bg-[#1e293b]/50 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Zap
                size={16}
                className="text-[#6366f1] group-hover:scale-110 transition-transform duration-300"
              />
              <span>Use Demo Account</span>
              <span className="ml-1 text-[10px] text-[#475569] font-normal">
                demo@valueai.io / demo1234
              </span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#334155]/60 text-center">
            <p className="text-sm text-[#64748b]">
              {isLogin ? "New to ValueAI? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#6366f1] hover:text-[#818cf8] font-semibold transition-colors"
              >
                {isLogin ? "Get started free" : "Sign in instead"}
              </button>
            </p>
          </div>
        </div>

        {/* Footer trust signals */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-[#475569] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SOC 2 Aligned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AES-256 Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Read-Only Keys
          </span>
        </div>
      </div>
    </div>
  );
}