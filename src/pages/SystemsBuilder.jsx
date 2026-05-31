import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { useBrandHealth } from "../context/BrandHealthContext";
import apiClient from "../lib/apiClient";
import {
  Plus,
  Loader2,
  X,
  Megaphone,
  ShoppingCart,
  Truck,
  Settings,
  AlertCircle,
  Wand2,
  Sparkles,
} from "lucide-react";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 12,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const SUBHEAD_STYLE = {
  fontFamily: SERIF,
  fontSize: 18,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.3,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--cth-command-ink)",
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--cth-command-muted)",
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  display: "block",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--cth-command-ink)",
  margin: 0,
};

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 8,
  padding: "10px 14px",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  padding: "10px 14px",
  lineHeight: 1.55,
  resize: "vertical",
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 8,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const DESTRUCTIVE_BUTTON_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "var(--cth-command-ivory)",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const ICON_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-muted)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 8,
  padding: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const CARD_FOOTER_BTN_STYLE = {
  flex: 1,
  textAlign: "center",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  padding: "7px 0",
  borderRadius: 8,
  border: "1px solid var(--cth-command-border)",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  cursor: "pointer",
};

const ADD_CARD_STYLE = {
  border: "1.5px dashed var(--cth-command-border)",
  borderRadius: 12,
  background: "var(--cth-command-panel-soft)",
  color: "var(--cth-command-muted)",
  minHeight: 180,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const STEP_ROW_STYLE = {
  display: "flex",
  gap: 10,
  background: "var(--cth-command-panel-soft)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 10,
  padding: 12,
};

const STEP_NUM_STYLE = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const ADD_STEP_STYLE = {
  width: "100%",
  border: "1.5px dashed var(--cth-command-border)",
  borderRadius: 10,
  background: "transparent",
  color: "var(--cth-command-muted)",
  padding: 10,
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const CATEGORIES = [
  {
    id: "marketing",
    name: "Marketing",
    icon: Megaphone,
    accent: "linear-gradient(90deg, #7a0c2e, #c8743b)",
    pillBg: "color-mix(in srgb, #7a0c2e 12%, transparent)",
    pillColor: "#7a0c2e",
  },
  {
    id: "sales",
    name: "Sales",
    icon: ShoppingCart,
    accent: "linear-gradient(90deg, var(--cth-command-crimson), var(--cth-command-cinnabar))",
    pillBg: "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
    pillColor: "var(--cth-command-crimson)",
  },
  {
    id: "delivery",
    name: "Delivery",
    icon: Truck,
    accent: "linear-gradient(90deg, var(--cth-command-gold), #e6cf8a)",
    pillBg: "color-mix(in srgb, var(--cth-command-gold) 18%, transparent)",
    pillColor: "#8a6d1f",
  },
  {
    id: "operations",
    name: "Operations",
    icon: Settings,
    accent: "linear-gradient(90deg, var(--cth-command-purple), #7a0c2e)",
    pillBg: "color-mix(in srgb, var(--cth-command-purple) 14%, transparent)",
    pillColor: "var(--cth-command-purple)",
  },
];

const EMPTY_FORM = {
  prompt: "",
  name: "",
  description: "",
  category: "marketing",
  steps: [{ title: "", description: "" }],
};

function normalizeStep(step = {}) {
  return {
    title: typeof step.title === "string" ? step.title : "",
    description: typeof step.description === "string" ? step.description : "",
  };
}

function normalizeSystem(item = {}) {
  return {
    id: item.id || item._id || "",
    name: typeof item.name === "string" ? item.name : "",
    description: typeof item.description === "string" ? item.description : "",
    category: typeof item.category === "string" ? item.category : "marketing",
    steps: Array.isArray(item.steps) ? item.steps.map(normalizeStep) : [],
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  };
}

function getCategoryInfo(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId) || CATEGORIES[0];
}

function buildSystemPayload(formData) {
  return {
    name: String(formData.name || "").trim(),
    description: String(formData.description || "").trim(),
    category: String(formData.category || "marketing").trim(),
    steps: Array.isArray(formData.steps)
      ? formData.steps
          .map((step) => ({
            title: String(step.title || "").trim(),
            description: String(step.description || "").trim(),
          }))
          .filter((step) => step.title)
      : [],
  };
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function hasFormContent(formData) {
  if ((formData.name || "").trim()) return true;
  if ((formData.description || "").trim()) return true;
  if ((formData.prompt || "").trim()) return true;
  if (
    Array.isArray(formData.steps) &&
    formData.steps.some(
      (step) => (step.title || "").trim() || (step.description || "").trim()
    )
  ) {
    return true;
  }
  return false;
}

function hasMeaningfulSteps(steps) {
  if (!Array.isArray(steps)) return false;
  return steps.some(
    (step) => (step.title || "").trim() || (step.description || "").trim()
  );
}

function isFormDirtyVsOriginal(formData, editingSystem) {
  if ((formData.prompt || "").trim()) return true;

  const original = editingSystem || {
    name: "",
    description: "",
    category: "marketing",
    steps: [],
  };

  if ((formData.name || "").trim() !== (original.name || "").trim()) return true;
  if ((formData.description || "").trim() !== (original.description || "").trim()) return true;
  if ((formData.category || "marketing") !== (original.category || "marketing")) return true;

  const steps = formData.steps || [];
  const originalSteps = original.steps || [];

  if (!editingSystem) {
    return hasMeaningfulSteps(steps);
  }

  if (steps.length !== originalSteps.length) return true;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const orig = originalSteps[i] || { title: "", description: "" };
    if ((step.title || "").trim() !== (orig.title || "").trim()) return true;
    if ((step.description || "").trim() !== (orig.description || "").trim()) return true;
  }

  return false;
}

function StepEditor({ index, step, onChange, onRemove, disableRemove = false }) {
  return (
    <div style={STEP_ROW_STYLE}>
      <span style={STEP_NUM_STYLE}>{index + 1}</span>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="text"
          value={step.title || ""}
          onChange={(event) => onChange(index, "title", event.target.value)}
          placeholder="Step title"
          style={INPUT_STYLE}
        />
        <textarea
          rows={2}
          value={step.description || ""}
          onChange={(event) => onChange(index, "description", event.target.value)}
          placeholder="What happens at this step and why"
          style={{ ...TEXTAREA_STYLE, minHeight: 64 }}
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={disableRemove}
        aria-label={`Remove step ${index + 1}`}
        style={{
          background: "transparent",
          border: "none",
          color: disableRemove ? "var(--cth-command-muted)" : "var(--cth-command-crimson)",
          cursor: disableRemove ? "not-allowed" : "pointer",
          opacity: disableRemove ? 0.4 : 1,
          alignSelf: "flex-start",
          padding: 4,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function CategoryBadge({ category }) {
  const Icon = category.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        background: category.pillBg,
        color: category.pillColor,
        borderRadius: 999,
        padding: "4px 10px",
        fontFamily: SANS,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      <Icon size={12} />
      {category.name}
    </span>
  );
}

function SystemCard({ system, onEdit, onDelete, onOpen }) {
  const category = getCategoryInfo(system.category);
  const stepCount = system.steps.length;

  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Category accent bar */}
      <div style={{ height: 3, width: "100%", background: category.accent }} aria-hidden="true" />

      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={category} />
          <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
            {stepCount} step{stepCount === 1 ? "" : "s"}
          </span>
        </div>

        <h3
          style={{
            fontFamily: SERIF,
            fontSize: 21,
            fontWeight: 600,
            color: "var(--cth-command-ink)",
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: "-0.005em",
          }}
        >
          {system.name || "Untitled system"}
        </h3>

        <p
          style={{
            fontFamily: SANS,
            fontSize: 12.5,
            color: "var(--cth-command-muted)",
            lineHeight: 1.5,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {system.description || "No description added yet."}
        </p>
      </div>

      <div
        className="flex items-center gap-2"
        style={{ padding: "12px 18px", borderTop: "1px solid var(--cth-command-border)" }}
      >
        <button type="button" onClick={() => onOpen(system)} style={CARD_FOOTER_BTN_STYLE}>
          View
        </button>
        <button type="button" onClick={() => onEdit(system)} style={CARD_FOOTER_BTN_STYLE}>
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(system)}
          style={{
            ...CARD_FOOTER_BTN_STYLE,
            color: "var(--cth-command-crimson)",
            borderColor: "color-mix(in srgb, var(--cth-command-crimson) 30%, var(--cth-command-border))",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function SystemsBuilder() {
  const { currentWorkspace } = useWorkspace();
  const { refresh: refreshBrandHealth } = useBrandHealth();

  const workspaceId =
    currentWorkspace?.id ||
    currentWorkspace?.workspace_id ||
    "";

  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showModal, setShowModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingFullSystem, setIsGeneratingFullSystem] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      setError("No active workspace found.");
      return;
    }

    loadSystems();
  }, [workspaceId]);

  async function loadSystems() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/api/systems");
      const items = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
      setSystems(items.map(normalizeSystem));
    } catch (err) {
      console.error("Failed to load systems:", err);
      setError(getErrorMessage(err, "Failed to load systems."));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData(EMPTY_FORM);
    setEditingSystem(null);
    setActiveSection(0);
    setGenerationError("");
  }

  function handleOpenModal(system = null) {
    setError("");
    setSuccessMessage("");
    setGenerationError("");

    if (system) {
      setEditingSystem(system);
      setFormData({
        prompt: "",
        name: system.name || "",
        description: system.description || "",
        category: system.category || "marketing",
        steps: system.steps?.length ? system.steps.map(normalizeStep) : [{ title: "", description: "" }],
      });
    } else {
      resetForm();
    }

    setActiveSection(0);
    setShowModal(true);
  }

  function handleCloseModalImmediate() {
    setShowModal(false);
    resetForm();
    setGenerationError("");
  }

  function handleCloseModal() {
    if (isFormDirtyVsOriginal(formData, editingSystem)) {
      if (!window.confirm("You have unsaved changes that will be lost if you close this. Discard them?")) {
        return;
      }
    }
    handleCloseModalImmediate();
  }

  function handleAddStep() {
    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), { title: "", description: "" }],
    }));
  }

  function handleStepChange(index, field, value) {
    setFormData((prev) => {
      const steps = [...(prev.steps || [])];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  }

  function handleRemoveStep(index) {
    if (!window.confirm("Remove this step?")) return;
    setFormData((prev) => {
      const steps = [...(prev.steps || [])];
      steps.splice(index, 1);
      return {
        ...prev,
        steps: steps.length ? steps : [{ title: "", description: "" }],
      };
    });
  }

  async function runGenerateSteps() {
    setIsGeneratingSteps(true);
    setGenerationError("");

    try {
      const response = await apiClient.post("/api/systems/generate-steps", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
      });

      const generated = Array.isArray(response?.steps) ? response.steps : [];
      const normalized = generated.length
        ? generated.map(normalizeStep)
        : [{ title: "", description: "" }];

      setFormData((prev) => ({ ...prev, steps: normalized }));
    } catch (err) {
      console.error("Failed to generate steps:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate steps."));
    } finally {
      setIsGeneratingSteps(false);
    }
  }

  async function runGenerateFullSystem() {
    const prompt =
      (formData.prompt || "").trim() ||
      [formData.name, formData.description].map((v) => (v || "").trim()).filter(Boolean).join(" — ");

    if (!prompt) {
      setGenerationError("Add a system name or description first so Zuri knows what to build.");
      return;
    }

    setIsGeneratingFullSystem(true);
    setGenerationError("");

    try {
      const response = await apiClient.post("/api/systems/generate-system", {
        prompt,
      });

      const result = response || {};
      setFormData((prev) => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        category: result.category || prev.category,
        steps: Array.isArray(result.steps) && result.steps.length
          ? result.steps.map(normalizeStep)
          : prev.steps,
      }));
    } catch (err) {
      console.error("Failed to generate full system:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate system."));
    } finally {
      setIsGeneratingFullSystem(false);
    }
  }

  function handleGenerateSteps() {
    if (hasMeaningfulSteps(formData.steps)) {
      if (!window.confirm("Generating new steps will replace all your current steps. This cannot be undone.")) {
        return;
      }
    }
    runGenerateSteps();
  }

  function handleGenerateFullSystem() {
    const hasContent =
      (formData.name || "").trim() ||
      (formData.description || "").trim() ||
      hasMeaningfulSteps(formData.steps);

    if (hasContent) {
      if (
        !window.confirm(
          "Generating a full system will replace your current name, description, category, and all steps. This cannot be undone."
        )
      ) {
        return;
      }
    }
    runGenerateFullSystem();
  }

  async function handleSaveSystem() {
    setError("");
    setSuccessMessage("");
    setGenerationError("");
    setSaving(true);

    try {
      const payload = buildSystemPayload(formData);

      if (!payload.name) {
        setGenerationError("System name is required.");
        setSaving(false);
        return;
      }

      if (editingSystem?.id) {
        await apiClient.put(`/api/systems/${editingSystem.id}`, payload);
        setSuccessMessage("System updated.");
      } else {
        await apiClient.post("/api/systems", payload);
        setSuccessMessage("System created.");
      }

      setShowModal(false);
      resetForm();
      setSearchQuery("");
      await loadSystems();
      refreshBrandHealth();
    } catch (err) {
      console.error("Failed to save system:", err);
      setError(getErrorMessage(err, "Failed to save system."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSystem(system) {
    if (!system?.id) return;

    if (
      !window.confirm(
        `Delete "${system.name || "Untitled system"}"? This permanently deletes the system and all its steps. This cannot be undone.`
      )
    ) {
      return;
    }

    const systemId = system.id;
    setDeletingId(systemId);
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.delete(`/api/systems/${systemId}`);
      setSuccessMessage("System deleted.");
      await loadSystems();
      refreshBrandHealth();
    } catch (err) {
      console.error("Failed to delete system:", err);
      setError(getErrorMessage(err, "Failed to delete system."));
    } finally {
      setDeletingId("");
    }
  }

  const filteredSystems = useMemo(() => {
    let list =
      selectedCategory === "all"
        ? systems
        : systems.filter((system) => system.category === selectedCategory);

    const term = searchQuery.trim().toLowerCase();
    if (term) {
      list = list.filter((system) =>
        (system.name || "").toLowerCase().includes(term)
      );
    }

    const sorted = [...list];
    switch (sortOrder) {
      case "oldest":
        sorted.sort((a, b) =>
          String(a.created_at || "").localeCompare(String(b.created_at || ""))
        );
        break;
      case "name-asc":
        sorted.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          String(b.name || "").localeCompare(String(a.name || ""))
        );
        break;
      case "category":
        sorted.sort((a, b) =>
          String(a.category || "").localeCompare(String(b.category || ""))
        );
        break;
      case "newest":
      default:
        sorted.sort((a, b) =>
          String(b.created_at || "").localeCompare(String(a.created_at || ""))
        );
        break;
    }

    return sorted;
  }, [systems, selectedCategory, searchQuery, sortOrder]);

  const categoryFilterStyle = (active) =>
    active
      ? {
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
          border: "1px solid var(--cth-command-purple)",
          borderRadius: 999,
          padding: "8px 14px",
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }
      : {
          background: "transparent",
          color: "var(--cth-command-muted)",
          border: "1px solid var(--cth-command-border)",
          borderRadius: 999,
          padding: "8px 14px",
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        };

  const isAllFilter = selectedCategory === "all";
  const activeCategoryName = isAllFilter
    ? ""
    : getCategoryInfo(selectedCategory).name;

  const overviewComplete = (formData.name || "").trim().length > 0;
  const stepsComplete = hasMeaningfulSteps(formData.steps);
  const completedSections = (overviewComplete ? 1 : 0) + (stepsComplete ? 1 : 0);
  const modalTitle =
    (formData.name || "").trim() || (editingSystem ? "Edit system" : "New system");
  const MODAL_SECTIONS = [
    { id: 0, label: "Overview", complete: overviewComplete },
    { id: 1, label: "Steps", complete: stepsComplete },
  ];

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Systems Builder
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {`${systems.length} system${systems.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            style={{
              padding: '8px 16px',
              background: 'var(--cth-command-crimson)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> New System
          </button>
        </div>
      </header>

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="systems-builder-page"
      >
        <div className="mx-auto max-w-[1200px] space-y-8">
          {/* Error / Success banners */}
          {error ? (
            <div
              className="flex items-start gap-3"
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                padding: 14,
                color: "var(--cth-danger)",
                fontFamily: SANS,
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          ) : null}

          {successMessage ? (
            <div
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-command-success) 35%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-command-success) 8%, var(--cth-command-panel))",
                padding: 14,
                fontFamily: SANS,
                fontSize: 13,
                color: "var(--cth-command-success)",
                fontWeight: 500,
              }}
            >
              {successMessage}
            </div>
          ) : null}

          {/* Filter + new button row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                style={categoryFilterStyle(selectedCategory === "all")}
              >
                All
              </button>

              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const active = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    style={categoryFilterStyle(active)}
                  >
                    <Icon size={13} />
                    {category.name}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search systems..."
                data-testid="systems-search-input"
                style={{
                  background: "var(--cth-command-panel)",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontFamily: SANS,
                  fontSize: 13,
                  outline: "none",
                  width: 220,
                }}
              />

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                data-testid="systems-sort-select"
                style={{
                  background: "var(--cth-command-panel)",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontFamily: SANS,
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="category">Category</option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenModal()}
                data-testid="new-system-btn"
                style={PRIMARY_CTA_STYLE}
              >
                <Plus size={14} />
                New System
              </button>
            </div>
          </div>

          {/* List states */}
          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{ ...CARD_STYLE, minHeight: 240 }}
            >
              <div
                className="inline-flex items-center gap-3"
                style={{ fontFamily: SANS, color: "var(--cth-command-muted)" }}
              >
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: "var(--cth-command-crimson)" }}
                />
                Loading systems...
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSystems.length === 0 ? (
                <p
                  style={{
                    ...MUTED_STYLE,
                    gridColumn: "1 / -1",
                    fontSize: 13,
                    margin: 0,
                    padding: "4px 2px",
                  }}
                >
                  {searchQuery.trim()
                    ? `No systems matching "${searchQuery.trim()}". Try a different search or clear it.`
                    : isAllFilter
                    ? "No systems documented yet — add your first one to get started."
                    : `No ${activeCategoryName} systems yet — add one below.`}
                </p>
              ) : (
                filteredSystems.map((system) => (
                  <SystemCard
                    key={system.id || system.name}
                    system={system}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteSystem}
                    onOpen={handleOpenModal}
                  />
                ))
              )}

              <button
                type="button"
                onClick={() => {
                  if (selectedCategory !== "all") {
                    handleOpenModal();
                    setFormData((prev) => ({ ...prev, category: selectedCategory }));
                    return;
                  }
                  handleOpenModal();
                }}
                data-testid="add-system-card"
                style={ADD_CARD_STYLE}
              >
                <span style={{ fontSize: 26, lineHeight: 1 }}>+</span>
                Add another system
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create / edit modal */}
      {showModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingSystem ? "Edit System" : "New System"}
          onClick={handleCloseModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(13, 0, 16, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              borderRadius: 14,
              width: "100%",
              maxWidth: 760,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between"
              style={{
                gap: 16,
                padding: "18px 22px",
                borderBottom: "1px solid var(--cth-command-border)",
              }}
            >
              <div className="min-w-0">
                <h3
                  style={{
                    fontFamily: SERIF,
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--cth-command-ink)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {modalTitle}
                </h3>
                <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                  Document a repeatable operating system
                </p>
              </div>
              <div className="flex items-center" style={{ gap: 14, flexShrink: 0 }}>
                <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
                  {completedSections} of 2 complete
                </span>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    border: "1px solid var(--cth-command-border)",
                    background: "var(--cth-command-panel)",
                    color: "var(--cth-command-muted)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body: section nav + active section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* Section nav */}
              <div
                style={{
                  borderRight: "1px solid var(--cth-command-border)",
                  background: "var(--cth-command-panel-soft)",
                  padding: "14px 0",
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--cth-command-muted)",
                    margin: 0,
                    padding: "0 16px 8px",
                  }}
                >
                  Sections
                </p>
                {MODAL_SECTIONS.map((section) => {
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 16px",
                        cursor: "pointer",
                        background: active ? "var(--cth-command-panel)" : "transparent",
                        borderLeft: active
                          ? "2px solid var(--cth-command-crimson)"
                          : "2px solid transparent",
                        borderTop: "none",
                        borderRight: "none",
                        borderBottom: "none",
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: active ? 500 : 400,
                        color: active ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          fontFamily: SANS,
                          fontSize: 9,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          background: section.complete ? "var(--cth-command-success)" : "transparent",
                          color: section.complete ? "#fff" : "var(--cth-command-muted)",
                          border: section.complete
                            ? "1.5px solid var(--cth-command-success)"
                            : active
                            ? "1.5px solid var(--cth-command-crimson)"
                            : "1.5px solid var(--cth-command-border)",
                        }}
                      >
                        {section.complete ? "✓" : section.id + 1}
                      </span>
                      {section.label}
                    </button>
                  );
                })}
              </div>

              {/* Active section fields */}
              <div className="space-y-4" style={{ padding: "20px 22px", overflowY: "auto" }}>
                {generationError ? (
                  <div
                    style={{
                      ...CARD_STYLE,
                      borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
                      background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                      padding: 12,
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "var(--cth-danger)",
                    }}
                  >
                    {generationError}
                  </div>
                ) : null}

                {activeSection === 0 ? (
                  <>
                    <div>
                      <h4 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Overview</h4>
                      <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                        The essentials — what this system is and where it lives.
                      </p>
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>System name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Ex: Lead nurture workflow"
                        style={{ ...INPUT_STYLE, marginTop: 6 }}
                      />
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Description</label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, description: event.target.value }))
                        }
                        placeholder="What this system is for and why it matters..."
                        style={{ ...TEXTAREA_STYLE, marginTop: 6 }}
                      />
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Category</label>
                      <select
                        value={formData.category}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, category: event.target.value }))
                        }
                        style={{ ...INPUT_STYLE, marginTop: 6 }}
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Steps</h4>
                      <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                        Outline the sequence so this becomes a repeatable operating system.
                      </p>
                    </div>

                    {formData.steps.map((step, index) => (
                      <StepEditor
                        key={`step-${index}`}
                        index={index}
                        step={step}
                        onChange={handleStepChange}
                        onRemove={handleRemoveStep}
                        disableRemove={formData.steps.length <= 1}
                      />
                    ))}

                    <button type="button" onClick={handleAddStep} style={ADD_STEP_STYLE}>
                      <Plus size={14} />
                      Add step
                    </button>

                    {/* Zuri systems assist */}
                    <div style={{ background: "#1a0828", borderRadius: 10, padding: "14px 16px" }}>
                      <div className="flex items-center" style={{ gap: 7, marginBottom: 8 }}>
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            background: "var(--cth-command-cinnabar)",
                            color: "#fff",
                            fontFamily: SANS,
                            fontSize: 8,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Z
                        </span>
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 8,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#7a6090",
                          }}
                        >
                          Zuri · systems assist
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: SERIF,
                          fontStyle: "italic",
                          fontSize: 13,
                          color: "#e8dff0",
                          lineHeight: 1.45,
                          margin: "0 0 10px",
                        }}
                      >
                        “Name the system first, then let me draft the steps — or describe the whole
                        thing and I'll build it end to end.”
                      </p>
                      <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleGenerateSteps}
                          disabled={isGeneratingSteps}
                          style={{
                            fontFamily: SANS,
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 8,
                            padding: "7px 12px",
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "transparent",
                            color: "#e8dff0",
                            cursor: isGeneratingSteps ? "not-allowed" : "pointer",
                            opacity: isGeneratingSteps ? 0.6 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {isGeneratingSteps ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Wand2 size={13} />
                          )}
                          Generate steps
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateFullSystem}
                          disabled={isGeneratingFullSystem}
                          style={{
                            fontFamily: SANS,
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 8,
                            padding: "7px 12px",
                            border: "1px solid rgba(255,255,255,0.18)",
                            background: "transparent",
                            color: "#e8dff0",
                            cursor: isGeneratingFullSystem ? "not-allowed" : "pointer",
                            opacity: isGeneratingFullSystem ? 0.6 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {isGeneratingFullSystem ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Sparkles size={13} />
                          )}
                          Generate full system
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between"
              style={{
                gap: 10,
                padding: "14px 22px",
                borderTop: "1px solid var(--cth-command-border)",
                background: "var(--cth-command-panel-soft)",
              }}
            >
              <div>
                {activeSection > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
                    style={SECONDARY_BUTTON_STYLE}
                  >
                    ← Previous
                  </button>
                ) : null}
              </div>

              <div className="flex items-center" style={{ gap: 8 }}>
                <button type="button" onClick={handleCloseModal} style={SECONDARY_BUTTON_STYLE}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSystem}
                  disabled={saving}
                  data-testid="save-system-btn"
                  style={{
                    ...PRIMARY_CTA_STYLE,
                    background: "var(--cth-command-success)",
                    color: "#fff",
                    opacity: saving ? 0.65 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editingSystem ? "Save changes" : "Save system"}
                </button>
                {activeSection < MODAL_SECTIONS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSection((s) => Math.min(MODAL_SECTIONS.length - 1, s + 1))}
                    style={{
                      ...PRIMARY_CTA_STYLE,
                      background: "var(--cth-command-crimson)",
                      color: "#fff",
                    }}
                  >
                    Next →
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
