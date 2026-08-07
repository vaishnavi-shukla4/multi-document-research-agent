import { supabase } from "./supabaseClient";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

/**
 * Builds the Authorization header from the current Supabase session.
 * Throws if the user is not authenticated — callers should catch and redirect to /login.
 */
async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function uploadDocuments(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { ...(await authHeader()) },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function getDocuments() {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  return res.json();
}

export async function deleteDocument(docName) {
  const res = await fetch(
    `${API_BASE}/documents/${encodeURIComponent(docName)}`,
    {
      method: "DELETE",
      headers: { ...(await authHeader()) },
    }
  );
  return res.json();
}

export async function getConversations() {
  const res = await fetch(`${API_BASE}/conversations`, {
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to load conversations");
  }
  return res.json();
}

export async function createConversation(title = null) {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Conversation creation failed");
  }
  return res.json();
}

export async function getConversationMessages(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}/messages`, {
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to load conversation history");
  }
  return res.json();
}

export async function sendConversationMessage(conversationId, question, detailMode = "detailed") {
  const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ question, detail_mode: detailMode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Conversation query failed");
  }
  return res.json();
}

export async function queryDocuments(question, detailMode = "detailed", topK = 10) {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ question, detail_mode: detailMode, top_k: topK }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Query failed");
  }
  return res.json();
}

export async function compareDocuments() {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Compare failed");
  }
  return res.json();
}

export async function findContradictions() {
  const res = await fetch(`${API_BASE}/contradictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Contradictions check failed");
  }
  return res.json();
}

export async function summarizeTrends() {
  const res = await fetch(`${API_BASE}/trends`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Trends summarization failed");
  }
  return res.json();
}
