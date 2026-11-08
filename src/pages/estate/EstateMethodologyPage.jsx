// Estate concept — THE SYSTEM (methodology). The Core Truth Method™ presented
// as the drawing set itself: four connected layers, one operating system.

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { SheetLink } from "./EstateShell";

const LAYERS = [
  {
    no: "01",
    name: "Clarity",
    sub: "Find the truth.",
    body: "We uncover your core truth, positioning, and promise so every decision starts from the right place.",
  },
  {
    no: "02",
    name: "Structure",
    sub: "Build the system.",
    body: "We architect your brand system, messaging, offer, identity, and strategy so everything fits and scales.",
  },
  {
    no: "03",
    name: "Execution",
    sub: "Make it real.",
    body: "We translate strategy into assets, tools, and guidelines your team can actually use with confidence.",
  },
  {
    no: "04",
    name: "Optimization",
    sub: "Refine as you grow.",
    body: "We measure, learn, and evolve, keeping your brand relevant, resilient, and ahead of the market.",
  },
];

const PROBLEMS = [
  "The message changes from week to week.",
  "The offer feels disconnected from the brand.",
  "The visuals look good but do not build trust.",
  "The team is busy, but the brand is not growing.",
  "Decisions are made reactively, not strategically.",
];

const ALIGNMENT = [
  { name: "Brand Audit", body: "A strategic assessment to identify gaps and opportunities.", tag: "Clarity starts here" },
  { name: "Foundation", body: "Establish your core truth, positioning, and brand promise.", tag: "Build on truth" },
  { name: "Structure", body: "Build the complete brand system that aligns and scales.", tag: "Systems that scale", featured: true },
  { name: "House", body: "Embed the brand across every touchpoint and team.", tag: "Live the brand" },
  { name: "Estate", body: "Evolve, expand, and optimize for long-term market leadership.", tag: "Legacy in motion" },
];

const PROOFS = [
  { title: "Clarity", body: "Clarity removes confusion." },
  { title: "Structure", body: "Structure creates alignment." },
  { title: "Execution", body: "Execution builds momentum." },
  { title: "Optimization", body: "Optimization drives compounding growth." },
];

