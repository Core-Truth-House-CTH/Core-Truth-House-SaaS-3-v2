import React,{useCallback,useEffect,useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {ArrowRight,BookOpen,CalendarDays,CheckCircle2,FileText,Gem,Lock,MessageSquareText,Sparkles,UsersRound} from "lucide-react";
import {FoundationPageShell,FoundationSectionLayout} from "./FoundationSectionLayout";
import {useAskTheHouse} from "../context/AskTheHouseContext";
import apiClient from "../lib/apiClient";
import {API_PATHS} from "../lib/apiPaths";
import "./foundation-phase1.css";
const DEST={brand_audit:"/brand-audit",core_truth:"/brand-foundation",audience:"/audience",positioning:"/brand-positioning",messaging:"/messaging-structure",expression:"/identity-studio",review_lock:"/foundation/review-lock"};
const DISPLAY={brand_audit:"Brand Audit",core_truth:"Core Truth",audience:"Audience Truth",positioning:"Positioning",messaging:"Messaging",expression:"Brand Expression",review_lock:"Review and Lock"};
const titleFor=(section)=>DISPLAY[section?.id]||section?.label||"Foundation section";
const STATUS=(s)=>s.score===100?"Complete":s.score>0?"In progress":"Not started";
export default function FoundationHome(){
 const [data,setData]=useState(null),[audience,setAudience]=useState(null),[promise,setPromise]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState(""),[sideError,setSideError]=useState("");
 const {open}=useAskTheHouse();
 const load=useCallback(async()=>{setLoading(true);setError("");setSideError("");try{const r=await apiClient.get("/api/foundation/readiness");setData(r);setError("");const settled=await Promise.allSettled([apiClient.get(API_PATHS.audience.avatars),apiClient.get("/api/persist/messaging-structure")]);if(settled[0].status==="fulfilled"){const items=settled[0].value?.avatars||[];setAudience(items.find(x=>x.is_primary)||items[0]||null)}else setSideError("Audience details are unavailable.");if(settled[1].status==="fulfilled"){const m=settled[1].value?.messaging_structure||settled[1].value||{};setPromise(m.brand_promise||m.brandPromise||"")}else setSideError("Saved brand promise is unavailable.")}catch(e){setData(null);setError(e?.message||"Foundation readiness could not be loaded.")}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);
 const sections=useMemo(()=>data?.sections||[],[data]);
 const next=sections.find(s=>s.id!=="review_lock"&&s.id!=="brand_audit"&&s.score<100);
 const pathRows=sections.filter(s=>s.id!=="brand_audit"&&s.score<100).slice(0,3);
 const projectedOverall=(section)=>typeof data?.overall_raw==="number"&&typeof section?.score_raw==="number"&&section.id!=="review_lock"?Math.round((data.overall_raw*7+(100-section.score_raw))/7):null;
 return <FoundationPageShell><FoundationSectionLayout title="Foundation" subtitle="Build the truth the rest of your brand will stand on." activeSection="home" home hideRail>
  {error&&<p role="alert" className="foundation-error fp-home-error">{error} <button className="foundation-button foundation-button-secondary" onClick={load} type="button">Retry</button></p>}
  {loading?<div className="foundation-state" aria-live="polite"><span className="fp-spinner"/>Loading saved Foundation data.</div>:data&&<>
   <div className="fp-home-layout">
    <div className="fp-home-primary">
     <div className="fp-home-summary-grid">
      <article className="foundation-card fp-home-readiness"><div className="fp-donut" style={{"--score":`${data.overall||0}%`}}><strong>{data.overall}%</strong></div><div><h2>Foundation readiness</h2><p>Draft progress from saved workspace fields.</p><a href="#foundation-sections">How this is calculated <ArrowRight size={13}/></a></div></article>
      <article className="foundation-card fp-home-summary-card"><span className="fp-summary-icon fp-approval-icon"><CalendarDays size={26}/></span><div><span className="fp-eyebrow">LAST APPROVED</span><strong>Not tracked</strong><p>Approval history is unavailable in this release.</p></div></article>
      <article className="foundation-card fp-home-summary-card"><span className="fp-summary-icon fp-version-icon"><FileText size={26}/></span><div><span className="fp-eyebrow">CURRENT VERSION</span><strong>Not tracked</strong><p>Version history is unavailable in this release.</p></div></article>
      <article className="foundation-card fp-home-summary-card"><span className="fp-summary-icon fp-audience-icon"><UsersRound size={28}/></span><div><span className="fp-eyebrow">PRIMARY AUDIENCE</span><strong>{audience?.name||"Not available"}</strong><p>{audience?.stage||sideError||"No saved audience profile is available."}</p></div></article>
     </div>
     <div className="fp-home-main-grid">
      <section className="foundation-card fp-home-sections" id="foundation-sections"><div className="fp-section-title"><div><span className="fp-eyebrow">YOUR FOUNDATION SECTIONS</span></div><span className="fp-state-pill">{data.scoring_model_version||"Saved fields"}</span></div>
       <ol className="fp-section-list">{sections.map((s,index)=>{const to=DEST[s.id],completed=s.score===100,label=titleFor(s);return <li key={s.id}><span className="fp-stage-number">{index+1}</span><Link className="fp-stage-name" to={to}>{label}</Link><span className={`fp-stage-status ${completed?"is-complete":s.score>0?"is-progress":""}`}><span className="fp-stage-status-icon">{completed?<CheckCircle2 size={23}/>:null}</span>{STATUS(s)}</span><div className={`fp-stage-meter ${completed?"is-complete":s.score>0?"is-progress":""}`}><span style={{width:`${s.score}%`}}/></div><b className="fp-stage-score">{s.score}%</b><Link className="fp-stage-open" to={to} aria-label={`Open ${label}`}><ArrowRight size={17}/></Link></li>})}</ol>
      </section>
      <section className="foundation-card fp-home-ask"><div className="fp-section-title"><div className="fp-eyebrow"><Sparkles size={17}/> ASK THE HOUSE</div><button className="fp-icon-button" type="button" onClick={()=>open("brand_foundation")} aria-label="Ask the House">?</button></div>
       <div className="fp-house-prompt"><span className="fp-house-target"><MessageSquareText size={26}/></span><div><small>YOUR NEXT STEP</small><h2>{next?`Continue ${titleFor(next)}`:"Review your saved foundation"}</h2><p>{next?.missing_items?.[0]|| (next?`Continue with saved fields in ${titleFor(next)}.`:"Required tracked fields are complete.")}</p></div></div>
       <button className="fp-house-cta" type="button" onClick={()=>open(next?.id||"brand_foundation")}>Work on this with the House <ArrowRight size={16}/></button>
       <div className="fp-house-actions"><button type="button" onClick={()=>open(next?.id||"brand_foundation")}><BookOpen size={16}/> Guide me</button><button type="button" onClick={()=>open(next?.id||"brand_foundation")}><FileText size={16}/> Draft from my answers</button><button type="button" onClick={()=>open(next?.id||"brand_foundation")}><MessageSquareText size={16}/> Refine this</button><button type="button" onClick={()=>open(next?.id||"brand_foundation")}><Lock size={16}/> Check alignment</button></div>
       <p className="fp-house-footnote">Suggestions are generated only when requested and are not saved until you apply them.</p>
      </section>
     </div>
    </div>
    <aside className="foundation-card fp-home-review"><div className="fp-review-heading"><span className="fp-eyebrow">FOUNDATION REVIEW</span><span className="fp-review-info" title="Review workflow is not implemented.">i</span></div><div className="fp-review-block"><span>Approval status</span><strong className="fp-review-value">Unavailable</strong><small>Approval workflow is not implemented.</small></div><div className="fp-review-block fp-lock-block"><span>Lock status</span><strong className="fp-review-value">Unavailable</strong><small>Lock state is not tracked.</small><span className="fp-lock-medallion"><Lock size={25}/></span></div><div className="fp-review-unavailable"><span>Review actions are unavailable</span><small>Reviewer assignment and conflict review are not implemented.</small></div><button className="fp-outline-action fp-review-button" type="button" disabled title="Conflict review is not implemented.">Review Conflicts <ArrowRight size={15}/></button></aside>
    <div className="fp-home-bottom-grid">
     <section className="foundation-card fp-home-path"><div className="fp-eyebrow fp-home-path-title">YOUR PATH TO 100%</div>{pathRows.length?pathRows.map(s=>{const projected=projectedOverall(s);const review=s.id==="review_lock";return <div className="fp-path-line" key={s.id}><span className={`fp-path-icon ${s.score===100?"is-complete":s.id==="review_lock"?"is-review":""}`}>{s.id==="messaging"?<MessageSquareText size={19}/>:s.id==="expression"?<Sparkles size={19}/>:s.id==="review_lock"?<FileText size={19}/>:<ArrowRight size={19}/>}</span><Link to={DEST[s.id]}>{titleFor(s)} - {s.score}%</Link><span>{review?"Workflow actions are not implemented.":s.missing_items?.[0]||"Continue with saved fields"}</span><b>{review?"Unavailable":projected===null?"Overall: unavailable":`Overall: ${projected}%`}</b><Link to={DEST[s.id]} className="fp-outline-action">{review?"View status":"Continue with AI"} <ArrowRight size={14}/></Link></div>}) : <p>All tracked sections are complete.</p>}<p className="fp-home-hint">Projected overall assumes this section reaches 100% while other tracked fields stay the same. Readiness measures field completeness, not approval.</p></section>
     <section className="foundation-card fp-home-promise"><div className="fp-eyebrow">BRAND PROMISE</div><div className="fp-promise-content"><span className="fp-promise-icon"><Gem size={32}/></span><div><h2>{promise||"No brand promise saved"}</h2><p>{promise?"A saved promise from your messaging section.":sideError||"Save a promise in Messaging to show it here."}</p></div></div><Link to="/messaging-structure">Open Messaging <ArrowRight size={14}/></Link></section>
     <section className="foundation-card fp-home-blueprint"><div className="fp-eyebrow">BLUEPRINT</div><div className="fp-blueprint-content"><span className="fp-blueprint-icon"><FileText size={28}/></span><div><h2>Not available</h2><p>Blueprint versioning is not implemented.</p></div></div><button className="fp-outline-action" type="button" disabled title="Blueprint export is not implemented.">Export Blueprint</button><div className="fp-blueprint-status"><span>Approval <b>Unavailable</b></span><span>Lock <b>Unavailable</b></span></div></section>
    </div>
   </div>
  </>}
 </FoundationSectionLayout></FoundationPageShell>
}
