import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Lock, Plus, MessageSquare } from "lucide-react";
import apiClient from "../../lib/apiClient";
import { useWorkspace } from "../../context/WorkspaceContext";

const SANS = '"DM Sans", system-ui, sans-serif';
const SERIF = '"Playfair Display", serif';

const MODES = [
  { id: "guide", label: "Guide" },
  { id: "review", label: "Review" },
  { id: "generate", label: "Generate" },
];

function sessionTitle(s) {
  return (
    s?.title ||
    s?.last_message ||
    s?.surface ||
    "Untitled session"
  );
}

function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AskTheHouseDrawer({
  open,
  onClose,
  surface,
  sectionId,
  currentDraft,
}) {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const wsId = activeWorkspace?.id || activeWorkspaceId;
  const [contextLoading, setContextLoading] = useState(true);
  const [caps, setCaps] = useState(null);
  const [nextRoom, setNextRoom] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("guide");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Reset transient state when drawer opens
  useEffect(() => {
    if (!open) return;
    setSessionId(null);
    setMessages([]);
    setInput("");
    setMode("guide");
    setSessionsOpen(false);
  }, [open]);

  // Load context + sessions. Extracted so the retry button can call it too.
  const loadContext = async () => {
    if (!wsId) return;
    setContextLoading(true);
    const ctxParams = new URLSearchParams({ surface });
    if (sectionId) ctxParams.set("section_id", sectionId);
    try {
      const [ctxRes, sessRes] = await Promise.all([
        apiClient.get(`/api/ask-the-house/context?${ctxParams.toString()}`),
        apiClient.get("/api/ask-the-house/sessions"),
      ]);
      setCaps(ctxRes?.capabilities || null);
      setNextRoom(ctxRes?.next_room || null);
      const list = Array.isArray(sessRes) ? sessRes : [];
      setSessions(list.filter((s) => s.surface === surface));
    } catch {
      setCaps(null);
    } finally {
      setContextLoading(false);
    }
  };

  // Gate the fetch on workspace being resolved — prevents the auth-race that
  // caused /context to 401 and the drawer to render an upgrade card.
  useEffect(() => {
    if (!open || !wsId) return;
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, surface, sectionId, wsId]);

  // Autoscroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async (sid) => {
    setSessionId(sid);
    setSessionsOpen(false);
    try {
      const res = await apiClient.get(`/api/ask-the-house/sessions/${sid}`);
      const msgs = Array.isArray(res) ? res : [];
      setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
    } catch {
      setMessages([]);
    }
  };

  const startNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    setSessionsOpen(false);
  };

  const modeCaps = (chosen) => {
    if (!caps) return { locked: false, unknown: true };
    if (chosen === "guide") return { locked: !caps.can_guide };
    if (chosen === "review") return { locked: !caps.can_review };
    if (chosen === "generate") return { locked: !caps.can_generate };
    return { locked: true };
  };

  const currentLocked = modeCaps(mode).locked;
  const surfaceLocked = caps?.upgrade_required === true;
  const bodyLocked = surfaceLocked || currentLocked;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || bodyLocked) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    try {
      const res = await apiClient.post("/api/ask-the-house/chat", {
        message: text,
        session_id: sessionId,
        mode,
        surface,
        section_id: sectionId || null,
        current_draft: currentDraft || null,
      });
      const data = res || {};
      if (data.session_id && !sessionId) setSessionId(data.session_id);
      if (data.upgrade_required) {
        setToast(data.message || "Upgrade required.");
        setTimeout(() => setToast(null), 3500);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message || "" }]);
        if (data.next_room) setNextRoom(data.next_room);
      }
    } catch {
      setToast("Something went wrong. Try again.");
      setTimeout(() => setToast(null), 3000);
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(13,0,16,0.45)",
          zIndex: 200,
        }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 100vw)",
        background: "var(--cth-command-panel)",
        borderLeft: "1px solid var(--cth-command-border)",
        zIndex: 201,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--cth-command-border)",
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              margin: 0, fontSize: 11,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--cth-command-muted)",
              fontFamily: SANS,
            }}>
              Ask the House
            </p>
            <h2 style={{
              margin: "2px 0 0", fontSize: 20,
              fontFamily: SERIF,
              color: "var(--cth-command-ink)", fontWeight: 600,
              textTransform: "capitalize",
            }}>
              {(surface || "").replace(/_/g, " ")}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--cth-command-muted)", padding: 4,
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          display: "flex", gap: 6,
          padding: "12px 24px",
          borderBottom: "1px solid var(--cth-command-border)",
          flexShrink: 0,
        }}>
          {MODES.map((m) => {
            const mc = modeCaps(m.id);
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                disabled={contextLoading}
                title={mc.locked && caps?.upgrade_plan ? `Upgrade to ${caps.upgrade_plan}` : ""}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 4,
                  cursor: contextLoading ? "default" : "pointer",
                  fontSize: 12, fontFamily: SANS,
                  background: isActive
                    ? "var(--cth-command-purple)"
                    : "var(--cth-command-panel-soft)",
                  color: isActive
                    ? "var(--cth-command-gold)"
                    : mc.locked
                      ? "var(--cth-command-muted)"
                      : "var(--cth-command-ink)",
                  border: `1px solid ${isActive
                    ? "var(--cth-command-purple)"
                    : "var(--cth-command-border)"}`,
                  opacity: mc.locked && !isActive ? 0.7 : 1,
                  transition: "all 0.15s",
                }}
              >
                {m.label}
                {mc.locked && <Lock size={11} />}
              </button>
            );
          })}
        </div>

        <div style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--cth-command-border)",
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <button
            onClick={() => setSessionsOpen((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, fontFamily: SANS,
              color: "var(--cth-command-muted)",
              padding: 0,
            }}
          >
            <MessageSquare size={13} />
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </button>
          <button
            onClick={startNewSession}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              marginLeft: "auto",
              background: "none",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-muted)",
              borderRadius: 4, padding: "4px 10px",
              fontSize: 12, fontFamily: SANS,
              cursor: "pointer",
            }}
          >
            <Plus size={12} /> New
          </button>
        </div>

        {sessionsOpen && sessions.length > 0 && (
          <div style={{
            maxHeight: 160, overflowY: "auto",
            borderBottom: "1px solid var(--cth-command-border)",
            background: "var(--cth-command-panel-soft)",
            flexShrink: 0,
          }}>
            {sessions.map((s) => (
              <button
                key={s.session_id}
                onClick={() => loadSession(s.session_id)}
                style={{
                  display: "block", width: "100%",
                  textAlign: "left",
                  padding: "10px 24px",
                  background: sessionId === s.session_id
                    ? "var(--cth-command-blush)"
                    : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--cth-command-border)",
                  cursor: "pointer",
                  fontFamily: SANS,
                }}
              >
                <div style={{
                  fontSize: 13, color: "var(--cth-command-ink)",
                  marginBottom: 2,
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {sessionTitle(s)}
                </div>
                <div style={{
                  fontSize: 11, color: "var(--cth-command-muted)",
                }}>
                  {relativeTime(s.updated_at)} · {s.message_count || 0} messages
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{
          flex: 1, overflowY: "auto",
          padding: "16px 24px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {contextLoading ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              color: "var(--cth-command-muted)",
              fontFamily: SANS, fontSize: 13,
            }}>
              <Loader2 size={16} className="animate-spin" />
              Loading…
            </div>
          ) : !caps ? (
            <div style={{ padding: "32px 24px", textAlign: "center", margin: "auto 0" }}>
              <p style={{
                color: "var(--cth-command-muted)",
                fontSize: 14, fontFamily: SANS,
                marginBottom: 16, lineHeight: 1.5,
              }}>
                Could not load your Brand Architect. Check your connection and try again.
              </p>
              <button
                onClick={loadContext}
                style={{
                  padding: "8px 20px",
                  background: "var(--cth-command-purple)",
                  color: "var(--cth-command-gold)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: SANS,
                }}
              >
                Retry
              </button>
            </div>
          ) : bodyLocked ? (
            <div style={{ textAlign: "center", padding: "32px 0", margin: "auto 0" }}>
              <Lock size={32} style={{
                color: "var(--cth-command-muted)", marginBottom: 12,
              }} />
              <p style={{
                fontSize: 15, color: "var(--cth-command-ink)",
                fontFamily: SANS,
                maxWidth: 340, margin: "0 auto 16px",
                lineHeight: 1.5,
              }}>
                {caps?.upgrade_message
                  || `This mode requires the ${caps?.upgrade_plan || "next"} plan.`}
              </p>
              <a href="/tiers" style={{
                display: "inline-block",
                padding: "10px 18px", borderRadius: 4,
                background: "var(--cth-command-purple)",
                color: "var(--cth-command-gold)",
                fontSize: 13, fontFamily: SANS,
                textDecoration: "none",
              }}>
                Upgrade to {caps?.upgrade_plan || "continue"}
              </a>
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              color: "var(--cth-command-muted)",
              fontFamily: SANS, fontSize: 13,
              fontStyle: "italic",
              padding: "12px 0",
            }}>
              Ask the Brand Architect anything about your {(surface || "").replace(/_/g, " ")}.
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px", borderRadius: 8,
                  background: m.role === "user"
                    ? "var(--cth-command-purple)"
                    : "var(--cth-command-panel-soft)",
                  color: m.role === "user"
                    ? "var(--cth-command-gold)"
                    : "var(--cth-command-ink)",
                  fontFamily: SANS, fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {!bodyLocked && caps && nextRoom && (
          <div style={{
            padding: "10px 24px",
            borderTop: "1px solid var(--cth-command-border)",
            background: "var(--cth-command-panel-soft)",
            fontSize: 12, fontFamily: SANS,
            color: "var(--cth-command-muted)",
            flexShrink: 0,
          }}>
            Next:{" "}
            <span style={{ color: "var(--cth-command-ink)" }}>
              {typeof nextRoom === "string" ? nextRoom : nextRoom.label || nextRoom.surface}
            </span>
          </div>
        )}

        {!bodyLocked && caps && (
          <div style={{
            padding: "12px 24px 16px",
            borderTop: "1px solid var(--cth-command-border)",
            display: "flex", gap: 8,
            flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                mode === "guide" ? "Ask a question…" :
                mode === "review" ? "Paste a draft for review…" :
                "Describe what to generate…"
              }
              rows={2}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 4,
                border: "1px solid var(--cth-command-border)",
                background: "var(--cth-command-panel-soft)",
                color: "var(--cth-command-ink)",
                fontFamily: SANS, fontSize: 13,
                resize: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              style={{
                padding: "0 16px", borderRadius: 4,
                background: input.trim() && !sending
                  ? "var(--cth-command-purple)"
                  : "var(--cth-command-border)",
                color: input.trim() && !sending
                  ? "var(--cth-command-gold)"
                  : "var(--cth-command-muted)",
                border: "none",
                cursor: input.trim() && !sending ? "pointer" : "default",
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                minWidth: 60,
              }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        )}

        {toast && (
          <div style={{
            position: "absolute", bottom: 80, left: "50%",
            transform: "translateX(-50%)",
            background: "var(--cth-command-purple)",
            color: "var(--cth-command-gold)",
            padding: "10px 20px", borderRadius: 4,
            fontSize: 13, fontFamily: SANS,
            maxWidth: "85%", textAlign: "center",
            zIndex: 10,
          }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
