// Estate concept — THE FOUNDER COHORT. "Build Your Brand. Build Your Legacy."
// Founding offer: hero with floor callouts, the
// breakthrough band, the Founding 12 offer, and the blueprint close.

import React, { useEffect, useRef } from "react";
import apiClient from "../../lib/apiClient.js";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const FEATS = [
  {
    name: "Clarity",
    gloss: "Uncover what makes you unforgettable.",
    icon: <path d="M8.5 1.5 a5 5 0 0 1 3 9 v2 h-6 v-2 a5 5 0 0 1 3 -9 z M6.5 15.5 h4" />,
  },
  {
    name: "Structure",
    gloss: "Build the brand that scales with you.",
    icon: <path d="M8.5 1.5 15 5 v7 l-6.5 3.5 L2 12 V5 z M2 5 l6.5 3.5 L15 5 M8.5 8.5 v7" />,
  },
  {
    name: "Strategy",
    gloss: "Position with authority. Convert with ease.",
    icon: (
      <>
        <circle cx="8.5" cy="8.5" r="7" />
        <circle cx="8.5" cy="8.5" r="3.5" />
        <circle cx="8.5" cy="8.5" r="0.8" />
      </>
    ),
  },
  {
    name: "Community",
    gloss: "Surround yourself with elite builders.",
    icon: (
      <>
        <circle cx="5.5" cy="6" r="2.5" />
        <circle cx="11.5" cy="6" r="2.5" />
        <path d="M1.5 15 a4 4 0 0 1 8 0 M7.5 15 a4 4 0 0 1 8 0" />
      </>
    ),
  },
];

const CALLOUTS = [
  ["Estate", "Legacy & Scale"],
  ["Systems", "Automation & Scale"],
  ["House", "Brand & Presence"],
  ["Structure", "Strategy & Positioning"],
  ["Foundation", "Clarity & Identity"],
];

const BREAKTHROUGH = [
  {
    title: "Proven Framework",
    body: "The Core Truth House Operating System takes the guesswork out of growth.",
    icon: <path d="M2 15 V6 l6.5 -4 L15 6 v9 z M6 15 v-5 h5 v5 M2 6 h13" />,
  },
  {
    title: "AI Guidance",
    body: "Written instructor feedback supports your brand work during the 90-day feedback window.",
    icon: <path d="M3 2 h11 v10 H8 l-3.5 3 v-3 H3 z M6 6 h7 M6 9 h5" />,
  },
  {
    title: "Peer Power",
    body: "Join a circle of visionary founders who hold you accountable.",
    icon: (
      <>
        <circle cx="9" cy="4.5" r="2.5" />
        <circle cx="3.8" cy="7" r="2" />
        <circle cx="14.2" cy="7" r="2" />
        <path d="M4.5 15.5 a4.5 4.5 0 0 1 9 0" />
      </>
    ),
  },
  {
    title: "Lasting Impact",
    body: "Walk away with a brand that attracts, converts, and compounds for years to come.",
    icon: (
      <>
        <circle cx="9" cy="9" r="7" />
        <path d="M9 5 v4 l3 2" />
      </>
    ),
  },
];

const STEPS = [
  ["01", "Brand Clarity", "Uncover your core truth and brand positioning."],
  ["02", "Strategy & Messaging", "Build your offer, messaging, and authority."],
  ["03", "Content & Visibility", "Get seen, heard, and remembered."],
  ["04", "Conversion & Systems", "Turn attention into aligned revenue."],
  ["05", "Legacy & Scale Planning", "Design your brand to outlive you."],
];

const OFFER = [
  "Self-paced with written instructor feedback on your brand work during the 90-day feedback window. No live sessions.",
  "Lifetime Access to Estate Level",
  "Templates, Tools & Resources",
  "Private Community Access",
  "Written Instructor Feedback · No Live Sessions",
];

