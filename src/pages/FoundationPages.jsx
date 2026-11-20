import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import { loadExpressionData } from "../lib/expressionLoad.mjs";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../hooks/useAuth";
import { FoundationPageShell, FoundationSectionLayout } from "./FoundationSectionLayout";
import { SectionsTable } from "./FoundationHome";
import { ReviewerQueue, useFoundationSections } from "../components/Foundation/FoundationReview";
import { AiButton, FieldCard, HousePanel, ListField, LoadState, TextField, cleanList, toList, useFieldAssist, useFieldHelp } from "../components/Foundation/FoundationFields";
import { errorMessage, homeRows, lockedCount, shortDate } from "../lib/foundationSections.mjs";

// The five other Foundation sections and Review and Lock (build reference, artboard F pattern):
// field cards with one AI button each in the main column; the shared layout adds the lesson spot,
// prev/next, the Your Review card and the lock. Each page reuses its existing data calls.

const LegacyAudit = lazy(() => import("./BrandAudit"));
const LegacyAudience = lazy(() => import("./Audience"));
const LegacyPositioning = lazy(() => import("./BrandPositioning"));
const LegacyMessaging = lazy(() => import("./MessagingStructure"));
const LegacyIdentity = lazy(() => import("./IdentityStudio"));

const VALUE = (obj, ...keys) => {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};
// ?classic=1 keeps the old full editors reachable until they are retired (Agent Tasks 14).
const isClassic = (search) => new URLSearchParams(search).get("classic") === "1";
const Classic = ({ children }) => <Suspense fallback={<p className="fnd-muted" aria-live="polite">Loading the full editor…</p>}>{children}</Suspense>;
function withClassic(Legacy, View) {
  return function Page() {
    const { search } = useLocation();
    return isClassic(search) ? <Classic><Legacy /></Classic> : <FoundationPageShell><View /></FoundationPageShell>;
  };
}
const Saved = ({ error }) => error ? <p className="fnd-error" role="alert">{error}</p> : null;

// ------------------------------------------------------------------ 1. Diagnostic Insight

function DiagnosticView() {
  const [data, setData] = useState(null), [error, setError] = useState("");
  const load = useCallback(async () => { setError(""); setData(null); try { setData(await apiClient.get("/api/foundation/diagnostic-insight")); } catch (e) { setError(errorMessage(e, "Diagnostic Insight could not be loaded.")); } }, []);
  useEffect(() => { load(); }, [load]);
  const r = data?.result || {};
  const gaps = Array.isArray(r.top_gaps) ? r.top_gaps : [];
  const actions = Array.isArray(r.interpretation?.priority_actions) ? r.interpretation.priority_actions.slice(0, 3) : [];
  return <FoundationSectionLayout title="Diagnostic Insight" subtitle="See where your brand stands before you build." activeSection="brand_audit" rail={<HousePanel sectionId="brand_audit" align={false} />}>
    <LoadState loading={!data && !error} error={error} onRetry={load} what="your Diagnostic Insight" />
    {data && !data.available && <div className="fnd-fields"><FieldCard label="BRAND DIAGNOSTIC" wide>
      <p>{data.completed ? "This workspace has an earlier Brand Audit, but no Brand Diagnostic result yet." : "No Brand Diagnostic has been completed for this workspace yet."}</p>
      <p><a className="fnd-btn fnd-btn-p fnd-btn-link" href="/brand-diagnostic">Start the Brand Diagnostic</a></p>
    </FieldCard></div>}
    {data?.available && <div className="fnd-fields fnd-insight">
      <FieldCard label="YOUR SCORE" hint={r.taken_by_me ? "From the Brand Diagnostic you took." : "From the Brand Diagnostic a teammate took."}>
        <p className="fnd-score"><b>{r.score ?? "—"}</b> <span>/ 60</span></p>{r.score_range && <p className="fnd-muted">{r.score_range}</p>}
      </FieldCard>
      <FieldCard label="RECOMMENDED STARTING POINT" hint="Where the Diagnostic suggests you begin."><p className="fnd-serif fnd-answer">{r.recommended_tier || "No recommendation saved."}</p></FieldCard>
      <FieldCard label="BIGGEST GAPS" hint="The areas that held your score back.">{gaps.length ? <ul className="fnd-read-list">{gaps.map((g) => <li key={g}>{g}</li>)}</ul> : <p className="fnd-muted">No gaps saved.</p>}</FieldCard>
      <FieldCard label="FIRST ACTIONS" hint="What to work on first.">{actions.length ? <ol className="fnd-read-list">{actions.map((a) => <li key={a.priority}><b>{a.category}:</b> {a.action}</li>)}</ol> : <p className="fnd-muted">No actions saved.</p>}</FieldCard>
      {r.interpretation?.scope_note && <p className="fnd-muted fnd-small fnd-field-wide">{r.interpretation.scope_note}</p>}
    </div>}
  </FoundationSectionLayout>;
}
export const BrandAuditPage = withClassic(LegacyAudit, DiagnosticView);

