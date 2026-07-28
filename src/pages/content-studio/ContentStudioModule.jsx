import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Aperture, Bot, CheckCircle2, Clapperboard, Crown, FileImage, FileText,
  GripVertical, HeartHandshake, Home, ImagePlus, Lightbulb, Mail, Megaphone,
  Paperclip, Pencil, Plus, Rocket, Search, Send, ShieldCheck, Sparkles,
  Target, Trash2, Upload, UploadCloud, Users, Workflow, X, ZoomIn, ZoomOut
} from "lucide-react";
import AuthShell from "../../components/AuthShell";
import "../../styles/content-studio.css";

const HERO = "/command-center-assets/brand-house.png";
const goalData = [
  ["Authority Content", Sparkles], ["Lead Generation", Target], ["Offer Launch", Rocket],
  ["Customer Education", Lightbulb], ["Brand Story", HeartHandshake],
  ["Community Building", Users], ["Sales Content", Megaphone], ["Email Campaign", Mail],
];
const agentData = [
  ["hook-architect", "Hook Architect", Sparkles, "Creates hooks that stop the scroll and open the right conversation."],
  ["story-architect", "Story Architect", FileText, "Builds brand stories that create recognition and connection."],
  ["offer-architect", "Offer Architect", Target, "Shapes offers around a clear outcome and buying decision."],
  ["conversion-architect", "Conversion Architect", Workflow, "Builds funnels, emails, landing pages, and conversion paths."],
  ["brand-guardian", "Brand Guardian", ShieldCheck, "Checks voice, message, positioning, and consistency."],
  ["visual-director", "Visual Director", Aperture, "Creates visual concepts, image prompts, and campaign direction."],
  ["video-director", "Video Director", Clapperboard, "Builds scenes, shot lists, scripts, and production prompts."],
  ["audience-profiler", "Audience Profiler", Users, "Turns audience evidence into a specific buyer profile."],
];
const navItems = [
  ["home", "Studio Home", Home], ["composer", "Composer", Sparkles],
  ["images", "Images", ImagePlus], ["media", "Media", FileImage],
  ["storyboards", "Storyboards", Clapperboard], ["agents", "Agents", Bot],
  ["automations", "Automations", Workflow], ["upload", "Upload", Upload],
];

function studioUrl(view, extra = {}) {
  const params = new URLSearchParams();
  if (view && view !== "home") params.set("view", view);
  Object.entries(extra).forEach(([key, value]) => value && params.set(key, value));
  const query = params.toString();
  return query ? `/content-studio?${query}` : "/content-studio";
}

