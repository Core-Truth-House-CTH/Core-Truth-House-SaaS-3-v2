import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Inbox,
  Link2,
  Loader2,
  Plus,
  Radar,
  Trash2,
  X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";

const SANS = "'DM Sans', sans-serif";

// Fallbacks mirror backend buyer_signals.py — used until /meta resolves.
const LEVELS_FALLBACK = [
  { value: 1, label: "Recognition" },
  { value: 2, label: "Problem Ownership" },
  { value: 3, label: "Solution Curiosity" },
  { value: 4, label: "Offer Curiosity" },
  { value: 5, label: "Purchase Movement" },
];

const ENTITY_TYPES_FALLBACK = [
  "contact",
  "offer",
  "content",
  "campaign",
  "diagnostic",
  "relationship",
  "message",
];

// Level intensity ramp — cool/muted at recognition, warm/committed at purchase.
const LEVEL_COLOR = {
  1: "var(--cth-command-muted)",
  2: "var(--cth-command-ink)",
  3: "var(--cth-command-gold)",
  4: "var(--cth-command-crimson)",
  5: "var(--cth-command-purple)",
};

function sourceLabel(value) {
  const raw = String(value || "").replace(/_/g, " ");
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

function LevelBadge({ level, levels }) {
  const meta = levels.find((l) => l.value === level);
  const color = LEVEL_COLOR[level] || "var(--cth-command-muted)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{
        background: "var(--cth-command-panel-soft)",
        border: `1px solid ${color}`,
        color,
        fontFamily: SANS,
      }}
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
        style={{ background: color, color: "var(--cth-command-panel)" }}
      >
        {level}
      </span>
      {meta?.label || `Level ${level}`}
    </span>
  );
}

