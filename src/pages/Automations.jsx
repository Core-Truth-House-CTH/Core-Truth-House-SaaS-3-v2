import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const ADMIN_ROLES = ["SUPER_ADMIN", "OPS_ADMIN", "BILLING_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];

function localId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function triggerSchema(config, triggerType) {
  return (config?.triggers || []).find((t) => t.id === triggerType) || null;
}

function actionSchema(config, actionType) {
  return (config?.actions || []).find((a) => a.id === actionType) || null;
}

function fieldValueFrom(dict, fieldId) {
  if (!dict || typeof dict !== "object") return "";
  const value = dict[fieldId];
  if (value === undefined || value === null) return "";
  return String(value);
}

function emptyValueForField(field) {
  if (!field) return "";
  if (field.type === "number") return "";
  if (field.type === "select") return Array.isArray(field.options) && field.options.length ? field.options[0] : "";
  return "";
}

function buildDefaultsForType(schema) {
  const out = { type: schema?.id || "" };
  (schema?.fields || []).forEach((field) => {
    out[field.id] = emptyValueForField(field);
  });
  return out;
}

// =========================================================
// Sub-components
// =========================================================

function StatusBadge({ active }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{
        background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel-soft)",
        color: active ? "var(--cth-command-panel)" : "var(--cth-command-muted)",
        border: active ? "1px solid var(--cth-command-crimson)" : "1px solid var(--cth-command-border)",
      }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function TogglePill({ active, busy, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={busy}
      title={active ? "Disable" : "Enable"}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60"
      style={{
        background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel-soft)",
        color: active ? "var(--cth-command-panel)" : "var(--cth-command-muted)",
        border: "1px solid " + (active ? "var(--cth-command-crimson)" : "var(--cth-command-border)"),
      }}
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : (active ? <Check size={11} /> : <X size={11} />)}
      {active ? "On" : "Off"}
    </button>
  );
}

function DenialState() {
  return (
    <DashboardLayout>
      <TopBar title="Automations" subtitle="Admin access required." />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <section
          className="flex flex-col items-center rounded-xl p-8 text-center"
          style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
        >
          <Lock size={32} style={{ color: "var(--cth-command-muted)" }} />
          <h2 className="mt-3 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            Admin access required
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6" style={{ color: "var(--cth-command-muted)" }}>
            Automations are managed by workspace admins. Ask your admin to set one up, or head back to the Command Center.
          </p>
          <Link
            to="/command-center"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
          >
            Back to Command Center
          </Link>
        </section>
      </main>
    </DashboardLayout>
  );
}

function EmptyState({ onCreate }) {
  return (
    <section
      className="rounded-xl p-8 text-center"
      style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}
    >
      <Zap size={32} className="mx-auto" style={{ color: "var(--cth-command-crimson)" }} />
      <h3 className="mt-3 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
        No automations yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: "var(--cth-command-muted)" }}>
        Automations run actions when triggers fire — send a notification when a campaign reaches a milestone,
        auto-tag a new lead when it enters the CRM, schedule a follow-up post when content is published.
        Build one to remove the manual step from a recurring workflow.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
        style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
      >
        <Plus size={13} /> Create your first automation
      </button>
    </section>
  );
}

