import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Workflow } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import EstateGate from "../components/EstateGate";
import { Field, FilterTabs, PageHeader, StatCard, StatusBadge } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { formatDate } from "../components/Cards";
import { useAsyncResource, useMutation } from "../hooks/useAsyncResource";
import { createAutomation, listAutomations } from "../api/contentStudioApi";
import {
  AUTOMATION_TRIGGER_TYPES,
  automationCreateSchema,
  validate,
} from "../schemas/contentStudioSchemas";

/**
 * Approved screen 6 — Content Studio Automations.
 *
 * This is a SEPARATE surface from the platform automation engine at
 * /automations, which remains untouched and continues to call /api/automations.
 * Everything here targets /api/content-studio/automations.
 */

const FILTERS = [
  { value: "all", label: "All Automations" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
];

function CreateAutomationForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", triggerType: "schedule" });
  const [errors, setErrors] = useState({});
  const creation = useMutation((payload) => createAutomation(payload));

  const submit = async (event) => {
    event.preventDefault();
    const candidate = {
      name: form.name,
      description: form.description,
      trigger: { type: form.triggerType },
      steps: [],
    };
    const result = validate(automationCreateSchema, candidate);
    setErrors(result.errors);
    if (!result.ok) return;

    const outcome = await creation.mutate(result.data);
    if (outcome.ok) {
      setForm({ name: "", description: "", triggerType: "schedule" });
      setOpen(false);
      onCreated();
    }
  };

  if (!open) {
    return (
      <button type="button" className="cs-btn cs-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={14} aria-hidden="true" />
        Create Automation
      </button>
    );
  }

  return (
    <form className="cs-card cs-card-pad" onSubmit={submit} noValidate style={{ marginBottom: 22 }}>
      <h2 className="cs-h2" style={{ fontSize: 18, marginBottom: 14 }}>
        New automation
      </h2>

      <Field label="Name" error={errors.name} required>
        <input
          className="cs-input"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="e.g. Weekly Digest"
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <input
          className="cs-input"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </Field>

      <Field label="Trigger" error={errors.trigger} required>
        <select
          className="cs-select"
          value={form.triggerType}
          onChange={(e) => setForm((p) => ({ ...p, triggerType: e.target.value }))}
        >
          {AUTOMATION_TRIGGER_TYPES.map((trigger) => (
            <option key={trigger.value} value={trigger.value}>
              {trigger.label}
            </option>
          ))}
        </select>
      </Field>

      {/* No status control is offered: the backend always persists a new
          automation as draft, so a status picker would be a false affordance. */}
      <p style={{ fontSize: 12, color: "var(--cs-ruby)", margin: "0 0 16px" }}>
        New automations are created as a <strong>draft</strong>. Activate it from its detail page once the
        steps are ready.
      </p>

      {creation.error ? <ErrorState error={creation.error} compact /> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" className="cs-btn cs-btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="cs-btn cs-btn-primary" disabled={creation.busy}>
          {creation.busy ? "Creating…" : "Create draft"}
        </button>
      </div>
    </form>
  );
}

function AutomationsInner() {
  const [filter, setFilter] = useState("all");
  const status = filter === "all" ? undefined : filter;
  const resource = useAsyncResource(() => listAutomations({ status }), [status]);

  const items = resource.data?.automations || [];

  const metrics = useMemo(() => {
    const active = items.filter((item) => item.status === "active").length;
    const runs = items.reduce((sum, item) => sum + Number(item.run_count || 0), 0);
    const successes = items.reduce((sum, item) => sum + Number(item.success_count || 0), 0);
    return {
      total: items.length,
      active,
      runs,
      // Success rate is only meaningful once runs exist.
      successRate: runs > 0 ? `${Math.round((successes / runs) * 100)}%` : null,
    };
  }, [items]);

  return (
    <div className="cs-page">
      <PageHeader
        title="Automations"
        subtitle="Workflows that run on your brand's behalf."
        actions={
          <EstateGate feature="Creating automations" mode="inline">
            <CreateAutomationForm onCreated={resource.reload} />
          </EstateGate>
        }
      />

      <div className="cs-grid cs-grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Automations" value={resource.error ? null : metrics.total} unavailable={Boolean(resource.error)} />
        <StatCard label="Active" value={resource.error ? null : metrics.active} unavailable={Boolean(resource.error)} />
        <StatCard label="Total Runs" value={resource.error ? null : metrics.runs} hint="All time" unavailable={Boolean(resource.error)} />
        <StatCard
          label="Success Rate"
          value={metrics.successRate}
          hint={metrics.successRate ? "Across recorded runs" : null}
          unavailable={!metrics.successRate}
        />
      </div>

      <FilterTabs tabs={FILTERS} value={filter} onChange={setFilter} label="Filter automations by status" />

      {resource.loading ? (
        <LoadingState label="Loading automations" />
      ) : resource.error ? (
        <ErrorState error={resource.error} onRetry={resource.reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No automations yet" : `No ${filter} automations`}
          description="Automations run your recurring content work on a trigger."
          icon={Workflow}
        />
      ) : (
        <div className="cs-table-wrap">
          <table className="cs-table cs-table-stack">
            <caption className="sr-only">Content Studio automations</caption>
            <thead>
              <tr>
                <th scope="col">Automation</th>
                <th scope="col">Trigger</th>
                <th scope="col">Status</th>
                <th scope="col">Last Run</th>
                <th scope="col">Runs</th>
                <th scope="col">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const runs = Number(item.run_count || 0);
                const rate = runs > 0 ? `${Math.round((Number(item.success_count || 0) / runs) * 100)}%` : "—";
                return (
                  <tr key={item.id}>
                    <td data-label="Automation">
                      <Link
                        to={`/content-studio/automations/${encodeURIComponent(item.id)}`}
                        style={{ color: "var(--cs-crimson)", textDecoration: "none", fontWeight: 500 }}
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td data-label="Trigger">{item.trigger?.type || "—"}</td>
                    <td data-label="Status">
                      <StatusBadge status={item.status} />
                    </td>
                    <td data-label="Last Run">{item.last_run_at ? formatDate(item.last_run_at) : "Never"}</td>
                    <td data-label="Runs">{runs}</td>
                    <td data-label="Success Rate">{rate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AutomationsPage() {
  return (
    <ContentStudioShell title="Automations">
      <AutomationsInner />
    </ContentStudioShell>
  );
}
