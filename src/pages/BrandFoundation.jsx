import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import { useBrandHealth } from "../context/BrandHealthContext";
import { BrandGuidelinesExportButton } from "../components/shared/BrandGuidelinesExport";
import { getNextStep } from "../config/brandCoreNextStep";
import apiClient from "../lib/apiClient";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  Loader2,
  Pencil,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

const FIELDS = [
  {
    id: "mission",
    label: "Mission Statement",
    subtitle: "Why your brand exists",
    placeholder: "Describe the work your brand does and who it serves...",
    minLength: 20,
    maxLength: 300,
    why: 'Your mission is the operational heart of the brand. It answers "what do we do and for whom?" and becomes the filter for every product, content, and business decision.',
    tips: [
      "Start with a verb: Build, Help, Equip, Create, Enable",
      "Name what you do, not what you want to become",
      "Keep it short enough to remember. One sentence is ideal",
    ],
    exampleSnippet: "Build the strategy, systems, and content behind a brand that actually grows.",
  },
  {
    id: "vision",
    label: "Vision Statement",
    subtitle: "Where your brand is going",
    placeholder: "Describe the world your brand is working toward...",
    minLength: 30,
    maxLength: 500,
    why: "Your vision is the north star. It is the long-range destination that makes the mission worth doing.",
    tips: [
      "Describe a changed world, not a company milestone",
      "It should feel ambitious enough to outlast any one product",
      "Avoid timelines. Vision is directional, not scheduled",
    ],
    exampleSnippet: "A world where every serious founder stops guessing and starts building on a foundation of truth.",
  },
  {
    id: "coreValues",
    label: "Core Values",
    subtitle: "What your brand stands for",
    placeholder: "List your core values and what each one means in practice...",
    minLength: 30,
    maxLength: 600,
    why: "Values are the operating standards behind every decision, every hire, and every piece of content.",
    tips: [
      "Aim for 3 to 5 values. More than 5 becomes noise",
      "Give each value a short explanation, not just a word",
      "If a competitor could claim the same value, it is not specific enough",
    ],
    exampleSnippet: "Strategy before aesthetics. Systems before scale. Foundation before visibility. Truth before trend.",
  },
  {
    id: "tagline",
    label: "Tagline",
    subtitle: "Your memorable phrase",
    placeholder: "The one line that captures your brand positioning...",
    minLength: 5,
    maxLength: 100,
    why: "A tagline is a positioning shortcut. It should say something true and specific enough to stick.",
    tips: [
      "Test it: could a competitor claim this? If yes, rewrite it",
      "Say something true, not aspirational or generic",
      "The best taglines are specific enough to exclude someone",
    ],
    exampleSnippet: "Where serious brands are built.",
  },
  {
    id: "positioning",
    label: "Positioning Statement",
    subtitle: "Your unique place in the market",
    placeholder:
      "For [audience] who [problem], [brand] is the [category] that [differentiator]. Unlike [alternatives], [brand] [key difference].",
    minLength: 50,
    maxLength: 600,
    why: "Positioning is the strategic decision about what corner of the market you own.",
    tips: [
      "Name the specific type of person this is for, not everyone",
      "Name your category clearly, even if it is new",
      "Name one specific competitor or alternative you are replacing",
    ],
    exampleSnippet:
      "For serious founders who are tired of building backwards, Core Truth House OS is the brand operating system that puts strategy first.",
  },
  {
    id: "brandStory",
    label: "Brand Story",
    subtitle: "Your origin narrative",
    placeholder: "The problem you saw, why you were the one to solve it, and what changed because of it...",
    minLength: 100,
    maxLength: 2000,
    why: "Your brand story is not a biography. It should position the customer as the hero and your brand as the guide.",
    tips: [
      "Open with the problem, not with you",
      "Show what you saw that others missed",
      "End with what becomes possible, not your credentials",
    ],
    exampleSnippet:
      "Most founders do not have a brand problem. They have a sequence problem. We built Core Truth House OS because the tool that should have existed did not.",
  },
  {
    id: "toneOfVoice",
    label: "Tone of Voice",
    subtitle: "How your brand speaks",
    placeholder: "Describe your brand voice with 3 to 5 descriptors and what each means in practice...",
    minLength: 30,
    maxLength: 600,
    why: "Voice is the consistent personality behind everything the brand says.",
    tips: [
      'Use descriptor pairs like "Direct but not cold. Warm but not casual."',
      "Include what you are not. Contrast sharpens the voice",
      "Think of a person your brand would sound like, then describe them",
    ],
    exampleSnippet:
      "Authoritative. Calm. Specific. Never loud. The brand speaks like a trusted strategist, not a hype coach.",
  },
  {
    id: "brandPillars",
    label: "Brand Pillars",
    subtitle: "The 3 to 5 content territories your brand owns",
    placeholder: "Name each pillar and describe what it covers in one sentence...\n\nExample:\nAuthority — Share the frameworks and strategy behind building a brand that converts.\nBehind the Build — Document the real process of building the business.\nFounder Truth — Speak to what serious founders are thinking but not saying out loud.",
    minLength: 30,
    maxLength: 800,
    why: "Pillars are not content categories. They are the strategic lanes your brand lives in. Every piece of content you create should belong to one of them. Without pillars, content is random. With pillars, it compounds.",
    tips: [
      "Name each pillar, then describe what it does in one sentence",
      "Each pillar should serve a different role: authority, trust, transformation, community, or conversion",
      "If a competitor could own the same pillar, it is not specific enough",
    ],
    exampleSnippet:
      "Authority — Strategy and frameworks for founders who are building seriously.\nBehind the Build — The real process behind the brand.\nFounder Truth — The things serious founders are thinking but not saying.",
  },
];

