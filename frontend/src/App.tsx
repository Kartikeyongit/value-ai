import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Providers } from "./components/providers/Providers";
import { Analytics } from "./components/analytics/Analytics";
import { Recommendations } from "./components/analytics/Recommendations";
import { Alerts } from "./components/alerts/Alerts";
import { Teams } from "./components/team/Teams";
import { Login } from "./components/auth/Login";
import { useAuthStore } from "./store/auth";

function App() {
  const { token, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/teams" element={<Teams />} />
      </Routes>
    </Layout>
  );
}

export default App;
