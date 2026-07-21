// Estate concept — TIERS. "Choose the House Your Brand Is Ready For" —
// the full schedule of finishes: residencies, capability comparison,
// sample diagnostic score, value cards, and tier FAQs.

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const ASSET = (name) => `/estate-assets/${name}`;

const ROOMS = [
  {
    floor: "B1", tier: "Foundation", price: "$47",
    desc: "Below grade, where every estate begins. Clarify who you are, who you serve, and the position you own.",
    specs: ["Brand Foundation Builder", "Audience Clarity Tool", "Positioning Generator", "Content Studio Basics"],
  },
  {
    floor: "L1", tier: "Structure", price: "$97", featured: true,
    desc: "Where systems take shape and legacy is engineered. Turn clarity into a repeatable operating structure.",
    specs: ["Systems Builder and SOPs", "Offer Builder Guide", "Saved Brand Memory", "Decision Rules Framework"],
  },
  {
    floor: "L2", tier: "House", price: "$297",
    desc: "The visible brand, finished and furnished. Package the identity and plan the launches.",
    specs: ["Identity Studio Guide", "Launch Planner", "Brand Kit Export"],
  },
  {
    floor: "PH", tier: "Estate", price: "$697",
    desc: "Legacy. Influence. Generations. Team seats, client vaults, and your name over the door.",
    specs: ["Team Seats Setup", "Client Brand Vaults", "White-Label Exports"],
  },
];

/* feature → [Foundation, Structure, House, Estate] */
const COMPARE = [
  ["Brand Foundation", 1, 1, 1, 1],
  ["Brand Positioning", 1, 1, 1, 1],
  ["Messaging Structure", 1, 1, 1, 1],
  ["Audience Clarity", 1, 1, 1, 1],
  ["Identity Studio", 1, 1, 1, 1],
  ["Strategic OS", 1, 1, 1, 1],
  ["Content Studio", 1, 1, 1, 1],
  ["Basic Analytics", 1, 1, 1, 1],
  ["Campaign Builder", 0, 1, 1, 1],
  ["Offer Builder", 0, 1, 1, 1],
  ["Prompt Generator", 0, 1, 1, 1],
  ["Brand Memory", 0, 1, 1, 1],
  ["Media Studio", 0, 0, 1, 1],
  ["Social Planner", 0, 0, 1, 1],
  ["Team Seats", 0, 0, 0, 1],
  ["Client Vaults", 0, 0, 0, 1],
];

const SCORES = [
  ["Clarity", 62],
  ["Structure", 48],
  ["Execution", 39],
  ["Optimization", 33],
];

const VALUE_CARDS = [
  { title: "A Clear Path Forward", body: "Every tier gives you a proven framework so you always know what to build next." },
  { title: "Cumulative Growth", body: "Your work, assets, and systems carry upward, never starting over." },
  { title: "Strategic Depth", body: "Each level adds the clarity, systems, and execution support your brand is ready to hold." },
  { title: "Scalable Infrastructure", body: "Designed to support you now and expand as your team, offers, and clients grow." },
];

const FAQS = [
  { q: "Are the tiers cumulative?", a: "Yes. Each tier builds on the last so your brand foundation, systems, assets, and strategic memory continue moving forward." },
  { q: "Which tier is best to start with?", a: "Most founders start with Foundation to clarify their brand, then move to Structure when they are ready to build their operating system. Structure is our most chosen tier because it is where brand clarity becomes brand execution." },
  { q: "Can I upgrade later?", a: "Yes. The tier system is designed to grow with your brand, your offers, and your operating needs." },
  { q: "Is the Brand Diagnostic free?", a: "Yes. The diagnostic is the fastest way to understand where your brand structure is strong and where it needs support." },
  { q: "What happens to my saved work when I upgrade?", a: "Your saved brand work moves with you. The goal is to deepen your system, not restart it." },
];