export default function SignalInbox() {
  const [levels, setLevels] = useState(LEVELS_FALLBACK);
  const [sources, setSources] = useState([]);
  const [entityTypes, setEntityTypes] = useState(ENTITY_TYPES_FALLBACK);

  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sourceFilter, setSourceFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const [busyId, setBusyId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadMeta = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATHS.buyerSignals.meta);
      if (Array.isArray(res?.levels) && res.levels.length) setLevels(res.levels);
      if (Array.isArray(res?.sources)) setSources(res.sources);
      if (Array.isArray(res?.entity_types)) setEntityTypes(res.entity_types);
    } catch (err) {
      // Non-fatal: fall back to the bundled enums.
      console.warn("Signal meta unavailable, using fallbacks", err);
    }
  }, []);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = {};
      if (sourceFilter) query.source = sourceFilter;
      if (levelFilter) query.level = levelFilter;
      const res = await apiClient.get(API_PATHS.buyerSignals.inbox(query));
      setSignals(Array.isArray(res?.signals) ? res.signals : []);
    } catch (err) {
      console.error("Failed to load signal inbox", err);
      setError(err?.message || "Could not load the signal inbox.");
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, levelFilter]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  async function handleDismiss(signal) {
    setBusyId(signal.id);
    setError("");
    try {
      await apiClient.patch(API_PATHS.buyerSignals.byId(signal.id), {
        status: "dismissed",
      });
      setSignals((cur) => cur.filter((s) => s.id !== signal.id));
    } catch (err) {
      setError(err?.message || "Could not dismiss this signal.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(signal) {
    setBusyId(signal.id);
    setError("");
    try {
      await apiClient.delete(API_PATHS.buyerSignals.byId(signal.id));
      setSignals((cur) => cur.filter((s) => s.id !== signal.id));
    } catch (err) {
      setError(err?.message || "Could not delete this signal.");
    } finally {
      setBusyId("");
    }
  }

  const pendingCount = signals.length;

  return (
    <DashboardLayout>
      <TopBar
        title="Signal Inbox"
        subtitle="Pending buyer signals awaiting your read. Confirm the ones that are real, dismiss the noise."
      />

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{
              background: "var(--cth-command-panel-soft)",
              border: "1px solid var(--cth-command-error)",
              color: "var(--cth-command-ink)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--cth-command-error)" }}
            />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}>
              <X size={12} />
            </button>
          </div>
        ) : null}

        {/* Toolbar: filters + log-signal */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-md px-2.5 py-1.5 text-xs font-semibold"
              style={{
                background: "var(--cth-command-panel)",
                border: "1px solid var(--cth-command-border)",
                color: "var(--cth-command-ink)",
                fontFamily: SANS,
              }}
            >
              <option value="">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {sourceLabel(s)}
                </option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="rounded-md px-2.5 py-1.5 text-xs font-semibold"
              style={{
                background: "var(--cth-command-panel)",
                border: "1px solid var(--cth-command-border)",
                color: "var(--cth-command-ink)",
                fontFamily: SANS,
              }}
            >
              <option value="">All levels</option>
              {levels.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.value} · {l.label}
                </option>
              ))}
            </select>
            {(sourceFilter || levelFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSourceFilter("");
                  setLevelFilter("");
                }}
                className="text-[11px] font-semibold underline"
                style={{ color: "var(--cth-command-muted)" }}
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)", fontFamily: SANS }}
          >
            <Plus size={13} /> Log a signal
          </button>
        </div>

        {/* List */}
        {loading && !signals.length ? (
          <div
            className="flex items-center gap-2 rounded-xl p-5 text-sm"
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-muted)",
            }}
          >
            <Loader2 size={14} className="animate-spin" /> Loading the inbox...
          </div>
        ) : !signals.length ? (
          <section
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}
          >
            <Radar size={32} className="mx-auto" style={{ color: "var(--cth-command-crimson)" }} />
            <h3 className="mt-3 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
              The inbox is clear
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: "var(--cth-command-muted)" }}>
              No pending buyer signals right now. Log one manually when you spot real buying
              behavior, and confirmed signals will roll up into Analytics.
            </p>
          </section>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => {
              const busy = busyId === signal.id;
              const connections = Array.isArray(signal.connections) ? signal.connections : [];
              return (
                <article
                  key={signal.id}
                  className="rounded-xl p-4"
                  style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelBadge level={signal.suggested_level} levels={levels} />
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", fontFamily: SANS }}
                    >
                      {sourceLabel(signal.source)}
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                      {formatDate(signal.created_at)}
                    </span>
                  </div>

                  {signal.signal_text ? (
                    <p className="mt-2.5 text-sm leading-6" style={{ color: "var(--cth-command-ink)" }}>
                      {signal.signal_text}
                    </p>
                  ) : null}
                  {signal.behavior_description ? (
                    <p className="mt-1 text-[13px] leading-6" style={{ color: "var(--cth-command-muted)" }}>
                      <span className="font-semibold">Behavior:</span> {signal.behavior_description}
                    </p>
                  ) : null}
                  {signal.founder_note ? (
                    <p
                      className="mt-2 rounded-md px-2.5 py-1.5 text-[12px] leading-5"
                      style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)" }}
                    >
                      <span className="font-semibold">Note:</span> {signal.founder_note}
                    </p>
                  ) : null}

                  {connections.length ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {connections.map((c, i) => (
                        <span
                          key={`${c.entity_type}-${c.entity_id}-${i}`}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: "var(--cth-command-panel-soft)",
                            border: "1px solid var(--cth-command-border)",
                            color: "var(--cth-command-muted)",
                          }}
                        >
                          <Link2 size={10} /> {sourceLabel(c.entity_type)}: {c.entity_id}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className="mt-3 flex items-center gap-2 pt-3"
                    style={{ borderTop: "1px solid var(--cth-command-border)" }}
                  >
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmTarget(signal)}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      style={{ background: "var(--cth-command-purple)", color: "var(--cth-command-gold)", fontFamily: SANS }}
                    >
                      <Check size={13} /> Confirm
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDismiss(signal)}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      style={{
                        background: "var(--cth-command-panel-soft)",
                        border: "1px solid var(--cth-command-border)",
                        color: "var(--cth-command-muted)",
                        fontFamily: SANS,
                      }}
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={13} />} Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(signal)}
                      title="Delete permanently"
                      className="ml-auto inline-flex items-center rounded-md p-1.5 disabled:opacity-50"
                      style={{ color: "var(--cth-command-muted)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && pendingCount > 0 ? (
          <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            {pendingCount} pending signal{pendingCount === 1 ? "" : "s"}.
          </p>
        ) : null}
      </main>

      {showCreate ? (
        <CreateSignalModal
          levels={levels}
          entityTypes={entityTypes}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            // New signals are pending → they belong at the top of the inbox.
            if (created) setSignals((cur) => [created, ...cur]);
          }}
          setError={setError}
        />
      ) : null}

      {confirmTarget ? (
        <ConfirmSignalModal
          signal={confirmTarget}
          levels={levels}
          entityTypes={entityTypes}
          onClose={() => setConfirmTarget(null)}
          onConfirmed={(id) => {
            setConfirmTarget(null);
            setSignals((cur) => cur.filter((s) => s.id !== id));
          }}
          setError={setError}
        />
      ) : null}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(51,3,60,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-5"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {title}
          </h3>
          <button type="button" onClick={onClose} style={{ color: "var(--cth-command-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const fieldLabelCls = "block text-[11px] font-semibold uppercase tracking-[0.12em]";
const fieldLabelStyle = { color: "var(--cth-command-muted)", fontFamily: SANS };
const inputCls = "mt-1 w-full rounded-md px-2.5 py-2 text-sm";
const inputStyle = {
  background: "var(--cth-command-panel-soft)",
  border: "1px solid var(--cth-command-border)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
};

function ConnectionEditor({ entityTypes, entityType, entityId, setEntityType, setEntityId }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className={fieldLabelCls} style={fieldLabelStyle}>
          Entity type
        </label>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className={inputCls}
          style={inputStyle}
        >
          <option value="">Select...</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {sourceLabel(t)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={fieldLabelCls} style={fieldLabelStyle}>
          Entity ID
        </label>
        <input
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          placeholder="e.g. contact id"
          className={inputCls}
          style={inputStyle}
        />
      </div>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50"
      style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)", fontFamily: SANS }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Create signal
// ---------------------------------------------------------------------------

function CreateSignalModal({ levels, entityTypes, onClose, onCreated, setError }) {
  const [signalText, setSignalText] = useState("");
  const [behavior, setBehavior] = useState("");
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = (signalText.trim() || behavior.trim()) && !saving;

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const connections = [];
      if (entityType && entityId.trim()) {
        connections.push({ entity_type: entityType, entity_id: entityId.trim() });
      }
      const res = await apiClient.post(API_PATHS.buyerSignals.create, {
        source: "manual",
        signal_text: signalText.trim(),
        behavior_description: behavior.trim(),
        suggested_level: Number(level),
        founder_note: note.trim(),
        connections,
      });
      onCreated(res?.signal || null);
    } catch (err) {
      setError(err?.message || "Could not log this signal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Log a buyer signal" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>
            What was the signal?
          </label>
          <textarea
            value={signalText}
            onChange={(e) => setSignalText(e.target.value)}
            rows={2}
            placeholder="What they said or did that reads as buying intent."
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>
            Behavior (optional)
          </label>
          <textarea
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            rows={2}
            placeholder="The observable behavior behind it."
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>
            Suggested level
          </label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls} style={inputStyle}>
            {levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value} · {l.label}
              </option>
            ))}
          </select>
        </div>
        <ConnectionEditor
          entityTypes={entityTypes}
          entityType={entityType}
          entityId={entityId}
          setEntityType={setEntityType}
          setEntityId={setEntityId}
        />
        <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
          A connection is optional now, but required before you can confirm.
        </p>
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>
            Founder note (optional)
          </label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div className="flex gap-2 pt-1">
          <PrimaryButton disabled={!canSave} onClick={submit}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Log signal
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Confirm signal — enforces the connect-before-confirm rule client-side too
// ---------------------------------------------------------------------------

function ConfirmSignalModal({ signal, levels, entityTypes, onClose, onConfirmed, setError }) {
  const existing = useMemo(
    () => (Array.isArray(signal.connections) ? signal.connections : []),
    [signal]
  );
  const [level, setLevel] = useState(signal.suggested_level || 1);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [saving, setSaving] = useState(false);

  const hasConnection = existing.length > 0 || (entityType && entityId.trim());
  const canConfirm = hasConnection && !saving;

  async function submit() {
    if (!canConfirm) return;
    setSaving(true);
    setError("");
    try {
      const payload = { status: "confirmed", confirmed_level: Number(level) };
      // Only send connections when adding a new one; otherwise leave the
      // server's existing list untouched.
      if (!existing.length && entityType && entityId.trim()) {
        payload.connections = [{ entity_type: entityType, entity_id: entityId.trim() }];
      }
      await apiClient.patch(API_PATHS.buyerSignals.byId(signal.id), payload);
      onConfirmed(signal.id);
    } catch (err) {
      setError(err?.message || "Could not confirm this signal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Confirm signal" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>
            Confirmed level
          </label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls} style={inputStyle}>
            {levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value} · {l.label}
              </option>
            ))}
          </select>
        </div>

        {existing.length ? (
          <p className="text-[12px]" style={{ color: "var(--cth-command-muted)" }}>
            Connected to{" "}
            {existing.map((c) => `${sourceLabel(c.entity_type)}: ${c.entity_id}`).join(", ")}.
          </p>
        ) : (
          <div className="space-y-1">
            <ConnectionEditor
              entityTypes={entityTypes}
              entityType={entityType}
              entityId={entityId}
              setEntityType={setEntityType}
              setEntityId={setEntityId}
            />
            <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
              A signal must be connected to at least one entity before it can be confirmed.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold"
            style={{
              background: "var(--cth-command-panel-soft)",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-muted)",
              fontFamily: SANS,
            }}
          >
            Cancel
          </button>
          <PrimaryButton disabled={!canConfirm} onClick={submit}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}
