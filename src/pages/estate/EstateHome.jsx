// Estate concept — HOME. One continuous film: the estate builds, the creed is
// spoken, you walk the residencies, read the plan, open the vault, get answers,
// and commission the build. Content tracks the live site's landing page.

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { SheetLink } from "./EstateShell";

const ASSET = (name) => `/estate-assets/${name}`;

const PILLARS = [
  { no: "01", name: "Clarity", gloss: "See what matters" },
  { no: "02", name: "Truth", gloss: "Speak what matters" },
  { no: "03", name: "Structure", gloss: "Build what lasts" },
  { no: "04", name: "Execution", gloss: "Lead what matters" },
  { no: "05", name: "Legacy", gloss: "Leave what matters" },
];

const ROOMS = [
  {
    floor: "B1",
    sheet: "A-101",
    tier: "Foundation",
    title: "The Foundation Room",
    price: "$47",
    desc: "Below grade, where every estate begins. Clarify who you are, who you serve, and the position you own — before anything visible is built on top.",
    specs: [
      "Brand Foundation Builder",
      "Audience Clarity Tool",
      "Positioning Generator",
      "Content Studio Basics",
    ],
    img: "room-foundation.png",
    alt: "The Foundation Room — brand principles mounted on a marble wall above a drafting desk",
  },
  {
    floor: "L1",
    sheet: "A-201",
    tier: "Structure",
    title: "The Structure Room",
    price: "$97",
    featured: true,
    desc: "Where systems take shape and legacy is engineered. Turn clarity into a repeatable operating structure for offers, systems, and decisions.",
    specs: [
      "Systems Builder and SOPs",
      "Offer Builder Guide",
      "Saved Brand Memory",
      "Decision Rules Framework",
    ],
    img: "room-structure.png",
    alt: "The Structure Room — blueprints, brand pillars, and material samples across a drafting table",
  },
  {
    floor: "L2",
    sheet: "A-301",
    tier: "House",
    title: "The House",
    price: "$297",
    desc: "The visible brand, finished and furnished. Package the identity, plan the launches, and walk clients through a brand that holds together.",
    specs: ["Identity Studio Guide", "Launch Planner", "Brand Kit Export"],
    img: "room-house.png",
    alt: "The House lobby — marble reception with the Core Truth House wordmark in brass",
  },
  {
    floor: "PH",
    sheet: "A-401",
    tier: "Estate",
    title: "The Estate",
    price: "$697",
    desc: "Legacy. Influence. Generations. A larger ecosystem with your team at the table, client vaults in the archive, and your name over the door.",
    specs: ["Team Seats Setup", "Client Brand Vaults", "White-Label Exports"],
    img: "room-estate.png",
    alt: "The Estate boardroom — marble table before a fireplace and the Core Truth House seal",
  },
];

const PLAN_ROOMS = [
  {
    id: "command", no: "R-01", name: "Command Center",
    desc: "The great hall. Brand health, active projects, and momentum in one view — every other room reports here.",
    x: 40, y: 40, w: 300, h: 210, lx: 190, ly: 145,
  },
  {
    id: "signal", no: "R-02", name: "Signal OS",
    desc: "The drawing room. Positioning, messaging, audience, offer, and experience — the five walls every decision leans on.",
    x: 340, y: 40, w: 220, h: 210, lx: 450, ly: 145,
  },
  {
    id: "content", no: "R-03", name: "Content Studio",
    desc: "The workshop. Content built from Brand Memory, so everything produced sounds like the house — not a generic tool.",
    x: 560, y: 40, w: 200, h: 210, lx: 660, ly: 145,
  },
  {
    id: "memory", no: "R-04", name: "Brand Memory",
    desc: "The vault. The persistent context layer holding strategy, voice, audience, and identity — the single source of truth.",
    x: 40, y: 250, w: 220, h: 190, lx: 150, ly: 345,
  },
  {
    id: "offers", no: "R-05", name: "Offer Builder",
    desc: "The forge. Entry to legacy: an offer architecture that gives every client a next room to walk into.",
    x: 260, y: 250, w: 240, h: 190, lx: 380, ly: 345,
  },
  {
    id: "journey", no: "R-06", name: "Client Journey",
    desc: "The gallery. Guide clients from first interest to loyalty along one corridor, with nothing left to chance.",
    x: 500, y: 250, w: 260, h: 190, lx: 630, ly: 345,
  },
];

