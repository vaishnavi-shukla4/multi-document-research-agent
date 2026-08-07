/**
 * ProtectedApp — the full research agent UI.
 * Original logic preserved exactly. Only layout/structure updated.
 * The app-header has been removed — identity lives in the Sidebar.
 */

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import QueryPanel from "../components/QueryPanel";
import CitationPanel from "../components/CitationPanel";
import {
  uploadDocuments,
  getDocuments,
  deleteDocument,
  createConversation,
  getConversations,
  deleteConversation,
  getConversationMessages,
  sendConversationMessage,
  compareDocuments,
  findContradictions,
  summarizeTrends,
} from "../api";

const CONVERSATION_STORAGE_KEY = "ra-conversation-id";

export default function ProtectedApp({ onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseType, setResponseType] = useState(null);
  const [citations, setCitations] = useState([]);
  const [error, setError] = useState(null);
  const [detailMode, setDetailMode] = useState("detailed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationMessages, setConversationMessages] = useState([]);

  const persistConversationId = useCallback((value) => {
    setConversationId(value);
    try {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, value);
    } catch {
      // Ignore storage failures
    }
  }, []);

  const loadConversationMessages = useCallback(async (id) => {
    const data = await getConversationMessages(id);
    setConversationMessages(data.messages || []);
  }, []);

  const fetchConversationsList = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
      return data.conversations || [];
    } catch {
      // API might be down
      return null;
    }
  }, []);

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;

    let storedId = null;
    try {
      storedId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    } catch {
      storedId = null;
    }

    if (storedId) {
      try {
        await loadConversationMessages(storedId);
        persistConversationId(storedId);
        return storedId;
      } catch {
        try { localStorage.removeItem(CONVERSATION_STORAGE_KEY); } catch { /* ignore */ }
      }
    }

    const created = await createConversation();
    const newConversationId = created.conversation_id;
    persistConversationId(newConversationId);
    setConversationMessages([]);
    await fetchConversationsList();
    return newConversationId;
  }, [conversationId, loadConversationMessages, persistConversationId, fetchConversationsList]);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch {
      // Backend might not be running yet
    }
  }, []);

  useEffect(() => { 
    fetchDocs(); 
    fetchConversationsList();
  }, [fetchDocs, fetchConversationsList]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const activeConversationId = await ensureConversation();
        if (!cancelled && activeConversationId) {
          await loadConversationMessages(activeConversationId);
        }
      } catch {
        if (!cancelled) setConversationMessages([]);
      }
    })();
    return () => { cancelled = true; };
  }, [ensureConversation, loadConversationMessages]);

  const handleSelectConversation = async (id) => {
    persistConversationId(id);
    setResponse(null);
    setResponseType(null);
    setCitations([]);
    try {
      await loadConversationMessages(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNewConversation = async () => {
    try {
      const created = await createConversation();
      persistConversationId(created.conversation_id);
      setConversationMessages([]);
      setResponse(null);
      setResponseType(null);
      setCitations([]);
      await fetchConversationsList();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConversation = async (idToDelete) => {
    setError(null);
    try {
      await deleteConversation(idToDelete);

      const refreshedConversations = await fetchConversationsList();
      const remainingConversations = Array.isArray(refreshedConversations)
        ? refreshedConversations
        : conversations.filter((c) => c.id !== idToDelete);

      if (idToDelete === conversationId) {
        if (remainingConversations.length > 0) {
          const nextConversation = remainingConversations[0];
          persistConversationId(nextConversation.id);
          setResponse(null);
          setResponseType(null);
          setCitations([]);
          await loadConversationMessages(nextConversation.id);
        } else {
          try { localStorage.removeItem(CONVERSATION_STORAGE_KEY); } catch { /* ignore */ }
          setConversationId(null);
          setConversationMessages([]);
          setResponse(null);
          setResponseType(null);
          setCitations([]);
        }
      } else {
        setConversations(remainingConversations);
      }
    } catch (err) {
      console.error("Failed to delete conversation", {
        conversationId: idToDelete,
        error: err,
      });
      setError(err instanceof Error ? err.message : "Conversation deletion failed");
      throw err;
    }
  };

  const handleUpload = async (files) => {
    setUploading(true);
    setError(null);
    try {
      await uploadDocuments(files);
      await fetchDocs();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (docName) => {
    try {
      await deleteDocument(docName);
      await fetchDocs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuery = async (question) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseType("query");
    setCitations([]);
    setSidebarOpen(false);
    try {
      const activeConversationId = await ensureConversation();
      const data = await sendConversationMessage(activeConversationId, question, detailMode);
      setResponse(data);
      setCitations(data.citations || []);
      await loadConversationMessages(activeConversationId);
      await fetchConversationsList();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseType("compare");
    setCitations([]);
    setSidebarOpen(false);
    try {
      const data = await compareDocuments();
      setResponse(data);
      setCitations(data.citations || (data.comparison?.citations) || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContradictions = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseType("contradictions");
    setCitations([]);
    setSidebarOpen(false);
    try {
      const data = await findContradictions();
      setResponse(data);
      const cit = [];
      (data.contradictions || []).forEach((c) => {
        if (c.statement_a) cit.push({ doc_name: c.statement_a.doc_name, snippet: c.statement_a.snippet || c.statement_a.statement });
        if (c.statement_b) cit.push({ doc_name: c.statement_b.doc_name, snippet: c.statement_b.snippet || c.statement_b.statement });
      });
      setCitations(cit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrends = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseType("trends");
    setCitations([]);
    setSidebarOpen(false);
    try {
      const data = await summarizeTrends();
      setResponse(data);
      setCitations(data.citations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setDetailMode((m) => (m === "simple" ? "detailed" : "simple"));
  };

  return (
    <div className="app">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        documents={documents}
        conversations={conversations}
        activeConversationId={conversationId}
        onUpload={handleUpload}
        onRemove={handleRemove}
        onCompare={handleCompare}
        onContradictions={handleContradictions}
        onTrends={handleTrends}
        onLogout={onLogout}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        uploading={uploading}
        loading={loading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-content">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="mobile-topbar-title">ResearchAgent</span>
        </div>

        <div className="app-body">
          <QueryPanel
            response={response}
            responseType={responseType}
            loading={loading}
            error={error}
            onSubmitQuery={handleQuery}
            detailMode={detailMode}
            onToggleMode={toggleMode}
            hasDocuments={documents.length > 0}
            conversationMessages={conversationMessages}
          />
          <CitationPanel citations={citations} />
        </div>
      </div>
    </div>
  );
}
