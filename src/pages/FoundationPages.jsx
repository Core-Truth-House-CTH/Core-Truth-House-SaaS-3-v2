import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, ChevronRight, FileText, Flag, Image as ImageIcon, Lightbulb, LockKeyhole, MessageSquareText, Palette, RefreshCw, Settings, ShieldCheck, Sparkles, Star, Target, UsersRound } from "lucide-react";
import apiClient from "../lib/apiClient";
import { AuditExportButton } from "../components/Brand/AuditExportButton";
import { API_PATHS } from "../lib/apiPaths";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../hooks/useAuth";
import { useAskTheHouse } from "../context/AskTheHouseContext";
import { FoundationPageShell, FoundationSectionLayout } from "./FoundationSectionLayout";
import "./foundation-phase1.css";
import "./foundation-v03.css";

const LegacyAudit = lazy(() => import("./BrandAudit"));
const LegacyAudience = lazy(() => import("./Audience"));
const LegacyPositioning = lazy(() => import("./BrandPositioning"));
const LegacyMessaging = lazy(() => import("./MessagingStructure"));
const LegacyIdentity = lazy(() => import("./IdentityStudio"));

const STAGES = [
  { id: "brand_audit", title: "Brand Audit", path: "/brand-audit", next: "core_truth" },
  { id: "core_truth", title: "Core Truth", path: "/brand-foundation", next: "audience" },
  { id: "audience", title: "Audience Truth", path: "/audience", next: "positioning" },
  { id: "positioning", title: "Positioning", path: "/brand-positioning", next: "messaging" },
  { id: "messaging", title: "Messaging", path: "/messaging-structure", next: "expression" },
  { id: "expression", title: "Brand Expression", path: "/identity-studio", next: "review_lock" },
  { id: "review_lock", title: "Review and Lock", path: "/foundation/review-lock", next: null },
];
const VALUE = (obj, ...keys) => {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
};
const isClassic = (search) => new URLSearchParams(search).get("classic") === "1";
const Classic = ({ children }) => <Suspense fallback={<div className="foundation-state" aria-live="polite">Loading the full editor…</div>}>{children}</Suspense>;

