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
  Copy,
  Check,
  Zap,
  Repeat,
  ShieldCheck,
  UserCheck,
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

const SUBHEAD_STYLE = {
  fontFamily: SERIF,
  fontSize: 18,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.3,
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

const TRIGGERS = [
  { id: "new_inquiry", name: "New Inquiry" },
  { id: "signed_contract", name: "Signed Contract" },
  { id: "content_planning", name: "Content Planning Day" },
  { id: "weekly_review", name: "Weekly Review" },
  { id: "new_hire", name: "New Hire" },
  { id: "on_demand", name: "On Demand" },
  { id: "custom", name: "Custom" },
];

const CADENCES = [
  { id: "once", name: "Once" },
  { id: "daily", name: "Daily" },
  { id: "weekly", name: "Weekly" },
  { id: "monthly", name: "Monthly" },
  { id: "per_client", name: "Per Client" },
  { id: "on_demand", name: "On Demand" },
];

const BRAND_CONNECTION_TYPES = [
  { id: "none", name: "None" },
  { id: "offer", name: "Link to an Offer" },
  { id: "avatar", name: "Link to an Audience Avatar" },
  { id: "pillar", name: "Link to a Content Pillar" },
];

// Fallback template definitions, used if GET /api/systems/templates fails.
const FALLBACK_TEMPLATES = [
  {
    template_type: "client_onboarding",
    name: "Client Onboarding",
    description: "Everything from signed contract to a client who feels taken care of.",
    os_steps_label: "Pulls from Strategic OS steps 1, 2, 9",
  },
  {
    template_type: "content_creation",
    name: "Content Creation",
    description: "Turn your strategy into a repeatable content production line.",
    os_steps_label: "Pulls from Strategic OS steps 5, 6, 7, 8",
  },
  {
    template_type: "lead_conversion",
    name: "Lead Conversion",
    description: "How an interested lead becomes a paying client.",
    os_steps_label: "Pulls from Strategic OS steps 2, 3, 9",
  },
  {
    template_type: "delivery",
    name: "Delivery and Fulfillment",
    description: "How the work gets done and delivered at a consistent standard.",
    os_steps_label: "Pulls from Strategic OS steps 1, 3",
  },
  {
    template_type: "brand_review",
    name: "Weekly Brand Review",
    description: "A recurring check-in to keep the brand on strategy.",
    os_steps_label: "Pulls from Strategic OS steps 1, 5, 7",
  },
];

const EMPTY_FORM = {
  prompt: "",
  name: "",
  description: "",
  category: "marketing",
  trigger: "",
  trigger_custom: "",
  output: "",
  cadence: "",
  runs_without_me: false,
  runs_without_me_note: "",
  assigned_to_name: "",
  assigned_to_role: "",
  brand_connection_type: "",
  brand_connection_id: "",
  strategic_os_source: "",
  steps: [{ title: "", description: "", who_does_this: "" }],
};

function normalizeStep(step = {}) {
  return {
    title: typeof step.title === "string" ? step.title : "",
    description: typeof step.description === "string" ? step.description : "",
    who_does_this: typeof step.who_does_this === "string" ? step.who_does_this : "",
  };
}

function normalizeSystem(item = {}) {
  return {
    id: item.id || item._id || "",
    name: typeof item.name === "string" ? item.name : "",
    description: typeof item.description === "string" ? item.description : "",
    category: typeof item.category === "string" ? item.category : "marketing",
    steps: Array.isArray(item.steps) ? item.steps.map(normalizeStep) : [],
    trigger: typeof item.trigger === "string" ? item.trigger : "",
    trigger_custom: typeof item.trigger_custom === "string" ? item.trigger_custom : "",
    output: typeof item.output === "string" ? item.output : "",
    cadence: typeof item.cadence === "string" ? item.cadence : "",
    runs_without_me: !!item.runs_without_me,
    runs_without_me_note: typeof item.runs_without_me_note === "string" ? item.runs_without_me_note : "",
    assigned_to_name: typeof item.assigned_to_name === "string" ? item.assigned_to_name : "",
    assigned_to_role: typeof item.assigned_to_role === "string" ? item.assigned_to_role : "",
    brand_connection_type: typeof item.brand_connection_type === "string" ? item.brand_connection_type : "",
    brand_connection_id: typeof item.brand_connection_id === "string" ? item.brand_connection_id : "",
    strategic_os_source: typeof item.strategic_os_source === "string" ? item.strategic_os_source : "",
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  };
}

function getCategoryInfo(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId) || CATEGORIES[0];
}