export default function EstateMethodologyPage() {
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = "The Core Truth Method™ — Core Truth House";
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
      <section className="ec-subhero" aria-label="The Core Truth Method">
        <div className="ec-subhero-bg ec-electric" style={{ objectPosition: "right center" }}>
          <img src="/estate-assets/systems-hero.webp" alt="" style={{ objectPosition: "right center" }} />
          <img
            className="ec-glow-pulse"
            src="/estate-assets/systems-hero.webp"
            alt=""
            aria-hidden="true"
            style={{ objectPosition: "right center" }}
          />
          <img
            className="ec-glow-sweep"
            src="/estate-assets/systems-hero.webp"
            alt=""
            aria-hidden="true"
            style={{ objectPosition: "right center" }}
          />
        </div>
        <div className="ec-subhero-copy">
          <span className="ec-eyebrow">The Core Truth Method™</span>
          <h1 className="ec-h1">
            Your brand does not need more noise. <em>It needs a system.</em>
          </h1>
          <p className="ec-lede">
            The Core Truth Method™ turns scattered brand decisions into a clear, credible, and
            executable business system that scales with you.
          </p>
          <div className="ec-build-ctas">
            <Link to="/brand-diagnostic/" className="ec-btn ec-btn-crimson">
              Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
            </Link>
            <a href="#how-it-works" className="ec-btn ec-btn-ghost">
              See how it works
            </a>
          </div>
        </div>
      </section>

      <section className="ec-arc ec-sheet" aria-label="The real problem">
        <div className="ec-arc-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet M-001</span>
              <span>Site conditions</span>
            </div>
            <h2 className="ec-h2">
              Most brands are not unclear because the founder lacks vision.{" "}
              <em>They are unclear because the vision has nowhere to live.</em>
            </h2>
          </div>
          <div className="ec-problem-card">
            <div className="ec-problem-card-head">The real problem</div>
            <ul>
              {PROBLEMS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="ec-layers ec-sheet" id="how-it-works" aria-label="The four layers">
        <div className="ec-layers-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet M-100</span>
              <span>The methodology</span>
              <span>Section drawings</span>
            </div>
            <h2 className="ec-h2">
              Four connected layers. One operating <em>system</em>.
            </h2>
          </div>
          {LAYERS.map((l) => (
            <div className="ec-layer" key={l.no}>
              <span className="ec-layer-no">{l.no}</span>
              <div className="ec-layer-title">
                <span className="ec-layer-name">{l.name}</span>
                <span className="ec-layer-sub">{l.sub}</span>
              </div>
              <span className="ec-layer-body">{l.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ec-vault" aria-label="Where it starts">
        <div className="ec-vault-inner ec-reveal">
          <div>
            <div className="ec-titleblock is-dark" style={{ marginBottom: 26 }}>
              <span className="ec-titleblock-no">Sheet M-200</span>
              <span>Where it starts</span>
            </div>
            <h2 className="ec-h2">
              A system that scales <em>with you</em>.
            </h2>
            <p className="ec-vault-def">
              The Brand Diagnostic identifies which layer needs attention first. No guesswork.
              No fluff. Just a clear assessment so you can invest in the right next step.
            </p>
            <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold" style={{ marginTop: 26 }}>
              Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
            </Link>
          </div>
          <div className="ec-vault-holds">
            <div className="ec-vault-holds-head">The assessment shows you</div>
            <ul>
              <li>Understand what is working and what is not.</li>
              <li>See the exact layer causing the most friction.</li>
              <li>Get a prioritized roadmap for what to do next.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ec-arc ec-sheet" aria-label="The alignment">
        <div className="ec-arc-inner ec-reveal">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet M-300</span>
              <span>The alignment</span>
            </div>
            <h2 className="ec-h2">
              Each tier supports a different level of brand <em>maturity</em>.
            </h2>
            <p className="ec-lede">
              Where the Brand Diagnostic places you determines the right entry point. Most
              founders start at Foundation or Structure and grow from there.
            </p>
          </div>
          <div className="ec-proofs" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {ALIGNMENT.map((a) => (
              <div
                className="ec-proof"
                key={a.name}
                style={a.featured ? { background: "var(--ec-purple)" } : undefined}
              >
                {a.featured && (
                  <span className="ec-hand-note" style={{ color: "var(--ec-gold)", fontSize: 12 }}>
                    recommended entry point
                  </span>
                )}
                <span className="ec-proof-title" style={a.featured ? { color: "#f7f0e2" } : undefined}>
                  {a.name}
                </span>
                <span
                  className="ec-proof-body"
                  style={a.featured ? { color: "rgba(244,236,223,0.75)" } : undefined}
                >
                  {a.body}
                </span>
                <span
                  className="ec-hand-note"
                  style={{ fontSize: 13, color: a.featured ? "var(--ec-gold)" : "var(--ec-crimson)" }}
                >
                  {a.tag}
                </span>
              </div>
            ))}
          </div>
          <SheetLink to="/tiers" className="ec-btn ec-btn-ghost">
            See the residencies <span className="ec-btn-arrow">→</span>
          </SheetLink>
        </div>
      </section>

      <section className="ec-faq" aria-label="Why this works">
        <div className="ec-faq-inner ec-reveal">
          <div className="ec-faq-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet M-400</span>
              <span>Why this works</span>
            </div>
            <h2 className="ec-h2">
              A brand lives in every decision your business <em>makes</em>.
            </h2>
            <p className="ec-lede">
              When your brand is built on truth and structured with intention, it becomes easier
              to lead, easier to market, and impossible to ignore.
            </p>
          </div>
          <div className="ec-proofs">
            {PROOFS.map((p) => (
              <div className="ec-proof" key={p.title}>
                <span className="ec-proof-title">{p.title}</span>
                <span className="ec-proof-body">{p.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ec-commission" aria-label="Start with the missing layer">
        <div className="ec-commission-copy ec-reveal">
          <span className="ec-commission-handnote">final note — the missing layer</span>
          <h2 className="ec-h2">
            You do not need to rebuild your brand from scratch.{" "}
            <em>You need to understand what layer is missing.</em>
          </h2>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold">
            Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
