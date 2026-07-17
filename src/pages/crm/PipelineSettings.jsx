/**
 * Deal-pipeline configuration, mounted as the "Deal Pipelines" tab in Settings.
 *
 * A workspace's funnels live here: each pipeline is a named list of stages, and
 * each stage is typed open | won | lost (the name is cosmetic, the type is what
 * the summary's open/won math reads). This panel is the only place a funnel can
 * be edited; the CRM board just renders whatever this saves.
 *
 * THE LOAD-BEARING CONTRACT -- stage ids round-trip on save. The backend's PUT
 * tells "keep this stage" from "add a new one" by whether the stage carries an
 * id already on the pipeline: an existing id updates in place (its deals keep
 * pointing at it), no id mints a fresh stage. So an edited stage MUST be sent
 * back with its original id. Regenerating ids on every save would orphan every
 * deal into Unassigned -- exactly the failure this panel exists to prevent.
 * Kept stages carry `id`; only Add Stage produces a stage with `id: null`.
 *
 * Self-contained: it fetches GET /crm/pipelines on mount and reloads after every
 * mutation rather than inheriting data from CRMSuite, so it works standalone in
 * the Settings surface.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Star, Loader2, Save, Check, RefreshCw } from "lucide-react";

import apiClient from "../../lib/apiClient";
import API_PATHS from "../../lib/apiPaths";
import {
  SANS,
  SERIF,
  PANEL_STYLE,
  SOFT_PANEL_STYLE,
  INPUT_STYLE,
  SMALL_INPUT_STYLE,
  PRIMARY_BUTTON_STYLE,
  SECONDARY_BUTTON_STYLE,
  DESTRUCTIVE_OUTLINE_STYLE,
  EYEBROW_STYLE,
  Chip,
  IconButton,
} from "./crmUi";

// The three backend-valid stage types (STAGE_TYPES on the server). The label is
// what the admin sees; the value is what open/won/lost math keys off.
const STAGE_TYPE_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

// A fresh pipeline needs at least one stage (the backend rejects an empty list),
// so seed it with a minimal open -> won -> lost funnel the admin can rename.
const NEW_PIPELINE_STAGES = [
  { name: "Lead", type: "open" },
  { name: "Won", type: "won" },
  { name: "Lost", type: "lost" },
];

// A draft stage carries a client-only `key` for stable React list identity across
// reorders/renames. `id` is the server stage id (null for a not-yet-saved stage);
// only `id`/`name`/`type` are ever sent -- the payload model forbids extra fields.
function toDraft(pipeline) {
  return {
    id: pipeline.id,
    name: pipeline.name || "",
    is_default: !!pipeline.is_default,
    updated_at: pipeline.updated_at || "",
    stages: (pipeline.stages || []).map((stage) => ({
      key: stage.id,
      id: stage.id,
      name: stage.name || "",
      type: stage.type || "open",
    })),
  };
}

// The comparable shape of a draft: name + ordered {id,name,type}. Two drafts with
// the same signature are the same save, so this is how the Save button knows it
// has nothing to send.
function signature(draft) {
  if (!draft) return "";
  return JSON.stringify({
    name: draft.name.trim(),
    stages: draft.stages.map((s) => ({ id: s.id, name: s.name.trim(), type: s.type })),
  });
}

export default function PipelineSettings() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Id of the pipeline created this session via "New Pipeline" that hasn't yet
  // been through an explicit Save. "New Pipeline" auto-persists a default funnel,
  // so its draft matches server state and would leave Save disabled -- this flag
  // forces Save on for that fresh pipeline (see `dirty`). Cleared on save/delete.
  const [freshId, setFreshId] = useState("");

  // Monotonic source of keys for stages added this session -- never collides with
  // a server id, so React never confuses a new row with a kept one.
  const nextKey = useRef(1);

  const selected = useMemo(
    () => pipelines.find((p) => p.id === selectedId) || null,
    [pipelines, selectedId]
  );

  const load = useCallback(async ({ preferId } = {}) => {
    setError("");
    try {
      const res = await apiClient.get(API_PATHS.crm.pipelines);
      const list = res?.pipelines || [];
      setPipelines(list);
      setSelectedId((current) => {
        const target = preferId || current;
        if (target && list.some((p) => p.id === target)) return target;
        const fallback = list.find((p) => p.is_default) || list[0];
        return fallback ? fallback.id : "";
      });
    } catch (e) {
      setError(e?.message || "Could not load pipelines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Rebuild the editable draft from the selected pipeline whenever the selection
  // changes or that pipeline's updated_at moves (i.e. after a save/reload). This
  // is deliberately keyed on updated_at, not the whole object, so a save that
  // returns a fresh timestamp re-syncs the draft (new stage ids and all) while an
  // unrelated re-render does not clobber in-progress edits.
  useEffect(() => {
    if (selected) {
      setDraft(toDraft(selected));
      setConfirmingDelete(false);
    } else {
      setDraft(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.updated_at]);

  // A just-created pipeline is auto-persisted with a default funnel, so its draft
  // equals server state and dirty-gating alone would leave Save disabled -- a dead
  // button the moment the pipeline appears (click New Pipeline -> click Save ->
  // nothing). Treat that fresh pipeline as dirty until one explicit Save, so the
  // admin can commit the default draft as-is or tweak-then-commit.
  const dirty = useMemo(() => {
    if (!draft) return false;
    if (freshId && draft.id === freshId) return true;
    return selected ? signature(draft) !== signature(toDraft(selected)) : false;
  }, [draft, selected, freshId]);

  const updateStage = (key, patch) => {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }));
  };

  const addStage = () => {
    setDraft((d) => ({
      ...d,
      stages: [...d.stages, { key: `new_${nextKey.current++}`, id: null, name: "New Stage", type: "open" }],
    }));
  };

  const removeStage = (key) => {
    setDraft((d) => ({ ...d, stages: d.stages.filter((s) => s.key !== key) }));
  };

  const moveStage = (index, delta) => {
    setDraft((d) => {
      const next = index + delta;
      if (next < 0 || next >= d.stages.length) return d;
      const stages = [...d.stages];
      [stages[index], stages[next]] = [stages[next], stages[index]];
      return { ...d, stages };
    });
  };

  const save = async () => {
    if (!draft) return;
    setError("");

    if (!draft.name.trim()) {
      setError("Give the pipeline a name.");
      return;
    }
    if (!draft.stages.length) {
      setError("A pipeline needs at least one stage.");
      return;
    }
    if (draft.stages.some((s) => !s.name.trim())) {
      setError("Every stage needs a name.");
      return;
    }

    setSaving(true);
    try {
      // Kept stages carry their id; Add Stage rows carry id: null so the server
      // mints one. This is the round-trip that keeps deals attached.
      const payload = {
        name: draft.name.trim(),
        stages: draft.stages.map((s) => ({ id: s.id ?? null, name: s.name.trim(), type: s.type })),
        updated_at: draft.updated_at,
      };
      const res = await apiClient.put(API_PATHS.crm.pipelineById(draft.id), payload);
      await load({ preferId: res?.pipeline?.id || draft.id });
      setSavedAt(Date.now());
      // The fresh pipeline has now been committed once; drop the flag so Save
      // returns to dirty-gating and settles into the "Saved" state.
      setFreshId("");
    } catch (e) {
      // A removed stage still holding deals, or a stale updated_at, comes back as
      // a 409 whose detail names the fix. Surface it verbatim; keep the edits so
      // the admin can adjust rather than lose their work.
      setError(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id) => {
    setError("");
    setBusyAction(`default:${id}`);
    try {
      await apiClient.post(API_PATHS.crm.pipelineMakeDefault(id));
      await load({ preferId: id });
    } catch (e) {
      setError(e?.message || "Could not set the default pipeline.");
    } finally {
      setBusyAction("");
    }
  };

  const createPipeline = async () => {
    setError("");
    setBusyAction("create");
    try {
      const res = await apiClient.post(API_PATHS.crm.pipelines, {
        name: "New Pipeline",
        stages: NEW_PIPELINE_STAGES,
      });
      // Mark it fresh so Save is enabled until the admin commits it once.
      setFreshId(res?.pipeline?.id || "");
      await load({ preferId: res?.pipeline?.id });
    } catch (e) {
      setError(e?.message || "Could not create the pipeline.");
    } finally {
      setBusyAction("");
    }
  };

  const deletePipeline = async (id) => {
    setError("");
    setBusyAction(`delete:${id}`);
    try {
      await apiClient.delete(API_PATHS.crm.pipelineById(id));
      setConfirmingDelete(false);
      setFreshId("");
      await load();
    } catch (e) {
      setError(e?.message || "Could not delete the pipeline.");
    } finally {
      setBusyAction("");
    }
  };

  const canDelete = draft && !draft.is_default && pipelines.length > 1;

  return (
    <div className="mb-5" style={{ ...PANEL_STYLE, padding: 24 }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div style={EYEBROW_STYLE}>Customer Relationship Manager</div>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: "var(--cth-command-ink)", margin: "6px 0 0" }}>
            Deal Pipelines
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", margin: "8px 0 0", maxWidth: 560, lineHeight: 1.5 }}>
            Name your funnels and their stages. Each stage is typed open, won, or lost -- that type,
            not the name, drives the open/won math on the board. Renaming a stage or reordering it
            keeps every deal attached; removing a stage that still holds deals is blocked until you
            move them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          style={{ ...SECONDARY_BUTTON_STYLE, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: "color-mix(in srgb, var(--cth-command-crimson) 10%, var(--cth-command-panel))",
            border: "1px solid var(--cth-command-crimson)",
            color: "var(--cth-command-crimson)",
            fontFamily: SANS,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      {loading && !pipelines.length ? (
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)" }}>
          Loading pipelines...
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5 md:flex-row">
          {/* Pipeline list */}
          <div className="md:w-[240px] md:shrink-0">
            <div style={{ ...EYEBROW_STYLE, marginBottom: 10 }}>Pipelines</div>
            <div className="flex flex-col gap-2">
              {pipelines.map((pipeline) => {
                const active = pipeline.id === selectedId;
                return (
                  <button
                    key={pipeline.id}
                    type="button"
                    onClick={() => setSelectedId(pipeline.id)}
                    style={{
                      ...SOFT_PANEL_STYLE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "10px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: active ? "var(--cth-command-purple)" : "var(--cth-command-border)",
                    }}
                  >
                    <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: active ? 600 : 500, color: "var(--cth-command-ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pipeline.name}
                    </span>
                    {pipeline.is_default ? <Chip tone="gold">Default</Chip> : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={createPipeline}
              disabled={busyAction === "create"}
              style={{ ...SECONDARY_BUTTON_STYLE, width: "100%", marginTop: 10, opacity: busyAction === "create" ? 0.7 : 1 }}
            >
              {busyAction === "create" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              New Pipeline
            </button>
          </div>

          {/* Editor */}
          <div className="min-w-0 flex-1">
            {draft ? (
              <div style={{ ...SOFT_PANEL_STYLE, padding: 18 }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                    <label style={{ ...EYEBROW_STYLE, display: "block", marginBottom: 6 }}>Pipeline name</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Pipeline name"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div className="flex items-center gap-2" style={{ alignSelf: "flex-end" }}>
                    {draft.is_default ? (
                      <Chip tone="gold">Default</Chip>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeDefault(draft.id)}
                        disabled={busyAction === `default:${draft.id}`}
                        style={{ ...SECONDARY_BUTTON_STYLE, opacity: busyAction === `default:${draft.id}` ? 0.7 : 1 }}
                      >
                        {busyAction === `default:${draft.id}` ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                        Make default
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ ...EYEBROW_STYLE, margin: "20px 0 10px" }}>Stages</div>
                <div className="flex flex-col gap-2">
                  {draft.stages.map((stage, index) => (
                    <div
                      key={stage.key}
                      style={{
                        ...PANEL_STYLE,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                      }}
                    >
                      <div className="flex flex-col">
                        <IconButton label="Move stage up" onClick={() => moveStage(index, -1)}>
                          <ArrowUp size={14} />
                        </IconButton>
                        <IconButton label="Move stage down" onClick={() => moveStage(index, 1)}>
                          <ArrowDown size={14} />
                        </IconButton>
                      </div>
                      <input
                        value={stage.name}
                        onChange={(e) => updateStage(stage.key, { name: e.target.value })}
                        placeholder="Stage name"
                        style={{ ...SMALL_INPUT_STYLE, flex: "1 1 auto" }}
                      />
                      <select
                        value={stage.type}
                        onChange={(e) => updateStage(stage.key, { type: e.target.value })}
                        style={{ ...SMALL_INPUT_STYLE, width: 120, flex: "0 0 auto" }}
                      >
                        {STAGE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <IconButton label="Remove stage" tone="danger" onClick={() => removeStage(stage.key)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  ))}
                  {!draft.stages.length ? (
                    <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)", fontStyle: "italic", padding: "4px 2px" }}>
                      No stages yet. Add at least one before saving.
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={addStage}
                  style={{ ...SECONDARY_BUTTON_STYLE, marginTop: 10 }}
                >
                  <Plus size={14} />
                  Add stage
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginTop: 20, borderTop: "1px solid var(--cth-command-border)", paddingTop: 16 }}>
                  <div className="flex items-center gap-2">
                    {confirmingDelete ? (
                      <>
                        <button
                          type="button"
                          onClick={() => deletePipeline(draft.id)}
                          disabled={busyAction === `delete:${draft.id}`}
                          style={{ ...DESTRUCTIVE_OUTLINE_STYLE, opacity: busyAction === `delete:${draft.id}` ? 0.7 : 1 }}
                        >
                          {busyAction === `delete:${draft.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Confirm delete
                        </button>
                        <button type="button" onClick={() => setConfirmingDelete(false)} style={SECONDARY_BUTTON_STYLE}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        disabled={!canDelete}
                        title={
                          draft.is_default
                            ? "The default pipeline cannot be deleted."
                            : pipelines.length <= 1
                              ? "A workspace must keep at least one pipeline."
                              : "Delete this pipeline"
                        }
                        style={{ ...DESTRUCTIVE_OUTLINE_STYLE, opacity: canDelete ? 1 : 0.5, cursor: canDelete ? "pointer" : "not-allowed" }}
                      >
                        <Trash2 size={14} />
                        Delete pipeline
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || !dirty}
                    style={{
                      ...PRIMARY_BUTTON_STYLE,
                      opacity: saving || !dirty ? 0.6 : 1,
                      cursor: saving ? "wait" : !dirty ? "default" : "pointer",
                    }}
                  >
                    {saving ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : savedAt && !dirty ? (
                      <Check size={15} />
                    ) : (
                      <Save size={15} />
                    )}
                    {saving ? "Saving..." : savedAt && !dirty ? "Saved" : "Save pipeline"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)" }}>
                No pipeline selected.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