function triggerLabel(triggerId, custom) {
  if (!triggerId) return "";
  if (triggerId === "custom") return (custom || "").trim() || "Custom";
  const match = TRIGGERS.find((t) => t.id === triggerId);
  return match ? match.name : triggerId;
}

function cadenceLabel(cadenceId) {
  const match = CADENCES.find((c) => c.id === cadenceId);
  return match ? match.name : "";
}

function buildSystemPayload(formData) {
  const trigger = String(formData.trigger || "").trim();
  const connectionType = String(formData.brand_connection_type || "").trim();
  return {
    name: String(formData.name || "").trim(),
    description: String(formData.description || "").trim(),
    category: String(formData.category || "marketing").trim(),
    trigger: trigger || null,
    trigger_custom:
      trigger === "custom" ? String(formData.trigger_custom || "").trim() || null : null,
    output: String(formData.output || "").trim() || null,
    cadence: String(formData.cadence || "").trim() || null,
    runs_without_me: !!formData.runs_without_me,
    runs_without_me_note: formData.runs_without_me
      ? String(formData.runs_without_me_note || "").trim() || null
      : null,
    assigned_to_name: String(formData.assigned_to_name || "").trim() || null,
    assigned_to_role: String(formData.assigned_to_role || "").trim() || null,
    brand_connection_type: connectionType || null,
    brand_connection_id:
      connectionType && connectionType !== "none"
        ? String(formData.brand_connection_id || "").trim() || null
        : null,
    strategic_os_source: String(formData.strategic_os_source || "").trim() || null,
    steps: Array.isArray(formData.steps)
      ? formData.steps
          .map((step) => ({
            title: String(step.title || "").trim(),
            description: String(step.description || "").trim(),
            who_does_this: String(step.who_does_this || "").trim() || null,
          }))
          .filter((step) => step.title)
      : [],
  };
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function hasMeaningfulSteps(steps) {
  if (!Array.isArray(steps)) return false;
  return steps.some(
    (step) =>
      (step.title || "").trim() ||
      (step.description || "").trim() ||
      (step.who_does_this || "").trim()
  );
}

const SCALAR_DIRTY_FIELDS = [
  "name",
  "description",
  "trigger",
  "trigger_custom",
  "output",
  "cadence",
  "runs_without_me_note",
  "assigned_to_name",
  "assigned_to_role",
  "brand_connection_type",
  "brand_connection_id",
];

function isFormDirtyVsOriginal(formData, editingSystem) {
  if ((formData.prompt || "").trim()) return true;

  const original = editingSystem || {};

  if ((formData.category || "marketing") !== (original.category || "marketing")) return true;
  if (!!formData.runs_without_me !== !!original.runs_without_me) return true;

  for (const f of SCALAR_DIRTY_FIELDS) {
    const a = String(formData[f] ?? "").trim();
    const b = String(original[f] ?? "").trim();
    if (a !== b) return true;
  }

  const steps = formData.steps || [];
  const originalSteps = original.steps || [];

  if (!editingSystem) {
    return hasMeaningfulSteps(steps);
  }

  if (steps.length !== originalSteps.length) return true;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const orig = originalSteps[i] || { title: "", description: "", who_does_this: "" };
    if ((step.title || "").trim() !== (orig.title || "").trim()) return true;
    if ((step.description || "").trim() !== (orig.description || "").trim()) return true;
    if ((step.who_does_this || "").trim() !== (orig.who_does_this || "").trim()) return true;
  }

  return false;
}

function playbookToText(system) {
  const lines = [];
  lines.push((system.name || "Untitled playbook").toUpperCase());
  lines.push("");
  if (system.description) {
    lines.push(system.description);
    lines.push("");
  }
  const trig = triggerLabel(system.trigger, system.trigger_custom);
  if (trig) lines.push(`Trigger: ${trig}`);
  if (system.output) lines.push(`Produces: ${system.output}`);
  const cad = cadenceLabel(system.cadence);
  if (cad) lines.push(`Cadence: ${cad}`);
  if (system.assigned_to_name || system.assigned_to_role) {
    lines.push(
      `Owner: ${[system.assigned_to_name, system.assigned_to_role]
        .filter(Boolean)
        .join(" — ")}`
    );
  }
  lines.push(`Runs without me: ${system.runs_without_me ? "Yes" : "No"}`);
  if (system.runs_without_me && system.runs_without_me_note) {
    lines.push(`To run this without me: ${system.runs_without_me_note}`);
  }
  lines.push("");
  lines.push("STEPS");
  (system.steps || []).forEach((step, index) => {
    lines.push(`${index + 1}. ${step.title || ""}`);
    if (step.description) lines.push(`   ${step.description}`);
    if (step.who_does_this) lines.push(`   Who does this: ${step.who_does_this}`);
  });
  return lines.join("\n");
}