const ARC_CARDS = [
  {
    no: "N-01",
    eyebrow: "The problem",
    title: "You are showing up, but the brand still feels harder to sell than it should.",
    body: "You have content, offers, experience, and visibility. The gap is not effort. The gap is structure: your positioning, message, offer path, content, and sales story are not operating from the same source of truth.",
  },
  {
    no: "N-02",
    eyebrow: "The shift",
    title: "Core Truth House turns scattered decisions into one brand operating system.",
    body: "The system helps you diagnose what is missing, define the foundation, store your brand decisions, and use that structure across content, offers, sales pages, funnels, and execution.",
  },
  {
    no: "N-03",
    eyebrow: "The outcome",
    title: "The brand becomes easier to explain, easier to build, and easier to sell.",
    body: "Instead of starting over every time you write, launch, or refine your offer, you operate from a connected brand structure that compounds over time.",
  },
];

const VAULT_HOLDS = [
  "Strategy, positioning, and brand promise",
  "Audience language, pain points, and buying triggers",
  "Voice, tone, messaging rules, and decision standards",
  "Offer structure, content direction, and visual identity",
];

const FAQS = [
  {
    q: "What is a brand operating system?",
    a: "A brand operating system is the connected structure behind your brand. It organizes your positioning, message, audience, offers, content, sales pages, funnels, and decision rules so your brand does not depend on scattered notes or one-off prompts.",
  },
  {
    q: "Who is Core Truth House for?",
    a: "Core Truth House is designed for solo service-based founders who already have content, offers, experience, and some visibility, but need stronger structure so the brand is clearer, more consistent, and easier to sell.",
  },
  {
    q: "How is Core Truth House different from Jasper, ChatGPT prompts, Canva, or StoryBrand?",
    a: "Those tools can help you create individual pieces. Core Truth House is built to hold the structure behind the pieces. It connects your brand foundation, Brand Memory, content, offers, sales assets, and execution path so you are not rebuilding from scratch every time.",
  },
  {
    q: "What is Brand Memory?",
    a: "Brand Memory is the persistent context layer that stores your strategy, voice, audience, offers, and visual identity, so every AI generation across the platform sounds like your brand and not generic GPT output.",
  },
  {
    q: "Why should I start with the Brand Diagnostic?",
    a: "The Brand Diagnostic shows where the structural gaps are before you buy into the system. It helps you see whether the problem is positioning, messaging, offer clarity, audience fit, trust, content consistency, or conversion path.",
  },
  {
    q: "Does Core Truth House replace my strategy, or help me use it better?",
    a: "It helps you use it better. The founder still brings the judgment, taste, proof, and point of view. Core Truth House gives those decisions a structured home so they can guide every asset and action.",
  },
];

const BUILD_PHASES = [
  [0, "Pouring the foundation"],
  [0.3, "Framing the structure"],
  [0.58, "Raising the house"],
  [0.82, "Finishing the estate"],
];

