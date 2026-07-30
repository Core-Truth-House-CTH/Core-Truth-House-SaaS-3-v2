import React, { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Clapperboard, GripVertical, Plus, Trash2 } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import EstateGate from "../components/EstateGate";
import { Field, PageHeader } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useAsyncResource, useMutation } from "../hooks/useAsyncResource";
import { createStoryboard, listStoryboards, updateStoryboard } from "../api/contentStudioApi";
import {
  STORYBOARD_FORMATS,
  storyboardCreateSchema,
  validate,
} from "../schemas/contentStudioSchemas";

/** Approved screen 10 — Storyboard Builder. */

function newScene(index) {
  return {
    id: `scene-${Date.now()}-${index}`,
    order: index,
    title: `Scene ${index + 1}`,
    direction: "",
    voiceover: "",
    duration_seconds: 5,
    media_id: null,
    image_url: null,
  };
}

function SceneCard({ scene, index, total, onMove, onChange, onRemove, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        listStyle: "none",
        flexShrink: 0,
        width: 210,
      }}
    >
      <article className="cs-card" style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="cs-badge">Scene {index + 1}</span>
          <span
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${scene.title} by dragging`}
            style={{ cursor: disabled ? "not-allowed" : "grab", color: "var(--cs-tuscany)", display: "flex" }}
          >
            <GripVertical size={14} aria-hidden="true" />
          </span>
        </div>

        <div
          aria-hidden="true"
          style={{
            aspectRatio: "9 / 16",
            maxHeight: 150,
            borderRadius: "var(--cs-radius)",
            background: "var(--cs-blush)",
            display: "grid",
            placeItems: "center",
            marginBottom: 9,
          }}
        >
          {scene.image_url ? (
            <img src={scene.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--cs-radius)" }} />
          ) : (
            <Clapperboard size={18} style={{ color: "var(--cs-tuscany)" }} />
          )}
        </div>

        <label className="sr-only" htmlFor={`${scene.id}-title`}>
          Scene {index + 1} title
        </label>
        <input
          id={`${scene.id}-title`}
          className="cs-input"
          style={{ minHeight: 34, fontSize: 12, marginBottom: 6 }}
          value={scene.title}
          disabled={disabled}
          onChange={(event) => onChange({ ...scene, title: event.target.value })}
        />

        <label className="sr-only" htmlFor={`${scene.id}-direction`}>
          Scene {index + 1} direction
        </label>
        <textarea
          id={`${scene.id}-direction`}
          className="cs-textarea"
          style={{ minHeight: 56, fontSize: 12 }}
          placeholder="Direction…"
          value={scene.direction}
          disabled={disabled}
          onChange={(event) => onChange({ ...scene, direction: event.target.value })}
        />

        {/* Keyboard-accessible alternative to drag and drop. */}
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          <button
            type="button"
            className="cs-btn cs-btn-ghost"
            onClick={() => onMove(index, index - 1)}
            disabled={disabled || index === 0}
            aria-label={`Move ${scene.title} earlier`}
          >
            <ChevronLeft size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="cs-btn cs-btn-ghost"
            onClick={() => onMove(index, index + 1)}
            disabled={disabled || index === total - 1}
            aria-label={`Move ${scene.title} later`}
          >
            <ChevronRight size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="cs-btn cs-btn-ghost"
            onClick={() => onRemove(index)}
            disabled={disabled}
            aria-label={`Remove ${scene.title}`}
            style={{ marginLeft: "auto" }}
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </article>
    </li>
  );
}

function Builder({ storyboard, onSaved, disabled }) {
  const [scenes, setScenes] = useState(storyboard?.scenes?.length ? storyboard.scenes : []);
  const [announcement, setAnnouncement] = useState("");
  const saving = useMutation((payload) => updateStoryboard(storyboard.id, payload));

  useEffect(() => {
    setScenes(storyboard?.scenes || []);
  }, [storyboard?.id, storyboard?.scenes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const move = useCallback((from, to) => {
    if (to < 0) return;
    setScenes((prev) => {
      if (to >= prev.length) return prev;
      const next = arrayMove(prev, from, to);
      setAnnouncement(`${prev[from].title} moved to position ${to + 1} of ${prev.length}.`);
      return next;
    });
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = scenes.findIndex((s) => s.id === active.id);
    const to = scenes.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    move(from, to);
  };

  const save = async () => {
    const payload = { scenes: scenes.map((scene, index) => ({ ...scene, order: index })) };
    const result = await saving.mutate(payload);
    if (result.ok) onSaved(result.data);
  };

  return (
    <section aria-labelledby="cs-builder-heading" style={{ marginTop: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <h2 id="cs-builder-heading" className="cs-h2" style={{ fontSize: 19 }}>
          {storyboard.title}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="cs-btn cs-btn-secondary"
            onClick={() => setScenes((prev) => [...prev, newScene(prev.length)])}
            disabled={disabled}
          >
            <Plus size={13} aria-hidden="true" />
            Add Scene
          </button>
          <button type="button" className="cs-btn cs-btn-primary" onClick={save} disabled={disabled || saving.busy}>
            {saving.busy ? "Saving…" : "Save storyboard"}
          </button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {saving.error ? <ErrorState error={saving.error} compact /> : null}

      {scenes.length === 0 ? (
        <EmptyState title="No scenes yet" description="Add your first scene to begin building." icon={Clapperboard} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            <ul className="cs-scroll-x" style={{ display: "flex", gap: 12, padding: "4px 0 12px", margin: 0 }}>
              {scenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={index}
                  total={scenes.length}
                  disabled={disabled}
                  onMove={move}
                  onChange={(updated) =>
                    setScenes((prev) => prev.map((s, i) => (i === index ? updated : s)))
                  }
                  onRemove={(i) => setScenes((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function StoryboardsInner() {
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ title: "", format: "9:16" });
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const resource = useAsyncResource(() => listStoryboards(), []);
  const creation = useMutation((payload) => createStoryboard(payload));

  const items = resource.data?.storyboards || [];
  const selected = items.find((item) => item.id === selectedId) || items[0] || null;

  const submit = async (event) => {
    event.preventDefault();
    const result = validate(storyboardCreateSchema, { ...form, scenes: [] });
    setErrors(result.errors);
    if (!result.ok) return;
    const outcome = await creation.mutate(result.data);
    if (outcome.ok) {
      setForm({ title: "", format: "9:16" });
      setCreating(false);
      setSelectedId(outcome.data.id);
      resource.reload();
    }
  };

  return (
    <div className="cs-page">
      <PageHeader
        title="Storyboard Builder"
        subtitle="Build storyboards for videos, reels, or campaigns."
        actions={
          <EstateGate feature="Creating storyboards" mode="inline">
            <button type="button" className="cs-btn cs-btn-primary" onClick={() => setCreating((v) => !v)}>
              <Plus size={14} aria-hidden="true" />
              New storyboard
            </button>
          </EstateGate>
        }
      />

      {creating ? (
        <form className="cs-card cs-card-pad" onSubmit={submit} noValidate style={{ marginBottom: 22, maxWidth: 480 }}>
          <Field label="Title" error={errors.title} required>
            <input
              className="cs-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Summer Launch Film"
            />
          </Field>
          <Field label="Format" error={errors.format}>
            <select
              className="cs-select"
              value={form.format}
              onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
            >
              {STORYBOARD_FORMATS.map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </Field>
          {creation.error ? <ErrorState error={creation.error} compact /> : null}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" className="cs-btn cs-btn-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="cs-btn cs-btn-primary" disabled={creation.busy}>
              {creation.busy ? "Creating…" : "Create storyboard"}
            </button>
          </div>
        </form>
      ) : null}

      {resource.loading ? (
        <LoadingState label="Loading storyboards" />
      ) : resource.error ? (
        <ErrorState error={resource.error} onRetry={resource.reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No storyboards yet"
          description="Storyboards sequence your scenes before production."
          icon={Clapperboard}
        />
      ) : (
        <>
          <div className="cs-scroll-x" style={{ display: "flex", gap: 8, paddingBottom: 6 }}>
            {items.map((item) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={active}
                  style={{
                    flexShrink: 0,
                    minHeight: 36,
                    padding: "0 14px",
                    borderRadius: "var(--cs-radius-pill)",
                    border: `1px solid ${active ? "var(--cs-crimson)" : "var(--cs-border)"}`,
                    background: active ? "var(--cs-crimson)" : "var(--cs-panel)",
                    color: active ? "#fff" : "var(--cs-ruby)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "var(--cs-sans)",
                  }}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          {selected ? (
            <StoryboardGate storyboard={selected} onSaved={resource.reload} />
          ) : null}
        </>
      )}
    </div>
  );
}

/** Editing is Estate-gated; viewing an existing storyboard is not. */
function StoryboardGate({ storyboard, onSaved }) {
  return (
    <EstateGate feature="Editing storyboards" mode="block">
      <Builder storyboard={storyboard} onSaved={onSaved} disabled={false} />
    </EstateGate>
  );
}

export default function StoryboardsPage() {
  return (
    <ContentStudioShell title="Storyboards">
      <StoryboardsInner />
    </ContentStudioShell>
  );
}
