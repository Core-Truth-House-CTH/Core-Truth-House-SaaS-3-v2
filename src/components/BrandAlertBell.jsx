import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";

const SERIF = "'Cormorant Garamond', Georgia, serif";

const unwrap = (res) => res?.data ?? res;

const PRIORITY_DOT = {
  high: "var(--cth-command-crimson)",
  medium: "var(--cth-command-gold)",
  low: "var(--cth-command-muted)",
};

function actionLabel(url) {
  if (url === "/signal-inbox") return "Go to Signal Inbox";
  if (url === "/brand-audit") return "View Audit";
  if (url === "/alerts") return "View Alerts";
  return "Open";
}

function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function BrandAlertBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const pollRef = useRef(null);

  const loadCount = useCallback(async () => {
    try {
      const res = unwrap(await apiClient.get("/api/brand-alerts/count"));
      setCount(Number(res?.unread_count || 0));
    } catch {
      /* ignore */
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(
        await apiClient.get("/api/brand-alerts", { params: { limit: 20 } })
      );
      setAlerts(res?.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll count on mount + every 60s.
  useEffect(() => {
    loadCount();
    pollRef.current = setInterval(loadCount, 60000);
    return () => clearInterval(pollRef.current);
  }, [loadCount]);

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) loadAlerts();
  };

  const markRead = async (alert) => {
    if (alert.read) return;
    setAlerts((list) =>
      list.map((a) => (a.alert_id === alert.alert_id ? { ...a, read: true } : a))
    );
    setCount((c) => Math.max(0, c - 1));
    try {
      await apiClient.patch(`/api/brand-alerts/${alert.alert_id}/read`);
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    setAlerts((list) => list.map((a) => ({ ...a, read: true })));
    setCount(0);
    try {
      await apiClient.patch("/api/brand-alerts/read-all");
    } catch {
      /* ignore */
    }
  };

  const dismiss = async (e, alert) => {
    e.stopPropagation();
    setAlerts((list) => list.filter((a) => a.alert_id !== alert.alert_id));
    if (!alert.read) setCount((c) => Math.max(0, c - 1));
    try {
      await apiClient.delete(`/api/brand-alerts/${alert.alert_id}`);
    } catch {
      /* ignore */
    }
  };

  const openAlert = async (alert) => {
    await markRead(alert);
    setOpen(false);
    if (alert.action_url) navigate(alert.action_url);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={togglePanel}
        data-testid="brand-alert-bell"
        aria-label="Brand health alerts"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--cth-command-muted)",
          padding: 8,
          borderRadius: 8,
          display: "inline-flex",
        }}
      >
        <Bell size={18} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "var(--cth-command-crimson)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-catcher / dark overlay (visible on mobile) */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 300,
              background: "rgba(26,8,40,0.35)",
            }}
          />
          <div
            data-testid="brand-alert-panel"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              zIndex: 301,
              width: 340,
              maxWidth: "calc(100vw - 24px)",
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              borderRadius: 12,
              boxShadow: "0 18px 48px rgba(13,0,16,0.28)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid var(--cth-command-border)",
              }}
            >
              <span
                style={{
                  fontFamily: SERIF,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--cth-command-ink)",
                }}
              >
                Alerts
              </span>
              <button
                onClick={markAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cth-command-crimson)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {loading ? (
                <div
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "var(--cth-command-muted)",
                    fontSize: 12,
                  }}
                >
                  Loading…
                </div>
              ) : alerts.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    color: "var(--cth-command-muted)",
                  }}
                >
                  <Radar
                    size={26}
                    style={{ color: "var(--cth-command-gold)", marginBottom: 10 }}
                  />
                  <div style={{ fontSize: 13 }}>
                    No alerts — your brand is being monitored.
                  </div>
                </div>
              ) : (
                alerts.map((a) => (
                  <div
                    key={a.alert_id}
                    onClick={() => openAlert(a)}
                    onMouseEnter={() => setHoverId(a.alert_id)}
                    onMouseLeave={() => setHoverId(null)}
                    style={{
                      position: "relative",
                      display: "flex",
                      gap: 10,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--cth-command-border)",
                      cursor: "pointer",
                      background: a.read
                        ? "transparent"
                        : "var(--cth-command-blush)",
                      borderLeft: a.read
                        ? "3px solid transparent"
                        : "3px solid var(--cth-command-crimson)",
                    }}
                  >
                    <span
                      style={{
                        marginTop: 5,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background:
                          PRIORITY_DOT[a.priority] || "var(--cth-command-muted)",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--cth-command-ink)",
                          lineHeight: 1.3,
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--cth-command-muted)",
                          marginTop: 2,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {a.body}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--cth-command-muted)",
                          }}
                        >
                          {relativeTime(a.created_at)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--cth-command-crimson)",
                          }}
                        >
                          {actionLabel(a.action_url)} →
                        </span>
                      </div>
                    </div>
                    {hoverId === a.alert_id && (
                      <button
                        onClick={(e) => dismiss(e, a)}
                        title="Dismiss"
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--cth-command-muted)",
                          padding: 2,
                          display: "inline-flex",
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--cth-command-border)",
                textAlign: "center",
              }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/alerts");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cth-command-ink)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                View all alerts
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BrandAlertBell;
