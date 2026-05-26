import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Send, ArrowRight, Sparkles, ClipboardCheck, Wand2, Lock } from "lucide-react";

import apiClient from "../lib/apiClient";
import { usePlan } from "../context/PlanContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAskTheHouse, getSurfaceFromPath } from "../context/AskTheHouseContext";

const MODES = [
  { id: "guide", label: "Guide Me", icon: Sparkles },
  { id: "review", label: "Review This", icon: ClipboardCheck },
  { id: "generate", label: "Generate With Me", icon: Wand2 },
];

function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ath-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AskTheHouseDrawer() {
  const { isOpen, close, sectionId } = useAskTheHouse();
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = usePlan();
  const { activeWorkspaceId } = useWorkspace();

  const surface = useMemo(() => getSurfaceFromPath(location.pathname), [location.pathname]);

  const [mode, setMode] = useState("guide");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [upgradeRequired, setUpgradeRequired] = useState(null);
  const [nextRoom, setNextRoom] = useState(null);

  const threadRef = useRef(null);

  // Reset thread when surface changes
  useEffect(() => {
    setMessages([]);
    setSessionId(null);
    setNextRoom(null);
    setUpgradeRequired(null);
  }, [surface]);

  // Load capabilities on open
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadContext() {
      try {
        const data = await apiClient.get("/api/ask-the-house/context", {
          params: { surface },
        });
        if (!cancelled) {
          setCapabilities(data || null);
          if (data?.upgrade_required) {
            setUpgradeRequired(data.upgrade_required);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[AskTheHouse] context load failed", error);
        }
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [isOpen, surface]);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || upgradeRequired) return;

    const currentSession = sessionId || generateSessionId();
    if (!sessionId) setSessionId(currentSession);

    const userMsg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setNextRoom(null);
    setLoading(true);

    try {
      const data = await apiClient.post("/api/ask-the-house/chat", {
        message: trimmed,
        session_id: currentSession,
        mode,
        surface,
        section_id: sectionId || null,
        workspace_id: activeWorkspaceId || null,
      });

      if (data?.upgrade_required) {
        setUpgradeRequired(data.upgrade_required);
        setLoading(false);
        return;
      }

      const reply = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data?.reply || data?.message || data?.content || "",
      };
      setMessages((prev) => [...prev, reply]);
      if (data?.next_room) {
        setNextRoom(data.next_room);
      }
    } catch (error) {
      const status = error?.status;
      if (status === 402 || status === 403) {
        setUpgradeRequired({
          message: error?.payload?.detail || error?.message || "This mode requires an upgrade.",
          required_plan: error?.payload?.required_plan || null,
        });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            error: true,
            content: error?.message || "Something went wrong. Please try again.",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, upgradeRequired, sessionId, mode, surface, sectionId, activeWorkspaceId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToNextRoom = () => {
    if (!nextRoom?.path) return;
    navigate(nextRoom.path);
    close();
  };

  const goToUpgrade = () => {
    navigate("/billing");
    close();
  };

  const modesDisabled = useMemo(() => {
    const allowed = capabilities?.allowed_modes;
    if (!Array.isArray(allowed) || allowed.length === 0) return {};
    return MODES.reduce((acc, m) => {
      acc[m.id] = !allowed.includes(m.id);
      return acc;
    }, {});
  }, [capabilities]);

  return (
    <>
      <style>{`
        .cth-ath-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(13, 0, 16, 0.42);
          backdrop-filter: blur(2px);
          z-index: 80;
          opacity: 0;
          pointer-events: none;
          transition: opacity 200ms ease;
        }
        .cth-ath-backdrop.open {
          opacity: 1;
          pointer-events: auto;
        }
        .cth-ath-drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 420px;
          max-width: 100vw;
          background: linear-gradient(180deg, #0d0010 0%, #1a0420 100%);
          color: var(--cth-ivory, #fbf7f1);
          border-left: 1px solid rgba(196, 169, 91, 0.18);
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.5);
          z-index: 90;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 260ms cubic-bezier(0.32, 0.72, 0, 1);
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .cth-ath-drawer.open {
          transform: translateX(0);
        }
        .cth-ath-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(196, 169, 91, 0.14);
        }
        .cth-ath-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--cth-gold, #c4a95b);
          font-weight: 600;
        }
        .cth-ath-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          margin-top: 2px;
          color: #fbf7f1;
        }
        .cth-ath-close {
          background: transparent;
          border: 1px solid rgba(196, 169, 91, 0.22);
          color: rgba(251, 247, 241, 0.78);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }
        .cth-ath-close:hover {
          background: rgba(196, 169, 91, 0.10);
          color: #fbf7f1;
        }
        .cth-ath-modes {
          display: flex;
          gap: 6px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(196, 169, 91, 0.10);
        }
        .cth-ath-mode {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(251, 247, 241, 0.04);
          border: 1px solid rgba(196, 169, 91, 0.16);
          color: rgba(251, 247, 241, 0.72);
          padding: 8px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }
        .cth-ath-mode:hover {
          color: #fbf7f1;
          border-color: rgba(196, 169, 91, 0.36);
        }
        .cth-ath-mode.active {
          background: rgba(196, 169, 91, 0.14);
          border-color: rgba(196, 169, 91, 0.55);
          color: var(--cth-gold, #c4a95b);
        }
        .cth-ath-mode.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .cth-ath-thread {
          flex: 1;
          overflow-y: auto;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cth-ath-empty {
          color: rgba(251, 247, 241, 0.55);
          font-size: 13px;
          line-height: 1.55;
          padding: 12px 0;
        }
        .cth-ath-empty .cth-ath-empty-title {
          font-family: 'Playfair Display', Georgia, serif;
          color: #fbf7f1;
          font-size: 17px;
          margin-bottom: 6px;
        }
        .cth-ath-empty ul {
          margin-top: 10px;
          padding-left: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cth-ath-empty li {
          font-size: 12px;
          color: rgba(251, 247, 241, 0.68);
          padding-left: 14px;
          position: relative;
        }
        .cth-ath-empty li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          width: 6px;
          height: 1px;
          background: var(--cth-gold, #c4a95b);
        }
        .cth-ath-bubble {
          max-width: 84%;
          padding: 10px 13px;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .cth-ath-bubble.user {
          align-self: flex-end;
          background: rgba(175, 0, 36, 0.18);
          border: 1px solid rgba(175, 0, 36, 0.4);
          color: #fbf7f1;
        }
        .cth-ath-bubble.assistant {
          align-self: flex-start;
          background: rgba(251, 247, 241, 0.05);
          border: 1px solid rgba(196, 169, 91, 0.16);
          color: rgba(251, 247, 241, 0.92);
        }
        .cth-ath-bubble.error {
          border-color: rgba(175, 0, 36, 0.5);
          color: rgba(255, 200, 200, 0.95);
        }
        .cth-ath-typing {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 10px 13px;
          background: rgba(251, 247, 241, 0.05);
          border: 1px solid rgba(196, 169, 91, 0.16);
          border-radius: 4px;
        }
        .cth-ath-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cth-gold, #c4a95b);
          opacity: 0.5;
          animation: cth-ath-pulse 1.2s ease-in-out infinite;
        }
        .cth-ath-typing span:nth-child(2) { animation-delay: 0.15s; }
        .cth-ath-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes cth-ath-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        .cth-ath-next-room {
          align-self: flex-start;
          max-width: 90%;
          margin-top: -4px;
          padding: 12px 14px;
          background: linear-gradient(135deg, rgba(196, 169, 91, 0.10), rgba(196, 169, 91, 0.04));
          border: 1px solid rgba(196, 169, 91, 0.35);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .cth-ath-next-room-label {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cth-gold, #c4a95b);
          margin-bottom: 3px;
        }
        .cth-ath-next-room-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px;
          color: #fbf7f1;
        }
        .cth-ath-next-room-cta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--cth-gold, #c4a95b);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          padding: 4px 0;
        }
        .cth-ath-next-room-cta:hover {
          color: #fbf7f1;
        }
        .cth-ath-input-area {
          padding: 14px 20px 18px;
          border-top: 1px solid rgba(196, 169, 91, 0.14);
          background: rgba(13, 0, 16, 0.6);
        }
        .cth-ath-input-row {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .cth-ath-textarea {
          flex: 1;
          background: rgba(251, 247, 241, 0.04);
          border: 1px solid rgba(196, 169, 91, 0.22);
          color: #fbf7f1;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.5;
          padding: 10px 12px;
          border-radius: 4px;
          resize: none;
          min-height: 44px;
          max-height: 140px;
          outline: none;
          transition: border-color 160ms ease;
        }
        .cth-ath-textarea:focus {
          border-color: rgba(196, 169, 91, 0.6);
        }
        .cth-ath-textarea::placeholder {
          color: rgba(251, 247, 241, 0.42);
        }
        .cth-ath-send {
          background: var(--cth-gold, #c4a95b);
          border: 1px solid var(--cth-gold, #c4a95b);
          color: #33033c;
          width: 44px;
          height: 44px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 160ms ease, opacity 160ms ease;
        }
        .cth-ath-send:hover { background: #d4ba6e; }
        .cth-ath-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .cth-ath-meta {
          margin-top: 8px;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(251, 247, 241, 0.42);
        }
        .cth-ath-upgrade {
          padding: 16px 18px;
          background: linear-gradient(135deg, rgba(196, 169, 91, 0.14), rgba(175, 0, 36, 0.10));
          border: 1px solid rgba(196, 169, 91, 0.45);
          border-radius: 4px;
        }
        .cth-ath-upgrade-eyebrow {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cth-gold, #c4a95b);
          font-weight: 600;
          margin-bottom: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .cth-ath-upgrade-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 17px;
          color: #fbf7f1;
          margin-bottom: 6px;
        }
        .cth-ath-upgrade-message {
          font-size: 13px;
          color: rgba(251, 247, 241, 0.78);
          line-height: 1.55;
          margin-bottom: 12px;
        }
        .cth-ath-upgrade-btn {
          background: #33033c;
          border: 1px solid var(--cth-gold, #c4a95b);
          color: var(--cth-gold, #c4a95b);
          padding: 9px 18px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }
        .cth-ath-upgrade-btn:hover {
          background: var(--cth-gold, #c4a95b);
          color: #33033c;
        }
      `}</style>

      <div
        className={`cth-ath-backdrop ${isOpen ? "open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`cth-ath-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Ask the House"
        aria-hidden={!isOpen}
      >
        <div className="cth-ath-header">
          <div>
            <div className="cth-ath-eyebrow">Concierge</div>
            <div className="cth-ath-title">Ask the House</div>
          </div>
          <button className="cth-ath-close" onClick={close} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cth-ath-modes" role="tablist">
          {MODES.map((m) => {
            const Icon = m.icon;
            const disabled = !!modesDisabled[m.id];
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                disabled={disabled}
                className={`cth-ath-mode ${mode === m.id ? "active" : ""} ${
                  disabled ? "disabled" : ""
                }`}
                onClick={() => !disabled && setMode(m.id)}
                title={disabled ? "Upgrade to unlock this mode" : m.label}
              >
                {disabled ? <Lock size={11} /> : <Icon size={11} />}
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="cth-ath-thread" ref={threadRef}>
          {messages.length === 0 && !loading && (
            <div className="cth-ath-empty">
              <div className="cth-ath-empty-title">
                {capabilities?.greeting || "How can the House help?"}
              </div>
              <div>
                {capabilities?.description ||
                  "Ask anything about this room — strategy, structure, or what to build next."}
              </div>
              {Array.isArray(capabilities?.suggestions) && capabilities.suggestions.length > 0 && (
                <ul>
                  {capabilities.suggestions.slice(0, 4).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`cth-ath-bubble ${m.role} ${m.error ? "error" : ""}`}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="cth-ath-typing" aria-label="The House is thinking">
              <span />
              <span />
              <span />
            </div>
          )}

          {nextRoom && !loading && (
            <div className="cth-ath-next-room">
              <div>
                <div className="cth-ath-next-room-label">Next Room</div>
                <div className="cth-ath-next-room-title">
                  {nextRoom.label || nextRoom.title || nextRoom.name}
                </div>
              </div>
              <button className="cth-ath-next-room-cta" onClick={goToNextRoom}>
                Go <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="cth-ath-input-area">
          {upgradeRequired ? (
            <div className="cth-ath-upgrade">
              <div className="cth-ath-upgrade-eyebrow">
                <Lock size={11} /> Upgrade Required
              </div>
              <div className="cth-ath-upgrade-title">
                Unlock the rest of the House
              </div>
              <div className="cth-ath-upgrade-message">
                {upgradeRequired.message ||
                  "This feature is part of a higher tier. Upgrade your plan to continue the conversation."}
              </div>
              <button className="cth-ath-upgrade-btn" onClick={goToUpgrade}>
                Upgrade Plan
              </button>
            </div>
          ) : (
            <>
              <div className="cth-ath-input-row">
                <textarea
                  className="cth-ath-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask about ${surface.replace(/_/g, " ")}…`}
                  rows={1}
                  disabled={loading}
                />
                <button
                  className="cth-ath-send"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="cth-ath-meta">
                {plan ? `${plan.toUpperCase()} · ` : ""}
                {surface.replace(/_/g, " ")}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