function Pill({ children, bg, color, icon: Icon }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: bg,
        color,
        borderRadius: 999,
        padding: "4px 9px",
        fontFamily: SANS,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {Icon ? <Icon size={11} /> : null}
      {children}
    </span>
  );
}

function CategoryBadge({ category }) {
  const Icon = category.icon;
  return (
    <Pill bg={category.pillBg} color={category.pillColor} icon={Icon}>
      {category.name}
    </Pill>
  );
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
        <input
          type="text"
          value={step.who_does_this || ""}
          onChange={(event) => onChange(index, "who_does_this", event.target.value)}
          placeholder="Who does this step? (e.g. Operations Lead)"
          style={{ ...INPUT_STYLE, fontSize: 12, padding: "8px 12px" }}
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

function PlaybookCard({ system, onEdit, onDelete, onView }) {
  const category = getCategoryInfo(system.category);
  const stepCount = system.steps.length;
  const trig = triggerLabel(system.trigger, system.trigger_custom);
  const cad = cadenceLabel(system.cadence);

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
          {system.name || "Untitled playbook"}
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

        {/* Operational badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          {trig ? (
            <Pill
              bg="color-mix(in srgb, var(--cth-command-purple) 12%, transparent)"
              color="var(--cth-command-purple)"
              icon={Zap}
            >
              {trig}
            </Pill>
          ) : null}
          {cad ? (
            <Pill
              bg="color-mix(in srgb, var(--cth-command-ink) 8%, transparent)"
              color="var(--cth-command-ink)"
              icon={Repeat}
            >
              {cad}
            </Pill>
          ) : null}
          {system.runs_without_me ? (
            <Pill
              bg="color-mix(in srgb, var(--cth-command-success) 16%, transparent)"
              color="var(--cth-command-success)"
              icon={ShieldCheck}
            >
              Delegate Ready
            </Pill>
          ) : null}
        </div>

        {system.assigned_to_role ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: SANS,
              fontSize: 11.5,
              color: "var(--cth-command-muted)",
            }}
          >
            <UserCheck size={12} />
            {system.assigned_to_role}
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center gap-2"
        style={{ padding: "12px 18px", borderTop: "1px solid var(--cth-command-border)" }}
      >
        <button type="button" onClick={() => onView(system)} style={CARD_FOOTER_BTN_STYLE}>
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

  // Brand Playbook additions
  const [osWorkflowId, setOsWorkflowId] = useState("");
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isGeneratingFromOs, setIsGeneratingFromOs] = useState(false);
  const [connectionItems, setConnectionItems] = useState([]);
  const [loadingConnectionItems, setLoadingConnectionItems] = useState(false);
  const [pillars, setPillars] = useState([]);
  const [loadingPillars, setLoadingPillars] = useState(false);
  const [viewingSystem, setViewingSystem] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      setError("No active workspace found.");
      return;
    }

    loadSystems();
    loadOsWorkflow();
    loadTemplates();
    loadPillars();
  }, [workspaceId]);

  // Fetch brand-connection items when the connection type changes inside an open modal.
  useEffect(() => {
    if (!showModal) return;
    const type = formData.brand_connection_type;
    if (type === "offer" || type === "avatar") {
      loadConnectionItems(type);
    } else {
      setConnectionItems([]);
    }
    if (type === "pillar") {
      loadPillars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, formData.brand_connection_type]);

  async function loadSystems() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/api/systems");
      const items = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
      setSystems(items.map(normalizeSystem));
    } catch (err) {
      console.error("Failed to load playbooks:", err);
      setError(getErrorMessage(err, "Failed to load playbooks."));
    } finally {
      setLoading(false);
    }
  }

  async function loadOsWorkflow() {
    try {
      const res = await apiClient.get("/api/os-workflow");
      const workflows = Array.isArray(res?.workflows) ? res.workflows : [];
      const mostRecent = workflows.find((w) => w?.id);
      setOsWorkflowId(mostRecent?.id || "");
    } catch {
      setOsWorkflowId("");
    }
  }

  async function loadTemplates() {
    try {
      const res = await apiClient.get("/api/systems/templates");
      const list = Array.isArray(res?.templates) ? res.templates : [];
      if (list.length) setTemplates(list);
    } catch {
      /* keep fallback templates */
    }
  }

  async function loadConnectionItems(type) {
    setLoadingConnectionItems(true);
    try {
      if (type === "offer") {
        const res = await apiClient.get("/api/offers");
        const items = (res?.offers || []).map((o) => ({
          id: o.id || o._id || "",
          name: o.name || "Untitled offer",
        }));
        setConnectionItems(items.filter((i) => i.id));
      } else if (type === "avatar") {
        const res = await apiClient.get("/api/audience/avatars");
        const items = (res?.avatars || []).map((a) => ({
          id: a.id || a._id || "",
          name: a.name || a.avatar_name || "Untitled avatar",
        }));
        setConnectionItems(items.filter((i) => i.id));
      }
    } catch {
      setConnectionItems([]);
    } finally {
      setLoadingConnectionItems(false);
    }
  }

  async function loadPillars() {
    setLoadingPillars(true);
    try {
      const res = await apiClient.get("/api/systems/pillars");
      setPillars(Array.isArray(res?.pillars) ? res.pillars.filter(Boolean) : []);
    } catch {
      setPillars([]);
    } finally {
      setLoadingPillars(false);
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
    setShowTemplatePicker(false);

    if (system) {
      setEditingSystem(system);
      setFormData({
        prompt: "",
        name: system.name || "",
        description: system.description || "",
        category: system.category || "marketing",
        trigger: system.trigger || "",
        trigger_custom: system.trigger_custom || "",
        output: system.output || "",
        cadence: system.cadence || "",
        runs_without_me: !!system.runs_without_me,
        runs_without_me_note: system.runs_without_me_note || "",
        assigned_to_name: system.assigned_to_name || "",
        assigned_to_role: system.assigned_to_role || "",
        brand_connection_type: system.brand_connection_type || "",
        brand_connection_id: system.brand_connection_id || "",
        strategic_os_source: system.strategic_os_source || "",
        steps: system.steps?.length
          ? system.steps.map(normalizeStep)
          : [{ title: "", description: "", who_does_this: "" }],
      });
    } else {
      resetForm();
    }

    setActiveSection(0);
    setShowModal(true);
  }

  function handleViewPlaybook(system) {
    setCopied(false);
    setViewingSystem(system);
  }

  function handleCloseModalImmediate() {
    setShowModal(false);
    setShowTemplatePicker(false);
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
      steps: [...(prev.steps || []), { title: "", description: "", who_does_this: "" }],
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
        steps: steps.length ? steps : [{ title: "", description: "", who_does_this: "" }],
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
        : [{ title: "", description: "", who_does_this: "" }];

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
      setGenerationError("Add a playbook name or description first so Zuri knows what to build.");
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
      console.error("Failed to generate full playbook:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate playbook."));
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
          "Generating a full playbook will replace your current name, description, category, and all steps. This cannot be undone."
        )
      ) {
        return;
      }
    }
    runGenerateFullSystem();
  }

  async function generateFromOs(templateType) {
    if (!osWorkflowId) {
      setGenerationError("No Strategic OS workflow found to generate from.");
      return;
    }
    setIsGeneratingFromOs(true);
    setGenerationError("");

    try {
      const res = await apiClient.post("/api/systems/generate-from-os", {
        template_type: templateType,
        workflow_id: osWorkflowId,
      });
      const pb = res?.playbook || {};
      setFormData((prev) => ({
        ...prev,
        name: pb.name || prev.name,
        description: pb.description || prev.description,
        category: pb.category || prev.category,
        trigger: pb.trigger || prev.trigger,
        trigger_custom: prev.trigger_custom,
        output: pb.output || prev.output,
        cadence: pb.cadence || prev.cadence,
        assigned_to_role: pb.assigned_to_role || prev.assigned_to_role,
        strategic_os_source: pb.strategic_os_source || osWorkflowId,
        steps:
          Array.isArray(pb.steps) && pb.steps.length
            ? pb.steps.map(normalizeStep)
            : prev.steps,
      }));
      setShowTemplatePicker(false);
      setActiveSection(0);
    } catch (err) {
      console.error("Failed to generate from Strategic OS:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate from Strategic OS."));
      setShowTemplatePicker(false);
    } finally {
      setIsGeneratingFromOs(false);
    }
  }

  async function handleSaveSystem() {
    setError("");
    setSuccessMessage("");
    setGenerationError("");
    setSaving(true);

    try {
      const payload = buildSystemPayload(formData);

      if (!payload.name) {
        setGenerationError("Playbook name is required.");
        setActiveSection(0);
        setSaving(false);
        return;
      }

      if (editingSystem?.id) {
        await apiClient.put(`/api/systems/${editingSystem.id}`, payload);
        setSuccessMessage("Playbook updated.");
      } else {
        await apiClient.post("/api/systems", payload);
        setSuccessMessage("Playbook created.");
      }

      setShowModal(false);
      resetForm();
      setSearchQuery("");
      await loadSystems();
      refreshBrandHealth();
    } catch (err) {
      console.error("Failed to save playbook:", err);
      setError(getErrorMessage(err, "Failed to save playbook."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSystem(system) {
    if (!system?.id) return;

    if (
      !window.confirm(
        `Delete "${system.name || "Untitled playbook"}"? This permanently deletes the playbook and all its steps. This cannot be undone.`
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
      setSuccessMessage("Playbook deleted.");
      await loadSystems();
      refreshBrandHealth();
    } catch (err) {
      console.error("Failed to delete playbook:", err);
      setError(getErrorMessage(err, "Failed to delete playbook."));
    } finally {
      setDeletingId("");
    }
  }

  async function handleCopyPlaybook(system) {
    const text = playbookToText(system);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: select-less prompt
      window.prompt("Copy this playbook:", text);
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
  const activeCategoryName = isAllFilter ? "" : getCategoryInfo(selectedCategory).name;

  const overviewComplete = (formData.name || "").trim().length > 0;
  const operationsComplete =
    Boolean((formData.trigger || "").trim()) || Boolean((formData.output || "").trim());
  const connectionComplete = formData.brand_connection_type
    ? formData.brand_connection_type === "none" || Boolean((formData.brand_connection_id || "").trim())
    : false;
  const stepsComplete = hasMeaningfulSteps(formData.steps);

  const MODAL_SECTIONS = [
    { id: 0, label: "Overview", complete: overviewComplete },
    { id: 1, label: "Operations", complete: operationsComplete },
    { id: 2, label: "Brand Connection", complete: connectionComplete },
    { id: 3, label: "Steps", complete: stepsComplete },
  ];
  const completedSections = MODAL_SECTIONS.filter((s) => s.complete).length;

  const modalTitle =
    (formData.name || "").trim() || (editingSystem ? "Edit playbook" : "New playbook");

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: SERIF, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Brand Playbooks
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: SANS }}
          >
            Document how your brand operates so it runs without you.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            style={{
              padding: "8px 16px",
              background: "var(--cth-command-crimson)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={14} /> New Playbook
          </button>
        </div>
      </header>

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="systems-builder-page"
      >
        <div className="mx-auto max-w-[1200px] space-y-8">
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

          {/* Filter + controls row */}
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
                placeholder="Search playbooks..."
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
                New Playbook
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
                Loading playbooks...
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
                    ? `No playbooks matching "${searchQuery.trim()}". Try a different search or clear it.`
                    : isAllFilter
                    ? "No playbooks documented yet — add your first one to get started."
                    : `No ${activeCategoryName} playbooks yet — add one below.`}
                </p>
              ) : (
                filteredSystems.map((system) => (
                  <PlaybookCard
                    key={system.id || system.name}
                    system={system}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteSystem}
                    onView={handleViewPlaybook}
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
                Add another playbook
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
          aria-label={editingSystem ? "Edit Playbook" : "New Playbook"}
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
                  Document a repeatable brand playbook
                </p>
              </div>
              <div className="flex items-center" style={{ gap: 14, flexShrink: 0 }}>
                <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
                  {completedSections} of {MODAL_SECTIONS.length} complete
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

            {/* Generate from Strategic OS banner (create mode only) */}
            {!editingSystem && osWorkflowId ? (
              <div
                style={{
                  padding: "12px 22px",
                  borderBottom: "1px solid var(--cth-command-border)",
                  background: "#1a0828",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
                  <Sparkles size={15} style={{ color: "var(--cth-command-gold)", flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 12.5,
                      color: "#e8dff0",
                      lineHeight: 1.4,
                    }}
                  >
                    Build this playbook from your Strategic OS strategy.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker(true)}
                  disabled={isGeneratingFromOs}
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    padding: "8px 14px",
                    border: "1px solid var(--cth-command-gold)",
                    background: "transparent",
                    color: "var(--cth-command-gold)",
                    cursor: isGeneratingFromOs ? "not-allowed" : "pointer",
                    opacity: isGeneratingFromOs ? 0.6 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isGeneratingFromOs ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Wand2 size={13} />
                  )}
                  Generate from Strategic OS
                </button>
              </div>
            ) : null}

            {/* Body: section nav + active section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "170px 1fr",
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

                {/* Section 0 — Overview */}
                {activeSection === 0 ? (
                  <>
                    <div>
                      <h4 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Overview</h4>
                      <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                        The essentials — what this playbook is and where it lives.
                      </p>
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Playbook name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Ex: Client Onboarding"
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
                        placeholder="What this playbook is for and why it matters..."
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
                ) : null}

                {/* Section 1 — Operations */}
                {activeSection === 1 ? (
                  <>
                    <div>
                      <h4 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Operations</h4>
                      <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                        How and when this runs — and who can run it without you.
                      </p>
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Trigger</label>
                      <select
                        value={formData.trigger}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, trigger: event.target.value }))
                        }
                        style={{ ...INPUT_STYLE, marginTop: 6 }}
                      >
                        <option value="">Select a trigger...</option>
                        {TRIGGERS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.trigger === "custom" ? (
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Custom trigger</label>
                        <input
                          type="text"
                          value={formData.trigger_custom}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, trigger_custom: event.target.value }))
                          }
                          placeholder="Describe what starts this playbook"
                          style={{ ...INPUT_STYLE, marginTop: 6 }}
                        />
                      </div>
                    ) : null}

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Output</label>
                      <input
                        type="text"
                        value={formData.output}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, output: event.target.value }))
                        }
                        placeholder="What does this produce when complete?"
                        style={{ ...INPUT_STYLE, marginTop: 6 }}
                      />
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Cadence</label>
                      <select
                        value={formData.cadence}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, cadence: event.target.value }))
                        }
                        style={{ ...INPUT_STYLE, marginTop: 6 }}
                      >
                        <option value="">Select a cadence...</option>
                        {CADENCES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Runs without me toggle */}
                    <div
                      style={{
                        border: "1px solid var(--cth-command-border)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: "var(--cth-command-panel-soft)",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!formData.runs_without_me}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              runs_without_me: event.target.checked,
                            }))
                          }
                          style={{ width: 16, height: 16, accentColor: "var(--cth-command-success)" }}
                        />
                        <span style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-ink)", fontWeight: 500 }}>
                          This runs without me
                        </span>
                      </label>
                      {formData.runs_without_me ? (
                        <div style={{ marginTop: 10 }}>
                          <label style={FIELD_LABEL_STYLE}>What would someone need to know to run this without you?</label>
                          <textarea
                            rows={3}
                            value={formData.runs_without_me_note}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                runs_without_me_note: event.target.value,
                              }))
                            }
                            placeholder="Logins, standards, who to escalate to, what 'done' looks like..."
                            style={{ ...TEXTAREA_STYLE, marginTop: 6 }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Assigned to (name)</label>
                        <input
                          type="text"
                          value={formData.assigned_to_name}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, assigned_to_name: event.target.value }))
                          }
                          placeholder="Ex: Jordan"
                          style={{ ...INPUT_STYLE, marginTop: 6 }}
                        />
                      </div>
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Assigned to (role)</label>
                        <input
                          type="text"
                          value={formData.assigned_to_role}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, assigned_to_role: event.target.value }))
                          }
                          placeholder="Ex: Operations Lead"
                          style={{ ...INPUT_STYLE, marginTop: 6 }}
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Section 2 — Brand Connection */}
                {activeSection === 2 ? (
                  <>
                    <div>
                      <h4 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Brand Connection</h4>
                      <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                        Tie this playbook to a specific part of your brand.
                      </p>
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Connection type</label>
                      <select
                        value={formData.brand_connection_type}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            brand_connection_type: event.target.value,
                            brand_connection_id: "",
                          }))
                        }
                        style={{ ...INPUT_STYLE, marginTop: 6 }}
                      >
                        <option value="">Select...</option>
                        {BRAND_CONNECTION_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.brand_connection_type === "offer" ||
                    formData.brand_connection_type === "avatar" ? (
                      <div>
                        <label style={FIELD_LABEL_STYLE}>
                          {formData.brand_connection_type === "offer" ? "Choose an offer" : "Choose an avatar"}
                        </label>
                        {loadingConnectionItems ? (
                          <div
                            style={{
                              ...MUTED_STYLE,
                              marginTop: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Loader2 size={14} className="animate-spin" />
                            Loading...
                          </div>
                        ) : connectionItems.length ? (
                          <select
                            value={formData.brand_connection_id}
                            onChange={(event) =>
                              setFormData((prev) => ({ ...prev, brand_connection_id: event.target.value }))
                            }
                            style={{ ...INPUT_STYLE, marginTop: 6 }}
                          >
                            <option value="">Select...</option>
                            {connectionItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p style={{ ...MUTED_STYLE, marginTop: 8 }}>
                            {formData.brand_connection_type === "offer"
                              ? "No offers found. Create one in Offer Builder first."
                              : "No avatars found. Create one in Audience first."}
                          </p>
                        )}
                      </div>
                    ) : null}

                    {formData.brand_connection_type === "pillar" ? (
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Content pillar</label>
                        {loadingPillars ? (
                          <div
                            style={{
                              ...MUTED_STYLE,
                              marginTop: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Loader2 size={14} className="animate-spin" />
                            Loading...
                          </div>
                        ) : pillars.length ? (
                          <select
                            value={formData.brand_connection_id}
                            onChange={(event) =>
                              setFormData((prev) => ({ ...prev, brand_connection_id: event.target.value }))
                            }
                            style={{ ...INPUT_STYLE, marginTop: 6 }}
                          >
                            <option value="">Select...</option>
                            {(formData.brand_connection_id &&
                            !pillars.includes(formData.brand_connection_id)
                              ? [formData.brand_connection_id, ...pillars]
                              : pillars
                            ).map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p style={{ ...MUTED_STYLE, marginTop: 8 }}>
                            No content pillars found — add pillars in Brand Foundation or complete Strategic OS Step 5.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {/* Section 3 — Steps */}
                {activeSection === 3 ? (
                  <>
                    <div>
                      <h4 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Steps</h4>
                      <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                        Outline the sequence — and who owns each step — so this can be handed off.
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
                        <img
                          src="/zuri.png"
                          alt="Zuri"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 8,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#7a6090",
                          }}
                        >
                          Zuri · playbook assist
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
                        “Name the playbook first, then let me draft the steps — or describe the whole
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
                          Generate full playbook
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
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
                  {editingSystem ? "Save changes" : "Save playbook"}
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

          {/* Template picker overlay */}
          {showTemplatePicker ? (
            <div
              onClick={() => setShowTemplatePicker(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 70,
                background: "rgba(13, 0, 16, 0.55)",
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
                  maxWidth: 640,
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  className="flex items-start justify-between"
                  style={{ gap: 12, padding: "18px 22px", borderBottom: "1px solid var(--cth-command-border)" }}
                >
                  <div>
                    <h3 style={{ ...SUBHEAD_STYLE, fontSize: 20 }}>Generate from Strategic OS</h3>
                    <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>
                      Pick a template — Zuri builds it from your actual Strategic OS answers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplatePicker(false)}
                    aria-label="Close template picker"
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
                      flexShrink: 0,
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ padding: "16px 22px", overflowY: "auto", display: "grid", gap: 10 }}>
                  {isGeneratingFromOs ? (
                    <div
                      style={{
                        ...MUTED_STYLE,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 0",
                      }}
                    >
                      <Loader2 size={16} className="animate-spin" style={{ color: "var(--cth-command-crimson)" }} />
                      Building your playbook from Strategic OS...
                    </div>
                  ) : (
                    templates.map((template) => (
                      <button
                        key={template.template_type}
                        type="button"
                        onClick={() => generateFromOs(template.template_type)}
                        style={{
                          textAlign: "left",
                          border: "1px solid var(--cth-command-border)",
                          borderRadius: 10,
                          background: "var(--cth-command-panel-soft)",
                          padding: "14px 16px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: SERIF,
                            fontSize: 17,
                            fontWeight: 600,
                            color: "var(--cth-command-ink)",
                          }}
                        >
                          {template.name}
                        </span>
                        <span style={{ ...MUTED_STYLE, fontSize: 12.5 }}>{template.description}</span>
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 10.5,
                            color: "var(--cth-command-purple)",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            marginTop: 2,
                          }}
                        >
                          {template.os_steps_label || ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* View Playbook (read-only, share-ready) */}
      {viewingSystem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="View Playbook"
          onClick={() => setViewingSystem(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(13, 0, 16, 0.6)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "clamp(8px, 3vw, 24px)",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid var(--cth-command-border)",
              borderRadius: 14,
              width: "100%",
              maxWidth: 900,
              minWidth: 0,
              margin: "auto",
              maxHeight: "90dvh",
              display: "flex",
              flexDirection: "column",
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            {/* View header */}
            <div
              className="flex flex-wrap items-start justify-between"
              style={{
                gap: 16,
                padding: "clamp(14px, 4vw, 20px) clamp(16px, 4vw, 26px)",
                borderBottom: "1px solid var(--cth-command-border)",
              }}
            >
              <div className="min-w-0">
                <div style={{ marginBottom: 8 }}>
                  <CategoryBadge category={getCategoryInfo(viewingSystem.category)} />
                </div>
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontSize: "clamp(20px, 5vw, 30px)",
                    fontWeight: 600,
                    color: "var(--cth-command-ink)",
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  {viewingSystem.name || "Untitled playbook"}
                </h2>
                {viewingSystem.description ? (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 14,
                      color: "var(--cth-command-muted)",
                      lineHeight: 1.55,
                      margin: "10px 0 0",
                      maxWidth: 640,
                    }}
                  >
                    {viewingSystem.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleCopyPlaybook(viewingSystem)}
                  style={{
                    ...SECONDARY_BUTTON_STYLE,
                    padding: "8px 14px",
                    fontSize: 12.5,
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy as text"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingSystem(null);
                    handleOpenModal(viewingSystem);
                  }}
                  style={{ ...SECONDARY_BUTTON_STYLE, padding: "8px 14px", fontSize: 12.5 }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSystem(null)}
                  aria-label="Close"
                  style={{
                    width: 34,
                    height: 34,
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

            {/* View body */}
            <div style={{ padding: "clamp(16px, 4vw, 22px) clamp(16px, 4vw, 26px)" }}>
              {/* Meta grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 14,
                  marginBottom: 22,
                }}
              >
                <ViewMeta label="Trigger" value={triggerLabel(viewingSystem.trigger, viewingSystem.trigger_custom) || "—"} />
                <ViewMeta label="Produces" value={viewingSystem.output || "—"} />
                <ViewMeta label="Cadence" value={cadenceLabel(viewingSystem.cadence) || "—"} />
                <ViewMeta
                  label="Owner"
                  value={
                    [viewingSystem.assigned_to_name, viewingSystem.assigned_to_role]
                      .filter(Boolean)
                      .join(" — ") || "—"
                  }
                />
                <ViewMeta label="Runs without me" value={viewingSystem.runs_without_me ? "Yes" : "No"} />
              </div>

              {viewingSystem.runs_without_me && viewingSystem.runs_without_me_note ? (
                <div
                  style={{
                    border: "1px solid color-mix(in srgb, var(--cth-command-success) 30%, var(--cth-command-border))",
                    background: "color-mix(in srgb, var(--cth-command-success) 7%, var(--cth-command-panel))",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 22,
                  }}
                >
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--cth-command-success)",
                      marginBottom: 5,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ShieldCheck size={13} /> To run this without me
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-ink)", lineHeight: 1.55, margin: 0 }}>
                    {viewingSystem.runs_without_me_note}
                  </p>
                </div>
              ) : null}

              {/* Steps */}
              <h3
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--cth-command-muted)",
                  margin: "0 0 12px",
                }}
              >
                Steps
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(viewingSystem.steps || []).length === 0 ? (
                  <p style={MUTED_STYLE}>No steps documented yet.</p>
                ) : (
                  viewingSystem.steps.map((step, index) => (
                    <div
                      key={`view-step-${index}`}
                      style={{
                        display: "flex",
                        gap: 12,
                        border: "1px solid var(--cth-command-border)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: "var(--cth-command-panel-soft)",
                      }}
                    >
                      <span style={STEP_NUM_STYLE}>{index + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--cth-command-ink)",
                            marginBottom: step.description || step.who_does_this ? 4 : 0,
                          }}
                        >
                          {step.title || `Step ${index + 1}`}
                        </div>
                        {step.description ? (
                          <p
                            style={{
                              fontFamily: SANS,
                              fontSize: 13,
                              color: "var(--cth-command-muted)",
                              lineHeight: 1.55,
                              margin: 0,
                            }}
                          >
                            {step.description}
                          </p>
                        ) : null}
                        {step.who_does_this ? (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 8,
                              fontFamily: SANS,
                              fontSize: 11.5,
                              color: "var(--cth-command-purple)",
                              fontWeight: 600,
                            }}
                          >
                            <UserCheck size={12} />
                            {step.who_does_this}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

function ViewMeta({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--cth-command-muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: "var(--cth-command-ink)", lineHeight: 1.45 }}>
        {value}
      </div>
    </div>
  );
}
