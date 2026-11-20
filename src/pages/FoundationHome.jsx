import React from "react";
import {Link} from "react-router-dom";
import {FoundationPageShell,FoundationSectionLayout} from "./FoundationSectionLayout";
import {useFoundationProgress} from "../hooks/useFoundationProgress";
import {SECTION_IDS,latestNote,lockedCount,shortDate} from "../lib/foundationSections.mjs";

// Foundation Home (build reference, artboard E): header with section count, section tabs, sections
// table, and a right column with Your next step and the latest note From your reviewer. Nothing else.
// Members never see the reviewer's name. There is no Export button (no per-section export exists).
export default function FoundationHome(){
 const {sections,loading,error,reload,rows,step}=useFoundationProgress();
 const note=latestNote(sections),ready=sections.length>0;
 const header=<><span className="fnd-spacer"/>{ready&&<p className="fnd-count"><strong>{lockedCount(rows)} of {SECTION_IDS.length}</strong> sections locked</p>}</>;
 return <FoundationPageShell><FoundationSectionLayout title="Foundation" subtitle="Build the truth the rest of your brand will stand on." activeSection="home" home headerActions={header}>
  {error&&!ready&&<p role="alert" className="fnd-error">{error} <button className="fnd-btn fnd-btn-s" onClick={reload} type="button">Retry</button></p>}
  {loading&&!ready?<p className="fnd-muted" aria-live="polite">Loading your Foundation…</p>:ready&&<div className="fnd-row">
   <SectionsTable rows={rows}/>
   <div className="fnd-side">
    <section className="fnd-plum" aria-label="Your next step">
     <h2 className="fnd-lbl fnd-gold">YOUR NEXT STEP</h2>
     <p className="fnd-serif fnd-step-title">{step.title}</p>
     <p className="fnd-step-body">{step.body}</p>
     {step.path&&<Link className="fnd-step-cta" to={step.path}>{step.button}</Link>}
    </section>
    {note&&<section className="fnd-card fnd-from" aria-label="Latest note from your reviewer">
     <div className="fnd-from-head"><span className="fnd-av fnd-av-lg" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg></span><div><h2>From your reviewer</h2><p className="fnd-muted fnd-small">On {note.sectionName}{note.at?`, ${shortDate(note.at)}`:""}</p></div></div>
     <p className="fnd-serif fnd-from-quote">“{note.text}”</p>
    </section>}
   </div>
  </div>}
 </FoundationSectionLayout></FoundationPageShell>
}

// The seven sections with their review state. Also used on Review and Lock.
export function SectionsTable({rows,main=true}){
 return <section className={`fnd-card fnd-sections${main?" fnd-main":""}`} aria-label="Your Foundation sections">
  <h2 className="fnd-lbl">YOUR FOUNDATION SECTIONS</h2>
  <ol className="fnd-tbl">{rows.map(r=><li key={r.id}><Link to={r.path}><span className="fnd-n">{r.n}</span><span className="fnd-name">{r.name}</span><span className={`fnd-state fnd-state-${r.state}`}><span className="fnd-dot" aria-hidden="true"/>{r.label}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg></Link></li>)}</ol>
  <p className="fnd-muted fnd-small fnd-tbl-foot">Submit each section when it's ready. Your reviewer checks it and locks it once it's approved.</p>
 </section>
}
