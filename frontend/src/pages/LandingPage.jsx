import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

/* ── Product preview (hero visual) ─────────────────────────────── */
function ProductPreview() {
  return (
    <div className="product-preview" aria-hidden="true" role="presentation">
      <div className="preview-chrome">
        <div className="preview-chrome-dots">
          <span/><span/><span/>
        </div>
        <div className="preview-chrome-title">ResearchAgent</div>
      </div>
      <div className="preview-body">
        <div className="preview-sidebar">
          <div className="preview-sidebar-label">Documents</div>
          <div className="preview-doc-item preview-doc-active">
            <div className="preview-doc-icon">PDF</div>
            <span>Smith_2023.pdf</span>
          </div>
          <div className="preview-doc-item">
            <div className="preview-doc-icon">PDF</div>
            <span>Jones_2022.pdf</span>
          </div>
          <div className="preview-doc-item">
            <div className="preview-doc-icon">PDF</div>
            <span>Liu_2021.pdf</span>
          </div>
          <div className="preview-sidebar-sep" />
          <div className="preview-sidebar-label">Analysis</div>
          <div className="preview-action-item">Compare docs</div>
          <div className="preview-action-item">Find conflicts</div>
        </div>

        <div className="preview-main">
          <div className="preview-query-box">
            <span className="preview-query-text">What are the key findings on neuroplasticity in adults?</span>
            <span className="preview-query-btn">→</span>
          </div>

          <div className="preview-answer-block">
            <div className="preview-answer-label">Answer</div>
            <div className="preview-answer-body">
              The three studies converge on the finding that adult neuroplasticity is more persistent than classical models suggest, particularly in hippocampal regions associated with spatial memory.
            </div>
            <div className="preview-confidence">
              <span>Confidence</span>
              <div className="preview-confidence-track">
                <div className="preview-confidence-fill" style={{ width: '81%' }} />
              </div>
              <span>81%</span>
            </div>
          </div>

          <div className="preview-sources-block">
            <div className="preview-sources-label">Sources</div>
            <div className="preview-source-row">
              <span className="preview-source-num">1</span>
              <span>Smith_2023.pdf · p. 14</span>
            </div>
            <div className="preview-source-row">
              <span className="preview-source-num">2</span>
              <span>Jones_2022.pdf · p. 8</span>
            </div>
            <div className="preview-source-row">
              <span className="preview-source-num">3</span>
              <span>Liu_2021.pdf · p. 31</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── How It Works ──────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    num: '01',
    title: 'Upload',
    desc: 'Add research papers, reports, or books in PDF format.',
  },
  {
    num: '02',
    title: 'Ask',
    desc: 'Pose natural-language questions across your entire collection.',
  },
  {
    num: '03',
    title: 'Investigate',
    desc: 'Compare documents, surface contradictions, and identify patterns.',
  },
  {
    num: '04',
    title: 'Understand',
    desc: 'Follow citations back to exact passages in the source material.',
  },
];