function Shell({ title, eyebrow = "CONTENT STUDIO", actions, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = new URLSearchParams(location.search).get("view") || "home";
  return (
    <AuthShell activeNav="content-studio">
      <main className="cth-studio">
        <header className="cs-heading">
          <div><span className="cs-eyebrow">{eyebrow}</span><h1>{title}</h1></div>
          <div className="cs-actions">{actions}</div>
        </header>
        <nav className="cs-subnav" aria-label="Content Studio">
          {navItems.map(([view, label, Icon]) => (
            <button key={view} type="button" onClick={() => navigate(studioUrl(view))} className={active === view ? "active" : ""}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </nav>
        {children}
      </main>
    </AuthShell>
  );
}

function EstateGate({ onStart, compact = false }) {
  return (
    <section className={`cs-estate-gate${compact ? " compact" : ""}`}>
      <Crown size={25} />
      <div><span className="cs-eyebrow">ESTATE TIER ONLY · PAID ADD-ON</span><h2>Custom Agents & Automations</h2><p>Tenant-owned agents and workflows include a seven-day free trial. Official Core Truth House agents remain platform-managed.</p></div>
      <button className="cs-button primary" onClick={onStart}>Start 7-Day Trial</button>
    </section>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [trial, setTrial] = useState(false);
  return (
    <Shell title="Content Studio">
      <section className="cs-hero">
        <div><span className="cs-eyebrow">STRATEGY-LED CREATION</span><h2>What are we building today?</h2><p>Choose a business goal and let the House build strategic, on-brand content around it.</p><label className="cs-search"><Search size={16}/><input placeholder="Search goals or templates..." /></label></div>
        <aside><Crown/><strong>{trial ? "Trial active" : "Agents & Automations Trial"}</strong><span>{trial ? "7 days remaining" : "Unlock tenant-owned agents and automations."}</span><button className="cs-button primary" onClick={() => setTrial(true)}>{trial ? "Manage Trial" : "Start Free Trial"}</button></aside>
      </section>
      <section className="cs-goals">{goalData.map(([label, Icon]) => <button key={label} onClick={() => navigate(studioUrl("composer"))}><Icon/><span>{label}</span></button>)}</section>
      <section className="cs-grid three">
        <article className="cs-card span-2"><h2>Recent Projects</h2><div className="cs-projects">{["Summer Launch Campaign","Brand Story Series","Lead Magnet Mini Course","Q3 Nurture Campaign"].map((name, index) => <button key={name}><span>0{index + 1}</span><strong>{name}</strong><small>Updated {index + 1} days ago</small></button>)}</div></article>
        <article className="cs-card"><span className="cs-eyebrow">CONTENT OVERVIEW</span><div className="cs-metrics">{[["156","Content"],["89","Images"],["34","Videos"],["94/100","Score"]].map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></article>
      </section>
      <section className="cs-card"><header><div><span className="cs-eyebrow">CORE TRUTH HOUSE ONLY</span><h2>Official Agents</h2></div><button className="cs-link" onClick={() => navigate(studioUrl("agents"))}>View all</button></header><div className="cs-agent-strip">{agentData.slice(0,6).map(([id,name,Icon,blurb]) => <button key={id} onClick={() => navigate(studioUrl("agent-detail", { agent: id }))}><span className="cs-agent-icon"><Icon size={17}/></span><strong>{name}</strong><small>{blurb}</small></button>)}</div></section>
      <EstateGate compact onStart={() => setTrial(true)} />
    </Shell>
  );
}

function ComposerPage() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "What would you like to create today? I can build strategic content using your Brand Memory." }]);
  const [value, setValue] = useState("");
  const send = () => { if (!value.trim()) return; setMessages((items) => [...items, { role: "user", text: value }, { role: "assistant", text: "I created an aligned draft using your audience, offer, voice, and campaign goal." }]); setValue(""); };
  return (
    <Shell title="AI Content Composer" actions={<><button className="cs-button secondary">Share</button><button className="cs-button primary">Save Project</button></>}>
      <div className="cs-composer">
        <aside className="cs-card cs-memory"><span className="cs-eyebrow">BRAND MEMORY</span>{["Brand Voice","Audience","Current Offer","Business Goals","Key Messages","Tone"].map((item) => <button key={item}><span>{item}</span><small>Edit</small></button>)}</aside>
        <section className="cs-card cs-chat"><div className="cs-messages">{messages.map((message,index) => <div key={index} className={`cs-message ${message.role}`}>{message.text}</div>)}<article><strong>The #1 Reason Your Content Feels Inconsistent</strong><p>Your audience needs a clear message tied to a real transformation and a visible next step.</p></article></div><div className="cs-tools">{["Improve","Shorten","Expand","Change Tone","Translate","Repurpose"].map((tool) => <button key={tool}>{tool}</button>)}</div><div className="cs-input"><Paperclip/><ImagePlus/><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ask the House to create something..."/><button onClick={send}><Send/></button></div></section>
        <aside className="cs-card cs-outputs"><span className="cs-eyebrow">LIVE OUTPUTS</span>{["Facebook Post","Instagram Carousel","Video Script","Email Sequence","Lead Magnet","Blog Outline"].map((item,index) => <button key={item}><FileText/><span>{item}</span><b>{94 - index}</b></button>)}<button className="cs-button primary"><Plus/> New Output</button></aside>
      </div>
    </Shell>
  );
}

function AgentsPage() {
  const navigate = useNavigate();
  return <Shell title="Core Truth House Agents" eyebrow="CORE TRUTH HOUSE ONLY" actions={<button className="cs-button secondary" onClick={() => navigate(studioUrl("agent-new"))}><Plus/> Create Custom Agent</button>}><section className="cs-agent-grid">{agentData.map(([id,name,Icon,blurb]) => <button key={id} onClick={() => navigate(studioUrl("agent-detail", { agent: id }))}><span className="cs-agent-icon large"><Icon/></span><h2>{name}</h2><p>{blurb}</p><small>Active</small></button>)}</section><EstateGate onStart={() => navigate(studioUrl("agent-new"))}/></Shell>;
}

function AgentDetailPage() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get("agent");
  const agent = agentData.find((item) => item[0] === id) || agentData[0];
  const [,name,Icon,blurb] = agent;
  return <Shell title={name} eyebrow="OFFICIAL CORE TRUTH HOUSE AGENT" actions={<button className="cs-button primary">Start Session</button>}><section className="cs-card cs-agent-head"><span className="cs-agent-icon hero"><Icon/></span><div><span className="cs-status">Active</span><h2>{blurb}</h2></div></section><div className="cs-grid three"><article className="cs-card"><h2>About This Agent</h2><p>Built to complete one focused strategic job using approved Core Truth House frameworks and tenant Brand Memory.</p>{["Focused outputs","Brand alignment","Repeatable production","Clear next steps"].map((item) => <div className="cs-check" key={item}><CheckCircle2/>{item}</div>)}</article><article className="cs-card"><h2>Example Outputs</h2>{["50 Hook Ideas","10 Pattern Interrupts","10 Open Loops","5 Curiosity Headlines"].map((item) => <button className="cs-list" key={item}>{item}<span>View</span></button>)}</article><article className="cs-card"><h2>Recent Runs</h2>{["Instagram Hook Ideas","YouTube Video Hooks","Email Subject Lines"].map((item) => <button className="cs-list" key={item}>{item}<b>View</b></button>)}</article></div></Shell>;
}

function AgentBuilderPage() {
  const [trial, setTrial] = useState(false);
  if (!trial) return <Shell title="Create Custom Agent" eyebrow="ESTATE TIER ONLY"><EstateGate onStart={() => setTrial(true)}/></Shell>;
  return <Shell title="Create Custom Agent" eyebrow="ESTATE TIER ONLY · TRIAL ACTIVE"><div className="cs-builder"><aside>{["Basic Information","Knowledge Sources","Instructions","Tools & Actions","Outputs","Review & Create"].map((item,index) => <button key={item} className={index === 0 ? "active" : ""}><span>{index + 1}</span>{item}</button>)}</aside><section className="cs-card cs-form"><h2>Basic Information</h2><label>Agent name<input placeholder="e.g. My Brand Strategist"/></label><label>Description<textarea placeholder="What should this agent do?"/></label><label>Category<select><option>Select a category</option><option>Strategy</option><option>Content</option></select></label><div><button className="cs-button secondary">Cancel</button><button className="cs-button primary">Next</button></div></section><aside className="cs-card"><Crown/><h2>Tier & Access</h2><p>Estate required</p><p>Add-on trial active</p><strong>7 days remaining</strong></aside></div></Shell>;
}

function AutomationsPage() {
  const navigate = useNavigate();
  const rows = [["New Lead Welcome Flow","Form submitted","48","98%"],["Content Repurposing Flow","New media","32","97%"],["Weekly Content Plan","Schedule","12","100%"],["Nurture Email Sequence","Tag added","27","96%"]];
  return <Shell title="Automations" eyebrow="ESTATE ADD-ON" actions={<button className="cs-button primary" onClick={() => navigate(studioUrl("automation-new"))}><Plus/> Create Automation</button>}><EstateGate compact onStart={() => navigate(studioUrl("automation-new"))}/><section className="cs-card"><div className="cs-tabs">{["All Automations","Active","Draft","Paused","Templates"].map((item,index) => <button key={item} className={index === 0 ? "active" : ""}>{item}</button>)}</div><div className="cs-table"><div className="head"><span>Automation</span><span>Trigger</span><span>Status</span><span>Runs</span><span>Success</span></div>{rows.map((row) => <button className="row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span className="cs-status">Active</span><b>{row[2]}</b><b>{row[3]}</b></button>)}</div></section><section className="cs-metric-row">{[["8","Total Automations"],["125","Runs This Month"],["97%","Success Rate"],["18.5 hrs","Time Saved"]].map(([value,label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section></Shell>;
}

function AutomationBuilderPage() {
  const [trial, setTrial] = useState(false);
  const [selected, setSelected] = useState("");
  if (!trial) return <Shell title="Create Automation" eyebrow="ESTATE TIER ONLY"><EstateGate onStart={() => setTrial(true)}/></Shell>;
  return <Shell title="Create Automation" eyebrow="ESTATE TIER ONLY · TRIAL ACTIVE"><div className="cs-builder"><aside>{["Trigger","Conditions","Actions","Agent Steps","Output","Review & Activate"].map((item,index) => <button key={item} className={index === 0 ? "active" : ""}><span>{index + 1}</span>{item}</button>)}</aside><section className="cs-card span-2"><h2>Choose a Trigger</h2><div className="cs-trigger-grid">{["Form Submitted","New Lead","Tag Added","Email Opened","Schedule","Custom Webhook"].map((item) => <button key={item} className={selected === item ? "selected" : ""} onClick={() => setSelected(item)}><Workflow/><strong>{item}</strong><small>Start this workflow when {item.toLowerCase()}.</small></button>)}</div><div className="cs-form-actions"><button className="cs-button secondary">Cancel</button><button className="cs-button primary" disabled={!selected}>Continue</button></div></section></div></Shell>;
}

function ImagePreview({ open, onClose, onEdit, onStoryboard }) {
  const [zoom, setZoom] = useState(1);
  if (!open) return null;
  return <div className="cs-modal-backdrop" onMouseDown={onClose}><section className="cs-modal" onMouseDown={(event) => event.stopPropagation()}><header><h2>Image Review</h2><button onClick={onClose}><X/></button></header><div><figure><img src={HERO} alt="Generated Core Truth House visual" style={{ transform: `scale(${zoom})` }}/></figure><aside><h3>Image Details</h3><p>Summer Launch Campaign</p><p>Brand score: 94/100</p><button className="cs-button primary" onClick={onEdit}><Pencil/> Request Edit</button><button className="cs-button secondary" onClick={onStoryboard}><Plus/> Add to Storyboard</button></aside></div><footer><button onClick={() => setZoom((value) => Math.max(.7, value - .1))}><ZoomOut/></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.8, value + .1))}><ZoomIn/></button></footer></section></div>;
}

function ImagesPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return <Shell title="Image Generator" actions={<button className="cs-button secondary"><Upload/> Upload Reference</button>}><div className="cs-image-layout"><aside className="cs-card cs-form"><label>Prompt<textarea rows="6" defaultValue="Confident woman entrepreneur in a refined office, warm lighting, deep purple and gold accents."/></label><button className="cs-button secondary"><Sparkles/> Enhance Prompt</button><label>Aspect Ratio<select><option>16:9</option><option>1:1</option><option>9:16</option></select></label><label>Brand Style<select><option>Core Truth House</option><option>Editorial</option></select></label><button className="cs-button primary"><ImagePlus/> Generate Images</button></aside><section className="cs-image-grid">{[0,1,2,3].map((item) => <button key={item} onClick={() => setOpen(true)}><img src={HERO} alt={`Generated visual ${item + 1}`}/><span>Open larger</span></button>)}</section></div><ImagePreview open={open} onClose={() => setOpen(false)} onEdit={() => navigate(studioUrl("edit"))} onStoryboard={() => navigate(studioUrl("storyboards"))}/></Shell>;
}

function MediaPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return <Shell title="Media Library" actions={<button className="cs-button primary" onClick={() => navigate(studioUrl("upload"))}><Upload/> Upload Media</button>}><section className="cs-card cs-library-tools"><label className="cs-search"><Search/><input placeholder="Search media..."/></label><select><option>All Types</option></select><select><option>All Projects</option></select><select><option>Newest</option></select></section><section className="cs-media-grid">{Array.from({ length: 8 }).map((_,index) => <button key={index} onClick={() => setOpen(true)}><img src={HERO} alt={`Media item ${index + 1}`}/><strong>campaign-visual-{index + 1}.png</strong><small>Summer Launch Campaign</small></button>)}</section><ImagePreview open={open} onClose={() => setOpen(false)} onEdit={() => navigate(studioUrl("edit"))} onStoryboard={() => navigate(studioUrl("storyboards"))}/></Shell>;
}

