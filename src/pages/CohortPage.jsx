import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Monitor,
  Fingerprint,
  ClipboardList,
  User,
  Flower2,
  Columns3,
  Target,
  ArrowRight,
  Crown,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const HERO_IMAGE = "/cohort-assets/cth-cohort-hero-doorway.png";
const STANDARD_IMAGE = "/cohort-assets/cth-cohort-standard.jpg";

const FEATURE_STRIP = [
  { icon: Calendar, label: "4 Live Sessions" },
  { icon: Monitor, label: "Async Work Inside Core Truth House OS" },
  { icon: Fingerprint, label: "Core Truth Profile" },
  { icon: ClipboardList, label: "90-Day Brand Operations Plan" },
];

const WHO_CARDS = [
  {
    icon: User,
    title: "Founders who are showing up consistently but not converting",
    body: "You're visible. The results aren't matching the effort.",
  },
  {
    icon: Flower2,
    title: "Experts whose brand feels scattered or unclear",
    body: "Your message is strong in parts — but not together.",
  },
  {
    icon: Columns3,
    title: "Solo service-based founders 3 to 10 years in",
    body: "You've built the business. Now make it convert.",
  },
  {
    icon: Target,
    title: "Founders ready for positioning repair, not beginner branding",
    body: "This is not branding 101. It's clarity, architecture, and conversion.",
  },
];

const PHASES = [
  {
    num: "01",
    title: "Clarify",
    body: "We uncover your Core Truth and the real reason prospects aren't converting.",
  },
  {
    num: "02",
    title: "Position",
    body: "We architect a positioning statement that makes your value undeniable.",
  },
  {
    num: "03",
    title: "Convert",
    body: "We build a conversion path that moves the right people from interest to yes.",
  },
  {
    num: "04",
    title: "Operationalize",
    body: "We install your 90-day Brand Operations Plan so clarity becomes consistent action.",
  },
];

const FOUNDING_FEATURES = [
  "14-day positioning sprint",
  "Four live sessions",
  "Async work inside Core Truth House OS",
  "Core Truth Profile",
  "90-day Brand Operations plan",
  "Lifetime Estate tier access to the OS",
];

const STANDARD_FEATURES = [
  "14-day positioning sprint",
  "Four live sessions",
  "Async work inside Core Truth House OS",
  "Core Truth Profile",
  "90-day Brand Operations plan",
  "12-month Estate tier access to Core Truth House OS",
  "Alumni access to The Core Truth House Residency upon completion",
];

const LEAVE_WITH = [
  { icon: Target, body: "A sharper one-sentence positioning statement" },
  { icon: ArrowRight, body: "A clearer conversion path from first sentence to sale" },
  { icon: Fingerprint, body: "A Core Truth Profile and messaging clarity" },
  { icon: ClipboardList, body: "A 90-day Brand Operations plan" },
];

const FAQS = [
  {
    q: "Who is the cohort for?",
    a: "Solo service-based founders 3 to 10 years in who are showing up consistently but not converting. You have the skills. Your brand is not translating them into revenue.",
  },
  {
    q: "What if I need more foundational work?",
    a: "Take the Core Truth Scorecard first. If your score puts you in the Foundation Builder band, we will point you to the right entry point before the cohort. We do not admit founders who are not ready.",
  },
  {
    q: "What is the difference between Founding and Standard?",
    a: "Founding seats are $497 and include lifetime Estate tier access to Core Truth House OS. Standard seats are $997 and include 12-month Estate access. Founding pricing closes when Cohort 01 fills.",
  },
  {
    q: "Do I get access to Core Truth House OS?",
    a: "Yes. Both seats include Estate tier access to the OS. Your 90-day Brand Operations plan lives inside it and is designed to be executed there.",
  },
  {
    q: "What happens after the cohort ends?",
    a: "Founding members retain lifetime Estate access and join The Core Truth House Residency. Standard members retain 12-month access. After 12 months, alumni pricing on Structure tier locks in at $67 per month.",
  },
];

