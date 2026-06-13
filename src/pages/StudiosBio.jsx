import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Lock, Sparkles, Loader2, Copy, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";

const PLAN_RANK = { free: 0, audit: 1, foundation: 2, structure: 3, house: 4, estate: 5, legacy: 6 };

const TONE_OPTIONS = [
  "Auto-detect from brand",
  "Professional",
  "Conversational",
  "Bold and Direct",
  "Warm and Approachable",
];

const TABS = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "speaker", label: "Speaker" },
  { key: "website", label: "Website" },
  { key: "headline", label: "Headline" },
];

const CARD = { background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 12, padding: 18 };
const CARD_LABEL = { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500, marginBottom: 12 };
const FIELD_LABEL = { fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 500 };
const FIELD_INPUT = { padding: "8px 11px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, fontSize: 12, color: "var(--cth-command-ink)", fontFamily: "'DM Sans', sans-serif", outline: "none", width: "100%" };
const DIVIDER = { height: "0.5px", background: "var(--cth-command-border)", margin: "12px 0" };

const BIO_TEXT_BLOCK = {
  background: "#ffffff",
  border: "0.5px solid var(--cth-command-border)",
  borderRadius: 8,
  padding: 16,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  color: "var(--cth-command-ink)",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || "");
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy to clipboard.");
  }
}