function StoryboardsPage() {
  const [scenes, setScenes] = useState(["Hook","Problem","Solution","Proof","CTA"].map((title,index) => ({ id: index, title })));
  const [dragged, setDragged] = useState(null);
  const drop = (target) => { if (dragged === null) return; const next = [...scenes]; const [item] = next.splice(dragged, 1); next.splice(target, 0, item); setScenes(next); setDragged(null); };
  return <Shell title="Storyboard Builder" actions={<><button className="cs-button secondary">Preview</button><button className="cs-button primary">Export</button></>}><section className="cs-storyboard">{scenes.map((scene,index) => <article key={scene.id} draggable onDragStart={() => setDragged(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(index)}><header><GripVertical/><span>Scene {index + 1}</span><button onClick={() => setScenes((items) => items.filter((item) => item.id !== scene.id))}><Trash2/></button></header><img src={HERO} alt={scene.title}/><label>Scene title<input value={scene.title} onChange={(event) => setScenes((items) => items.map((item) => item.id === scene.id ? { ...item, title: event.target.value } : item))}/></label><label>Direction<textarea defaultValue="Continue the visual narrative."/></label></article>)}<button className="cs-add-scene" onClick={() => setScenes((items) => [...items, { id: Date.now(), title: "New Scene" }])}><Plus/> Add Scene</button></section></Shell>;
}

function UploadPage() {
  const [files, setFiles] = useState([]);
  return <Shell title="Upload Media"><div className="cs-upload"><label className="cs-drop"><UploadCloud/><strong>Drag and drop files here</strong><span>or click to browse</span><small>JPG, PNG, MP4, PDF, DOCX, MP3 · Max 100MB</small><input type="file" multiple onChange={(event) => setFiles([...event.target.files])}/></label><section className="cs-card cs-form"><h2>File Details</h2><label>Project<select><option>Summer Launch Campaign</option></select></label><label>Tags<input placeholder="marketing, brand, planning"/></label><label>Usage Rights<select><option>Owned by me</option><option>Licensed</option></select></label><label>Description<textarea placeholder="Describe this asset..."/></label><button className="cs-button primary" disabled={!files.length}>Upload {files.length || "Media"}</button></section></div></Shell>;
}

function EditPage() {
  const [sent, setSent] = useState(false);
  return <Shell title="Request Image Edit"><div className="cs-edit"><img src={HERO} alt="Selected visual"/><section className="cs-card cs-form"><label>Edit Instructions<textarea rows="9" defaultValue={"Change the background to a refined modern office with natural light.\nMake the outfit black.\nAdd the Core Truth House logo subtly.\nKeep the facial features consistent."}/></label><label>Style Preference<select><option>Natural</option><option>Cinematic</option></select></label><label>Priority<select><option>Standard</option><option>Priority</option></select></label><button className="cs-button primary" onClick={() => setSent(true)}>{sent ? "Edit Request Submitted" : "Submit Edit Request"}</button></section></div></Shell>;
}

export default function ContentStudioModule() {
  const location = useLocation();
  const view = new URLSearchParams(location.search).get("view") || "home";
  const pages = useMemo(() => ({
    home: HomePage, composer: ComposerPage, agents: AgentsPage, "agent-detail": AgentDetailPage,
    "agent-new": AgentBuilderPage, automations: AutomationsPage, "automation-new": AutomationBuilderPage,
    images: ImagesPage, media: MediaPage, storyboards: StoryboardsPage, upload: UploadPage, edit: EditPage,
  }), []);
  const Page = pages[view] || HomePage;
  return <Page />;
}
