export default function CitationPanel({ citations }) {
  return (
    <aside className="citation-panel" aria-label="Sources">
      <div className="citation-header">
        <h2>Sources</h2>
        {citations && citations.length > 0 && (
          <span className="citation-count">{citations.length}</span>
        )}
      </div>

      <div className="citation-list">
        {(!citations || citations.length === 0) ? (
          <div className="citation-empty">
            <div className="citation-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <p>Sources appear here after you query your documents.</p>
          </div>
        ) : (
          citations.map((c, i) => (
            <div key={i} className="citation-item">
              <div className="citation-source">
                <span className="citation-num">{i + 1}</span>
                <div className="citation-meta">
                  <span className="citation-doc-name">{c.doc_name}</span>
                  {c.page_number && (
                    <span className="citation-page">p. {c.page_number}</span>
                  )}
                </div>
              </div>
              {c.snippet && (
                <div className="citation-snippet">"{c.snippet}"</div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
