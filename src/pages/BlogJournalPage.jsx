import React from "react";
import { Link, useParams } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import { notes } from "../data/fieldNotes.mjs";

const A = "/field-notes-assets/";



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

// Field Notes index — architectural-editorial estate design. Article data comes
// from fieldNotes.mjs; the article detail view (ArticlePage) and its SEO are
// unchanged. Self-contained styles under .fnx-* so nothing collides with the
// article-page FieldNotesStyles.
const fnxCategories = [
  "All Notes",
  "Brand Strategy",
  "Messaging",
  "Systems",
  "Founder Growth",
  "Execution",
  "Offers",
  "AI + Workflows",
];

function FieldNotesIndex() {
  const [activeCategory, setActiveCategory] = React.useState("All Notes");
  const [query, setQuery] = React.useState("");

  const featured =
    notes.find((note) => note.slug === "what-is-a-brand-operating-system") || notes[0];

  const visibleNotes = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notes.filter((note) => {
      const categoryMatch = activeCategory === "All Notes" || note.category === activeCategory;
      const searchMatch =
        !normalized ||
        `${note.title} ${note.excerpt} ${note.category}`.toLowerCase().includes(normalized);
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, query]);

  return (
    <main className="fnx-page">
      <PublicHeader active="journal" />

      {/* ---------- hero ---------- */}
      <section className="fnx-hero">
        <div className="fnx-blueprint" aria-hidden="true" />
        <div className="fnx-shell fnx-hero-grid">
          <div className="fnx-hero-copy">
            <p className="fnx-kicker">Field Notes · From the House</p>
            <h1>
              Strategic thinking for founders
              <em> building what lasts.</em>
            </h1>
            <p className="fnx-lead">
              Clear observations on brand structure, messaging, offers, founder systems,
              and the decisions that make growth easier to hold.
            </p>
            <div className="fnx-actions">
              <a href="#fnx-archive" className="fnx-btn fnx-btn-crimson">
                Explore the Notes <span aria-hidden="true">↓</span>
              </a>
              <Link to="/brand-diagnostic/" className="fnx-textlink">
                Start the Brand Diagnostic <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="fnx-metrics">
              <div>
                <strong>{notes.length}</strong>
                <span>Active field notes</span>
              </div>
              <div>
                <strong>{fnxCategories.length - 1}</strong>
                <span>Strategic themes</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Founder focused</span>
              </div>
            </div>
          </div>

          <div className="fnx-hero-art">
            <img
              src={`${A}field-notes-hero-architecture.webp`}
              alt="Architectural rendering of the Core Truth House"
            />
            <div className="fnx-hero-caption">Editorial archive · Core Truth House</div>
          </div>
        </div>
      </section>

      {/* ---------- principle band ---------- */}
      <section className="fnx-band">
        <div className="fnx-shell fnx-band-grid">
          <div>
            <span>01</span>
            <p>Clarity before content.</p>
          </div>
          <div>
            <span>02</span>
            <p>Structure before scale.</p>
          </div>
          <div>
            <span>03</span>
            <p>Truth before tactics.</p>
          </div>
          <div className="fnx-band-copy">
            Notes for the founder who is done collecting ideas and ready to build a brand
            that holds.
          </div>
        </div>
      </section>

      {/* ---------- featured / load-bearing note ---------- */}
      <section className="fnx-featured-section">
        <div className="fnx-shell">
          <div className="fnx-intro">
            <p className="fnx-kicker crimson">Start here</p>
            <h2>The load-bearing note.</h2>
          </div>

          <article className="fnx-featured">
            <div className="fnx-featured-img">
              <img src={`${A}field-notes-light-sketch.webp`} alt="" />
              <div className="fnx-featured-tag">Field Note 001</div>
            </div>
            <div className="fnx-featured-body">
              <p className="fnx-note-cat">{featured.category}</p>
              <h3>{featured.title}</h3>
              <p className="fnx-featured-excerpt">{featured.excerpt}</p>
              <div className="fnx-note-meta">
                <span>{featured.read}</span>
                <span>Core Truth House Editorial</span>
              </div>
              <Link to={`/blog/${featured.slug}`} className="fnx-btn fnx-btn-crimson">
                Read the Field Note <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- the active archive ---------- */}
      <section className="fnx-library" id="fnx-archive">
        <div className="fnx-shell">
          <div className="fnx-library-head">
            <div>
              <p className="fnx-kicker crimson">The active archive</p>
              <h2>Notes for every room in the House.</h2>
            </div>
            <label className="fnx-search">
              <span>Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Positioning, systems, offers…"
              />
            </label>
          </div>

          <div className="fnx-tabs" role="tablist" aria-label="Field Note categories">
            {fnxCategories.map((category) => (
              <button
                type="button"
                key={category}
                role="tab"
                aria-selected={activeCategory === category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="fnx-grid">
            {visibleNotes.map((note, index) => (
              <article className="fnx-card" key={note.slug}>
                <Link
                  to={`/blog/${note.slug}`}
                  className="fnx-card-img"
                  aria-label={`Read ${note.title}`}
                >
                  <img
                    src={`${A}${index % 2 === 0 ? "field-notes-gold-sketch.webp" : "field-notes-light-sketch.webp"}`}
                    alt=""
                    loading="lazy"
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </Link>
                <div className="fnx-card-body">
                  <p className="fnx-note-cat">{note.category}</p>
                  <h3>
                    <Link to={`/blog/${note.slug}`}>{note.title}</Link>
                  </h3>
                  <p className="fnx-card-excerpt">{note.excerpt}</p>
                  <div className="fnx-card-foot">
                    <span>{note.read}</span>
                    <Link to={`/blog/${note.slug}`}>
                      Read note <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleNotes.length === 0 && (
            <div className="fnx-empty">
              <h3>No notes match that search.</h3>
              <button
                type="button"
                className="fnx-btn fnx-btn-ghost"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("All Notes");
                }}
              >
                Reset the archive
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---------- editorial quote ---------- */}
      <section className="fnx-quote">
        <div className="fnx-quote-bg" aria-hidden="true">
          <img src={`${A}field-notes-dark-blueprint.webp`} alt="" />
        </div>
        <div className="fnx-shell fnx-quote-inner">
          <blockquote>
            A serious brand does not need more noise. It needs a clearer structure for the
            truth it already carries.
          </blockquote>
          <p>Core Truth House Field Notes</p>
        </div>
      </section>

      {/* ---------- subscribe ---------- */}
      <section className="fnx-subscribe">
        <div className="fnx-shell fnx-subscribe-grid">
          <div>
            <p className="fnx-kicker gold">Notes from the architect</p>
            <h2>Get the next Field Note when it leaves the House.</h2>
            <p className="fnx-subscribe-note">One useful strategic note at a time. No content flood.</p>
          </div>
          <form className="fnx-subscribe-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span>Email address</span>
              <input type="email" placeholder="you@yourbrand.com" aria-label="Email address" />
            </label>
            <button type="submit" className="fnx-btn fnx-btn-gold">
              Enter the Archive <span aria-hidden="true">↗</span>
            </button>
          </form>
        </div>
      </section>

      <PublicFooter />
      <FieldNotesIndexStyles />
    </main>
  );
}

function FieldNotesIndexStyles() {
  return (
    <style>{`
      .fnx-page {
        --fnx-ink: #33033c;
        --fnx-night: #0d0010;
        --fnx-crimson: #af0024;
        --fnx-gold: #c4a95b;
        --fnx-ivory: #f8f1ec;
        --fnx-blush: #efe3df;
        --fnx-panel: #fffaf5;
        --fnx-line: rgba(51, 3, 60, 0.15);
        --fnx-serif: "Playfair Display", Georgia, serif;
        --fnx-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        background: var(--fnx-ivory);
        color: var(--fnx-ink);
        font-family: var(--fnx-sans);
        overflow-x: hidden;
      }
      .fnx-page *, .fnx-page *::before, .fnx-page *::after { box-sizing: border-box; }
      .fnx-shell { width: min(1240px, calc(100% - 48px)); margin: 0 auto; position: relative; z-index: 2; }

      .fnx-page h1, .fnx-page h2, .fnx-page h3, .fnx-page blockquote {
        font-family: var(--fnx-serif); font-weight: 600; letter-spacing: -0.02em;
        text-wrap: balance;
      }

      .fnx-kicker { margin: 0 0 18px; color: var(--fnx-gold); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.19em; text-transform: uppercase; }
      .fnx-kicker.crimson { color: var(--fnx-crimson); }
      .fnx-kicker.gold { color: var(--fnx-gold); }

      /* buttons */
      .fnx-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 24px; border: 1px solid transparent; border-radius: 4px; font-family: var(--fnx-sans); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.11em; text-transform: uppercase; text-decoration: none; cursor: pointer; transition: transform 0.15s ease; }
      .fnx-btn:hover { transform: translateY(-1px); }
      .fnx-btn-crimson { background: var(--fnx-crimson); color: #fff7ec; }
      .fnx-btn-gold { background: var(--fnx-gold); color: var(--fnx-night); }
      .fnx-btn-ghost { background: transparent; border-color: var(--fnx-line); color: var(--fnx-ink); }
      .fnx-textlink { color: var(--fnx-ink); text-decoration: none; font-size: 0.74rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
      .fnx-textlink:hover { color: var(--fnx-crimson); }

      /* hero */
      .fnx-hero { position: relative; background: linear-gradient(180deg, #fffaf5, #f8f1ec); border-bottom: 1px solid var(--fnx-line); }
      .fnx-blueprint { position: absolute; inset: 0; opacity: 0.28; pointer-events: none; background-image: linear-gradient(rgba(51,3,60,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(51,3,60,0.08) 1px, transparent 1px); background-size: 56px 56px; mask-image: linear-gradient(to right, transparent, black 36%, black); -webkit-mask-image: linear-gradient(to right, transparent, black 36%, black); }
      .fnx-hero-grid { display: grid; grid-template-columns: 0.92fr 1.08fr; align-items: center; gap: 54px; padding: 72px 0 48px; }
      .fnx-hero h1 { margin: 0; max-width: 640px; font-size: clamp(2.9rem, 5.4vw, 5rem); line-height: 0.98; color: var(--fnx-ink); }
      .fnx-hero h1 em { display: block; color: var(--fnx-crimson); font-style: italic; }
      .fnx-lead { max-width: 540px; margin: 26px 0 0; color: #6d5866; font-size: 1.08rem; line-height: 1.6; }
      .fnx-actions { display: flex; flex-wrap: wrap; gap: 22px; align-items: center; margin-top: 30px; }
      .fnx-metrics { display: flex; flex-wrap: wrap; margin-top: 44px; border-top: 1px solid var(--fnx-line); border-bottom: 1px solid var(--fnx-line); }
      .fnx-metrics div { padding: 18px 24px 18px 0; margin-right: 24px; border-right: 1px solid var(--fnx-line); }
      .fnx-metrics div:last-child { border-right: 0; margin-right: 0; }
      .fnx-metrics strong { display: block; color: var(--fnx-crimson); font-family: var(--fnx-serif); font-weight: 600; font-size: 2rem; line-height: 1; }
      .fnx-metrics span { color: #77626f; font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase; }
      .fnx-hero-art img { width: 100%; max-height: 620px; object-fit: contain; }
      .fnx-hero-caption { margin-top: 6px; color: #866f7c; text-align: center; font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; }

      /* principle band */
      .fnx-band { background: var(--fnx-night); color: #fff; }
      .fnx-band-grid { display: grid; grid-template-columns: repeat(3, 0.65fr) 1.55fr; }
      .fnx-band-grid > div { min-height: 128px; padding: 28px 24px; border-right: 1px solid rgba(196,169,91,0.23); display: flex; flex-direction: column; justify-content: center; }
      .fnx-band-grid > div:last-child { border-right: 0; }
      .fnx-band span { color: var(--fnx-gold); font-family: var(--fnx-serif); font-weight: 600; font-size: 1.7rem; }
      .fnx-band p { margin: 5px 0 0; color: rgba(255,255,255,0.75); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; }
      .fnx-band-copy { color: rgba(255,255,255,0.7); font-family: var(--fnx-serif); font-weight: 400; font-size: 1.2rem; line-height: 1.45; letter-spacing: -0.01em; }

      /* featured */
      .fnx-featured-section, .fnx-library { padding: 104px 0; }
      .fnx-intro { margin-bottom: 44px; }
      .fnx-intro h2, .fnx-library-head h2, .fnx-subscribe h2 { margin: 0; font-size: clamp(2.6rem, 4.6vw, 4.4rem); line-height: 0.96; }
      .fnx-featured { display: grid; grid-template-columns: 1.05fr 0.95fr; min-height: 480px; border: 1px solid var(--fnx-line); background: var(--fnx-panel); border-radius: 6px; overflow: hidden; }
      .fnx-featured-img { position: relative; overflow: hidden; background: var(--fnx-blush); }
      .fnx-featured-img img { width: 100%; height: 100%; object-fit: cover; }
      .fnx-featured-tag { position: absolute; left: 22px; bottom: 20px; padding: 9px 12px; background: var(--fnx-night); color: var(--fnx-gold); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
      .fnx-featured-body { padding: 52px; display: flex; flex-direction: column; justify-content: center; }
      .fnx-note-cat { margin: 0 0 14px; color: var(--fnx-crimson); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
      .fnx-featured-body h3 { margin: 0; font-size: clamp(2.2rem, 3.4vw, 3.4rem); line-height: 1.0; }
      .fnx-featured-excerpt { color: #715c69; line-height: 1.7; margin: 16px 0 0; }
      .fnx-note-meta { display: flex; flex-wrap: wrap; gap: 18px; margin: 20px 0 28px; color: #8a7480; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }

      /* library */
      .fnx-library { background: var(--fnx-blush); }
      .fnx-library-head { display: flex; justify-content: space-between; gap: 50px; align-items: end; }
      .fnx-search { width: min(340px, 100%); }
      .fnx-search span { display: block; margin-bottom: 8px; font-size: 0.66rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
      .fnx-search input { width: 100%; height: 50px; padding: 0 15px; border: 1px solid var(--fnx-line); border-radius: 4px; background: rgba(255,255,255,0.7); color: var(--fnx-ink); font-family: var(--fnx-sans); font-size: 0.95rem; }
      .fnx-search input:focus { outline: none; border-color: var(--fnx-crimson); }
      .fnx-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 40px 0; }
      .fnx-tabs button { min-height: 40px; padding: 0 15px; border: 1px solid var(--fnx-line); border-radius: 4px; background: transparent; color: var(--fnx-ink); font-family: var(--fnx-sans); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; }
      .fnx-tabs button:hover { border-color: var(--fnx-ink); }
      .fnx-tabs button.active { background: var(--fnx-ink); border-color: var(--fnx-ink); color: #fff; }

      .fnx-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
      .fnx-card { display: flex; flex-direction: column; background: rgba(255,250,245,0.86); border: 1px solid var(--fnx-line); border-radius: 6px; overflow: hidden; }
      .fnx-card-img { position: relative; display: block; height: 220px; overflow: hidden; background: #fff; }
      .fnx-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
      .fnx-card:hover .fnx-card-img img { transform: scale(1.03); }
      .fnx-card-img span { position: absolute; top: 14px; left: 14px; width: 38px; height: 38px; display: grid; place-items: center; background: var(--fnx-night); color: var(--fnx-gold); font-family: var(--fnx-serif); font-weight: 600; }
      .fnx-card-body { display: flex; flex-direction: column; flex: 1; padding: 26px; }
      .fnx-card-body h3 { margin: 0; font-size: 1.6rem; line-height: 1.06; }
      .fnx-card-body h3 a { color: var(--fnx-ink); text-decoration: none; }
      .fnx-card-body h3 a:hover { color: var(--fnx-crimson); }
      .fnx-card-excerpt { flex: 1; margin: 12px 0 0; color: #725d69; font-size: 0.92rem; line-height: 1.55; }
      .fnx-card-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--fnx-line); font-size: 0.66rem; letter-spacing: 0.07em; text-transform: uppercase; color: #8a7480; }
      .fnx-card-foot a { color: var(--fnx-crimson); text-decoration: none; font-weight: 600; }
      .fnx-empty { padding: 60px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
      .fnx-empty h3 { font-size: 1.6rem; }

      /* editorial quote */
      .fnx-quote { position: relative; padding: 104px 0; background: var(--fnx-night); color: #fff; overflow: hidden; }
      .fnx-quote-bg { position: absolute; inset: 0; opacity: 0.45; }
      .fnx-quote-bg img { width: 100%; height: 100%; object-fit: cover; }
      .fnx-quote-inner { text-align: center; }
      .fnx-quote blockquote { max-width: 900px; margin: 0 auto; font-weight: 500; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1.14; color: #fff; }
      .fnx-quote blockquote::before { content: "\\201C"; }
      .fnx-quote blockquote::after { content: "\\201D"; }
      .fnx-quote-inner p { margin-top: 22px; color: var(--fnx-gold); font-size: 0.66rem; letter-spacing: 0.17em; text-transform: uppercase; }

      /* subscribe */
      .fnx-subscribe { padding: 100px 0; background: var(--fnx-ink); color: #fff; }
      .fnx-subscribe-grid { display: grid; grid-template-columns: 1fr 0.75fr; gap: 72px; align-items: center; }
      .fnx-subscribe h2 { color: #fff; }
      .fnx-subscribe-note { color: rgba(255,255,255,0.68); margin: 14px 0 0; }
      .fnx-subscribe-form label span { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.7); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; }
      .fnx-subscribe-form input { width: 100%; height: 52px; padding: 0 15px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: rgba(255,255,255,0.06); color: #fff; font-family: var(--fnx-sans); font-size: 0.95rem; }
      .fnx-subscribe-form input:focus { outline: none; border-color: var(--fnx-gold); }
      .fnx-subscribe-form button { width: 100%; margin-top: 12px; }

      @media (max-width: 1050px) {
        .fnx-hero-grid, .fnx-featured, .fnx-subscribe-grid { grid-template-columns: 1fr; }
        .fnx-hero-art { max-width: 720px; margin: 0 auto; }
        .fnx-band-grid { grid-template-columns: repeat(2, 1fr); }
        .fnx-band-grid > div:nth-child(2) { border-right: 0; }
        .fnx-grid { grid-template-columns: repeat(2, 1fr); }
        .fnx-library-head { flex-direction: column; align-items: start; }
      }
      @media (max-width: 640px) {
        .fnx-shell { width: min(100% - 32px, 1240px); }
        .fnx-hero-grid { padding: 54px 0 34px; gap: 26px; }
        .fnx-metrics { flex-wrap: wrap; }
        .fnx-band-grid, .fnx-grid { grid-template-columns: 1fr; }
        .fnx-band-grid > div { border-right: 0; border-bottom: 1px solid rgba(196,169,91,0.2); }
        .fnx-featured-section, .fnx-library, .fnx-quote, .fnx-subscribe { padding: 72px 0; }
        .fnx-featured { min-height: 0; }
        .fnx-featured-img { min-height: 260px; }
        .fnx-featured-body { padding: 32px 24px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .fnx-btn, .fnx-card-img img { transition: none; }
      }
    `}</style>
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
