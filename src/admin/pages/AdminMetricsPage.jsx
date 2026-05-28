import React from "react";
import { Gauge, LineChart, BarChart3, ShieldCheck } from "lucide-react";

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

export default function AdminMetricsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-command-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-command-cinnabar) 14%, var(--cth-command-ivory))] text-[var(--cth-command-cinnabar)]">
            <Gauge size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-command-purple)]">Build</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-command-ink)]">Metrics</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-command-muted)]">
          Centralize operational metrics, performance reporting, and future KPI governance inside the new separated admin shell.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Gauge} label="Metrics Surface" value="Ready" tone="rose" />
        <StatCard icon={LineChart} label="Trend Tracking" value="Planned" tone="plum" />
        <StatCard icon={BarChart3} label="KPI Reporting" value="Next" tone="gold" />
        <StatCard icon={ShieldCheck} label="Admin Ownership" value="Active" tone="green" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard
          title="Metrics Framework"
          subtitle="What this page will own in the new admin system"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Platform KPIs</div>
                  <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
                    Future home for top-level admin metrics, core KPIs, and operational reporting signals.
                  </div>
                </div>
                <StatusPill label="Scaffolded" tone="success" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Trend Analysis</div>
                  <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
                    Future controls for time-based tracking, growth review, and system performance comparisons.
                  </div>
                </div>
                <StatusPill label="Next migration" tone="warning" />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Reporting Governance</div>
                  <div className="mt-1 text-xs text-[var(--cth-command-muted)]">
                    Future place for metric definitions, reporting standards, and admin performance governance.
                  </div>
                </div>
                <StatusPill label="Planned" tone="neutral" />
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Metrics Workspace"
          subtitle="Native admin placeholder for reporting controls"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-command-ink)]">KPI Dashboard</div>
              <div className="mt-2 text-sm text-[var(--cth-command-muted)]">
                Future home for performance summaries, admin-facing KPIs, and system health indicators.
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Trend Modules</div>
              <div className="mt-2 text-sm text-[var(--cth-command-muted)]">
                Future controls for charts, comparisons, historical views, and performance movement.
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4">
              <div className="text-sm font-semibold text-[var(--cth-command-ink)]">Reporting Standards</div>
              <div className="mt-2 text-sm text-[var(--cth-command-muted)]">
                Future place to govern definitions, thresholds, and how operational success is measured.
              </div>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
