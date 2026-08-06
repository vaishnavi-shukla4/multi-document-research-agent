import { useState } from "react";

/* ── Icon helpers ──────────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ── Main component ─────────────────────────────────────────────── */
export default function QueryPanel({
  response,
  responseType,
  loading,
  error,
  onSubmitQuery,
  detailMode,
  onToggleMode,
  hasDocuments,
  conversationMessages = [],
}) {
  const [question, setQuestion] = useState("");
  const [showWhy, setShowWhy] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmitQuery(question.trim());
    }
  };

  return (
    <main className="query-panel">
      {conversationMessages.length > 0 && (
        <div className="response-card" role="region" aria-label="Conversation history" style={{ marginBottom: "16px" }}>
          <div className="response-label">Conversation</div>
          <div className="response-answer" style={{ display: "grid", gap: "12px" }}>
            {conversationMessages.slice(-4).map((message, index) => (
              <div
                key={message.id || index}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "4px" }}>
                  {message.role}
                </div>
                <div style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="query-input-area">
        <form className="query-form" onSubmit={handleSubmit}>
          <textarea
            className="query-input"
            placeholder="Ask a question across all your documents…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (question.trim()) handleSubmit(e);
              }
            }}
          />
          <button
            className="query-submit"
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Submit question"
          >
            {loading ? <span className="query-spinner" aria-hidden="true" /> : <SendIcon />}
          </button>
        </form>

        <div className="query-controls">
          <span className="query-mode-label">Response detail</span>
          <div className="mode-segmented" role="group" aria-label="Response detail level">
            <button
              className={`mode-option ${detailMode === "simple" ? "active" : ""}`}
              onClick={() => detailMode !== "simple" && onToggleMode()}
              type="button"
              aria-pressed={detailMode === "simple"}
            >
              Concise
            </button>
            <button
              className={`mode-option ${detailMode === "detailed" ? "active" : ""}`}
              onClick={() => detailMode !== "detailed" && onToggleMode()}
              type="button"
              aria-pressed={detailMode === "detailed"}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Response Area */}
      <div className="response-area">
        {loading && (
          <div className="loading">
            <div className="loading-dots" aria-hidden="true">
              <span/><span/><span/>
            </div>
            <div className="loading-text">
              {responseType === "query" && "Searching documents and composing an answer…"}
              {responseType === "compare" && "Comparing documents across key topics…"}
              {responseType === "contradictions" && "Scanning for conflicting claims…"}
              {responseType === "trends" && "Identifying recurring themes and patterns…"}
              {!responseType && "Processing…"}
            </div>
          </div>
        )}

        {error && (
          <div className="error-msg" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && !response && (
          <div className="empty-state">
            {!hasDocuments ? (
              <>
                <div className="empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <p className="empty-title">Start by uploading documents</p>
                <p className="empty-sub">Upload PDF files using the sidebar, then ask questions across your collection.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <p className="empty-title">Ask a question</p>
                <p className="empty-sub">Type a question above, or use the analysis tools in the sidebar to compare documents, find contradictions, or discover trends.</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && response && responseType === "query" && (
          <QueryResponse response={response} showWhy={showWhy} setShowWhy={setShowWhy} />
        )}
        {!loading && !error && response && responseType === "compare" && (
          <CompareResponse response={response} />
        )}
        {!loading && !error && response && responseType === "contradictions" && (
          <ContradictionResponse response={response} />
        )}
        {!loading && !error && response && responseType === "trends" && (
          <TrendsResponse response={response} />
        )}
      </div>
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function QueryResponse({ response, showWhy, setShowWhy }) {
  const score = response.confidence_score ?? 0;
  const pct = Math.round(score * 100);
  const level = score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";

  return (
    <div className="response-card" role="region" aria-label="Answer">
      <div className="response-label">Answer</div>
      <div className="response-answer">{response.answer}</div>

      {/* Confidence */}
      <div className="confidence-bar-wrapper">
        <div className="confidence-label">
          <span>Confidence</span>
          <span className={`confidence-pct confidence-pct-${level}`}>{pct}%</span>
        </div>
        <div className="confidence-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className={`confidence-fill ${level}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Why this answer */}
      {response.why_this_answer && (
        <div className="why-section">
          <button
            className="why-toggle"
            onClick={() => setShowWhy(!showWhy)}
            aria-expanded={showWhy}
            type="button"
          >
            <ChevronIcon open={showWhy} />
            Why this answer?
          </button>
          {showWhy && (
            <div className="why-content" role="region">
              {response.why_this_answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareResponse({ response }) {
  const comp = response.comparison || response;
  const topics = comp.key_ideas || [];
  const similarities = comp.similarities || [];
  const differences = comp.differences || [];

  return (
    <div className="response-card" role="region" aria-label="Document comparison">
      <div className="response-label">Document Comparison</div>

      {comp.summary && (
        <div className="response-answer" style={{ marginBottom: '20px' }}>{comp.summary}</div>
      )}

      {topics.length > 0 && (
        <div className="comparison-topics">
          {topics.map((t, i) => (
            <div key={i} className="topic-block">
              <div className="topic-name">{t.topic}</div>
              {(t.documents || []).map((d, j) => (
                <div key={j} className="topic-doc">
                  <div className="topic-doc-name">{d.doc_name}</div>
                  <div className="topic-doc-pos">{d.position}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {similarities.length > 0 && (
        <div className="sim-diff-section">
          <div className="sim-diff-label sim">Similarities</div>
          <ul className="sim-diff-list sim">
            {similarities.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {differences.length > 0 && (
        <div className="sim-diff-section">
          <div className="sim-diff-label diff">Differences</div>
          <ul className="sim-diff-list diff">
            {differences.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContradictionResponse({ response }) {
  const contradictions = response.contradictions || [];

  return (
    <div className="response-card" role="region" aria-label="Contradictions detected">
      <div className="response-label">Contradictions</div>
      {response.summary && (
        <div className="response-answer" style={{ marginBottom: '20px' }}>{response.summary}</div>
      )}

      {contradictions.length === 0 ? (
        <p className="no-results-msg">No contradictions detected between the documents.</p>
      ) : (
        <div className="contradictions-list">
          {contradictions.map((c, i) => (
            <div key={i} className="contradiction-card">
              <div className="contradiction-topic">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {c.topic}
              </div>
              <div className="contradiction-body">
                <div className="statement-col">
                  <div className="statement-label a">Document A</div>
                  <div className="statement-doc">{c.statement_a?.doc_name}</div>
                  <div className="statement-text">"{c.statement_a?.snippet || c.statement_a?.statement}"</div>
                </div>
                <div className="statement-divider" aria-hidden="true">↕</div>
                <div className="statement-col">
                  <div className="statement-label b">Document B</div>
                  <div className="statement-doc">{c.statement_b?.doc_name}</div>
                  <div className="statement-text">"{c.statement_b?.snippet || c.statement_b?.statement}"</div>
                </div>
              </div>
              {c.explanation && (
                <div className="contradiction-explanation">
                  <strong>Analysis: </strong>{c.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendsResponse({ response }) {
  const trends = response.trends || [];

  return (
    <div className="response-card" role="region" aria-label="Trend analysis">
      <div className="response-label">Trends &amp; Themes</div>
      {response.unified_summary && (
        <div className="response-answer" style={{ marginBottom: '20px' }}>{response.unified_summary}</div>
      )}

      <div className="trends-list">
        {trends.map((t, i) => (
          <div key={i} className="trend-card">
            <div className="trend-header">
              <span className="trend-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="trend-theme">{t.theme}</div>
            </div>
            <div className="trend-desc">{t.description}</div>
            {(t.supporting_documents || []).length > 0 && (
              <div className="trend-docs">
                {(t.supporting_documents || []).map((d, j) => (
                  <span key={j} className="trend-doc-tag">{d}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