const FIELD_MAP = {
  mission: "mission",
  vision: "vision",
  coreValues: "values",
  tagline: "tagline",
  positioning: "positioning",
  brandStory: "story",
  toneOfVoice: "tone_of_voice",
  brandPillars: "brand_pillars",
};

const EMPTY_DATA = {
  mission: "",
  vision: "",
  coreValues: "",
  tagline: "",
  positioning: "",
  brandStory: "",
  toneOfVoice: "",
  brandPillars: "",
};

function getCompletionStatus(value, minLength) {
  const strVal = value ? String(value) : "";
  if (!strVal || strVal.trim().length === 0) return "empty";
  if (strVal.trim().length < minLength) return "draft";
  return "complete";
}

function getScoreFromData(data) {
  const scores = FIELDS.map((field) => {
    const val = data[field.id] || "";
    const status = getCompletionStatus(val, field.minLength);
    if (status === "complete") return 1;
    if (status === "draft") return 0.5;
    return 0;
  });

  return Math.round((scores.reduce((sum, value) => sum + value, 0) / FIELDS.length) * 100);
}

function getSnippet(value) {
  const strVal = value ? String(value) : "";
  if (!strVal || strVal.trim().length === 0) return "";
  return strVal.length > 72 ? `${strVal.substring(0, 72).trim()}...` : strVal;
}

function normalizeFoundationResponse(response) {
  const foundation = response?.foundation || response || {};
  return {
    mission: foundation.mission || "",
    vision: foundation.vision || "",
    coreValues: Array.isArray(foundation.values)
      ? foundation.values.join("\n")
      : foundation.coreValues || foundation.values || "",
    tagline: foundation.tagline || "",
    positioning: foundation.positioning || "",
    brandStory: foundation.story || foundation.brandStory || "",
    toneOfVoice: foundation.tone_of_voice || foundation.toneOfVoice || "",
    brandPillars: foundation.brand_pillars || foundation.brandPillars || "",
  };
}

