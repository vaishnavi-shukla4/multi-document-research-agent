import { Link } from "react-router-dom";

const features = [
  {
    icon: "📄",
    title: "Upload Any PDF",
    description:
      "Drag in research papers, reports, and books. The agent extracts, chunks, and embeds every page automatically.",
    color: "var(--accent)",
    glow: "var(--accent-glow)",
  },
  {
    icon: "💬",
    title: "Ask Questions",
    description:
      "Query across all your documents simultaneously. Get cited, evidence-backed answers with confidence scores.",
    color: "var(--cyan)",
    glow: "var(--cyan-glow)",
  },
  {
    icon: "🔍",
    title: "Compare & Contrast",
    description:
      "Instantly surface similarities and differences between multiple documents on the same topic.",
    color: "var(--purple)",
    glow: "var(--purple-glow)",
  },
  {
    icon: "📊",
    title: "Discover Trends",
    description:
      "Identify recurring themes and detect contradictions across your entire document corpus.",
    color: "var(--green)",
    glow: "var(--green-glow)",
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon">🔬</span>
          <span className="landing-logo-text">ResearchAgent</span>
        </div>
        <Link to="/login" className="landing-nav-cta">
          Sign in →
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">Powered by Gemini + LLaMA 3.3</div>
        <h1 className="hero-title">
          Your AI research
          <br />
          <span className="hero-title-gradient">co-pilot</span>
        </h1>
        <p className="hero-subtitle">
          Upload PDFs. Ask questions. Discover contradictions, comparisons, and
          trends — across all your documents at once, with full citations.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="hero-cta-primary">
            Get started free
          </Link>
          <a
            href="https://github.com"
            className="hero-cta-secondary"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>

        {/* Decorative glow blobs */}
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="features">
        <div className="features-label">What it does</div>
        <h2 className="features-title">Everything you need for deep research</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ "--card-color": f.color, "--card-glow": f.glow }}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="landing-cta-banner">
        <h2 className="cta-banner-title">Ready to dive in?</h2>
        <p className="cta-banner-sub">
          Create a free account and start analysing your documents in minutes.
        </p>
        <Link to="/login" className="hero-cta-primary">
          Start researching →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <span>© 2025 ResearchAgent</span>
        <Link to="/login" style={{ color: "var(--text-muted)" }}>
          Sign in
        </Link>
      </footer>
    </div>
  );
}
