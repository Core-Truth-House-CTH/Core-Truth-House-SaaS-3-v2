import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Radar, X as XIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/Layout";
import apiClient from "../lib/apiClient";

const SERIF = "'Cormorant Garamond', Georgia, serif";

const unwrap = (res) => res?.data ?? res;

const PRIORITY_META = {
  high: { label: "High", color: "var(--cth-command-crimson)" },
  medium: { label: "Medium", color: "var(--cth-command-gold)" },
  low: { label: "Low", color: "var(--cth-command-muted)" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "high", label: "High Priority" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

function typeBadge(type) {
  if (type === "pending_signals") return "Pending";
  if (type === "signal_level4" || type === "signal_cluster") return "Signal";
  return "Brand Score";
}

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

function dateBucket(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 86400000;
  const diffDays = Math.floor((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / dayMs);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Earlier";
}

const BUCKET_ORDER = ["Today", "Yesterday", "This Week", "Earlier"];

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = unwrap(
        await apiClient.get("/api/brand-alerts", { params: { limit: 200 } })
      );
      setAlerts(res?.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (alert) => {
    if (alert.read) return;
    setAlerts((list) =>
      list.map((a) => (a.alert_id === alert.alert_id ? { ...a, read: true } : a))
    );
    try {
      await apiClient.patch(`/api/brand-alerts/${alert.alert_id}/read`);
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    setAlerts((list) => list.map((a) => ({ ...a, read: true })));
    try {
      await apiClient.patch("/api/brand-alerts/read-all");
    } catch {
      /* ignore */
    }
  };

  const dismiss = async (alert) => {
    setAlerts((list) => list.filter((a) => a.alert_id !== alert.alert_id));
    try {
      await apiClient.delete(`/api/brand-alerts/${alert.alert_id}`);
    } catch {
      /* ignore */
    }
  };

  const openAlert = async (alert) => {
    await markRead(alert);
    if (alert.action_url) navigate(alert.action_url);
  };

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === "all") return true;
      if (filter === "unread") return !a.read;
      return a.priority === filter;
    });
  }, [alerts, filter]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const a of filtered) {
      const bucket = dateBucket(a.created_at);
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket).push(a);
    }
    return BUCKET_ORDER.filter((b) => map.has(b)).map((b) => ({
      bucket: b,
      items: map.get(b),
    }));
  }, [filtered]);

  return (
    <DashboardLayout>
      <div style={{ padding: "28px 32px", maxWidth: 920, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: 40,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Alerts
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: 15,
                color: "var(--cth-command-muted)",
              }}
            >
              Your brand health and signal activity in one place.
            </p>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={markAllRead}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid var(--cth-command-border)",
                background: "var(--cth-command-panel)",
                color: "var(--cth-command-ink)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `1px solid ${
                    active ? "transparent" : "var(--cth-command-border)"
                  }`,
                  background: active
                    ? "var(--cth-command-ink)"
                    : "var(--cth-command-panel)",
                  color: active ? "#fff" : "var(--cth-command-muted)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 40,
              color: "var(--cth-command-muted)",
            }}
          >
            <Loader2 size={20} className="animate-spin" /> Loading…
          </div>
        ) : alerts.length === 0 ? (
          <div
            style={{
              background: "#1a0828",
              borderRadius: 18,
              padding: "44px 32px",
              textAlign: "center",
            }}
          >
            <Radar
              size={30}
              style={{ color: "var(--cth-command-gold)", marginBottom: 14 }}
            />
            <p
              style={{
                color: "var(--cth-command-blush)",
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              No alerts yet. As you build, confirm signals, and run audits, Brand
              Health Alerts will surface what needs your attention here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 36,
              textAlign: "center",
              color: "var(--cth-command-muted)",
              fontSize: 15,
            }}
          >
            No alerts match this filter.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.bucket} style={{ marginBottom: 26 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  color: "var(--cth-command-muted)",
                  marginBottom: 12,
                }}
              >
                {group.bucket}
              </div>
              {group.items.map((a) => {
                const pri = PRIORITY_META[a.priority] || PRIORITY_META.low;
                return (
                  <div
                    key={a.alert_id}
                    style={{
                      background: "var(--cth-command-panel)",
                      border: "1px solid var(--cth-command-border)",
                      borderRadius: 12,
                      padding: 18,
                      marginBottom: 12,
                      borderLeft: a.read
                        ? "1px solid var(--cth-command-border)"
                        : "3px solid var(--cth-command-crimson)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: pri.color,
                        }}
                      >
                        {pri.label}
                      </span>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--cth-command-muted)",
                          border: "1px solid var(--cth-command-border)",
                        }}
                      >
                        {typeBadge(a.type)}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "var(--cth-command-muted)",
                        }}
                      >
                        {relativeTime(a.created_at)}
                      </span>
                      <button
                        onClick={() => dismiss(a)}
                        title="Dismiss"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--cth-command-muted)",
                          padding: 2,
                          display: "inline-flex",
                        }}
                      >
                        <XIcon size={15} />
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--cth-command-ink)",
                        marginBottom: 6,
                      }}
                    >
                      {a.title}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: "var(--cth-command-ink)",
                        marginBottom: 14,
                      }}
                    >
                      {a.body}
                    </div>
                    <button
                      onClick={() => openAlert(a)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: 9,
                        border: "1px solid var(--cth-command-crimson)",
                        background: "var(--cth-command-crimson)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {actionLabel(a.action_url)} →
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
