import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Image as ImageIcon, LayoutGrid, Lock, Check, Pencil } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const absUrl = (u) => (!u ? u : /^https?:/.test(u) ? u : `${API_BASE}${u}`);

const PLAN_RANK = { free: 0, audit: 1, foundation: 2, structure: 3, house: 4, estate: 5, legacy: 6 };

// key must match the backend VISUAL_FORMATS keys exactly.
const FORMATS = [
  { key: "Instagram Post", label: "Instagram Post", dims: "1080 × 1080", css: "1 / 1" },
  { key: "Story", label: "Story", dims: "1080 × 1920", css: "9 / 16" },
  { key: "LinkedIn Banner", label: "LinkedIn", dims: "1200 × 628", css: "16 / 9" },
  { key: "Facebook Cover", label: "Facebook Cover", dims: "820 × 312", css: "16 / 9" },
  { key: "YouTube Thumbnail", label: "YouTube", dims: "1280 × 720", css: "16 / 9" },
  { key: "Twitter/X Header", label: "Twitter/X", dims: "1500 × 500", css: "16 / 9" },
];

const VISUAL_STYLES = ["Luxury editorial", "Minimal clean", "Bold typographic", "Cinematic dark"];
const BG_MODES = ["AI scene", "Brand color", "Gradient", "Upload image", "Texture"];
const SCENE_OPTIONS = ["Luxury marble office", "Abstract brand colors", "Cinematic skyline", "Soft editorial studio"];
const TEXTURE_OPTIONS = ["Linen", "Marble", "Matte paper", "Brushed metal", "Soft noise"];

const CARD = {
  background: "var(--cth-command-panel)",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 12,
  padding: 18,
};
const CARD_LABEL = {
  fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
  color: "var(--cth-command-muted)", fontWeight: 500, marginBottom: 12,
};
const FIELD_LABEL = {
  fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "var(--cth-command-muted)", fontWeight: 500,
};
const FIELD_INPUT = {
  padding: "8px 11px", background: "var(--cth-command-blush)",
  border: "0.5px solid var(--cth-command-border)", borderRadius: 8,
  fontSize: 12, color: "var(--cth-command-ink)", fontFamily: "'DM Sans', sans-serif",
  outline: "none", width: "100%",
};
const DIVIDER = { height: "0.5px", background: "var(--cth-command-border)", margin: "12px 0" };

