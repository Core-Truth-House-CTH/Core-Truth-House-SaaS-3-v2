import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, ChevronRight, Clock, Sparkles } from "lucide-react";
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
  height: calc(100vh - 3rem);
  min-height: 520px;
  background: var(--cth-admin-bg);
  color: var(--cth-admin-ink);
}
.cth-brand-studio * { box-sizing: border-box; }

.cth-bs-rail {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: var(--cth-admin-panel);
  border: 1px solid var(--cth-admin-border);
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
  color: var(--cth-admin-ink);
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
  border-radius: 10px;
  background: transparent;
  color: var(--cth-admin-ink);
  cursor: pointer;
  transition: background 0.15s ease;
}
.cth-bs-bot:hover { background: var(--cth-admin-panel-alt); }
.cth-bs-bot.is-active {
  background: var(--cth-admin-panel-alt);
  border-left: 3px solid var(--cth-admin-crimson);
}
.cth-bs-bot-label { display: block; font-size: 13px; font-weight: 700; }
.cth-bs-bot-desc {
  display: block;
  font-size: 11px;
  color: var(--cth-admin-muted);
  margin-top: 2px;
}

.cth-bs-divider {
  height: 1px;
  background: var(--cth-admin-border);
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
  color: var(--cth-admin-muted);
}
.cth-bs-session {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
  color: var(--cth-admin-ink);
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
  color: var(--cth-admin-muted);
  margin-top: 2px;
}
.cth-bs-session-empty {
  padding: 0.5rem 0.7rem;
  font-size: 11px;
  color: var(--cth-admin-muted);
}

.cth-bs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--cth-admin-panel);
  border: 1px solid var(--cth-admin-border);
  border-radius: 16px;
  overflow: hidden;
}
.cth-bs-main-header {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--cth-admin-border);
}
.cth-bs-main-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--cth-admin-ink);
}
.cth-bs-main-sub {
  font-size: 12px;
  color: var(--cth-admin-muted);
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
  background: var(--cth-admin-bg);
}
.cth-bs-empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  font-size: 13px;
  color: var(--cth-admin-muted);
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
  background: var(--cth-admin-panel-alt);
  color: var(--cth-admin-ink);
}
.cth-bs-msg.is-assistant {
  align-self: flex-start;
  background: var(--cth-admin-panel);
  color: var(--cth-admin-ink);
  border: 1px solid var(--cth-admin-border);
}
.cth-bs-typing {
  align-self: flex-start;
  font-size: 12px;
  color: var(--cth-admin-muted);
}

.cth-bs-input {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--cth-admin-border);
  background: var(--cth-admin-panel);
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
  border-radius: 12px;
  border: 1px solid var(--cth-admin-border);
  background: var(--cth-admin-bg);
  color: var(--cth-admin-ink);
}
.cth-bs-textarea:focus {
  outline: none;
  border-color: var(--cth-admin-accent);
}
.cth-bs-send {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 12px;
  background: var(--cth-admin-accent);
  color: var(--cth-admin-panel);
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
    </DashboardLayout>
  );
}