function useFoundationData() {
  const [readiness, setReadiness] = useState(null);
  const [readinessError, setReadinessError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setReadinessError("");
    try { setReadiness(await apiClient.get("/api/foundation/readiness")); }
    catch (e) { setReadinessError(e?.message || "Foundation readiness is unavailable."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { readiness, readinessError, loading, reloadReadiness: load };
}

function SectionRail({ sectionId, readiness, loading, error, retry }) {
  const { open } = useAskTheHouse();
  const section = readiness?.sections?.find((item) => item.id === sectionId);
  return <div className="foundation-rail-stack">
    <section className="foundation-card fp-rail-readiness" aria-live="polite">
      <div className="fp-rail-head"><span>FOUNDATION READINESS</span><strong>{readiness ? `${readiness.overall}%` : loading ? "Loading" : "—"}</strong></div>
      {readiness && <div className="fp-progress-track"><span style={{ width: `${readiness.overall}%` }} /></div>}
      <p className="foundation-muted">{readiness ? "Calculated from saved workspace fields." : error || "Readiness is not available."}</p>
      {!readiness && !loading && retry && <button className="foundation-button foundation-button-secondary" type="button" onClick={retry}>Retry readiness</button>}
    </section>
    <section className="foundation-card fp-rail-section">
      <div className="fp-rail-head"><span>THIS SECTION</span><strong>{section ? `${section.score}%` : loading ? "Loading" : "—"}</strong></div>
      <p>{section?.label || "Section readiness"}</p>
      {section?.missing_items?.length ? <><h3>Still missing</h3><ul>{section.missing_items.map((item) => <li key={item}>{item}</li>)}</ul></> : section && <p className="fp-success"><Check size={16} /> Required saved fields are complete.</p>}
      {!section && !loading && <p className="foundation-muted">Section readiness is unavailable.</p>}
    </section>
    <section className="foundation-card fp-ask-card">
      <div className="fp-card-title"><Sparkles size={18} /><div><h2>ASK THE HOUSE</h2><p>AI brand guide</p></div></div>
      <p>Open the existing guide for this section. Suggestions remain a draft until you apply them.</p>
      <button className="foundation-button foundation-button-primary" type="button" onClick={() => open(sectionId)}>Open Ask the House <ArrowRight size={15} /></button>
    </section>
  </div>;
}

function SectionDesignRail({ sectionId, readiness, loading, error, retry, aiPanel, pathIds }) {
  const { open } = useAskTheHouse();
  const section = readiness?.sections?.find((item) => item.id === sectionId);
  const paths = pathIds || (sectionId === "messaging" ? ["expression","review_lock"] : ["messaging","expression","review_lock"]);
  const laterSections = readiness?.sections?.filter((item) => paths.includes(item.id)) || [];
  return <div className="fp-section-design-rail">
    {aiPanel || <section className="foundation-card fp-design-ai"><div className="fp-card-title"><Sparkles size={19}/><h2>ASK THE HOUSE</h2></div><p>Open the existing guide for this section. Suggestions remain drafts until you choose to apply them.</p><button className="foundation-button foundation-button-primary" type="button" onClick={() => open(sectionId)}>Open Ask the House <ArrowRight size={15}/></button></section>}
    <section className="foundation-card fp-design-completion"><span className="fp-eyebrow">THIS SECTION</span><strong>{section ? `${section.score}%` : loading ? "Loading" : "Unavailable"}</strong><p>{section?.missing_items?.length ? section.missing_items.join(", ") : section ? "Required tracked fields are complete." : error || "Section readiness could not be loaded."}</p>{!section && !loading && retry && <button className="foundation-button foundation-button-secondary" type="button" onClick={retry}>Retry readiness</button>}</section>
    <section className="foundation-card fp-design-status"><div className="fp-design-status-donut" style={{"--section-readiness":(readiness?.overall||0)+"%"}}><span>{readiness?readiness.overall+"%":"—"}</span></div><div><span className="fp-eyebrow">FOUNDATION READINESS</span><strong>Overall readiness</strong><p>{readiness ? "Calculated from saved workspace fields." : error || "Overall readiness is unavailable."}</p></div>{!readiness&&!loading&&retry&&<button className="foundation-button foundation-button-secondary" type="button" onClick={retry}>Retry readiness</button>}</section>
    <section className="foundation-card fp-design-path"><div className="fp-card-title"><Target size={17}/><h2>YOUR PATH TO 100%</h2></div>
      {laterSections.length > 0 ? <div className="fp-design-path-content"><div className="fp-design-path-track" aria-hidden="true">{laterSections.map(item => <span key={item.id} style={{ "--milestone-score": item.score + "%" }} />)}</div>{laterSections.map(item => <div className="fp-design-path-row" key={item.id}><span>{item.label}</span><b>{item.score}%</b><small>{item.missing_items?.[0] || "Tracked fields complete"}</small></div>)}</div> : <p className="foundation-muted">Milestone readiness is unavailable.</p>}
    </section>
  </div>;
}
function AuditStatusRail({readiness,section,loading,error,retry}) {
 const overall=readiness?.overall;
 return <div className="fp-audit-status-rail"><section className="foundation-card fp-audit-status"><div className="fp-rail-head"><span>FOUNDATION STATUS</span><strong>{overall===undefined?"Unavailable":`${overall}%`}</strong></div>{overall!==undefined&&<div className="fp-progress-track"><span style={{width:`${overall}%`}}/></div>}<p>{overall===undefined?error||"Readiness is unavailable.":"Readiness calculated from saved workspace fields."}</p><div className="fp-audit-status-list"><div><span>Current version</span><b>Not tracked</b></div><div><span>Approval status</span><b>Unavailable</b></div><div><span>Lock status</span><b>Unavailable</b></div><div><span>This section</span><b>{section?`${section.score}%`:loading?"Loading":"Unavailable"}</b></div></div>{!readiness&&!loading&&retry&&<button className="foundation-button foundation-button-secondary" type="button" onClick={retry}>Retry readiness</button>}</section></div>
}

function FieldCard({ id, label, hint, value, onChange, rows = 2, disabled = false, unavailable, wide = false, type = "text" }) {
  const stringValue = Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
  return <section className={`fp-field-card${wide ? " is-wide" : ""}${disabled ? " is-disabled" : ""}`}>
    <div className="fp-field-heading"><div><label htmlFor={`fp-${id}`}>{label}</label>{hint && <p>{hint}</p>}</div>{disabled && <span className="fp-unavailable">Not editable</span>}</div>
    {unavailable ? <div className="fp-empty-field">{unavailable}</div> : <textarea id={`fp-${id}`} rows={rows} value={stringValue} readOnly={disabled} onChange={(event) => onChange?.(event.target.value)} aria-label={label} />}
  </section>;
}

function PageState({ loading, error, onRetry }) {
  if (loading) return <div className="foundation-state" aria-live="polite"><span className="fp-spinner" />Loading saved workspace data…</div>;
  if (error) return <div className="foundation-state is-error" role="alert"><p>{error}</p><button className="foundation-button foundation-button-secondary" type="button" onClick={onRetry}><RefreshCw size={15} /> Retry</button></div>;
  return null;
}

function ClassicLink({ to, children = "Open the full editor" }) {
  return <Link className="fp-classic-link" to={`${to}?classic=1`}>{children} <ArrowRight size={14} /></Link>;
}

function usePageState(path) {
  const location = useLocation();
  const navigate = useNavigate();
  return { classic: isClassic(location.search), location, navigate, back: () => navigate(path) };
}

export function BrandAuditPage() {
  const { classic } = usePageState("/brand-audit");
  if (classic) return <Classic><LegacyAudit /></Classic>;
  return <FoundationPageShell><BrandAuditView /></FoundationPageShell>;
}


function BrandAuditView() {
 const {activeWorkspaceId}=useWorkspace(),{userId}=useAuth(),{readiness,loading:readinessLoading,readinessError}=useFoundationData();
 const [audit,setAudit]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[tab,setTab]=useState("overview"),[moduleFilter,setModuleFilter]=useState("all"),{open}=useAskTheHouse();
 const load=useCallback(async()=>{setLoading(true);setError("");try{const params={};if(activeWorkspaceId)params.workspace_id=activeWorkspaceId;if(userId)params.user_id=userId;const x=await apiClient.get("/api/audit/latest",{params});setAudit(x?.audit||x||null)}catch(e){setError(e?.message||"The saved Brand Audit could not be loaded.")}finally{setLoading(false)}},[activeWorkspaceId,userId]);
 useEffect(()=>{load()},[load]);const raw=audit?.module_scores||audit?.scores||{};
 const modules=[["brand_foundation","Brand Foundation",["brand_foundation","foundation","brandFoundation","brand_foundation_score"],Target,"/brand-foundation"],["visual_identity","Visual Identity",["visual_identity","identity","visualIdentity","visual_identity_score"],Palette,"/identity-studio"],["offer_suite","Offer Suite",["offer_suite","offers","offerSuite","offer_suite_score"],Star,"/offer-builder"],["systems_and_sops","Systems & SOPs",["systems_and_sops","systems","systemsAndSops","systems_score"],Settings,"/systems-builder"],["content_library","Content Library",["content_library","content","contentLibrary","content_library_score"],FileText,"/content-studio"],["launch_readiness","Launch Readiness",["launch_readiness","launch","launchReadiness","launch_readiness_score"],ArrowRight,"/strategic-os"]].map(([id,label,keys,icon,route])=>{const v=VALUE(raw,...keys);return{id,label,icon,route,score:v!==""&&Number.isFinite(Number(v))?Number(v):null}})
 const scored=modules.filter(m=>m.score!==null),overall=VALUE(audit,"overallScore","overall_score","score")!==""?VALUE(audit,"overallScore","overall_score","score"):VALUE(raw,"overall"),hasAudit=!!(audit?.audit_id||audit?.auditId||audit?.id||scored.length||overall!==""||audit?.summary||audit?.analysis);
 const strongest=scored.length?scored.reduce((a,b)=>a.score>=b.score?a:b):null,weakest=scored.length?scored.reduce((a,b)=>a.score<=b.score?a:b):null;
 const recommendations=Array.isArray(audit?.recommendations)?audit.recommendations.filter(Boolean):[],findings=[...(Array.isArray(audit?.risks)?audit.risks:Array.isArray(audit?.gaps)?audit.gaps:[]),...recommendations],date=VALUE(audit,"created_at","createdAt","completed_at","completedAt","updated_at","updatedAt"),section=readiness?.sections?.find(x=>x.id==="brand_audit");
 const groups=[{id:"brand",label:"Your Brand",fields:[["brand_name","Brand name"],["tagline","Tagline"],["what_you_do","What you do"],["who_you_serve","Who you serve"]]},{id:"offer",label:"Your Offer",fields:[["primary_offer","Primary offer"],["price_point","Price point"],["offer_type","Offer type"],["other_offers","Other offers"]]},{id:"presence",label:"Your Presence",fields:[["active_platforms","Active platforms"],["posting_frequency","Posting frequency"],["website","Website"]]},{id:"goals",label:"Your Goals",fields:[["primary_goal","Primary goal"],["biggest_challenge","Biggest challenge"],["revenue_target","Revenue target"]]}];
 const answers=audit?.intake_answers||audit?.answers||{},answer=k=>{const v=VALUE(answers,k);return Array.isArray(v)?v.join(", "):v&&typeof v==="object"?Object.values(v).filter(Boolean).join(", "):v};
 const header=<div className="fp-audit-header-actions"><button disabled title="The current endpoint returns only the latest audit.">Latest audit⌄</button><label><span className="sr-only">Filter modules</span><select aria-label="Filter audit modules" value={moduleFilter} onChange={e=>setModuleFilter(e.target.value)}><option value="all">All modules</option>{modules.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select></label><button type="button" onClick={load} disabled={loading}><RefreshCw size={14}/>{loading?"Refreshing…":"Refresh"}</button>{audit?.audit_id||audit?.auditId||audit?.id?<AuditExportButton auditId={audit.audit_id||audit.auditId||audit.id} variant="secondary"/>:<button disabled>Export Audit</button>}<Link className="fp-audit-retake" to="/brand-audit?classic=1"><RefreshCw size={14}/>Retake Audit</Link></div>;
 const tabs=<div className="fp-audit-navigation"><nav className="fp-audit-tabs" aria-label="Brand Audit sections" role="tablist">{[["overview","Audit Overview"],["brand","Your Brand"],["offer","Your Offer"],["presence","Your Presence"],["goals","Your Goals"],["history","Audit History"]].map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} className={tab===id?"is-active":""} onClick={()=>setTab(id)}>{label}</button>)}</nav><Link className="fp-audit-back" to="/foundation">← Back to Foundation</Link></div>;
 const shown=moduleFilter==="all"?modules:modules.filter(m=>m.id===moduleFilter),summary=VALUE(audit,"ai_analysis_text","ai_analysis","analysis","summary");
 return <FoundationSectionLayout title="Brand Audit" subtitle="See where your brand stands and what to strengthen next." activeSection="brand_audit" hideToolbar headerActions={header} customTabs={tabs}>
 <PageState loading={loading} error={error} onRetry={load}/>{!loading&&!error&&<>
 <div className="fp-kpi-grid fp-audit-kpis">
 <article className="foundation-card fp-kpi fp-audit-score"><span className="fp-audit-score-ring"><b>{hasAudit&&overall!==""?overall:"—"}</b><small>/ 100</small></span><div><span>OVERALL AUDIT SCORE</span><strong>{hasAudit?"Latest saved assessment":"No saved assessment"}</strong></div></article>
 <article className="foundation-card fp-kpi"><span className="fp-metric-icon fp-metric-red"><Sparkles size={20}/></span><div><span>STRONGEST MODULE</span><strong>{strongest?.label||"Not available"}</strong><small>{strongest?strongest.score+" / 100":"No saved module score"}</small></div></article>
 <article className="foundation-card fp-kpi"><span className="fp-metric-icon fp-metric-gold"><AlertTriangle size={20}/></span><div><span>PRIORITY GAP</span><strong>{VALUE(audit,"primary_area","primaryArea","priority_gap")||findings[0]?.title||findings[0]?.label||weakest?.label||"Not available"}</strong><small>{weakest?weakest.score+" / 100 · ":""}{findings[0]?.description||findings[0]?.text||findings[0]?.detail||(weakest?"Lowest saved module score":"No saved recommendation")}</small></div></article>
 <article className="foundation-card fp-kpi"><span className="fp-metric-icon fp-metric-purple"><FileText size={20}/></span><div><span>LAST AUDIT</span><strong>{date?String(date):"Date unavailable"}</strong><small>{hasAudit?"Audit "+(audit?.audit_id||audit?.auditId||audit?.id||"saved")+" · completed":"No saved audit record"}</small></div></article></div>
 <div className="fp-audit-layout"><div className="fp-audit-left-column">
 <section className="foundation-card fp-audit-breakdown"><div className="fp-card-title"><Target size={18}/><h2>YOUR AUDIT BREAKDOWN</h2><span>{scored.length} of 6 modules assessed</span></div><div className="fp-audit-module-grid">{shown.map((m,i)=>{const Icon=m.icon;return <article className="fp-audit-module" key={m.id}><span className={"fp-audit-module-icon fp-tone-"+(i%6)}><Icon size={21}/></span><div className="fp-audit-module-content"><div><b>{m.label}</b><strong>{m.score===null?"Not available":<>{m.score} <small>/ 100</small></>}</strong></div><div className={"fp-audit-module-meter"+(m.score===null?" is-empty":"")}><span style={{width:m.score===null?"0%":Math.max(0,Math.min(100,m.score))+"%"}}/></div><p>{m.score===null?"No saved score for this module.":m.score<100?"Assessment gap in the saved result.":"Saved audit score is 100 / 100."}</p><Link className="fp-audit-open-link" to={m.route}>Open <ArrowRight size={12}/></Link></div></article>})}</div></section>
 <section className="foundation-card fp-audit-path"><div className="fp-card-title"><Target size={17}/><h2>ACTION CHECKLIST</h2><span>Saved recommendations · reassessment confirms changes.</span></div>{recommendations.length?<div className="fp-audit-path-list">{recommendations.slice(0,6).map((item,index)=>{const title=typeof item==="string"?item:item.title||item.label||item.recommendation||"Saved recommendation";const detail=typeof item==="string"?"":item.description||item.detail||item.text||"";return <article key={item.id||item.recommendation_id||index}><span className="fp-audit-empty-check" aria-hidden="true"/><b>{title}</b><small>{detail||"Saved recommendation from this assessment. Reassess to confirm any score change."}</small></article>})}</div>:<p className="fp-audit-neutral">No saved action recommendations are available. No checklist progress is recorded here.</p>}<div className="fp-audit-reassessment"><span>Checklist items do not change an assessment score by themselves.</span><Link to="/brand-audit?classic=1">Review audit answers <ArrowRight size={13}/></Link></div></section>
 </div><aside className="fp-audit-right-column">
 <section className="foundation-card fp-audit-ask"><div className="fp-card-title"><Sparkles size={19}/><div><h2>ASK THE HOUSE</h2><p>Existing AI guide</p></div><button type="button" className="fp-audit-help" onClick={()=>open("brand_foundation")} title="Open existing guide">?</button></div><div className="fp-audit-ai-message"><Target size={19}/><p>{summary||"No audit interpretation is saved. Ask the existing guide to review saved context."}</p></div>{findings[0]&&<div className="fp-audit-next-move"><span>NEXT SAVED RECOMMENDATION</span><b>{findings[0].title||findings[0].label||"Saved recommendation"}</b></div>}<div className="fp-audit-ai-modes">{[[Sparkles,"Guide me"],[FileText,"Draft from my answers"],[MessageSquareText,"Refine this"],[Target,"Check alignment"]].map(([Icon,label])=><button key={label} type="button" onClick={()=>open("brand_foundation")}><Icon size={13}/>{label}</button>)}</div><label className="fp-audit-question"><span>Question for Ask the House</span><textarea disabled rows={2} placeholder="Open Ask the House to enter a question." aria-label="Question for Ask the House"/></label><p className="fp-audit-guide-note">This page cannot forward typed prompts. Guide actions open the existing House guide; no assessment is generated here.</p><div className="fp-audit-readiness"><span>Foundation readiness contribution</span><b>{section?section.score+"%":readinessLoading?"Loading":"Unavailable"}</b><small>{readinessError||"Readiness only; this is not the saved audit assessment score."}</small></div><button className="foundation-button foundation-button-primary" type="button" onClick={()=>open("brand_foundation")}>Open Ask the House <ArrowRight size={14}/></button></section>
 <section className="foundation-card fp-audit-inputs"><div className="fp-card-title"><FileText size={17}/><h2>{tab==="history"?"AUDIT HISTORY":"YOUR AUDIT INPUTS"}</h2></div>{tab==="history"?<div className="fp-audit-history"><div><span>Latest saved audit</span><b>{date?String(date):"Date unavailable"}</b></div><div><span>Overall saved audit score</span><b>{hasAudit&&overall!==""?overall+" / 100":"Unavailable"}</b></div><div><span>Previous score</span><b>{VALUE(audit,"previous_score","previousScore","last_score","previous_overall_score")!==""?VALUE(audit,"previous_score","previousScore","last_score","previous_overall_score")+" / 100":"Not included in latest response"}</b></div><p>History beyond the latest saved record is unavailable from this endpoint.</p></div>:<div className="fp-audit-input-list">{(groups.find(g=>g.id===tab)?[groups.find(g=>g.id===tab)]:groups).map(g=><section className={tab===g.id?"is-selected":""} key={g.id}><button type="button" onClick={()=>setTab(g.id)}><span>{g.label}</span><ArrowRight size={13}/></button>{g.fields.map(([id,label])=>{const value=answer(id);return value?<div className="fp-audit-answer" key={id}><b>{label}</b><span>{value}</span></div>:null})}{!g.fields.some(([id])=>answer(id))&&<small>No saved answers in this category.</small>}</section>)}</div>}<Link className="fp-audit-review-link" to="/brand-audit?classic=1">Review audit answers <ArrowRight size={13}/></Link></section>

 </aside></div></>}</FoundationSectionLayout>;
}

export function AudiencePage() {
  const { classic } = usePageState("/audience");
  if (classic) return <Classic><LegacyAudience /></Classic>;
  return <FoundationPageShell><AudienceView /></FoundationPageShell>;
}

const AUDIENCE_FIELDS = [
  ["description", "Problem awareness", "What is happening in their words?"],
  ["core_fear", "Core fear", "The concern underneath the immediate problem."],
  ["core_desire", "Core desire", "What they most want to be true."],
  ["primary_problem", "Immediate problem", "The problem they are actively trying to solve."],
  ["emotional_trigger", "Emotional trigger", "What makes the problem feel urgent."],
  ["surface_symptoms", "Surface symptoms", "Visible signs they experience."],
  ["where_they_are", "Where they are", "Places, channels, or contexts already saved."],
  ["objections", "Objections", "Questions or concerns already recorded."],
  ["transformation_desired", "Desired transformation", "The outcome they want."],
];
const AUDIENCE_INSIGHTS = [
  ["description", "Problem awareness", "The problem in the audience’s own words."],
  ["core_fear", "Core fear", "The concern beneath the immediate problem."],
  ["core_desire", "Core desire", "The change they want to experience."],
  ["primary_problem", "Immediate problem", "The active problem they are trying to solve."],
  ["failed_alternatives", "Failed alternatives", "Saved alternatives they have already tried."],
  ["emotional_trigger", "Emotional trigger", "What makes this problem feel urgent."],
  ["objections", "Objections", "Questions or concerns already recorded."],
  ["transformation_desired", "Desired transformation", "The outcome they want."],
];
const lines = (value) => Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
const listValue = (value) => Array.isArray(value) ? value : typeof value === "string" ? value.split(/\n|;/).map((part) => part.trim()).filter(Boolean) : [];

function AudienceView() {
  const { navigate } = usePageState("/audience");
  const { activeWorkspaceId } = useWorkspace();
  const { open } = useAskTheHouse();
  const { readiness, loading: readinessLoading, readinessError, reloadReadiness } = useFoundationData();
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const r = await apiClient.get(API_PATHS.audience.avatars); setAvatars(Array.isArray(r?.avatars) ? r.avatars : []); } catch (e) { setError(e?.message || "Audience data could not be loaded."); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const avatar = useMemo(() => avatars.find((item) => item.is_primary) || [...avatars].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))[0] || null, [avatars]);
  const audienceSection = readiness?.sections?.find((item) => item.id === "audience");
  const beginEdit = () => { if (avatar) { setDraft({ ...avatar, surface_symptoms: listValue(avatar.surface_symptoms), where_they_are: listValue(avatar.where_they_are), objections: listValue(avatar.objections) }); setEditing(true); setSaveError(""); } else navigate("/audience?classic=1"); };
  const save = async () => {
    if (!avatar?.id || !draft) return;
    setSaving(true); setSaveError("");
    const payload = { name: draft.name || "", stage: draft.stage || "", description: draft.description || "", core_fear: draft.core_fear || "", core_desire: draft.core_desire || "", primary_problem: draft.primary_problem || "", emotional_trigger: draft.emotional_trigger || "", surface_symptoms: listValue(draft.surface_symptoms), where_they_are: listValue(draft.where_they_are), objections: listValue(draft.objections), transformation_desired: draft.transformation_desired || "" };
    try { await apiClient.patch(API_PATHS.audience.avatarById(avatar.id), payload); setEditing(false); setDraft(null); await load(); await reloadReadiness(); return true; }
    catch (e) { setSaveError(e?.message || "Audience changes could not be saved."); return false; }
    finally { setSaving(false); }
  };
  return <FoundationSectionLayout title="Audience Truth" subtitle="Understand the people your brand is here to serve." activeSection="audience" onSaveDraft={editing ? save : undefined} onSaveContinue={editing ? async () => { if(await save()) navigate("/brand-positioning"); } : undefined} saving={saving} hideRail>
    <PageState loading={loading} error={error} onRetry={load} />
    {!loading && !error && <>
      <section className="foundation-card fp-audience-hero"><div className="fp-audience-lead"><div className="fp-audience-symbol"><UsersRound size={30} /></div><div><span className="fp-eyebrow">PRIMARY AUDIENCE</span><strong>{avatar?.is_primary ? "Primary profile" : "Saved profile"}</strong></div></div><div className="fp-audience-hero-field"><label htmlFor="audience-name">Audience name</label>{editing?<input id="audience-name" value={draft.name||""} onChange={e=>setDraft({...draft,name:e.target.value})}/>:<strong>{avatar?.name||"No audience name saved"}</strong>}</div><div className="fp-audience-hero-field"><label htmlFor="audience-stage">Audience stage</label>{editing?<><input id="audience-stage" value={draft.stage||""} onChange={e=>setDraft({...draft,stage:e.target.value})}/><small>Saved audience-stage value; this does not represent business stage.</small></>:<><strong>{avatar?.stage||"No audience stage saved"}</strong><small>Saved audience-stage value; this does not represent business stage.</small></>}</div><button type="button" className="foundation-button foundation-button-tertiary" onClick={editing ? () => setEditing(false) : beginEdit}>{editing ? "Cancel edit" : avatar ? "Edit Audience" : "Create Audience"}</button></section>
      {!avatar && <section className="foundation-card fp-empty-state"><p>No audience avatar has been saved in this workspace.</p><ClassicLink to="/audience">Open audience manager</ClassicLink></section>}
      {avatar && !editing && <div className="fp-audience-grid">{AUDIENCE_INSIGHTS.map(([key,label,hint],index)=>{const value=avatar[key];return <article className="foundation-card fp-audience-item" key={key}><span className={"fp-audience-icon fp-tone-"+(index%6)} aria-hidden="true">{[<ImageIcon size={22}/>,<ShieldCheck size={22}/>,<Check size={22}/>,<AlertTriangle size={22}/>,<MessageSquareText size={22}/>,<Sparkles size={22}/>,<LockKeyhole size={22}/>,<Target size={22}/>][index]}</span><div className="fp-audience-insight-content"><strong>{label}</strong><p>{Array.isArray(value)?value.join(", "):value||"No saved response"}</p><small>{hint}</small><button className="fp-audience-help" type="button" onClick={()=>open("audience")}><Sparkles size={11}/> Help me answer</button></div></article>})}</div>}
      {avatar && editing && <div className="fp-audience-grid fp-edit-grid">
        {AUDIENCE_FIELDS.map(([key, label, hint]) => <div className="foundation-card" key={key}><FieldCard id={`audience-${key}`} label={label} hint={hint} rows={2} value={Array.isArray(draft[key]) ? draft[key] : draft[key] || ""} onChange={(v) => setDraft({ ...draft, [key]: ["surface_symptoms", "where_they_are", "objections"].includes(key) ? v.split("\n").map((x) => x.trim()).filter(Boolean) : v })} /></div>)}
        {saveError && <p role="alert" className="foundation-error fp-wide">{saveError}</p>}
        <div className="fp-wide fp-edit-actions"><button className="foundation-button foundation-button-primary" type="button" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Audience"}</button><ClassicLink to="/audience">Manage all audience profiles</ClassicLink></div>
      </div>}
      <div className="fp-audience-bottom"><section className="foundation-card fp-audience-notes"><div className="fp-card-title"><UsersRound size={18}/><h2>CHANNELS &amp; NOTES</h2></div><h3>Preferred channels</h3><div className="fp-audience-channel-list">{avatar?.preferred_channels?.length?avatar.preferred_channels.map((channel,index)=><span key={index}>{channel}</span>):<p>No preferred channels are saved.</p>}</div><h3>Audience notes</h3><p>{avatar?.notes||"No audience notes are saved."}</p><details><summary>Other saved context</summary><p><b>Surface symptoms</b> {listValue(avatar?.surface_symptoms).join(", ")||"No saved symptoms."}</p><p><b>Where they are</b> {listValue(avatar?.where_they_are).join(", ")||"No saved channel context."}</p></details><ClassicLink to="/audience">Manage all audience profiles</ClassicLink></section><section className="foundation-card fp-audience-ask"><div className="fp-audience-ai-heading"><span><Sparkles size={19}/></span><div><h2>ASK THE HOUSE</h2><p>AI brand guide</p></div></div><div className="fp-audience-ai-actions"><button type="button" onClick={()=>open("audience")}><Sparkles size={15}/>Guide me</button><button type="button" onClick={()=>open("audience")}><FileText size={15}/>Explore saved answers</button><button type="button" onClick={()=>open("audience")}><MessageSquareText size={15}/>Refine this audience</button><button type="button" onClick={()=>open("audience")}><Target size={15}/>Check alignment</button></div><p>Ask about the saved audience profile. Responses continue in the existing House guide.</p><label className="fp-audience-question-label">Question input is handled in the existing guide<textarea disabled rows={3} placeholder="Open Ask the House to enter a question." aria-label="Audience Ask the House input"/></label><button className="foundation-button foundation-button-primary" type="button" onClick={()=>open("audience")}>Open Ask the House <ArrowRight size={15}/></button></section><section className="foundation-card fp-audience-progress"><div className="fp-audience-progress-head"><div className="fp-audience-donut" style={{"--audience-score":(audienceSection?.score||0)+"%"}}><span>{audienceSection?audienceSection.score+"%":"—"}</span></div><div><span className="fp-eyebrow">AUDIENCE READINESS</span><strong>{audienceSection?"This section":"Status unavailable"}</strong></div></div><p>{audienceSection?.missing_items?.length?audienceSection.missing_items.join(", "):readinessError|| (audienceSection?"Required saved fields are complete.":"Readiness could not be loaded.")}</p><div className="fp-audience-progress-path"><h3>YOUR PATH</h3><span>Positioning <b>{readiness?.sections?.find(item=>item.id==="positioning")?.score??"—"}{readiness?"%":""}</b></span><span>Messaging <b>{readiness?.sections?.find(item=>item.id==="messaging")?.score??"—"}{readiness?"%":""}</b></span></div>{readinessError && <button type="button" className="foundation-button foundation-button-secondary" onClick={reloadReadiness}>Retry readiness</button>}</section></div>
      <div className="fp-page-actions"><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>navigate("/brand-foundation")}>Back</button><span/><button className="foundation-button foundation-button-secondary" type="button" onClick={save} disabled={!editing||saving}>{saving?"Saving.":"Save Draft"}</button><button className="foundation-button foundation-button-primary" type="button" onClick={async()=>{if(editing&&await save())navigate("/brand-positioning");else if(!editing)beginEdit()}} disabled={saving}>{editing?"Save and Continue":"Edit Audience"} <ArrowRight size={15}/></button></div>
    </>}
  </FoundationSectionLayout>;
}

