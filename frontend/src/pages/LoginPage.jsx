import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

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
      // onAuthStateChange in App.jsx will update session → <Navigate to="/app" />
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
      // Email confirmation disabled — logged in immediately
      navigate("/app", { replace: true });
    } else {
      // Email confirmation enabled — prompt user to check inbox
      setMessage("Account created! Check your email to confirm, then log in.");
    }
  };

  const handleSubmit = tab === "login" ? handleLogin : handleSignUp;

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div className="hero-blob hero-blob-1" aria-hidden="true" />
      <div className="hero-blob hero-blob-2" aria-hidden="true" />

      <div className="login-card">
        {/* Logo */}
        <Link to="/" className="login-logo">
          <span className="landing-logo-icon">🔬</span>
          <span className="landing-logo-text">ResearchAgent</span>
        </Link>

        <h1 className="login-title">
          {tab === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="login-subtitle">
          {tab === "login"
            ? "Sign in to access your documents"
            : "Get started for free — no credit card needed"}
        </p>

        {/* Tab Toggle */}
        <div className="login-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={`login-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(null); setMessage(null); }}
            type="button"
          >
            Log in
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            className={`login-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(null); setMessage(null); }}
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
              ⚠️ {error}
            </div>
          )}
          {message && (
            <div className="login-alert login-alert-success" role="status">
              ✅ {message}
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
              <button
                className="login-switch-link"
                onClick={() => { setTab("signup"); setError(null); setMessage(null); }}
                type="button"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="login-switch-link"
                onClick={() => { setTab("login"); setError(null); setMessage(null); }}
                type="button"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