/* ── Landing Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="landing">

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="l-nav" role="navigation" aria-label="Main navigation">
        <div className="l-nav-inner">
          <Link to="/" className="l-nav-logo" aria-label="ResearchAgent home">
            <div className="l-logo-mark">R</div>
            <span className="l-logo-text">ResearchAgent</span>
          </Link>

          <div className="l-nav-links">
            <a href="#features" className="l-nav-link">Features</a>
            <a href="#how-it-works" className="l-nav-link">How it works</a>
          </div>

          <div className="l-nav-actions">
            <Link to="/login" className="l-nav-signin">Sign in</Link>
            <Link to="/login" className="l-btn-primary l-btn-sm">Get started →</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="l-hero" aria-labelledby="hero-heading">
        <div className="l-hero-copy">
          <div className="l-eyebrow">Multi-document research</div>
          <h1 className="l-hero-title" id="hero-heading">
            Research across documents,<br />
            <em>without losing the evidence.</em>
          </h1>
          <p className="l-hero-desc">
            Ask questions, compare findings, detect contradictions, and trace every answer back to its source — across your entire document collection.
          </p>
          <div className="l-hero-actions">
            <Link to="/login" className="l-btn-primary">Start researching →</Link>
            <a href="#how-it-works" className="l-btn-ghost">See how it works</a>
          </div>
          <div className="l-hero-meta">
            <span>Powered by Gemini + LLaMA 3.3</span>
            <span className="l-meta-sep">·</span>
            <span>Full citation tracking</span>
          </div>
        </div>

        <div className="l-hero-visual">
          <ProductPreview />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="l-features" id="features" aria-labelledby="features-heading">
        <div className="l-section-container">
          <div className="l-section-intro">
            <div className="l-overline">Capabilities</div>
            <h2 className="l-section-title" id="features-heading">
              Every tool a serious researcher needs
            </h2>
          </div>

          {/* Feature 1: Ask — full width with inline preview */}
          <div className="l-feature l-feature-ask">
            <div className="l-feature-copy">
              <div className="l-feature-num">01</div>
              <h3 className="l-feature-title">Ask questions across documents</h3>
              <p className="l-feature-desc">
                Pose any question and get a synthesized answer drawn from your entire collection. Every response includes the exact passages that support it.
              </p>
              <ul className="l-feature-list">
                <li>Answers backed by direct citations</li>
                <li>Confidence scoring on every response</li>
                <li>Concise or detailed response modes</li>
              </ul>
            </div>
            <div className="l-feature-preview l-ask-preview">
              <div className="preview-question-chip">
                "What does the literature say about long-term retention?"
              </div>
              <div className="preview-answer-snippet">
                <div className="preview-label">Answer</div>
                <p>Multiple studies indicate that spaced repetition significantly outperforms massed practice for long-term retention, with effects persisting over 12-month intervals…</p>
                <div className="preview-tags">
                  <span className="preview-source-chip">Smith 2023 · p.14</span>
                  <span className="preview-source-chip">Jones 2022 · p.8</span>
                  <span className="preview-source-chip">Liu 2021 · p.31</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Compare — two column layout */}
          <div className="l-feature l-feature-compare">
            <div className="l-feature-copy">
              <div className="l-feature-num">02</div>
              <h3 className="l-feature-title">Compare across documents</h3>
              <p className="l-feature-desc">
                Surface similarities and differences between documents on any topic. Understand where your sources align and where they diverge.
              </p>
            </div>
            <div className="l-feature-preview l-compare-preview">
              <div className="compare-table">
                <div className="compare-header-row">
                  <div className="compare-cell compare-header-cell compare-corner" />
                  <div className="compare-cell compare-header-cell">Smith (2023)</div>
                  <div className="compare-cell compare-header-cell">Jones (2022)</div>
                </div>
                <div className="compare-row">
                  <div className="compare-cell compare-row-label">Method</div>
                  <div className="compare-cell">Randomized controlled trial</div>
                  <div className="compare-cell">Longitudinal meta-analysis</div>
                </div>
                <div className="compare-row">
                  <div className="compare-cell compare-row-label">Sample</div>
                  <div className="compare-cell">N = 1,200</div>
                  <div className="compare-cell">45 studies reviewed</div>
                </div>
                <div className="compare-row">
                  <div className="compare-cell compare-row-label">Key finding</div>
                  <div className="compare-cell">+23% retention</div>
                  <div className="compare-cell">+18–27% across cohorts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Contradictions */}
          <div className="l-feature l-feature-contradictions">
            <div className="l-feature-copy">
              <div className="l-feature-num">03</div>
              <h3 className="l-feature-title">Detect contradictions</h3>
              <p className="l-feature-desc">
                Automatically identify conflicting claims between documents. Know exactly where your sources disagree and why it matters.
              </p>
            </div>
            <div className="l-feature-preview l-contradict-preview">
              <div className="contradict-topic">Regarding: effect of sleep deprivation on cognition</div>
              <div className="contradict-pair">
                <div className="contradict-col">
                  <div className="contradict-col-label">Paper A</div>
                  <div className="contradict-doc">Walker et al. (2023)</div>
                  <div className="contradict-quote">"No significant cognitive decline was observed after 24 hours of wakefulness."</div>
                </div>
                <div className="contradict-arrow">↕</div>
                <div className="contradict-col">
                  <div className="contradict-col-label">Paper B</div>
                  <div className="contradict-doc">Czeisler et al. (2022)</div>
                  <div className="contradict-quote">"Sustained attention dropped by 40% after 20+ hours without sleep."</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Trends */}
          <div className="l-feature l-feature-trends">
            <div className="l-feature-copy">
              <div className="l-feature-num">04</div>
              <h3 className="l-feature-title">Identify trends and themes</h3>
              <p className="l-feature-desc">
                Discover recurring topics, evolving patterns, and the ideas that connect your documents — even across a large collection.
              </p>
            </div>
            <div className="l-feature-preview l-trends-preview">
              <div className="preview-label" style={{ marginBottom: '12px' }}>Emerging themes across 8 documents</div>
              <div className="trends-tag-grid">
                {['Neuroplasticity','Cognitive Load','Spaced Repetition','Working Memory',
                  'Sleep & Memory','Metacognition','Longitudinal Effects','Effect Size','Meta-analysis'].map(tag => (
                  <span key={tag} className="trends-tag">{tag}</span>
                ))}
              </div>
              <div className="trends-insight">
                <span className="trends-insight-label">Strongest thread:</span>
                <span>Memory consolidation appears across 6 of 8 documents, spanning lab studies and clinical research.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="l-how" id="how-it-works" aria-labelledby="how-heading">
        <div className="l-section-container">
          <div className="l-section-intro l-how-intro">
            <div className="l-overline">Workflow</div>
            <h2 className="l-section-title" id="how-heading">From documents to insight in four steps</h2>
          </div>

          <div className="l-how-steps">
            {HOW_STEPS.map((step, i) => (
              <div key={step.num} className="l-how-step">
                <div className="l-step-num">{step.num}</div>
                {i < HOW_STEPS.length - 1 && (
                  <div className="l-step-connector" aria-hidden="true" />
                )}
                <h3 className="l-step-title">{step.title}</h3>
                <p className="l-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="l-cta" aria-labelledby="cta-heading">
        <div className="l-cta-inner">
          <h2 className="l-cta-title" id="cta-heading">
            Your documents already<br />contain the answer.
          </h2>
          <p className="l-cta-sub">Make them searchable.</p>
          <Link to="/login" className="l-btn-primary l-btn-lg">
            Start researching →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="l-footer" role="contentinfo">
        <div className="l-footer-inner">
          <div className="l-footer-brand">
            <div className="l-logo-mark l-logo-mark-sm">R</div>
            <span>ResearchAgent</span>
          </div>
          <span className="l-footer-copy">© 2025 ResearchAgent</span>
          <div className="l-footer-links">
            <Link to="/login" className="l-footer-link">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