function Hero() {
  return (
    <section className="cth-cohort-hero">
      <div className="cth-cohort-shell cth-cohort-hero-grid">
        <div className="cth-cohort-hero-copy">
          <p className="cth-cohort-eyebrow cth-cohort-eyebrow-gold">Core Truth House</p>
          <h1>The Core Truth Cohort</h1>
          <p className="cth-cohort-hero-sub">
            A 14-day positioning sprint for solo founders who are{" "}
            <span className="cth-cohort-accent">consistent but not converting.</span>
          </p>
          <p className="cth-cohort-hero-body">
            You're showing up. You have depth, skill, and experience. But your positioning, messaging, or conversion path is leaking clarity. The Core Truth Cohort is a focused, high-touch sprint to repair what's costing you conversions and build a brand that finally performs.
          </p>
          <div className="cth-cohort-hero-ctas">
            <Link to="/cohort/apply" className="cth-cohort-btn cth-cohort-btn-primary">
              Apply for Cohort 01
            </Link>
            <a href="#pricing" className="cth-cohort-btn cth-cohort-btn-ghost">
              View Seat Options
            </a>
          </div>
          <p className="cth-cohort-hero-meta">
            Four live sessions &nbsp;•&nbsp; Async work inside the OS &nbsp;•&nbsp; Core Truth Profile &nbsp;•&nbsp; 90-day Brand Operations Plan
          </p>
        </div>
        <div className="cth-cohort-hero-image">
          <img src={HERO_IMAGE} alt="Architectural doorway, Core Truth House cohort." />
        </div>
      </div>
    </section>
  );
}

