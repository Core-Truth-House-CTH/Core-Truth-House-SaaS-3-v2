import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, ChevronRight, Clock, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const BOTS = [
  { id: "brand_voice_clone", label: "Brand Voice", description: "Speaks as your brand would" },
  { id: "content_generator", label: "Content Generator", description: "Drafts on-brand content" },
  { id: "brand_auditor", label: "Brand Auditor", description: "Reviews against your standards" },
  { id: "brand_os_assistant", label: "Brand OS", description: "Knows your brand deeply" },
  { id: "daily_content_engine", label: "Daily Content", description: "Generates today's content" },
];

const BRAND_STUDIO_CSS = `
.cth-brand-studio {
  display: flex;
  gap: 1rem;
  height: calc(100vh - 7rem);
  min-height: 520px;
  background: var(--cth-command-blush);
  color: var(--cth-command-ink);
}
.cth-brand-studio * { box-sizing: border-box; }

.cth-bs-rail {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: var(--cth-command-ivory);
  border: 1px solid var(--cth-command-border);
  border-radius: 16px;
  overflow: hidden;
}
.cth-bs-rail-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1rem 0.75rem;
  font-size: 15px;
  font-weight: 700;
  color: var(--cth-command-ink);
}
.cth-bs-rail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.25rem 0.6rem 0.75rem;
}
.cth-bs-bot {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.6rem 0.7rem;
  margin-bottom: 0.3rem;
  border: none;
  border-left: 3px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--cth-command-ink);
  cursor: pointer;
  transition: background 0.15s ease;
}
.cth-bs-bot:hover { background: var(--cth-command-panel-soft); }
.cth-bs-bot.is-active {
  background: var(--cth-command-panel-soft);
  border-left: 3px solid var(--cth-command-crimson);
}
.cth-bs-bot-label { display: block; font-size: 13px; font-weight: 700; }
.cth-bs-bot-desc {
  display: block;
  font-size: 11px;
  color: var(--cth-command-muted);
  margin-top: 2px;
}

.cth-bs-divider {
  height: 1px;
  background: var(--cth-command-border);
  margin: 0.5rem 0.7rem;
}
.cth-bs-rail-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--cth-command-muted);
}
.cth-bs-session {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.7rem;
  border-radius: 0;
  color: var(--cth-command-ink);
  cursor: pointer;
}
.cth-bs-session-main { flex: 1; min-width: 0; }
.cth-bs-session-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cth-bs-session-time {
  font-size: 10px;
  color: var(--cth-command-muted);
  margin-top: 2px;
}
.cth-bs-session-empty {
  padding: 0.5rem 0.7rem;
  font-size: 11px;
  color: var(--cth-command-muted);
}

.cth-bs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--cth-command-ivory);
  border: 1px solid var(--cth-command-border);
  border-radius: 0;
  overflow: hidden;
}
.cth-bs-main-header {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--cth-command-border);
}
.cth-bs-main-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--cth-command-ink);
}
.cth-bs-main-sub {
  font-size: 12px;
  color: var(--cth-command-muted);
  margin-top: 2px;
}

.cth-bs-thread {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: var(--cth-command-blush);
}
.cth-bs-empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  font-size: 13px;
  color: var(--cth-command-muted);
}
.cth-bs-msg {
  max-width: 76%;
  padding: 0.7rem 0.9rem;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.cth-bs-msg.is-user {
  align-self: flex-end;
  background: var(--cth-command-panel-soft);
  color: var(--cth-command-ink);
}
.cth-bs-msg.is-assistant {
  align-self: flex-start;
  background: var(--cth-command-ivory);
  color: var(--cth-command-ink);
  border: 1px solid var(--cth-command-border);
}
.cth-bs-typing {
  align-self: flex-start;
  font-size: 12px;
  color: var(--cth-command-muted);
}

.cth-bs-input {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--cth-command-border);
  background: var(--cth-command-ivory);
}
.cth-bs-textarea {
  flex: 1;
  resize: none;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  min-height: 44px;
  max-height: 160px;
  overflow-y: auto;
  padding: 0.6rem 0.75rem;
  border-radius: 0;
  border: 1px solid var(--cth-command-border);
  background: var(--cth-command-blush);
  color: var(--cth-command-ink);
}
.cth-bs-textarea:focus {
  outline: none;
  border-color: var(--cth-command-cinnabar);
}
.cth-bs-send {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 0;
  background: var(--cth-command-cinnabar);
  color: var(--cth-command-ivory);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.cth-bs-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

function formatTimestamp(value) {
  if (!value) return "";
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

function sessionTitle(session) {
  return (
    session?.title ||
    session?.preview ||
    session?.last_message ||
    session?.first_message ||
    session?.bot_type ||
    "Session"
  );
}

export default function BrandStudio() {
  const { activeWorkspaceId } = useWorkspace();

  const [selectedBot, setSelectedBot] = useState("brand_voice_clone");
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const threadRef = useRef(null);
  const textareaRef = useRef(null);

  const activeBot = BOTS.find((bot) => bot.id === selectedBot) || BOTS[0];

  // Reset the conversation and load sessions whenever the bot (or workspace) changes.
  useEffect(() => {
    setMessages([]);
    setSessionId(null);

    if (!activeWorkspaceId) {
      setSessions([]);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await apiClient.get(
          API_PATHS.brandStudio.sessions(activeWorkspaceId),
          { params: { bot_type: selectedBot } }
        );
        if (!cancelled) {
          setSessions(Array.isArray(data) ? data : data?.sessions || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load Brand Studio sessions", error);
          setSessions([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedBot, activeWorkspaceId]);

  // Keep the thread pinned to the latest message.
  useEffect(() => {
    const node = threadRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, loading]);

  // Let the composer grow with its content (rows=2 base, capped via CSS max-height).
  useEffect(() => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    }
  }, [input]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, timestamp: Date.now() },
    ]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiClient.post(
        API_PATHS.brandStudio.chat(activeWorkspaceId),
        { message: trimmed, bot_type: selectedBot, session_id: sessionId }
      );

      if (response?.session_id) {
        setSessionId(response.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response?.response ?? "",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Brand Studio chat failed", error);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const loadSession = async (session) => {
    const sid = session?.session_id || session?.id;
    if (!sid) return;
    try {
      const data = await apiClient.get(API_PATHS.brandStudio.session(activeWorkspaceId, sid));
      setSessionId(sid);
      setMessages(
        (data?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || Date.now(),
        }))
      );
      setSelectedBot(session.bot_type || selectedBot);
    } catch (err) {
      toast.error("Could not load session.");
    }
  };

  const requestDeleteSession = (e, session) => {
    e.stopPropagation();
    if (!session) return;
    setDeleteTarget(session);
  };

  const confirmDeleteSession = async () => {
    const session = deleteTarget;
    const sid = session?.session_id || session?.id;
    if (!sid) {
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await apiClient.delete(API_PATHS.brandStudio.deleteSession(activeWorkspaceId, sid));
      setSessions((prev) => prev.filter((s) => (s.session_id || s.id) !== sid));
      if (sessionId === sid) {
        setSessionId(null);
        setMessages([]);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Could not delete session.");
    } finally {
      setDeleting(false);
    }
  };

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const canSend = !loading && input.trim().length > 0;

  return (
    <DashboardLayout>
      <style>{BRAND_STUDIO_CSS}</style>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Brand Studio
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Your AI brand strategist
          </p>
        </div>
      </header>
      <div className="cth-brand-studio" data-testid="brand-studio-page">
        <aside className="cth-bs-rail">
          <div className="cth-bs-rail-header">
            <Bot size={18} />
            <span>Brand Studio</span>
          </div>

          <div className="cth-bs-rail-scroll">
            {BOTS.map((bot) => {
              const isActive = bot.id === selectedBot;
              return (
                <button
                  key={bot.id}
                  type="button"
                  className={`cth-bs-bot${isActive ? " is-active" : ""}`}
                  onClick={() => setSelectedBot(bot.id)}
                  data-testid={`brand-studio-bot-${bot.id}`}
                >
                  <span className="cth-bs-bot-label">{bot.label}</span>
                  <span className="cth-bs-bot-desc">{bot.description}</span>
                </button>
              );
            })}

            <div className="cth-bs-divider" />

            <div className="cth-bs-rail-label">
              <Clock size={12} />
              <span>Recent Sessions</span>
            </div>

            {sessions.length === 0 ? (
              <p className="cth-bs-session-empty">No sessions yet.</p>
            ) : (
              sessions.map((session, index) => (
                <div
                  key={session?.id || session?.session_id || index}
                  className="cth-bs-session"
                  onClick={() => loadSession(session)}
                >
                  <div className="cth-bs-session-main">
                    <div className="cth-bs-session-title">{sessionTitle(session)}</div>
                    <div className="cth-bs-session-time">
                      {formatTimestamp(session?.updated_at || session?.created_at)}
                    </div>
                  </div>
                  <ChevronRight size={14} />
                  <button
                    onClick={(e) => requestDeleteSession(e, session)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 4px",
                      color: "var(--cth-command-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="cth-bs-main">
          <header className="cth-bs-main-header">
            <div className="cth-bs-main-title">{activeBot.label}</div>
            <div className="cth-bs-main-sub">{activeBot.description}</div>
          </header>

          <div className="cth-bs-thread" ref={threadRef}>
            {messages.length === 0 ? (
              <div className="cth-bs-empty">
                <Sparkles size={22} />
                <span>Start a conversation with your {activeBot.label}</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`cth-bs-msg ${
                    message.role === "user" ? "is-user" : "is-assistant"
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
            {loading && <div className="cth-bs-typing">Thinking…</div>}
          </div>

          <div className="cth-bs-input">
            <textarea
              ref={textareaRef}
              className="cth-bs-textarea"
              rows={2}
              value={input}
              placeholder="Ask your brand strategist..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="brand-studio-input"
            />
            <button
              type="button"
              className="cth-bs-send"
              onClick={handleSend}
              disabled={!canSend}
              data-testid="brand-studio-send"
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </div>
        </section>
      </div>

      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              padding: "32px",
              maxWidth: "400px",
              width: "90%",
              borderRadius: 0,
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "var(--cth-command-ink)" }}>
              Delete Session
            </h3>
            <p style={{ margin: "0 0 24px", color: "var(--cth-command-muted)", fontSize: "14px" }}>
              Are you sure you want to delete <strong>{sessionTitle(deleteTarget)}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  border: "1px solid var(--cth-command-border)",
                  background: "transparent",
                  color: "var(--cth-command-ink)",
                  cursor: "pointer",
                  borderRadius: 0,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSession}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: "var(--cth-command-crimson)",
                  color: "#fff",
                  cursor: deleting ? "not-allowed" : "pointer",
                  borderRadius: 0,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
