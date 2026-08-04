import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ThemeToggle from "../components/ThemeToggle";

export default function LoginPage() {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/app", { replace: true });
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.session) {
      navigate("/app", { replace: true });
    } else {
      setMessage("Account created! Check your email to confirm, then log in.");
    }
  };

  const handleSubmit = tab === "login" ? handleLogin : handleSignUp;

  const switchTab = (t) => {
    setTab(t);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="login-page">
      <div className="login-top-bar">
        <Link to="/" className="login-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>
        <ThemeToggle />
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-brand-mark">R</div>
          <span className="login-brand-name">ResearchAgent</span>
        </div>

        <h1 className="login-title">
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="login-subtitle">
          {tab === "login"
            ? "Sign in to access your documents and research."
            : "Free to start. No credit card required."}
        </p>

        {/* Tab Toggle */}
        <div className="login-tabs" role="tablist" aria-label="Authentication mode">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`login-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
            type="button"
          >
            Log in
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            className={`login-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => switchTab("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="auth-email">
              Email address
            </label>
            <input
              id="auth-email"
              className="login-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="login-input"
              type="password"
              placeholder={tab === "signup" ? "Minimum 6 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              disabled={loading}
              minLength={tab === "signup" ? 6 : undefined}
            />
          </div>

          {error && (
            <div className="login-alert login-alert-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          {message && (
            <div className="login-alert login-alert-success" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {message}
            </div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading || !email || !password}
            id="auth-submit-btn"
          >
            {loading
              ? "Please wait…"
              : tab === "login"
                ? "Sign in →"
                : "Create account →"}
          </button>
        </form>

        <p className="login-switch">
          {tab === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button className="login-switch-link" onClick={() => switchTab("signup")} type="button">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="login-switch-link" onClick={() => switchTab("login")} type="button">
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
