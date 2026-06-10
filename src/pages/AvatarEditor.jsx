import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Check,
  Circle,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import DeleteAvatarModal from "../components/audience/DeleteAvatarModal";
import PortraitGenModal from "../components/audience/PortraitGenModal";

// Portrait section at the top of the editor. Uses --cth-command-* variables;
// the only literal hex is #1a0828 for the dark panel (permitted).
function EditorPortrait({ avatar, busy, onGenerate, onUploadClick, onView }) {
  const src = avatar?.portrait_image_url
    ? apiClient.buildApiUrl(avatar.portrait_image_url)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          width: "100%",
          height: 150,
          borderRadius: 10,
          overflow: "hidden",
          position: "relative",
          background: "#1a0828",
          border: "0.5px solid var(--cth-command-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {busy ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.55)", fontFamily: SANS, fontSize: 11 }}>
            <Loader2 size={14} className="animate-spin" />
            Working on your portrait…
          </div>
        ) : src ? (
          <img
            src={src}
            alt={avatar?.name || "Avatar portrait"}
            onClick={onView}
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", display: "block" }}
          />
        ) : (
          <div style={{ color: "rgba(255,255,255,0.3)", fontFamily: SANS, fontSize: 11, letterSpacing: "0.08em" }}>
            No portrait yet
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--cth-command-crimson)",
            background: "transparent",
            border: "0.5px solid var(--cth-command-crimson)",
            borderRadius: 7,
            padding: "5px 11px",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Wand2 size={12} />
          Generate with Zuri
        </button>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={busy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--cth-command-muted)",
            background: "transparent",
            border: "0.5px solid var(--cth-command-border)",
            borderRadius: 7,
            padding: "5px 11px",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Upload size={12} />
          Upload photo
        </button>
      </div>
    </div>
  );
}

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const STAGE_OPTIONS = [
  { value: "unaware", label: "Unaware" },
  { value: "problem_aware", label: "Problem aware" },
  { value: "solution_aware", label: "Solution aware" },
  { value: "product_aware", label: "Product aware" },
  { value: "most_aware", label: "Most aware" },
];

const INITIAL_FORM = {
  name: "",
  stage: "problem_aware",
  core_fear: "",
  core_desire: "",
  primary_problem: "",
  emotional_trigger: "",
  description: "",
  surface_symptoms: [],
  where_they_are: [],
  objections: [],
  transformation_desired: "",
};

// ---- Reference palette (docs/references/CTH_avatar_editor_modal.html) ----
const C = {
  modalBg: "#f8f4f2",
  white: "#fff",
  ink: "#1a0828",
  muted: "#7c6576",
  border: "#e8d5d0",
  inputBorder: "#d8c5c3",
  navBg: "#faf7f5",
  crimson: "#5d0012",
  green: "#2d6a4f",
  track: "#f0e8e5",
  todoIcon: "#d8c5c3",
  todoText: "#b0a0b8",
  whyText: "#4a3860",
  tipText: "#3d2d4a",
  asterisk: "#e04e35",
  tagBg: "#f0e8e5",
  tagBorder: "#e0d0d8",
  zuriBg: "#1a0828",
  zuriLabel: "#7a6090",
  zuriText: "#e8dff0",
  zuriAccent: "#e04e35",
};