// ------------------------------------------------------------------ 3. Audience Truth

// Labels match the server's required-field names, so "Add Main problem to submit" points at a card.
const AUDIENCE_TEXT = [
  ["name", "Avatar name", "What you call this audience.", 1],
  ["stage", "Audience stage", "Where they are right now.", 1],
  ["description", "Who they are", "Describe them in their own words.", 3],
  ["primary_problem", "Main problem", "The problem they are actively trying to solve.", 3],
  ["transformation_desired", "Desired outcome", "What changes for them when it works.", 3],
  ["core_fear", "Core fear", "The concern underneath the immediate problem.", 2],
  ["core_desire", "Core desire", "What they most want to be true.", 2],
  ["emotional_trigger", "Emotional trigger", "What makes the problem feel urgent.", 2],
];
const AUDIENCE_LISTS = [
  ["surface_symptoms", "Surface symptoms", "Signs they notice day to day.", "Symptom", "+ Add symptom"],
  ["where_they_are", "Where they are", "Places and channels where you find them.", "Place", "+ Add place"],
  ["objections", "Objections", "What makes them hesitate.", "Objection", "+ Add objection"],
];

function AudienceView() {
  const help = useFieldHelp("audience");
  const [avatar, setAvatar] = useState(null), [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await apiClient.get(API_PATHS.audience.avatars);
      const list = Array.isArray(r?.avatars) ? r.avatars : [];
      // Same pick as the server: the primary avatar, else the newest one.
      const a = list.find((x) => x.is_primary) || [...list].sort((x, y) => String(y.created_at || "").localeCompare(String(x.created_at || "")))[0] || null;
      setAvatar(a); setDraft(a ? { ...a, ...Object.fromEntries(AUDIENCE_LISTS.map(([k]) => [k, toList(a[k])])) } : null);
    } catch (e) { setError(errorMessage(e, "Audience data could not be loaded.")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!avatar?.id || !draft) return false;
    setSaving(true); setSaveError("");
    const payload = { ...Object.fromEntries(AUDIENCE_TEXT.map(([k]) => [k, draft[k] || ""])), ...Object.fromEntries(AUDIENCE_LISTS.map(([k]) => [k, cleanList(draft[k])])) };
    try { await apiClient.patch(API_PATHS.audience.avatarById(avatar.id), payload); return true; }
    catch (e) { setSaveError(errorMessage(e, "Audience changes could not be saved.")); return false; }
    finally { setSaving(false); }
  };
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const ai = (label, k) => <AiButton value={draft?.[k]} onClick={() => help(label, draft?.[k])} />;
  return <FoundationSectionLayout title="Audience Truth" subtitle="Understand the people your brand is here to serve." activeSection="audience" onSaveDraft={avatar ? save : null} saving={saving} rail={<HousePanel sectionId="audience" />}>
    <LoadState loading={loading} error={error} onRetry={load} what="your audience" />
    {!loading && !error && !avatar && <div className="fnd-fields"><FieldCard label="NO AUDIENCE PROFILE YET" wide>
      <p>Create your first audience profile to start this section.</p>
      <p><Link className="fnd-btn fnd-btn-p fnd-btn-link" to="/audience?classic=1">Create an audience profile</Link></p>
    </FieldCard></div>}
    {draft && <>
      <Saved error={saveError} />
      <div className="fnd-fields">
        {AUDIENCE_TEXT.map(([k, label, hint, rows]) => rows === 1
          ? <FieldCard key={k} id={`audience-${k}`} label={label} hint={hint} ai={ai(label, k)}><input id={`audience-${k}`} type="text" value={draft[k] || ""} onChange={(e) => set(k, e.target.value)} /></FieldCard>
          : <TextField key={k} id={`audience-${k}`} label={label} hint={hint} rows={rows} value={draft[k]} onChange={(v) => set(k, v)} ai={ai(label, k)} />)}
        {AUDIENCE_LISTS.map(([k, label, hint, one, add]) => <ListField key={k} id={`audience-${k}`} label={label} hint={hint} items={draft[k]} onChange={(v) => set(k, v)} one={one} addLabel={add} ai={ai(label, k)} />)}
      </div>
      <p className="fnd-muted fnd-small">This page edits your primary audience profile. <Link to="/audience?classic=1">Manage all audience profiles</Link></p>
    </>}
  </FoundationSectionLayout>;
}
export const AudiencePage = withClassic(LegacyAudience, AudienceView);

