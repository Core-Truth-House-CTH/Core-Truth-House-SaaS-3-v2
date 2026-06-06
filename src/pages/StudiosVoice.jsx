import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Lock, Mic, Play, Pause, Download, Trash2, Loader2, ChevronDown, ChevronUp, Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const absUrl = (u) => (!u ? u : /^(https?:|data:|blob:)/.test(u) ? u : `${API_BASE}${u}`);

const PLAN_RANK = { free: 0, audit: 1, foundation: 2, structure: 3, house: 4, estate: 5, legacy: 6 };

const WARN_CHARS = 2500;
const MAX_CHARS = 5000;
const OUTPUT_FORMAT = "mp3_44100_128";

const MODELS = [
  { id: "eleven_multilingual_v2", label: "Multilingual v2", sub: "Best quality · recommended" },
  { id: "eleven_turbo_v2_5", label: "Turbo v2.5", sub: "Fast · low latency" },
  { id: "eleven_monolingual_v1", label: "Monolingual v1", sub: "English only" },
];

// ElevenLabs categories are bucketed into three display groups. Anything that
// isn't "professional" or "premade" (cloned, generated, …) shows under Custom.
const VOICE_GROUPS = [
  { key: "professional", label: "Professional", match: (c) => c === "professional" },
  { key: "premade", label: "Premade", match: (c) => c === "premade" },
  { key: "custom", label: "Custom", match: (c) => c !== "professional" && c !== "premade" },
];