const POSITION_FIELDS = [
  { id: "category", label: "Market category", hint: "The broad market your brand competes in.", keys: ["category"], writable: true },
  { id: "audienceSpecificity", label: "Target audience", hint: "The specific people you are here to serve.", keys: ["audience_specificity", "audienceSpecificity"], writable: true },
  { id: "problemOwned", label: "Problem owned", hint: "A saved positioning field, if present.", keys: ["problem_owned", "problemOwned"] },
  { id: "currentAlternative", label: "Current alternative", hint: "A saved positioning field, if present.", keys: ["current_alternative", "currentAlternative"] },
  { id: "uniqueMechanism", label: "Unique mechanism", hint: "A saved positioning field, if present.", keys: ["unique_mechanism", "uniqueMechanism"] },
  { id: "differentiator", label: "Differentiator", hint: "What makes the brand meaningfully different.", keys: ["differentiator"], writable: true },
  { id: "competitorWhiteSpace", label: "Competitor white space", hint: "A saved positioning field, if present.", keys: ["competitor_white_space", "competitorWhiteSpace"] },
  { id: "positioningStatement", label: "Positioning statement", hint: "A saved positioning field, if present.", keys: ["positioning_statement", "positioningStatement"] },
];

export function PositioningPage() {
  const { classic } = usePageState("/brand-positioning");
  if (classic) return <Classic><LegacyPositioning /></Classic>;
  return <FoundationPageShell><PositioningView /></FoundationPageShell>;
}