export default function EstateTiersPage() {
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = "Tiers — Core Truth House";
  }, []);

  useEffect(() => {
    document.querySelector(".ec-nav")?.classList.add("is-solid");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".ec-subhero .ec-h1", { type: "lines", mask: "lines", linesClass: "ec-line" });
      gsap.from(split.lines, { yPercent: 115, duration: 1.2, ease: "power4.out", stagger: 0.12, delay: 0.25 });
      gsap.from(".ec-subhero .ec-eyebrow, .ec-subhero .ec-lede, .ec-subhero .ec-build-ctas", {
        opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.6,
      });
      document.querySelector(".ec-nav")?.classList.add("is-solid");
      gsap.utils.toArray(".ec-reveal").forEach((el) => {
        gsap.from(el.children, {
          opacity: 0, y: 32, duration: 1, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });
      gsap.utils.toArray(".ec-score-fill").forEach((el) => {
        gsap.from(el, {
          scaleX: 0, transformOrigin: "left center", duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      return () => split.revert();
    }, rootRef);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <section className="ec-subhero is-dark" aria-label="Choose the house your brand is ready for">
        <div className="ec-subhero-bg">
          <img src={ASSET("room-estate.webp")} alt="" />
        </div>
        <div className="ec-subhero-copy">
          <span className="ec-eyebrow">Tiers</span>
          <h1 className="ec-h1">
            Choose the house your brand is <em>ready for</em>.
          </h1>
          <p className="ec-lede">
            Each Core Truth House tier gives founders more clarity, more structure, and more
            execution power so your brand can grow with precision and lead with impact.
          </p>
          <div className="ec-build-ctas">
            <Link to="/brand-diagnostic/" className="ec-btn ec-btn-crimson">
              Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
            </Link>
            <a href="#compare" className="ec-btn ec-btn-gold">
              What expands at each tier
            </a>
          </div>
        </div>
      </section>

      <div className="ec-cumulative-band">
        all tiers are <strong>cumulative</strong> — each level builds on the last so you always move forward
      </div>

      {/* residency table (schedule of finishes) */}
      <section className="ec-spec" id="residency" aria-label="Residency plans">
        <div className="ec-spec-inner ec-reveal">
          <div className="ec-spec-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet T-100</span>
              <span>Schedule of finishes</span>
              <span>Residency</span>
            </div>
            <h2 className="ec-h2">
              Choose your <em>residency</em>.
            </h2>
            <p className="ec-lede">
              Built for how serious brands grow. Every residency starts with the Brand
              Diagnostic — move up a floor whenever the build demands it. The plans travel with
              you.
            </p>
          </div>

          <div className="ec-spec-grid">
            {ROOMS.map((room) => (
              <div className={`ec-spec-col${room.featured ? " is-featured" : ""}`} key={room.tier}>
                {room.featured && <span className="ec-spec-flag">most chosen</span>}
                <span className="ec-spec-floor">Floor {room.floor}</span>
                <span className="ec-spec-name">{room.tier}</span>
                <span className="ec-spec-price">
                  {room.price}
                  <span>/mo</span>
                </span>
                <p className="ec-spec-desc">{room.desc}</p>
                <ul>
                  {room.specs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <Link
                  to="/brand-diagnostic/"
                  className={`ec-btn ${room.featured ? "ec-btn-gold" : "ec-btn-ghost"}`}
                >
                  Start the Diagnostic
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* comparison table */}
      <section className="ec-arc ec-sheet" id="compare" aria-label="What expands at each tier">
        <div className="ec-arc-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet T-200</span>
              <span>What expands at each tier</span>
            </div>
            <h2 className="ec-h2">
              Your brand does not need more noise.{" "}
              <em>It needs the right structure at the right stage.</em>
            </h2>
          </div>
          <div className="ec-compare">
            <table>
              <thead>
                <tr>
                  <th>Core capabilities</th>
                  <th>Foundation · $47/mo</th>
                  <th className="is-featured">Structure · $97/mo</th>
                  <th>House · $297/mo</th>
                  <th>Estate · $697/mo</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([feature, f, s, h, e]) => (
                  <tr key={feature}>
                    <td>{feature}</td>
                    {[f, s, h, e].map((v, i) => (
                      <td key={i} className={i === 1 ? "is-featured" : undefined}>
                        {v ? <span className="ec-tick">✓</span> : <span className="ec-dash">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* diagnostic placement */}
      <section className="ec-vault" aria-label="Find your best starting point">
        <div className="ec-vault-inner ec-reveal">
          <div>
            <div className="ec-titleblock is-dark" style={{ marginBottom: 26 }}>
              <span className="ec-titleblock-no">Sheet T-300</span>
              <span>Not sure where you belong?</span>
            </div>
            <h2 className="ec-h2">
              Find your best starting point with the <em>Brand Diagnostic</em>.
            </h2>
            <p className="ec-vault-def">
              The diagnostic reads the structure behind your brand, then points you toward the
              tier that closes the right gap first.
            </p>
            <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold" style={{ marginTop: 26 }}>
              Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
            </Link>
          </div>
          <div className="ec-scorecard">
            <div className="ec-scorecard-head">Sample diagnostic score</div>
            <div className="ec-scorecard-rows">
              {SCORES.map(([label, v]) => (
                <div className="ec-scorecard-row" key={label}>
                  <span className="ec-score-label">{label}</span>
                  <span className="ec-score-bar">
                    <span className="ec-score-fill" style={{ width: `${v}%` }} />
                  </span>
                  <span className="ec-score-value">{v}/100</span>
                </div>
              ))}
            </div>
            <div className="ec-scorecard-foot">
              <span className="ec-hand-note">
                recommended starting tier: Structure — build the systems that turn your strategy
                into execution.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* value cards */}
      <section className="ec-arc ec-sheet" aria-label="Built for serious founders">
        <div className="ec-arc-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet T-400</span>
              <span>Built for serious founders</span>
            </div>
            <h2 className="ec-h2">
              The path is structured so your brand can hold the next <em>level</em>.
            </h2>
          </div>
          <div className="ec-proofs">
            {VALUE_CARDS.map((v) => (
              <div className="ec-proof" key={v.title}>
                <span className="ec-proof-title">{v.title}</span>
                <span className="ec-proof-body">{v.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* tier FAQ */}
      <section className="ec-faq" aria-label="Clear answers before you choose">
        <div className="ec-faq-inner ec-reveal">
          <div className="ec-faq-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet T-500</span>
              <span>Frequently asked questions</span>
            </div>
            <h2 className="ec-h2">
              Clear answers before you <em>choose</em>.
            </h2>
          </div>
          <div className="ec-faq-list">
            {FAQS.map((f) => (
              <details className="ec-faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <div className="ec-faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-commission" aria-label="Ready to choose your next level">
        <div className="ec-commission-bg" aria-hidden="true">
          <img src={ASSET("estate-exterior.webp")} alt="" />
        </div>
        <div className="ec-commission-copy ec-reveal">
          <span className="ec-commission-handnote">ready to choose your next level?</span>
          <h2 className="ec-h2">
            Start with clarity. Build with <em>structure</em>.
          </h2>
          <p className="ec-commission-note">
            Discover the right tier for your brand and start building a business that leads.
          </p>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold">
            Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