function buildFoundationPayload(updated) {
  return {
    mission: updated.mission,
    vision: updated.vision,
    values: updated.coreValues
      ? updated.coreValues
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    tagline: updated.tagline,
    positioning: updated.positioning,
    story: updated.brandStory,
    tone_of_voice: updated.toneOfVoice,
    brand_pillars: updated.brandPillars,
    brand_voice: updated.toneOfVoice,
  };
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
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

const FIELD_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 26,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "12px 22px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  textDecoration: "none",
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "11px 20px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

function ScoreRing({ score }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const stroke = score === 100 ? "var(--cth-command-success)" : "var(--cth-command-crimson)";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--cth-command-border)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: "var(--cth-command-ink)" }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "complete") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Complete" role="img">
        <path
          d="M3 8.5 L6.5 12 L13 5"
          stroke="var(--cth-command-crimson)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "draft") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-label="In progress" role="img">
        <circle cx="8" cy="8" r="6" stroke="var(--cth-command-gold)" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2.5" fill="var(--cth-command-gold)" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Not started" role="img">
      <circle cx="8" cy="8" r="6" stroke="var(--cth-command-muted)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function SectionStateIcon({ state }) {
  if (state === "done") {
    return <Check size={12} style={{ color: "var(--cth-command-success)", flexShrink: 0 }} />;
  }
  if (state === "active") {
    return <Pencil size={12} style={{ color: "var(--cth-command-crimson)", flexShrink: 0 }} />;
  }
  return <Circle size={12} style={{ color: "var(--cth-command-border)", flexShrink: 0 }} />;
}

// TODO: StatusPill uses Tailwind bg-emerald-500/10 / bg-amber-500/10 — migrate to --cth-command-* tokens in palette cleanup pass
function StatusPill({ status }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500">
        <CheckCircle2 size={12} />
        Complete
      </span>
    );
  }

  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-500">
        <Loader2 size={12} />
        In progress
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)" }}
    >
      <FileText size={12} />
      Not started
    </span>
  );
}

