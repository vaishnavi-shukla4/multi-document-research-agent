/**
 * ProtectedApp — the full research agent UI.
 * Original App.jsx logic moved here so App.jsx can be a thin routing shell.
 * The only addition is the onLogout prop wired to the Sidebar logout button.
 */

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import QueryPanel from "../components/QueryPanel";
import CitationPanel from "../components/CitationPanel";
import {
  uploadDocuments,
  getDocuments,
  deleteDocument,
  queryDocuments,
  compareDocuments,
  findContradictions,
  summarizeTrends,
} from "../api";

export default function ProtectedApp({ onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseType, setResponseType] = useState(null);
  const [citations, setCitations] = useState([]);
  const [error, setError] = useState(null);
  const [detailMode, setDetailMode] = useState("detailed");

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch {
      // Backend might not be running yet
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

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
    try {
      const data = await queryDocuments(question, detailMode);
      setResponse(data);
      setCitations(data.citations || []);
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
      <header className="app-header">
        <div>
          <h1>🔬 Multi-Document Research Agent</h1>
          <span className="subtitle">AI-powered cross-document analysis with citation tracking</span>
        </div>
      </header>

      <div className="app-body">
        <Sidebar
          documents={documents}
          onUpload={handleUpload}
          onRemove={handleRemove}
          onCompare={handleCompare}
          onContradictions={handleContradictions}
          onTrends={handleTrends}
          onLogout={onLogout}
          uploading={uploading}
          loading={loading}
        />
        <QueryPanel
          response={response}
          responseType={responseType}
          loading={loading}
          error={error}
          onSubmitQuery={handleQuery}
          detailMode={detailMode}
          onToggleMode={toggleMode}
        />
        <CitationPanel citations={citations} />
      </div>
    </div>
  );
}
