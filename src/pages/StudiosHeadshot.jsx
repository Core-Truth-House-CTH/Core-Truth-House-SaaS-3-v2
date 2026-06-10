import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, Camera, Lock } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const absUrl = (u) => (!u ? u : /^https?:/.test(u) ? u : `${API_BASE}${u}`);

const PLAN_RANK = { free: 0, audit: 1, foundation: 2, structure: 3, house: 4, estate: 5, legacy: 6 };

const STYLE_OPTIONS = [
  "Professional editorial",
  "Cinematic authority",
  "Warm approachable",
  "Bold minimal",
];
const BACKGROUND_OPTIONS = [
  "Luxury office",
  "Clean studio",
  "Outdoor urban",
  "Abstract brand color",
];
const VARIATION_OPTIONS = [1, 2, 4];

// Higgsfield image models for the Headshot Generator, shown only when Higgsfield
// is connected and selected. Ids must match the backend HIGGSFIELD_IMAGE_MODEL_IDS.
const HIGGSFIELD_IMAGE_MODELS = [
  { id: "higgsfield-ai/soul/standard", label: "Soul Portrait" },
  { id: "higgsfield-ai/nano-banana/pro", label: "Nano Banana Pro" },
  { id: "higgsfield-ai/cinema-studio/2.5", label: "Cinema Studio" },
];

const FIELD_LABEL = {
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  fontWeight: 500,
};
const FIELD_INPUT = {
  padding: "8px 11px",
  background: "var(--cth-command-blush)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--cth-command-ink)",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  width: "100%",
};
const CARD = {
  background: "var(--cth-command-panel)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 12,
  padding: 18,
};
const CARD_LABEL = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  fontWeight: 500,
  marginBottom: 12,
};

