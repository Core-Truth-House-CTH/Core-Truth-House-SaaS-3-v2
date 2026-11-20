import React,{useEffect,useState} from "react";
import {Link,useLocation} from "react-router-dom";
import AuthShell from "../components/AuthShell";
import AskTheHouseDrawer from "../components/ask-the-house/AskTheHouseDrawer";
import {useAskTheHouse,getSurfaceFromPath} from "../context/AskTheHouseContext";
import {SectionStatusCard,useFoundationSections} from "../components/Foundation/FoundationReview";
import {FOUNDATION_SECTIONS,SECTION_IDS,lessonEmbedUrl,lessonFor,lessonLabel,sectionLock} from "../lib/foundationSections.mjs";
import apiClient from "../lib/apiClient";
import "./foundation-phase1.css";
import "./foundation-v03.css";
import "./foundation.css";

// Foundation pages (build reference E: Home, F: section page). Approved 2026-11-18.

export function FoundationPageShell({children}){
 const {isOpen,close,sectionId,initialInput,initialMode}=useAskTheHouse(),location=useLocation();
 return <AuthShell activeNav="foundation">{children}<AskTheHouseDrawer open={isOpen} onClose={close} surface={getSurfaceFromPath(location.pathname)} sectionId={sectionId} initialInput={initialInput} initialMode={initialMode}/></AuthShell>
}

export const FOUNDATION_TABS=[["Foundation Home","/foundation","home"],...FOUNDATION_SECTIONS.map(([id,label,to])=>[label,to,id])];

function FoundationTabs({active}){
 return <nav className="fnd-tabs" aria-label="Foundation sections"><div>{FOUNDATION_TABS.map(([label,to,id])=><Link key={id} to={to} className={active===id?"is-on":undefined} aria-current={active===id?"page":undefined}>{label}</Link>)}</div></nav>
}

// Lesson spot (Agent Tasks 8). Shows the section's lesson (title, length, Play) once Shake sets one on
// /admin/onboarding; Play swaps the tile for the YouTube player. With no lesson, or if the list cannot be
// read, the card reads "Lesson coming soon" with no play link, as the build reference specifies. It sits
// outside the lock, so a locked section's lesson still plays.
function LessonSpot({sectionId}){
 const [state,setState]=useState({loading:true,lesson:null});
 const [playing,setPlaying]=useState(false);
 useEffect(()=>{let live=true;setPlaying(false);setState({loading:true,lesson:null});
  apiClient.get("/api/training-videos").then((r)=>{if(live)setState({loading:false,lesson:lessonFor(r?.videos,sectionId)})}).catch(()=>{if(live)setState({loading:false,lesson:null})});
  return()=>{live=false}},[sectionId]);
 const {loading,lesson}=state;
 const welcome=sectionId==="brand_audit"&&<p className="fnd-muted">New here? Start with the welcome lesson in your welcome email.</p>;
 if(lesson&&playing) return <section className="fnd-card fnd-lesson fnd-lesson-playing" aria-label="Lesson">
  <div className="fnd-lesson-player"><iframe src={lessonEmbedUrl(lesson)} title={lesson.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>
  <div className="fnd-lesson-copy"><p className="fnd-lbl fnd-lbl-sm">{lessonLabel(lesson)}</p><p className="fnd-serif fnd-lesson-title">{lesson.title}</p>{welcome}</div>
 </section>;
 const tileIcon=<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/></svg>;
 return <section className="fnd-card fnd-lesson" aria-label="Lesson" aria-busy={loading||undefined}>
  {lesson?<button type="button" className="fnd-lesson-tile" aria-label={`Play lesson: ${lesson.title}`} onClick={()=>setPlaying(true)}>{tileIcon}</button>:<span className="fnd-lesson-tile" aria-hidden="true">{tileIcon}</span>}
  <div className="fnd-lesson-copy"><p className="fnd-lbl fnd-lbl-sm">{lesson?lessonLabel(lesson):"LESSON"}</p><p className="fnd-serif fnd-lesson-title">{lesson?lesson.title:loading?"\u00a0":"Lesson coming soon"}</p>{welcome}</div>
 </section>;
}

// Navigation only: it does not save or submit. Back goes to the previous section; the first section
// goes back to Foundation Home.
function PrevNext({sectionId}){
 const i=FOUNDATION_SECTIONS.findIndex(([id])=>id===sectionId),prev=FOUNDATION_SECTIONS[i-1],next=FOUNDATION_SECTIONS[i+1];
 return <div className="fnd-prevnext">{prev?<Link to={prev[2]}>← {prev[1]}</Link>:<Link to="/foundation">← Foundation Home</Link>}<span/>{next&&<Link to={next[2]}>Next: {next[1]} →</Link>}</div>
}

// One fieldset per column holds the section's fields. It is disabled when the section is locked, so
// every input, textarea, select and button inside is read-only at once; the server's 423 stays the
// guard. The review card (with Request unlock) and the prev/next links sit outside it.
function LockScope({lock,children}){
 return <fieldset className="fv3-lock-scope" disabled={lock.fieldsDisabled} data-locked={lock.locked?"true":undefined}>{children}</fieldset>
}

function SectionBody({activeSection,lock=sectionLock(null),card=null,rail,children}){
 const content=SECTION_IDS.includes(activeSection);
 return <div className="fnd-row">
  <main className="fnd-main">{content&&<LessonSpot sectionId={activeSection}/>}<LockScope lock={lock}>{children}</LockScope>{content&&<PrevNext sectionId={activeSection}/>}</main>
  {(card||rail)&&<aside className="fnd-side">{card}{rail&&<LockScope lock={lock}>{rail}</LockScope>}</aside>}
 </div>
}

// A Foundation section with a review status: one sections load feeds both the card and the lock.
function ReviewedSectionBody({onSaveDraft,saving,...props}){
 const sectionsState=useFoundationSections();
 const lock=sectionLock(sectionsState.sections.find((s)=>s.section_id===props.activeSection));
 return <SectionBody {...props} lock={lock} card={<SectionStatusCard sectionId={props.activeSection} sectionsState={sectionsState} onSaveDraft={onSaveDraft} saving={saving}/>}/>
}

export function FoundationSectionLayout({title,subtitle,activeSection="core_truth",children,rail=null,onSaveDraft=null,saving=false,home=false,headerActions=null,customTabs=null}){
 return <div className="fnd foundation-phase1">
  <div className="fnd-wrap">
   <div className="fnd-head"><div><h1 className="fnd-h1">{title}</h1><p className="fnd-sub">{subtitle}</p></div>{headerActions}</div>
   {customTabs||<FoundationTabs active={home?"home":activeSection}/>}
   {home?children:SECTION_IDS.includes(activeSection)?<ReviewedSectionBody activeSection={activeSection} rail={rail} onSaveDraft={onSaveDraft} saving={saving}>{children}</ReviewedSectionBody>:<SectionBody activeSection={activeSection} rail={rail}>{children}</SectionBody>}
  </div>
 </div>
}