export default function EstateHome() {
  const buildSceneRef = useRef(null);
  const buildPctRef = useRef(null);
  const buildPhaseRef = useRef(null);
  const walkSceneRef = useRef(null);
  const walkStRef = useRef(null);
  const rootRef = useRef(null);
  const [activeRoom, setActiveRoom] = useState(0);
  const [activePlanRoom, setActivePlanRoom] = useState(PLAN_ROOMS[0]);

  useEffect(() => {
    document.title = "Core Truth House — Where serious brands are built";
  }, []);

  useEffect(() => {
    /* home opens on the film — nav starts transparent */
    document.querySelector(".ec-nav")?.classList.remove("is-solid");
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 1021px) and (prefers-reduced-motion: no-preference)",
        isMobile: "(max-width: 1020px) and (prefers-reduced-motion: no-preference)",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions;

        if (reduceMotion) {
          if (buildPctRef.current) buildPctRef.current.textContent = "100%";
          if (buildPhaseRef.current) buildPhaseRef.current.textContent = "Build complete";
          gsap.set(".ec-build-card", { opacity: 1 });
          return;
        }

        const heroSplit = SplitText.create(".ec-build-copy .ec-h1", {
          type: "lines",
          mask: "lines",
          linesClass: "ec-line",
        });
        gsap.from(heroSplit.lines, {
          yPercent: 115,
          duration: 1.35,
          ease: "power4.out",
          stagger: 0.14,
          delay: 0.3,
        });
        gsap.from(
          ".ec-build-copy .ec-eyebrow, .ec-build-copy .ec-lede, .ec-build-ctas, .ec-build-datum",
          { opacity: 0, y: 22, duration: 1.1, ease: "power3.out", stagger: 0.1, delay: 0.75 }
        );

        const buildTl = gsap.timeline({
          scrollTrigger: {
            trigger: buildSceneRef.current,
            start: "top top",
            end: "+=320%",
            scrub: 0.8,
            pin: true,
            onUpdate: (self) => {
              const p = self.progress;
              if (buildPctRef.current) {
                buildPctRef.current.textContent = `${Math.round(p * 100)}%`;
              }
              if (buildPhaseRef.current) {
                const phase = [...BUILD_PHASES].reverse().find(([at]) => p >= at);
                if (phase && buildPhaseRef.current.textContent !== phase[1]) {
                  buildPhaseRef.current.textContent = phase[1];
                }
              }
            },
          },
        });

        buildTl
          .to(".ec-build-copy", { yPercent: 30, autoAlpha: 0, ease: "power1.in", duration: 0.14 }, 0.02)
          .to(".ec-scrollcue", { autoAlpha: 0, duration: 0.05 }, 0)
          .fromTo(".ec-build-film", { scale: 1.12 }, { scale: 1, ease: "none", duration: 1 }, 0)
          .fromTo(
            ".ec-film-mono",
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 0.52 },
            0.06
          )
          .fromTo(
            ".ec-film-color",
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 0.62 },
            0.26
          )
          .fromTo(".ec-film-scanline", { top: "100%", opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.26)
          .to(".ec-film-scanline", { top: "0%", ease: "none", duration: 0.62 }, 0.26)
          .to(".ec-film-scanline", { opacity: 0, duration: 0.06 }, 0.88)
          .to(".ec-film-grid", { opacity: 0, ease: "none", duration: 0.5 }, 0.4)
          .fromTo(
            ".ec-build-card",
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, ease: "power2.out", duration: 0.1 },
            0.9
          );

        ScrollTrigger.create({
          trigger: buildSceneRef.current,
          start: "bottom top",
          onEnter: () => document.querySelector(".ec-nav")?.classList.add("is-solid"),
          onLeaveBack: () => document.querySelector(".ec-nav")?.classList.remove("is-solid"),
        });

        const creedSplit = SplitText.create(".ec-creed-statement", {
          type: "lines",
          mask: "lines",
          linesClass: "ec-line",
        });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".ec-scene-creed",
              start: "top top",
              end: "+=220%",
              scrub: 0.8,
              pin: true,
            },
          })
          .from(creedSplit.lines, { yPercent: 115, ease: "power2.out", duration: 0.3, stagger: 0.22 }, 0.04)
          .from(".ec-creed-body", { autoAlpha: 0, y: 26, duration: 0.24 }, 0.62)
          .from(".ec-pillar", { autoAlpha: 0, x: -28, duration: 0.16, stagger: 0.13 }, 0.5);

        if (isDesktop) {
          const rooms = gsap.utils.toArray(".ec-walkroom");
          gsap.set(rooms, { visibility: "visible" });
          rooms.slice(1).forEach((room) => {
            gsap.set(room.querySelector(".ec-walkroom-media"), { autoAlpha: 0, scale: 0.9, filter: "blur(6px)" });
            gsap.set(room.querySelector(".ec-walkroom-copy"), { autoAlpha: 0, y: 26 });
            gsap.set(room.querySelector(".ec-walkroom-floor"), { autoAlpha: 0 });
            gsap.set(room.querySelector(".ec-titleblock"), { autoAlpha: 0 });
          });

          const walkTl = gsap.timeline({
            scrollTrigger: {
              trigger: walkSceneRef.current,
              start: "top top",
              end: `+=${(rooms.length - 1) * 150}%`,
              scrub: 0.8,
              pin: true,
              onUpdate: (self) => {
                const idx = Math.min(
                  rooms.length - 1,
                  Math.round(self.progress * (rooms.length - 1))
                );
                setActiveRoom(idx);
              },
            },
          });
          walkStRef.current = walkTl.scrollTrigger;

          walkTl.fromTo(
            rooms[0].querySelector(".ec-walkroom-media"),
            { scale: 1.06 },
            { scale: 1.12, ease: "none", duration: 0.9 },
            0
          );

          rooms.slice(1).forEach((room, i) => {
            const prev = rooms[i];
            walkTl
              .to(prev.querySelector(".ec-walkroom-copy"), { autoAlpha: 0, y: -20, duration: 0.2 }, i + 0.08)
              .to(prev.querySelector(".ec-titleblock"), { autoAlpha: 0, duration: 0.15 }, i + 0.08)
              .to(prev.querySelector(".ec-walkroom-floor"), { autoAlpha: 0, duration: 0.2 }, i + 0.12)
              .to(
                prev.querySelector(".ec-walkroom-media"),
                { scale: 1.55, autoAlpha: 0, filter: "blur(9px)", ease: "power1.in", duration: 0.55 },
                i + 0.1
              )
              .to(
                room.querySelector(".ec-walkroom-media"),
                { autoAlpha: 1, scale: 1.02, filter: "blur(0px)", ease: "power2.out", duration: 0.5 },
                i + 0.38
              )
              .fromTo(
                room.querySelector(".ec-walkroom-media"),
                { scale: 1.02 },
                { scale: 1.1, ease: "none", duration: 0.35, immediateRender: false },
                i + 0.65
              )
              .to(room.querySelector(".ec-walkroom-floor"), { autoAlpha: 1, duration: 0.25 }, i + 0.6)
              .to(room.querySelector(".ec-titleblock"), { autoAlpha: 1, duration: 0.2 }, i + 0.66)
              .to(room.querySelector(".ec-walkroom-copy"), { autoAlpha: 1, y: 0, duration: 0.3 }, i + 0.68);
          });
        }

        gsap.utils
          .toArray([
            ".ec-arc-inner",
            ".ec-walk-head",
            ".ec-plan-inner",
            ".ec-vault-inner",
            ".ec-faq-inner",
            ".ec-commission-copy",
          ])
          .forEach((el) => {
            gsap.from(el.children, {
              opacity: 0,
              y: 34,
              duration: 1.1,
              ease: "power3.out",
              stagger: 0.12,
              scrollTrigger: { trigger: el, start: "top 80%" },
            });
          });

        gsap.fromTo(
          ".ec-commission-bg",
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: ".ec-commission", start: "top bottom", end: "bottom top", scrub: 0.8 },
          }
        );

        return () => {
          heroSplit.revert();
          creedSplit.revert();
        };
      },
      rootRef
    );

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToRoom = (idx) => {
    const st = walkStRef.current;
    if (!st) return;
    const target = st.start + ((st.end - st.start) * idx) / (ROOMS.length - 1);
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(target, true);
    else window.scrollTo({ top: target, behavior: "smooth" });
  };

  const roomCopy = (room) => (
    <>
      {room.featured && <span className="ec-walkroom-featured">← most founders start here</span>}
      <h3 className="ec-walkroom-title">{room.title}</h3>
      <div className="ec-walkroom-price">
        <span className="ec-price-value">{room.price}</span>
        <span className="ec-price-period">/ month · {room.tier}</span>
      </div>
      <p className="ec-walkroom-desc">{room.desc}</p>
      <ul className="ec-walkroom-specs">
        {room.specs.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold">
        Start on this floor <span className="ec-btn-arrow">→</span>
      </Link>
    </>
  );

  return (
    <div ref={rootRef}>
      {/* ============ SCENE 1 — THE BUILD ============ */}
      <section className="ec-scene-build" ref={buildSceneRef} aria-label="The estate, built from the ground up">
        <div className="ec-build-film">
          <img className="ec-film-ghost" src={ASSET("hero-blueprint.png")} alt="" aria-hidden="true" />
          <img className="ec-film-mono" src={ASSET("hero-blueprint.png")} alt="" aria-hidden="true" />
          <img
            className="ec-film-color"
            src={ASSET("hero-blueprint.png")}
            alt="The Core Truth House estate, drawn in blueprint and rising into finished form"
          />
          <div className="ec-film-grid" aria-hidden="true" />
          <div className="ec-film-scanline" aria-hidden="true" />
        </div>

        <div className="ec-build-status">
          <span ref={buildPhaseRef}>Pouring the foundation</span>
          <span className="ec-build-pct" ref={buildPctRef}>
            0%
          </span>
        </div>

        <div className="ec-build-copy">
          <div className="ec-build-copy-main">
            <span className="ec-eyebrow">Brand architecture</span>
            <h1 className="ec-h1">
              Where serious brands are <em>built</em>.
            </h1>
            <p className="ec-lede">
              Core Truth House is the estate behind your business — foundation, structure,
              identity, and execution drawn from one set of plans. Scroll, and watch the
              house go up.
            </p>
            <div className="ec-build-ctas">
              <Link to="/brand-diagnostic/" className="ec-btn ec-btn-crimson">
                Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
              </Link>
              <a href="#walkthrough" className="ec-btn ec-btn-ghost">
                Walk the estate
              </a>
            </div>
          </div>
          <div className="ec-build-datum" role="presentation">
            <div>
              <div className="ec-datum-value">27K+</div>
              <div className="ec-datum-label">Founders housed</div>
            </div>
            <div>
              <div className="ec-datum-value">4</div>
              <div className="ec-datum-label">Floors to climb</div>
            </div>
            <div>
              <div className="ec-datum-value">1</div>
              <div className="ec-datum-label">Set of plans</div>
            </div>
          </div>
        </div>

        <div className="ec-build-card">
          <img src={ASSET("cth-seal.png")} alt="" />
          <div className="ec-build-card-title">The estate stands.</div>
          <div className="ec-build-card-note">issued for walkthrough — proceed inside</div>
        </div>

        <div className="ec-scrollcue">Scroll to build</div>
      </section>

      <div className="ec-bridge" aria-hidden="true">
        <span className="ec-hand-note">general notes follow — read before entering</span>
      </div>

      {/* ============ SCENE 2 — THE CREED ============ */}
      <section className="ec-scene-creed" aria-label="The Core Truth House philosophy">
        <div className="ec-creed-sheetmark">
          <div className="ec-titleblock is-dark">
            <span className="ec-titleblock-no">Sheet A-002</span>
            <span>General notes</span>
          </div>
        </div>
        <div className="ec-creed-inner">
          <div>
            <h2 className="ec-creed-statement">
              Built on truth.
              <br />
              Designed to <em>lead</em>.
            </h2>
            <p className="ec-creed-body">
              You have content, offers, experience, and visibility. The gap is not effort —
              it is structure. Core Truth House turns scattered decisions into one brand
              operating system: positioning, message, offer path, content, and sales story
              working from the same source of truth.
            </p>
          </div>
          <div className="ec-pillars" role="list" aria-label="The five pillars">
            {PILLARS.map((p) => (
              <div className="ec-pillar" role="listitem" key={p.no}>
                <span className="ec-pillar-no">{p.no}</span>
                <span className="ec-pillar-name">{p.name}</span>
                <span className="ec-pillar-gloss">{p.gloss}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="ec-bridge-updown" aria-hidden="true" />

      {/* ============ SCENE 3 — THE STRUCTURAL ASSESSMENT (arc) ============ */}
      <section className="ec-arc ec-sheet" aria-label="From effort to structure">
        <div className="ec-arc-inner">
          <div className="ec-arc-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet A-010</span>
              <span>Structural assessment</span>
            </div>
            <h2 className="ec-h2">
              The problem is not that you need more <em>content</em>.
            </h2>
            <p className="ec-lede">
              It is that your brand decisions are living in too many places. Core Truth House
              names the gap, organizes the strategy, and gives the brand a structure that can
              support real conversion.
            </p>
          </div>
          <div className="ec-arc-grid">
            {ARC_CARDS.map((c) => (
              <div className="ec-arc-card" key={c.no}>
                <span className="ec-arc-no">{c.no} — {c.eyebrow}</span>
                <span className="ec-arc-title">{c.title}</span>
                <span className="ec-arc-body">{c.body}</span>
              </div>
            ))}
          </div>
          <div className="ec-plaque">
            <span className="ec-plaque-quote">
              "This makes so much sense, especially why the core exists. I like the house
              reference, it breaks it down so clear, and the visual is giving."
            </span>
            <span className="ec-plaque-name">Anika — founder</span>
          </div>
        </div>
      </section>

      {/* ============ SCENE 4 — THE RESIDENCIES ============ */}
      <div className="ec-sheet" id="walkthrough">
        <div className="ec-walk-head">
          <div className="ec-titleblock">
            <span className="ec-titleblock-no">Sheet A-100</span>
            <span>Interior elevations</span>
            <span>Scale 1:1</span>
          </div>
          <h2 className="ec-h2">
            Choose your <em>residency</em>.
          </h2>
          <p className="ec-lede">
            Walk the rooms as they are raised — four floors, four memberships. Step through
            each doorway: start below grade, end with your name over the door. Every residency
            begins with the Brand Diagnostic.
          </p>
        </div>
      </div>

      <section className="ec-scene-walk" ref={walkSceneRef} aria-label="Walk through the estate">
        <nav className="ec-rail" aria-label="Floors">
          {ROOMS.map((room, i) => (
            <button
              type="button"
              key={room.tier}
              className={`ec-rail-stop${i === activeRoom ? " is-active" : ""}`}
              onClick={() => scrollToRoom(i)}
              aria-current={i === activeRoom ? "true" : undefined}
            >
              <span className="ec-rail-floor">{room.floor}</span>
              <span className="ec-rail-name">{room.tier}</span>
            </button>
          ))}
        </nav>

        {ROOMS.map((room, i) => (
          <article className={`ec-walkroom${i === 0 ? " is-first" : ""}`} key={room.tier}>
            <div className="ec-walkroom-media">
              <img src={ASSET(room.img)} alt={room.alt} />
            </div>
            <div className="ec-walkroom-floor" aria-hidden="true">
              {room.floor}
            </div>
            <div className="ec-titleblock is-dark">
              <span className="ec-titleblock-no">{room.sheet}</span>
              <span>{room.title}</span>
              <span>Floor {room.floor}</span>
            </div>
            <div className="ec-walkroom-copy">{roomCopy(room)}</div>
          </article>
        ))}
      </section>

      <div className="ec-walk-mobile">
        {ROOMS.map((room) => (
          <article className="ec-walkroom-m" key={room.tier}>
            <img src={ASSET(room.img)} alt={room.alt} loading="lazy" />
            <div className="ec-walkroom-m-copy">{roomCopy(room)}</div>
          </article>
        ))}
      </div>

      {/* ============ SCENE 5 — THE PLAN ============ */}
      <section className="ec-plan ec-sheet" id="blueprint" aria-label="The system floor plan">
        <div className="ec-plan-inner">
          <div className="ec-plan-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet A-200</span>
              <span>Ground floor plan</span>
              <span>The operating system</span>
            </div>
            <h2 className="ec-h2">
              One roof. Every room <em>connected</em>.
            </h2>
            <p className="ec-lede">
              This is the working plan of the platform. Hover a room to read its purpose —
              every door opens onto Brand Memory, so nothing you build is ever scattered again.
            </p>
          </div>

          <div className="ec-plan-svgwrap">
            <svg
              className="ec-plan-svg"
              viewBox="0 0 800 480"
              role="group"
              aria-label="Floor plan of the Core Truth House platform"
            >
              <rect className="ec-wall" x="40" y="40" width="720" height="400" />
              <line className="ec-partition" x1="340" y1="40" x2="340" y2="250" />
              <line className="ec-partition" x1="560" y1="40" x2="560" y2="250" />
              <line className="ec-partition" x1="40" y1="250" x2="760" y2="250" />
              <line className="ec-partition" x1="260" y1="250" x2="260" y2="440" />
              <line className="ec-partition" x1="500" y1="250" x2="500" y2="440" />
              <path className="ec-partition" d="M 340 130 A 34 34 0 0 1 306 164" />
              <path className="ec-partition" d="M 560 130 A 34 34 0 0 1 526 164" />
              <path className="ec-partition" d="M 170 250 A 34 34 0 0 1 136 216" />
              <path className="ec-partition" d="M 400 250 A 34 34 0 0 1 366 216" />
              <path className="ec-partition" d="M 620 250 A 34 34 0 0 1 586 216" />
              <line className="ec-partition" x1="380" y1="440" x2="420" y2="440" strokeWidth="6" stroke="#fbf7f1" />
              <text className="ec-roomno" x="384" y="466">
                entry — the diagnostic
              </text>

              {PLAN_ROOMS.map((room) => (
                <g key={room.id}>
                  <rect
                    className={`ec-roomfill${activePlanRoom.id === room.id ? " is-active" : ""}`}
                    x={room.x}
                    y={room.y}
                    width={room.w}
                    height={room.h}
                    onMouseEnter={() => setActivePlanRoom(room)}
                    onFocus={() => setActivePlanRoom(room)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${room.name}: ${room.desc}`}
                  />
                  <text className="ec-roomno" x={room.x + 12} y={room.y + 24}>
                    {room.no}
                  </text>
                  <text className="ec-roomlabel" textAnchor="middle" x={room.lx} y={room.ly}>
                    {room.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <aside className="ec-plan-detail" aria-live="polite">
            <div className="ec-plan-detail-head">
              <span className="ec-plan-detail-title">{activePlanRoom.name}</span>
              <span className="ec-plan-detail-no">{activePlanRoom.no}</span>
            </div>
            <div className="ec-plan-detail-body">
              {activePlanRoom.desc}
              <br />
              <SheetLink to="/methodology" className="ec-plan-detail-link">
                See the system
              </SheetLink>
            </div>
          </aside>
        </div>
      </section>

      {/* ============ SCENE 6 — THE VAULT (Brand Memory) ============ */}
      <section className="ec-vault" aria-label="Brand Memory">
        <div className="ec-vault-inner">
          <div>
            <div className="ec-titleblock is-dark" style={{ marginBottom: 26 }}>
              <span className="ec-titleblock-no">Room R-04</span>
              <span>The vault — Brand Memory</span>
            </div>
            <h2 className="ec-h2">
              The system remembers what your brand is supposed to <em>sound like</em>.
            </h2>
            <p className="ec-vault-def">
              Brand Memory is the persistent context layer that stores your strategy, voice,
              audience, offers, and visual identity, so every AI generation across the platform
              sounds like your brand and not generic GPT output.
            </p>
          </div>
          <div className="ec-vault-holds">
            <div className="ec-vault-holds-head">What it holds</div>
            <ul>
              {VAULT_HOLDS.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ SCENE 7 — CLEARER ANSWERS (FAQ) ============ */}
      <section className="ec-faq" aria-label="Questions founders ask before they enter the House">
        <div className="ec-faq-inner">
          <div className="ec-faq-head">
            <div className="ec-titleblock">
              <span className="ec-titleblock-no">Sheet A-500</span>
              <span>Questions founders ask before they enter the House</span>
            </div>
            <h2 className="ec-h2">
              The brand does not need more noise. It needs clearer <em>answers</em>.
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
          <p className="ec-hand-note" style={{ color: "var(--ec-crimson)" }}>
            still unsure where the gap is? — the Diagnostic is the bridge between the scattered
            feeling and the right Core Truth House system.
          </p>
        </div>
      </section>

      {/* ============ SCENE 8 — COMMISSION ============ */}
      <section className="ec-commission" aria-label="Commission your build">
        <div className="ec-commission-bg" aria-hidden="true">
          <img src={ASSET("estate-exterior.png")} alt="" />
        </div>
        <div className="ec-commission-copy">
          <span className="ec-commission-handnote">final sheet — issued for construction</span>
          <h2 className="ec-h2">
            Commission the <em>build</em>.
          </h2>
          <p className="ec-commission-note">
            The Brand Diagnostic surveys your ground in seven minutes: strengths, gaps, and
            the first three moves of your build. The drawings are ready — all that is
            missing is the founder.
          </p>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-gold">
            Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