function FeatureStrip() {
  return (
    <section className="cth-cohort-strip">
      <div className="cth-cohort-shell cth-cohort-strip-grid">
        {FEATURE_STRIP.map(({ icon: Icon, label }) => (
          <div key={label} className="cth-cohort-strip-item">
            <Icon size={22} strokeWidth={1.5} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhoThisIsFor() {
  return (
    <section className="cth-cohort-section cth-cohort-ivory">
      <div className="cth-cohort-shell">
        <header className="cth-cohort-section-head">
          <p className="cth-cohort-eyebrow cth-cohort-eyebrow-crimson">Who This Is For</p>
          <h2>Built for Solo Founders Ready to Convert</h2>
        </header>
        <div className="cth-cohort-who-grid">
          {WHO_CARDS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="cth-cohort-who-card">
              <div className="cth-cohort-who-icon">
                <Icon size={24} strokeWidth={1.4} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SprintPhases() {
  return (
    <section className="cth-cohort-section cth-cohort-ivory cth-cohort-phases">
      <div className="cth-cohort-shell">
        <header className="cth-cohort-section-head">
          <p className="cth-cohort-eyebrow cth-cohort-eyebrow-crimson">What Happens in the Sprint</p>
          <h2>Four Phases, 14 Days</h2>
        </header>
        <div className="cth-cohort-phase-grid">
          {PHASES.map(({ num, title, body }) => (
            <div key={num} className="cth-cohort-phase">
              <span className="cth-cohort-phase-num">{num}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="cth-cohort-section cth-cohort-ivory">
      <div className="cth-cohort-shell">
        <header className="cth-cohort-section-head">
          <p className="cth-cohort-eyebrow cth-cohort-eyebrow-crimson">Choose Your Seat</p>
          <h2>Founding or Standard</h2>
        </header>
        <div className="cth-cohort-pricing-grid">
          <article className="cth-cohort-price-card cth-cohort-price-founding">
            <Crown className="cth-cohort-price-crown" size={28} strokeWidth={1.5} />
            <p className="cth-cohort-price-tier">Founding Seat</p>
            <p className="cth-cohort-price-amount">$497</p>
            <p className="cth-cohort-price-sub">Founding seat in The Core Truth Cohort.</p>
            <ul className="cth-cohort-price-list">
              {FOUNDING_FEATURES.map((feat) => (
                <li key={feat}>
                  <Check size={16} strokeWidth={2} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <Link to="/cohort/apply" className="cth-cohort-btn cth-cohort-btn-primary cth-cohort-btn-block">
              Claim Founding Seat
            </Link>
            <p className="cth-cohort-price-fineprint">
              This pricing and lifetime access do not carry to Cohort 02.
            </p>
          </article>

          <article
            className="cth-cohort-price-card cth-cohort-price-standard"
            style={{ backgroundImage: `linear-gradient(180deg, rgba(26,10,36,0.92), rgba(26,10,36,0.86)), url(${STANDARD_IMAGE})` }}
          >
            <Crown className="cth-cohort-price-crown" size={28} strokeWidth={1.5} />
            <p className="cth-cohort-price-tier">Standard Seat</p>
            <p className="cth-cohort-price-amount">$997 <span className="cth-cohort-price-amount-sub">one-time</span></p>
            <p className="cth-cohort-price-sub">Seat in The Core Truth Cohort.</p>
            <ul className="cth-cohort-price-list">
              {STANDARD_FEATURES.map((feat) => (
                <li key={feat}>
                  <Check size={16} strokeWidth={2} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <Link to="/cohort/apply" className="cth-cohort-btn cth-cohort-btn-primary cth-cohort-btn-block">
              Apply for Standard Seat
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

function WhatYouLeaveWith() {
  return (
    <section className="cth-cohort-section cth-cohort-ivory">
      <div className="cth-cohort-shell">
        <header className="cth-cohort-section-head">
          <p className="cth-cohort-eyebrow cth-cohort-eyebrow-crimson">What You Leave With</p>
          <h2>Four Outcomes in Fourteen Days</h2>
        </header>
        <div className="cth-cohort-leave-grid">
          {LEAVE_WITH.map(({ icon: Icon, body }) => (
            <div key={body} className="cth-cohort-leave-item">
              <div className="cth-cohort-leave-icon">
                <Icon size={22} strokeWidth={1.4} />
              </div>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="cth-cohort-section cth-cohort-white">
      <div className="cth-cohort-shell cth-cohort-faq-shell">
        <header className="cth-cohort-section-head">
          <p className="cth-cohort-eyebrow cth-cohort-eyebrow-crimson">Frequently Asked Questions</p>
          <h2>What Founders Ask Before Applying</h2>
        </header>
        <div className="cth-cohort-faq-list">
          {FAQS.map((item, idx) => {
            const open = openIndex === idx;
            return (
              <div key={item.q} className={`cth-cohort-faq-item ${open ? "open" : ""}`}>
                <button
                  type="button"
                  className="cth-cohort-faq-q"
                  onClick={() => setOpenIndex(open ? -1 : idx)}
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  {open ? <Minus size={18} strokeWidth={2} /> : <Plus size={18} strokeWidth={2} />}
                </button>
                {open ? <div className="cth-cohort-faq-a">{item.a}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="cth-cohort-final">
      <div className="cth-cohort-shell cth-cohort-final-grid">
        <div className="cth-cohort-final-copy">
          <h2>The sentence costing you conversions can be repaired.</h2>
          <p>
            Join a focused group of founders for a 14-day sprint to clarify, position, and convert with confidence.
          </p>
          <Link to="/cohort/apply" className="cth-cohort-btn cth-cohort-btn-primary">
            Apply for Cohort 01
          </Link>
        </div>
        <div className="cth-cohort-final-image">
          <img src={HERO_IMAGE} alt="" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

export default function CohortPage() {
  return (
    <div className="cth-cohort-page">
      <PublicHeader active="cohort" />

      <Hero />
      <FeatureStrip />
      <WhoThisIsFor />
      <SprintPhases />
      <Pricing />
      <WhatYouLeaveWith />
      <FAQ />
      <FinalCTA />

      <PublicFooter />

      <style>{`
        .cth-cohort-page {
          background: #f8f4f2;
          color: #2b1040;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }

        .cth-cohort-shell {
          width: min(1240px, calc(100vw - 96px));
          margin: 0 auto;
        }

        .cth-cohort-page h1,
        .cth-cohort-page h2,
        .cth-cohort-page h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .cth-cohort-eyebrow {
          margin: 0 0 14px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .cth-cohort-eyebrow-gold {
          color: #c4a95b;
        }

        .cth-cohort-eyebrow-crimson {
          color: #af0024;
        }

        .cth-cohort-accent {
          color: #e44966;
          font-style: italic;
        }

        .cth-cohort-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 26px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: background 180ms ease, transform 180ms ease, border-color 180ms ease;
        }

        .cth-cohort-btn-primary {
          background: #af0024;
          color: #fff;
          border: 1px solid #af0024;
          box-shadow: 0 16px 32px rgba(175, 0, 36, 0.22);
        }

        .cth-cohort-btn-primary:hover {
          background: #8e001d;
          transform: translateY(-1px);
        }

        .cth-cohort-btn-ghost {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.72);
        }

        .cth-cohort-btn-ghost:hover {
          border-color: #fff;
          transform: translateY(-1px);
        }

        .cth-cohort-btn-block {
          width: 100%;
        }

        /* HERO */
        .cth-cohort-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          background:
            radial-gradient(circle at 12% 8%, rgba(175, 0, 36, 0.22), transparent 38%),
            radial-gradient(circle at 88% 92%, rgba(196, 169, 91, 0.16), transparent 40%),
            #0d0010;
          color: #fff;
          padding: 120px 0 80px;
        }

        .cth-cohort-hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 60px;
          align-items: center;
        }

        .cth-cohort-hero-copy h1 {
          font-size: clamp(2.5rem, 5vw, 4.4rem);
          line-height: 1.05;
          color: #fff;
          margin-bottom: 22px;
        }

        .cth-cohort-hero-sub {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.1rem, 2vw, 1.5rem);
          line-height: 1.4;
          color: #fff;
          font-style: italic;
          margin: 0 0 20px;
        }

        .cth-cohort-hero-body {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.78);
          margin: 0 0 32px;
          max-width: 560px;
        }

        .cth-cohort-hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 26px;
        }

        .cth-cohort-hero-meta {
          font-size: 12px;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.58);
          margin: 0;
        }

        .cth-cohort-hero-image img {
          width: 100%;
          height: auto;
          max-height: 640px;
          object-fit: cover;
          border-radius: 6px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.45);
        }

        /* STRIP */
        .cth-cohort-strip {
          background: #1a0a24;
          color: #fff;
          padding: 28px 0;
        }

        .cth-cohort-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 24px;
        }

        .cth-cohort-strip-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 800;
        }

        .cth-cohort-strip-item svg {
          color: #c4a95b;
          flex-shrink: 0;
        }

        /* SECTIONS */
        .cth-cohort-section {
          padding: 96px 0;
        }

        .cth-cohort-ivory {
          background: #f8f4f2;
        }

        .cth-cohort-white {
          background: #ffffff;
        }

        .cth-cohort-section-head {
          text-align: center;
          margin-bottom: 56px;
        }

        .cth-cohort-section-head h2 {
          font-size: clamp(2rem, 3.6vw, 3rem);
          color: #2b1040;
          line-height: 1.15;
          max-width: 760px;
          margin: 0 auto;
        }

        /* WHO */
        .cth-cohort-who-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .cth-cohort-who-card {
          background: #fff;
          border: 1px solid rgba(216, 197, 195, 0.7);
          border-radius: 6px;
          padding: 32px 24px;
          text-align: center;
        }

        .cth-cohort-who-icon {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          margin: 0 auto 18px;
          display: grid;
          place-items: center;
          background: rgba(175, 0, 36, 0.06);
          color: #af0024;
          border: 1px solid rgba(175, 0, 36, 0.18);
        }

        .cth-cohort-who-card h3 {
          font-size: 17px;
          line-height: 1.3;
          color: #2b1040;
          margin: 0 0 12px;
        }

        .cth-cohort-who-card p {
          font-size: 14px;
          line-height: 1.55;
          color: #5b4a5b;
          margin: 0;
        }

        /* PHASES */
        .cth-cohort-phase-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 32px;
        }

        .cth-cohort-phase {
          padding-right: 16px;
        }

        .cth-cohort-phase-num {
          display: block;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 56px;
          line-height: 1;
          color: #af0024;
          margin-bottom: 18px;
        }

        .cth-cohort-phase h3 {
          font-size: 22px;
          color: #2b1040;
          margin: 0 0 12px;
        }

        .cth-cohort-phase p {
          font-size: 14.5px;
          line-height: 1.6;
          color: #4a3b4a;
          margin: 0;
        }

        /* PRICING */
        .cth-cohort-pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
          max-width: 980px;
          margin: 0 auto;
        }

        .cth-cohort-price-card {
          position: relative;
          padding: 42px 36px 36px;
          border-radius: 8px;
          color: #fff;
          background-size: cover;
          background-position: center;
        }

        .cth-cohort-price-founding {
          background: #6b0f1a;
        }

        .cth-cohort-price-standard {
          background-color: #1a0a24;
        }

        .cth-cohort-price-crown {
          color: #c4a95b;
          margin-bottom: 18px;
        }

        .cth-cohort-price-tier {
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 800;
          margin: 0 0 14px;
          color: rgba(255, 255, 255, 0.86);
        }

        .cth-cohort-price-amount {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 56px;
          line-height: 1;
          margin: 0 0 12px;
        }

        .cth-cohort-price-founding .cth-cohort-price-amount {
          color: #c4a95b;
        }

        .cth-cohort-price-amount-sub {
          font-size: 16px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-style: italic;
          color: rgba(255, 255, 255, 0.72);
          margin-left: 6px;
        }

        .cth-cohort-price-sub {
          margin: 0 0 24px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.76);
        }

        .cth-cohort-price-list {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: grid;
          gap: 11px;
        }

        .cth-cohort-price-list li {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          font-size: 14.5px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.92);
        }

        .cth-cohort-price-list svg {
          color: #c4a95b;
          margin-top: 3px;
          flex-shrink: 0;
        }

        .cth-cohort-price-fineprint {
          margin: 16px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.56);
          font-style: italic;
        }

        /* LEAVE WITH */
        .cth-cohort-leave-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 22px;
        }

        .cth-cohort-leave-item {
          background: #fff;
          border: 1px solid rgba(216, 197, 195, 0.7);
          border-radius: 6px;
          padding: 28px 22px;
          text-align: center;
        }

        .cth-cohort-leave-icon {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          margin: 0 auto 16px;
          display: grid;
          place-items: center;
          color: #c4a95b;
          background: rgba(196, 169, 91, 0.12);
          border: 1px solid rgba(196, 169, 91, 0.32);
        }

        .cth-cohort-leave-item p {
          font-size: 14.5px;
          line-height: 1.55;
          color: #2b1040;
          margin: 0;
        }

        /* FAQ */
        .cth-cohort-faq-shell {
          max-width: 880px;
        }

        .cth-cohort-faq-list {
          display: grid;
          gap: 12px;
        }

        .cth-cohort-faq-item {
          border: 1px solid rgba(216, 197, 195, 0.7);
          border-radius: 6px;
          background: #fff;
          overflow: hidden;
        }

        .cth-cohort-faq-q {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 24px;
          border: 0;
          background: transparent;
          text-align: left;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          color: #2b1040;
          cursor: pointer;
        }

        .cth-cohort-faq-q svg {
          color: #af0024;
          flex-shrink: 0;
        }

        .cth-cohort-faq-a {
          padding: 0 24px 22px;
          font-size: 15px;
          line-height: 1.65;
          color: #4a3b4a;
        }

        /* FINAL CTA */
        .cth-cohort-final {
          background:
            radial-gradient(circle at 12% 92%, rgba(175, 0, 36, 0.26), transparent 38%),
            radial-gradient(circle at 92% 8%, rgba(196, 169, 91, 0.14), transparent 40%),
            #0d0010;
          color: #fff;
          padding: 96px 0;
        }

        .cth-cohort-final-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        .cth-cohort-final-copy h2 {
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          color: #fff;
          line-height: 1.15;
          margin: 0 0 22px;
        }

        .cth-cohort-final-copy p {
          font-size: 15.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.78);
          margin: 0 0 30px;
          max-width: 520px;
        }

        .cth-cohort-final-image img {
          width: 100%;
          height: auto;
          max-height: 380px;
          object-fit: cover;
          border-radius: 6px;
          opacity: 0.85;
        }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .cth-cohort-shell {
            width: min(100% - 34px, 1240px);
          }

          .cth-cohort-hero-grid,
          .cth-cohort-final-grid {
            grid-template-columns: 1fr;
          }

          .cth-cohort-hero {
            min-height: auto;
            padding: 100px 0 70px;
          }

          .cth-cohort-strip-grid,
          .cth-cohort-who-grid,
          .cth-cohort-phase-grid,
          .cth-cohort-leave-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cth-cohort-pricing-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .cth-cohort-section {
            padding: 72px 0;
          }

          .cth-cohort-strip-grid,
          .cth-cohort-who-grid,
          .cth-cohort-phase-grid,
          .cth-cohort-leave-grid {
            grid-template-columns: 1fr;
          }

          .cth-cohort-price-card {
            padding: 34px 24px;
          }

          .cth-cohort-price-amount {
            font-size: 46px;
          }
        }
      `}</style>
    </div>
  );
}