function PositioningView() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { open } = useAskTheHouse();
  const { readiness, loading: readinessLoading, readinessError, reloadReadiness } = useFoundationData();
  const [raw, setRaw] = useState({});
  const [draft, setDraft] = useState({ category: "", audienceSpecificity: "", differentiator: "" });
  const [audienceProfile, setAudienceProfile] = useState(null), [aiField, setAiField] = useState("audienceSpecificity"), [aiDraft, setAiDraft] = useState(null), [aiBusy, setAiBusy] = useState(false), [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState(""), [saved, setSaved] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const r = await apiClient.get("/api/persist/brand-positioning"); const doc = r?.positioning || r || {}; setRaw(doc); setDraft({ category: VALUE(doc, "category"), audienceSpecificity: VALUE(doc, "audience_specificity", "audienceSpecificity"), differentiator: VALUE(doc, "differentiator") }); try { const audience = await apiClient.get(API_PATHS.audience.avatars); const rows = Array.isArray(audience?.avatars) ? audience.avatars : []; setAudienceProfile(rows.find(item=>item.is_primary)||rows[0]||null); } catch { setAudienceProfile(null); } } catch (e) { setError(e?.message || "Positioning data could not be loaded."); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (nextDraft=draft) => { setSaving(true); setSaveError(""); setSaved(false); try { const payload = { ...raw, category: nextDraft.category, audience_specificity: nextDraft.audienceSpecificity, differentiator: nextDraft.differentiator }; await apiClient.post("/api/persist/brand-positioning", payload); setRaw(payload); setDraft(nextDraft); setSaved(true); await reloadReadiness(); return true; } catch (e) { setSaveError(e?.message || "Positioning could not be saved."); return false; } finally { setSaving(false); } };
  const requestPositionDraft = async () => { setAiBusy(true); setAiError(""); setAiDraft(null); try { const response=await apiClient.post("/api/persist/brand-positioning/ai-assist",{field_id:aiField,current_value:draft[aiField]||"",workspace_id:activeWorkspaceId||""}); const suggestion=typeof response?.suggestion==="string"?response.suggestion.trim():""; if(!suggestion)throw new Error("No AI draft was returned."); setAiDraft({field:aiField,text:suggestion}); } catch(e) { setAiError(e?.message||"The positioning draft could not be created."); } finally { setAiBusy(false); } };
  const applyPositionDraft=async()=>{if(!aiDraft)return;const next={...draft,[aiDraft.field]:aiDraft.text};if(await save(next))setAiDraft(null);};
  const positionAiPanel=<section className="foundation-card fp-design-ai fp-detailed-ai"><div className="fp-detailed-ai-heading"><span><Sparkles size={19}/></span><div><h2>ASK THE HOUSE</h2><p>AI brand guide · Positioning</p></div></div><div className="fp-detailed-ai-modes"><button type="button" onClick={()=>open("positioning")}><Sparkles size={14}/>Guide me</button><button type="button" onClick={requestPositionDraft} disabled={aiBusy}><FileText size={14}/>{aiBusy?"Drafting…":"Draft from my answers"}</button><button type="button" onClick={requestPositionDraft} disabled={aiBusy}><Sparkles size={14}/>Refine this</button><button type="button" onClick={()=>open("positioning")}><Target size={14}/>Check alignment</button></div><div className="fp-position-comparison"><h3>Audience comparison</h3><div><span>Audience Truth</span><b>{audienceProfile?.name||"No saved audience profile"}</b></div><div><span>Positioning target</span><b>{draft.audienceSpecificity||"No positioning target saved"}</b></div><p>Compare the saved values side by side. The current record does not provide an alignment verdict.</p></div><label className="fp-ai-field-select">Choose a field to draft<select aria-label="AI field to draft" value={aiField} onChange={e=>setAiField(e.target.value)}>{POSITION_FIELDS.filter(field=>field.writable).map(field=><option key={field.id} value={field.id}>{field.label}</option>)}</select></label><label className="fp-ai-current-value">Current saved field content<textarea rows={2} value={draft[aiField]||""} onChange={e=>setDraft(previous=>({...previous,[aiField]:e.target.value}))} aria-label="Current positioning field content"/></label>{aiError&&<p role="alert" className="fp-ai-error">{aiError}</p>}{aiDraft?<div className="fp-ai-draft"><span>AI DRAFT · NOT APPLIED</span><h3>{POSITION_FIELDS.find(field=>field.id===aiDraft.field)?.label}</h3><p>{aiDraft.text}</p><div><button type="button" className="foundation-button foundation-button-primary" onClick={applyPositionDraft} disabled={saving}>Apply to {POSITION_FIELDS.find(field=>field.id===aiDraft.field)?.label}</button><button type="button" className="foundation-button foundation-button-secondary" onClick={requestPositionDraft} disabled={aiBusy}>Request changes</button></div></div>:<p className="fp-ai-rail-note">Drafts stay here until you apply them. Applying saves through the existing positioning endpoint.</p>}<div className="fp-ai-readiness-checklist"><h3>READINESS CHECKLIST</h3>{readiness?.sections?.find(item=>item.id==="positioning")?.missing_items?.length?readiness.sections.find(item=>item.id==="positioning").missing_items.map((item,index)=><div key={index}><span aria-hidden="true"/><span>{item}</span></div>):readiness?<p>Required saved Positioning fields are complete.</p>:<p>{readinessError||"Saved readiness is unavailable."}</p>}</div></section>;
  const rail = <SectionDesignRail sectionId="positioning" readiness={readiness} loading={readinessLoading} error={readinessError} retry={reloadReadiness} aiPanel={positionAiPanel} />;
  return <FoundationSectionLayout title="Positioning" subtitle="Define the place your brand earns in the market." activeSection="positioning" onSaveDraft={()=>save()} onSaveContinue={async () => { if(await save()) navigate("/messaging-structure"); }} saving={saving} rail={rail} footer={!loading && !error && (<div className="fp-page-actions"><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>navigate("/audience")}>Back</button><span/><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>save()} disabled={saving}>Save Draft</button><button className="foundation-button foundation-button-primary" type="button" onClick={async()=>{if(await save())navigate("/messaging-structure")}} disabled={saving}>Save and Continue <ArrowRight size={15}/></button></div>)}>
    <PageState loading={loading} error={error} onRetry={load} />
    {!loading && !error && <>
      <div className="fp-position-grid">{POSITION_FIELDS.map((field, index) => { const value = field.writable ? draft[field.id] : VALUE(raw, ...field.keys); const isWide = field.id === "competitorWhiteSpace" || field.id === "positioningStatement"; return <div className={`fp-position-entry${isWide ? " fp-position-wide" : ""}`} key={field.id}><span className={`fp-position-icon fp-tone-${index % 6}`} aria-hidden="true">{React.createElement([Target,UsersRound,Flag,FileText,Settings,Star,Lightbulb,FileText][index],{size:24,strokeWidth:1.8})}</span><FieldCard id={`position-${field.id}`} label={field.label} hint={field.hint} value={value} rows={2} wide={isWide} disabled={!field.writable} unavailable={!field.writable && !value ? "Not available in the current saved-positioning record; no separate editable field is provided." : undefined} onChange={(v) => field.writable && setDraft(previous => ({ ...previous, [field.id]: v }))} /></div>; })}</div>
      <section className="fp-section-status-strip"><div><span>POSITIONING READINESS</span><b>{readiness?.sections?.find(item=>item.id==="positioning")?.score??"Unavailable"}{readiness?"%":""}</b></div><div><span>FOUNDATION READINESS</span><b>{readiness?.overall??"Unavailable"}{readiness?"%":""}</b></div><small>{readinessError||"Calculated from saved workspace fields. Unknown saved fields are preserved."}</small></section><details className="fp-data-note"><summary>About saved positioning fields</summary><p>Only fields supported by the saved positioning record can be edited here. Other dimensions remain visible when saved.</p></details>
      {saveError && <p role="alert" className="foundation-error">{saveError}</p>}{saved && <p role="status" className="fp-success"><Check size={15} /> Positioning saved.</p>}

      <div className="fp-footer-tools"><ClassicLink to="/brand-positioning">Open the full Positioning editor</ClassicLink></div>
    </>}
  </FoundationSectionLayout>;
}

