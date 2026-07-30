// Estate concept — ABOUT. The story of the house: why it exists, what it
// believes, and who drew the plans. Content tracks the live About page.

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const VALUES = [
  { name: "Clarity", body: "We uncover the truth at the core of your brand so every decision, message, and move is aligned and intentional." },
  { name: "Structure", body: "We build the foundation, frameworks, systems, and assets so your brand is strong, scalable, and future-ready." },
  { name: "Execution", body: "We turn strategy into action with disciplined processes that drive momentum and market leadership." },
  { name: "Optimization", body: "We measure, learn, and refine continuously to compound your brand's growth and long-term performance." },
];

const PHILOSOPHY = [
  { name: "Truth Before Tactics", body: "We start with truth because strategy without truth is just noise." },
  { name: "Brand is the Business", body: "Your brand isn't a logo. It's your leadership, your promise, and your proof." },
  { name: "Systems Create Freedom", body: "The right systems don't limit you, they free you to lead at the highest level." },
  { name: "Execution is Everything", body: "Ideas are easy. Execution is where legacy is built." },
  { name: "Compounding Over Time", body: "We build for long-term impact, not short-term impressions." },
];

export default function EstateAboutPage() {
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = "About — Core Truth House";
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
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
      });
      return () => split.revert();
    }, rootRef);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <section className="ec-subhero" aria-label="About Core Truth House">
        <div className="ec-subhero-bg">
          <img src="/cth-frontpage-architecture.webp" alt="" />
        </div>
        <div className="ec-subhero-copy">
          <span className="ec-eyebrow">About Core Truth House</span>
          <h1 className="ec-h1">
            Where serious brands <em>find their structure</em>.
          </h1>
          <p className="ec-lede">
            Core Truth House is a Brand Operating System for solo service-based founders who are
            visible, consistent, and ready to turn scattered brand decisions into one clear
            system.
          </p>
          <div className="ec-build-ctas">
            <Link to="/brand-diagnostic/" className="ec-btn ec-btn-crimson">
              Start Diagnostic <span className="ec-btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="ec-arc ec-sheet" aria-label="Why Core Truth House exists">
        <div className="ec-arc-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet AB-001</span>
              <span>Why the house exists</span>
            </div>
            <h2 className="ec-h2">
              Too many tools. Too many disconnected decisions.{" "}
              <em>Not enough brand memory.</em>
            </h2>
          </div>
          <div className="ec-arc-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="ec-arc-card">
              <span className="ec-arc-no">the founder we built for</span>
              <span className="ec-arc-body">
                We built Core Truth House for the founder who is doing the work, showing up,
                creating content, serving clients, and still wondering why the pipeline does not
                match the effort.
              </span>
              <span className="ec-arc-title">CTH was built to bring the brand back into one system.</span>
            </div>
            <div className="ec-arc-card">
              <span className="ec-arc-no">the real problem</span>
              <span className="ec-arc-body">
                Most founders do not have a brand problem because they lack ideas. They have a
                brand problem because their decisions live everywhere: notes, prompts, Canva
                files, sales pages, emails, and memory.
              </span>
              <span className="ec-arc-body">
                We built Core Truth House to bring those decisions together. One system. One
                source of truth. One operating rhythm for messaging, offers, content, sales
                pages, and funnels.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="ec-vault" aria-label="Mission and vision">
        <div className="ec-vault-inner ec-reveal">
          <div>
            <div className="ec-titleblock is-dark" style={{ marginBottom: 26 }}>
              <span className="ec-titleblock-no">Sheet AB-100</span>
              <span>Mission</span>
            </div>
            <h2 className="ec-h2">
              Stronger brand decisions. More consistent <em>conversion</em>.
            </h2>
            <p className="ec-vault-def">
              To give serious founders the clarity, structure, and execution system they need to
              make stronger brand decisions and convert with more consistency.
            </p>
          </div>
          <div className="ec-vault-holds">
            <div className="ec-vault-holds-head">Our vision</div>
            <ul>
              <li>
                A world where founders stop rebuilding their brand from scratch and start
                operating from a connected source of truth.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ec-arc ec-sheet" aria-label="The four pillars of our house">
        <div className="ec-arc-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet AB-200</span>
              <span>Core values</span>
            </div>
            <h2 className="ec-h2">
              The four pillars of our <em>house</em>.
            </h2>
          </div>
          <div className="ec-proofs">
            {VALUES.map((v) => (
              <div className="ec-proof" key={v.name}>
                <span className="ec-proof-title">{v.name}</span>
                <span className="ec-proof-body">{v.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-faq" aria-label="The founder">
        <div className="ec-faq-inner ec-reveal">
          <div className="ec-faq-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet AB-300</span>
              <span>Founder &amp; CEO</span>
            </div>
            <h2 className="ec-h2">
              Sha B. — the architect of the <em>house</em>.
            </h2>
            <p className="ec-lede">
              Sha B. is a brand strategist, operator, and builder helping founders turn scattered
              ideas into structured brand systems. She built Core Truth House to be the operating
              system she wished existed when brand strategy, content, offers, and execution were
              all living in separate places.
            </p>
          </div>
          <div className="ec-plaque">
            <span className="ec-plaque-quote">
              "A serious brand cannot live in scattered files and memory. It needs a house, a
              system, and a rhythm that helps every decision stay aligned."
            </span>
            <span className="ec-plaque-name">Sha B. — Founder &amp; CEO, Core Truth House</span>
          </div>
          <div className="ec-arc-head" style={{ marginTop: 24 }}>
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet AB-400</span>
              <span>How we think</span>
            </div>
          </div>
          <div className="ec-proofs" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {PHILOSOPHY.map((p) => (
              <div className="ec-proof" key={p.name}>
                <span className="ec-proof-title" style={{ fontSize: 17 }}>{p.name}</span>
                <span className="ec-proof-body">{p.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-commission" aria-label="Start with structure">
        <div className="ec-commission-bg" aria-hidden="true">
          <img src="/estate-assets/interior-lobby.webp" alt="" />
        </div>
        <div className="ec-commission-copy ec-reveal">
          <span className="ec-commission-handnote">start with structure</span>
          <h2 className="ec-h2">
            See where your brand is <em>leaking conversion</em>.
          </h2>
          <p className="ec-commission-note">
            Start the Brand Diagnostic and get a clear read on the structural gaps holding your
            messaging, offers, content, or funnel back.
          </p>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold">
            Start Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
