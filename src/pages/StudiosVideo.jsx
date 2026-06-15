import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Video as VideoIcon, Lock, Check, Image as ImageIcon, Play, Loader2, Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const absUrl = (u) => (!u ? u : /^(https?:|data:)/.test(u) ? u : `${API_BASE}${u}`);

const PLAN_RANK = { free: 0, audit: 1, foundation: 2, structure: 3, house: 4, estate: 5, legacy: 6 };

// Four formats in a 2x2 grid. `form` decides in-page (short) vs background (medium).
const FORMATS = [
  { key: "short_916", label: "Short Form", ratio: "9:16", form: "short", badge: "In-page",
    sub: "9:16 · 15–60s",
    durations: [{ label: "15 seconds", val: 15 }, { label: "30 seconds", val: 30 }, { label: "60 seconds", val: 60 }] },
  { key: "short_169", label: "Short Form", ratio: "16:9", form: "short", badge: "In-page",
    sub: "16:9 · 15–60s",
    durations: [{ label: "15 seconds", val: 15 }, { label: "30 seconds", val: 30 }, { label: "60 seconds", val: 60 }] },
  { key: "medium_916", label: "Medium Form", ratio: "9:16", form: "medium", badge: "Background",
    sub: "9:16 · 2–3 min",
    durations: [{ label: "90 seconds", val: 90 }, { label: "2 min", val: 120 }, { label: "3 min", val: 180 }] },
  { key: "medium_169", label: "Medium Form", ratio: "16:9", form: "medium", badge: "Background",
    sub: "16:9 · 2–3 min",
    durations: [{ label: "90 seconds", val: 90 }, { label: "2 min", val: 120 }, { label: "3 min", val: 180 }] },
];

const MODELS = [
  { id: "bytedance/seedance-2.0", label: "Seedance 2.0", sub: "Identity · 1080p · Recommended" },
  { id: "bytedance/seedance-2.0-fast", label: "Seedance 2.0 Fast", sub: "Quick draft · 720p" },
  { id: "google/veo-3.1", label: "Veo 3.1", sub: "Cinematic · 1080p" },
  { id: "kwaivgi/kling-v3.0-pro", label: "Kling v3.0 Pro", sub: "Narrative · 1080p" },
  { id: "google/veo-3.1-fast", label: "Veo 3.1 Fast", sub: "Cinematic fast · 720p" },
  { id: "minimax/hailuo-2.3", label: "Hailuo 2.3", sub: "Stylized · creative" },
  { id: "kwaivgi/kling-v3.0-std", label: "Kling v3.0 Std", sub: "Budget cinematic" },
  { id: "openai/sora-2-pro", label: "Sora 2 Pro", sub: "Highest fidelity" },
];

// Higgsfield video models, shown only when the workspace has Higgsfield connected
// and the Higgsfield provider is selected. Ids must match the backend
// HIGGSFIELD_VIDEO_MODEL_IDS allowlist exactly.
const HIGGSFIELD_VIDEO_MODELS = [
  { id: "higgsfield-ai/dop/standard", label: "DOP Standard", sub: "Higgsfield · cinematic" },
  { id: "bytedance/seedance/v1/pro/image-to-video", label: "Seedance v1 Pro", sub: "Higgsfield · image-to-video" },
  { id: "kling-video/v2.1/pro/image-to-video", label: "Kling v2.1 Pro", sub: "Higgsfield · image-to-video" },
];

// Fallback fal.ai video shortlist if the /api/studios/models fetch hasn't
// resolved yet (mirrors the backend FAL_VIDEO_MODELS curation).
const FAL_VIDEO_FALLBACK = [
  { id: "fal-ai/kling-video/v2.6/pro/text-to-video", label: "Kling v2.6 Pro", sub: "fal.ai · text-to-video" },
  { id: "fal-ai/veo3.1/text-to-video", label: "Veo 3.1", sub: "fal.ai · cinematic" },
  { id: "fal-ai/sora-2/text-to-video", label: "Sora 2", sub: "fal.ai · highest fidelity" },
];