const MESSAGE_FIELDS = [
  ["brand_promise", "Brand promise", "The transformation your brand promises."],
  ["one_liner", "One-liner", "A clear one-sentence explanation."],
  ["elevator_pitch", "Elevator pitch", "What you say when someone asks what you do."],
  ["core_message", "Core message", "The idea your brand returns to."],
  ["tagline", "Tagline", "Saved in the existing Foundation record."],
  ["proof_points", "Proof points", "Evidence supporting your claims."],
];

export function MessagingPage() {
  const { classic } = usePageState("/messaging-structure");
  if (classic) return <Classic><LegacyMessaging /></Classic>;
  return <FoundationPageShell><MessagingView /></FoundationPageShell>;
}

function MessagingView() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { open } = useAskTheHouse();
  const { readiness, loading: readinessLoading, readinessError, reloadReadiness } = useFoundationData();
  const [messagingRaw, setMessagingRaw] = useState({}), [foundationRaw, setFoundationRaw] = useState({});
  const [draft, setDraft] = useState({ brand_promise: "", one_liner: "", elevator_pitch: "", core_message: "", tagline: "", proof_points: "", calls_to_action: "" });
  const [aiField, setAiField] = useState("brandPromise"), [aiDraft, setAiDraft] = useState(null), [aiBusy, setAiBusy] = useState(false), [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState(""), [saved, setSaved] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [m, f] = await Promise.all([apiClient.get("/api/persist/messaging-structure"), apiClient.get("/api/persist/brand-foundation")]); const md = m?.messaging_structure || m || {}, fd = f?.foundation || f || {}; setMessagingRaw(md); setFoundationRaw(fd); setDraft({ brand_promise: VALUE(md, "brand_promise", "brandPromise"), one_liner: VALUE(md, "one_liner", "oneLiner"), elevator_pitch: VALUE(md, "elevator_pitch", "elevatorPitch"), core_message: VALUE(md, "core_message", "coreMessage"), tagline: VALUE(fd, "tagline"), proof_points: VALUE(md, "proof_points", "proofPoints"), calls_to_action: VALUE(md, "calls_to_action", "callsToAction") }); } catch (e) { setError(e?.message || "Messaging data could not be loaded."); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (nextDraft=draft) => { setSaving(true); setSaveError(""); setSaved(false); try { const payload = { ...messagingRaw, brand_promise: nextDraft.brand_promise, one_liner: nextDraft.one_liner, elevator_pitch: nextDraft.elevator_pitch, core_message: nextDraft.core_message, proof_points: nextDraft.proof_points, calls_to_action: nextDraft.calls_to_action }; await apiClient.post("/api/persist/messaging-structure", payload); if (nextDraft.tagline !== VALUE(foundationRaw, "tagline")) { const next = { ...foundationRaw, tagline: nextDraft.tagline }; await apiClient.post("/api/persist/brand-foundation", next); setFoundationRaw(next); } setMessagingRaw(payload); setDraft(nextDraft); setSaved(true); await reloadReadiness(); return true; } catch (e) { setSaveError(e?.message || "Messaging could not be saved."); return false; } finally { setSaving(false); } };
  const MESSAGE_AI_FIELDS=[["brandPromise","brand_promise","Brand promise"],["oneLiner","one_liner","One-liner"],["elevatorPitch","elevator_pitch","Elevator pitch"],["coreMessage","core_message","Core message"],["proofPoints","proof_points","Proof points"],["callsToAction","calls_to_action","Combined CTA"]];
  const activeAiField=MESSAGE_AI_FIELDS.find(([id])=>id===aiField);
  const requestMessageDraft=async()=>{setAiBusy(true);setAiError("");setAiDraft(null);try{const response=await apiClient.post("/api/persist/messaging-structure/ai-assist",{field_id:aiField,current_value:draft[activeAiField?.[1]]||"",workspace_id:activeWorkspaceId||""});const suggestion=typeof response?.suggestion==="string"?response.suggestion.trim():"";if(!suggestion)throw new Error("No AI draft was returned.");setAiDraft({field:activeAiField[1],label:activeAiField[2],text:suggestion});}catch(e){setAiError(e?.message||"The messaging draft could not be created.");}finally{setAiBusy(false)}};
  const applyMessageDraft=async()=>{if(!aiDraft)return;const next={...draft,[aiDraft.field]:aiDraft.text};if(await save(next))setAiDraft(null);};
  const messageAiPanel=<section className="foundation-card fp-design-ai fp-detailed-ai"><div className="fp-detailed-ai-heading"><span><Sparkles size={19}/></span><div><h2>ASK THE HOUSE</h2><p>AI brand guide · Messaging</p></div><span className="fp-ai-rail-kicker">AI BRAND GUIDE</span></div><div className="fp-detailed-ai-modes"><button type="button" onClick={()=>open("messaging")}><Sparkles size={14}/>Guide me</button><button type="button" onClick={requestMessageDraft} disabled={aiBusy}><FileText size={14}/>{aiBusy?"Drafting…":"Draft from my answers"}</button><button type="button" onClick={requestMessageDraft} disabled={aiBusy}><Sparkles size={14}/>Refine this</button><button type="button" onClick={()=>open("messaging")}><Target size={14}/>Check alignment</button></div><div className="fp-message-evidence-context"><h3>Evidence context</h3><p>{draft.proof_points?draft.proof_points.split(/\r?\n/).filter(Boolean).length+" saved proof point(s) are available for this section.":"No saved proof points are available yet."}</p><p>Use the Proof Points card to edit saved evidence. Attachments are not supported by this workflow.</p></div><label className="fp-ai-field-select">Choose a field to draft<select aria-label="AI field to draft" value={aiField} onChange={e=>setAiField(e.target.value)}>{MESSAGE_AI_FIELDS.map(([id,,label])=><option key={id} value={id}>{label}</option>)}</select></label><label className="fp-ai-current-value">Current saved field content<textarea rows={2} value={draft[activeAiField?.[1]]||""} onChange={e=>setDraft(previous=>({...previous,[activeAiField[1]]:e.target.value}))} aria-label="Current messaging field content"/></label>{aiError&&<p role="alert" className="fp-ai-error">{aiError}</p>}{aiDraft?<div className="fp-ai-draft"><span>AI DRAFT · NOT APPLIED</span><h3>{aiDraft.label}</h3><p>{aiDraft.text}</p><div><button type="button" className="foundation-button foundation-button-primary" onClick={applyMessageDraft} disabled={saving}>Apply draft</button><button type="button" className="foundation-button foundation-button-secondary" onClick={requestMessageDraft} disabled={aiBusy}>Request changes</button></div><small>A draft alone does not complete an evidence check.</small></div>:<p className="fp-ai-rail-note">AI drafts use the existing Messaging assist endpoint and stay here until you apply them.</p>}<div className="fp-ai-readiness-checklist"><h3>READINESS CHECKLIST</h3>{readiness?.sections?.find(item=>item.id==="messaging")?.missing_items?.length?readiness.sections.find(item=>item.id==="messaging").missing_items.map((item,index)=><div key={index}><span aria-hidden="true"/><span>{item}</span></div>):readiness?<p>Required saved Messaging fields are complete.</p>:<p>{readinessError||"Saved readiness is unavailable."}</p>}</div></section>;
  const rail = <SectionDesignRail sectionId="messaging" readiness={readiness} loading={readinessLoading} error={readinessError} retry={reloadReadiness} aiPanel={messageAiPanel} pathIds={["expression","review_lock"]} />;
  const proofRows = draft.proof_points ? draft.proof_points.split(/\r?\n/) : [""];
  return <FoundationSectionLayout title="Messaging" subtitle="Give your brand a clear message people can act on." activeSection="messaging" onSaveDraft={()=>save()} onSaveContinue={async () => { if(await save()) navigate("/identity-studio"); }} saving={saving} rail={rail} footer={!loading && !error && (<div className="fp-page-actions"><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>navigate("/brand-positioning")}>Back</button><span/><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>save()} disabled={saving}>Save Draft</button><button className="foundation-button foundation-button-primary" type="button" onClick={async()=>{if(await save())navigate("/identity-studio")}} disabled={saving}>Save and Continue <ArrowRight size={15}/></button></div>)}>
    <PageState loading={loading} error={error} onRetry={load} />
    {!loading && !error && <>
      <div className="fp-message-grid">{MESSAGE_FIELDS.map(([id, label, hint], index) => id === "proof_points" ? <section className="foundation-card fp-proof-card" key={id}><div className="fp-field-heading"><div><h2>{label}</h2><p>{hint}</p></div><span className={`fp-position-icon fp-tone-${index}`} aria-hidden="true"><ShieldCheck size={22}/></span></div>{proofRows.map((value, row) => <div className="fp-proof-row" key={row}><span>{row+1}</span><input aria-label={`Proof point ${row+1}`} value={value} onChange={(e)=>setDraft({...draft,proof_points:proofRows.map((item,i)=>i===row?e.target.value:item).join("\n")})}/><small className="fp-proof-evidence" title="Evidence attachment state is unavailable in the current messaging workflow.">Unavailable</small><button className="fp-proof-remove" type="button" aria-label={`Remove row ${row+1}`} onClick={()=>setDraft({...draft,proof_points:proofRows.filter((_,i)=>i!==row).join("\n")})} disabled={proofRows.length<=1}>Remove</button></div>)}<div className="fp-proof-actions"><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>setDraft({...draft,proof_points:[...proofRows,""] .join("\n")})}>Add proof point</button><button className="foundation-button foundation-button-secondary" type="button" disabled title="Evidence attachments are not available in the current messaging workflow.">Attach evidence</button></div></section> : <div className="fp-message-entry" key={id}><span className={`fp-position-icon fp-tone-${index}`} aria-hidden="true">{React.createElement([MessageSquareText,FileText,MessageSquareText,MessageSquareText,Star][index],{size:24,strokeWidth:1.8})}</span><FieldCard id={`message-${id}`} label={label} hint={hint} value={draft[id]} rows={id === "elevator_pitch" || id === "core_message" ? 3 : 2} onChange={(value) => setDraft({ ...draft, [id]: value })} /></div>)}
        <div className="fp-message-entry"><span className="fp-position-icon fp-tone-1" aria-hidden="true"><Target size={24}/></span><FieldCard id="message-calls_to_action" label="Primary CTA / combined CTA copy" hint="The current API stores primary and secondary CTA copy together in this field." value={draft.calls_to_action} rows={2} onChange={(value) => setDraft({ ...draft, calls_to_action: value })} /></div>
        <div className="fp-message-entry fp-message-unavailable"><span className="fp-position-icon fp-tone-4" aria-hidden="true"><ArrowRight size={24}/></span><FieldCard id="message-secondary-cta" label="Secondary CTA" hint="Kept visible in the layout, but not separately editable." value="" disabled unavailable="The saved record has one combined calls_to_action field. It is preserved intact; the API does not expose a separate secondary CTA." /></div>
      </div>
      <section className="fp-section-status-strip"><div><span>MESSAGING READINESS</span><b>{readiness?.sections?.find(item=>item.id==="messaging")?.score??"Unavailable"}{readiness?"%":""}</b></div><div><span>FOUNDATION READINESS</span><b>{readiness?.overall??"Unavailable"}{readiness?"%":""}</b></div><small>{readinessError||"Calculated from saved workspace fields. Evidence attachment state remains unavailable."}</small></section><details className="fp-data-note"><summary>About saved messaging fields</summary><p>Primary and secondary CTA copy remains together in the saved field. Evidence attachments are unavailable in this release.</p></details>
      {saveError && <p role="alert" className="foundation-error">{saveError}</p>}{saved && <p role="status" className="fp-success"><Check size={15} /> Messaging saved.</p>}

      <div className="fp-footer-tools"><ClassicLink to="/messaging-structure">Open the full Messaging editor</ClassicLink></div>
    </>}
  </FoundationSectionLayout>;
}