function LockedView() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div style={{ ...CARD, padding: 32, textAlign: "center" }} data-testid="visual-locked">
          <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)" }}>
            <Lock size={26} style={{ color: "var(--cth-command-crimson)" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
            Visual Studio
          </h1>
          <p style={{ fontSize: 13, color: "var(--cth-command-muted)", lineHeight: 1.6, margin: "10px auto 22px", maxWidth: 360 }}>
            Generate on-brand social graphics and brand visuals. This studio unlocks on The Foundation
            plan and above.
          </p>
          <button onClick={() => navigate("/billing")} style={{ padding: "10px 22px", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            View plans
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function StudiosVisual() {
  const navigate = useNavigate();
  const { plan, isSuperAdmin } = usePlan();
  const normalizedPlan = String(plan || "free").toLowerCase();
  const pageLocked = (PLAN_RANK[normalizedPlan] ?? 0) < PLAN_RANK.foundation && !isSuperAdmin;

  const refInputRef = useRef(null);
  const bgInputRef = useRef(null);

  const [format, setFormat] = useState(FORMATS[0].key);
  const [refFile, setRefFile] = useState(null);
  const [refPreview, setRefPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [headline, setHeadline] = useState("");
  const [subheading, setSubheading] = useState("");
  const [cta, setCta] = useState("");
  const [prompt, setPrompt] = useState("");
  const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0]);

  const [bgMode, setBgMode] = useState("AI scene");
  const [bgScene, setBgScene] = useState(SCENE_OPTIONS[0]);
  const [bgTexture, setBgTexture] = useState(TEXTURE_OPTIONS[0]);
  const [bgUploadPreview, setBgUploadPreview] = useState("");

  const [variations, setVariations] = useState(4);

  const [identity, setIdentity] = useState(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  // Per-generation color overrides, keyed by brand-color index. Session-only:
  // never persisted, never sent to the identity API.
  const [colorOverrides, setColorOverrides] = useState({});

  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [usage, setUsage] = useState(null);
  const [hoveredImg, setHoveredImg] = useState(-1);

  const activeFormat = FORMATS.find((f) => f.key === format) || FORMATS[0];

  const brandColors = (identity?.colors || []).map((c) => c.hex).filter(Boolean);
  const brandFonts = (identity?.fonts || []).map((f) => f.family).filter(Boolean);
  const hasIdentity = brandColors.length > 0 || brandFonts.length > 0;

  // Colors actually used this session: original brand colors with any override applied.
  const sessionColors = brandColors.map((hex, i) => colorOverrides[i] ?? hex);
  const hasColorOverrides = Object.keys(colorOverrides).length > 0;
  const toPickerHex = (h) => (/^#[0-9a-f]{6}$/i.test(h || "") ? h : "#000000");

  const loadUsage = useCallback(async () => {
    try {
      setUsage((await apiClient.get("/api/studios/visuals/usage")) || null);
    } catch {
      setUsage(null);
    }
  }, []);
  const loadSaved = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/studios/visuals");
      setSaved(Array.isArray(res?.visuals) ? res.visuals : []);
    } catch {
      setSaved([]);
    }
  }, []);
  const loadIdentity = useCallback(async () => {
    try {
      setIdentity((await apiClient.get("/api/identity")) || null);
    } catch {
      setIdentity(null);
    } finally {
      setIdentityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (pageLocked) return;
    loadUsage();
    loadSaved();
    loadIdentity();
  }, [pageLocked, loadUsage, loadSaved, loadIdentity]);

  const acceptRef = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (f.size > 10 * 1024 * 1024) return toast.error("That image is larger than 10MB.");
    setRefFile(f);
    setRefPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const acceptBgUpload = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image file.");
    setBgUploadPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const backgroundValue = () => {
    if (bgMode === "Brand color") return sessionColors[0] || "";
    if (bgMode === "Gradient") {
      const a = sessionColors[0] || "";
      const b = sessionColors[1] || sessionColors[0] || "";
      return a && b ? `${a} → ${b}` : a;
    }
    if (bgMode === "Texture") return bgTexture;
    if (bgMode === "Upload image") return "";
    return bgScene; // AI scene
  };

  const handleGenerate = async () => {
    if (!headline.trim()) {
      toast.error("Add a headline to generate from.");
      return;
    }
    setGenerating(true);
    try {
      const brandContext = JSON.stringify({
        colors: sessionColors,
        fonts: brandFonts,
        logo_url: identity?.logo_url || "",
      });

      const fd = new FormData();
      if (refFile) fd.append("reference_image", refFile);
      fd.append("format", format);
      fd.append("headline", headline);
      fd.append("subheading", subheading);
      fd.append("cta", cta);
      fd.append("prompt", prompt);
      fd.append("visual_style", visualStyle);
      fd.append("background_mode", bgMode);
      fd.append("background_value", backgroundValue());
      fd.append("variations", String(variations));
      fd.append("brand_context", hasIdentity ? brandContext : "");

      const res = await apiClient.post("/api/studios/visuals/generate", fd);
      const urls = Array.isArray(res?.image_urls) ? res.image_urls : [];
      if (!urls.length) {
        toast.error("No visuals were returned. Please try again.");
      } else {
        setImages(urls);
        if (res?.usage) setUsage((prev) => ({ ...(prev || {}), ...res.usage }));
        else loadUsage();
        if (res?.partial_failures) toast.message(`${urls.length} generated, ${res.partial_failures} failed.`);
        else toast.success(`Generated ${urls.length} visual${urls.length > 1 ? "s" : ""}.`);
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
      await apiClient.post("/api/studios/visuals/save", {
        image_urls: images,
        generation_params: { format, headline, visual_style: visualStyle, background_mode: bgMode },
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
      a.download = name || "visual.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(absUrl(url), "_blank", "noopener");
    }
  };
  const downloadAll = () => images.forEach((url, i) => downloadImage(url, `visual-${i + 1}.png`));

  if (pageLocked) return <LockedView />;

  const limitLabel = usage ? (usage.limit === null ? "∞" : usage.limit) : "—";
  const atLimit = usage && usage.limit !== null && usage.used >= usage.limit;
  const generateDisabled = !headline.trim() || generating || atLimit;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" data-testid="studios-visual-page">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button
            onClick={() => navigate("/studios")}
            data-testid="visual-back-btn"
            style={{ fontSize: 11, color: "var(--cth-command-muted)", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}
          >
            <ArrowLeft size={11} /> Studios
          </button>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--cth-command-ink)" }}>
              Visual Studio
            </div>
            <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
              Generate on-brand social graphics, cover images, and brand visuals.
            </div>
          </div>
        </div>

        <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)" }}>
          {/* ---- Form ---- */}
          <div style={CARD}>
            <div style={CARD_LABEL}>Generation settings</div>

            <div data-testid="visual-usage" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>Generations this month</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-crimson)" }}>
                {usage ? `${usage.used} / ${limitLabel} used` : "Loading…"}
              </span>
            </div>

            {/* Output format pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Output format <span style={{ color: "var(--cth-command-crimson)" }}>*</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                {FORMATS.map((f) => {
                  const on = f.key === format;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      data-testid={`visual-fmt-${f.key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                      style={{
                        padding: "7px 6px", borderRadius: 7, fontSize: 10, fontWeight: 500,
                        border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
                        background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)",
                        color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
                        cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3,
                      }}
                    >
                      {f.label}
                      <span style={{ fontSize: 8, display: "block", marginTop: 1, color: on ? "var(--cth-command-ivory)" : "var(--cth-command-muted)", opacity: on ? 0.7 : 1 }}>
                        {f.dims}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={DIVIDER} />

            {/* Reference image */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Reference image</div>
              <div
                data-testid="visual-ref-upload"
                onClick={() => refInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptRef(e.dataTransfer.files?.[0]); }}
                style={{ border: "1px dashed var(--cth-command-border)", borderRadius: 10, padding: refPreview ? 10 : 16, textAlign: "center", cursor: "pointer", background: dragOver ? "var(--cth-command-panel-soft)" : "var(--cth-command-blush)" }}
              >
                {refPreview ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <img src={refPreview} alt="Reference" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 7, border: "0.5px solid var(--cth-command-border)" }} />
                    <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>{refFile?.name} · click to replace</span>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 6 }}><ImageIcon size={20} style={{ color: "var(--cth-command-muted)" }} /></div>
                    <div style={{ fontSize: 11, color: "var(--cth-command-muted)", lineHeight: 1.5 }}>Upload your headshot, product photo, or any reference image</div>
                    <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 3 }}>JPG, PNG, WEBP up to 10MB — optional but recommended</div>
                  </>
                )}
                <input ref={refInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => acceptRef(e.target.files?.[0])} />
              </div>
              <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>Anchors the visual to your face or product</div>
            </div>

            {/* Copy fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Headline <span style={{ color: "var(--cth-command-crimson)" }}>*</span></div>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Your brand is the structure" style={FIELD_INPUT} data-testid="visual-headline" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Subheading</div>
              <input value={subheading} onChange={(e) => setSubheading(e.target.value)} placeholder="Optional" style={FIELD_INPUT} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Call to action</div>
              <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Optional — e.g. Start the diagnostic" style={FIELD_INPUT} />
            </div>

            <div style={DIVIDER} />

            {/* Prompt + Content Studio link */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Prompt</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste a prompt from Content Studio or write your own visual direction..."
                style={{ ...FIELD_INPUT, resize: "none", lineHeight: 1.6, minHeight: 64 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>From Content Studio:</span>
                <button
                  onClick={() => navigate("/content-studio")}
                  data-testid="visual-content-studio-link"
                  style={{ fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Visual Prompts
                </button>
              </div>
            </div>

            <div style={DIVIDER} />

            {/* Visual style */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Visual style</div>
              <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} style={FIELD_INPUT} data-testid="visual-style">
                {VISUAL_STYLES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            {/* Background mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Background</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {BG_MODES.map((m) => {
                  const on = m === bgMode;
                  return (
                    <button
                      key={m}
                      onClick={() => setBgMode(m)}
                      style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 500, border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`, background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)", color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {bgMode === "AI scene" && (
                <select value={bgScene} onChange={(e) => setBgScene(e.target.value)} style={FIELD_INPUT}>
                  {SCENE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
              {bgMode === "Brand color" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: sessionColors[0] || "var(--cth-command-muted)", border: "0.5px solid var(--cth-command-border)" }} />
                  <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>
                    {sessionColors[0] ? `Your brand color ${sessionColors[0]}` : "Set a brand color in Identity Studio"}
                  </span>
                </div>
              )}
              {bgMode === "Gradient" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8 }}>
                  <div style={{ width: 40, height: 18, borderRadius: 5, background: `linear-gradient(135deg, ${sessionColors[0] || "var(--cth-command-muted)"}, ${sessionColors[1] || sessionColors[0] || "var(--cth-command-ink)"})`, border: "0.5px solid var(--cth-command-border)" }} />
                  <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>Two-stop gradient from your brand colors</span>
                </div>
              )}
              {bgMode === "Upload image" && (
                <div
                  onClick={() => bgInputRef.current?.click()}
                  style={{ border: "1px dashed var(--cth-command-border)", borderRadius: 10, padding: bgUploadPreview ? 8 : 14, textAlign: "center", cursor: "pointer", background: "var(--cth-command-blush)" }}
                >
                  {bgUploadPreview ? (
                    <img src={bgUploadPreview} alt="Background" style={{ width: 56, height: 36, objectFit: "cover", borderRadius: 6, border: "0.5px solid var(--cth-command-border)" }} />
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>Click to upload a background image</div>
                  )}
                  <input ref={bgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => acceptBgUpload(e.target.files?.[0])} />
                </div>
              )}
              {bgMode === "Texture" && (
                <select value={bgTexture} onChange={(e) => setBgTexture(e.target.value)} style={FIELD_INPUT}>
                  {TEXTURE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              )}
            </div>

            {/* Variations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Variations</div>
              <select value={variations} onChange={(e) => setVariations(Number(e.target.value))} style={FIELD_INPUT} data-testid="visual-variations">
                {[1, 2, 4].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Brand identity bar — dots are editable for this generation only */}
            <div data-testid="visual-brand-bar" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 9, marginBottom: 10, flexWrap: "wrap" }}>
              {hasIdentity ? (
                <>
                  {sessionColors.slice(0, 3).map((hex, i) => {
                    const overridden = colorOverrides[i] != null;
                    return (
                      <div
                        key={i}
                        className="group"
                        data-testid={`visual-color-dot-${i}`}
                        style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 2,
                            left: 2,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: hex,
                            border: overridden
                              ? "1px solid var(--cth-command-warning)"
                              : "0.5px solid var(--cth-command-border)",
                          }}
                        />
                        <input
                          type="color"
                          value={toPickerHex(hex)}
                          onChange={(e) =>
                            setColorOverrides((prev) => ({ ...prev, [i]: (e.target.value || "").toUpperCase() }))
                          }
                          aria-label={`Edit brand color ${i + 1} for this generation`}
                          title="Edit color for this generation"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                            border: "none",
                            padding: 0,
                            background: "transparent",
                          }}
                        />
                        <Pencil
                          size={9}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            position: "absolute",
                            top: -5,
                            right: -5,
                            color: "var(--cth-command-muted)",
                            background: "var(--cth-command-panel)",
                            borderRadius: "50%",
                            padding: 1,
                            pointerEvents: "none",
                          }}
                        />
                      </div>
                    );
                  })}
                  <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>{brandFonts.slice(0, 2).join(" · ") || "Brand fonts"}</span>
                  {hasColorOverrides ? (
                    <span data-testid="visual-custom-colors" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "var(--cth-command-warning)", fontWeight: 500 }}>
                        Custom colors
                      </span>
                      <button
                        onClick={() => setColorOverrides({})}
                        data-testid="visual-reset-colors"
                        style={{ fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 }}
                      >
                        Reset to brand
                      </button>
                    </span>
                  ) : (
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--cth-command-success)", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                      <Check size={10} /> Brand identity applied
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span style={{ fontSize: 10, color: "var(--cth-command-muted)" }}>
                    {identityLoaded ? "No brand identity set" : "Loading identity…"}
                  </span>
                  {identityLoaded && (
                    <button onClick={() => navigate("/identity-studio")} style={{ marginLeft: "auto", fontSize: 10, color: "var(--cth-command-crimson)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      Set it up
                    </button>
                  )}
                </>
              )}
            </div>

            <div style={DIVIDER} />

            {/* Zuri */}
            <div style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--cth-command-cinnabar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 500, color: "var(--cth-command-ivory)" }}>Z</span>
                </div>
                <span style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cth-command-purple-mid)" }}>Zuri · visual direction</span>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: "var(--cth-command-ivory)", fontStyle: "italic", lineHeight: 1.5 }}>
                "A graphic that converts leads with the eye before the mind. Your brand colors and
                typography should do the heavy lifting — the words just confirm what the design already
                said."
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateDisabled}
              data-testid="visual-generate-btn"
              style={{ width: "100%", padding: 11, background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: generateDisabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 6, opacity: generateDisabled ? 0.55 : 1 }}
            >
              {generating ? "Generating…" : atLimit ? "Monthly limit reached" : "Generate Visuals"}
            </button>
          </div>

          {/* ---- Output ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={CARD} data-testid="visual-output">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)" }}>
                  Generated visuals
                </div>
                {images.length > 0 && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={downloadAll} style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}>
                      Download all
                    </button>
                    <button onClick={handleSave} disabled={saving} data-testid="visual-save-btn" style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-success)", color: "var(--cth-command-ivory)", border: "none", opacity: saving ? 0.6 : 1 }}>
                      {saving ? "Saving…" : "Save to library"}
                    </button>
                  </div>
                )}
              </div>

              {images.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  {images.map((url, i) => (
                    <div
                      key={url}
                      onClick={() => downloadImage(url, `visual-${i + 1}.png`)}
                      onMouseEnter={() => setHoveredImg(i)}
                      onMouseLeave={() => setHoveredImg(-1)}
                      style={{ borderRadius: 10, border: "0.5px solid var(--cth-command-border)", aspectRatio: activeFormat.css, position: "relative", overflow: "hidden", cursor: "pointer", background: "var(--cth-command-blush)" }}
                    >
                      <img src={absUrl(url)} alt={`Visual ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(26, 8, 40, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: hoveredImg === i ? 1 : 0, transition: "opacity 0.15s" }}>
                        <Download size={20} style={{ color: "var(--cth-command-ivory)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 36, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 12, marginTop: 8 }}>
                  <LayoutGrid size={22} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 8px" }} />
                  {generating ? "Generating your visuals…" : "Your generated visuals will appear here."}
                </div>
              )}
            </div>

            <div style={CARD} data-testid="visual-saved">
              <div style={CARD_LABEL}>Saved visuals</div>
              {saved.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                  {saved.map((v) => (
                    <div key={v.id} onClick={() => downloadImage(v.image_url, "visual.png")} style={{ borderRadius: 8, border: "0.5px solid var(--cth-command-border)", aspectRatio: "1 / 1", overflow: "hidden", cursor: "pointer", background: "var(--cth-command-blush)" }}>
                      <img src={absUrl(v.image_url)} alt="Saved visual" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 28, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 11 }}>
                  <LayoutGrid size={20} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 6px" }} />
                  Your saved visuals will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
