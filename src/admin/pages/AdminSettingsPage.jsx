import React, { useEffect, useState } from "react";
import { Settings, ShieldCheck, SlidersHorizontal, Cog, RefreshCw, Loader2 } from "lucide-react";

import apiClient from "../../lib/apiClient";

function PanelCard({ title, subtitle, children, actions = null }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cth-command-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--cth-command-ink)]">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-[var(--cth-command-muted)]">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "rose" }) {
  const tones = {
    rose: "bg-[color-mix(in srgb, var(--cth-command-cinnabar) 14%, var(--cth-command-ivory))] text-[var(--cth-command-cinnabar)]",
    plum: "bg-[color-mix(in srgb, var(--cth-command-purple) 12%, var(--cth-command-ivory))] text-[var(--cth-command-purple)]",
    gold: "bg-[color-mix(in srgb, var(--cth-brand-secondary) 16%, var(--cth-command-ivory))] text-[var(--cth-warning-gold-deep)]",
    green: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-command-success)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.rose}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--cth-command-ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--cth-command-muted)]">{label}</div>
    </div>
  );
}

function StatusPill({ label, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[var(--cth-command-panel-soft)] text-[var(--cth-command-muted)]",
    success: "bg-[var(--cth-command-panel-soft)] text-[var(--cth-command-success)]",
    warning: "bg-[var(--cth-command-panel-soft)] text-[var(--cth-command-warning)]",
    danger: "bg-[var(--cth-command-panel-soft)] text-[var(--cth-command-error)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone] || tones.neutral}`}>
      {label}
    </span>
  );
}

function SocialRoutingPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/api/admin/social-routing");
      const payload = res?.data && typeof res.data === "object" ? res.data : res;
      setRows(payload?.routing || []);
    } catch (err) {
      setError(err?.payload?.detail || err?.message || "Could not load routing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleChange(workspaceId, mode) {
    setSavingId(workspaceId);
    setError("");
    setNotice("");
    try {
      await apiClient.put(`/api/admin/social-routing/${workspaceId}`, { mode });
      setRows((prev) =>
        prev.map((r) => (r.workspace_id === workspaceId ? { ...r, mode } : r))
      );
      setNotice(`Routing mode updated for ${workspaceId}`);
    } catch (err) {
      setError(err?.payload?.detail || err?.message || "Update failed.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cth-command-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--cth-command-ink)]">
            Social posting routing
          </div>
          <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
            Per-workspace routing mode. Direct uses first-party platform OAuth.
            Zernio / Ayrshare route through the aggregator API. Tenants can't change this.
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-command-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--cth-command-ink)] hover:bg-[var(--cth-command-ivory)]"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {notice ? (
        <div className="mx-5 mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mx-5 mt-4 rounded-lg border border-[var(--cth-command-cinnabar)] bg-[var(--cth-command-panel-soft)] px-3 py-2 text-xs font-semibold text-[var(--cth-command-cinnabar)]">
          {error}
        </div>
      ) : null}

      <div className="p-5">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-[var(--cth-command-muted)]">
            <Loader2 size={16} className="mr-2 animate-spin" />
            Loading workspaces…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-6 text-center text-sm text-[var(--cth-command-muted)]">
            No workspaces have a routing record yet. They appear here as soon as a
            tenant clicks Connect on any social platform.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--cth-command-muted)]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Workspace</th>
                  <th className="px-3 py-2 font-semibold">Mode</th>
                  <th className="px-3 py-2 font-semibold">Zernio profile</th>
                  <th className="px-3 py-2 font-semibold">Ayrshare profile</th>
                  <th className="px-3 py-2 font-semibold">Connections</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const wid = row.workspace_id;
                  const saving = savingId === wid;
                  const zernioPlatforms = row.zernio?.connected_platforms?.length || 0;
                  const ayrPlatforms = row.ayrshare?.connected_platforms?.length || 0;
                  return (
                    <tr key={wid} className="border-t border-[var(--cth-command-border)]">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[var(--cth-command-ink)]">
                          {row.workspace_name || wid}
                        </div>
                        {row.workspace_name ? (
                          <div className="text-xs text-[var(--cth-command-muted)]">{wid}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={row.mode || "direct"}
                          onChange={(e) => handleChange(wid, e.target.value)}
                          disabled={saving}
                          className="rounded-lg border border-[var(--cth-command-border)] bg-white px-2 py-1.5 text-xs font-semibold text-[var(--cth-command-ink)]"
                        >
                          <option value="direct">Direct</option>
                          <option value="zernio">Zernio</option>
                          <option value="ayrshare">Ayrshare</option>
                        </select>
                        {saving ? (
                          <Loader2 size={12} className="ml-2 inline animate-spin text-[var(--cth-command-muted)]" />
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-xs text-[var(--cth-command-muted)]">
                        {row.zernio?.profile_id ? row.zernio.profile_id : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-[var(--cth-command-muted)]">
                        {row.ayrshare?.profile_id ? row.ayrshare.profile_id : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-[var(--cth-command-muted)]">
                        {row.mode === "zernio"
                          ? `${zernioPlatforms} via Zernio`
                          : row.mode === "ayrshare"
                          ? `${ayrPlatforms} via Ayrshare`
                          : "Direct OAuth"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-command-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-command-purple) 12%, var(--cth-command-ivory))] text-[var(--cth-command-purple)]">
            <Settings size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-command-purple)]">Manage</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-command-ink)]">Settings</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-command-muted)]">
          Centralize platform defaults, governance preferences, and future admin configuration controls inside the new separated admin shell.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Governance Layer" value="Ready" tone="rose" />
        <StatCard icon={SlidersHorizontal} label="Platform Defaults" value="Planned" tone="plum" />
        <StatCard icon={Cog} label="System Controls" value="Next" tone="gold" />
        <StatCard icon={Settings} label="Admin Ownership" value="Active" tone="green" />
      </section>

      <SocialRoutingPanel />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard
          title="Settings Framework"
          subtitle="What this page will own in the new admin system"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Platform Defaults</div>
                  <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
                    Future home for app-wide defaults, behavior rules, and baseline system preferences.
                  </div>
                </div>
                <StatusPill label="Scaffolded" tone="success" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Governance Controls</div>
                  <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
                    Future controls for admin rules, platform policies, and configuration standards.
                  </div>
                </div>
                <StatusPill label="Next migration" tone="warning" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Operational Preferences</div>
                  <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
                    Future place for system-level preferences, environment defaults, and admin tuning.
                  </div>
                </div>
                <StatusPill label="Planned" tone="neutral" />
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Settings Workspace"
          subtitle="Native admin placeholder for configuration controls"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Default Behaviors</div>
              <div className="mt-2 text-sm text-[var(--cth-command-muted)]">
                Future home for system-wide defaults, admin toggles, and baseline app behavior rules.
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Governance Rules</div>
              <div className="mt-2 text-sm text-[var(--cth-command-muted)]">
                Future controls for permissions, platform-level standards, and configuration guardrails.
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Admin Preferences</div>
              <div className="mt-2 text-sm text-[var(--cth-command-muted)]">
                Future place for operational tuning, environment defaults, and admin-system preferences.
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