function LockedView() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div style={{ ...CARD, padding: 32, textAlign: "center" }} data-testid="headshot-locked">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--cth-command-blush)",
              border: "0.5px solid var(--cth-command-border)",
            }}
          >
            <Lock size={26} style={{ color: "var(--cth-command-crimson)" }} />
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              margin: 0,
            }}
          >
            AI Headshot Generator
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--cth-command-muted)",
              lineHeight: 1.6,
              margin: "10px auto 22px",
              maxWidth: 360,
            }}
          >
            Generate professional brand portraits from a single photo. This studio unlocks on The
            Foundation plan and above.
          </p>
          <button
            onClick={() => navigate("/billing")}
            style={{
              padding: "10px 22px",
              background: "var(--cth-command-crimson)",
              color: "var(--cth-command-ivory)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            View plans
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function StudiosHeadshot() {
  const navigate = useNavigate();
  const { plan, isSuperAdmin } = usePlan();
  const normalizedPlan = String(plan || "free").toLowerCase();
  const pageLocked = (PLAN_RANK[normalizedPlan] ?? 0) < PLAN_RANK.foundation && !isSuperAdmin;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [useBrandIdentity, setUseBrandIdentity] = useState(true);
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [background, setBackground] = useState(BACKGROUND_OPTIONS[0]);
  const [variations, setVariations] = useState(4);
  const [customInstruction, setCustomInstruction] = useState("");

  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [usage, setUsage] = useState(null);
  const [hoveredImg, setHoveredImg] = useState(-1);
  const [higgsfieldConnected, setHiggsfieldConnected] = useState(false);
  const [provider, setProvider] = useState("openrouter");
  const [higgsfieldModel, setHiggsfieldModel] = useState(HIGGSFIELD_IMAGE_MODELS[0].id);

  const loadUsage = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/studios/headshots/usage");
      setUsage(res || null);
    } catch {
      setUsage(null);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/studios/headshots");
      setSaved(Array.isArray(res?.headshots) ? res.headshots : []);
    } catch {
      setSaved([]);
    }
  }, []);

  const loadHiggsfield = useCallback(async () => {
    try {
      const r = await apiClient.get("/api/integrations/higgsfield");
      setHiggsfieldConnected(!!r?.connected);
    } catch {
      setHiggsfieldConnected(false);
    }
  }, []);

  useEffect(() => {
    if (pageLocked) return;
    loadUsage();
    loadSaved();
    loadHiggsfield();
  }, [pageLocked, loadUsage, loadSaved, loadHiggsfield]);

  const acceptFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("That image is larger than 10MB.");
      return;
    }
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Upload a photo to generate from.");
      return;
    }
    setGenerating(true);
    try {
      let brandContext = "";
      if (useBrandIdentity) {
        try {
          const id = (await apiClient.get("/api/identity")) || {};
          const colors = (id.colors || [])
            .map((c) => [c.label || c.role, c.hex].filter(Boolean).join(" "))
            .filter(Boolean);
          const fonts = (id.fonts || []).map((f) => f.family).filter(Boolean);
          const bits = [];
          if (colors.length) bits.push(`Colors: ${colors.join(", ")}`);
          if (fonts.length) bits.push(`Fonts: ${fonts.join(", ")}`);
          if (id.tone_of_voice) bits.push(`Tone: ${id.tone_of_voice}`);
          if ((id.keywords || []).length) bits.push(`Keywords: ${id.keywords.join(", ")}`);
          brandContext = bits.join(". ");
        } catch {
          /* identity is optional context */
        }
      }

      const fd = new FormData();
      fd.append("photo", file);
      fd.append("style", style);
      fd.append("background", background);
      fd.append("variations", String(variations));
      fd.append("custom_instruction", customInstruction);
      fd.append("use_brand_identity", String(useBrandIdentity));
      fd.append("brand_context", brandContext);
      fd.append("provider", provider);
      if (provider === "higgsfield") fd.append("model_id", higgsfieldModel);

      const res = await apiClient.post("/api/studios/headshots/generate", fd);
      const urls = Array.isArray(res?.image_urls) ? res.image_urls : [];
      if (!urls.length) {
        toast.error("No portraits were returned. Please try again.");
      } else {
        setImages(urls);
        if (res?.usage) setUsage((prev) => ({ ...(prev || {}), ...res.usage }));
        else loadUsage();
        if (res?.partial_failures) {
          toast.message(`${urls.length} generated, ${res.partial_failures} failed.`);
        } else {
          toast.success(`Generated ${urls.length} portrait${urls.length > 1 ? "s" : ""}.`);
        }
      }
    } catch (err) {
      toast.error(err?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!images.length) return;
    setSaving(true);
    try {
      await apiClient.post("/api/studios/headshots/save", {
        image_urls: images,
        generation_params: {
          style,
          background,
          variations,
          custom_instruction: customInstruction,
          use_brand_identity: useBrandIdentity,
        },
      });
      toast.success("Saved to your library.");
      loadSaved();
    } catch (err) {
      toast.error(err?.message || "Could not save to library.");
    } finally {
      setSaving(false);
    }
  };

  const downloadImage = async (url, name) => {
    try {
      const res = await fetch(absUrl(url));
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name || "headshot.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(absUrl(url), "_blank", "noopener");
    }
  };

  const downloadAll = () => {
    images.forEach((url, i) => downloadImage(url, `headshot-${i + 1}.png`));
  };

  if (pageLocked) return <LockedView />;

  const limitLabel = usage ? (usage.limit === null ? "∞" : usage.limit) : "—";
  const atLimit = usage && usage.limit !== null && usage.used >= usage.limit;
  const generateDisabled = !file || generating || atLimit;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" data-testid="studios-headshot-page">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => navigate("/studios")}
            data-testid="headshot-back-btn"
            style={{
              fontSize: 11,
              color: "var(--cth-command-muted)",
              background: "var(--cth-command-panel)",
              border: "0.5px solid var(--cth-command-border)",
              borderRadius: 7,
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <ArrowLeft size={11} /> Studios
          </button>
          <div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 22,
                fontWeight: 500,
                color: "var(--cth-command-ink)",
              }}
            >
              AI Headshot Generator
            </div>
            <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
              Generate professional portraits using your brand identity style.
            </div>
          </div>
        </div>

        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)" }}
        >
          {/* ---- Form card ---- */}
          <div style={CARD}>
            <div style={CARD_LABEL}>Generation settings</div>

            <div
              data-testid="headshot-usage"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "var(--cth-command-blush)",
                border: "0.5px solid var(--cth-command-border)",
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>
                Generations this month
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-crimson)" }}>
                {usage ? `${usage.used} / ${limitLabel} used` : "Loading…"}
              </span>
            </div>

            {/* Upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>
                Upload a photo <span style={{ color: "var(--cth-command-crimson)" }}>*</span>
              </div>
              <div
                data-testid="headshot-upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                style={{
                  border: `1px dashed var(--cth-command-border)`,
                  borderRadius: 10,
                  padding: previewUrl ? 12 : 22,
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragOver ? "var(--cth-command-panel-soft)" : "var(--cth-command-blush)",
                }}
              >
                {previewUrl ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <img
                      src={previewUrl}
                      alt="Selected"
                      style={{
                        width: 96,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "0.5px solid var(--cth-command-border)",
                      }}
                    />
                    <div style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>
                      {file?.name} · click to replace
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 7 }}>
                      <Upload size={22} style={{ color: "var(--cth-command-muted)" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cth-command-muted)", lineHeight: 1.5 }}>
                      Drop a photo here or click to browse
                    </div>
                    <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 3 }}>
                      JPG, PNG, WEBP up to 10MB — clear face, good lighting works best
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
              </div>
            </div>

            {/* Brand identity toggle */}
            <div
              onClick={() => setUseBrandIdentity((v) => !v)}
              data-testid="headshot-brand-toggle"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 13px",
                background: "var(--cth-command-blush)",
                border: "0.5px solid var(--cth-command-border)",
                borderRadius: 9,
                marginBottom: 10,
                cursor: "pointer",
              }}
            >
              <div style={{ paddingRight: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--cth-command-ink)" }}>
                  Use my brand identity
                </div>
                <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 1 }}>
                  Applies your colors, style, and portrait preferences from Identity Studio
                </div>
              </div>
              <div
                style={{
                  width: 34,
                  height: 18,
                  background: useBrandIdentity ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
                  borderRadius: 20,
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    background: "var(--cth-command-ivory)",
                    borderRadius: "50%",
                    position: "absolute",
                    top: 2,
                    left: useBrandIdentity ? 18 : 2,
                    transition: "left 0.15s",
                  }}
                />
              </div>
            </div>

            <div style={{ height: "0.5px", background: "var(--cth-command-border)", margin: "12px 0" }} />

            {/* Style */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Portrait style</div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={FIELD_INPUT}
                data-testid="headshot-style"
              >
                {STYLE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Background */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Background</div>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                style={FIELD_INPUT}
                data-testid="headshot-background"
              >
                {BACKGROUND_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Variations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Number of variations</div>
              <select
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                style={FIELD_INPUT}
                data-testid="headshot-variations"
              >
                {VARIATION_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom instruction */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Custom instruction</div>
              <input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Optional — any specific direction..."
                style={FIELD_INPUT}
              />
              <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>Optional</div>
            </div>

            <div style={{ height: "0.5px", background: "var(--cth-command-border)", margin: "12px 0" }} />

            {/* Zuri card — #1a0828 permitted literal */}
            <div style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
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
                    color: "var(--cth-command-purple-mid)",
                  }}
                >
                  Zuri · portrait direction
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 13,
                  color: "var(--cth-command-ivory)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                }}
              >
                "Your headshot is the first thing a potential client sees before they read a word. It
                should communicate your authority before you explain it."
              </div>
            </div>

            {/* Provider toggle — only when Higgsfield is connected */}
            {higgsfieldConnected && (
              <div style={{ marginTop: 12 }} data-testid="headshot-provider">
                <div style={FIELD_LABEL}>Generation provider</div>
                <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                  {[{ key: "openrouter", label: "OpenRouter" }, { key: "higgsfield", label: "Higgsfield" }].map((p) => {
                    const on = p.key === provider;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setProvider(p.key)}
                        data-testid={`headshot-provider-${p.key}`}
                        style={{
                          flex: 1, padding: "6px 8px", borderRadius: 7, fontSize: 10, fontWeight: 500, textAlign: "center",
                          border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
                          background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)",
                          color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                {provider === "higgsfield" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                    <div style={FIELD_LABEL}>Higgsfield model</div>
                    <select
                      value={higgsfieldModel}
                      onChange={(e) => setHiggsfieldModel(e.target.value)}
                      style={FIELD_INPUT}
                      data-testid="headshot-higgsfield-model"
                    >
                      {HIGGSFIELD_IMAGE_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generateDisabled}
              data-testid="headshot-generate-btn"
              aria-label="Generate headshots"
              style={{
                width: "100%",
                padding: 11,
                background: "var(--cth-command-crimson)",
                color: "var(--cth-command-ivory)",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: generateDisabled ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                marginTop: 6,
                opacity: generateDisabled ? 0.55 : 1,
              }}
            >
              {generating ? "Generating…" : atLimit ? "Monthly limit reached" : "Generate Headshots"}
            </button>
          </div>

          {/* ---- Output column ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={CARD} data-testid="headshot-output">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--cth-command-ink)",
                  }}
                >
                  Generated portraits
                </div>
                {images.length > 0 && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={downloadAll}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderRadius: 7,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        background: "var(--cth-command-blush)",
                        color: "var(--cth-command-ink)",
                        border: "0.5px solid var(--cth-command-border)",
                      }}
                    >
                      Download all
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      data-testid="headshot-save-btn"
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "6px 12px",
                        borderRadius: 7,
                        cursor: saving ? "not-allowed" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        background: "var(--cth-command-success)",
                        color: "var(--cth-command-ivory)",
                        border: "none",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? "Saving…" : "Save to library"}
                    </button>
                  </div>
                )}
              </div>

              {images.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {images.map((url, i) => (
                    <div
                      key={url}
                      onClick={() => downloadImage(url, `headshot-${i + 1}.png`)}
                      onMouseEnter={() => setHoveredImg(i)}
                      onMouseLeave={() => setHoveredImg(-1)}
                      style={{
                        borderRadius: 10,
                        border: "0.5px solid var(--cth-command-border)",
                        aspectRatio: "4 / 5",
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: "var(--cth-command-blush)",
                      }}
                    >
                      <img
                        src={absUrl(url)}
                        alt={`Portrait ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(26, 8, 40, 0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: hoveredImg === i ? 1 : 0,
                          transition: "opacity 0.15s",
                        }}
                      >
                        <Download size={20} style={{ color: "var(--cth-command-ivory)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: 36,
                    textAlign: "center",
                    color: "var(--cth-command-muted)",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  <Camera
                    size={22}
                    style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 8px" }}
                  />
                  {generating
                    ? "Generating your portraits…"
                    : "Your generated portraits will appear here."}
                </div>
              )}
            </div>

            <div style={CARD} data-testid="headshot-saved">
              <div style={CARD_LABEL}>Saved headshots</div>
              {saved.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                    gap: 8,
                  }}
                >
                  {saved.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => downloadImage(h.image_url, "headshot.png")}
                      style={{
                        borderRadius: 8,
                        border: "0.5px solid var(--cth-command-border)",
                        aspectRatio: "4 / 5",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: "var(--cth-command-blush)",
                      }}
                    >
                      <img
                        src={absUrl(h.image_url)}
                        alt="Saved headshot"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "var(--cth-command-muted)",
                    fontSize: 11,
                  }}
                >
                  <Camera
                    size={20}
                    style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 6px" }}
                  />
                  Your saved headshots will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
