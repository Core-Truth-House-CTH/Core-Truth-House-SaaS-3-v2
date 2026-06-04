import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Copy,
  Eye,
  Film,
  FileText,
  Layout,
  Loader2,
  Lock,
  MessageSquare,
  Save,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Trash2,
  User,
  Video,
  Wand2,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import { useBrandHealth } from "../context/BrandHealthContext";
import PublishDrawer from "../components/content-studio/PublishDrawer";

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */
const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

/* ------------------------------------------------------------------ */
/* Plan gating                                                         */
/* ------------------------------------------------------------------ */
const PLAN_GENERATION_LIMITS = {
  free: 5,
  audit: 5,
  foundation: 5,
  structure: 20,
  house: Infinity,
  estate: Infinity,
  legacy: Infinity,
};

// Prompt Generator (Visual / Video) requires Structure or above.
const PROMPT_LOCKED_PLANS = new Set(["free", "audit", "foundation"]);

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "create", label: "Create Content" },
  { id: "visual", label: "Visual Prompts" },
  { id: "video", label: "Video Scripts" },
  { id: "repurpose", label: "Repurpose" },
  { id: "campaign", label: "Campaign Assets" },
  { id: "saved", label: "Saved Outputs" },
];

/* ------------------------------------------------------------------ */
/* Create Content — content types & per-type fields                    */
/*   Every field optional except the main topic/title field.           */
/* ------------------------------------------------------------------ */
const FIELD_TOPIC = (label, placeholder) => ({
  id: "topic",
  label,
  kind: "input",
  required: true,
  placeholder,
});
const FIELD_KEYWORD = {
  id: "target_keyword",
  label: "Target keyword",
  kind: "input",
  placeholder: "Optional",
  note: "Optional",
};
const FIELD_OFFER = {
  id: "offer",
  label: "Offer name",
  kind: "input",
  placeholder: "What are you selling?",
  note: "Optional",
};
const FIELD_AUDIENCE = {
  id: "audience_id",
  label: "Target audience",
  kind: "audience",
  note: "Pulls from your Audience tab",
};
const FIELD_TONE = {
  id: "tone",
  label: "Tone",
  kind: "input",
  placeholder: "e.g. Direct, educational",
  note: "Optional",
};