const SECTIONS = [
  {
    key: "identity",
    label: "Identity",
    title: "Identity",
    subtitle: "Name this avatar and define their awareness stage.",
    why: "A named, clearly positioned avatar gives every brand decision a specific human to answer to. Vague audiences produce vague brands.",
    tips: [
      "Give them a real name — it makes them feel like a person",
      "Stage defines how aware they are of their problem",
      "One primary avatar keeps your message focused",
    ],
    zuri: "“Start with the name of a real person you've served. Everything specific about that person is more useful than any generalized description.”",
    zuriButton: "Ask the House",
  },
  {
    key: "psychology",
    label: "Psychology",
    title: "Psychology",
    subtitle: "What drives them under the surface.",
    why: "People buy on emotion and justify with logic. When you know the fear and desire underneath, every message lands where the decision is actually made.",
    tips: [
      "Core fear is the worry they'd never say out loud",
      "Core desire is the outcome beneath the wish list",
      "Name the exact moment that pushes them to act",
    ],
    zuri: "“Don't write what they should feel. Write what they actually fear at 2am — that's where the real message lives.”",
    zuriButton: "Generate psychology draft",
  },
  {
    key: "behavior",
    label: "Behavior",
    title: "Behavior",
    subtitle: "What they do, where they go, and what holds them back.",
    why: "How they behave — the symptoms they notice, where they spend time, and the objections they raise — tells you where to show up and exactly what to say.",
    tips: [
      "Surface symptoms are what they'd describe out loud",
      "List the channels you can actually reach them in",
      "Write objections in their own words",
    ],
    zuri: "“List the words they'd actually use. Their objections, in their voice, become the copy that answers them.”",
    zuriButton: "Generate behavior draft",
  },
];

function validate(form, requireCoreFear) {
  const errors = {};
  if (!form.name?.trim()) errors.name = "Name is required.";
  else if (form.name.length > 200) errors.name = "Name must be 200 characters or fewer.";
  if (!form.stage) errors.stage = "Stage is required.";
  if (!form.core_desire?.trim()) errors.core_desire = "Core desire is required.";
  if (!form.primary_problem?.trim()) errors.primary_problem = "Primary problem is required.";
  if (!form.emotional_trigger?.trim()) errors.emotional_trigger = "Emotional trigger is required.";
  if (requireCoreFear && !form.core_fear?.trim()) errors.core_fear = "Core fear is required.";
  return errors;
}

// Which section a field error lives in, so we can jump the user there on save.
const FIELD_SECTION = {
  name: 0,
  stage: 0,
  core_fear: 1,
  core_desire: 1,
  primary_problem: 1,
  emotional_trigger: 1,
};

// ---- Small presentational helpers ----
function FieldShell({ label, required, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.muted,
          fontWeight: 500,
        }}
      >
        {label}
        {required && <span style={{ color: C.asterisk, marginLeft: 4 }}>*</span>}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 10, color: C.asterisk, marginTop: 1 }}>{error}</div>
      )}
    </div>
  );
}

const INPUT_STYLE = {
  padding: "8px 11px",
  background: C.white,
  border: `0.5px solid ${C.inputBorder}`,
  borderRadius: 8,
  fontSize: 12,
  color: C.ink,
  fontFamily: SANS,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  resize: "vertical",
  lineHeight: 1.6,
  minHeight: 64,
};

function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const addTag = (text) => {
    const t = (text || "").trim();
    if (!t) return;
    if (tags.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...tags, t]);
    setDraft("");
  };
  const removeTag = (index) => onChange(tags.filter((_, i) => i !== index));
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      style={{
        background: C.white,
        border: `0.5px solid ${C.inputBorder}`,
        borderRadius: 8,
        padding: "6px 10px",
        display: "flex",
        flexWrap: "wrap",
        gap: 5,
        alignItems: "center",
        minHeight: 38,
      }}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            background: C.tagBg,
            border: `0.5px solid ${C.tagBorder}`,
            borderRadius: 20,
            fontSize: 11,
            color: C.tipText,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            aria-label={`Remove ${tag}`}
            style={{
              fontSize: 10,
              color: C.muted,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft && addTag(draft)}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{
          border: "none",
          outline: "none",
          fontSize: 11,
          color: C.ink,
          fontFamily: SANS,
          minWidth: 80,
          background: "transparent",
          flex: 1,
        }}
      />
    </div>
  );
}

