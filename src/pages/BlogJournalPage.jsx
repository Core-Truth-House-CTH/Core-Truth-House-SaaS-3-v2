import React from "react";
import { Link, useParams } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import { notes } from "../data/fieldNotes.mjs";

const A = "/field-notes-assets/";

const categories = [
 "All Notes",
 "Brand Strategy",
 "Messaging",
 "Systems",
 "Founder Growth",
 "Execution",
 "Offers",
 "AI + Workflows",
];


const featuredArticle = notes[0];

// Long-form (pillar) articles carry an ordered `blocks` array instead of the
// fixed sections/paragraphs shape. These helpers render that generic body.
function blockHeadingId(text) {
 return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Inline link spans — shared by paragraph blocks and list items. A span with an
// href renders as a router Link; everything else is plain text.
function renderSpans(spans) {
 return spans.map((s, i) =>
 s.href ? (
 <Link key={i} to={s.href}>{s.text}</Link>
 ) : (
 <React.Fragment key={i}>{s.text}</React.Fragment>
 )
 );
}

function renderBlock(block, key) {
 if (block.t === "h2") {
 return <h2 key={key} id={blockHeadingId(block.text)}>{block.text}</h2>;
 }
 if (block.t === "ul") {
 // Items are plain strings, or { spans } when the line carries an inline link.
 return (
 <ul key={key}>
 {block.items.map((item, i) => (
 <li key={i}>{item.spans ? renderSpans(item.spans) : item}</li>
 ))}
 </ul>
 );
 }
 if (block.spans) {
 return <p key={key}>{renderSpans(block.spans)}</p>;
 }
 return <p key={key}>{block.text}</p>;
}

function FieldNotesIndex() {
 return (
 <main className="fn-page">
 <PublicHeader active="journal" />

 <section className="fn-hero">
 <div className="fn-hero-column" />

 <div className="fn-shell fn-hero-grid">
 <div className="fn-hero-copy">
 <p className="fn-eyebrow">Field Notes</p>
 <h1>Strategic Notes From the House.</h1>
 <div className="fn-line" />
 <p>
 Field Notes is where founders find short-form insights, reflections, strategy notes,
 and sharp observations on brand clarity, systems, messaging, growth, and execution.
 </p>

 <div className="fn-proof-row">
 <div>
 <span>▧</span>
 <strong>Founder-Written Insights</strong>
 </div>
 <div>
 <span>◎</span>
 <strong>Real-World Strategy & Observations</strong>
 </div>
 <div>
 <span>△</span>
 <strong>Clarity for the Build Ahead</strong>
 </div>
 </div>
 </div>

 <div className="fn-hero-art">
 <img src={`${A}cth-field-notes-hero-book-architecture.png`} alt="Core Truth House field notes book and architecture" />
 </div>
 </div>
 </section>

 <section className="fn-tabs-wrap">
 <div className="fn-shell fn-tabs">
 {categories.map((cat, index) => (
 <button key={cat} className={index === 0 ? "active" : ""}>{cat}</button>
 ))}
 </div>
 </section>

 <section className="fn-main-section">
 <div className="fn-shell">
 <div className="fn-featured">
 <div className="fn-featured-img">
 <img src={`${A}cth-field-notes-column-architecture-card.webp`} alt="Core Truth House column architecture" />
 <img className="fn-image-watermark" src={`${A}cth-field-notes-logo-image.png`} alt="" aria-hidden="true" />
 </div>

 <div className="fn-featured-copy">
 <p className="fn-section-label">Featured Note</p>
 <h2>{featuredArticle.title}</h2>
 <p>
 Consistency is not repetition. It is alignment. The brands that endure are not the loudest.
 They are the clearest. Here is how to build a brand that holds its line, compounds trust,
 and wins without chasing trends.
 </p>

 <div className="fn-note-meta">
 <span>May 20, 2026</span>
 <span>•</span>
 <span>{featuredArticle.read}</span>
 <span>•</span>
 <span>Brand Strategy</span>
 </div>

 <Link to="/blog/strategic-consistency" className="fn-red-btn">Read Note <span>→</span></Link>
 </div>
</div>

 <div className="fn-content-grid">
 <div>
 <div className="fn-section-head">
 <p className="fn-section-label">Recent Notes</p>
 <span />
 </div>

 <div className="fn-card-grid">
 {notes.map((note, index) => (
 <article className="fn-card" key={`${note.slug}-${index}`}>
 <div className="fn-card-img">
 <img src={`${A}${note.img}`} alt="" />
 <img className="fn-image-watermark small" src={`${A}cth-field-notes-logo-image.png`} alt="" aria-hidden="true" />
 </div>

 <div className="fn-card-body">
 <p className="fn-card-category">{note.category}</p>
 <h3>{note.title}</h3>
 <p>{note.excerpt}</p>

 <div className="fn-card-meta">
 <span>May 19, 2026</span>
 <span>•</span>
 <span>{note.read}</span>
 </div>

 <Link to={`/blog/${note.slug}`}>Read More <span>→</span></Link>
 </div>
 </article>
 ))}
 </div>
 </div>

 <SubscribeCard />
 </div>
 </div>
 </section>

 <InsideNotebook />
 <DiagnosticCTA />
 <PublicFooter />
 <FieldNotesStyles />
 </main>
 );
}

function ArticlePage({ article: currentArticle }) {
 const [isSaved, setIsSaved] = React.useState(false);
 const [shareStatus, setShareStatus] = React.useState("");

 React.useEffect(() => {
 if (!currentArticle || typeof window === "undefined") return;

 const saved = JSON.parse(window.localStorage.getItem("cthSavedFieldNotes") || "[]");
 setIsSaved(saved.some((item) => item.slug === currentArticle.slug));
 }, [currentArticle]);

 const handleSaveArticle = () => {
 if (!currentArticle || typeof window === "undefined") return;

 const saved = JSON.parse(window.localStorage.getItem("cthSavedFieldNotes") || "[]");
 const alreadySaved = saved.some((item) => item.slug === currentArticle.slug);

 const nextSaved = alreadySaved
 ? saved.filter((item) => item.slug !== currentArticle.slug)
 : [
 ...saved,
 {
 slug: currentArticle.slug,
 title: currentArticle.title,
 category: currentArticle.category,
 savedAt: new Date().toISOString(),
 },
 ];

 window.localStorage.setItem("cthSavedFieldNotes", JSON.stringify(nextSaved));
 setIsSaved(!alreadySaved);
 setShareStatus(alreadySaved ? "Removed from saved notes" : "Saved to this browser");

 window.setTimeout(() => setShareStatus(""), 2200);
 };

 const handleShareArticle = async () => {
 if (!currentArticle || typeof window === "undefined") return;

 const shareUrl = window.location.href;
 const shareData = {
 title: currentArticle.title,
 text: currentArticle.excerpt,
 url: shareUrl,
 };

 try {
 if (navigator.share) {
 await navigator.share(shareData);
 setShareStatus("Share opened");
 } else if (navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(shareUrl);
 setShareStatus("Article link copied");
 } else {
 window.prompt("Copy this article link:", shareUrl);
 setShareStatus("Copy the article link");
 }
 } catch (error) {
 if (navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(shareUrl);
 setShareStatus("Article link copied");
 }
 }

 window.setTimeout(() => setShareStatus(""), 2200);
 };

 if (!currentArticle) {
 return (
 <main className="fn-page">
 <PublicHeader active="journal" />
 <section className="article-hero">
 <div className="fn-shell">
 <p className="fn-eyebrow">Field Notes</p>
 <h1>Field Note not found.</h1>
 <p>The note you are looking for may have moved. Return to the Field Notes library.</p>
 <Link to="/blog" className="fn-red-btn">Back to Field Notes <span>→</span></Link>
 </div>
 </section>
 <PublicFooter />
 <FieldNotesStyles />
 </main>
 );
 }

 return (
 <main className="fn-page">
 <PublicHeader active="journal" />

 <section className="article-hero">
 <div className="fn-shell article-hero-grid">
 <div className="article-hero-copy">
 <div className="breadcrumb">
 <Link to="/">⌂</Link>
 <span>›</span>
 <Link to="/blog">Field Notes</Link>
 <span>›</span>
 <span>Brand Strategy</span>
 <span>›</span>
 <span>{currentArticle.title}</span>
 </div>

 <p className="fn-eyebrow">{currentArticle.category}</p>
 <h1>{currentArticle.title}</h1>
 <div className="fn-line" />
 <p>{currentArticle.excerpt}</p>
 </div>

 <div className="article-hero-image">
 <img src={`${A}cth-field-notes-column-architecture-card.webp`} alt="Core Truth House architectural columns" />
 </div>
 </div>

 <div className="article-meta-bar fn-shell">
 <div className="author-block">
 <span className="fn-mini-seal static">CTH</span>
 <div>
 <small>By Core Truth House</small>
 <strong>Editorial Team</strong>
 </div>
 </div>

 <div className="meta-item">
 <span>□</span>
 <strong>May 20, 2026</strong>
 </div>

 <div className="meta-item">
 <span>◷</span>
 <strong>{featuredArticle.read}</strong>
 </div>

 <button type="button" className={`meta-item meta-action ${isSaved ? "saved" : ""}`} onClick={handleSaveArticle}>
 <span>{isSaved ? "♥" : "♡"}</span>
 <strong>{isSaved ? "Saved" : "Save Article"}</strong>
 </button>

 <button type="button" className="meta-item meta-action" onClick={handleShareArticle}>
 <span>↗</span>
 <strong>Share</strong>
 </button>
 </div>

 {shareStatus && (
 <div className="fn-shell article-action-status" role="status" aria-live="polite">
 {shareStatus}
 </div>
 )}
 </section>

 <section className="article-body-section">
 <div className="fn-shell article-layout">
 <aside className="article-toc">
 <p className="fn-section-label">In This Article</p>
 <ul>
 {currentArticle.blocks ? (
 currentArticle.blocks.filter((b) => b.t === "h2").map((b) => (
 <li key={b.text}>
 <span />
 <a href={`#${blockHeadingId(b.text)}`}>{b.text}</a>
 </li>
 ))
 ) : (
 currentArticle.sections.map((section) => (
 <li key={section}>
 <span />
 <a href={`#${section.toLowerCase().replaceAll(" ", "-")}`}>{section}</a>
 </li>
 ))
 )}
 </ul>

 <div className="toc-column-art" />
 </aside>

 <article className="article-content">
 {currentArticle.blocks ? (
 (() => {
 const firstH2 = currentArticle.blocks.findIndex((b) => b.t === "h2");
 const intro = firstH2 === -1 ? currentArticle.blocks : currentArticle.blocks.slice(0, firstH2);
 const rest = firstH2 === -1 ? [] : currentArticle.blocks.slice(firstH2);
 return (
 <>
 {intro.map((b, i) => renderBlock(b, `intro-${i}`))}
 {currentArticle.quote && (
 <blockquote>
 <span>“</span>
 <p>{currentArticle.quote}</p>
 </blockquote>
 )}
 {rest.map((b, i) => renderBlock(b, `b-${i}`))}
 </>
 );
 })()
 ) : (
 <>
 {currentArticle.paragraphs.slice(0, 2).map((paragraph, index) => (
 <p key={`intro-${index}`}>{paragraph}</p>
 ))}

 <h2 id={currentArticle.sections[0].toLowerCase().replaceAll(" ", "-")}>{currentArticle.sections[0]}</h2>
 <p>{currentArticle.paragraphs[2]}</p>

 <blockquote>
 <span>“</span>
 <p>{currentArticle.quote}</p>
 </blockquote>

 {currentArticle.sections.slice(1, 5).map((section, index) => (
 <React.Fragment key={section}>
 <h2 id={section.toLowerCase().replaceAll(" ", "-")}>{section}</h2>
 <p>{currentArticle.paragraphs[index + 3]}</p>
 </React.Fragment>
 ))}

 <div id="a-framework-for-consistency" className="framework-box">
 <p className="framework-label">A Framework for Consistent Brands</p>
 <div className="framework-grid">
 {[
 ["Define", "Clarify your purpose, promise, and positioning."],
 ["Align", "Unify your voice, visuals, and story."],
 ["Systematize", "Build repeatable processes and standards."],
 ["Empower", "Equip your team to represent the brand well."],
 ["Sustain", "Measure, refine, and stay the course."],
 ].map(([title, text]) => (
 <div key={title}>
 <span>⌂</span>
 <strong>{title}</strong>
 <p>{text}</p>
 </div>
 ))}
 </div>
 </div>

 <p id="final-thoughts">{currentArticle.paragraphs[currentArticle.paragraphs.length - 1]}</p>
 </>
 )}
 {currentArticle.related && currentArticle.related.length > 0 && (
 <div className="article-related">
 <p className="fn-section-label">Related</p>
 <ul>
 {currentArticle.related.map((r) => (
 <li key={r.href}>
 <Link to={r.href}>{r.label}</Link>
 </li>
 ))}
 </ul>
 </div>
 )}
 </article>

 <aside className="article-side-rail">
 <RelatedNote currentSlug={currentArticle.slug} />
 <SubscribeCard />
 </aside>
 </div>
 </section>

 <section className="article-diagnostic fn-shell">
 <div className="fn-footer-seal">CTH</div>
 <div>
 <h2>Build a Brand That Holds</h2>
 <p>Let’s uncover the blind spots, align your systems, and build a brand that stays consistent, earns trust, and wins for the long game.</p>
 </div>
 <a href="/brand-diagnostic/">Start the Brand Diagnostic <span>→</span></a>
 </section>

 <section className="more-notes fn-shell">
 <p className="fn-section-label">More Field Notes</p>
 <div className="more-notes-grid">
 {notes.filter((note) => note.slug !== currentArticle.slug).slice(0, 3).map((note) => (
 <article className="fn-card" key={note.slug}>
 <div className="fn-card-img">
 <img src={`${A}${note.img}`} alt="" />
 <img className="fn-image-watermark small" src={`${A}cth-field-notes-logo-image.png`} alt="" aria-hidden="true" />
 </div>
 <div className="fn-card-body">
 <p className="fn-card-category">{note.category}</p>
 <h3>{note.title}</h3>
 <div className="fn-card-meta">
 <span>May 12, 2026</span>
 <span>•</span>
 <span>{note.read}</span>
 </div>
 <Link to={`/blog/${note.slug}`}>Read More <span>→</span></Link>
 </div>
 </article>
 ))}
 </div>
 </section>

 <PublicFooter />
 <FieldNotesStyles />
 </main>
 );
}

function RelatedNote({ currentSlug }) {
 const related = notes.find((note) => note.slug !== currentSlug) || notes[0];
 return (
 <aside className="related-note">
 <p>Related Note</p>
 <img src={`${A}cth-field-notes-column-architecture-card.webp`} alt="" />
 <h3>{related.title}</h3>
 <Link to={`/blog/${related.slug}`}>Read More <span>→</span></Link>
 </aside>
 );
}

function SubscribeCard() {
 return (
 <aside className="fn-subscribe">
 <img src={`${A}cth-field-notes-icon-open-book.png`} alt="" />
 <h2>Notes Worth Returning To.</h2>
 <div className="fn-gold-line" />
 <p>
 Subscribe for our thinking, articles, founder insights, and sharp opportunities delivered straight to your inbox.
 </p>

 <ul>
 <li>Founder Strategy & Mindset</li>
 <li>Brand Clarity & Messaging</li>
 <li>Systems, Growth & Execution</li>
 <li>AI, Data & Workforce</li>
 </ul>

 <form>
 <input type="email" placeholder="Enter your email" />
 <button type="button">Subscribe <span>→</span></button>
 </form>

 <small>🔒 We respect your inbox. Unsubscribe anytime.</small>
 </aside>
 );
}

function InsideNotebook() {
 const inside = [
 ["cth-field-notes-icon-binoculars.png", "Quick Observations", "Short takes on what we are seeing in the market, in brands, and in the founder journey.", "See Observations"],
 ["cth-field-notes-icon-compass.png", "Frameworks & Models", "Practical tools and strategic frameworks to help you think clearly and build better.", "Explore Frameworks"],
 ["cth-field-notes-icon-open-book.png", "Recurring Themes", "The enduring principles behind strong brands, smart systems, and sustainable growth.", "View Themes"],
 ];

 return (
 <section className="fn-inside">
 <div className="fn-shell">
 <div className="fn-inside-title">
 <span />
 <p>Inside the Notebook</p>
 <span />
 </div>

 <div className="fn-inside-grid">
 {inside.map(([icon, title, text, cta]) => (
 <article key={title}>
 <img src={`${A}${icon}`} alt="" />
 <div>
 <h3>{title}</h3>
 <p>{text}</p>
 <Link to="/blog">{cta} <span>→</span></Link>
 </div>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function DiagnosticCTA() {
 return (
 <section className="fn-cta">
 <div className="fn-shell fn-cta-grid">
 <div className="fn-footer-seal">CTH</div>
 <div>
 <h2>Build With Clarity. Lead With Conviction.</h2>
 <p>Get a clear-eyed assessment of your brand, messaging, systems, and growth opportunities.</p>
 </div>
 <a href="/brand-diagnostic/">Start the Brand Diagnostic <span>→</span></a>
 </div>
 </section>
 );
}


export default function BlogJournalPage() {
 const { slug } = useParams();
 const selectedArticle = slug ? notes.find((note) => note.slug === slug) : null;

 if (slug) {
 return <ArticlePage article={selectedArticle} />;
 }

 return <FieldNotesIndex />;
}

function FieldNotesStyles() {
 return (
 <style>{`
 .fn-page {
 min-height: 100vh;
 background: #fbf7f1;
 color: #241536;
 font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 overflow-x: hidden;
 }

 .fn-shell {
 width: min(1240px, calc(100vw - 96px));
 margin: 0 auto;
 }

 .fn-eyebrow,
 .fn-section-label {
 margin: 0 0 20px;
 color: #9c1730;
 font-size: 12px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .18em;
 }

 .fn-line {
 width: 90px;
 height: 3px;
 background: #d0a24b;
 margin: 32px 0 28px;
 }

 .fn-hero {
 position: relative;
 padding: 70px 0 50px;
 }

 .fn-hero-column {
 position: absolute;
 left: -28px;
 top: 34px;
 width: 148px;
 height: 420px;
 opacity: .22;
 background: url("/about-assets/columns/cth-column-full-corinthian-blueprint.png") center/contain no-repeat;
 }

 .fn-hero-grid {
 display: grid;
 grid-template-columns: 0.8fr 1.2fr;
 align-items: center;
 gap: 48px;
 }

 .fn-hero h1 {
 margin: 0;
 max-width: 560px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: clamp(58px, 6vw, 84px);
 line-height: .94;
 letter-spacing: -.06em;
 color: #21133b;
 }

 .fn-hero-copy > p {
 max-width: 560px;
 margin: 0;
 color: #5a5665;
 font-size: 16px;
 line-height: 1.76;
 }

 .fn-hero-art {
 display: flex;
 justify-content: flex-end;
 align-items: center;
 }

 .fn-hero-art img {
 width: min(100%, 940px);
 display: block;
 }

 .fn-proof-row {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 34px;
 margin-top: 42px;
 }

 .fn-proof-row div {
 display: grid;
 grid-template-columns: 44px 1fr;
 gap: 14px;
 align-items: center;
 }

 .fn-proof-row span {
 color: #d0a24b;
 font-size: 28px;
 }

 .fn-proof-row strong {
 color: #5a5665;
 font-size: 13px;
 line-height: 1.4;
 }

 .fn-tabs-wrap {
 padding: 22px 0;
 }

 .fn-tabs {
 display: grid;
 grid-template-columns: repeat(8, 1fr);
 border: 1px solid #ead9ca;
 border-radius: 10px;
 overflow: hidden;
 }

 .fn-tabs button {
 min-height: 54px;
 background: rgba(255,255,255,.42);
 border: 0;
 border-right: 1px solid #ead9ca;
 color: #5b5464;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .07em;
 }

 .fn-tabs button.active {
 background: #951730;
 color: #fff;
 }

 .fn-main-section {
 padding: 34px 0 54px;
 }

 .fn-featured {
 display: grid;
 grid-template-columns: 1.05fr .95fr;
 gap: 44px;
 align-items: center;
 margin-bottom: 38px;
 }

 .fn-featured-img {
 position: relative;
 height: 340px;
 overflow: hidden;
 border-radius: 5px;
 background: #160b27;
 }

 .fn-featured-img img,
 .fn-card-img img {
 width: 100%;
 height: 100%;
 object-fit: cover;
 }

 .fn-image-watermark {
 position: absolute;
 top: 12px;
 right: 12px;
 left: auto;
 width: 26px;
 height: 26px;
 padding: 2px;
 opacity: .22;
 pointer-events: none;
 z-index: 2;
 object-fit: cover;
 border-radius: 999px;
 overflow: hidden;
 background: rgba(251, 247, 241, 0.18);
 border: 1px solid rgba(208, 162, 75, 0.18);
 mix-blend-mode: multiply;
 filter: none;
 }

 .fn-image-watermark.small {
 top: 10px;
 right: 10px;
 width: 20px;
 height: 20px;
 padding: 1px;
 opacity: .18;
 }

 .fn-mini-seal {
 position: absolute;
 left: 18px;
 top: 18px;
 width: 54px;
 height: 54px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 background: #761126;
 color: #f2c46d;
 border: 3px solid #d8aa55;
 font-family: Georgia, "Times New Roman", serif;
 font-weight: 700;
 font-size: 14px;
 }

 .fn-mini-seal.small {
 width: 42px;
 height: 42px;
 font-size: 11px;
 }

 .fn-mini-seal.static {
 position: static;
 }

 .fn-featured-copy h2 {
 margin: 0 0 22px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 48px;
 line-height: 1.02;
 letter-spacing: -.05em;
 color: #21133b;
 }

 .fn-featured-copy p {
 color: #5a5665;
 line-height: 1.7;
 }

 .fn-note-meta,
 .fn-card-meta {
 display: flex;
 flex-wrap: wrap;
 gap: 12px;
 color: #806f68;
 font-size: 12px;
 margin: 22px 0;
 }

 .fn-red-btn {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 padding: 14px 22px;
 background: #951730;
 color: #fff;
 border-radius: 4px;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }
.fn-content-grid {
 display: grid;
 grid-template-columns: 1fr 270px;
 gap: 30px;
 align-items: start;
 }

 .fn-section-head {
 display: flex;
 align-items: center;
 gap: 20px;
 margin-bottom: 20px;
 }

 .fn-section-head .fn-section-label {
 margin: 0;
 }

 .fn-section-head span {
 height: 1px;
 flex: 1;
 background: #d8c3ae;
 }

 .fn-card-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 18px;
 }

 .fn-card {
 background: rgba(255,255,255,.58);
 border: 1px solid #ead9ca;
 border-radius: 6px;
 overflow: hidden;
 }

 .fn-card-img {
 position: relative;
 height: 132px;
 background: #1d1131;
 overflow: hidden;
 }

 .fn-card-img img {
 opacity: .86;
 }

 .fn-card-body {
 padding: 16px;
 }

 .fn-card-category {
 margin: 0 0 8px;
 color: #9c1730;
 font-size: 10px;
 font-weight: 900;
 letter-spacing: .12em;
 text-transform: uppercase;
 }

 .fn-card h3 {
 margin: 0 0 10px;
 color: #241536;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 19px;
 line-height: 1.12;
 }

 .fn-card p {
 color: #625d6b;
 font-size: 13px;
 line-height: 1.55;
 }

 .fn-card a {
 color: #9c1730;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .fn-subscribe {
 background: linear-gradient(180deg, #2a123e, #170a25);
 color: #fff;
 border-radius: 9px;
 padding: 34px 28px;
 min-height: 650px;
 }

 .fn-subscribe > img {
 width: 64px;
 height: 64px;
 display: block;
 margin: 0 auto 28px;
 }

 .fn-subscribe h2 {
 margin: 0;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 36px;
 line-height: 1.08;
 text-align: center;
 }

 .fn-gold-line {
 width: 58px;
 height: 3px;
 background: #d0a24b;
 margin: 24px auto;
 }

 .fn-subscribe p,
 .fn-subscribe li,
 .fn-subscribe small {
 color: rgba(255,255,255,.72);
 line-height: 1.65;
 font-size: 13px;
 }

 .fn-subscribe ul {
 list-style: none;
 padding: 0;
 margin: 24px 0;
 }

 .fn-subscribe li {
 padding: 7px 0;
 }

 .fn-subscribe li:before {
 content: "◎";
 color: #d0a24b;
 margin-right: 8px;
 }

 .fn-subscribe input {
 width: 100%;
 height: 48px;
 box-sizing: border-box;
 border: 1px solid rgba(208,162,75,.36);
 background: transparent;
 color: white;
 border-radius: 4px;
 padding: 0 14px;
 }

 .fn-subscribe button {
 width: 100%;
 height: 50px;
 margin-top: 12px;
 border: 0;
 background: #b82038;
 color: white;
 border-radius: 4px;
 font-size: 11px;
 font-weight: 900;
 letter-spacing: .1em;
 text-transform: uppercase;
 }

 .fn-subscribe small {
 display: block;
 margin-top: 26px;
 }

 .fn-inside {
 padding: 18px 0 34px;
 }

 .fn-inside-title {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 18px;
 margin-bottom: 18px;
 }

 .fn-inside-title p {
 margin: 0;
 color: #5f4b5c;
 font-size: 14px;
 font-weight: 900;
 letter-spacing: .18em;
 text-transform: uppercase;
 }

 .fn-inside-title span {
 width: 70px;
 height: 1px;
 background: #d0a24b;
 }

 .fn-inside-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 border: 1px solid #ead9ca;
 border-radius: 9px;
 overflow: hidden;
 }

 .fn-inside-grid article {
 display: grid;
 grid-template-columns: 64px 1fr;
 gap: 22px;
 padding: 28px;
 background: rgba(255,255,255,.48);
 border-right: 1px solid #ead9ca;
 }

 .fn-inside-grid img {
 width: 58px;
 height: 58px;
 object-fit: contain;
 }

 .fn-inside-grid h3 {
 margin: 0 0 8px;
 font-family: Georgia, "Times New Roman", serif;
 color: #241536;
 font-size: 20px;
 }

 .fn-inside-grid p {
 margin: 0 0 12px;
 color: #625d6b;
 font-size: 13px;
 line-height: 1.5;
 }

 .fn-inside-grid a {
 color: #9c1730;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .fn-cta,
 .article-diagnostic {
 background: linear-gradient(135deg, #2a123e, #170a25);
 color: #fff;
 }

 .fn-cta {
 padding: 34px 0;
 }

 .fn-cta-grid,
 .article-diagnostic {
 display: grid;
 grid-template-columns: 96px 1fr auto;
 gap: 26px;
 align-items: center;
 }

 .fn-footer-seal {
 width: 78px;
 height: 78px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 background: #761126;
 color: #f2c46d;
 border: 3px solid #d8aa55;
 font-family: Georgia, "Times New Roman", serif;
 font-weight: 700;
 font-size: 20px;
 }

 .fn-cta h2,
 .article-diagnostic h2 {
 margin: 0 0 8px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 34px;
 font-weight: 400;
 }

 .fn-cta p,
 .article-diagnostic p {
 margin: 0;
 color: rgba(255,255,255,.74);
 }

 .fn-cta a,
 .article-diagnostic a {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 min-height: 52px;
 padding: 0 28px;
 background: #e1b65f;
 color: #241536;
 border-radius: 6px;
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .fn-trusted {
 padding: 24px 0 30px;
 text-align: center;
 }

 .fn-trusted p {
 margin: 0 0 22px;
 color: #9c1730;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .16em;
 text-transform: uppercase;
 }

 .fn-trusted div {
 display: flex;
 justify-content: center;
 gap: 52px;
 flex-wrap: wrap;
 color: rgba(36,21,54,.6);
 font-family: Georgia, "Times New Roman", serif;
 font-size: 22px;
 letter-spacing: .14em;
 text-transform: uppercase;
 }

 .article-hero {
 position: relative;
 padding: 38px 0 0;
 }

 .article-hero-grid {
 display: grid;
 grid-template-columns: 0.92fr 1.08fr;
 align-items: center;
 gap: 56px;
 }

 .breadcrumb {
 display: flex;
 flex-wrap: wrap;
 gap: 10px;
 align-items: center;
 margin-bottom: 48px;
 color: #837c88;
 font-size: 11px;
 }

 .breadcrumb a {
 color: #837c88;
 text-decoration: none;
 }

 .article-hero h1 {
 margin: 0;
 max-width: 720px;
 color: #21133b;
 font-family: Georgia, "Times New Roman", serif;
 font-size: clamp(54px, 5.8vw, 82px);
 line-height: .96;
 letter-spacing: -.06em;
 }

 .article-hero-copy > p {
 max-width: 620px;
 color: #5a5665;
 font-size: 16px;
 line-height: 1.76;
 }

 .article-hero-image {
 min-height: 390px;
 display: flex;
 align-items: center;
 justify-content: flex-end;
 overflow: hidden;
 }

 .article-hero-image img {
 width: min(100%, 760px);
 display: block;
 filter: drop-shadow(0 24px 40px rgba(36,21,54,.16));
 }

 .article-meta-bar {
 margin-top: 30px;
 display: grid;
 grid-template-columns: 1.4fr repeat(4, 1fr);
 align-items: center;
 background: rgba(255,255,255,.72);
 border: 1px solid #ead9ca;
 border-radius: 7px;
 min-height: 76px;
 }

 .author-block,
 .meta-item {
 min-height: 76px;
 display: flex;
 align-items: center;
 gap: 14px;
 padding: 0 28px;
 border-right: 1px solid #ead9ca;
 }

 .author-block small {
 display: block;
 color: #6f6874;
 font-size: 11px;
 }

 .author-block strong,
 .meta-item strong {
 display: block;
 color: #5a5362;
 font-size: 12px;
 }

 .meta-item span {
 color: #d0a24b;
 font-size: 24px;
 }

 .meta-action {
 appearance: none;
 border: 0;
 background: transparent;
 cursor: pointer;
 text-align: left;
 font-family: inherit;
 transition: background .18s ease, color .18s ease;
 }

 .meta-action:hover {
 background: rgba(149, 23, 48, .06);
 }

 .meta-action.saved span,
 .meta-action.saved strong {
 color: #951730;
 }

 .article-action-status {
 margin-top: 12px;
 color: #951730;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .08em;
 text-transform: uppercase;
 }

 .article-body-section {
 padding: 46px 0 34px;
 }

 .article-layout {
 display: grid;
 grid-template-columns: 250px minmax(0, 560px) 270px;
 gap: 42px;
 align-items: start;
 }

 .article-toc {
 position: sticky;
 top: 110px;
 }

 .article-toc ul {
 margin: 0;
 padding: 0;
 list-style: none;
 position: relative;
 }

 .article-toc ul:before {
 content: "";
 position: absolute;
 left: 6px;
 top: 8px;
 bottom: 8px;
 width: 1px;
 background: #d0a24b;
 }

 .article-toc li {
 display: grid;
 grid-template-columns: 14px 1fr;
 gap: 18px;
 margin-bottom: 24px;
 align-items: center;
 }

 .article-toc li span {
 width: 10px;
 height: 10px;
 border-radius: 999px;
 background: #d0a24b;
 position: relative;
 z-index: 2;
 }

 .article-toc a {
 color: #716978;
 text-decoration: none;
 font-size: 12px;
 font-weight: 700;
 }

 .toc-column-art {
 width: 340px;
 height: 720px;
 margin-top: 48px;
 margin-left: -78px;
 opacity: .22;
 background: url("/about-assets/columns/cth-column-full-corinthian-blueprint.png") center/contain no-repeat;
 }

 .article-content {
 border-left: 1px solid #ead9ca;
 padding-left: 42px;
 }

 .article-content > p {
 margin: 0 0 30px;
 color: #5a5665;
 font-size: 16px;
 line-height: 1.8;
 }

 .article-content h2 {
 margin: 28px 0 10px;
 color: #35224d;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 28px;
 line-height: 1.12;
 letter-spacing: -.03em;
 }

 .article-content blockquote {
 margin: 34px 0;
 border-top: 1px solid #d8c3ae;
 border-bottom: 1px solid #d8c3ae;
 padding: 24px 24px;
 text-align: center;
 color: #6e4a5f;
 font-family: Georgia, "Times New Roman", serif;
 }

 .article-content blockquote span {
 display: block;
 color: #d0a24b;
 font-size: 44px;
 line-height: 1;
 }

 .article-content blockquote p {
 margin: 0;
 font-size: 20px;
 line-height: 1.35;
 }

 .article-content > p a,
 .article-related a {
 color: #af0024;
 text-decoration: underline;
 text-underline-offset: 2px;
 text-decoration-thickness: 1px;
 font-weight: 600;
 transition: color .15s ease;
 }

 .article-content > p a:hover,
 .article-related a:hover {
 color: #e04e35;
 }

 .article-related {
 margin-top: 40px;
 padding-top: 22px;
 border-top: 1px solid #ead9ca;
 }

 .article-related .fn-section-label {
 margin: 0 0 12px;
 }

 .article-related ul {
 list-style: none;
 padding: 0;
 margin: 0;
 display: grid;
 gap: 8px;
 }

 .article-related li {
 font-size: 16px;
 line-height: 1.5;
 }

 .framework-box {
 border: 1px solid #d8c3ae;
 border-radius: 8px;
 margin: 34px 0;
 padding: 24px;
 }

 .framework-label {
 margin: 0 0 20px;
 color: #5f4b5c;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .16em;
 text-transform: uppercase;
 }

 .framework-grid {
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 gap: 14px;
 }

 .framework-grid div {
 text-align: center;
 border-right: 1px solid #ead9ca;
 padding: 0 8px;
 }

 .framework-grid span {
 color: #d0a24b;
 font-size: 30px;
 }

 .framework-grid strong {
 display: block;
 margin: 8px 0;
 color: #4e4058;
 font-size: 11px;
 text-transform: uppercase;
 }

 .framework-grid p {
 margin: 0;
 color: #716978;
 font-size: 11px;
 line-height: 1.4;
 }

 .article-side-rail {
 display: grid;
 gap: 28px;
 }

 .related-note {
 background: linear-gradient(180deg, #2a123e, #170a25);
 color: #fff;
 border-radius: 8px;
 padding: 22px;
 }

 .related-note > p {
 margin: 0 0 16px;
 color: rgba(255,255,255,.7);
 font-size: 12px;
 font-weight: 900;
 letter-spacing: .12em;
 text-transform: uppercase;
 }

 .related-note img {
 width: 100%;
 height: 142px;
 object-fit: cover;
 border-radius: 7px;
 }

 .related-note h3 {
 margin: 18px 0 10px;
 font-family: Georgia, "Times New Roman", serif;
 font-size: 27px;
 line-height: 1.05;
 }

 .related-note a {
 color: #d0a24b;
 text-decoration: none;
 font-size: 12px;
 }

 .article-diagnostic {
 margin-top: 16px;
 margin-bottom: 34px;
 border-radius: 7px;
 padding: 28px 36px;
 }

 .more-notes {
 padding: 0 0 34px;
 }

 .more-notes-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 28px;
 }

 @media (max-width: 1120px) {
 .fn-shell {
 width: min(100% - 40px, 920px);
 }

 .fn-hero-grid,
 .fn-featured,
 .fn-content-grid,
 .fn-cta-grid,
 .article-hero-grid,
 .article-meta-bar,
 .article-layout,
 .article-diagnostic {
 grid-template-columns: 1fr;
 }

 .fn-card-grid,
 .more-notes-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .fn-featured-sketch,
 .article-toc {
 display: none;
 }

 .fn-subscribe {
 min-height: auto;
 }

 .framework-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .article-content {
 border-left: 0;
 padding-left: 0;
 }
 }

 @media (max-width: 680px) {
 .fn-shell {
 width: min(100% - 28px, 560px);
 }

 .fn-hero h1,
 .article-hero h1 {
 font-size: 46px;
 }

 .fn-proof-row,
 .fn-card-grid,
 .more-notes-grid {
 grid-template-columns: 1fr;
 }

 .fn-tabs {
 display: flex;
 overflow-x: auto;
 }

 .fn-tabs button {
 min-width: 150px;
 }

 .fn-trusted div {
 gap: 22px;
 font-size: 16px;
 }

 .author-block,
 .meta-item {
 border-right: 0;
 border-bottom: 1px solid #ead9ca;
 }

 .framework-grid {
 grid-template-columns: 1fr;
 }
 }
 `}</style>
 );
}