const CREATE_TYPES = [
  {
    id: "social-caption",
    label: "Social Caption",
    fields: [FIELD_TOPIC("Topic", "What is this post about?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "short-form-hook",
    label: "Short Form Hook",
    fields: [FIELD_TOPIC("Topic", "What is the hook about?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    fields: [FIELD_TOPIC("Topic", "What insight or perspective are you sharing?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "twitter-thread",
    label: "Twitter/X Thread",
    fields: [FIELD_TOPIC("Topic", "What is the thread about?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "email-newsletter",
    label: "Email Newsletter",
    fields: [FIELD_TOPIC("Topic", "What is this email about?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "carousel-outline",
    label: "Carousel Outline",
    fields: [FIELD_TOPIC("Topic", "What is the carousel teaching?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "sales-page",
    label: "Sales Page Copy",
    fields: [FIELD_TOPIC("Topic or pain point", "Who is this for and what problem does it solve?"), FIELD_OFFER, FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "blog-post",
    label: "Blog Post",
    fields: [
      FIELD_TOPIC("Title or topic", "e.g. Why your brand isn't converting"),
      FIELD_KEYWORD,
      FIELD_AUDIENCE,
      FIELD_TONE,
    ],
  },
  {
    id: "tiktok-script",
    label: "TikTok Script",
    fields: [FIELD_TOPIC("Topic", "What is the video about?"), FIELD_AUDIENCE, FIELD_TONE],
  },
  {
    id: "pinterest-description",
    label: "Pinterest",
    fields: [FIELD_TOPIC("Topic", "What is this pin about?"), FIELD_AUDIENCE, FIELD_TONE],
  },
];

/* ------------------------------------------------------------------ */
/* Visual Prompts — content types + parameter dropdowns                */
/* ------------------------------------------------------------------ */
const VISUAL_TYPES = [
  { id: "founder-portrait", label: "Founder Portrait", icon: User },
  { id: "brand-editorial", label: "Brand Editorial", icon: Layout },
  { id: "behind-the-scenes", label: "Behind the Scenes", icon: Eye },
  { id: "offer-showcase", label: "Offer Showcase", icon: ShoppingBag },
  { id: "results-moment", label: "Results Moment", icon: Star },
  { id: "workspace-overview", label: "Workspace Overview", icon: Building2 },
];

const VIDEO_TYPES = [
  { id: "founder-talking-head", label: "Founder Talking Head", icon: Video },
  { id: "brand-cinematic", label: "Brand Cinematic", icon: Film },
  { id: "behind-the-scenes", label: "Behind the Scenes", icon: Eye },
  { id: "testimonial", label: "Testimonial", icon: MessageSquare },
  { id: "offer-walkthrough", label: "Offer Walkthrough", icon: ShoppingBag },
  { id: "day-in-the-life", label: "Day in the Life", icon: Sun },
];

const BRAND_VIBE_OPTIONS = [
  "Quiet authority",
  "Editorial luxury",
  "Strategic founder",
  "Legacy brand presence",
  "Modern minimal",
  "Warm approachable expert",
];
const SETTING_OPTIONS = [
  "Home office editorial",
  "Clean white studio",
  "Outdoor architectural space",
  "Urban professional environment",
  "Library or archive interior",
  "Luxury hotel or lounge",
];
const LIGHTING_OPTIONS = [
  "Natural soft window light",
  "Warm golden hour",
  "Clean overhead studio",
  "Moody directional side light",
  "Soft diffused overcast",
  "Dramatic backlit silhouette",
];
const STYLE_FINISH_OPTIONS = [
  "Film grain warm tones",
  "Clean crisp sharp digital",
  "Muted editorial desaturated",
  "High contrast bold shadows",
  "Soft blush warm neutrals",
  "Cinematic wide color grade",
];
const OUTPUT_FORMAT_OPTIONS = [
  "Midjourney",
  "DALL-E",
  "Adobe Firefly",
  "Stable Diffusion",
  "Leonardo AI",
  "Nano Banana",
  "ChatGPT",
  "GPT Image 1",
];

const VISUAL_DROPDOWNS = [
  { id: "brand_vibe", label: "Brand Vibe", options: BRAND_VIBE_OPTIONS },
  { id: "setting", label: "Setting", options: SETTING_OPTIONS },
  { id: "lighting", label: "Lighting", options: LIGHTING_OPTIONS },
  { id: "style_finish", label: "Style Finish", options: STYLE_FINISH_OPTIONS },
];

/* ------------------------------------------------------------------ */
/* Repurpose / Video / Campaign options                                */
/* ------------------------------------------------------------------ */
const REPURPOSE_INTO = [
  "Social Caption",
  "Short Form Hook",
  "LinkedIn Post",
  "Twitter/X Thread",
  "Email Newsletter",
  "Carousel Outline",
  "Blog Post",
];
const TONE_OPTIONS = ["Direct", "Educational", "Warm", "Bold", "Conversational", "Professional", "Premium"];
const DURATION_OPTIONS = ["15 seconds", "30 seconds", "60 seconds", "90 seconds"];
const CAMPAIGN_ASSET_TYPES = [
  "Launch Email",
  "Social Announcement",
  "Sales Page Hook",
  "Follow-up Sequence",
  "Waitlist Copy",
  "Checkout Page",
];

/* ------------------------------------------------------------------ */
/* Saved Outputs filters                                               */
/* ------------------------------------------------------------------ */
const SAVED_FILTERS = [
  { id: "all", label: "All" },
  { id: "blog", label: "Blog Posts" },
  { id: "social", label: "Social" },
  { id: "visual", label: "Visual Prompts" },
  { id: "video", label: "Video Scripts" },
  { id: "campaign", label: "Campaign Assets" },
];

/* ------------------------------------------------------------------ */
/* Zuri copy per tab                                                   */
/* ------------------------------------------------------------------ */
const ZURI_TEXT = {
  create:
    "\"Content that converts leads your reader from their current problem to your specific solution. What is the one belief you want them to hold by the end of this piece?\"",
  visual:
    "\"A strong brand image isn't decoration — it's evidence. Choose a setting and light that make your authority feel inevitable, not performed.\"",
  video:
    "\"The first three seconds decide everything. Open on the tension your audience already feels, then earn the rest of their attention.\"",
  repurpose:
    "\"One strong idea deserves more than one life. Repurposing isn't repetition — it's meeting the same truth on a new platform.\"",
  campaign:
    "\"Every campaign asset should carry the same promise. When the email, the page, and the post agree, the offer feels trustworthy.\"",
  saved:
    "\"Your best content becomes a system when you reuse it. Revisit what worked and let it shape what comes next.\"",
};

/* ================================================================== */
/* Style helpers (cth-command-* variables only)                        */
/* ================================================================== */
const PAGE_STYLE = { background: "var(--cth-command-blush)", minHeight: "100vh" };

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 12,
  padding: 18,
};

const CARD_LBL_STYLE = {
  fontFamily: SANS,
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  fontWeight: 600,
  marginBottom: 10,
};

const FIELD_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  fontWeight: 600,
};

const FIELD_NOTE_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  color: "var(--cth-command-muted)",
  marginTop: 2,
};

const INPUT_STYLE = {
  padding: "8px 11px",
  background: "var(--cth-command-blush)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  outline: "none",
  width: "100%",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  lineHeight: 1.6,
  minHeight: 60,
  resize: "vertical",
};

const SELECT_STYLE = { ...INPUT_STYLE, cursor: "pointer" };

const GENERATE_BTN_STYLE = {
  width: "100%",
  padding: 10,
  background: "var(--cth-command-crimson)",
  color: "var(--cth-command-ivory)",
  border: "none",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: SANS,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const ACT_TITLE_STYLE = {
  fontFamily: SERIF,
  fontSize: 16,
  fontWeight: 500,
  color: "var(--cth-command-ink)",
};

const ABTN_BASE = {
  fontSize: 11,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 7,
  cursor: "pointer",
  fontFamily: SANS,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};
const ABTN_COPY = {
  ...ABTN_BASE,
  background: "var(--cth-command-blush)",
  color: "var(--cth-command-ink)",
  border: "0.5px solid var(--cth-command-border)",
};
const ABTN_SAVE = {
  ...ABTN_BASE,
  background: "var(--cth-command-success)",
  color: "var(--cth-command-ivory)",
  border: "none",
};

const OUT_TA_STYLE = {
  padding: 12,
  background: "var(--cth-command-blush)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  lineHeight: 1.7,
  resize: "vertical",
  width: "100%",
  minHeight: 180,
  outline: "none",
};

const MONO_TA_STYLE = {
  ...OUT_TA_STYLE,
  fontFamily: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace",
};

const LBTN_STYLE = {
  fontSize: 10,
  color: "var(--cth-command-crimson)",
  fontWeight: 600,
  background: "transparent",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 5,
  padding: "2px 7px",
  cursor: "pointer",
  fontFamily: SANS,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const DIVIDER_STYLE = {
  height: "0.5px",
  background: "var(--cth-command-border)",
  margin: "12px 0",
};

function tabPillStyle(active) {
  return {
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: SANS,
    border: active ? "0.5px solid var(--cth-command-crimson)" : "0.5px solid var(--cth-command-border)",
    background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel)",
    color: active ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
  };
}

function typePillStyle(active) {
  return {
    padding: "7px 10px",
    borderRadius: 7,
    fontSize: 11,
    fontWeight: 500,
    border: active ? "0.5px solid var(--cth-command-crimson)" : "0.5px solid var(--cth-command-border)",
    background: active ? "var(--cth-command-crimson)" : "var(--cth-command-blush)",
    color: active ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
    cursor: "pointer",
    textAlign: "center",
    fontFamily: SANS,
  };
}

/* ================================================================== */
/* Small presentational components                                     */
/* ================================================================== */
function Field({ field, value, avatars, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
      <div style={FIELD_LABEL_STYLE}>
        {field.label}
        {field.required ? <span style={{ color: "var(--cth-command-cinnabar)" }}> *</span> : null}
      </div>
      {field.kind === "audience" ? (
        <select style={SELECT_STYLE} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)}>
          <option value="">Select an avatar (optional)</option>
          {avatars.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          style={INPUT_STYLE}
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      )}
      {field.note ? <div style={FIELD_NOTE_STYLE}>{field.note}</div> : null}
    </div>
  );
}

function OutputCard({ title = "Generated output", value, onChange, onCopy, onSave, saving, mono, readOnly, emptyHint }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={ACT_TITLE_STYLE}>{title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" style={{ ...ABTN_COPY, opacity: value ? 1 : 0.5, cursor: value ? "pointer" : "not-allowed" }} disabled={!value} onClick={onCopy}>
            <Copy size={12} /> Copy
          </button>
          {onSave ? (
            <button
              type="button"
              style={{ ...ABTN_SAVE, opacity: value && !saving ? 1 : 0.5, cursor: value && !saving ? "pointer" : "not-allowed" }}
              disabled={!value || saving}
              onClick={onSave}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save to library
            </button>
          ) : null}
        </div>
      </div>
      {value ? (
        <textarea
          style={mono ? MONO_TA_STYLE : OUT_TA_STYLE}
          value={value}
          readOnly={readOnly}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
      ) : (
        <div
          style={{
            ...OUT_TA_STYLE,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--cth-command-muted)",
            textAlign: "center",
          }}
        >
          <Sparkles size={20} style={{ color: "var(--cth-command-crimson)" }} />
          {emptyHint || "Your generated content will appear here."}
        </div>
      )}
    </div>
  );
}

function LockedTab() {
  return (
    <div style={{ ...CARD_STYLE, padding: "44px 36px", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 12,
          background: "color-mix(in srgb, var(--cth-command-crimson) 12%, var(--cth-command-panel))",
          color: "var(--cth-command-crimson)",
          marginBottom: 20,
        }}
      >
        <Lock size={22} />
      </div>
      <div style={{ ...CARD_LBL_STYLE, marginBottom: 12 }}>Structure Plan Required</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: "var(--cth-command-ink)", margin: "0 0 12px" }}>
        Brand-specific prompts
      </h2>
      <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.6, color: "var(--cth-command-muted)", marginBottom: 24 }}>
        Generate AI image and video prompts tailored to your voice, positioning, and audience. Available on The Structure plan and above.
      </p>
      <a
        href="/tiers"
        style={{
          ...GENERATE_BTN_STYLE,
          width: "auto",
          display: "inline-flex",
          padding: "10px 22px",
          textDecoration: "none",
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
        }}
      >
        Upgrade to Structure
      </a>
    </div>
  );
}

/* ================================================================== */
/* Helpers                                                             */
/* ================================================================== */
function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function categorize(contentType) {
  const ct = String(contentType || "").toLowerCase();
  if (ct.includes("video script")) return "video";
  if (CAMPAIGN_ASSET_TYPES.some((t) => ct === t.toLowerCase())) return "campaign";
  if (ct === "blog post") return "blog";
  return "social";
}

/* ================================================================== */
/* Main component                                                      */
/* ================================================================== */
export default function ContentStudio() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { plan } = usePlan();
  const { refresh: refreshBrandHealth } = useBrandHealth();

  const planKey = String(plan || "foundation").toLowerCase();
  const limit = PLAN_GENERATION_LIMITS[planKey] ?? 5;
  const promptLocked = PROMPT_LOCKED_PLANS.has(planKey);

  const [tab, setTab] = useState("create");
  const [toast, setToast] = useState("");

  // Shared data
  const [avatars, setAvatars] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [library, setLibrary] = useState([]);
  const [promptSaved, setPromptSaved] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [generationCount, setGenerationCount] = useState(0);
  const atLimit = limit !== Infinity && generationCount >= limit;

  // Create Content
  const [createType, setCreateType] = useState("blog-post");
  const [createForm, setCreateForm] = useState({});
  const [createOut, setCreateOut] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [currentItemId, setCurrentItemId] = useState("");

  // Visual
  const [visualType, setVisualType] = useState(null);
  const [visualParams, setVisualParams] = useState({ brand_vibe: "", setting: "", lighting: "", style_finish: "", output_format: "" });
  const [visualOut, setVisualOut] = useState("");

  // Video
  const [videoType, setVideoType] = useState(null);
  const [videoTopic, setVideoTopic] = useState("");
  const [videoAudience, setVideoAudience] = useState("");
  const [videoDuration, setVideoDuration] = useState(DURATION_OPTIONS[1]);
  const [videoOut, setVideoOut] = useState("");

  // Repurpose
  const [repurposeSource, setRepurposeSource] = useState("");
  const [repurposeInto, setRepurposeInto] = useState(REPURPOSE_INTO[0]);
  const [repurposeTone, setRepurposeTone] = useState(TONE_OPTIONS[0]);
  const [repurposeOut, setRepurposeOut] = useState("");

  // Campaign Assets
  const [campaignId, setCampaignId] = useState("");
  const [campaignAsset, setCampaignAsset] = useState(CAMPAIGN_ASSET_TYPES[0]);
  const [campaignInstruction, setCampaignInstruction] = useState("");
  const [campaignOut, setCampaignOut] = useState("");

  // Saved Outputs
  const [savedFilter, setSavedFilter] = useState("all");

  // Generic
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publishItem, setPublishItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Zuri
  const [zuriOut, setZuriOut] = useState("");
  const [zuriLoading, setZuriLoading] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const createTypeDef = useMemo(() => CREATE_TYPES.find((t) => t.id === createType) || CREATE_TYPES[0], [createType]);
  const avatarName = useCallback((id) => avatars.find((a) => a.id === id)?.name || "", [avatars]);

  /* ---------------- data loads ---------------- */
  const loadLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const res = await apiClient.get(API_PATHS.persist.contentLibrary, { params: { workspace_id: activeWorkspaceId } });
      const assets = res?.assets || [];
      setLibrary(assets);
      setGenerationCount(assets.length);
    } catch (e) {
      console.error("Failed to load content library", e);
    } finally {
      setLoadingLibrary(false);
    }
  }, [activeWorkspaceId]);

  const loadPromptSaved = useCallback(async () => {
    if (promptLocked) return;
    try {
      const res = await apiClient.get("/api/prompt-generator/saved", { params: { workspace_id: activeWorkspaceId } });
      setPromptSaved(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      console.warn("Failed to load saved prompts", e);
    }
  }, [activeWorkspaceId, promptLocked]);

  const loadAvatars = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATHS.audience.avatars, { params: { workspace_id: activeWorkspaceId } });
      setAvatars(Array.isArray(res?.avatars) ? res.avatars : []);
    } catch (e) {
      console.warn("Failed to load avatars", e);
    }
  }, [activeWorkspaceId]);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATHS.campaigns.list, { params: { workspace_id: activeWorkspaceId } });
      setCampaigns(Array.isArray(res?.campaigns) ? res.campaigns : []);
    } catch (e) {
      console.warn("Failed to load campaigns", e);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadLibrary();
    loadAvatars();
    loadCampaigns();
    loadPromptSaved();
  }, [loadLibrary, loadAvatars, loadCampaigns, loadPromptSaved]);

  /* ---------------- shared helpers ---------------- */
  const copyText = useCallback(
    async (text) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied!");
      } catch {
        showToast("Copy failed");
      }
    },
    [showToast]
  );

  const generateContent = useCallback(
    async ({ content_type, topic, offer, tone, custom_instruction }) => {
      const res = await apiClient.post(API_PATHS.persist.contentGenerate, {
        content_type,
        topic: topic || undefined,
        offer: offer || undefined,
        tone: tone || undefined,
        custom_instruction: custom_instruction || undefined,
      });
      setGenerationCount((c) => c + 1);
      return res?.content || "";
    },
    []
  );

  const updateCreateField = useCallback((id, val) => setCreateForm((f) => ({ ...f, [id]: val })), []);

  /* ---------------- Create Content ---------------- */
  const handleCreateGenerate = useCallback(async () => {
    setError("");
    if (!String(createForm.topic || "").trim()) {
      setError(`${createTypeDef.fields[0].label} is required.`);
      return;
    }
    if (atLimit) return;
    setGenerating(true);
    setCreateOut("");
    try {
      const extra = [];
      if (createForm.target_keyword) extra.push(`Target keyword: ${createForm.target_keyword}.`);
      const aName = avatarName(createForm.audience_id);
      if (aName) extra.push(`Write for this audience avatar: ${aName}.`);
      const content = await generateContent({
        content_type: createTypeDef.label,
        topic: createForm.topic,
        offer: createForm.offer,
        tone: createForm.tone,
        custom_instruction: extra.join(" "),
      });
      setCreateOut(content);
      setCreateTitle(`${createTypeDef.label} · ${formatDate(new Date().toISOString())}`);
      setCurrentItemId("");
    } catch (e) {
      setError(e?.message || "Failed to generate content.");
    } finally {
      setGenerating(false);
    }
  }, [createForm, createTypeDef, atLimit, avatarName, generateContent]);

  const handleSaveCreate = useCallback(async () => {
    if (!createOut.trim()) return;
    setSaving(true);
    try {
      await apiClient.post(API_PATHS.persist.contentSave, {
        id: currentItemId || undefined,
        content_type: createTypeDef.label,
        title: createTitle || createTypeDef.label,
        content: createOut,
        metadata: {
          type_id: createTypeDef.id,
          topic: createForm.topic,
          offer: createForm.offer,
          tone: createForm.tone,
          target_keyword: createForm.target_keyword,
          audience_id: createForm.audience_id,
        },
      });
      await loadLibrary();
      refreshBrandHealth();
      showToast("Saved!");
    } catch (e) {
      setError(e?.message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  }, [createOut, currentItemId, createTypeDef, createTitle, createForm, loadLibrary, refreshBrandHealth, showToast]);

  const loadLibraryItem = useCallback((item) => {
    const typeId = item.metadata?.type_id || CREATE_TYPES.find((t) => t.label === item.content_type)?.id || "blog-post";
    setTab("create");
    setCreateType(typeId);
    setCreateForm({
      topic: item.metadata?.topic || "",
      offer: item.metadata?.offer || "",
      tone: item.metadata?.tone || "",
      target_keyword: item.metadata?.target_keyword || "",
      audience_id: item.metadata?.audience_id || "",
    });
    setCreateTitle(item.title || "");
    setCreateOut(item.content || "");
    setCurrentItemId(item.id || item.asset_id || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* ---------------- Visual Prompts ---------------- */
  const visualParamCount = VISUAL_DROPDOWNS.reduce((n, d) => (visualParams[d.id] ? n + 1 : n), 0) + (visualParams.output_format ? 1 : 0);
  const canVisual = !!visualType && visualParamCount >= 3 && !generating;

  const handleVisualGenerate = useCallback(async () => {
    if (!canVisual) return;
    setError("");
    setGenerating(true);
    setVisualOut("");
    try {
      const def = VISUAL_TYPES.find((t) => t.id === visualType);
      const res = await apiClient.post("/api/prompt-generator/generate", {
        tab: "photo",
        content_type: def?.label || visualType,
        brand_vibe: visualParams.brand_vibe,
        setting: visualParams.setting,
        lighting: visualParams.lighting,
        style_finish: visualParams.style_finish,
        output_format: visualParams.output_format,
        workspace_id: activeWorkspaceId,
      });
      setVisualOut(String(res?.prompt || "").trim());
    } catch (e) {
      setError(e?.message || "Failed to generate prompt.");
    } finally {
      setGenerating(false);
    }
  }, [canVisual, visualType, visualParams, activeWorkspaceId]);

  const handleSaveVisual = useCallback(async () => {
    if (!visualOut.trim()) return;
    setSaving(true);
    try {
      const def = VISUAL_TYPES.find((t) => t.id === visualType);
      await apiClient.post("/api/prompt-generator/save", {
        tab: "photo",
        content_type: def?.label || visualType,
        output_format: visualParams.output_format,
        prompt_text: visualOut,
        workspace_id: activeWorkspaceId,
      });
      await loadPromptSaved();
      showToast("Saved!");
    } catch (e) {
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  }, [visualOut, visualType, visualParams.output_format, activeWorkspaceId, loadPromptSaved, showToast]);

  /* ---------------- Video Scripts ---------------- */
  const handleVideoGenerate = useCallback(async () => {
    setError("");
    if (!videoTopic.trim()) {
      setError("Topic is required.");
      return;
    }
    if (atLimit) return;
    setGenerating(true);
    setVideoOut("");
    try {
      const def = VIDEO_TYPES.find((t) => t.id === videoType);
      const extra = [`Target duration: ${videoDuration}.`];
      const aName = avatarName(videoAudience);
      if (aName) extra.push(`Write for this audience avatar: ${aName}.`);
      const content = await generateContent({
        content_type: `${def?.label || "Talking head"} video script`,
        topic: videoTopic,
        custom_instruction: `${extra.join(" ")} Format as a spoken video script with a strong hook, body, and call to action.`,
      });
      setVideoOut(content);
    } catch (e) {
      setError(e?.message || "Failed to generate script.");
    } finally {
      setGenerating(false);
    }
  }, [videoTopic, videoType, videoDuration, videoAudience, atLimit, avatarName, generateContent]);

  /* ---------------- Repurpose ---------------- */
  const handleRepurposeGenerate = useCallback(async () => {
    setError("");
    if (!repurposeSource.trim()) {
      setError("Paste the original content to repurpose.");
      return;
    }
    if (atLimit) return;
    setGenerating(true);
    setRepurposeOut("");
    try {
      const content = await generateContent({
        content_type: repurposeInto,
        topic: repurposeSource,
        tone: repurposeTone,
        custom_instruction: `Repurpose the provided source content into a ${repurposeInto}. Keep the core message and adapt the format, length, and structure for that format.`,
      });
      setRepurposeOut(content);
    } catch (e) {
      setError(e?.message || "Failed to repurpose content.");
    } finally {
      setGenerating(false);
    }
  }, [repurposeSource, repurposeInto, repurposeTone, atLimit, generateContent]);

  /* ---------------- Campaign Assets ---------------- */
  const handleCampaignGenerate = useCallback(async () => {
    setError("");
    if (!campaignId) {
      setError("Select a campaign.");
      return;
    }
    if (atLimit) return;
    setGenerating(true);
    setCampaignOut("");
    try {
      const camp = campaigns.find((c) => c.id === campaignId);
      const ctx = [];
      if (camp?.name) ctx.push(`Campaign: ${camp.name}.`);
      if (camp?.goal) ctx.push(`Goal: ${camp.goal}.`);
      if (camp?.offer_name) ctx.push(`Offer: ${camp.offer_name}.`);
      if (camp?.promise) ctx.push(`Promise: ${camp.promise}.`);
      if (campaignInstruction) ctx.push(campaignInstruction);
      const content = await generateContent({
        content_type: campaignAsset,
        topic: camp?.offer_name || camp?.name || "",
        custom_instruction: `Create a ${campaignAsset} for this campaign. ${ctx.join(" ")}`,
      });
      setCampaignOut(content);
    } catch (e) {
      setError(e?.message || "Failed to generate asset.");
    } finally {
      setGenerating(false);
    }
  }, [campaignId, campaigns, campaignAsset, campaignInstruction, atLimit, generateContent]);

  /* ---------------- Delete ---------------- */
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, source } = deleteTarget;
    try {
      if (source === "visual") {
        await apiClient.delete(`/api/prompt-generator/saved/${id}`, { params: { workspace_id: activeWorkspaceId } });
        await loadPromptSaved();
      } else {
        await apiClient.delete(API_PATHS.persist.contentById(id));
        if (currentItemId === id) {
          setCurrentItemId("");
          setCreateOut("");
          setCreateTitle("");
        }
        await loadLibrary();
        refreshBrandHealth();
      }
      showToast("Deleted");
    } catch (e) {
      showToast("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, activeWorkspaceId, currentItemId, loadLibrary, loadPromptSaved, refreshBrandHealth, showToast]);

  /* ---------------- Zuri: Inspire my angle ---------------- */
  const handleInspire = useCallback(async () => {
    setZuriLoading(true);
    try {
      const res = await apiClient.post(API_PATHS.persist.contentGenerate, {
        content_type: createTypeDef.label,
        topic: createForm.topic || undefined,
        custom_instruction:
          "Suggest ONE compelling content angle and the single core belief the reader should hold by the end. Respond in 1-2 sentences, no preamble.",
      });
      setZuriOut(String(res?.content || "").trim());
    } catch (e) {
      showToast("Could not fetch an angle");
    } finally {
      setZuriLoading(false);
    }
  }, [createTypeDef, createForm.topic, showToast]);

  /* ---------------- Saved Outputs merged list ---------------- */
  const savedItems = useMemo(() => {
    const fromLibrary = library.map((item) => ({
      id: item.id || item.asset_id,
      source: "library",
      category: categorize(item.content_type),
      typeLabel: item.content_type || "Content",
      title: item.title || item.content || "Untitled",
      date: item.created_at,
      raw: item,
    }));
    const fromVisual = promptSaved.map((item) => ({
      id: item.id,
      source: "visual",
      category: "visual",
      typeLabel: item.content_type ? `${item.content_type} Prompt` : "Visual Prompt",
      title: item.prompt_text || "Prompt",
      date: item.created_at,
      raw: item,
    }));
    const all = [...fromLibrary, ...fromVisual];
    all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return all;
  }, [library, promptSaved]);

  const filteredSaved = useMemo(
    () => (savedFilter === "all" ? savedItems : savedItems.filter((i) => i.category === savedFilter)),
    [savedItems, savedFilter]
  );

  const recentSaves = useMemo(() => savedItems.filter((i) => i.source === "library").slice(0, 4), [savedItems]);

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */
  const tabLocked = (tab === "visual" || tab === "video") && promptLocked;

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: SERIF, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Content Studio
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: SANS }}
          >
            Where brand strategy turns into market-facing content.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <span
            style={{
              fontSize: 10,
              padding: "4px 12px",
              background: "var(--cth-command-panel)",
              border: "0.5px solid var(--cth-command-border)",
              borderRadius: 20,
              color: atLimit ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
              fontWeight: 600,
              fontFamily: SANS,
              whiteSpace: "nowrap",
            }}
          >
            {limit === Infinity ? "Unlimited generations" : `${generationCount} / ${limit} generations this month`}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 py-6 md:px-8" style={PAGE_STYLE} data-testid="content-studio-page">
        <div className="mx-auto w-full" style={{ maxWidth: 1060 }}>
          {/* Tab pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {TABS.map((t) => (
              <button key={t.id} type="button" style={tabPillStyle(tab === t.id)} onClick={() => { setTab(t.id); setError(""); }}>
                {t.label}
              </button>
            ))}
          </div>

          {error ? (
            <div
              style={{
                ...CARD_STYLE,
                marginBottom: 12,
                borderColor: "color-mix(in srgb, var(--cth-command-error) 40%, var(--cth-command-border))",
                color: "var(--cth-command-error)",
                fontSize: 12,
                fontFamily: SANS,
                padding: "10px 14px",
              }}
            >
              {error}
            </div>
          ) : null}

          {tabLocked ? (
            <LockedTab />
          ) : tab === "create" ? (
            /* ============ CREATE CONTENT ============ */
            <div className="grid gap-3" style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 14 }}>
              {/* Form */}
              <div style={CARD_STYLE}>
                <div style={CARD_LBL_STYLE}>Content type</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 12 }}>
                  {CREATE_TYPES.map((t) => (
                    <button key={t.id} type="button" style={typePillStyle(createType === t.id)} onClick={() => setCreateType(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={DIVIDER_STYLE} />
                {createTypeDef.fields.map((f) => (
                  <Field key={f.id} field={f} value={createForm[f.id]} avatars={avatars} onChange={updateCreateField} />
                ))}
                {atLimit ? (
                  <a href="/tiers" style={{ ...GENERATE_BTN_STYLE, textDecoration: "none", background: "var(--cth-command-purple)", color: "var(--cth-command-gold)" }}>
                    Upgrade to keep generating
                  </a>
                ) : (
                  <button type="button" style={{ ...GENERATE_BTN_STYLE, opacity: generating ? 0.6 : 1 }} disabled={generating} onClick={handleCreateGenerate}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {generating ? "Generating…" : `Generate ${createTypeDef.label}`}
                  </button>
                )}
              </div>

              {/* Output + recent saves */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <OutputCard
                  value={createOut}
                  onChange={setCreateOut}
                  onCopy={() => copyText(createOut)}
                  onSave={handleSaveCreate}
                  saving={saving}
                />
                <div style={{ ...CARD_STYLE, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={CARD_LBL_STYLE}>Recent saves</div>
                    <button type="button" style={LBTN_STYLE} onClick={() => setTab("saved")}>View all</button>
                  </div>
                  {loadingLibrary ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                      <Loader2 size={16} className="animate-spin" style={{ color: "var(--cth-command-crimson)" }} />
                    </div>
                  ) : recentSaves.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--cth-command-muted)", fontFamily: SANS, padding: "6px 2px" }}>
                      No saved content yet. Generate and save your first piece above.
                    </div>
                  ) : (
                    recentSaves.map((i) => (
                      <div key={i.id} style={{ padding: "9px 11px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 9, marginBottom: 6 }}>
                        <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 600, marginBottom: 2, fontFamily: SANS }}>
                          {i.typeLabel}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--cth-command-ink)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: SANS }}>
                          {i.title}
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                          <button type="button" style={LBTN_STYLE} onClick={() => loadLibraryItem(i.raw)}>Load</button>
                          {i.category === "social" ? (
                            <button type="button" style={LBTN_STYLE} onClick={() => setPublishItem(i.raw)}>Add to social</button>
                          ) : null}
                          <button type="button" style={LBTN_STYLE} onClick={() => setDeleteTarget({ id: i.id, source: "library", title: i.title })}>Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : tab === "visual" ? (
            /* ============ VISUAL PROMPTS ============ */
            <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 14 }}>
              <div style={CARD_STYLE}>
                <div style={CARD_LBL_STYLE}>Visual type</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
                  {VISUAL_TYPES.map((t) => {
                    const Icon = t.icon;
                    const on = visualType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setVisualType(t.id)}
                        style={{
                          padding: 9,
                          borderRadius: 9,
                          border: on ? "0.5px solid var(--cth-command-crimson)" : "0.5px solid var(--cth-command-border)",
                          background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)",
                          textAlign: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Icon size={15} style={{ color: on ? "var(--cth-command-ivory)" : "var(--cth-command-muted)", marginBottom: 3 }} />
                        <div style={{ fontSize: 10, fontWeight: 600, color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)", fontFamily: SANS }}>
                          {t.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={DIVIDER_STYLE} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                  {VISUAL_DROPDOWNS.map((d) => (
                    <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={FIELD_LABEL_STYLE}>{d.label}</div>
                      <select style={SELECT_STYLE} value={visualParams[d.id]} onChange={(e) => setVisualParams((p) => ({ ...p, [d.id]: e.target.value }))}>
                        <option value="">Select…</option>
                        {d.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <div style={FIELD_LABEL_STYLE}>Output Format</div>
                  <select style={SELECT_STYLE} value={visualParams.output_format} onChange={(e) => setVisualParams((p) => ({ ...p, output_format: e.target.value }))}>
                    <option value="">Select…</option>
                    {OUTPUT_FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <button type="button" style={{ ...GENERATE_BTN_STYLE, opacity: canVisual ? 1 : 0.55, cursor: canVisual ? "pointer" : "not-allowed" }} disabled={!canVisual} onClick={handleVisualGenerate}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  {generating ? "Generating…" : "Generate Prompt"}
                </button>
                {!canVisual && !generating ? (
                  <div style={{ ...FIELD_NOTE_STYLE, textAlign: "center", marginTop: 8 }}>Select a type and at least 3 parameters.</div>
                ) : null}
              </div>
              <OutputCard
                title="Generated prompt"
                value={visualOut}
                readOnly
                mono
                onCopy={() => copyText(visualOut)}
                onSave={handleSaveVisual}
                saving={saving}
                emptyHint="Your generated prompt will appear here."
              />
            </div>
          ) : tab === "video" ? (
            /* ============ VIDEO SCRIPTS ============ */
            <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 14 }}>
              <div style={CARD_STYLE}>
                <div style={CARD_LBL_STYLE}>Video type</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {VIDEO_TYPES.map((t) => (
                    <button key={t.id} type="button" style={typePillStyle(videoType === t.id)} onClick={() => setVideoType(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div style={DIVIDER_STYLE} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  <div style={FIELD_LABEL_STYLE}>Topic <span style={{ color: "var(--cth-command-cinnabar)" }}>*</span></div>
                  <textarea style={TEXTAREA_STYLE} value={videoTopic} placeholder="What is the video about?" onChange={(e) => setVideoTopic(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  <div style={FIELD_LABEL_STYLE}>Target audience</div>
                  <select style={SELECT_STYLE} value={videoAudience} onChange={(e) => setVideoAudience(e.target.value)}>
                    <option value="">Select an avatar (optional)</option>
                    {avatars.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <div style={FIELD_LABEL_STYLE}>Duration</div>
                  <select style={SELECT_STYLE} value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)}>
                    {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {atLimit ? (
                  <a href="/tiers" style={{ ...GENERATE_BTN_STYLE, textDecoration: "none", background: "var(--cth-command-purple)", color: "var(--cth-command-gold)" }}>Upgrade to keep generating</a>
                ) : (
                  <button type="button" style={{ ...GENERATE_BTN_STYLE, opacity: generating ? 0.6 : 1 }} disabled={generating} onClick={handleVideoGenerate}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {generating ? "Generating…" : "Generate Script"}
                  </button>
                )}
              </div>
              <OutputCard
                title="Generated script"
                value={videoOut}
                onChange={setVideoOut}
                onCopy={() => copyText(videoOut)}
                emptyHint="Your generated script will appear here."
              />
            </div>
          ) : tab === "repurpose" ? (
            /* ============ REPURPOSE ============ */
            <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 14 }}>
              <div style={CARD_STYLE}>
                <div style={CARD_LBL_STYLE}>Repurpose existing content</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  <div style={FIELD_LABEL_STYLE}>Original content <span style={{ color: "var(--cth-command-cinnabar)" }}>*</span></div>
                  <textarea style={{ ...TEXTAREA_STYLE, minHeight: 120 }} value={repurposeSource} placeholder="Paste the content you want to repurpose…" onChange={(e) => setRepurposeSource(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  <div style={FIELD_LABEL_STYLE}>Repurpose into</div>
                  <select style={SELECT_STYLE} value={repurposeInto} onChange={(e) => setRepurposeInto(e.target.value)}>
                    {REPURPOSE_INTO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <div style={FIELD_LABEL_STYLE}>Tone</div>
                  <select style={SELECT_STYLE} value={repurposeTone} onChange={(e) => setRepurposeTone(e.target.value)}>
                    {TONE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {atLimit ? (
                  <a href="/tiers" style={{ ...GENERATE_BTN_STYLE, textDecoration: "none", background: "var(--cth-command-purple)", color: "var(--cth-command-gold)" }}>Upgrade to keep generating</a>
                ) : (
                  <button type="button" style={{ ...GENERATE_BTN_STYLE, opacity: generating ? 0.6 : 1 }} disabled={generating} onClick={handleRepurposeGenerate}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {generating ? "Generating…" : "Repurpose Content"}
                  </button>
                )}
              </div>
              <OutputCard
                title="Repurposed output"
                value={repurposeOut}
                onChange={setRepurposeOut}
                onCopy={() => copyText(repurposeOut)}
                emptyHint="Paste content on the left, then generate to see it repurposed here."
              />
            </div>
          ) : tab === "campaign" ? (
            /* ============ CAMPAIGN ASSETS ============ */
            <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 14 }}>
              <div style={CARD_STYLE}>
                <div style={CARD_LBL_STYLE}>Campaign</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <div style={FIELD_LABEL_STYLE}>Select campaign</div>
                  <select style={SELECT_STYLE} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                    <option value="">Select a campaign…</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {campaigns.length === 0 ? <div style={FIELD_NOTE_STYLE}>No campaigns yet — create one in Campaign Builder.</div> : null}
                </div>
                <div style={CARD_LBL_STYLE}>Asset type</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 12 }}>
                  {CAMPAIGN_ASSET_TYPES.map((a) => (
                    <button key={a} type="button" style={typePillStyle(campaignAsset === a)} onClick={() => setCampaignAsset(a)}>{a}</button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  <div style={FIELD_LABEL_STYLE}>Custom instruction</div>
                  <textarea style={TEXTAREA_STYLE} value={campaignInstruction} placeholder="Any specific angle, offer detail, or CTA? (optional)" onChange={(e) => setCampaignInstruction(e.target.value)} />
                </div>
                {atLimit ? (
                  <a href="/tiers" style={{ ...GENERATE_BTN_STYLE, textDecoration: "none", background: "var(--cth-command-purple)", color: "var(--cth-command-gold)" }}>Upgrade to keep generating</a>
                ) : (
                  <button type="button" style={{ ...GENERATE_BTN_STYLE, opacity: generating ? 0.6 : 1 }} disabled={generating} onClick={handleCampaignGenerate}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {generating ? "Generating…" : "Generate Asset"}
                  </button>
                )}
              </div>
              <OutputCard
                title="Generated asset"
                value={campaignOut}
                onChange={setCampaignOut}
                onCopy={() => copyText(campaignOut)}
                emptyHint="Select a campaign and asset type, then generate."
              />
            </div>
          ) : (
            /* ============ SAVED OUTPUTS ============ */
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {SAVED_FILTERS.map((f) => (
                  <button key={f.id} type="button" style={tabPillStyle(savedFilter === f.id)} onClick={() => setSavedFilter(f.id)}>{f.label}</button>
                ))}
              </div>
              <div style={CARD_STYLE}>
                {loadingLibrary ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                    <Loader2 size={20} className="animate-spin" style={{ color: "var(--cth-command-crimson)" }} />
                  </div>
                ) : filteredSaved.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 20px", color: "var(--cth-command-muted)" }}>
                    <FileText size={36} strokeWidth={1.2} />
                    <div style={{ fontFamily: SERIF, fontSize: 18, color: "var(--cth-command-ink)" }}>No saved outputs</div>
                    <div style={{ fontFamily: SANS, fontSize: 12 }}>Generate and save content to build your library.</div>
                  </div>
                ) : (
                  filteredSaved.map((i) => (
                    <div key={`${i.source}-${i.id}`} style={{ padding: "11px 13px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 9, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cth-command-crimson)", fontWeight: 700, fontFamily: SANS }}>{i.typeLabel}</span>
                            {i.date ? <span style={{ fontSize: 10, color: "var(--cth-command-muted)", fontFamily: SANS }}>{formatDate(i.date)}</span> : null}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--cth-command-ink)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: SANS }}>{i.title}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {i.source === "library" ? (
                            <button type="button" style={LBTN_STYLE} onClick={() => loadLibraryItem(i.raw)}>Load</button>
                          ) : (
                            <button type="button" style={LBTN_STYLE} onClick={() => copyText(i.raw.prompt_text)}>Copy</button>
                          )}
                          {i.category === "social" ? (
                            <button type="button" style={LBTN_STYLE} onClick={() => setPublishItem(i.raw)}>Add to social</button>
                          ) : null}
                          <button type="button" style={LBTN_STYLE} onClick={() => setDeleteTarget({ id: i.id, source: i.source, title: i.title })}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============ Zuri card (bottom of page) ============ */}
          <div style={{ background: "#1a0828", borderRadius: 12, padding: "18px 20px", marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e04e35", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: "#fff" }}>Z</span>
              </div>
              <span style={{ fontFamily: SANS, fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7a6090" }}>
                Zuri · Content Inspiration
              </span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 15, color: "#e8dff0", fontStyle: "italic", lineHeight: 1.55, marginBottom: tab === "create" ? 10 : 0 }}>
              {zuriOut && tab === "create" ? `"${zuriOut}"` : ZURI_TEXT[tab]}
            </div>
            {tab === "create" ? (
              <button
                type="button"
                onClick={handleInspire}
                disabled={zuriLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#e04e35",
                  background: "transparent",
                  border: "0.5px solid rgba(224,78,53,.4)",
                  borderRadius: 6,
                  padding: "5px 12px",
                  cursor: zuriLoading ? "not-allowed" : "pointer",
                  fontFamily: SANS,
                }}
              >
                {zuriLoading ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                {zuriLoading ? "Thinking…" : "Inspire my angle"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 1000,
            padding: "10px 16px",
            borderRadius: 8,
            background: "var(--cth-command-ink)",
            color: "var(--cth-command-ivory)",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          }}
        >
          {toast}
        </div>
      ) : null}

      {/* Delete modal */}
      {deleteTarget ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,0,16,0.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 12, padding: 28, width: "min(420px,100%)" }}>
            <h3 style={{ margin: "0 0 8px", fontFamily: SERIF, fontSize: 20, color: "var(--cth-command-ink)" }}>Delete this output?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--cth-command-muted)", fontFamily: SANS }}>
              "{deleteTarget.title || "This item"}" will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "0.5px solid var(--cth-command-border)", background: "transparent", color: "var(--cth-command-ink)", fontFamily: SANS, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", fontFamily: SANS, fontSize: 13, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PublishDrawer item={publishItem} onClose={() => setPublishItem(null)} />
    </DashboardLayout>
  );
}