function WhyAndTips({ section }) {
  return (
    <>
      <div
        style={{
          background: C.white,
          border: `0.5px solid ${C.border}`,
          borderRadius: 10,
          padding: "10px 13px",
        }}
      >
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.muted,
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          Why this matters
        </div>
        <div style={{ fontSize: 11, color: C.whyText, lineHeight: 1.6 }}>
          {section.why}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
        {section.tips.map((tip, i) => (
          <div
            key={i}
            style={{
              background: C.white,
              border: `0.5px solid ${C.border}`,
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.muted,
                fontWeight: 500,
                marginBottom: 3,
              }}
            >
              Tip {i + 1}
            </div>
            <div style={{ fontSize: 10, color: C.tipText, lineHeight: 1.5 }}>{tip}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function ZuriCard({ section, onAssist }) {
  return (
    <div style={{ background: C.zuriBg, borderRadius: 10, padding: "11px 13px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img src="/zuri.png" alt="Zuri" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <span
          style={{
            fontSize: 8,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.zuriLabel,
          }}
        >
          Zuri · avatar assist
        </span>
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 12,
          color: C.zuriText,
          fontStyle: "italic",
          lineHeight: 1.5,
          marginBottom: 8,
        }}
      >
        {section.zuri}
      </div>
      <button
        type="button"
        onClick={onAssist}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 500,
          color: C.zuriAccent,
          background: "transparent",
          border: `0.5px solid rgba(224,78,53,0.4)`,
          borderRadius: 6,
          padding: "4px 10px",
          cursor: "pointer",
          fontFamily: SANS,
        }}
      >
        <Wand2 size={11} />
        {section.zuriButton}
      </button>
    </div>
  );
}

export default function AvatarEditor({
  avatarId: avatarIdProp,
  isNew: isNewProp,
  onClose,
} = {}) {
  const navigate = useNavigate();
  const params = useParams();
  // Modal usage passes props; legacy /audience/avatars/:id route falls back to params.
  const routeId = avatarIdProp !== undefined ? avatarIdProp : params.id;
  const isNew =
    isNewProp !== undefined ? isNewProp : !routeId || routeId === "new";
  const draftKey = `cth.audience.draft.${isNew ? "new" : routeId}`;
  const { activeWorkspaceId } = useWorkspace();

  const close = useCallback(() => {
    if (onClose) onClose();
    else navigate("/audience");
  }, [onClose, navigate]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [isPrimary, setIsPrimary] = useState(false);
  const [pendingPrimary, setPendingPrimary] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrimarySaving, setIsPrimarySaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const draftRestoredRef = useRef(false);
  const originalCoreFearWasEmptyRef = useRef(false);

  // --- Portrait state ---
  const [avatarData, setAvatarData] = useState(null);
  const [portraitBusy, setPortraitBusy] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const editorFileRef = useRef(null);
  const [models, setModels] = useState([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genModelId, setGenModelId] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  // Load existing avatar in edit mode
  useEffect(() => {
    if (isNew) {
      setIsLoading(false);
      return;
    }
    if (!activeWorkspaceId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get(API_PATHS.audience.avatarById(routeId));
        if (cancelled) return;
        const a = data?.avatar;
        if (!a) throw new Error("Avatar response missing.");
        setForm({
          name: a.name || "",
          stage: a.stage || "problem_aware",
          core_fear: a.core_fear || "",
          core_desire: a.core_desire || "",
          primary_problem: a.primary_problem || "",
          emotional_trigger: a.emotional_trigger || "",
          description: a.description || "",
          surface_symptoms: Array.isArray(a.surface_symptoms) ? a.surface_symptoms : [],
          where_they_are: Array.isArray(a.where_they_are) ? a.where_they_are : [],
          objections: Array.isArray(a.objections) ? a.objections : [],
          transformation_desired: a.transformation_desired || "",
        });
        setIsPrimary(!!a.is_primary);
        setAvatarData(a);
        originalCoreFearWasEmptyRef.current = !(a.core_fear || "").trim();
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 404) {
          toast.error("Avatar not found.");
          close();
          return;
        }
        toast.error("Failed to load avatar. Try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId, isNew, activeWorkspaceId, close]);

  // Restore localStorage draft once after initial load resolves
  useEffect(() => {
    if (draftRestoredRef.current) return;
    if (isLoading) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === "object") {
        setForm((prev) => ({ ...prev, ...draft }));
        toast.message("Restored unsaved draft.");
      }
    } catch {
      // ignore unparsable drafts
    }
  }, [draftKey, isLoading]);

  // Auto-save draft to localStorage every 10s
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(form));
      } catch {
        // quota / private mode — silently ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [form, draftKey, isLoading]);

  const setField = useCallback(
    (key) => (val) => {
      setForm((prev) => ({ ...prev, [key]: val }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    [],
  );

  // ---- Section completion (drives progress + nav states) ----
  const identityComplete = useMemo(() => !!form.name?.trim(), [form.name]);
  const psychologyComplete = useMemo(
    () =>
      ["core_fear", "core_desire", "primary_problem", "emotional_trigger"].every(
        (k) => form[k]?.trim(),
      ),
    [form.core_fear, form.core_desire, form.primary_problem, form.emotional_trigger],
  );
  const behaviorComplete = useMemo(
    () =>
      !!(
        form.transformation_desired?.trim() ||
        form.surface_symptoms.length ||
        form.where_they_are.length ||
        form.objections.length
      ),
    [
      form.transformation_desired,
      form.surface_symptoms,
      form.where_they_are,
      form.objections,
    ],
  );
  const sectionDone = [identityComplete, psychologyComplete, behaviorComplete];
  const completedCount = sectionDone.filter(Boolean).length;
  const progressPct = Math.round((completedCount / SECTIONS.length) * 100);

  const handleSave = async () => {
    const requireCoreFear = isNew || !originalCoreFearWasEmptyRef.current;
    const validation = validate(form, requireCoreFear);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      // Jump to the first section that has an error so the user can see it.
      const firstBad = Object.keys(validation)[0];
      if (firstBad in FIELD_SECTION) setActiveSection(FIELD_SECTION[firstBad]);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...form };
      if (isNew) {
        const data = await apiClient.post(API_PATHS.audience.avatars, payload);
        const created = data?.avatar;
        if (!created?.id) throw new Error("Create response missing avatar id.");
        if (pendingPrimary) {
          try {
            await apiClient.post(API_PATHS.audience.setPrimary(created.id));
          } catch {
            toast.error("Avatar created, but failed to set as primary.");
          }
        }
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        toast.success("Avatar created.");
        close();
      } else {
        await apiClient.patch(API_PATHS.audience.avatarById(routeId), payload);
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        toast.success("Avatar saved.");
        close();
      }
    } catch (err) {
      if (err?.status === 403) {
        const detail = err?.payload?.detail || err?.message;
        toast.error(detail || "Avatar limit reached. Upgrade to add more.");
      } else if (err?.status === 400) {
        toast.error(err?.payload?.detail || err?.message || "Invalid avatar data.");
      } else {
        toast.error(err?.message || "Failed to save avatar.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePrimary = async () => {
    if (isNew) {
      setPendingPrimary((v) => !v);
      return;
    }
    if (isPrimary) return; // backend has no "unset"; primary stays on
    setIsPrimarySaving(true);
    try {
      await apiClient.post(API_PATHS.audience.setPrimary(routeId));
      setIsPrimary(true);
      toast.success("Set as primary avatar.");
    } catch (err) {
      toast.error(err?.message || "Failed to set primary.");
    } finally {
      setIsPrimarySaving(false);
    }
  };

  const handleDeleted = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    toast.success("Avatar deleted.");
    close();
  };

  // Zuri avatar drafting has no backend endpoint yet — graceful placeholder.
  const handleZuriAssist = () => {
    toast.message("Zuri avatar drafting is coming soon.");
  };

  // ---- Portrait: generate (same draft + generate endpoints as the card) ----
  const openPortraitGen = useCallback(async () => {
    if (!avatarData?.id) return;
    setShowGenModal(true);
    setGenLoading(true);
    setGenPrompt(avatarData.portrait_prompt || "");
    setGenModelId("");
    try {
      let list = models;
      if (!list.length) {
        const res = await apiClient.get(API_PATHS.audience.portraitModels);
        list = Array.isArray(res?.models) ? res.models : [];
        setModels(list);
      }
      setGenModelId(
        avatarData.portrait_model && list.some((m) => m.id === avatarData.portrait_model)
          ? avatarData.portrait_model
          : list[0]?.id || "",
      );
      if (avatarData.portrait_prompt) {
        setGenPrompt(avatarData.portrait_prompt);
      } else {
        const draft = await apiClient.post(
          API_PATHS.audience.draftPortraitPrompt(avatarData.id),
          {},
        );
        setGenPrompt((draft?.prompt || "").trim());
      }
    } catch (err) {
      toast.error("Couldn't start portrait generation. Try again.");
    } finally {
      setGenLoading(false);
    }
  }, [avatarData, models]);

  const handleGeneratePortrait = useCallback(
    async (prompt, modelId) => {
      if (!avatarData?.id) return;
      setShowGenModal(false);
      setPortraitBusy(true);
      try {
        const res = await apiClient.post(
          API_PATHS.audience.generatePortrait(avatarData.id),
          { prompt, model_id: modelId },
        );
        if (res?.avatar) setAvatarData(res.avatar);
      } catch (err) {
        toast.error("Portrait generation failed. Try again.");
      } finally {
        setPortraitBusy(false);
      }
    },
    [avatarData],
  );

  // ---- Portrait: upload (new upload-portrait endpoint) ----
  const uploadPortrait = useCallback(
    async (file) => {
      if (!avatarData?.id || !file) return;
      setPortraitBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await apiClient.post(
          API_PATHS.audience.uploadPortrait(avatarData.id),
          fd,
        );
        if (res?.avatar) setAvatarData(res.avatar);
        toast.success("Portrait updated.");
      } catch (err) {
        toast.error("Photo upload failed. Try again.");
      } finally {
        setPortraitBusy(false);
      }
    },
    [avatarData],
  );

  const handleEditorFilePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("That image is larger than 5MB.");
      return;
    }
    uploadPortrait(file);
  };

  const primaryOn = isNew ? pendingPrimary : isPrimary;
  const section = SECTIONS[activeSection];
  const isLastSection = activeSection === SECTIONS.length - 1;

  const headerTitle = isNew ? "New avatar" : form.name?.trim() || "Avatar";

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,8,40,0.55)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: SANS,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: C.modalBg,
          borderRadius: 14,
          width: "100%",
          maxWidth: 820,
          maxHeight: "88vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 48px rgba(26,8,40,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px 12px",
            borderBottom: `0.5px solid ${C.border}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
            background: C.white,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 17,
                fontWeight: 500,
                color: C.ink,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {headerTitle}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Build a detailed portrait of your ideal client.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textAlign: "right",
                  marginBottom: 3,
                }}
              >
                {completedCount} of {SECTIONS.length} complete
              </div>
              <div
                style={{
                  width: 80,
                  height: 2,
                  background: C.track,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPct}%`,
                    background: C.green,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: C.track,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={11} color={C.muted} />
            </button>
          </div>
        </div>

        {/* Body: section nav + field area */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "136px 1fr",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Section nav */}
          <nav
            style={{
              borderRight: `0.5px solid ${C.border}`,
              padding: "12px 0",
              background: C.navBg,
            }}
          >
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.muted,
                padding: "0 13px 7px",
                fontWeight: 500,
              }}
            >
              Sections
            </div>
            {SECTIONS.map((s, i) => {
              const isActive = i === activeSection;
              const done = sectionDone[i] && !isActive;
              const iconColor = isActive ? C.crimson : done ? C.green : C.todoIcon;
              const textColor = isActive ? C.crimson : done ? C.muted : C.todoText;
              const Icon = isActive ? Pencil : done ? Check : Circle;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveSection(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    cursor: "pointer",
                    borderLeft: `2px solid ${isActive ? C.crimson : "transparent"}`,
                    width: "100%",
                    background: isActive ? C.white : "transparent",
                    border: "none",
                    borderLeftWidth: 2,
                    borderLeftStyle: "solid",
                    borderLeftColor: isActive ? C.crimson : "transparent",
                    textAlign: "left",
                  }}
                >
                  <Icon size={11} color={iconColor} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      color: textColor,
                      fontSize: 11,
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Field area */}
          <div
            style={{
              padding: "16px 18px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 11,
              minHeight: 0,
            }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: C.muted,
                  padding: "60px 0",
                  fontSize: 13,
                }}
              >
                <Loader2 size={16} className="animate-spin" />
                Loading avatar...
              </div>
            ) : (
              <>
                {!isNew ? (
                  <>
                    <input
                      ref={editorFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleEditorFilePicked}
                    />
                    <EditorPortrait
                      avatar={avatarData}
                      busy={portraitBusy}
                      onGenerate={openPortraitGen}
                      onUploadClick={() => editorFileRef.current?.click()}
                      onView={() => setLightboxOpen(true)}
                    />
                    <div style={{ height: "0.5px", background: C.border }} />
                  </>
                ) : null}
                <div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontSize: 17,
                      fontWeight: 500,
                      color: C.ink,
                    }}
                  >
                    {section.title}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {section.subtitle}
                  </div>
                </div>

                <WhyAndTips section={section} />

                {/* ---- Identity ---- */}
                {activeSection === 0 && (
                  <>
                    <FieldShell label="Avatar name" required error={errors.name}>
                      <input
                        type="text"
                        value={form.name}
                        maxLength={200}
                        onChange={(e) => setField("name")(e.target.value)}
                        placeholder="e.g., The Established Founder"
                        style={INPUT_STYLE}
                      />
                    </FieldShell>

                    <FieldShell label="Awareness stage" required error={errors.stage}>
                      <select
                        value={form.stage}
                        onChange={(e) => setField("stage")(e.target.value)}
                        style={INPUT_STYLE}
                      >
                        {STAGE_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </FieldShell>

                    {/* Primary avatar toggle */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: C.white,
                        border: `0.5px solid ${C.border}`,
                        borderRadius: 10,
                        padding: "10px 13px",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.ink }}>
                          Primary avatar
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          {primaryOn
                            ? isNew
                              ? "Will be set as the default after creation"
                              : "This is the default across campaigns and messaging"
                            : "Set as the default across campaigns and messaging"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleTogglePrimary}
                        disabled={isPrimarySaving || (!isNew && isPrimary)}
                        aria-pressed={primaryOn}
                        aria-label="Toggle primary avatar"
                        style={{
                          width: 34,
                          height: 18,
                          background: primaryOn ? C.crimson : C.todoIcon,
                          borderRadius: 20,
                          position: "relative",
                          cursor:
                            isPrimarySaving || (!isNew && isPrimary)
                              ? "default"
                              : "pointer",
                          flexShrink: 0,
                          border: "none",
                          padding: 0,
                          transition: "background 0.15s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            left: primaryOn ? 18 : 2,
                            width: 14,
                            height: 14,
                            background: "#fff",
                            borderRadius: "50%",
                            transition: "left 0.15s",
                          }}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* ---- Psychology ---- */}
                {activeSection === 1 && (
                  <>
                    <FieldShell
                      label="Core fear"
                      required={isNew || !originalCoreFearWasEmptyRef.current}
                      error={errors.core_fear}
                    >
                      <textarea
                        value={form.core_fear}
                        onChange={(e) => setField("core_fear")(e.target.value)}
                        placeholder="The deepest worry they carry, even if they'd never say it out loud."
                        style={TEXTAREA_STYLE}
                      />
                    </FieldShell>
                    <FieldShell label="Core desire" required error={errors.core_desire}>
                      <textarea
                        value={form.core_desire}
                        onChange={(e) => setField("core_desire")(e.target.value)}
                        placeholder="The outcome they truly want, beneath the tactical wish list."
                        style={TEXTAREA_STYLE}
                      />
                    </FieldShell>
                    <FieldShell
                      label="Primary problem"
                      required
                      error={errors.primary_problem}
                    >
                      <textarea
                        value={form.primary_problem}
                        onChange={(e) => setField("primary_problem")(e.target.value)}
                        placeholder="The specific problem your brand exists to solve for them."
                        style={TEXTAREA_STYLE}
                      />
                    </FieldShell>
                    <FieldShell
                      label="Emotional trigger"
                      required
                      error={errors.emotional_trigger}
                    >
                      <textarea
                        value={form.emotional_trigger}
                        onChange={(e) => setField("emotional_trigger")(e.target.value)}
                        placeholder="The moment or feeling that pushes them to finally take action."
                        style={TEXTAREA_STYLE}
                      />
                    </FieldShell>
                  </>
                )}

                {/* ---- Behavior ---- */}
                {activeSection === 2 && (
                  <>
                    <FieldShell label="Surface symptoms">
                      <TagInput
                        value={form.surface_symptoms}
                        onChange={setField("surface_symptoms")}
                        placeholder="Inconsistent posting, low engagement... (press Enter)"
                      />
                    </FieldShell>
                    <FieldShell label="Where they are">
                      <TagInput
                        value={form.where_they_are}
                        onChange={setField("where_they_are")}
                        placeholder="LinkedIn, founder Slack groups... (press Enter)"
                      />
                    </FieldShell>
                    <FieldShell label="Objections">
                      <TagInput
                        value={form.objections}
                        onChange={setField("objections")}
                        placeholder="Too expensive, too soon... (press Enter)"
                      />
                    </FieldShell>
                    <FieldShell label="Transformation desired">
                      <textarea
                        value={form.transformation_desired}
                        onChange={(e) =>
                          setField("transformation_desired")(e.target.value)
                        }
                        placeholder="The before-and-after picture from their point of view."
                        style={TEXTAREA_STYLE}
                      />
                    </FieldShell>
                  </>
                )}

                <ZuriCard section={section} onAssist={handleZuriAssist} />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 18px",
            borderTop: `0.5px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.navBg,
            flexShrink: 0,
          }}
        >
          {/* Left: Delete (edit only) + Previous */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  fontSize: 11,
                  color: C.asterisk,
                  background: C.white,
                  border: `0.5px solid rgba(224,78,53,0.4)`,
                  borderRadius: 7,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontFamily: SANS,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveSection((i) => Math.max(0, i - 1))}
              style={{
                fontSize: 11,
                color: C.muted,
                background: C.white,
                border: `0.5px solid ${C.inputBorder}`,
                borderRadius: 7,
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: SANS,
                visibility: activeSection === 0 ? "hidden" : "visible",
              }}
            >
              ← Previous
            </button>
          </div>

          {/* Center: Cancel + Save */}
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <button
              type="button"
              onClick={close}
              style={{
                fontSize: 11,
                color: C.muted,
                background: "transparent",
                border: "none",
                borderRadius: 7,
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: SANS,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#fff",
                background: C.green,
                border: "none",
                borderRadius: 7,
                padding: "6px 14px",
                cursor: isSaving ? "wait" : "pointer",
                fontFamily: SANS,
                opacity: isSaving ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Save avatar
            </button>
          </div>

          {/* Right: Next section */}
          <button
            type="button"
            onClick={() =>
              setActiveSection((i) => Math.min(SECTIONS.length - 1, i + 1))
            }
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#fff",
              background: C.crimson,
              border: "none",
              borderRadius: 7,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: SANS,
              visibility: isLastSection ? "hidden" : "visible",
            }}
          >
            {isLastSection ? "Behavior →" : `${SECTIONS[activeSection + 1].label} →`}
          </button>
        </div>
      </div>

      {showDeleteModal && !isNew && (
        <DeleteAvatarModal
          avatar={{ id: routeId, name: form.name }}
          onCancel={() => setShowDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}

      {showGenModal && avatarData && (
        <PortraitGenModal
          avatar={avatarData}
          models={models}
          prompt={genPrompt}
          onPromptChange={setGenPrompt}
          modelId={genModelId}
          onModelChange={setGenModelId}
          loading={genLoading}
          onGenerate={handleGeneratePortrait}
          onClose={() => setShowGenModal(false)}
        />
      )}

      {lightboxOpen && avatarData?.portrait_image_url && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            background: "rgba(13,0,16,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            cursor: "zoom-out",
          }}
        >
          <img
            src={apiClient.buildApiUrl(avatarData.portrait_image_url)}
            alt={avatarData.name || "Avatar portrait"}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "85vh", maxWidth: "90vw", objectFit: "contain", cursor: "default" }}
          />
        </div>
      )}
    </div>
  );
}