function LockedView() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div style={{ ...CARD, padding: 32, textAlign: "center" }} data-testid="bio-locked">
          <div style={{ width: 64, height: 64, borderRadius: 16, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)" }}>
            <Lock size={26} style={{ color: "var(--cth-command-crimson)" }} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>Bio Generator</h1>
          <p style={{ fontSize: 13, color: "var(--cth-command-muted)", lineHeight: 1.6, margin: "10px auto 22px", maxWidth: 360 }}>
            Generate professional bios for LinkedIn, speaking events, and your website from your brand data. This studio unlocks on The Foundation plan and above.
          </p>
          <button onClick={() => navigate("/billing")} style={{ padding: "10px 22px", background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            View plans
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function StudiosBio() {
  const navigate = useNavigate();
  const { plan, isSuperAdmin } = usePlan();
  const normalizedPlan = String(plan || "free").toLowerCase();
  const pageLocked = (PLAN_RANK[normalizedPlan] ?? 0) < PLAN_RANK.foundation && !isSuperAdmin;

  const [usage, setUsage] = useState(null);
  const [toneOverride, setToneOverride] = useState(TONE_OPTIONS[0]);
  const [customContext, setCustomContext] = useState("");
  const [includeCta, setIncludeCta] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [bios, setBios] = useState(null); // { linkedin, speaker, website, headline }
  const [activeTab, setActiveTab] = useState("linkedin");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const loadUsage = useCallback(async () => {
    try { setUsage((await apiClient.get("/api/studios/bio/usage")) || null); }
    catch { setUsage(null); }
  }, []);

  const loadSaved = useCallback(async () => {
    try { const r = await apiClient.get("/api/studios/bio/saved"); setSaved(Array.isArray(r?.bios) ? r.bios : []); }
    catch { setSaved([]); }
  }, []);

  useEffect(() => {
    if (pageLocked) return;
    loadUsage(); loadSaved();
  }, [pageLocked, loadUsage, loadSaved]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post("/api/studios/bio/generate", {
        tone_override: toneOverride,
        custom_context: customContext,
        include_cta: includeCta,
      });
      const b = res?.bios || null;
      if (!b || !(b.linkedin || b.speaker || b.website || b.headline)) {
        toast.error("No bios were returned. Please try again.");
      } else {
        setBios(b);
        setActiveTab("linkedin");
        if (res?.usage) setUsage((prev) => ({ ...(prev || {}), ...res.usage }));
        else loadUsage();
        toast.success("Your bios are ready.");
      }
    } catch (err) {
      toast.error(err?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!bios) return;
    setSaving(true);
    try {
      await apiClient.post("/api/studios/bio/save", {
        linkedin: bios.linkedin || "",
        speaker: bios.speaker || "",
        website: bios.website || "",
        headline: bios.headline || "",
        generation_params: {
          tone_override: toneOverride,
          custom_context: customContext,
          include_cta: includeCta,
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

  if (pageLocked) return <LockedView />;

  const limit = usage ? usage.limit : undefined;
  const limitLabel = usage ? (limit === null ? "∞" : limit) : "—";
  const used = usage?.used ?? 0;
  const atLimit = usage && limit !== null && limit !== undefined && used >= limit;
  const generateDisabled = generating || atLimit;

  const activeBio = bios ? bios[activeTab] || "" : "";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6" data-testid="studios-bio-page">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <button
            onClick={() => navigate("/studios")} data-testid="bio-back-btn"
            style={{ fontSize: 11, color: "var(--cth-command-muted)", background: "var(--cth-command-panel)", border: "0.5px solid var(--cth-command-border)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}
          >
            <ArrowLeft size={11} /> Studios
          </button>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--cth-command-ink)" }}>Bio Generator</div>
            <div style={{ fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
              Generate professional bios for LinkedIn, speaking events, and your website.
            </div>
          </div>
        </div>

        <div className="grid gap-3.5" style={{ gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)" }}>
          {/* ---- FORM ---- */}
          <div style={CARD}>
            <div style={CARD_LABEL}>Generation settings</div>

            {/* Usage */}
            <div data-testid="bio-usage" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--cth-command-muted)" }}>Bios this month</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--cth-command-crimson)" }}>
                {usage ? `${used} / ${limitLabel} used` : "Loading…"}
              </span>
            </div>

            {/* Tone override */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Tone override</div>
              <select
                value={toneOverride}
                onChange={(e) => setToneOverride(e.target.value)}
                style={FIELD_INPUT}
                data-testid="bio-tone"
              >
                {TONE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Custom context */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              <div style={FIELD_LABEL}>Custom context</div>
              <textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Add anything specific you want included — awards, recent launches, notable clients..."
                style={{ ...FIELD_INPUT, resize: "none", lineHeight: 1.6, minHeight: 90 }}
                data-testid="bio-custom-context"
              />
              <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>Optional</div>
            </div>

            {/* Include CTA toggle */}
            <div
              onClick={() => setIncludeCta((v) => !v)}
              data-testid="bio-cta-toggle"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 9, marginBottom: 10, cursor: "pointer" }}
            >
              <div style={{ paddingRight: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--cth-command-ink)" }}>Include calls to action</div>
                <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 1 }}>Ends LinkedIn and website bios with an invitation to connect</div>
              </div>
              <div style={{ width: 34, height: 18, background: includeCta ? "var(--cth-command-crimson)" : "var(--cth-command-muted)", borderRadius: 20, position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
                <div style={{ width: 14, height: 14, background: "var(--cth-command-ivory)", borderRadius: "50%", position: "absolute", top: 2, left: includeCta ? 18 : 2, transition: "left 0.15s" }} />
              </div>
            </div>

            <div style={DIVIDER} />

            {/* Zuri */}
            <div style={{ background: "#1a0828", borderRadius: 10, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                  <img src="/zuri.png" alt="Zuri" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <span style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cth-command-purple-mid)" }}>Zuri · bio direction</span>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: "var(--cth-command-ivory)", fontStyle: "italic", lineHeight: 1.5 }}>
                "Zuri pulls from your Brand Foundation, Positioning, and Messaging to write bios that actually sound like you. The more complete your brand data is, the better your bios."
              </div>
            </div>

            <button
              onClick={handleGenerate} disabled={generateDisabled} data-testid="bio-generate-btn"
              style={{ width: "100%", padding: 11, background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: generateDisabled ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 12, opacity: generateDisabled ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              {generating && <Loader2 size={14} className="animate-spin" />}
              {generating ? "Generating your bios…" : atLimit ? "Monthly limit reached" : "Generate Bios"}
            </button>
          </div>

          {/* ---- OUTPUT ---- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Generated bios */}
            <div style={CARD} data-testid="bio-output">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)" }}>Generated bios</div>
                {bios && (
                  <button
                    onClick={handleSaveAll} disabled={saving} data-testid="bio-save-btn"
                    style={{ fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 7, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-success)", color: "var(--cth-command-ivory)", border: "none", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Save all bios"}
                  </button>
                )}
              </div>

              {bios ? (
                <div style={{ marginTop: 12 }}>
                  {/* Tabs */}
                  <div style={{ display: "flex", gap: 5, marginBottom: 12 }} data-testid="bio-tabs">
                    {TABS.map((t) => {
                      const on = t.key === activeTab;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setActiveTab(t.key)}
                          data-testid={`bio-tab-${t.key}`}
                          style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", border: `0.5px solid ${on ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`, background: on ? "var(--cth-command-crimson)" : "var(--cth-command-blush)", color: on ? "var(--cth-command-ivory)" : "var(--cth-command-ink)" }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                    <button
                      onClick={() => copyText(activeBio)}
                      data-testid="bio-copy-btn"
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "5px 11px", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>

                  <div style={BIO_TEXT_BLOCK} data-testid={`bio-content-${activeTab}`}>
                    {activeBio || "No content for this format."}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 36, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 12, marginTop: 8 }}>
                  {generating ? (
                    <>
                      <Loader2 size={22} className="animate-spin" style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 8px" }} />
                      Generating your bios…
                    </>
                  ) : (
                    <>
                      <Sparkles size={22} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 8px" }} />
                      Your generated bios will appear here.
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Saved bios */}
            <div style={CARD} data-testid="bio-saved">
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--cth-command-ink)", marginBottom: 10 }}>Saved bios</div>
              {saved.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--cth-command-muted)", fontSize: 11 }}>
                  <FileText size={20} style={{ color: "var(--cth-command-border)", display: "block", margin: "0 auto 6px" }} />
                  Your saved bios will appear here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {saved.map((item) => {
                    const expanded = expandedId === item.id;
                    return (
                      <div
                        key={item.id}
                        data-testid={`bio-saved-row-${item.id}`}
                        style={{ background: "var(--cth-command-blush)", border: "0.5px solid var(--cth-command-border)", borderRadius: 10, padding: "10px 12px" }}
                      >
                        <button
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.headline || "Untitled bio set"}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--cth-command-muted)", marginTop: 2 }}>{fmtDate(item.created_at)}</div>
                          </div>
                          {expanded ? <ChevronUp size={14} style={{ color: "var(--cth-command-muted)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "var(--cth-command-muted)", flexShrink: 0 }} />}
                        </button>

                        {expanded && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                            {TABS.map((t) => {
                              const text = item[t.key];
                              if (!text) return null;
                              return (
                                <div key={t.key}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={FIELD_LABEL}>{t.label}</span>
                                    <button
                                      onClick={() => copyText(text)}
                                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", background: "var(--cth-command-panel)", color: "var(--cth-command-ink)", border: "0.5px solid var(--cth-command-border)" }}
                                    >
                                      <Copy size={10} /> Copy
                                    </button>
                                  </div>
                                  <div style={BIO_TEXT_BLOCK}>{text}</div>
                                </div>
                              );
                            })}
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