const CARD = { background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 12, padding: 18 };
const CARD_LABEL = { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500, marginBottom: 12 };
const FIELD_LABEL = { fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500 };
const FIELD_INPUT = { padding: "8px 11px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, fontSize: 12, color: "var(--cth-command-ink)", fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };
const DIVIDER = { height: "0.5px", background: "var(--cth-command-border)", margin: "12px 0" };

function estimateDuration(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.max(1, Math.round((words / 150) * 60));
}

function catLabel(category) {
  const c = String(category || "").toLowerCase();
  if (c === "professional") return "Professional";
  if (c === "premade") return "Premade";
  if (c === "cloned") return "Cloned";
  if (c === "generated") return "Generated";
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : "Custom";
}

// Auto-growing textarea — height snaps to content on every value change so the
// founder never scrolls inside a small box while writing a long script.
function AutoTextarea({ value, onChange, minHeight = 120, style, ...rest }) {
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
        <div style={{ ...CARD, padding: 32, textAlign: "center" }} data-testid="voice-locked">
          <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)" }}>
            <Lock size={26} style={{ color: "var(--cth-command-crimson)" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>Voice Studio</h1>
          <p style={{ fontSize: 13, color: "var(--cth-command-muted)", lineHeight: 1.6, margin: "10px auto 22px", maxWidth: 360 }}>
            Generate professional voiceovers from your scripts using AI voices. This studio unlocks on The Foundation plan and above.
          </p>
          <button onClick={() => navigate("/billing")} style={{ padding: "10px 22px", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            View plans
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function StudiosVoice() {
  const navigate = useNavigate();
  const { plan, isSuperAdmin } = usePlan();
  const normalizedPlan = String(plan || "free").toLowerCase();
  const pageLocked = (PLAN_RANK[normalizedPlan] ?? 0) < PLAN_RANK.foundation && !isSuperAdmin;

  const blobUrlRef = useRef(null);       // current generated object URL
  const lastBlobRef = useRef(null);      // current generated Blob (re-uploaded on save)
  const createdUrlsRef = useRef([]);     // every object URL created this session (revoked on unmount)
  const previewAudioRef = useRef(null);  // voice-preview <audio>
  const savedAudioRef = useRef(null);    // saved-row playback <audio>
  const playerRef = useRef(null);        // main output <audio>

  const [usage, setUsage] = useState(null);
  const [script, setScript] = useState("");

  const [voices, setVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const [modelId, setModelId] = useState(MODELS[0].id);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [style, setStyle] = useState(0.0);

  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [generatedMeta, setGeneratedMeta] = useState(null); // { voiceName, modelLabel, script }

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [savedBlobs, setSavedBlobs] = useState({}); // save_id -> object URL (this session)
  const [savedBusyId, setSavedBusyId] = useState(null);
  const [playingSavedId, setPlayingSavedId] = useState(null);
  const [hoverSavedId, setHoverSavedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadUsage = useCallback(async () => {
    try { setUsage((await apiClient.get("/api/studios/usage", { params: { type: "voice" } })) || null); }
    catch { setUsage(null); }
  }, []);

  const loadVoices = useCallback(async () => {
    setVoicesLoading(true);
    setVoicesError("");
    try {
      const r = await apiClient.get("/api/studios/voices");
      const list = Array.isArray(r?.voices) ? r.voices : [];
      setVoices(list);
      setSelectedVoiceId((prev) => {
        if (prev && list.some((v) => v.voice_id === prev)) return prev;
        const firstPro = list.find((v) => String(v.category || "").toLowerCase() === "professional");
        return (firstPro || list[0])?.voice_id || null;
      });
    } catch (err) {
      setVoices([]);
      setVoicesError(err?.message || "Could not load the voice library.");
    } finally {
      setVoicesLoading(false);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    try { const r = await apiClient.get("/api/studios/voice/saved"); setSaved(Array.isArray(r?.voiceovers) ? r.voiceovers : []); }
    catch { setSaved([]); }
  }, []);

  useEffect(() => {
    if (pageLocked) return;
    loadUsage(); loadVoices(); loadSaved();
  }, [pageLocked, loadUsage, loadVoices, loadSaved]);

  // Revoke every object URL and stop any audio on unmount.
  useEffect(() => () => {
    createdUrlsRef.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* noop */ } });
    previewAudioRef.current?.pause();
    savedAudioRef.current?.pause();
  }, []);

  // Build an authed POST that returns the raw MP3 blob (apiClient.request parses
  // JSON, so we hit fetch directly for the binary audio response).
  const generateBlob = async (payload) => {
    const url = apiClient.buildApiUrl("/api/studios/voice/generate");
    const headers = await apiClient.getAuthHeaders({ body: payload });
    const res = await fetch(url, { method: "POST", headers, credentials: "include", body: JSON.stringify(payload) });
    if (!res.ok) {
      let msg = "Voice generation failed.";
      try { const j = await res.json(); msg = j?.detail || msg; } catch { /* non-JSON */ }
      const e = new Error(msg); e.status = res.status; throw e;
    }
    return res.blob();
  };

  const trackUrl = (u) => { createdUrlsRef.current.push(u); return u; };

  const previewVoice = (voice, e) => {
    e.stopPropagation();
    if (!voice.preview_url) { toast.message("No preview available for this voice."); return; }
    if (previewId === voice.voice_id) {
      previewAudioRef.current?.pause();
      setPreviewId(null);
      return;
    }
    previewAudioRef.current?.pause();
    const audio = new Audio(voice.preview_url);
    previewAudioRef.current = audio;
    audio.onended = () => setPreviewId(null);
    audio.play().catch(() => { toast.error("Could not play this preview."); setPreviewId(null); });
    setPreviewId(voice.voice_id);
  };

  const handleGenerate = async () => {
    if (!script.trim()) { toast.error("Add a script to generate from."); return; }
    if (!selectedVoiceId) { toast.error("Select a voice first."); return; }
    if (script.length > MAX_CHARS) { toast.error(`Script exceeds the ${MAX_CHARS.toLocaleString()} character limit.`); return; }
    setGenerating(true);
    try {
      const blob = await generateBlob({
        script,
        voice_id: selectedVoiceId,
        model_id: modelId,
        stability,
        similarity_boost: similarity,
        style,
        output_format: OUTPUT_FORMAT,
      });
      const objectUrl = trackUrl(URL.createObjectURL(blob));
      blobUrlRef.current = objectUrl;
      lastBlobRef.current = blob;
      setAudioUrl(objectUrl);
      const v = voices.find((x) => x.voice_id === selectedVoiceId);
      const m = MODELS.find((x) => x.id === modelId);
      setGeneratedMeta({ voiceName: v?.name || "Voice", modelLabel: m?.label || modelId, script });
      setUsage((prev) => (prev ? { ...prev, voice_count: (prev.voice_count || 0) + 1 } : prev));
      toast.success("Your voiceover is ready.");
    } catch (err) {
      toast.error(err?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const triggerDownload = (url, name) => {
    const a = document.createElement("a");
    a.href = url; a.download = name || "voiceover.mp3";
    document.body.appendChild(a); a.click(); a.remove();
  };

  const handleSave = async () => {
    if (!audioUrl || !generatedMeta) return;
    setSaving(true);
    try {
      // Re-upload the generated MP3 so it's persisted server-side and replay is
      // free (no re-synthesis). Multipart form: metadata + the audio blob.
      const fd = new FormData();
      fd.append("script", generatedMeta.script);
      fd.append("voice_id", selectedVoiceId);
      fd.append("voice_name", generatedMeta.voiceName);
      fd.append("model_id", modelId);
      fd.append("duration_estimate", String(estimateDuration(generatedMeta.script)));
      if (lastBlobRef.current) fd.append("audio", lastBlobRef.current, "voiceover.mp3");

      const res = await apiClient.post("/api/studios/voice/save", fd);
      const savedRec = res?.voiceover;
      // Keep the in-session blob mapped for instant local replay (avoids an
      // immediate round-trip to fetch the file we already have in memory).
      if (savedRec?.id && blobUrlRef.current) {
        const url = blobUrlRef.current;
        setSavedBlobs((prev) => ({ ...prev, [savedRec.id]: url }));
      }
      toast.success("Saved to your library.");
      loadSaved();
    } catch (err) {
      toast.error(err?.message || "Could not save to library.");
    } finally {
      setSaving(false);
    }
  };

  // Resolve a playable URL for a saved row, cheapest source first:
  //   1. in-session blob (just generated) — instant, no network
  //   2. persisted file URL (audio_url) — free, fetched from disk
  //   3. fallback: re-synthesize from the stored full script (legacy saves
  //      with no persisted audio) — this DOES count a generation
  const ensureSavedUrl = async (item) => {
    if (savedBlobs[item.id]) return savedBlobs[item.id];
    if (item.audio_url) return absUrl(item.audio_url);
    setSavedBusyId(item.id);
    try {
      const blob = await generateBlob({
        script: item.script || item.script_preview || "",
        voice_id: item.voice_id,
        model_id: item.model_id || MODELS[0].id,
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        output_format: OUTPUT_FORMAT,
      });
      const url = trackUrl(URL.createObjectURL(blob));
      setSavedBlobs((prev) => ({ ...prev, [item.id]: url }));
      loadUsage();
      return url;
    } finally {
      setSavedBusyId(null);
    }
  };

  const playSaved = async (item) => {
    try {
      if (playingSavedId === item.id) {
        savedAudioRef.current?.pause();
        setPlayingSavedId(null);
        return;
      }
      const url = await ensureSavedUrl(item);
      savedAudioRef.current?.pause();
      const audio = new Audio(url);
      savedAudioRef.current = audio;
      audio.onended = () => setPlayingSavedId(null);
      await audio.play();
      setPlayingSavedId(item.id);
    } catch (err) {
      toast.error(err?.message || "Could not play this voiceover.");
      setPlayingSavedId(null);
    }
  };

  const downloadSaved = async (item) => {
    const name = `${(item.name || "voiceover").replace(/[^\w-]+/g, "_")}.mp3`;
    try {
      const url = await ensureSavedUrl(item);
      if (url.startsWith("blob:")) {
        triggerDownload(url, name);
        return;
      }
      // Persisted file URL: fetch to a blob so the download attribute is honored
      // cross-origin (mirrors the Visual Studio download pattern).
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl, name);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      toast.error(err?.message || "Could not download this voiceover.");
    }
  };

  const handleDeleteSaved = async (saveId) => {
    const prev = saved;
    setSaved((list) => list.filter((x) => x.id !== saveId));
    setConfirmDeleteId(null);
    setHoverSavedId(null);
    try {
      await apiClient.delete(`/api/studios/voice/saved/${saveId}`);
      toast.success("Voiceover deleted.");
    } catch (err) {
      setSaved(prev);
      toast.error(err?.message || "Could not delete the voiceover.");
    }
  };

  if (pageLocked) return <LockedView />;

  const voiceLimit = usage ? usage.voice_limit : undefined;
  const limitLabel = usage ? (voiceLimit === null ? "∞" : voiceLimit) : "—";
  const voiceCount = usage?.voice_count ?? 0;
  const atLimit = usage && voiceLimit !== null && voiceLimit !== undefined && voiceCount >= voiceLimit;

  const charCount = script.length;
  const overMax = charCount > MAX_CHARS;
  const charColor = overMax ? "var(--cth-command-error)" : charCount > WARN_CHARS ? "var(--cth-command-warning)" : "var(--cth-command-muted)";
  const generateDisabled = generating || atLimit || !script.trim() || !selectedVoiceId || overMax;

  const groupedVoices = VOICE_GROUPS
    .map((g) => ({ ...g, items: voices.filter((v) => g.match(String(v.category || "").toLowerCase())) }))
    .filter((g) => g.items.length);

  const sliders = [
    { key: "stability", label: "Stability — higher = more consistent", value: stability, set: setStability },
    { key: "similarity", label: "Similarity — higher = closer to original voice", value: similarity, set: setSimilarity },
    { key: "style", label: "Style — adds expressiveness", value: style, set: setStyle },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" data-testid="studios-voice-page">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button
            onClick={() => navigate("/studios")} data-testid="voice-back-btn"
            style={{ fontSize: 11, color: "var(--cth-command-muted)", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}
          >
            <ArrowLeft size={11} /> Studios
          </button>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--cth-command-ink)" }}>Voice Studio</div>
            <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
              Generate professional voiceovers from your scripts using AI voices.
            </div>
          </div>
        </div>

        <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)" }}>
          {/* ---- FORM ---- */}
          <div style={CARD}>
            <div style={CARD_LABEL}>Generation settings</div>

            {/* Usage */}
            <div data-testid="voice-usage" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>Voiceovers this month</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-crimson)" }}>
                {usage ? `${voiceCount} / ${limitLabel} used` : "Loading…"}
              </span>
            </div>

            {/* Script */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Script <span style={{ color: "var(--cth-command-crimson)" }}>*</span></div>
              <AutoTextarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                minHeight={120}
                placeholder="Paste your script from Content Studio or write one here."
                style={{ ...FIELD_INPUT, resize: "none", lineHeight: 1.6 }}
                data-testid="voice-script"
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>From Content Studio:</span>
                <button onClick={() => navigate("/content-studio")} data-testid="voice-content-studio-link" style={{ fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Video Scripts</button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                <span style={{ fontSize: 10, color: charColor }}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                </span>
                {charCount > WARN_CHARS && !overMax && (
                  <span style={{ fontSize: 10, color: "var(--cth-command-warning)" }}>Long scripts cost more characters</span>
                )}
                {overMax && (
                  <span style={{ fontSize: 10, color: "var(--cth-command-error)" }}>Over the {MAX_CHARS.toLocaleString()} limit</span>
                )}
              </div>
            </div>

            <div style={DIVIDER} />

            {/* Voice selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Voice <span style={{ color: "var(--cth-command-crimson)" }}>*</span></div>

              {voicesLoading ? (
                <div data-testid="voice-loading" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ height: 46, borderRadius: 8, background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", opacity: 0.6 }} />
                  ))}
                </div>
              ) : voicesError ? (
                <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: "var(--cth-command-muted)", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8 }}>
                  {voicesError}
                  <button onClick={loadVoices} style={{ display: "block", margin: "6px auto 0", fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Try again</button>
                </div>
              ) : voices.length === 0 ? (
                <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: "var(--cth-command-muted)" }}>No voices available.</div>
              ) : (
                <div data-testid="voice-list" style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto", paddingRight: 2 }}>
                  {groupedVoices.map((g) => (
                    <div key={g.key}>
                      <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500, marginBottom: 5 }}>{g.label}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {g.items.map((v) => {
                          const on = v.voice_id === selectedVoiceId;
                          const isPreviewing = previewId === v.voice_id;
                          return (
                            <div
                              key={v.voice_id}
                              onClick={() => setSelectedVoiceId(v.voice_id)}
                              data-testid={`voice-card-${v.voice_id}`}
                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: "var(--cth-command-blush)", border: `${on ? "1.5px" : "0.5px"} solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}` }}
                            >
                              <button
                                onClick={(e) => previewVoice(v, e)}
                                data-testid={`voice-preview-${v.voice_id}`}
                                title={v.preview_url ? "Preview voice" : "No preview available"}
                                style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: on ? "var(--cth-command-crimson)" : "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", cursor: "pointer", padding: 0 }}
                              >
                                {isPreviewing
                                  ? <Pause size={12} style={{ color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)" }} />
                                  : <Play size={12} style={{ color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)" }} />}
                              </button>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</div>
                                {v.description && (
                                  <div style={{ fontSize: 10, color: "var(--cth-command-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.description}</div>
                                )}
                              </div>
                              <span style={{ flexShrink: 0, fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: "var(--cth-command-panel)", color: "var(--cth-command-muted)", border: "0.5px solid var(--cth-command-border)" }}>
                                {catLabel(v.category)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Model selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Model</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                {MODELS.map((m) => {
                  const on = m.id === modelId;
                  return (
                    <button
                      key={m.id} onClick={() => setModelId(m.id)} data-testid={`voice-model-${m.id}`}
                      style={{ padding: "7px 6px", borderRadius: 7, fontSize: 10, fontWeight: 500, textAlign: "center", lineHeight: 1.3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`, background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)", color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)" }}
                    >
                      {m.label}
                      <span style={{ fontSize: 8, display: "block", marginTop: 2, color: on ? "var(--cth-command-ivory)" : "var(--cth-command-muted)", opacity: on ? 0.75 : 1 }}>{m.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice settings — collapsible */}
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => setSettingsOpen((v) => !v)} data-testid="voice-settings-toggle"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, padding: "8px 11px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >
                <span style={{ ...FIELD_LABEL, marginBottom: 0 }}>Voice settings</span>
                {settingsOpen ? <ChevronUp size={14} style={{ color: "var(--cth-command-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--cth-command-muted)" }} />}
              </button>
              {settingsOpen && (
                <div data-testid="voice-settings" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10, padding: "4px 2px" }}>
                  {sliders.map((s) => (
                    <div key={s.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>{s.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--cth-command-ink)" }}>{s.value.toFixed(2)}</span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.01} value={s.value}
                        onChange={(e) => s.set(Number(e.target.value))}
                        data-testid={`voice-slider-${s.key}`}
                        style={{ width: "100%", accentColor: "var(--cth-command-crimson)", cursor: "pointer" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={DIVIDER} />

            {/* Zuri */}
            <div style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--cth-command-cinnabar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 500, color: "var(--cth-command-ivory)" }}>Z</span>
                </div>
                <span style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cth-command-purple-mid)" }}>Zuri · voice direction</span>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: "var(--cth-command-ivory)", fontStyle: "italic", lineHeight: 1.5 }}>
                "A voiceover that converts does not sound like a radio ad. It sounds like a founder who knows exactly what they are saying and why. Write the script first. Then let the voice deliver it."
              </div>
            </div>

            <button
              onClick={handleGenerate} disabled={generateDisabled} data-testid="voice-generate-btn"
              style={{ width: "100%", padding: 11, background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: generateDisabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 6, opacity: generateDisabled ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              {generating && <Loader2 size={14} className="animate-spin" />}
              {generating ? "Generating your voiceover…" : atLimit ? "Monthly limit reached" : "Generate Voiceover"}
            </button>
          </div>

          {/* ---- OUTPUT ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Generated voiceover */}
            <div style={CARD} data-testid="voice-output">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)" }}>Generated voiceover</div>
                {audioUrl && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => playerRef.current?.play()} data-testid="voice-play-btn" style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)", display: "flex", alignItems: "center", gap: 5 }}><Play size={11} /> Play</button>
                    <button onClick={() => triggerDownload(audioUrl, "voiceover.mp3")} style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)", display: "flex", alignItems: "center", gap: 5 }}><Download size={11} /> Download</button>
                    <button onClick={handleSave} disabled={saving} data-testid="voice-save-btn" style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-success)", color: "var(--cth-command-ivory)", border: "none", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save to library"}</button>
                  </div>
                )}
              </div>

              {audioUrl ? (
                <div style={{ marginTop: 12 }}>
                  <audio ref={playerRef} src={audioUrl} controls style={{ width: "100%" }} data-testid="voice-player" />
                  {generatedMeta && (
                    <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 8 }}>
                      {generatedMeta.voiceName} · {generatedMeta.modelLabel}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: 36, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 12, marginTop: 8 }}>
                  <Volume2 size={24} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 8px" }} />
                  {generating ? "Generating your voiceover…" : "Your generated voiceover will appear here."}
                </div>
              )}
            </div>

            {/* Saved voiceovers */}
            <div style={CARD} data-testid="voice-saved">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)", marginBottom: 10 }}>Saved voiceovers</div>
              {saved.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 11 }}>
                  <Mic size={20} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 6px" }} />
                  Your saved voiceovers will appear here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {saved.map((item) => {
                    const confirming = confirmDeleteId === item.id;
                    const busy = savedBusyId === item.id;
                    const playing = playingSavedId === item.id;
                    const modelLabel = (MODELS.find((m) => m.id === item.model_id) || {}).label || item.model_id;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoverSavedId(item.id)}
                        onMouseLeave={() => { setHoverSavedId(null); if (confirming) setConfirmDeleteId(null); }}
                        data-testid={`voice-saved-row-${item.id}`}
                        style={{ position: "relative", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <button
                          onClick={() => playSaved(item)} disabled={busy}
                          data-testid={`voice-saved-play-${item.id}`}
                          style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", cursor: busy ? "default" : "pointer", padding: 0 }}
                        >
                          {busy ? <Loader2 size={13} className="animate-spin" style={{ color: "var(--cth-command-muted)" }} /> : playing ? <Pause size={13} style={{ color: "var(--cth-command-ink)" }} /> : <Play size={13} style={{ color: "var(--cth-command-ink)" }} />}
                        </button>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, padding: "2px 6px", borderRadius: 4, background: "var(--cth-command-panel)", color: "var(--cth-command-muted)", border: "0.5px solid var(--cth-command-border)", flexShrink: 0 }}>
                              {item.voice_name || "Voice"}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {(item.script_preview || item.name || "Untitled voiceover").slice(0, 60)}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>{modelLabel}</div>
                        </div>

                        <button
                          onClick={() => downloadSaved(item)}
                          data-testid={`voice-saved-download-${item.id}`}
                          title="Download"
                          style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", cursor: "pointer", padding: 0 }}
                        >
                          <Download size={12} style={{ color: "var(--cth-command-ink)" }} />
                        </button>

                        {/* Delete — trash on hover, inline confirm */}
                        {!confirming && hoverSavedId === item.id && (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            data-testid={`voice-saved-delete-${item.id}`}
                            title="Delete this voiceover"
                            style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", cursor: "pointer", padding: 0 }}
                          >
                            <Trash2 size={12} style={{ color: "var(--cth-command-crimson)" }} />
                          </button>
                        )}

                        {confirming && (
                          <div
                            data-testid={`voice-saved-confirm-${item.id}`}
                            style={{ position: "absolute", inset: 0, background: "rgba(20,8,12,0.9)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 12px" }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-ivory)" }}>Delete this voiceover?</span>
                            <button onClick={() => handleDeleteSaved(item.id)} data-testid={`voice-saved-confirm-yes-${item.id}`} style={{ fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none" }}>Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} data-testid={`voice-saved-confirm-no-${item.id}`} style={{ fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}>Cancel</button>
                          </div>
                        )}
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