export default function EstateCohortPage() {
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = "The Founder Cohort — Core Truth House";
  }, []);

  useEffect(() => {
    document.querySelector(".ec-nav")?.classList.add("is-solid");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".ec-cohort-copy .ec-h1", {
        type: "lines",
        mask: "lines",
        linesClass: "ec-line",
      });
      gsap.from(split.lines, { yPercent: 115, duration: 1.2, ease: "power4.out", stagger: 0.12, delay: 0.25 });
      gsap.from(".ec-cohort-copy > *:not(.ec-h1)", {
        opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.55,
      });
      gsap.from(".ec-cohort-media", { opacity: 0, scale: 0.97, duration: 1.4, ease: "power3.out", delay: 0.4 });
      gsap.from(".ec-callout", {
        opacity: 0, x: 24, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.9,
      });
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
      {/* ---------- hero: build your brand, build your legacy ---------- */}
      <section className="ec-sheet" aria-label="The Founder Cohort">
        <div className="ec-cohort-hero">
          <div className="ec-cohort-copy">
            <span className="ec-eyebrow">The Founder Cohort</span>
            <h1 className="ec-h1">
              Build your brand.
              <br />
              <em>Build your legacy.</em>
            </h1>
            <div className="ec-cohort-rule" aria-hidden="true" />
            <p className="ec-lede">
              A self-paced experience with written instructor feedback on brand work during the 90-day feedback window for founders and CEOs ready to go from clarity
              to category leader.
            </p>
            <div className="ec-cohort-feats">
              {FEATS.map((f) => (
                <div className="ec-feat" key={f.name}>
                  <span className="ec-feat-ico">
                    <svg viewBox="0 0 17 17">{f.icon}</svg>
                  </span>
                  <span>
                    <div className="ec-feat-name">{f.name}</div>
                    <div className="ec-feat-gloss">{f.gloss}</div>
                  </span>
                </div>
              ))}
            </div>
            <div className="ec-build-ctas">
              <Link to="/cohort/apply" className="ec-btn ec-btn-crimson">
                Join the Cohort <span className="ec-btn-arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="ec-cohort-media">
            <img
              src="/estate-assets/cohort-hero.webp"
              alt="Cross-section of the Core Truth House estate — Estate, Systems, House, Structure, and Foundation floors labelled"
            />
          </div>
        </div>
      </section>

      {/* ---------- breakthrough band ---------- */}
      <section className="ec-brk" aria-label="It's your brand breakthrough">
        <div className="ec-brk-inner ec-reveal">
          <div>
            <div className="ec-brk-eyebrow">This isn't another course.</div>
            <div className="ec-brk-title">
              It's your brand
              <br />
              breakthrough.
            </div>
          </div>
          {BREAKTHROUGH.map((b) => (
            <div className="ec-brk-col" key={b.title}>
              <span className="ec-brk-ico">
                <svg viewBox="0 0 18 18">{b.icon}</svg>
              </span>
              <span className="ec-brk-col-title">{b.title}</span>
              <span className="ec-brk-col-body">{b.body}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Self-paced experience + founding offer ---------- */}
      <section className="ec-twelve ec-sheet" aria-label="A self-paced experience">
        <div className="ec-twelve-inner">
          <div className="ec-reveal">
            <div className="ec-twelve-head">
              <div className="ec-titleblock">
                <span className="ec-titleblock-no">Sheet CO-100</span>
                <span>Inside the cohort</span>
              </div>
              <h2 className="ec-h2">
                Build at <em>your own pace</em>.
              </h2>
              <span className="ec-twelve-kicker">self-paced · written instructor feedback · no live sessions</span>
            </div>
            {STEPS.map(([no, title, sub]) => (
              <div className="ec-twelve-item" key={no}>
                <span className="ec-twelve-no">{no}</span>
                <span>
                  <div className="ec-twelve-title">{title}</div>
                  <div className="ec-twelve-sub">{sub}</div>
                </span>
              </div>
            ))}
            <img
              className="ec-twelve-sketch"
              src="/estate-assets/cohort-sketch.webp"
              alt=""
              aria-hidden="true"
            />
          </div>

          <div style={{ position: "relative" }} className="ec-reveal">
            <div className="ec-founding">
              <CohortPhase />
              <span className="ec-founding-pill">Founding Cohort</span>
              <span className="ec-founding-title">
                Founding membership: initially <em>12 seats</em>
              </span>
              <span className="ec-founding-note">
                Founding members receive written instructor feedback on submitted brand work during the 90-day feedback window.
              </span>
              <div className="ec-founding-pricebox">
                <div className="ec-founding-pricelabel">Founding price</div>
                <div className="ec-founding-price">$495 USD</div>
                <div className="ec-founding-terms">One-time payment · lifetime Estate access · Non-refundable. See <Link to="/enrollment-policy">Enrollment Policy</Link>.</div>
              </div>
              <ul>
                {OFFER.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <Link to="/cohort/apply" className="ec-btn ec-btn-gold">
                Apply for the Cohort <span className="ec-btn-arrow">→</span>
              </Link>
              <span className="ec-founding-close">One additional batch of 3 opens only after 12 initial members have verified successful payments. Maximum 15 members. No referral required.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- final: your brand is the blueprint ---------- */}
      <section className="ec-cohort-final ec-sheet" aria-label="Your legacy starts with a decision">
        <img
          className="ec-cohort-final-ghost"
          src="/estate-assets/cohort-door.webp"
          alt=""
          aria-hidden="true"
        />
        <div className="ec-cohort-final-inner ec-reveal">
          <span className="ec-twelve-kicker">your legacy starts with a decision</span>
          <h2 className="ec-h2">
            Your brand is the blueprint.
            <br />
            We help you <em>build it</em>.
          </h2>
        </div>
      </section>
    </div>
  );
}

function CohortPhase() {
  const [expanded, setExpanded] = React.useState(null);
  React.useEffect(() => {
    let disposed = false;
    const refresh = () => fetch(apiClient.buildApiUrl("/api/cohort/phase")).then(r => r.ok ? r.json() : Promise.reject()).then(p => { if (!disposed) setExpanded(p.additional_batch_open === true); }).catch(() => { if (!disposed) setExpanded(null); });
    void refresh(); const timer = setInterval(refresh, 30000);
    return () => { disposed = true; clearInterval(timer); };
  }, []);
  return <p aria-live="polite">{expanded === true ? "The additional batch of 3 Founding seats is open at $495 USD one-time. Non-refundable. See Enrollment Policy. Maximum 15 members." : expanded === false ? "Initial offer: 12 Founding seats at $495 USD one-time. Non-refundable. See Enrollment Policy. No remaining-seat count is claimed." : "Enrollment availability is being verified."}</p>;
}
