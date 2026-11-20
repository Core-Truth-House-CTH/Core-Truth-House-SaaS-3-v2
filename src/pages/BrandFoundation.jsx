import React,{useCallback,useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {FoundationPageShell,FoundationSectionLayout} from "./FoundationSectionLayout";
import {useBrandHealth} from "../context/BrandHealthContext";
import {useAskTheHouse} from "../context/AskTheHouseContext";
import {aiButtonLabel,errorMessage,outOfCredits} from "../lib/foundationSections.mjs";
import apiClient from "../lib/apiClient";

// Core Truth (build reference, artboard F): lesson spot, six field cards with one AI button each,
// prev/next; right column: Your Review card (from the shared layout) and Ask the House.
const EMPTY={purpose:"",mission:"",vision:"",beliefs:[],values:[],founder_insight:""};
const TEXT_FIELDS={
 purpose:["Purpose","Why you exist. The higher goal behind the work."],
 mission:["Mission","Who you serve and what changes for them."],
 vision:["Vision","Where you're going. The future you want to create."],
 founder_insight:["Founder Insight","What you know about your clients that others miss."],
};
const LIST_FIELDS={
 beliefs:["Beliefs","The truths that shape your decisions.","belief","Belief","+ Add belief"],
 values:["Core Values","Three to five principles behind how you work.","value","Core value","+ Add value"],
};
const NAME={...Object.fromEntries(Object.entries(TEXT_FIELDS).map(([k,v])=>[k,v[0]])),beliefs:"Beliefs",values:"Core Values"};
const list=v=>Array.isArray(v)?v:typeof v==="string"?v.split("\n").map(x=>x.trim()).filter(Boolean):[];
const clean=a=>a.map(x=>String(x).trim()).filter(Boolean);
function normalize(r){const d=r?.foundation||r||{};return{raw:{...d},data:{...EMPTY,...d,beliefs:list(d.beliefs),values:list(d.values??d.coreValues)}}}

function AiButton({value,onClick,busy}){
 return <button className="fnd-btn-ai" type="button" onClick={onClick} disabled={busy}>{aiButtonLabel(value)}</button>
}

export default function BrandFoundation(){
 const {refresh:refreshBrandHealth}=useBrandHealth(),{open}=useAskTheHouse();
 const draftRequest=useRef(0),focusNext=useRef(null);
 const [data,setData]=useState(EMPTY),[raw,setRaw]=useState({}),[loaded,setLoaded]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[aiDraft,setAiDraft]=useState(null),[aiBusy,setAiBusy]=useState(""),[aiError,setAiError]=useState(""),[noCredits,setNoCredits]=useState(false),[houseText,setHouseText]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const n=normalize(await apiClient.get("/api/persist/brand-foundation"));setRaw(n.raw);setData(n.data);setLoaded(true)}catch{setLoaded(false);setError("Foundation data could not be loaded. Please retry.")}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(focusNext.current){document.getElementById(focusNext.current)?.focus();focusNext.current=null}});
 const save=async(next=data)=>{if(!loaded)return false;setSaving(true);setError("");try{const payload={...raw,...next,beliefs:clean(next.beliefs),values:clean(next.values)};await apiClient.post("/api/persist/brand-foundation",payload);setRaw(payload);refreshBrandHealth();return true}catch(e){setError(errorMessage(e,"Your Foundation could not be saved."));return false}finally{setSaving(false)}};
 const requestDraft=async(field)=>{const id=++draftRequest.current;setAiBusy(field);setAiError("");setNoCredits(false);setAiDraft(null);try{const r=await apiClient.post("/api/persist/brand-foundation/ai-assist",{field,current_data:{...raw,...data,beliefs:clean(data.beliefs),values:clean(data.values)}});if(typeof r?.suggestion!=="string"||!r.suggestion.trim())throw new Error("No suggestion was returned.");if(id===draftRequest.current)setAiDraft({field,text:r.suggestion.trim()})}catch(e){if(id===draftRequest.current){if(outOfCredits(e))setNoCredits(true);else setAiError(errorMessage(e,"The suggestion could not be created."))}}finally{if(id===draftRequest.current)setAiBusy("")}};
 const applyDraft=async()=>{if(!aiDraft)return;const value=LIST_FIELDS[aiDraft.field]?list(aiDraft.text):aiDraft.text;const next={...data,[aiDraft.field]:value};setData(next);if(await save(next))setAiDraft(null)};
 const update=(k,v)=>setData(d=>({...d,[k]:v}));
 const addItem=(k)=>{focusNext.current=`${k}-${data[k].length}`;update(k,[...data[k],""])};
 const askHouse=(e)=>{e.preventDefault();open("core_truth",houseText.trim());setHouseText("")};
 if(loading)return <FoundationPageShell><div className="fnd foundation-phase1" aria-live="polite"><div className="fnd-wrap"><p className="fnd-muted">Loading Core Truth…</p></div></div></FoundationPageShell>;
 if(!loaded)return <FoundationPageShell><div className="fnd foundation-phase1"><div className="fnd-wrap"><p className="fnd-error" role="alert">{error||"Foundation data could not be loaded."}</p><button className="fnd-btn fnd-btn-s" type="button" onClick={load}>Retry</button></div></div></FoundationPageShell>;

 const textCard=(k)=><div className="fnd-field" key={k}><div className="fnd-fhead"><label className="fnd-lbl" htmlFor={k}>{TEXT_FIELDS[k][0]}</label><span className="fnd-spacer"/><AiButton value={data[k]} busy={Boolean(aiBusy)} onClick={()=>requestDraft(k)}/></div><p className="fnd-muted">{TEXT_FIELDS[k][1]}</p><textarea id={k} rows={3} value={data[k]??""} placeholder="Write it the way you'd say it to a client." onChange={e=>update(k,e.target.value)}/></div>;
 const listCard=(k)=>{const [label,hint,one,aria,add]=LIST_FIELDS[k];const chips=k==="values";return <div className="fnd-field" key={k}><div className="fnd-fhead"><p className="fnd-lbl">{label}</p><span className="fnd-spacer"/><AiButton value={data[k]} busy={Boolean(aiBusy)} onClick={()=>requestDraft(k)}/></div><p className="fnd-muted">{hint}</p>
  <ul className={chips?"fnd-chips":"fnd-list"}>{data[k].map((v,i)=><li key={i}><input id={`${k}-${i}`} type="text" aria-label={`${aria} ${i+1}`} value={v} onChange={e=>update(k,data[k].map((x,j)=>j===i?e.target.value:x))}/><button type="button" aria-label={`Remove ${one}: ${v||i+1}`} onClick={()=>update(k,data[k].filter((_,j)=>j!==i))}>×</button></li>)}</ul>
  <button className="fnd-add" type="button" onClick={()=>addItem(k)}>{add}</button></div>};

 const rail=<section className="fnd-plum fnd-house" aria-label="Ask the House">
  <div><p className="fnd-serif fnd-house-title">ASK THE HOUSE</p><p className="fnd-house-sub">Uses your saved Foundation. 1 credit per suggestion.</p></div>
  {aiBusy&&<div className="fnd-suggest" aria-live="polite"><p className="fnd-lbl fnd-lbl-sm">SUGGESTED {NAME[aiBusy].toUpperCase()}</p><p className="fnd-suggest-text">Thinking…</p></div>}
  {!aiBusy&&aiDraft&&<div className="fnd-suggest" aria-live="polite"><p className="fnd-lbl fnd-lbl-sm">SUGGESTED {NAME[aiDraft.field].toUpperCase()}, NOT APPLIED</p><p className="fnd-suggest-text">{aiDraft.text}</p><div className="fnd-suggest-actions"><button className="fnd-btn fnd-btn-p" type="button" onClick={applyDraft} disabled={saving}>Use this</button><button className="fnd-btn fnd-btn-s" type="button" onClick={()=>requestDraft(aiDraft.field)}>Try another</button></div></div>}
  {!aiBusy&&noCredits&&<div className="fnd-suggest" role="alert"><p className="fnd-suggest-text">You've used all your AI credits. Buy more credits to keep getting suggestions.</p><Link className="fnd-btn fnd-btn-p fnd-btn-link" to="/billing">Buy credits</Link></div>}
  {!aiBusy&&aiError&&<p className="fnd-house-error" role="alert">{aiError}</p>}
  <form className="fnd-house-ask" onSubmit={askHouse}><label className="fnd-sr" htmlFor="house-ask">Tell the House what to change</label><input id="house-ask" type="text" value={houseText} onChange={e=>setHouseText(e.target.value)} placeholder="Tell the House what to change..."/></form>
  <p className="fnd-house-foot">Suggestions stay drafts until you use them.</p>
 </section>;

 return <FoundationPageShell><FoundationSectionLayout title="Core Truth" subtitle="Define what your brand believes and why it exists." activeSection="core_truth" onSaveDraft={()=>save()} saving={saving} rail={rail}>
  {error&&<p className="fnd-error" role="alert">{error}</p>}
  <div className="fnd-fields">{["purpose","mission","vision"].map(textCard)}{listCard("beliefs")}{listCard("values")}{textCard("founder_insight")}</div>
 </FoundationSectionLayout></FoundationPageShell>
}