// ------------------------------------------------------------------ 4. Positioning

// The statement is kept in the shared Foundation record (field "positioning"); the rest in the
// positioning record. Field ids are the ones the positioning ai-assist route knows.
const POSITION_FIELDS = [
  ["statement", "Positioning statement", "One sentence: who it's for, what you do, and why you over the alternatives.", 3, true],
  ["category", "Category", "The market you compete in.", 2],
  ["audienceSpecificity", "Who it is for", "The specific people you serve.", 2],
  ["differentiator", "Differentiator", "What makes you meaningfully different.", 3],
];
const POSITION_NAME = Object.fromEntries(POSITION_FIELDS.map(([k, l]) => [k, l]));

function PositioningView() {
  const { activeWorkspaceId } = useWorkspace();
  const [raw, setRaw] = useState({}), [foundation, setFoundation] = useState({}), [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [p, f] = await Promise.all([apiClient.get("/api/persist/brand-positioning"), apiClient.get("/api/persist/brand-foundation")]);
      const doc = p?.positioning || p || {}, fd = f?.foundation || f || {};
      setRaw(doc); setFoundation(fd);
      setDraft({ statement: VALUE(fd, "positioning"), category: VALUE(doc, "category"), audienceSpecificity: VALUE(doc, "audience_specificity", "audienceSpecificity"), differentiator: VALUE(doc, "differentiator") });
    } catch (e) { setError(errorMessage(e, "Positioning data could not be loaded.")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  // The Foundation record is written first, so the positioning save that follows is the last one.
  const save = async (next = draft) => {
    setSaving(true); setSaveError("");
    try {
      if (next.statement !== VALUE(foundation, "positioning")) { const f = { ...foundation, positioning: next.statement }; await apiClient.post("/api/persist/brand-foundation", f); setFoundation(f); }
      const payload = { ...raw, category: next.category, audience_specificity: next.audienceSpecificity, differentiator: next.differentiator };
      await apiClient.post("/api/persist/brand-positioning", payload); setRaw(payload); setDraft(next); return true;
    } catch (e) { setSaveError(errorMessage(e, "Positioning could not be saved.")); return false; } finally { setSaving(false); }
  };
  const assist = useFieldAssist(async (field) => (field === "statement"
    ? await apiClient.post("/api/persist/brand-foundation/ai-assist", { field: "positioning", current_data: { ...foundation, positioning: draft.statement } })
    : await apiClient.post("/api/persist/brand-positioning/ai-assist", { field_id: field, current_value: draft[field] || "", workspace_id: activeWorkspaceId || "" }))?.suggestion);
  const use = async () => { if (assist.draft && await save({ ...draft, [assist.draft.field]: assist.draft.text })) assist.clear(); };
  const rail = <HousePanel sectionId="positioning" assist={assist} nameOf={(f) => POSITION_NAME[f] || f} onUse={use} saving={saving} />;
  return <FoundationSectionLayout title="Positioning" subtitle="Define the place your brand earns in the market." activeSection="positioning" onSaveDraft={draft ? () => save() : null} saving={saving} rail={rail}>
    <LoadState loading={loading} error={error} onRetry={load} what="Positioning" />
    {draft && <><Saved error={saveError} /><div className="fnd-fields">
      {POSITION_FIELDS.map(([k, label, hint, rows, wide]) => <TextField key={k} id={`position-${k}`} label={label} hint={hint} rows={rows} wide={wide} value={draft[k]} onChange={(v) => setDraft((d) => ({ ...d, [k]: v }))} ai={<AiButton value={draft[k]} busy={Boolean(assist.busy)} onClick={() => assist.request(k)} />} />)}
    </div></>}
  </FoundationSectionLayout>;
}
export const PositioningPage = withClassic(LegacyPositioning, PositioningView);

// ------------------------------------------------------------------ 5. Messaging

// [draft key, label, hint, rows, ai-assist field id (messaging route) or null (Foundation route)]
const MESSAGE_TEXT = [
  ["brand_promise", "Brand promise", "The transformation your brand promises.", 2, "brandPromise"],
  ["one_liner", "One-liner", "What you do, in one clear sentence.", 2, "oneLiner"],
  ["core_message", "Core message", "The idea your brand keeps coming back to.", 3, "coreMessage"],
  ["elevator_pitch", "Elevator pitch", "What you say when someone asks what you do.", 3, "elevatorPitch"],
  ["calls_to_action", "Calls to action", "What you ask people to do next.", 2, "callsToAction"],
  ["tagline", "Tagline", "A short line people remember.", 1, null],
];
const MESSAGE_NAME = { ...Object.fromEntries(MESSAGE_TEXT.map(([k, l]) => [k, l])), pillars: "Brand pillars", proof_points: "Proof points" };

// Pillars live in the shared Foundation record as names (brand_pillars) and, when Strategic OS made
// them, as full entries (brand_pillars_full). Both are written together so they stay in step.
function pillarsFrom(fd) {
  const full = Array.isArray(fd.brand_pillars_full) ? fd.brand_pillars_full : [];
  return full.length ? toList(full) : toList(fd.brand_pillars ?? fd.brandPillars);
}
function pillarsPatch(fd, names) {
  const full = Array.isArray(fd.brand_pillars_full) ? fd.brand_pillars_full : [];
  return { brand_pillars: names, brand_pillars_full: names.map((n) => full.find((p) => (p?.name || p) === n) || { name: n }) };
}

function MessagingView() {
  const { activeWorkspaceId } = useWorkspace();
  const [raw, setRaw] = useState({}), [foundation, setFoundation] = useState({}), [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [m, f] = await Promise.all([apiClient.get("/api/persist/messaging-structure"), apiClient.get("/api/persist/brand-foundation")]);
      const md = m?.messaging_structure || m || {}, fd = f?.foundation || f || {};
      setRaw(md); setFoundation(fd);
      setDraft({ brand_promise: VALUE(md, "brand_promise", "brandPromise"), one_liner: VALUE(md, "one_liner", "oneLiner"), core_message: VALUE(md, "core_message", "coreMessage"), elevator_pitch: VALUE(md, "elevator_pitch", "elevatorPitch"), calls_to_action: VALUE(md, "calls_to_action", "callsToAction"), proof_points: toList(VALUE(md, "proof_points", "proofPoints")), tagline: VALUE(fd, "tagline"), pillars: pillarsFrom(fd) });
    } catch (e) { setError(errorMessage(e, "Messaging data could not be loaded.")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  // The Foundation record (tagline, pillars) is written first, so the messaging save is the last one.
  const save = async (next = draft) => {
    setSaving(true); setSaveError("");
    try {
      const pillars = cleanList(next.pillars);
      if (next.tagline !== VALUE(foundation, "tagline") || JSON.stringify(pillars) !== JSON.stringify(pillarsFrom(foundation))) {
        const f = { ...foundation, tagline: next.tagline, ...pillarsPatch(foundation, pillars) }; await apiClient.post("/api/persist/brand-foundation", f); setFoundation(f);
      }
      const payload = { ...raw, brand_promise: next.brand_promise, one_liner: next.one_liner, core_message: next.core_message, elevator_pitch: next.elevator_pitch, calls_to_action: next.calls_to_action, proof_points: cleanList(next.proof_points).join("\n") };
      await apiClient.post("/api/persist/messaging-structure", payload); setRaw(payload); setDraft(next); return true;
    } catch (e) { setSaveError(errorMessage(e, "Messaging could not be saved.")); return false; } finally { setSaving(false); }
  };
  const routeOf = (k) => MESSAGE_TEXT.find(([id]) => id === k)?.[4] ?? (k === "proof_points" ? "proofPoints" : null);
  const assist = useFieldAssist(async (k) => {
    const value = Array.isArray(draft[k]) ? cleanList(draft[k]).join("\n") : draft[k] || "";
    return (routeOf(k)
      ? await apiClient.post("/api/persist/messaging-structure/ai-assist", { field_id: routeOf(k), current_value: value, workspace_id: activeWorkspaceId || "" })
      : await apiClient.post("/api/persist/brand-foundation/ai-assist", { field: k === "pillars" ? "brand_pillars" : k, current_data: { ...foundation, tagline: draft.tagline, brand_pillars: cleanList(draft.pillars) } }))?.suggestion;
  });
  const use = async () => { if (!assist.draft) return; const k = assist.draft.field; if (await save({ ...draft, [k]: Array.isArray(draft[k]) ? toList(assist.draft.text) : assist.draft.text })) assist.clear(); };
  const ai = (k) => <AiButton value={draft[k]} busy={Boolean(assist.busy)} onClick={() => assist.request(k)} />;
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const rail = <HousePanel sectionId="messaging" assist={assist} nameOf={(f) => MESSAGE_NAME[f] || f} onUse={use} saving={saving} />;
  return <FoundationSectionLayout title="Messaging" subtitle="Give your brand a clear message people can act on." activeSection="messaging" onSaveDraft={draft ? () => save() : null} saving={saving} rail={rail}>
    <LoadState loading={loading} error={error} onRetry={load} what="Messaging" />
    {draft && <><Saved error={saveError} /><div className="fnd-fields">
      {MESSAGE_TEXT.slice(0, 3).map(([k, label, hint, rows]) => <TextField key={k} id={`message-${k}`} label={label} hint={hint} rows={rows} value={draft[k]} onChange={(v) => set(k, v)} ai={ai(k)} />)}
      <ListField id="message-pillars" label="Brand pillars" hint="Three to five themes your brand stands on." items={draft.pillars} onChange={(v) => set("pillars", v)} one="Pillar" addLabel="+ Add pillar" ai={ai("pillars")} />
      {MESSAGE_TEXT.slice(3).map(([k, label, hint, rows]) => rows === 1
        ? <FieldCard key={k} id={`message-${k}`} label={label} hint={hint} ai={ai(k)}><input id={`message-${k}`} type="text" value={draft[k] || ""} onChange={(e) => set(k, e.target.value)} /></FieldCard>
        : <TextField key={k} id={`message-${k}`} label={label} hint={hint} rows={rows} value={draft[k]} onChange={(v) => set(k, v)} ai={ai(k)} />)}
      <ListField id="message-proof" label="Proof points" hint="Evidence that backs up what you say." items={draft.proof_points} onChange={(v) => set("proof_points", v)} one="Proof point" addLabel="+ Add proof point" ai={ai("proof_points")} />
    </div></>}
  </FoundationSectionLayout>;
}
export const MessagingPage = withClassic(LegacyMessaging, MessagingView);

// ------------------------------------------------------------------ 6. Brand Expression

const HEX = /^#[0-9a-f]{6}$/i;

function ExpressionView() {
  const { activeWorkspaceId } = useWorkspace();
  const { userId } = useAuth();
  const help = useFieldHelp("expression");
  const [identity, setIdentity] = useState({}), [foundation, setFoundation] = useState({}), [assets, setAssets] = useState([]), [assetsError, setAssetsError] = useState("");
  const [tone, setTone] = useState(""), [colors, setColors] = useState([]), [fonts, setFonts] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState("");
  // Identity, Foundation and assets load independently: no saved identity yet (404) shows the empty form.
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const d = await loadExpressionData((path, options) => apiClient.get(path, options), { userId, workspaceId: activeWorkspaceId });
      if (d.error) { setError(d.error); return; }
      setIdentity(d.identity); setFoundation(d.foundation); setAssets(d.assets); setAssetsError(d.assetsError);
      setTone(VALUE(d.identity, "tone_of_voice") || VALUE(d.foundation, "tone_of_voice", "toneOfVoice"));
      setColors(Array.isArray(d.identity.colors) ? d.identity.colors : []); setFonts(Array.isArray(d.identity.fonts) ? d.identity.fonts : []);
    } finally { setLoading(false); }
  }, [activeWorkspaceId, userId]);
  useEffect(() => { load(); }, [load]);
  const badHex = colors.some((c) => c.hex && !c.hex.startsWith("var(") && !HEX.test(c.hex));
  // Identity first, the Foundation record (tone of voice) last.
  const save = async () => {
    if (badHex) { setSaveError("Colors need a hex value like #AF0024."); return false; }
    setSaving(true); setSaveError("");
    try {
      const keptColors = colors.filter((c) => c.hex), keptFonts = fonts.filter((f) => String(f.family || "").trim());
      if (JSON.stringify(keptColors) !== JSON.stringify(identity.colors || []) || JSON.stringify(keptFonts) !== JSON.stringify(identity.fonts || [])) {
        const next = { ...identity, workspace_id: activeWorkspaceId || "", colors: keptColors, fonts: keptFonts };
        await apiClient.post("/api/identity/save", next); setIdentity(next);
      }
      if (tone !== VALUE(foundation, "tone_of_voice", "toneOfVoice")) { const f = { ...foundation, tone_of_voice: tone }; await apiClient.post("/api/persist/brand-foundation", f); setFoundation(f); }
      return true;
    } catch (e) { setSaveError(errorMessage(e, "Brand Expression could not be saved.")); return false; } finally { setSaving(false); }
  };
  const editRow = (list, setList, i, patch) => setList(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const named = (list) => list.map((x) => x.label || x.family || x.hex).filter(Boolean);
  return <FoundationSectionLayout title="Brand Expression" subtitle="Make your brand recognizable in how it sounds and looks." activeSection="expression" onSaveDraft={!loading && !error ? save : null} saving={saving} rail={<HousePanel sectionId="expression" />}>
    <LoadState loading={loading} error={error} onRetry={load} what="Brand Expression" />
    {!loading && !error && <><Saved error={saveError} /><div className="fnd-fields">
      <TextField id="expression-tone" label="Tone of voice" hint="How your brand sounds when it speaks." rows={4} wide value={tone} onChange={setTone} ai={<AiButton value={tone} onClick={() => help("Tone of voice", tone)} />} />
      <FieldCard label="Brand colors" hint="Your main colors, with a name and a hex value." ai={<AiButton value={named(colors)} onClick={() => help("Brand colors", named(colors))} />}>
        <ul className="fnd-rows">{colors.map((c, i) => <li key={c.id || i}>
          <span className="fnd-swatch" style={HEX.test(c.hex || "") || String(c.hex || "").startsWith("var(") ? { background: c.hex } : undefined} aria-hidden="true" />
          <input type="text" aria-label={`Color ${i + 1} name`} placeholder="Name" value={c.label || ""} onChange={(e) => editRow(colors, setColors, i, { label: e.target.value })} />
          <input type="text" aria-label={`Color ${i + 1} hex`} placeholder="#AF0024" value={c.hex || ""} onChange={(e) => editRow(colors, setColors, i, { hex: e.target.value.trim() })} />
          <button type="button" aria-label={`Remove color ${i + 1}`} onClick={() => setColors(colors.filter((_, j) => j !== i))}>×</button>
        </li>)}</ul>
        <button className="fnd-add" type="button" onClick={() => setColors([...colors, { id: `color-${colors.length + 1}`, role: "custom", label: "", hex: "" }])}>+ Add color</button>
      </FieldCard>
      <FieldCard label="Brand fonts" hint="Your heading and body typefaces." ai={<AiButton value={named(fonts)} onClick={() => help("Brand fonts", named(fonts))} />}>
        <ul className="fnd-rows">{fonts.map((f, i) => <li key={f.id || i}>
          <input type="text" aria-label={`Font ${i + 1} use`} placeholder="Heading" value={f.label || ""} onChange={(e) => editRow(fonts, setFonts, i, { label: e.target.value })} />
          <input type="text" aria-label={`Font ${i + 1} typeface`} placeholder="Typeface" value={f.family || ""} onChange={(e) => editRow(fonts, setFonts, i, { family: e.target.value })} />
          <button type="button" aria-label={`Remove font ${i + 1}`} onClick={() => setFonts(fonts.filter((_, j) => j !== i))}>×</button>
        </li>)}</ul>
        <button className="fnd-add" type="button" onClick={() => setFonts([...fonts, { id: `font-${fonts.length + 1}`, role: "custom", label: "", family: "", source: "system" }])}>+ Add font</button>
      </FieldCard>
      <FieldCard label="Logo and brand assets" hint="Confirmed files from your Identity Studio." wide>
        {assetsError && <p className="fnd-muted" role="status">{assetsError}</p>}
        {assets.length ? <ul className="fnd-read-list">{assets.map((a, i) => <li key={a.asset_id || a.id || i}>{a.name || a.filename || "Confirmed brand asset"}</li>)}</ul> : !assetsError && <p className="fnd-muted">No confirmed assets yet.</p>}
        <p><Link to="/identity-studio?classic=1">Upload and confirm assets in Identity Studio</Link></p>
      </FieldCard>
    </div></>}
  </FoundationSectionLayout>;
}
export const ExpressionPage = withClassic(LegacyIdentity, ExpressionView);

// ------------------------------------------------------------------ 7. Review and Lock

function ReviewLockView() {
  const { sections, loading, error, reload } = useFoundationSections();
  const [readiness, setReadiness] = useState([]);
  // Readiness only tells "In progress" from "Not started", as on Foundation Home.
  useEffect(() => { apiClient.get("/api/foundation/readiness").then((r) => setReadiness(r?.sections || []), () => setReadiness([])); }, []);
  const rows = useMemo(() => homeRows(sections, readiness), [sections, readiness]);
  const waiting = sections.filter((s) => s.status === "submitted" || s.status === "in_review").length;
  const last = sections.map((s) => s.locked_at).filter(Boolean).sort().pop();
  const all = sections.length > 0 && sections.every((s) => s.status === "locked");
  const side = <>
    <section className="fnd-card fnd-approval" aria-label="Approval and lock">
      <p className="fnd-lbl">APPROVAL AND LOCK</p>
      <p className="fnd-serif fnd-review-heading">{all ? "Your Foundation is locked" : waiting ? "In review" : "In progress"}</p>
      <dl className="fnd-facts">
        <div><dt>Sections locked</dt><dd>{lockedCount(rows)} of 6</dd></div>
        <div><dt>Waiting for review</dt><dd>{waiting}</dd></div>
        <div><dt>Last approved</dt><dd>{last ? shortDate(last) : "Nothing locked yet"}</dd></div>
      </dl>
      <p className="fnd-muted fnd-small">Your reviewer approves each section. A locked section can't be edited until it's unlocked.</p>
    </section>
    <HousePanel sectionId="review_lock" align={false} />
  </>;
  return <FoundationSectionLayout title="Review and Lock" subtitle="See where every section stands. Each one is locked once it's approved." activeSection="review_lock" rail={side}>
    <LoadState loading={loading && !sections.length} error={!sections.length ? error : ""} onRetry={reload} what="your sections" />
    {sections.length > 0 && <SectionsTable rows={rows} main={false} />}
    <ReviewerQueue />
  </FoundationSectionLayout>;
}
export function ReviewLockPage() {
  return <FoundationPageShell><ReviewLockView /></FoundationPageShell>;
}
