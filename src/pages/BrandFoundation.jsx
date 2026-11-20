import React,{useCallback,useEffect,useState} from "react";
import {FoundationPageShell,FoundationSectionLayout} from "./FoundationSectionLayout";
import {useBrandHealth} from "../context/BrandHealthContext";
import {AiButton,HousePanel,ListField,LoadState,TextField,cleanList,toList,useFieldAssist} from "../components/Foundation/FoundationFields";
import {errorMessage} from "../lib/foundationSections.mjs";
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
 beliefs:["Beliefs","The truths that shape your decisions.","Belief","+ Add belief",false],
 values:["Core Values","Three to five principles behind how you work.","Core value","+ Add value",true],
};
const NAME={...Object.fromEntries(Object.entries(TEXT_FIELDS).map(([k,v])=>[k,v[0]])),beliefs:"Beliefs",values:"Core Values"};
function normalize(r){const d=r?.foundation||r||{};return{raw:{...d},data:{...EMPTY,...d,beliefs:toList(d.beliefs),values:toList(d.values??d.coreValues)}}}

export default function BrandFoundation(){
 const {refresh:refreshBrandHealth}=useBrandHealth();
 const [data,setData]=useState(EMPTY),[raw,setRaw]=useState({}),[loaded,setLoaded]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const n=normalize(await apiClient.get("/api/persist/brand-foundation"));setRaw(n.raw);setData(n.data);setLoaded(true)}catch{setLoaded(false);setError("Foundation data could not be loaded. Please retry.")}finally{setLoading(false)}},[]);
 useEffect(()=>{load()},[load]);
 const save=async(next=data)=>{if(!loaded)return false;setSaving(true);setError("");try{const payload={...raw,...next,beliefs:cleanList(next.beliefs),values:cleanList(next.values)};await apiClient.post("/api/persist/brand-foundation",payload);setRaw(payload);refreshBrandHealth();return true}catch(e){setError(errorMessage(e,"Your Foundation could not be saved."));return false}finally{setSaving(false)}};
 const assist=useFieldAssist(async field=>(await apiClient.post("/api/persist/brand-foundation/ai-assist",{field,current_data:{...raw,...data,beliefs:cleanList(data.beliefs),values:cleanList(data.values)}}))?.suggestion);
 const applyDraft=async()=>{if(!assist.draft)return;const f=assist.draft.field;const next={...data,[f]:LIST_FIELDS[f]?toList(assist.draft.text):assist.draft.text};setData(next);if(await save(next))assist.clear()};
 const update=(k,v)=>setData(d=>({...d,[k]:v}));
 const ai=k=><AiButton value={data[k]} busy={Boolean(assist.busy)} onClick={()=>assist.request(k)}/>;
 if(loading||!loaded)return <FoundationPageShell><div className="fnd foundation-phase1"><div className="fnd-wrap"><LoadState loading={loading} error={error||"Foundation data could not be loaded."} onRetry={load} what="Core Truth"/></div></div></FoundationPageShell>;

 const text=k=><TextField key={k} id={k} label={TEXT_FIELDS[k][0]} hint={TEXT_FIELDS[k][1]} value={data[k]} onChange={v=>update(k,v)} ai={ai(k)}/>;
 const listField=k=>{const [label,hint,one,add,chips]=LIST_FIELDS[k];return <ListField key={k} id={k} label={label} hint={hint} items={data[k]} onChange={v=>update(k,v)} one={one} addLabel={add} chips={chips} ai={ai(k)}/>};
 const rail=<HousePanel sectionId="core_truth" assist={assist} nameOf={f=>NAME[f]||f} onUse={applyDraft} saving={saving}/>;

 return <FoundationPageShell><FoundationSectionLayout title="Core Truth" subtitle="Define what your brand believes and why it exists." activeSection="core_truth" onSaveDraft={()=>save()} saving={saving} rail={rail}>
  {error&&<p className="fnd-error" role="alert">{error}</p>}
  <div className="fnd-fields">{["purpose","mission","vision"].map(text)}{listField("beliefs")}{listField("values")}{text("founder_insight")}</div>
 </FoundationSectionLayout></FoundationPageShell>
}
