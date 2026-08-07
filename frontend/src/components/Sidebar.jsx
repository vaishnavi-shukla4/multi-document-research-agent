import React, { useRef } from "react";
import ThemeToggle from "./ThemeToggle";

const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const CompareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ConflictIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const TrendsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const RemoveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

export default function Sidebar({
  documents,
  conversations = [],
  activeConversationId,
  onUpload,
  onRemove,
  onCompare,
  onContradictions,
  onTrends,
  onLogout,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  uploading,
  loading,
}) {
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState(null);

  const handleFiles = (e) => {
    const files = e.target.files;
    if (files.length) onUpload(Array.from(files));
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      // Filter for PDF only
      const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (pdfFiles.length) onUpload(pdfFiles);
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-identity">
          <div className="sidebar-brand-mark">R</div>
          <span className="sidebar-brand-name">ResearchAgent</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Documents */}
      <div 
        className={`sidebar-section ${isDragging ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">Documents</span>
          {documents.length > 0 && (
            <span className="sidebar-doc-count">{documents.length}</span>
          )}
        </div>

        <div className="doc-list">
          {documents.length === 0 ? (
            <div className="doc-empty">
              <p>No documents yet.</p>
              <p>Upload PDFs to begin.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.name} className="doc-item">
                <div className="doc-icon">
                  <FileIcon />
                </div>
                <div className="doc-info">
                  <div className="doc-name" title={doc.name}>{doc.name}</div>
                  <div className="doc-meta">
                    {doc.num_pages} {doc.num_pages === 1 ? 'page' : 'pages'} · {doc.num_chunks} chunks
                  </div>
                </div>
                <button
                  className="doc-remove"
                  onClick={() => onRemove(doc.name)}
                  title={`Remove ${doc.name}`}
                  aria-label={`Remove ${doc.name}`}
                >
                  <RemoveIcon />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          className={`upload-btn ${uploading ? "uploading" : ""}`}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-busy={uploading}
        >
          {uploading ? (
            <>
              <span className="upload-spinner" aria-hidden="true" />
              Processing…
            </>
          ) : (
            <>
              <UploadIcon />
              {isDragging ? "Drop PDFs here" : "Add documents"}
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          multiple
          hidden
          onChange={handleFiles}
          aria-hidden="true"
        />
      </div>

      {/* Conversations */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">Conversations</span>
          <button 
            className="new-chat-btn" 
            onClick={onNewConversation}
            title="New Conversation"
          >
            + New
          </button>
        </div>
        <div className="doc-list">
          {conversations.length === 0 ? (
            <div className="doc-empty">
              <p>No conversations.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              if (deleteConfirmId === conv.id) {
                return (
                  <div key={conv.id} className="doc-item delete-confirm-item">
                    <div className="delete-confirm-content">
                      <div className="delete-confirm-title">Delete conversation?</div>
                      <div className="delete-confirm-text">This conversation and its messages will be permanently deleted.</div>
                      <div className="delete-confirm-actions">
                        <button type="button" className="confirm-btn cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                        <button
                          type="button"
                          className="confirm-btn delete"
                          onClick={async () => {
                            try {
                              await onDeleteConversation(conv.id);
                              setDeleteConfirmId(null);
                            } catch (err) {
                              console.error("Delete conversation action failed", {
                                conversationId: conv.id,
                                error: err,
                              });
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div 
                  key={conv.id} 
                  className={`doc-item conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="doc-icon">
                    <ChatIcon />
                  </div>
                  <div className="doc-info">
                    <div className="doc-name" title={conv.title}>{conv.title}</div>
                  </div>
                  <button
                    className="doc-remove"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(conv.id);
                    }}
                    title={`Delete ${conv.title}`}
                    aria-label={`Delete ${conv.title}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Analysis */}
      <div className="sidebar-section sidebar-analysis">
        <div className="sidebar-section-label">Analysis</div>
        <div className="analysis-actions">
          <button
            className="action-btn compare"
            onClick={onCompare}
            disabled={documents.length < 2 || loading}
            title={documents.length < 2 ? "Upload at least 2 documents to compare" : "Compare documents"}
          >
            <CompareIcon />
            <span>Compare documents</span>
          </button>
          <button
            className="action-btn contradict"
            onClick={onContradictions}
            disabled={documents.length < 2 || loading}
            title={documents.length < 2 ? "Upload at least 2 documents" : "Find contradictions"}
          >
            <ConflictIcon />
            <span>Find contradictions</span>
          </button>
          <button
            className="action-btn trends"
            onClick={onTrends}
            disabled={documents.length < 1 || loading}
            title={documents.length < 1 ? "Upload a document first" : "Summarize trends"}
          >
            <TrendsIcon />
            <span>Summarize trends</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="action-btn logout"
          onClick={onLogout}
          id="logout-btn"
        >
          <LogoutIcon />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