export function ExpressionPage() {
  const { classic } = usePageState("/identity-studio");
  if (classic) return <Classic><LegacyIdentity /></Classic>;
  return <FoundationPageShell><ExpressionView /></FoundationPageShell>;
}

function ExpressionView() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { open } = useAskTheHouse();
  const { userId } = useAuth();
  const { readiness, loading: readinessLoading, readinessError, reloadReadiness } = useFoundationData();
  const [identity, setIdentity] = useState({}), [foundationRaw, setFoundationRaw] = useState({}), [assets, setAssets] = useState([]);
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState(""), [saved, setSaved] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [i, f, a] = await Promise.all([apiClient.get("/api/identity", { params: userId ? { user_id: userId } : {} }), apiClient.get("/api/persist/brand-foundation"), activeWorkspaceId ? apiClient.get("/api/media-upload/assets", { params: { category: "brand_asset", workspace_id: activeWorkspaceId } }) : Promise.resolve({ assets: [] })]); const fd = f?.foundation || f || {}; setIdentity(i || {}); setFoundationRaw(fd); setTone(VALUE(fd, "tone_of_voice", "toneOfVoice")); setAssets(Array.isArray(a?.assets) ? a.assets.filter((item) => item.status === "confirmed" && item.context === "brand_asset") : []); } catch (e) { setError(e?.message || "Brand expression data could not be loaded."); } finally { setLoading(false); } }, [activeWorkspaceId, userId]);
  useEffect(() => { load(); }, [load]);
  const save = async () => { setSaving(true); setSaveError(""); setSaved(false); try { if (identity.colors || identity.fonts) await apiClient.post("/api/identity/save", { ...identity, workspace_id: activeWorkspaceId || "", colors: identity.colors || [], fonts: identity.fonts || [] }); if (tone !== VALUE(foundationRaw, "tone_of_voice", "toneOfVoice")) { const next = { ...foundationRaw, tone_of_voice: tone }; await apiClient.post("/api/persist/brand-foundation", next); setFoundationRaw(next); } setSaved(true); await reloadReadiness(); return true; } catch (e) { setSaveError(e?.message || "Brand expression could not be saved."); return false; } finally { setSaving(false); } };
  const colors = Array.isArray(identity.colors) ? identity.colors : [];
  const fonts = Array.isArray(identity.fonts) ? identity.fonts : [];
  const headingFont = fonts.find((font) => /heading|display/i.test(`${font.role || ""} ${font.label || ""}`)) || fonts[0];
  const bodyFont = fonts.find((font) => /body/i.test(`${font.role || ""} ${font.label || ""}`)) || fonts[1];
  const voiceTraits = Array.isArray(identity.voice_traits) ? identity.voice_traits : [];
  const situationRows = Array.isArray(identity.tone_by_situation) ? identity.tone_by_situation : [];
  const photoStyles = Array.isArray(identity.photography_style) ? identity.photography_style : [];
  const expressionSection = readiness?.sections?.find(item => item.id === "expression");
  const expressionAi = <section className="foundation-card fp-expression-ai"><div className="fp-card-title"><Sparkles size={20}/><div><h2>ASK THE HOUSE</h2><p>Existing AI guide · Brand Expression</p></div><button type="button" className="fp-expression-help" onClick={()=>open("expression")} title="Open existing guide">?</button></div><p>Use the saved voice and visual identity as context in the existing guide.</p><div className="fp-expression-ai-modes">{[[Sparkles,"Guide me"],[FileText,"Draft from my answers"],[MessageSquareText,"Refine this"],[Target,"Check alignment"]].map(([Icon,label])=><button key={label} type="button" onClick={()=>open("expression")}><Icon size={14}/>{label}</button>)}</div><div className="fp-expression-ai-context"><span>Saved context</span><p>{voiceTraits.length} voice traits · {colors.length} colors · {fonts.length} typefaces · {assets.length} confirmed assets</p></div><div className="fp-expression-ai-empty"><Sparkles size={17}/><p>No expression-specific draft is saved. Opening the guide does not apply a change here.</p></div><div className="fp-expression-completion"><div className="fp-expression-readiness-head"><span>SECTION READINESS</span><b>{expressionSection?expressionSection.score+"%":readinessLoading?"Loading":"Unavailable"}</b></div>{expressionSection?.missing_items?.length?<ul>{expressionSection.missing_items.map((item,index)=><li key={index}><span aria-hidden="true"/>{item}</li>)}</ul>:expressionSection?<p>Required saved Expression fields are complete.</p>:<p>{readinessError||"Saved readiness is unavailable."}</p>}<div className="fp-expression-foundation-status"><span>Foundation readiness</span><b>{readiness?readiness.overall+"%":"Unavailable"}</b></div></div><button type="button" className="foundation-button foundation-button-primary" onClick={()=>open("expression")}>Open Ask the House <ArrowRight size={14}/></button></section>;
  return <FoundationSectionLayout title="Brand Expression" subtitle="Make your brand recognizable in how it sounds and looks." activeSection="expression" onSaveDraft={save} onSaveContinue={async () => { if(await save()) navigate("/foundation/review-lock"); }} saving={saving} hideRail>
    <PageState loading={loading} error={error} onRetry={load} />
    {!loading && !error && <>
      <div className="fp-expression-grid">
        <section className="foundation-card fp-verbal-card"><div className="fp-card-title"><MessageSquareText size={20} /><h2>VERBAL IDENTITY</h2></div><h3>VOICE TRAITS</h3><div className="fp-expression-chips">{voiceTraits.length ? voiceTraits.map((item,index)=><span key={index}>{typeof item==="string"?item:item.label||item.name||"Saved voice trait"}</span>) : <small>No separate voice-trait values are saved.</small>}</div><div className="fp-expression-subhead"><h3>TONE BY SITUATION</h3><button type="button" onClick={()=>open("expression")}>Help me answer</button></div><div className="fp-expression-rows">{["Educational","Inspirational","Sales","Support"].map((label,index)=>{const savedRow=situationRows[index];return <div key={label}><b>{label}</b><span>{savedRow?.tone||savedRow?.value||"No saved entry"}</span><small>Not separately editable</small></div>})}</div><label className="fp-eyebrow" htmlFor="expression-tone">TONE OF VOICE</label><textarea id="expression-tone" className="fp-tone-input" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="No tone of voice saved." rows={3} /><div className="fp-expression-pair"><section><h3>SENTENCE STYLE</h3><p>{VALUE(identity,"sentence_style","sentenceStyle")||"No separate sentence-style value is saved."}</p></section><section><h3>WORDS WE USE</h3><div className="fp-expression-chips">{listValue(VALUE(identity,"words_we_use","wordsWeUse")).map((word,index)=><span key={index}>{word}</span>)}</div><h3>WORDS TO AVOID</h3><div className="fp-expression-chips fp-avoid-chips">{listValue(VALUE(identity,"words_to_avoid","wordsToAvoid")).map((word,index)=><span key={index}>{word}</span>)}</div></section></div><div className="fp-expression-preview"><h3>VOICE PREVIEW</h3><p>{tone||"A preview is unavailable until tone of voice is saved."}</p></div></section>
        <section className="foundation-card fp-visual-card"><div className="fp-card-title"><Palette size={20} /><h2>VISUAL IDENTITY</h2></div><div className="fp-expression-subhead"><h3>PRIMARY COLORS</h3><button type="button" onClick={()=>open("expression")}>Help me answer</button></div><div className="fp-swatches">{Array.from({length:6},(_,index)=>{const color=colors[index];return <div className={`fp-swatch${color?"":" fp-empty-swatch"}`} key={color?.id||`empty-${index}`}><span style={color?.hex?{backgroundColor:color.hex}:{}}/>{color?<><b>{color.label||color.role||`Saved color ${index+1}`}</b><small>{color.hex||"No color value"}</small></>:<><b>Color slot {index+1}</b><small>No saved color</small></>}</div>})}</div>
          <div className="fp-font-pair"><article><span>HEADING TYPEFACE</span><strong style={{fontFamily:headingFont?.family||headingFont?.font_family||"Cormorant Garamond, Georgia, serif"}}>{headingFont?.family || headingFont?.font_family || "Not saved"}</strong><p>{headingFont?"Current saved heading typeface":"No heading typeface saved."}</p></article><article><span>BODY TYPEFACE</span><strong style={{fontFamily:bodyFont?.family||bodyFont?.font_family||"DM Sans, system-ui, sans-serif"}}>{bodyFont?.family || bodyFont?.font_family || "Not saved"}</strong><p>{bodyFont?"Current saved body typeface":"No body typeface saved."}</p></article></div>
          <div className="fp-assets"><div className="fp-card-title"><ImageIcon size={17} /><h3>LOGO SUITE</h3></div><div className="fp-logo-slots">{Array.from({length:3},(_,index)=>{const asset=assets[index];return <article key={asset?.asset_id||asset?.id||index}>{asset?<span>{asset.name||asset.filename||"Confirmed brand asset"}</span>:<span>No confirmed logo asset in this slot</span>}</article>})}</div><ClassicLink to="/identity-studio">Open full Identity Studio asset tools</ClassicLink></div>
          <div className="fp-expression-subhead"><h3>PHOTOGRAPHY STYLE</h3><button type="button" onClick={()=>open("expression")}>Help me answer</button></div><div className="fp-expression-chips">{photoStyles.length?photoStyles.map((item,index)=><span key={index}>{typeof item==="string"?item:item.label||"Saved style"}</span>):<small>No saved photography-style values.</small>}</div>
        </section>
        {expressionAi}
      </div>
      {saveError && <p role="alert" className="foundation-error">{saveError}</p>}{saved && <p role="status" className="fp-success"><Check size={15} /> Brand expression saved.</p>}
      <div className="fp-page-actions"><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>navigate("/messaging-structure")}>Back</button><span/><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>save()} disabled={saving}>Save Draft</button><button className="foundation-button foundation-button-primary" type="button" onClick={async()=>{if(await save())navigate("/foundation/review-lock")}} disabled={saving}>Save and Continue <ArrowRight size={15}/></button></div>
      <div className="fp-footer-tools"><ClassicLink to="/identity-studio">Open full Identity Studio tools</ClassicLink></div>
    </>}
  </FoundationSectionLayout>;
}