// Shared "browse all fal.ai models" modal — searchable + category-filterable
// catalog pulled live from the backend; picking a model returns its id.
function FalModelBrowser({ title, loading, models, search, setSearch, cat, setCat, categories, onPick, onClose }) {
  const q = (search || "").trim().toLowerCase();
  const filtered = (models || []).filter((m) => {
    if (cat && cat !== "all" && m.category !== cat) return false;
    if (!q) return true;
    return (m.id || "").toLowerCase().includes(q)
      || (m.title || "").toLowerCase().includes(q)
      || (m.shortDescription || "").toLowerCase().includes(q);
  });
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(13,0,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 680, maxHeight: "82vh", display: "flex", flexDirection: "column", background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", borderRadius: 14, overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--cth-command-border)" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: "var(--cth-command-ink)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cth-command-muted)", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderBottom: "1px solid var(--cth-command-border)", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search models…" style={{ flex: "1 1 200px", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--cth-command-border)", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", fontSize: 12 }} />
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--cth-command-border)", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", fontSize: 12 }}>
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
          </select>
        </div>
        <div style={{ overflowY: "auto", padding: 12 }}>
          {loading ? (
            <div style={{ padding: 28, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 13 }}>Loading fal.ai catalog…</div>
          ) : !filtered.length ? (
            <div style={{ padding: 28, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 13 }}>No models match.</div>
          ) : (
            filtered.map((m) => (
              <button key={m.id} onClick={() => onPick(m.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 6, borderRadius: 8, border: "1px solid var(--cth-command-border)", background: "var(--cth-command-blush)", cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--cth-command-ink)" }}>{m.title || m.id}</div>
                <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 1 }}>{m.id}{m.category ? ` · ${m.category}` : ""}</div>
                {m.shortDescription ? <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>{m.shortDescription.slice(0, 120)}</div> : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Supported duration range (seconds) per OpenRouter model. Used to filter the
// duration select so a founder can't pick a length the model can't render.
const MODEL_DURATION_LIMITS = {
  "bytedance/seedance-2.0": { min: 4, max: 15 },
  "bytedance/seedance-2.0-fast": { min: 4, max: 10 },
  "google/veo-3.1": { min: 5, max: 180 },
  "google/veo-3.1-fast": { min: 5, max: 120 },
  "kwaivgi/kling-v3.0-pro": { min: 5, max: 180 },
  "kwaivgi/kling-v3.0-std": { min: 5, max: 120 },
  "minimax/hailuo-2.3": { min: 6, max: 120 },
  "openai/sora-2-pro": { min: 5, max: 180 },
};

// The format's duration options intersected with the selected model's range.
// If the format offers nothing in range (e.g. Seedance + Medium Form), fall back
// to the model's max so the select always has a valid option.
function durationsForModel(format, modelId) {
  const limit = MODEL_DURATION_LIMITS[modelId] || { min: 0, max: Infinity };
  const filtered = format.durations.filter((d) => d.val >= limit.min && d.val <= limit.max);
  if (filtered.length) return filtered;
  return [{ label: `${limit.max} seconds`, val: limit.max }];
}

// Realistic generation time per model, expressed as seconds of wall-clock wait
// per second of finished video. Used to drive the in-page progress estimate.
const MODEL_TIME_ESTIMATES = {
  "bytedance/seedance-2.0-fast": 8,
  "bytedance/seedance-2.0": 15,
  "google/veo-3.1": 20,
  "google/veo-3.1-fast": 12,
  "kwaivgi/kling-v3.0-pro": 18,
  "kwaivgi/kling-v3.0-std": 12,
  "minimax/hailuo-2.3": 15,
  "openai/sora-2-pro": 25,
};

// Estimated total wall-clock seconds for a generation, from the model's
// per-second ratio and the requested video duration. Floored at 15s so very
// short clips still show a sensible countdown.
function estimatedTotalSeconds(modelId, duration) {
  const ratio = MODEL_TIME_ESTIMATES[modelId] ?? 15;
  return Math.max(15, Math.round(ratio * duration));
}

const WM_POSITIONS = [
  { key: "bottom_right", label: "Bottom right" },
  { key: "bottom_left", label: "Bottom left" },
  { key: "top_right", label: "Top right" },
  { key: "top_left", label: "Top left" },
];

const CARD = { background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 12, padding: 18 };
const CARD_LABEL = { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500, marginBottom: 12 };
const FIELD_LABEL = { fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500 };
const FIELD_INPUT = { padding: "8px 11px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, fontSize: 12, color: "var(--cth-command-ink)", fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };
const DIVIDER = { height: "0.5px", background: "var(--cth-command-border)", margin: "12px 0" };

function pill(on) {
  return {
    border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
    background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)",
    color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  };
}

function Toggle({ on, onClick }) {
  return (
    <div
      role="switch" aria-checked={on} onClick={onClick}
      style={{ width: 34, height: 18, background: on ? "var(--cth-command-crimson)" : "var(--cth-command-border)", borderRadius: 20, position: "relative", flexShrink: 0, cursor: "pointer" }}
    >
      <div style={{ width: 14, height: 14, background: "var(--cth-command-ivory)", borderRadius: "50%", position: "absolute", top: 2, left: on ? "auto" : 2, right: on ? 2 : "auto" }} />
    </div>
  );
}

// Textarea that grows to fit its content so the founder never has to scroll a
// small box while writing. Height resets to `auto` then snaps to scrollHeight on
// every value change — including programmatic ones (e.g. pasted-in scripts).
function AutoTextarea({ value, onChange, minHeight = 52, style, ...rest }) {
  const ref = useRef(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);
  useEffect(() => { resize(); }, [value, resize]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => { onChange(e); resize(); }}
      style={{ ...style, minHeight, overflow: "hidden" }}
      {...rest}
    />
  );
}

function LockedView() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div style={{ ...CARD, padding: 32, textAlign: "center" }} data-testid="video-locked">
          <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)" }}>
            <Lock size={26} style={{ color: "var(--cth-command-crimson)" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>Video Studio</h1>
          <p style={{ fontSize: 13, color: "var(--cth-command-muted)", lineHeight: 1.6, margin: "10px auto 22px", maxWidth: 360 }}>
            Generate branded videos from your script, prompt, and brand identity. This studio unlocks on The Foundation plan and above.
          </p>
          <button onClick={() => navigate("/billing")} style={{ padding: "10px 22px", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            View plans
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function StudiosVideo() {
  const navigate = useNavigate();
  const { plan, isSuperAdmin } = usePlan();
  const normalizedPlan = String(plan || "free").toLowerCase();
  const pageLocked = (PLAN_RANK[normalizedPlan] ?? 0) < PLAN_RANK.foundation && !isSuperAdmin;

  const uploadRef = useRef(null);
  const shortPollRef = useRef(null);
  const bgPollRef = useRef(null);
  const progressRef = useRef(null);
  const blobUrlRef = useRef(null);
  const prevQueueStatus = useRef({});

  const [formatKey, setFormatKey] = useState(FORMATS[0].key);
  const activeFormat = FORMATS.find((f) => f.key === formatKey) || FORMATS[0];
  const [duration, setDuration] = useState(FORMATS[0].durations[0].val);

  const [refTab, setRefTab] = useState("upload");
  const [selectedRef, setSelectedRef] = useState(null); // { key, url, label }
  const [uploadPreview, setUploadPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [headshots, setHeadshots] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);

  const [script, setScript] = useState("");
  const [visualPrompt, setVisualPrompt] = useState("");
  const [modelId, setModelId] = useState(FAL_VIDEO_FALLBACK[0].id);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [higgsfieldConnected, setHiggsfieldConnected] = useState(false);
  const [provider, setProvider] = useState("fal");
  const [falVideoModels, setFalVideoModels] = useState([]);
  // "Browse all fal.ai models" modal
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseModels, setBrowseModels] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseCat, setBrowseCat] = useState("all");

  const [watermark, setWatermark] = useState(false);
  const [wmPosition, setWmPosition] = useState("bottom_right");
  const [logoUrl, setLogoUrl] = useState("");
  const [identity, setIdentity] = useState(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);

  const [usage, setUsage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [job, setJob] = useState(null);           // active short-form job
  const [progress, setProgress] = useState(0);
  const [estTotal, setEstTotal] = useState(0); // estimated total seconds for the active job
  const [videoUrl, setVideoUrl] = useState("");    // object URL for in-page playback
  const [bgNote, setBgNote] = useState(false);     // medium-form note shown
  const [queue, setQueue] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hoverVideoId, setHoverVideoId] = useState(null);   // saved card under cursor
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // saved inline confirm open
  const [hoverQueueId, setHoverQueueId] = useState(null);   // queue card under cursor
  const [confirmQueueId, setConfirmQueueId] = useState(null); // queue inline confirm open

  const activeModels = provider === "higgsfield"
    ? HIGGSFIELD_VIDEO_MODELS
    : (falVideoModels.length ? falVideoModels : FAL_VIDEO_FALLBACK);
  const modelLimit = MODEL_DURATION_LIMITS[modelId] || { min: 0, max: Infinity };
  const availableDurations = durationsForModel(activeFormat, modelId);
  const isSeedance = provider === "openrouter" && modelId.startsWith("bytedance/seedance");

  // Keep the selected duration within the model's supported range. When the
  // model or format changes and the current duration is out of range, reset to
  // the maximum value the model actually supports for this format.
  useEffect(() => {
    const allowed = durationsForModel(activeFormat, modelId).map((d) => d.val);
    if (!allowed.includes(duration)) {
      setDuration(Math.max(...allowed));
    }
  }, [modelId, formatKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsage = useCallback(async () => {
    try { setUsage((await apiClient.get("/api/studios/usage", { params: { type: "video" } })) || null); }
    catch { setUsage(null); }
  }, []);
  const loadHeadshots = useCallback(async () => {
    try { const r = await apiClient.get("/api/studios/headshots"); setHeadshots(Array.isArray(r?.headshots) ? r.headshots : []); }
    catch { setHeadshots([]); }
  }, []);
  const loadMedia = useCallback(async () => {
    try {
      const r = await apiClient.get("/api/media-upload/assets");
      const imgs = (Array.isArray(r?.assets) ? r.assets : []).filter(
        (a) => String(a.file_type || "").startsWith("image/") || !a.file_type
      );
      setMediaAssets(imgs);
    } catch { setMediaAssets([]); }
  }, []);
  const loadQueue = useCallback(async () => {
    try {
      const r = await apiClient.get("/api/studios/videos/queue");
      const jobs = Array.isArray(r?.jobs) ? r.jobs : [];
      // Detect medium-form jobs that just turned ready, and toast once.
      jobs.forEach((j) => {
        const prev = prevQueueStatus.current[j.job_id];
        if (j.form === "medium" && prev && prev !== "completed" && j.status === "completed") {
          toast.success("Your video is ready", { description: j.name });
        }
        prevQueueStatus.current[j.job_id] = j.status;
      });
      setQueue(jobs);
    } catch { setQueue([]); }
  }, []);
  const loadSaved = useCallback(async () => {
    try { const r = await apiClient.get("/api/studios/videos"); setSavedVideos(Array.isArray(r?.videos) ? r.videos : []); }
    catch { setSavedVideos([]); }
  }, []);
  const loadIdentityAndLogo = useCallback(async () => {
    let id = null;
    try { id = await apiClient.get("/api/identity"); } catch { id = null; }
    setIdentity(id);
    // Spec: read logo_url from identity. It has none today, so fall back to the
    // media library's logo assets so the watermark logo actually resolves.
    let logo = id?.logo_url || "";
    if (!logo) {
      for (const cat of ["logo_light", "logo_dark"]) {
        try {
          const r = await apiClient.get("/api/media-upload/assets", { params: { category: cat } });
          const first = (Array.isArray(r?.assets) ? r.assets : [])[0];
          if (first?.preview_url) { logo = first.preview_url; break; }
        } catch { /* ignore */ }
      }
    }
    setLogoUrl(logo || "");
    setIdentityLoaded(true);
  }, []);

  const loadHiggsfield = useCallback(async () => {
    try { const r = await apiClient.get("/api/integrations/higgsfield"); setHiggsfieldConnected(!!r?.connected); }
    catch { setHiggsfieldConnected(false); }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const r = await apiClient.get("/api/studios/models");
      const vids = Array.isArray(r?.video_models) ? r.video_models : [];
      setFalVideoModels(vids);
    } catch {
      /* keep curated fallback */
    }
  }, []);

  const openBrowse = useCallback(async () => {
    setBrowseOpen(true);
    setBrowseLoading(true);
    try {
      const r = await apiClient.get("/api/studios/fal-models/video");
      setBrowseModels(Array.isArray(r?.models) ? r.models : []);
    } catch {
      setBrowseModels([]);
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pageLocked) return;
    loadUsage(); loadHeadshots(); loadMedia(); loadQueue(); loadSaved(); loadIdentityAndLogo(); loadHiggsfield(); loadModels();
  }, [pageLocked, loadUsage, loadHeadshots, loadMedia, loadQueue, loadSaved, loadIdentityAndLogo, loadHiggsfield, loadModels]);

  // When the provider changes, snap the model to the first one that provider
  // offers (the previously selected id won't exist in the other provider's list).
  useEffect(() => {
    const models = provider === "higgsfield"
      ? HIGGSFIELD_VIDEO_MODELS
      : (falVideoModels.length ? falVideoModels : FAL_VIDEO_FALLBACK);
    if (models.length && !models.some((m) => m.id === modelId)) setModelId(models[0].id);
  }, [provider, falVideoModels]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background queue poll, every 30s.
  useEffect(() => {
    if (pageLocked) return;
    bgPollRef.current = setInterval(loadQueue, 30000);
    return () => clearInterval(bgPollRef.current);
  }, [pageLocked, loadQueue]);

  // Cleanup timers + object URLs on unmount.
  useEffect(() => () => {
    clearInterval(shortPollRef.current);
    clearInterval(bgPollRef.current);
    clearInterval(progressRef.current);
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  const brandColors = (identity?.colors || []).map((c) => c.hex).filter(Boolean);
  const brandFonts = (identity?.fonts || []).map((f) => f.family).filter(Boolean);
  const hasIdentity = brandColors.length > 0 || brandFonts.length > 0;

  const acceptUpload = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (f.size > 10 * 1024 * 1024) return toast.error("That image is larger than 10MB.");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setUploadPreview(dataUrl);
      setSelectedRef({ key: "upload", url: dataUrl, label: f.name });
    };
    reader.readAsDataURL(f);
  }, []);

  const selectAsset = (key, url, label) => {
    setSelectedRef({ key, url: absUrl(url), label });
  };

  const authedDownloadBlob = async (jobId) => {
    const url = apiClient.buildApiUrl(`/api/studios/videos/download/${jobId}`);
    const headers = await apiClient.getAuthHeaders({ body: {} });
    const res = await fetch(url, { method: "POST", headers, credentials: "include" });
    if (!res.ok) throw new Error("Download failed");
    return res.blob();
  };

  const triggerBlobDownload = (blob, name) => {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl; a.download = `${name || "video"}.mp4`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const startProgress = (estSeconds) => {
    const started = Date.now();
    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setProgress(Math.min(95, Math.round((elapsed / estSeconds) * 100)));
    }, 1000);
  };

  const finishShortJob = async (jobId, name) => {
    clearInterval(shortPollRef.current);
    clearInterval(progressRef.current);
    setProgress(100);
    try {
      const blob = await authedDownloadBlob(jobId);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const objectUrl = URL.createObjectURL(blob);
      blobUrlRef.current = objectUrl;
      setVideoUrl(objectUrl);
      toast.success("Your video is ready.");
    } catch {
      toast.error("Video finished but could not be loaded. Try Download.");
    } finally {
      setGenerating(false);
      loadQueue();
    }
  };

  const pollShort = (jobId, name) => {
    clearInterval(shortPollRef.current);
    shortPollRef.current = setInterval(async () => {
      try {
        const r = await apiClient.get(`/api/studios/videos/poll/${jobId}`);
        if (r?.status === "completed" || r?.content_url) {
          finishShortJob(jobId, name);
        } else if (r?.status === "failed" || r?.status === "cancelled" || r?.status === "expired") {
          clearInterval(shortPollRef.current);
          clearInterval(progressRef.current);
          setGenerating(false);
          toast.error(`Generation ${r.status}.`);
        }
      } catch { /* keep polling */ }
    }, 3000);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setVideoUrl(""); setBgNote(false); setProgress(0);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    try {
      const model = activeModels.find((m) => m.id === modelId) || activeModels[0];
      const brandContext = hasIdentity ? JSON.stringify({ colors: brandColors, fonts: brandFonts }) : "";
      const body = {
        provider,
        model_id: modelId,
        model_label: (model && model.label) || modelId,
        format: `${activeFormat.label} ${activeFormat.ratio}`,
        form: activeFormat.form,
        aspect_ratio: activeFormat.ratio,
        duration,
        script,
        visual_prompt: visualPrompt,
        brand_context: brandContext,
        generate_audio: generateAudio,
        reference_image_url: selectedRef?.url || null,
        watermark,
        watermark_position: wmPosition,
        watermark_logo_url: watermark ? (logoUrl || null) : null,
      };
      const res = await apiClient.post("/api/studios/videos/generate", body);
      if (res?.usage) setUsage((p) => ({ ...(p || {}), video_count: res.usage.used, video_limit: res.usage.limit }));
      else loadUsage();

      const jobId = res?.job_id;
      const name = (script || "").trim().split("\n")[0]?.slice(0, 80) || "Untitled video";
      setJob({ job_id: jobId, name, form: activeFormat.form });

      if (activeFormat.form === "medium") {
        setBgNote(true);
        setGenerating(false);
        toast.message("Generating in the background.", { description: "You'll be notified when it's ready." });
        loadQueue();
      } else {
        // Estimate: ~3s of wait per second of video, floored at 30s.
        const est = estimatedTotalSeconds(modelId, duration);
        setEstTotal(est);
        startProgress(est);
        pollShort(jobId, name);
      }
    } catch (err) {
      setGenerating(false);
      toast.error(err?.message || "Generation failed. Please try again.");
    }
  };

  const handleSave = async (jobId) => {
    if (!jobId) return;
    setSaving(true);
    try {
      await apiClient.post("/api/studios/videos/save", { job_id: jobId });
      toast.success("Saved to your library.");
      loadSaved();
    } catch (err) {
      toast.error(err?.message || "Could not save to library.");
    } finally { setSaving(false); }
  };

  const handleDeleteSaved = async (videoId) => {
    const prev = savedVideos;
    // Optimistic: drop the card immediately, restore it if the delete fails.
    setSavedVideos((list) => list.filter((x) => x.id !== videoId));
    setConfirmDeleteId(null);
    setHoverVideoId(null);
    try {
      await apiClient.delete(`/api/studios/videos/${videoId}`);
      toast.success("Video deleted.");
    } catch (err) {
      setSavedVideos(prev);
      toast.error(err?.message || "Could not delete the video.");
    }
  };

  const handleDeleteQueue = async (jobId) => {
    const prev = queue;
    // Optimistic: drop the card immediately, restore it if the delete fails.
    setQueue((list) => list.filter((j) => j.job_id !== jobId));
    setConfirmQueueId(null);
    setHoverQueueId(null);
    try {
      await apiClient.delete(`/api/studios/videos/queue/${jobId}`);
      toast.success("Removed from queue.");
    } catch (err) {
      setQueue(prev);
      toast.error(err?.message || "Could not remove from queue.");
    }
  };

  // Stop an in-page short-form generation. We can't cancel the upstream
  // OpenRouter job (already running, credit already spent), so we just stop
  // watching it and delete our DB record so it doesn't linger in the queue.
  const handleStopGeneration = async () => {
    const jobId = job?.job_id;
    clearInterval(shortPollRef.current);
    clearInterval(progressRef.current);
    setGenerating(false);
    setProgress(0);
    setJob(null);
    toast.success("Generation stopped.");
    if (jobId) {
      try { await apiClient.delete(`/api/studios/videos/queue/${jobId}`); }
      catch { /* best effort — the OpenRouter job can't be cancelled anyway */ }
    }
    loadQueue();
  };

  const downloadJob = async (jobId, name) => {
    try {
      const blob = await authedDownloadBlob(jobId);
      triggerBlobDownload(blob, name);
    } catch { toast.error("Download failed. The video may still be processing."); }
  };

  if (pageLocked) return <LockedView />;

  const limitLabel = usage ? (usage.video_limit === null ? "∞" : usage.video_limit) : "—";
  const atLimit = usage && usage.video_limit !== null && usage.video_count >= usage.video_limit;
  const generateDisabled = generating || atLimit;

  const refTabs = [
    { key: "upload", label: "Upload photo" },
    { key: "headshots", label: "Saved headshots" },
    { key: "media", label: "Media library" },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" data-testid="studios-video-page">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button
            onClick={() => navigate("/studios")} data-testid="video-back-btn"
            style={{ fontSize: 11, color: "var(--cth-command-muted)", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}
          >
            <ArrowLeft size={11} /> Studios
          </button>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--cth-command-ink)" }}>Video Studio</div>
            <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
              Generate branded videos from your script, prompt, and brand identity.
            </div>
          </div>
        </div>

        <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)" }}>
          {/* ---- FORM ---- */}
          <div style={CARD}>
            <div style={CARD_LABEL}>Generation settings</div>

            <div data-testid="video-usage" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>Generations this month</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-crimson)" }}>
                {usage ? `${usage.video_count} / ${limitLabel} used` : "Loading…"}
              </span>
            </div>

            {/* Format 2x2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              <div style={FIELD_LABEL}>Format <span style={{ color: "var(--cth-command-crimson)" }}>*</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {FORMATS.map((f) => {
                  const on = f.key === formatKey;
                  return (
                    <button
                      key={f.key} onClick={() => setFormatKey(f.key)}
                      data-testid={`video-fmt-${f.key}`}
                      style={{ ...pill(on), padding: "8px 6px", borderRadius: 7, fontSize: 10, fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}
                    >
                      {f.label}
                      <span style={{ fontSize: 8, display: "block", marginTop: 2, color: on ? "var(--cth-command-ivory)" : "var(--cth-command-muted)", opacity: on ? 0.7 : 1 }}>{f.sub}</span>
                      <span style={{ fontSize: 8, display: "inline-block", marginTop: 2, padding: "1px 5px", borderRadius: 3, background: on ? "rgba(255,255,255,0.15)" : "var(--cth-command-panel)", color: on ? "var(--cth-command-ivory)" : "var(--cth-command-muted)", border: on ? "none" : "0.5px solid var(--cth-command-border)" }}>{f.badge}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>
                Background generations notify you when ready — you can navigate away.
              </div>
            </div>

            {/* Duration */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Duration</div>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={FIELD_INPUT} data-testid="video-duration">
                {availableDurations.map((d) => <option key={d.val} value={d.val}>{d.label}</option>)}
              </select>
              {isSeedance && (
                <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }} data-testid="video-duration-note">
                  Seedance 2.0 supports up to 15 seconds — choose Veo 3.1 or Kling for longer videos.
                </div>
              )}
            </div>

            <div style={DIVIDER} />

            {/* Reference image — three tabs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Reference image</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {refTabs.map((t) => {
                  const on = t.key === refTab;
                  return (
                    <button key={t.key} onClick={() => setRefTab(t.key)} data-testid={`video-reftab-${t.key}`}
                      style={{ ...pill(on), padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 500 }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {refTab === "upload" && (
                <div
                  data-testid="video-upload-zone"
                  onClick={() => uploadRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptUpload(e.dataTransfer.files?.[0]); }}
                  style={{ border: "1px dashed var(--cth-command-border)", borderRadius: 10, padding: uploadPreview ? 10 : 16, textAlign: "center", cursor: "pointer", background: dragOver ? "var(--cth-command-panel-soft)" : "var(--cth-command-blush)" }}
                >
                  {uploadPreview && selectedRef?.key === "upload" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <img src={uploadPreview} alt="Reference" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 7, border: "0.5px solid var(--cth-command-border)" }} />
                      <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>{selectedRef.label} · click to replace</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 6 }}><ImageIcon size={20} style={{ color: "var(--cth-command-muted)" }} /></div>
                      <div style={{ fontSize: 11, color: "var(--cth-command-muted)", lineHeight: 1.5 }}>Upload a reference photo for identity anchoring</div>
                      <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 3 }}>JPG, PNG, WEBP up to 10MB — recommended for brand consistency</div>
                    </>
                  )}
                  <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => acceptUpload(e.target.files?.[0])} />
                </div>
              )}

              {refTab === "headshots" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }} data-testid="video-headshots-grid">
                  {headshots.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center", fontSize: 11, color: "var(--cth-command-muted)" }}>No saved headshots yet.</div>
                  ) : headshots.map((h) => {
                    const sel = selectedRef?.key === `headshot:${h.id}`;
                    return (
                      <div key={h.id} onClick={() => selectAsset(`headshot:${h.id}`, h.image_url, "Headshot")}
                        style={{ borderRadius: 8, aspectRatio: "4 / 5", border: sel ? "2px solid var(--cth-command-crimson)" : "0.5px solid var(--cth-command-border)", overflow: "hidden", cursor: "pointer", position: "relative", background: "var(--cth-command-blush)" }}>
                        <img src={absUrl(h.image_url)} alt="Headshot" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {sel && <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--cth-command-crimson)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={10} style={{ color: "var(--cth-command-ivory)" }} /></div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {refTab === "media" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }} data-testid="video-media-grid">
                  {mediaAssets.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center", fontSize: 11, color: "var(--cth-command-muted)" }}>No media in your library yet.</div>
                  ) : mediaAssets.map((a) => {
                    const sel = selectedRef?.key === `media:${a.asset_id}`;
                    return (
                      <div key={a.asset_id} onClick={() => selectAsset(`media:${a.asset_id}`, a.preview_url, a.label)}
                        style={{ borderRadius: 8, aspectRatio: "16 / 9", border: sel ? "2px solid var(--cth-command-crimson)" : "0.5px solid var(--cth-command-border)", overflow: "hidden", cursor: "pointer", position: "relative", background: "var(--cth-command-blush)" }}>
                        <img src={absUrl(a.preview_url)} alt={a.label || "Media"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {sel && <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--cth-command-crimson)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={10} style={{ color: "var(--cth-command-ivory)" }} /></div>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 4 }}>
                {selectedRef ? `Selected: ${selectedRef.label} — used as identity anchor` : "Optional — used as identity anchor in the generated video"}
              </div>
            </div>

            {/* Script */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Script</div>
              <AutoTextarea value={script} onChange={(e) => setScript(e.target.value)} minHeight={72} placeholder="Paste your script from Content Studio or write one here." style={{ ...FIELD_INPUT, resize: "none", lineHeight: 1.6 }} data-testid="video-script" />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>From Content Studio:</span>
                <button onClick={() => navigate("/content-studio")} style={{ fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Video Scripts</button>
              </div>
            </div>

            {/* Visual prompt */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Visual prompt</div>
              <AutoTextarea value={visualPrompt} onChange={(e) => setVisualPrompt(e.target.value)} minHeight={52} placeholder="Describe the visual style, setting, movement, or mood." style={{ ...FIELD_INPUT, resize: "none", lineHeight: 1.6 }} data-testid="video-visual-prompt" />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>From Content Studio:</span>
                <button onClick={() => navigate("/content-studio")} style={{ fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Visual Prompts</button>
              </div>
            </div>

            <div style={DIVIDER} />

            {/* Model selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Generation model</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {activeModels.map((m) => {
                  const on = m.id === modelId;
                  return (
                    <button key={m.id} onClick={() => setModelId(m.id)} data-testid={`video-model-${m.id.replace(/[^a-z0-9]+/gi, "-")}`}
                      style={{ ...pill(on), padding: "7px 8px", borderRadius: 7, fontSize: 10, fontWeight: 500, textAlign: "left" }}>
                      {m.label}
                      <span style={{ fontSize: 8, display: "block", marginTop: 1, color: on ? "var(--cth-command-ivory)" : "var(--cth-command-muted)", opacity: on ? 0.7 : 1 }}>{m.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Provider toggle — fal.ai (default), Higgsfield (if connected) */}
              <div style={{ display: "flex", gap: 5, marginTop: 8 }} data-testid="video-provider-toggle">
                {[{ key: "fal", label: "fal.ai" }, ...(higgsfieldConnected ? [{ key: "higgsfield", label: "Higgsfield" }] : [])].map((p) => {
                  const on = p.key === provider;
                  return (
                    <button key={p.key} onClick={() => setProvider(p.key)} data-testid={`video-provider-${p.key}`}
                      style={{ ...pill(on), flex: 1, padding: "6px 8px", borderRadius: 7, fontSize: 10, fontWeight: 500, textAlign: "center" }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {provider === "fal" && (
                <button
                  type="button"
                  onClick={openBrowse}
                  data-testid="video-browse-models"
                  style={{
                    marginTop: 6, padding: "5px 8px", borderRadius: 7, fontSize: 10, fontWeight: 500,
                    border: "0.5px solid var(--cth-command-border)", background: "var(--cth-command-blush)",
                    color: "var(--cth-command-ink)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%",
                  }}
                >
                  Browse all fal.ai models
                </button>
              )}
            </div>

            {browseOpen && (
              <FalModelBrowser
                title="fal.ai video models"
                loading={browseLoading}
                models={browseModels}
                search={browseSearch}
                setSearch={setBrowseSearch}
                cat={browseCat}
                setCat={setBrowseCat}
                categories={["all", "text-to-video", "image-to-video"]}
                onPick={(id) => { setFalVideoModels((cur) => (cur.some((m) => m.id === id) ? cur : [{ id, label: id, sub: "fal.ai" }, ...cur])); setModelId(id); setProvider("fal"); setBrowseOpen(false); }}
                onClose={() => setBrowseOpen(false)}
              />
            )}

            {/* Audio toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 9, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--cth-command-ink)" }}>Generate audio</div>
                <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 1 }}>AI-generated ambient sound or music</div>
              </div>
              <Toggle on={generateAudio} onClick={() => setGenerateAudio((v) => !v)} />
            </div>

            {/* Watermark */}
            <div style={{ background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 9, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: watermark ? 8 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--cth-command-ink)" }}>Brand watermark</div>
                  <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 1 }}>Add your logo to the generated video</div>
                </div>
                <Toggle on={watermark} onClick={() => setWatermark((v) => !v)} />
              </div>
              {watermark && (
                logoUrl ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 8 }}>
                      {WM_POSITIONS.map((p) => {
                        const on = p.key === wmPosition;
                        return (
                          <button key={p.key} onClick={() => setWmPosition(p.key)} data-testid={`video-wm-${p.key}`}
                            style={{ padding: "5px 8px", borderRadius: 6, fontSize: 10, textAlign: "center", border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`, background: on ? "var(--cth-command-crimson)" : "var(--cth-command-panel)", color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 6 }}>Pulls your logo from Identity Studio.</div>
                  </>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => navigate("/identity-studio")} style={{ fontSize: 11, color: "var(--cth-command-crimson)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
                      {identityLoaded ? "Add a logo in Identity Studio" : "Loading logo…"}
                    </button>
                  </div>
                )
              )}
            </div>

            <div style={DIVIDER} />

            {/* Zuri */}
            <div style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                  <img src="/zuri.png" alt="Zuri" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cth-command-purple-mid)" }}>Zuri · video direction</span>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: "var(--cth-command-ivory)", fontStyle: "italic", lineHeight: 1.5 }}>
                "The strongest branded videos are not productions — they are moments of clarity. One idea, one face, one message. Keep the script to a single point and let the visual do the rest."
              </div>
            </div>

            <button
              onClick={handleGenerate} disabled={generateDisabled} data-testid="video-generate-btn"
              style={{ width: "100%", padding: 11, background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: generateDisabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 6, opacity: generateDisabled ? 0.55 : 1 }}
            >
              {generating ? "Generating…" : atLimit ? "Monthly limit reached" : "Generate Video"}
            </button>
          </div>

          {/* ---- OUTPUT ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Generated video */}
            <div style={CARD} data-testid="video-output">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)" }}>Generated video</div>
                {videoUrl && job?.form === "short" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => downloadJob(job.job_id, job.name)} style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}>Download</button>
                    <button onClick={() => handleSave(job.job_id)} disabled={saving} style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-success)", color: "var(--cth-command-ivory)", border: "none", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save to library"}</button>
                  </div>
                )}
              </div>

              {/* In-page progress (short form) */}
              {generating && job?.form === "short" && (
                <div style={{ marginTop: 10 }} data-testid="video-progress">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--cth-command-muted)", marginBottom: 5 }}>
                    <span>Generating your video — estimated {Math.max(0, Math.round(estTotal * (1 - progress / 100)))} seconds remaining</span><span>{progress}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--cth-command-blush)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "var(--cth-command-crimson)", borderRadius: 999, transition: "width 1s linear" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 4 }}>
                    {(activeModels.find((m) => m.id === modelId) || {}).label} · {duration}s · {activeFormat.ratio}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={handleStopGeneration} data-testid="video-stop-btn"
                      style={{ fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "transparent", color: "var(--cth-command-muted)", border: "0.5px solid var(--cth-command-border)" }}
                    >
                      Stop generation
                    </button>
                    <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>Credits already used for this generation.</span>
                  </div>
                </div>
              )}

              {/* Medium-form background note */}
              {bgNote && job?.form === "medium" && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 10 }} data-testid="video-bg-note">
                  <div style={{ fontSize: 12, color: "var(--cth-command-ink)", lineHeight: 1.6 }}>
                    Your video is generating in the background. You will be notified when it is ready.
                  </div>
                  <button onClick={() => { const el = document.getElementById("video-queue"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} style={{ marginTop: 6, fontSize: 11, color: "var(--cth-command-crimson)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
                    View background queue →
                  </button>
                </div>
              )}

              {/* Completed in-page video */}
              {videoUrl && job?.form === "short" ? (
                <div style={{ borderRadius: 10, border: "0.5px solid var(--cth-command-border)", background: "var(--cth-command-blush)", aspectRatio: activeFormat.ratio.replace(":", " / "), maxWidth: activeFormat.ratio === "9:16" ? 240 : "100%", margin: "12px auto 0", overflow: "hidden" }}>
                  <video src={videoUrl} controls style={{ width: "100%", height: "100%", objectFit: "contain", background: "var(--cth-command-ink)" }} />
                </div>
              ) : (!generating && !bgNote && (
                <div style={{ borderRadius: 10, border: "0.5px solid var(--cth-command-border)", background: "var(--cth-command-blush)", aspectRatio: activeFormat.ratio === "9:16" ? "9 / 16" : "16 / 9", maxWidth: activeFormat.ratio === "9:16" ? 200 : "100%", margin: "12px auto 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", color: "var(--cth-command-muted)" }}>
                    <VideoIcon size={28} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 6px" }} />
                    <div style={{ fontSize: 11 }}>Video will appear here</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Background queue */}
            <div style={CARD} id="video-queue" data-testid="video-queue">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)", marginBottom: 10 }}>Background queue</div>
              {queue.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 11 }}>No background generations yet.</div>
              ) : queue.map((j) => {
                const ready = j.status === "completed" || j.content_url;
                const confirming = confirmQueueId === j.job_id;
                const showTrash = hoverQueueId === j.job_id || confirming;
                return (
                  <div
                    key={j.job_id}
                    onMouseEnter={() => setHoverQueueId(j.job_id)}
                    onMouseLeave={() => { setHoverQueueId(null); if (confirming) setConfirmQueueId(null); }}
                    data-testid={`video-queue-card-${j.job_id}`}
                    style={{ position: "relative", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 10, padding: "10px 12px", marginBottom: 7, display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: "var(--cth-command-night)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <VideoIcon size={13} style={{ color: "var(--cth-command-ivory)", opacity: 0.7 }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.name || "Untitled video"}</div>
                      <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 1 }}>{j.model_label || j.model_id} · {j.aspect_ratio} · {j.duration}s</div>
                    </div>
                    {ready ? (
                      <button onClick={() => downloadJob(j.job_id, j.name)} data-testid={`video-queue-download-${j.job_id}`} style={{ flexShrink: 0, fontSize: 10, fontWeight: 500, padding: "5px 10px", borderRadius: 7, background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Download</button>
                    ) : (
                      <span style={{ flexShrink: 0, color: "var(--cth-command-cinnabar)", fontSize: 10, fontWeight: 500 }}>Still processing...</span>
                    )}

                    {/* Trash icon — on hover */}
                    {showTrash && !confirming && (
                      <button
                        onClick={() => setConfirmQueueId(j.job_id)}
                        data-testid={`video-queue-delete-${j.job_id}`}
                        title="Remove from queue"
                        style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", cursor: "pointer", padding: 0 }}
                      >
                        <Trash2 size={12} style={{ color: "var(--cth-command-crimson)" }} />
                      </button>
                    )}

                    {/* Inline confirmation */}
                    {confirming && (
                      <div
                        data-testid={`video-queue-confirm-${j.job_id}`}
                        style={{ position: "absolute", inset: 0, background: "rgba(20,8,12,0.9)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 12px" }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-ivory)" }}>Remove from queue?</span>
                        <button onClick={() => handleDeleteQueue(j.job_id)} data-testid={`video-queue-confirm-yes-${j.job_id}`} style={{ fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none" }}>Remove</button>
                        <button onClick={() => setConfirmQueueId(null)} data-testid={`video-queue-confirm-no-${j.job_id}`} style={{ fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}>Cancel</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Saved videos */}
            <div style={CARD} data-testid="video-saved">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)", marginBottom: 10 }}>Saved videos</div>
              {savedVideos.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 11 }}>
                  <VideoIcon size={20} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 6px" }} />
                  Your saved videos will appear here.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {savedVideos.map((v) => {
                    const confirming = confirmDeleteId === v.id;
                    const showTrash = hoverVideoId === v.id || confirming;
                    return (
                      <div
                        key={v.id}
                        onMouseEnter={() => setHoverVideoId(v.id)}
                        onMouseLeave={() => { setHoverVideoId(null); if (confirming) setConfirmDeleteId(null); }}
                        onClick={() => { if (!confirming) downloadJob(v.job_id, v.name); }}
                        data-testid={`video-saved-card-${v.id}`}
                        style={{ borderRadius: 9, border: "0.5px solid var(--cth-command-border)", overflow: "hidden", cursor: "pointer", position: "relative" }}
                      >
                        <div style={{ aspectRatio: "16 / 9", background: "var(--cth-command-night)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={18} style={{ color: "var(--cth-command-ivory)", opacity: 0.4 }} />
                        </div>

                        {/* Trash icon — top right, on hover */}
                        {showTrash && !confirming && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(v.id); }}
                            data-testid={`video-saved-delete-${v.id}`}
                            title="Delete this video"
                            style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,8,12,0.72)", border: "0.5px solid var(--cth-command-border)", cursor: "pointer", padding: 0 }}
                          >
                            <Trash2 size={13} style={{ color: "var(--cth-command-ivory)" }} />
                          </button>
                        )}

                        {/* Inline delete confirmation */}
                        {confirming && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`video-saved-confirm-${v.id}`}
                            style={{ position: "absolute", inset: 0, background: "rgba(20,8,12,0.86)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 8, textAlign: "center" }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-ivory)" }}>Delete this video?</div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSaved(v.id); }}
                                data-testid={`video-saved-confirm-yes-${v.id}`}
                                style={{ fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none" }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                data-testid={`video-saved-confirm-no-${v.id}`}
                                style={{ fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{ padding: "7px 9px", background: "var(--cth-command-panel)" }}>
                          <div style={{ fontSize: 10, fontWeight: 500, color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</div>
                          <div style={{ fontSize: 9, color: "var(--cth-command-muted)", marginTop: 1 }}>{v.model} · {v.duration}s · {v.aspect_ratio}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
