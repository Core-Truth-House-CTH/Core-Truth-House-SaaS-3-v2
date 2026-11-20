import React,{useCallback,useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {FoundationPageShell,FoundationSectionLayout} from "./FoundationSectionLayout";
import {useFoundationSections} from "../components/Foundation/FoundationReview";
import {homeRows,latestNote,lockedCount,nextStep,shortDate} from "../lib/foundationSections.mjs";
import apiClient from "../lib/apiClient";

// Foundation Home (build reference, artboard E): header with section count, section tabs, sections
// table, and a right column with Your next step and the latest note From Shake. Nothing else.
export default function FoundationHome(){
 const sectionsState=useFoundationSections();
 const [readiness,setReadiness]=useState([]);
 // Readiness only tells "In progress" from "Not started"; the page works without it.
 const loadReadiness=useCallback(async()=>{try{const r=await apiClient.get("/api/foundation/readiness");setReadiness(r?.sections||[])}catch{setReadiness([])}},[]);
 useEffect(()=>{loadReadiness()},[loadReadiness]);
 const {sections,loading,error,reload}=sectionsState;
 const rows=homeRows(sections,readiness),step=nextStep(rows),note=latestNote(sections),ready=sections.length>0;
 const header=<><span className="fnd-spacer"/>{ready&&<p className="fnd-count"><strong>{lockedCount(rows)} of 7</strong> sections locked</p>}<button className="fnd-btn fnd-btn-s fnd-btn-icon" type="button" disabled title="Blueprint export is not implemented."><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 8l5-5 5 5M4 15v5h16v-5"/></svg>Export Blueprint</button></>;
 return <FoundationPageShell><FoundationSectionLayout title="Foundation" subtitle="Build the truth the rest of your brand will stand on." activeSection="home" home headerActions={header}>
  {error&&!ready&&<p role="alert" className="fnd-error">{error} <button className="fnd-btn fnd-btn-s" onClick={reload} type="button">Retry</button></p>}
  {loading&&!ready?<p className="fnd-muted" aria-live="polite">Loading your Foundation…</p>:ready&&<div className="fnd-row">
   <section className="fnd-card fnd-main fnd-sections" aria-label="Your Foundation sections">
    <h2 className="fnd-lbl">YOUR FOUNDATION SECTIONS</h2>
    <ol className="fnd-tbl">{rows.map(r=><li key={r.id}><Link to={r.path}><span className="fnd-n">{r.n}</span><span className="fnd-name">{r.name}</span><span className={`fnd-state fnd-state-${r.state}`}><span className="fnd-dot" aria-hidden="true"/>{r.label}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></Link></li>)}</ol>
    <p className="fnd-muted fnd-small fnd-tbl-foot">Submit each section when it's ready. Shake reviews it and locks it once it's approved.</p>
   </section>
   <div className="fnd-side">
    <section className="fnd-plum" aria-label="Your next step">
     <h2 className="fnd-lbl fnd-gold">YOUR NEXT STEP</h2>
     <p className="fnd-serif fnd-step-title">{step.title}</p>
     <p className="fnd-step-body">{step.body}</p>
     {step.path&&<Link className="fnd-step-cta" to={step.path}>{step.button}</Link>}
    </section>
    {note&&<section className="fnd-card fnd-from" aria-label="Latest note from Shake">
     <div className="fnd-from-head"><span className="fnd-av fnd-av-lg" aria-hidden="true">S</span><div><h2>From Shake</h2><p className="fnd-muted fnd-small">On {note.sectionName}{note.at?`, ${shortDate(note.at)}`:""}</p></div></div>
     <p className="fnd-serif fnd-from-quote">“{note.text}”</p>
    </section>}
   </div>
  </div>}
 </FoundationSectionLayout></FoundationPageShell>
}