export function ReviewLockPage() {
  const { readiness, readinessError, loading, reloadReadiness } = useFoundationData();
  const navigate = useNavigate();
  const { open } = useAskTheHouse();
  const missing = readiness?.sections?.filter((section) => section.id !== "review_lock" && section.score < 100) || [];
  const trackedSections=STAGES.map(stage=>(readiness?.sections||[]).find(section=>section.id===stage.id)||{id:stage.id,label:stage.title,score:null,missing_items:["Readiness was not returned for this section."]});
  const conflictStatus="Conflict detection is not implemented; no conflicts have been assessed.";
  return <FoundationPageShell><FoundationSectionLayout title="Review and Lock" subtitle="Review your saved Foundation before approval workflows become available." activeSection="review_lock" hideRail>
    {loading && <PageState loading />}
    {readinessError && !loading && <PageState error={readinessError} onRetry={reloadReadiness} />}
    {readiness && <>
      <div className="fp-kpi-grid fp-review-kpis"><article className="foundation-card fp-kpi"><span className="fp-review-readiness-donut" style={{"--review-readiness":readiness.overall+"%"}}><b>{readiness.overall}%</b></span><div><span>FOUNDATION READINESS</span><strong>Current</strong><small>Current completeness score</small></div></article><article className="foundation-card fp-kpi"><span className="fp-metric-icon fp-metric-purple"><FileText size={20}/></span><div><span>VERSION</span><strong>Not tracked</strong><small>Version history is unavailable.</small></div></article><article className="foundation-card fp-kpi"><span className="fp-metric-icon fp-metric-gold"><AlertTriangle size={20}/></span><div><span>LAST APPROVED</span><strong>Unavailable</strong><small>Approval history is not recorded.</small></div></article><article className="foundation-card fp-kpi"><span className="fp-metric-icon fp-metric-green"><ShieldCheck size={20}/></span><div><span>APPROVAL STATUS</span><strong>Unavailable</strong><small>No review status is recorded.</small></div></article></div>
      <div className="fp-review-grid fp-review-three"><section className="foundation-card"><div className="fp-card-title"><FileText size={18} /><h2>FOUNDATION REVIEW</h2></div><ul className="fp-review-list">{trackedSections.map((section,index) => { const stage = STAGES.find((item) => item.id === section.id); const hasScore=section.score!==null&&section.score!==undefined&&section.score!==""&&Number.isFinite(Number(section.score)); const complete=hasScore&&Number(section.score)===100; return <li key={section.id}><span className="fp-review-number">{String(index+1).padStart(2,"0")}</span><span className={"fp-review-status-dot"+(complete?" is-complete":hasScore?" is-in-progress":" is-unavailable")} aria-label={complete?"Complete":hasScore?"In progress":"Status unavailable"}/><Link to={stage?.path || "/foundation"}><span>{section.label}</span><ChevronRight size={13}/></Link><strong className={complete?"fp-review-complete":"fp-review-inprogress"}>{hasScore?section.score+"%":"Unavailable"}</strong><div className="fp-review-row-track">{hasScore&&<span style={{width:Math.max(0,Math.min(100,Number(section.score)))+"%"}}/>}</div><small>{section.missing_items?.length ? section.missing_items.join(", ") : hasScore?"Tracked fields complete":"Readiness was not returned for this section."}</small></li>; })}</ul></section><section className="foundation-card fp-conflicts-unavailable"><div className="fp-card-title"><AlertTriangle size={19}/><h2>CONFLICT REVIEW</h2></div><div className="fp-unavailable-panel"><span aria-hidden="true">!</span><p>{conflictStatus}</p></div></section><section className="foundation-card fp-review-ask"><div className="fp-card-title"><Sparkles size={19}/><h2>ASK THE HOUSE</h2></div><p>Open the existing guide to explore your saved Foundation. No review or resolution is applied automatically.</p><button className="foundation-button foundation-button-primary" type="button" onClick={()=>open("brand_foundation")}>Open Ask the House <ArrowRight size={14}/></button></section></div>
      <div className="fp-review-bottom"><section className="foundation-card fp-path-card"><div className="fp-card-title"><Target size={18} /><h2>YOUR PATH TO 100%</h2><span>Current readiness by section; projected overall changes are unavailable.</span></div><div className="fp-review-requirements">{missing.slice(0,3).map((section)=>{const stage=STAGES.find(item=>item.id===section.id);return <div className="fp-path-row" key={section.id}><span className="fp-review-check" aria-hidden="true"/><b>{section.label}</b><span>{section.score}%</span><small>{section.missing_items?.length?section.missing_items.join(", "):"Tracked fields remain incomplete"}</small>{stage&&<button className="foundation-button foundation-button-tertiary" type="button" onClick={()=>navigate(stage.path)}>Open section</button>}</div>})}{!missing.length&&<p>All implemented sections are complete. Review and Lock workflow remains unavailable.</p>}</div><div className="fp-review-progress"><span>Current Foundation readiness</span><strong>{readiness.overall}%</strong><div className="fp-progress-track"><span style={{width:`${readiness.overall}%`}}/></div><small>Scoring model: {readiness.scoring_model_version||"Unavailable"}. No projected score is shown.</small></div></section><section className="foundation-card fp-approval-dark"><div className="fp-card-title"><LockKeyhole size={20}/><h2>APPROVAL AND LOCK</h2></div><div className="fp-approval-status-list"><p><span>Version</span><b>Not tracked</b></p><p><span>Last approved</span><b>Unavailable</b></p><p><span>Approval status</span><b>Unavailable</b></p><p><span>Lock status</span><b>Unavailable</b></p><p><span>Approver</span><b>Unavailable</b></p></div><p className="fp-approval-reason">Approval, conflict resolution, and locking workflows are not implemented in this release.</p><button className="foundation-button foundation-button-primary" type="button" disabled title="Review workflow is not implemented">Request Review</button><div className="fp-approval-actions"><button className="foundation-button foundation-button-secondary" type="button" disabled title="Approval and locking are not implemented">Approve and Lock</button><button className="foundation-button foundation-button-secondary" type="button" disabled title="Blueprint export is not implemented">Export Blueprint</button><button className="foundation-button foundation-button-secondary" type="button" onClick={()=>navigate("/foundation")}>Back</button></div></section></div>
    </>}
  </FoundationSectionLayout></FoundationPageShell>;
}
