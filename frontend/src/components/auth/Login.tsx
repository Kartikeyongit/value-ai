import { useState } from "react";
import { useAuthStore } from "../../store/auth";
import api from "../../lib/api";
import { Zap } from "lucide-react";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, { email, password });
      setAuth(res.data.token, res.data.user);
    } catch (err: any) {
      alert(err.response?.data?.error || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold">ValueAI</h1>
          <p className="text-text-secondary mt-2">AI Infrastructure Cost Optimization</p>
        </div>
        <div className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-accent hover:underline">{isLogin ? "Sign Up" : "Sign In"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}