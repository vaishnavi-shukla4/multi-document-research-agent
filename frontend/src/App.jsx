import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProtectedApp from "./pages/ProtectedApp";

export default function App() {
  // undefined = still loading; null = logged out; object = logged in
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Show spinner while we determine auth state (avoids flash of wrong page)
  if (session === undefined) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={session ? <Navigate to="/app" replace /> : <LoginPage />}
      />
      <Route
        path="/app"
        element={
          session ? (
            <ProtectedApp onLogout={() => supabase.auth.signOut()} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
