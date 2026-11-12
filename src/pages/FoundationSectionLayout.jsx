import {SectionStatusCard} from "../components/Foundation/FoundationReview";
import React from "react";
import {Link,useLocation,useNavigate} from "react-router-dom";
import {ArrowUpFromLine,ChevronDown,LockKeyhole} from "lucide-react";
import AuthShell from "../components/AuthShell";
import AskTheHouseDrawer from "../components/ask-the-house/AskTheHouseDrawer";
import {useAskTheHouse,getSurfaceFromPath} from "../context/AskTheHouseContext";
import "./foundation-phase1.css";
import "./foundation-v03.css";

export function FoundationPageShell({children}){
 const {isOpen,close,sectionId}=useAskTheHouse(),location=useLocation();
 return <AuthShell activeNav="foundation">{children}<AskTheHouseDrawer open={isOpen} onClose={close} surface={getSurfaceFromPath(location.pathname)} sectionId={sectionId}/></AuthShell>
}

export const FOUNDATION_TABS=[
 ["Foundation Home","/foundation","home"],
 ["Brand Audit","/brand-audit","brand_audit"],
 ["Core Truth","/brand-foundation","core_truth"],
 ["Audience Truth","/audience","audience"],
 ["Positioning","/brand-positioning","positioning"],
 ["Messaging","/messaging-structure","messaging"],
 ["Brand Expression","/identity-studio","expression"],
 ["Review and Lock","/foundation/review-lock","review_lock"],
];

const CARD_SECTIONS=["brand_audit","core_truth","audience","positioning","messaging","expression"];
export function FoundationSectionLayout({title,subtitle,activeSection="core_truth",children,rail,footer=null,saveLabel="Save Draft",onSaveDraft,onSaveContinue,saving=false,hideRail=false,home=false,hideToolbar=false,headerActions=null,customTabs=null}){
 const nav=useNavigate();
 const sectionIndex=Math.max(1,FOUNDATION_TABS.findIndex((item)=>item[2]===activeSection));
 const current=FOUNDATION_TABS[sectionIndex];
 const canContinue=Boolean(onSaveContinue);
 return <div className={`foundation-phase1${home?" fp-home-page":""}`}>
  <header className="foundation-page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>
   {!home&&!hideToolbar&&<div className="foundation-section-toolbar"><button className="foundation-toolbar-control" type="button" disabled title="The version number is shown in the Review status card below.">Draft <ChevronDown size={13}/></button><button className="foundation-toolbar-control" type="button" disabled title="Review status and the Submit button are in the Review status card below.">Approval <ChevronDown size={13}/></button><label className="foundation-section-select"><span>Section {sectionIndex} of 7</span><select aria-label="Choose Foundation section" value={current[1]} onChange={e=>nav(e.target.value)}>{FOUNDATION_TABS.slice(1).map(([label,to,id],i)=><option key={id} value={to} disabled={id==="review_lock"}>{label}</option>)}</select></label>{activeSection==="review_lock"?<><button className="foundation-toolbar-control" type="button" disabled title="Blueprint export is not implemented.">Export Blueprint</button><button className="foundation-toolbar-primary" type="button" disabled title="Review workflow is not implemented.">Request Review</button></>:<><button type="button" className="foundation-toolbar-control" onClick={onSaveDraft} disabled={!onSaveDraft||saving} title={onSaveDraft?undefined:"This section has no editable fields here."}>{saving?"Saving…":saveLabel}</button><button type="button" className="foundation-toolbar-primary" onClick={onSaveContinue} disabled={!canContinue||saving} title={canContinue?undefined:"Save and continue is unavailable for this section."}>{saving?"Saving…":"Save and Continue"} <span aria-hidden="true">&rarr;</span></button></>}</div>}
   {home&&<div className="fp-home-controls"><span className="fp-home-control-status">Version unavailable</span><button className="foundation-button foundation-button-secondary" type="button" disabled title="Approval history is not implemented.">Approval <ChevronDown size={13}/></button><a className="foundation-button foundation-button-secondary" href="#foundation-sections">All Sections <ChevronDown size={13}/></a><button className="foundation-button foundation-button-secondary" type="button" disabled title="Blueprint export is not implemented."><ArrowUpFromLine size={15}/> Export Blueprint</button><button className="foundation-button foundation-button-primary" type="button" disabled title="Review and Lock workflow is not implemented.">Review and Lock <LockKeyhole size={14}/></button></div>}
   {headerActions}
  </header>
  {customTabs || <nav className="foundation-tabs" aria-label="Foundation sections">{FOUNDATION_TABS.map(([label,to,id])=>id==="review_lock"?<Link key={id} to={to} className={`foundation-tab${activeSection===id?" is-active":""}`} aria-current={activeSection===id?"page":undefined}>{label}</Link>:<Link key={id} to={to} className={`foundation-tab${activeSection===id?" is-active":""}`} aria-current={activeSection===id?"page":undefined}>{label}</Link>)}</nav>}
  <div className={`foundation-content-grid fp-layout-${activeSection}${hideRail?" fp-no-rail":""}`}><main className="foundation-main-content">{!home&&CARD_SECTIONS.includes(activeSection)&&<SectionStatusCard sectionId={activeSection}/>}{children}</main>{!hideRail&&<aside className="foundation-right-rail">{rail}</aside>}</div>{footer&&<div className="fp-layout-footer">{footer}</div>}
 </div>
}