export default function BrandFoundation() {
  const { currentWorkspace } = useWorkspace();
  const { plan } = usePlan();
  const { refresh: refreshBrandHealth } = useBrandHealth();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
  const nextStep = getNextStep("/brand-foundation", plan);
  const nextStepHref = nextStep?.upgradeTo ? "/billing" : nextStep?.href;
  const nextStepLabel = nextStep?.upgradeTo ? nextStep.ctaLabel : nextStep?.label;

  const [data, setData] = useState(EMPTY_DATA);
  const [activeField, setActiveField] = useState(FIELDS[0].id);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [pendingFieldSwitch, setPendingFieldSwitch] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const saveTimeout = useRef(null);
  const textareaRef = useRef(null);

  const activeConfig = useMemo(
    () => FIELDS.find((field) => field.id === activeField) || FIELDS[0],
    [activeField]
  );

  const activeValue = data[activeField] || "";
  const activeStatus = getCompletionStatus(activeValue, activeConfig.minLength);
  const score = getScoreFromData(data);
  const completedCount = FIELDS.filter(
    (field) => getCompletionStatus(data[field.id] || "", field.minLength) === "complete"
  ).length;

  useEffect(() => {
    async function loadFoundation() {
      if (!workspaceId) {
        setIsLoading(false);
        setLoadError("No active workspace found.");
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const response = await apiClient.get("/api/persist/brand-foundation");
        setData(normalizeFoundationResponse(response));
      } catch (error) {
        console.error("Failed to load foundation:", error);
        setLoadError(getErrorMessage(error, "Failed to load Foundation."));
      } finally {
        setIsLoading(false);
      }
    }

    loadFoundation();
  }, [workspaceId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [activeValue, activeField]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const persistFoundation = useCallback(async (updated) => {
    const payload = buildFoundationPayload(updated);
    await apiClient.post("/api/persist/brand-foundation", payload);
    refreshBrandHealth();
  }, [refreshBrandHealth]);

  const handleChange = useCallback(
    (value) => {
      setData((prev) => {
        const updated = { ...prev, [activeField]: value };
        setSaveState("saving");
        setSaveError("");
        setGeneratedPreview(null);

        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
          try {
            await persistFoundation(updated);
            setSaveState("saved");
            setLastSavedAt(new Date());
            setTimeout(() => {
              setSaveState((current) => (current === "saved" ? "idle" : current));
            }, 1800);
          } catch (error) {
            console.error("Save failed:", error);
            setSaveState("idle");
            setSaveError(getErrorMessage(error, "Save failed."));
          }
        }, 700);

        return updated;
      });
    },
    [activeField, persistFoundation]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    setSaveError("");

    try {
      const apiField = FIELD_MAP[activeField];
      const response = await apiClient.post("/api/persist/brand-foundation/ai-assist", {
        field: apiField,
        current_data: {
          mission: data.mission || "",
          vision: data.vision || "",
          values: data.coreValues || "",
          tagline: data.tagline || "",
          positioning: data.positioning || "",
          story: data.brandStory || "",
          tone_of_voice: data.toneOfVoice || "",
          active_field_label: activeConfig.label,
          active_field_value: activeValue || "",
        },
      });

      const suggestion = typeof response?.suggestion === "string" ? response.suggestion.trim() : "";
      if (suggestion) {
        setGeneratedPreview(suggestion);
      } else {
        setSaveError("No AI draft was returned.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setSaveError(getErrorMessage(error, "AI generation failed."));
    } finally {
      setIsGenerating(false);
    }
  }, [activeField, activeConfig.label, activeValue, data.mission]);

  const handleAcceptGenerated = useCallback(() => {
    if (!generatedPreview) return;
    handleChange(generatedPreview);
    setGeneratedPreview(null);
  }, [generatedPreview, handleChange]);

  const performFieldSwitch = useCallback((fieldId) => {
    setActiveField(fieldId);
    setGeneratedPreview(null);
    setSaveError("");
    setSaveState("idle");
  }, []);

  const handleFieldSwitch = useCallback(
    (fieldId) => {
      if (generatedPreview && fieldId !== activeField) {
        setPendingFieldSwitch(fieldId);
        return;
      }
      performFieldSwitch(fieldId);
    },
    [generatedPreview, activeField, performFieldSwitch]
  );

  const confirmDiscardAndSwitch = useCallback(() => {
    if (pendingFieldSwitch) {
      performFieldSwitch(pendingFieldSwitch);
    }
    setPendingFieldSwitch(null);
  }, [pendingFieldSwitch, performFieldSwitch]);

  const cancelFieldSwitch = useCallback(() => {
    setPendingFieldSwitch(null);
  }, []);

  const fieldIndex = FIELDS.findIndex((field) => field.id === activeField);
  const prevField = fieldIndex > 0 ? FIELDS[fieldIndex - 1] : null;
  const nextField = fieldIndex < FIELDS.length - 1 ? FIELDS[fieldIndex + 1] : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={PAGE_STYLE}>
          <div
            style={{
              fontFamily: SANS,
              color: "var(--cth-command-muted)",
              padding: "120px 24px",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Loader2 size={18} className="animate-spin" />
            Loading Brand Foundation...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: SERIF, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Brand Foundation
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: SANS }}
          >
            Define the core truth your brand is built on so every strategy, offer, and content decision pulls from the same source of truth.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: "var(--cth-command-muted)",
                  marginBottom: 5,
                }}
              >
                {completedCount} of {FIELDS.length} complete
              </div>
              <div
                style={{
                  width: 120,
                  height: 3,
                  background: "var(--cth-command-border)",
                  borderRadius: 2,
                  overflow: "hidden",
                  marginLeft: "auto",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round((completedCount / FIELDS.length) * 100)}%`,
                    background: "var(--cth-command-success)",
                    borderRadius: 2,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
            <BrandGuidelinesExportButton />
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-auto"
        style={PAGE_STYLE}
        data-testid="brand-foundation-page"
      >
        {loadError ? (
          <div
            className="mx-auto mt-5 max-w-[1200px] px-4 md:px-8"
            style={{ fontFamily: SANS }}
          >
            <div
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                color: "var(--cth-danger)",
                padding: "12px 16px",
                fontSize: 13,
              }}
            >
              {loadError}
            </div>
          </div>
        ) : null}

        {/* Mobile field nav - visible only on mobile */}
        <div className="md:hidden overflow-x-auto flex gap-2 px-4 py-3 border-b border-[var(--cth-command-border)] bg-[var(--cth-command-panel)]">
          {FIELDS.map((field) => {
            const isActive = activeField === field.id;
            const isDone = getCompletionStatus(data[field.id], field.minLength) === "complete";
            return (
              <button
                key={field.id}
                onClick={() => handleFieldSwitch(field.id)}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? "var(--cth-command-crimson)" : "var(--cth-command-blush)",
                  color: isActive ? "#fff" : "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 999,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {isDone ? "✓ " : ""}{field.label}
              </button>
            );
          })}
        </div>

        <div className="mx-auto flex max-w-[1100px] flex-col md:flex-row">
          {/* Left section nav */}
          <aside
            className="hidden md:flex md:flex-col"
            style={{
              width: 148,
              flexShrink: 0,
              borderRight: "0.5px solid var(--cth-command-border)",
              background: "var(--cth-command-blush)",
              padding: "16px 0",
            }}
          >
            <div
              style={{
                fontFamily: SANS,
                fontSize: 8,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--cth-command-muted)",
                fontWeight: 600,
                padding: "0 14px 8px",
              }}
            >
              Sections
            </div>

            {FIELDS.map((field) => {
              const value = data[field.id] || "";
              const status = getCompletionStatus(value, field.minLength);
              const isActive = activeField === field.id;
              const state = isActive ? "active" : status === "complete" ? "done" : "todo";

              return (
                <button
                  key={field.id}
                  onClick={() => handleFieldSwitch(field.id)}
                  data-testid={`field-nav-${field.id}`}
                  className="text-left"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    width: "100%",
                    padding: "8px 14px",
                    cursor: "pointer",
                    border: "none",
                    borderLeft: `2px solid ${isActive ? "var(--cth-command-crimson)" : "transparent"}`,
                    background: isActive ? "var(--cth-command-panel)" : "transparent",
                  }}
                >
                  <SectionStateIcon state={state} />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
                    }}
                  >
                    {field.label}
                  </span>
                </button>
              );
            })}

            <div style={{ padding: "12px 14px 0", marginTop: "auto" }}>
              <button
                type="button"
                onClick={() => setViewAllOpen(true)}
                data-testid="view-all-foundation-btn"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 6,
                  color: "var(--cth-command-muted)",
                  fontFamily: SANS,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "6px 8px",
                  cursor: "pointer",
                }}
              >
                View All
              </button>
            </div>
          </aside>

          {/* Right field area */}
          <main className="min-w-0 flex-1" style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Field header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    style={{
                      fontFamily: SERIF,
                      fontSize: 20,
                      fontWeight: 500,
                      color: "var(--cth-command-ink)",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {activeConfig.label}
                  </h2>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 12,
                      color: "var(--cth-command-muted)",
                      margin: "3px 0 0",
                      lineHeight: 1.5,
                      maxWidth: 520,
                    }}
                  >
                    {activeConfig.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      color: "var(--cth-command-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {saveState === "saving" && "Saving…"}
                    {saveState === "saved" && "Saved"}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 9,
                      color: "var(--cth-command-muted)",
                      padding: "3px 9px",
                      border: "0.5px solid var(--cth-command-border)",
                      borderRadius: 5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fieldIndex + 1} of {FIELDS.length}
                  </span>
                </div>
              </div>

              {/* Why this matters */}
              <div
                style={{
                  background: "var(--cth-command-panel)",
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 8,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--cth-command-muted)",
                    marginBottom: 4,
                  }}
                >
                  Why this matters
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    lineHeight: 1.55,
                    color: "var(--cth-command-ink)",
                  }}
                >
                  {activeConfig.why}
                </div>
              </div>

              {/* Tips row */}
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {activeConfig.tips.map((tip, index) => (
                  <div
                    key={`${activeConfig.id}-tip-${index}`}
                    style={{
                      background: "var(--cth-command-panel)",
                      border: "0.5px solid var(--cth-command-border)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 8,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--cth-command-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Tip {index + 1}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        lineHeight: 1.5,
                        color: "var(--cth-command-ink)",
                      }}
                    >
                      {tip}
                    </div>
                  </div>
                ))}
              </div>

              {/* Field card */}
              <div
                style={{
                  background: "var(--cth-command-panel)",
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {activeValue.trim() ? (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderBottom: "0.5px solid var(--cth-command-border)",
                      background:
                        "color-mix(in srgb, var(--cth-command-blush) 60%, var(--cth-command-panel))",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--cth-command-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Current answer
                    </div>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "var(--cth-command-ink)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {activeValue}
                    </div>
                  </div>
                ) : null}

                <div style={{ padding: "12px 14px" }}>
                  <textarea
                    ref={textareaRef}
                    value={activeValue}
                    onChange={(event) => handleChange(event.target.value)}
                    placeholder={
                      activeStatus === "empty"
                        ? `${activeConfig.placeholder}\n\nExample: "${activeConfig.exampleSnippet}"`
                        : activeConfig.placeholder
                    }
                    data-testid={`input-${activeField}`}
                    className="w-full resize-none"
                    style={{
                      minHeight: 120,
                      width: "100%",
                      background: "transparent",
                      color: "var(--cth-command-ink)",
                      fontFamily: SANS,
                      fontSize: 13,
                      lineHeight: 1.65,
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      display: "block",
                    }}
                    maxLength={activeConfig.maxLength}
                  />
                </div>

                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: "10px 14px",
                    borderTop: "0.5px solid var(--cth-command-border)",
                    background:
                      "color-mix(in srgb, var(--cth-command-blush) 60%, var(--cth-command-panel))",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 10,
                      color: "var(--cth-command-muted)",
                    }}
                  >
                    {activeValue.length} / {activeConfig.maxLength}
                  </span>
                  {activeValue ? (
                    <button
                      onClick={() => handleChange("")}
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        color: "var(--cth-command-muted)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Clear field
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              </div>

              {saveError ? (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border:
                      "0.5px solid color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))",
                    background:
                      "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                    color: "var(--cth-danger)",
                    fontFamily: SANS,
                    fontSize: 12,
                  }}
                >
                  {saveError}
                </div>
              ) : null}

              {/* Zuri inline suggestion — wired to Ask the House (handleGenerate) */}
              <div style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }} data-testid="zuri-inline">
                <div className="flex items-center gap-2" style={{ marginBottom: 9 }}>
                  <img
                    src="/zuri.png"
                    alt="Zuri"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
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
                    Zuri · suggestion
                  </span>
                </div>

                {isGenerating ? (
                  <div
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Zuri is drafting from your foundation…
                  </div>
                ) : generatedPreview ? (
                  <>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontWeight: 500,
                        fontSize: 15,
                        lineHeight: 1.4,
                        color: "#fff",
                        marginBottom: 10,
                        whiteSpace: "pre-wrap",
                      }}
                      data-testid="generated-preview"
                    >
                      {generatedPreview}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAcceptGenerated}
                        data-testid="accept-generated-btn"
                        style={{
                          fontFamily: SANS,
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--cth-command-crimson)",
                          background: "transparent",
                          border: "0.5px solid rgba(224,78,53,0.4)",
                          borderRadius: 5,
                          padding: "4px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Use this
                      </button>
                      <button
                        onClick={handleGenerate}
                        style={{
                          fontFamily: SANS,
                          fontSize: 10,
                          color: "#7a6090",
                          background: "transparent",
                          border: "none",
                          padding: "4px 6px",
                          cursor: "pointer",
                        }}
                      >
                        Try another →
                      </button>
                      <button
                        onClick={() => setGeneratedPreview(null)}
                        style={{
                          fontFamily: SANS,
                          fontSize: 10,
                          color: "#52406a",
                          background: "transparent",
                          border: "none",
                          padding: "4px 6px",
                          cursor: "pointer",
                          marginLeft: "auto",
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 15,
                        lineHeight: 1.4,
                        color: "rgba(255,255,255,0.82)",
                        marginBottom: 10,
                      }}
                    >
                      Want a starting point for your {activeConfig.label.toLowerCase()}? Ask the House and I&apos;ll draft one from your foundation.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerate}
                        data-testid="generate-ai-btn"
                        className="inline-flex items-center gap-1.5"
                        style={{
                          fontFamily: SANS,
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--cth-command-crimson)",
                          background: "transparent",
                          border: "0.5px solid rgba(224,78,53,0.4)",
                          borderRadius: 5,
                          padding: "5px 11px",
                          cursor: "pointer",
                        }}
                      >
                        <Wand2 size={12} />
                        Ask the House
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Page footer */}
            <div
              className="flex items-center justify-between"
              style={{
                marginTop: "auto",
                padding: "14px 24px",
                borderTop: "0.5px solid var(--cth-command-border)",
                background:
                  "color-mix(in srgb, var(--cth-command-blush) 60%, var(--cth-command-panel))",
              }}
            >
              <button
                onClick={() => prevField && handleFieldSwitch(prevField.id)}
                disabled={!prevField}
                data-testid="prev-field-btn"
                className="inline-flex items-center gap-1.5"
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  color: "var(--cth-command-muted)",
                  background: "var(--cth-command-panel)",
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 7,
                  padding: "7px 16px",
                  cursor: prevField ? "pointer" : "default",
                  opacity: prevField ? 1 : 0.4,
                }}
              >
                <ChevronLeft size={14} />
                {prevField?.label || "Previous"}
              </button>

              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: "var(--cth-command-muted)",
                }}
              >
                {fieldIndex + 1} of {FIELDS.length}
              </span>

              {nextField ? (
                <button
                  onClick={() => handleFieldSwitch(nextField.id)}
                  data-testid="next-field-btn"
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#fff",
                    background: "var(--cth-command-crimson)",
                    border: "none",
                    borderRadius: 7,
                    padding: "7px 20px",
                    cursor: "pointer",
                  }}
                >
                  Save & continue
                  <ChevronRight size={14} />
                </button>
              ) : nextStepHref ? (
                <a
                  href={nextStepHref}
                  data-testid="next-field-btn"
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#fff",
                    background: "var(--cth-command-crimson)",
                    border: "none",
                    borderRadius: 7,
                    padding: "7px 20px",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  {nextStepLabel || "Continue"}
                  <ChevronRight size={14} />
                </a>
              ) : (
                <button
                  disabled
                  data-testid="next-field-btn"
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#fff",
                    background: "var(--cth-command-crimson)",
                    border: "none",
                    borderRadius: 7,
                    padding: "7px 20px",
                    opacity: 0.4,
                    cursor: "default",
                  }}
                >
                  Save & continue
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

          </main>
        </div>
      </div>

      {/* Unsaved AI Draft confirmation modal */}
      {pendingFieldSwitch ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unsaved AI Draft"
          onClick={cancelFieldSwitch}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
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
              ...CARD_STYLE,
              width: "100%",
              maxWidth: 480,
              padding: 28,
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
                lineHeight: 1.25,
              }}
            >
              Unsaved AI Draft
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "var(--cth-command-muted)",
                margin: "12px 0 24px",
                lineHeight: 1.6,
              }}
            >
              You have an AI-generated draft that has not been accepted. Leaving this field will discard it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelFieldSwitch}
                data-testid="stay-and-review-btn"
                style={{
                  background: "transparent",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: "10px 18px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Stay and Review
              </button>
              <button
                type="button"
                onClick={confirmDiscardAndSwitch}
                data-testid="discard-and-continue-btn"
                style={{
                  background: "var(--cth-command-crimson)",
                  color: "var(--cth-command-ivory)",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 18px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                Discard and Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* View All Foundation Elements drawer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          pointerEvents: viewAllOpen ? "auto" : "none",
          visibility: viewAllOpen ? "visible" : "hidden",
        }}
        aria-hidden={!viewAllOpen}
      >
        <div
          onClick={() => setViewAllOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13, 0, 16, 0.4)",
            opacity: viewAllOpen ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        />
        <div
          role="dialog"
          aria-label="Foundation Elements"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 480,
            maxWidth: "100%",
            background: "var(--cth-command-panel)",
            borderLeft: "1px solid var(--cth-command-border)",
            boxShadow: "-12px 0 40px rgba(13,0,16,0.18)",
            transform: viewAllOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 240ms ease",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--cth-command-border)",
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              Foundation Elements
            </h2>
            <button
              type="button"
              onClick={() => setViewAllOpen(false)}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: "var(--cth-command-muted)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
            <div className="space-y-5">
              {FIELDS.map((field) => {
                const value = data[field.id] || "";
                const status = getCompletionStatus(value, field.minLength);
                const isEmpty = status === "empty";

                return (
                  <div key={field.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p style={SECTION_LABEL_STYLE}>{field.label}</p>
                      <StatusIcon status={status} />
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontFamily: SANS,
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: isEmpty ? "var(--cth-command-muted)" : "var(--cth-command-ink)",
                        fontStyle: isEmpty ? "italic" : "normal",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {isEmpty ? "Not started yet" : value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--cth-command-border)",
            }}
          >
            {completedCount === FIELDS.length && nextStep ? (
              <a
                href={nextStepHref}
                style={{
                  ...PRIMARY_CTA_STYLE,
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {nextStepLabel}
                <ChevronRight size={14} />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setViewAllOpen(false)}
                style={{
                  background: "transparent",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: "12px 22px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Keep Building
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
