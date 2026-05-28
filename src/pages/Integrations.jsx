import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AtSign,
  Building2,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  LogOut,
  Music,
  Pin,
  Share2,
  X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";

const PLATFORMS = [
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    base: "/api/social/facebook",
    responseKey: "connection",
    description: "Pages you manage",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    base: "/api/social/instagram",
    responseKey: "connection",
    description: "Business or Creator account",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    base: "/api/social/linkedin",
    responseKey: "connection",
    description: "Profile or Company Page",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: Music,
    base: "/api/social/tiktok",
    responseKey: "connection",
    description: "Business account",
  },
  {
    id: "threads",
    label: "Threads",
    icon: AtSign,
    base: "/api/social/threads",
    responseKey: "connection",
    description: "Linked through Instagram",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    icon: Pin,
    base: "/api/social/pinterest",
    responseKey: "connection",
    description: "Boards and pins",
  },
  {
    id: "google_business",
    label: "Google Business",
    icon: Building2,
    base: "/api/social/google_business",
    responseKey: "connection",
    description: "Business Profile locations",
  },
  {
    id: "ayrshare",
    label: "Ayrshare",
    icon: Share2,
    base: "/api/social/ayrshare",
    responseKey: "routing",
    description: "Multi-platform relay",
    connectBody: {},
    disconnectBody: {},
  },
];

function isConnected(platform, status) {
  if (!status) return false;
  if (platform.id === "ayrshare") {
    const platforms = Array.isArray(status?.connected_platforms) ? status.connected_platforms : [];
    return status?.mode === "ayrshare" || platforms.length > 0;
  }
  return Boolean(status);
}

function statusHandle(platform, status) {
  if (!status) return "";
  if (platform.id === "ayrshare") {
    const platforms = Array.isArray(status?.connected_platforms) ? status.connected_platforms : [];
    if (platforms.length) return `${platforms.length} platform${platforms.length === 1 ? "" : "s"} linked`;
    return status?.mode === "ayrshare" ? "Profile active" : "";
  }
  return (
    status?.username ||
    status?.page_name ||
    status?.account_name ||
    status?.account_id ||
    ""
  );
}

// =========================================================
// Sub-components
// =========================================================

function StatusBadge({ connected }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{
        background: connected ? "var(--cth-command-crimson)" : "var(--cth-command-panel-soft)",
        color: connected ? "var(--cth-command-panel)" : "var(--cth-command-muted)",
        border: "1px solid " + (connected ? "var(--cth-command-crimson)" : "var(--cth-command-border)"),
      }}
    >
      {connected ? <Check size={10} /> : <X size={10} />}
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

function PlatformCard({ platform, status, statusLoading, busyConnect, busyDisconnect, onConnect, onDisconnect }) {
  const Icon = platform.icon;
  const connected = isConnected(platform, status);
  const handle = statusHandle(platform, status);

  return (
    <article
      className="flex flex-col rounded-xl p-4"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md"
          style={{
            background: "var(--cth-command-blush)",
            border: "1px solid var(--cth-command-border)",
            color: "var(--cth-command-crimson)",
          }}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {platform.label}
          </p>
          <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            {platform.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {statusLoading ? (
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            <Loader2 size={11} className="animate-spin" /> Checking...
          </span>
        ) : (
          <>
            <StatusBadge connected={connected} />
            {handle ? (
              <span className="truncate text-[11px]" style={{ color: "var(--cth-command-muted)" }} title={handle}>
                {handle}
              </span>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end">
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={busyDisconnect || statusLoading}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{
              background: "var(--cth-command-panel-soft)",
              color: "var(--cth-command-crimson)",
              border: "1px solid var(--cth-command-border)",
            }}
          >
            {busyDisconnect ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={busyConnect || statusLoading}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
          >
            {busyConnect ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Connect
          </button>
        )}
      </div>
    </article>
  );
}

// =========================================================
// Main component
// =========================================================

export default function Integrations() {
  const [statuses, setStatuses] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyConnect, setBusyConnect] = useState(() => new Set());
  const [busyDisconnect, setBusyDisconnect] = useState(() => new Set());

  const loadStatus = useCallback(async (platform) => {
    try {
      const response = await apiClient.get(`${platform.base}/connection`);
      const value = response?.[platform.responseKey] ?? null;
      setStatuses((current) => {
        const next = new Map(current);
        next.set(platform.id, value);
        return next;
      });
      return true;
    } catch (err) {
      console.error(`Failed to load ${platform.id} status`, err);
      setStatuses((current) => {
        const next = new Map(current);
        next.set(platform.id, null);
        return next;
      });
      return false;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled(PLATFORMS.map((p) => loadStatus(p)));
    const failures = results.filter((r) => r.status === "rejected" || r.value === false).length;
    if (failures > 0) {
      setError(`${failures} integration${failures === 1 ? "" : "s"} could not load their connection status. The rest are showing current state.`);
    }
    setLoading(false);
  }, [loadStatus]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleConnect(platform) {
    setError("");
    setBusyConnect((current) => {
      const next = new Set(current);
      next.add(platform.id);
      return next;
    });
    try {
      const response = await apiClient.post(platform.base + "/connect", platform.connectBody || undefined);
      const url = response?.authorize_url;
      if (!url) throw new Error("Authorize URL not returned by server.");
      window.location.href = url;
    } catch (err) {
      console.error(`${platform.id} connect failed`, err);
      setError(err?.message || `Could not start ${platform.label} connection.`);
      setBusyConnect((current) => {
        const next = new Set(current);
        next.delete(platform.id);
        return next;
      });
    }
  }

  async function handleDisconnect(platform) {
    if (!window.confirm(`Disconnect ${platform.label}? You'll need to reconnect to publish to it again.`)) return;
    setError("");
    setBusyDisconnect((current) => {
      const next = new Set(current);
      next.add(platform.id);
      return next;
    });
    setStatuses((current) => {
      const next = new Map(current);
      next.set(platform.id, null);
      return next;
    });
    try {
      const body = platform.disconnectBody;
      if (body !== undefined) {
        await apiClient.delete(platform.base + "/disconnect", { body });
      } else {
        await apiClient.delete(platform.base + "/disconnect");
      }
      await loadStatus(platform);
    } catch (err) {
      console.error(`${platform.id} disconnect failed`, err);
      setError(err?.message || `Could not disconnect ${platform.label}.`);
      await loadStatus(platform);
    } finally {
      setBusyDisconnect((current) => {
        const next = new Set(current);
        next.delete(platform.id);
        return next;
      });
    }
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Integrations"
        subtitle="Connect the platforms you publish to. After connecting, you'll be returned to the Social Planner."
      />

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{
              background: "var(--cth-command-panel-soft)",
              border: "1px solid var(--cth-command-crimson)",
              color: "var(--cth-command-ink)",
            }}
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-crimson)" }} />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}>
              <X size={12} />
            </button>
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              status={statuses.get(platform.id) ?? null}
              statusLoading={loading && !statuses.has(platform.id)}
              busyConnect={busyConnect.has(platform.id)}
              busyDisconnect={busyDisconnect.has(platform.id)}
              onConnect={() => handleConnect(platform)}
              onDisconnect={() => handleDisconnect(platform)}
            />
          ))}
        </section>

        <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
          {PLATFORMS.length} integrations available.
        </p>
      </main>
    </DashboardLayout>
  );
}