function FieldRow({ field, value }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span
        className="shrink-0 font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--cth-command-muted)" }}
      >
        {field.label}
      </span>
      <span className="min-w-0 truncate" style={{ color: "var(--cth-command-ink)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function TriggerPanel({ config, trigger }) {
  const schema = triggerSchema(config, trigger?.type);
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
        Trigger
      </p>
      <p className="mt-1 font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>
        {schema?.label || trigger?.type || "Unknown trigger"}
      </p>
      {schema?.description ? (
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>{schema.description}</p>
      ) : null}
      {schema?.fields?.length ? (
        <div className="mt-2 space-y-1">
          {schema.fields.map((field) => (
            <FieldRow key={field.id} field={field} value={fieldValueFrom(trigger, field.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActionsPanel({ config, actions }) {
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
        Actions
      </p>
      {actions && actions.length ? (
        <ol className="mt-1 space-y-2">
          {actions.map((action, index) => {
            const schema = actionSchema(config, action?.type);
            return (
              <li key={index} className="rounded-md p-2"
                style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
                <p className="font-serif text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }}>
                  {index + 1}. {schema?.label || action?.type || "Unknown action"}
                </p>
                {schema?.fields?.length ? (
                  <div className="mt-1.5 space-y-1">
                    {schema.fields.map((field) => (
                      <FieldRow key={field.id} field={field} value={fieldValueFrom(action, field.id)} />
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-1 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>No actions configured.</p>
      )}
    </div>
  );
}

function ConditionsPanel({ conditions }) {
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
        Conditions
      </p>
      {conditions && conditions.length ? (
        <ol className="mt-1 space-y-1 text-[11px]" style={{ color: "var(--cth-command-ink)" }}>
          {conditions.map((cond, index) => (
            <li key={index} className="rounded-sm px-2 py-1"
              style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
              {JSON.stringify(cond)}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-1 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
          No conditions — runs every time the trigger fires.
        </p>
      )}
    </div>
  );
}

function TestResultBanner({ result }) {
  if (!result) return null;
  return (
    <div className="rounded-md p-2 text-[11px]"
      style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}>
      <span className="font-semibold" style={{ color: "var(--cth-command-crimson)" }}>
        Last test:
      </span>{" "}
      {result.status || "ok"} · {formatDateTime(result.executed_at)}{result.details ? ` — ${result.details}` : ""}
    </div>
  );
}

function AutomationRow({
  automation, config, expanded, busyToggle, busyTest, testResult,
  onToggleExpand, onToggleActive, onTest, onEdit, onDelete,
}) {
  const triggerLabel = triggerSchema(config, automation.trigger?.type)?.label || automation.trigger?.type || "—";
  return (
    <li className="rounded-xl"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
          style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-crimson)" }}>
          <Zap size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {automation.name || "Untitled automation"}
          </p>
          <p className="truncate text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            {triggerLabel}
            {automation.description ? ` · ${automation.description}` : ""}
          </p>
        </div>
        <StatusBadge active={!!automation.is_active} />
        <TogglePill active={!!automation.is_active} busy={busyToggle} onClick={onToggleActive} />
        <span style={{ color: "var(--cth-command-muted)" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t p-3" style={{ borderColor: "var(--cth-command-border)" }}>
          <TriggerPanel config={config} trigger={automation.trigger} />
          <ConditionsPanel conditions={automation.conditions} />
          <ActionsPanel config={config} actions={automation.actions} />

          <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            <span>Executed {automation.execution_count || 0}×</span>
            {automation.last_executed ? <span>· Last run {formatDateTime(automation.last_executed)}</span> : null}
            {automation.updated_at ? <span>· Updated {formatDateTime(automation.updated_at)}</span> : null}
          </div>

          <TestResultBanner result={testResult} />

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onTest} disabled={busyTest}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
              style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-ink)", border: "1px solid var(--cth-command-border)" }}>
              {busyTest ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
              Test
            </button>
            <button type="button" onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-ink)", border: "1px solid var(--cth-command-border)" }}>
              <Pencil size={11} /> Edit
            </button>
            <button type="button" onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-crimson)", border: "1px solid var(--cth-command-border)" }}>
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

// =========================================================
// Modal (create + edit)
// =========================================================

function DynamicField({ field, value, onChange }) {
  const baseStyle = {
    background: "var(--cth-command-blush)",
    border: "1px solid var(--cth-command-border)",
    color: "var(--cth-command-ink)",
  };
  const baseClass = "mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none";

  if (field.type === "textarea") {
    return (
      <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
        {field.label}
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className={`${baseClass} resize-y`} style={baseStyle} />
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
        {field.label}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={baseClass} style={baseStyle}>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }
  const htmlType = field.type === "number" ? "number" : field.type === "time" ? "time" : "text";
  return (
    <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
      {field.label}
      <input type={htmlType} value={value} onChange={(e) => onChange(e.target.value)}
        className={baseClass} style={baseStyle} />
    </label>
  );
}

function AutomationModal({ mode, automation, config, saving, error, onClose, onSubmit }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => {
    if (isEdit && automation) {
      return {
        name: automation.name || "",
        description: automation.description || "",
        trigger: { ...automation.trigger },
        conditions: automation.conditions || [],
        actions: (automation.actions || []).map((a) => ({ _key: localId(), ...a })),
        is_active: !!automation.is_active,
      };
    }
    const firstTrigger = config?.triggers?.[0];
    const firstAction = config?.actions?.[0];
    return {
      name: "",
      description: "",
      trigger: buildDefaultsForType(firstTrigger),
      conditions: [],
      actions: firstAction ? [{ _key: localId(), ...buildDefaultsForType(firstAction) }] : [],
      is_active: false,
    };
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeTriggerType(nextType) {
    const schema = triggerSchema(config, nextType);
    setForm((current) => ({ ...current, trigger: buildDefaultsForType(schema) }));
  }

  function updateTriggerField(fieldId, value) {
    setForm((current) => ({ ...current, trigger: { ...current.trigger, [fieldId]: value } }));
  }

  function changeActionType(actionKey, nextType) {
    const schema = actionSchema(config, nextType);
    setForm((current) => ({
      ...current,
      actions: current.actions.map((action) =>
        action._key === actionKey ? { _key: actionKey, ...buildDefaultsForType(schema) } : action
      ),
    }));
  }

  function updateActionField(actionKey, fieldId, value) {
    setForm((current) => ({
      ...current,
      actions: current.actions.map((action) =>
        action._key === actionKey ? { ...action, [fieldId]: value } : action
      ),
    }));
  }

  function addAction() {
    const schema = config?.actions?.[0];
    if (!schema) return;
    setForm((current) => ({
      ...current,
      actions: [...current.actions, { _key: localId(), ...buildDefaultsForType(schema) }],
    }));
  }

  function removeAction(actionKey) {
    setForm((current) => ({
      ...current,
      actions: current.actions.filter((action) => action._key !== actionKey),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      trigger: { ...form.trigger },
      conditions: form.conditions,
      actions: form.actions.map(({ _key, ...rest }) => rest),
      is_active: !!form.is_active,
    };
    onSubmit(payload);
  }

  const triggerSchemaCurrent = triggerSchema(config, form.trigger?.type);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      style={{ background: "rgba(13,0,16,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {isEdit ? "Edit automation" : "Create automation"}
          </h3>
          <button type="button" onClick={onClose}
            className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4 text-sm">
          <div className="space-y-2">
            <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)}
              placeholder="Name" maxLength={180}
              className="w-full rounded-md px-2.5 py-1.5 text-sm outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
            <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)}
              placeholder="Description (optional)" rows={2} maxLength={500}
              className="w-full resize-y rounded-md px-2.5 py-1.5 text-sm outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
          </div>

          <section className="rounded-md p-3"
            style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
              Trigger
            </p>
            <label className="mt-1 block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
              Type
              <select value={form.trigger?.type || ""} onChange={(e) => changeTriggerType(e.target.value)}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none"
                style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}>
                {(config?.triggers || []).map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            {triggerSchemaCurrent?.description ? (
              <p className="mt-1 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                {triggerSchemaCurrent.description}
              </p>
            ) : null}
            {triggerSchemaCurrent?.fields?.length ? (
              <div className="mt-2 space-y-2">
                {triggerSchemaCurrent.fields.map((field) => (
                  <DynamicField key={field.id} field={field}
                    value={fieldValueFrom(form.trigger, field.id)}
                    onChange={(value) => updateTriggerField(field.id, value)} />
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-md p-3"
            style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
                Actions
              </p>
              <button type="button" onClick={addAction}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                style={{ background: "var(--cth-command-panel)", color: "var(--cth-command-ink)", border: "1px solid var(--cth-command-border)" }}>
                <Plus size={11} /> Add action
              </button>
            </div>
            {form.actions.length === 0 ? (
              <p className="mt-2 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                Add at least one action.
              </p>
            ) : (
              <ol className="mt-2 space-y-3">
                {form.actions.map((action, index) => {
                  const schema = actionSchema(config, action.type);
                  return (
                    <li key={action._key} className="rounded-md p-2"
                      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
                          Action {index + 1}
                        </span>
                        <button type="button" onClick={() => removeAction(action._key)}
                          className="rounded-md p-1 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
                          style={{ color: "var(--cth-command-muted)" }} title="Remove">
                          <X size={11} />
                        </button>
                      </div>
                      <label className="mt-1 block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
                        Type
                        <select value={action.type || ""} onChange={(e) => changeActionType(action._key, e.target.value)}
                          className="mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none"
                          style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}>
                          {(config?.actions || []).map((a) => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </label>
                      {schema?.description ? (
                        <p className="mt-1 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                          {schema.description}
                        </p>
                      ) : null}
                      {schema?.fields?.length ? (
                        <div className="mt-2 space-y-2">
                          {schema.fields.map((field) => (
                            <DynamicField key={field.id} field={field}
                              value={fieldValueFrom(action, field.id)}
                              onChange={(value) => updateActionField(action._key, field.id, value)} />
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cth-command-muted)" }}>
            <input type="checkbox" checked={!!form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)} />
            Enable on save
          </label>

          {error ? (
            <p className="text-xs" style={{ color: "var(--cth-command-crimson)" }}>{error}</p>
          ) : null}
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: "1px solid var(--cth-command-border)" }}>
          <button type="button" onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ color: "var(--cth-command-muted)" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {isEdit ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Main component
// =========================================================

export default function Automations() {
  const { isSuperAdmin, userRole } = usePlan();
  const isAdmin = isSuperAdmin === true || ADMIN_ROLES.includes(userRole);

  const [config, setConfig] = useState({ triggers: [], actions: [], condition_operators: [] });
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [togglingIds, setTogglingIds] = useState(() => new Set());
  const [testingIds, setTestingIds] = useState(() => new Set());
  const [testResultsById, setTestResultsById] = useState(() => new Map());
  const [modalState, setModalState] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const [formError, setFormError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [configRes, listRes] = await Promise.all([
        apiClient.get("/api/automations/config").catch(() => null),
        apiClient.get("/api/automations").catch(() => null),
      ]);
      if (configRes) {
        setConfig({
          triggers: Array.isArray(configRes?.triggers) ? configRes.triggers : [],
          actions: Array.isArray(configRes?.actions) ? configRes.actions : [],
          condition_operators: Array.isArray(configRes?.condition_operators) ? configRes.condition_operators : [],
        });
      }
      setAutomations(Array.isArray(listRes?.automations) ? listRes.automations : []);
    } catch (err) {
      console.error("Failed to load automations", err);
      setError(err?.message || "Could not load automations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin, loadAll]);

  async function handleToggleActive(automation) {
    const next = !automation.is_active;
    setTogglingIds((current) => {
      const out = new Set(current);
      out.add(automation.id);
      return out;
    });
    setAutomations((current) => current.map((a) => (a.id === automation.id ? { ...a, is_active: next } : a)));
    try {
      await apiClient.post(`/api/automations/${automation.id}/toggle`);
    } catch (err) {
      console.error("Toggle failed", err);
      setAutomations((current) => current.map((a) => (a.id === automation.id ? { ...a, is_active: !next } : a)));
      setError(err?.message || "Could not toggle automation.");
    } finally {
      setTogglingIds((current) => {
        const out = new Set(current);
        out.delete(automation.id);
        return out;
      });
    }
  }

  async function handleTest(automation) {
    setTestingIds((current) => {
      const out = new Set(current);
      out.add(automation.id);
      return out;
    });
    setError("");
    try {
      const response = await apiClient.post(`/api/automations/${automation.id}/test`);
      if (response?.log) {
        setTestResultsById((current) => {
          const out = new Map(current);
          out.set(automation.id, response.log);
          return out;
        });
      }
      setAutomations((current) =>
        current.map((a) =>
          a.id === automation.id
            ? {
                ...a,
                execution_count: (a.execution_count || 0) + 1,
                last_executed: response?.log?.executed_at || a.last_executed,
              }
            : a
        )
      );
    } catch (err) {
      console.error("Test failed", err);
      setError(err?.message || "Could not test automation.");
    } finally {
      setTestingIds((current) => {
        const out = new Set(current);
        out.delete(automation.id);
        return out;
      });
    }
  }

  async function handleDelete(automation) {
    if (!window.confirm(`Delete "${automation.name || "this automation"}"? This cannot be undone.`)) return;
    const snapshot = automations;
    setAutomations((current) => current.filter((a) => a.id !== automation.id));
    setError("");
    try {
      await apiClient.delete(`/api/automations/${automation.id}`);
      if (expandedId === automation.id) setExpandedId(null);
    } catch (err) {
      console.error("Delete failed", err);
      setAutomations(snapshot);
      setError(err?.message || "Could not delete automation.");
    }
  }

  async function handleSubmitForm(payload) {
    setFormError("");
    if (!payload.name) { setFormError("Name is required."); return; }
    if (!payload.trigger?.type) { setFormError("Trigger type is required."); return; }
    if (!payload.actions || payload.actions.length === 0) { setFormError("Add at least one action."); return; }
    for (const action of payload.actions) {
      if (!action.type) { setFormError("Every action needs a type."); return; }
    }

    setSavingForm(true);
    try {
      if (modalState.mode === "edit") {
        const response = await apiClient.put(`/api/automations/${modalState.automation.id}`, payload);
        if (response?.id) {
          setAutomations((current) => current.map((a) => (a.id === response.id ? response : a)));
        } else {
          await loadAll();
        }
      } else {
        const response = await apiClient.post("/api/automations", payload);
        if (response?.id) {
          setAutomations((current) => [response, ...current]);
        } else {
          await loadAll();
        }
      }
      setModalState(null);
    } catch (err) {
      console.error("Save failed", err);
      setFormError(err?.message || "Could not save automation.");
    } finally {
      setSavingForm(false);
    }
  }

  if (!isAdmin) return <DenialState />;

  const headerAction = (
    <button
      type="button"
      onClick={() => { setFormError(""); setModalState({ mode: "create" }); }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
      style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
    >
      <Plus size={13} /> Create automation
    </button>
  );

  return (
    <DashboardLayout>
      <TopBar
        title="Automations"
        subtitle="Trigger actions when events happen across your workspace."
        action={headerAction}
      />

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {error ? (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-crimson)", color: "var(--cth-command-ink)" }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-crimson)" }} />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}>
              <X size={12} />
            </button>
          </div>
        ) : null}

        {loading && !automations.length ? (
          <div className="flex items-center gap-2 rounded-xl p-5 text-sm"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
            <Loader2 size={14} className="animate-spin" /> Loading automations...
          </div>
        ) : !automations.length ? (
          <EmptyState onCreate={() => { setFormError(""); setModalState({ mode: "create" }); }} />
        ) : (
          <ul className="space-y-3">
            {automations.map((automation) => (
              <AutomationRow
                key={automation.id}
                automation={automation}
                config={config}
                expanded={expandedId === automation.id}
                busyToggle={togglingIds.has(automation.id)}
                busyTest={testingIds.has(automation.id)}
                testResult={testResultsById.get(automation.id)}
                onToggleExpand={() => setExpandedId((current) => current === automation.id ? null : automation.id)}
                onToggleActive={() => handleToggleActive(automation)}
                onTest={() => handleTest(automation)}
                onEdit={() => { setFormError(""); setModalState({ mode: "edit", automation }); }}
                onDelete={() => handleDelete(automation)}
              />
            ))}
          </ul>
        )}

        {!loading && automations.length > 0 ? (
          <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            {automations.length} automation{automations.length === 1 ? "" : "s"} · sorted by most recently updated.
          </p>
        ) : null}
      </main>

      {modalState ? (
        <AutomationModal
          mode={modalState.mode}
          automation={modalState.mode === "edit" ? modalState.automation : null}
          config={config}
          saving={savingForm}
          error={formError}
          onClose={() => { if (!savingForm) setModalState(null); }}
          onSubmit={handleSubmitForm}
        />
      ) : null}
    </DashboardLayout>
  );
}
