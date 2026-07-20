// Estate concept — THE STORE. "Tools. Frameworks. Transformation."
// Strategic assets rooted in the Core Truth House Operating System:
// hero product scene, assurance band, featured resources, bundle + gift.

import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const ASSET = (name) => `/estate-assets/${name}`;

const HERO_MARKS = [
  { label: "Built for founders", icon: <path d="M11 1.5 19 5 v6 c0 5 -4 8.5 -8 9.5 -4 -1 -8 -4.5 -8 -9.5 V5 z" /> },
  { label: "Strategic by design", icon: <path d="M11 1.5 20.5 8 11 20.5 1.5 8 z M1.5 8 h19 M11 1.5 6 8 l5 12.5 5 -12.5 z" /> },
  {
    label: "Instant access, forever value",
    icon: (
      <>
        <circle cx="6" cy="14" r="4" />
        <path d="M8.8 11.2 20 0 M16 4 l3 3 M13 7 l3 3" />
      </>
    ),
  },
];

const ASSURE_BAND = [
  { title: "Instant Access", body: "Download and start using immediately.", icon: <path d="M11 2 20 6.5 v9 L11 20 2 15.5 v-9 z M2 6.5 11 11 20 6.5 M11 11 v9" /> },
  { title: "Founder Trusted", body: "Resources proven inside the Core Truth House community.", icon: <path d="M11 1.5 19 5 v6 c0 5 -4 8.5 -8 9.5 -4 -1 -8 -4.5 -8 -9.5 V5 z M7.5 11 l2.5 2.5 5 -5.5" /> },
  { title: "Strategic Edge", body: "Designed to save you time and drive clarity, not add noise.", icon: (<><circle cx="11" cy="9" r="6" /><path d="M11 3 l1.5 3 3.2 0.4 -2.3 2.3 0.6 3.2 L11 10.6 8 12.2 8.6 9 6.3 6.7 9.5 6.3 z" /></>) },
  { title: "Dedicated Support", body: "We're here if you have questions or need guidance.", icon: (<><path d="M4 12 v-1 a7 7 0 0 1 14 0 v1" /><rect x="2.5" y="12" width="3.5" height="6" rx="1.2" /><rect x="16" y="12" width="3.5" height="6" rx="1.2" /></>) },
];

const PRODUCTS = [
  {
    title: "Brand Blueprint System",
    desc: "The foundational framework for building an unforgettable brand from the inside out.",
    price: "$97",
    img: "product-blueprint.png",
  },
  {
    title: "The Brand Architect Playbook",
    desc: "Step-by-step guidance to clarify your message, position your offer, and attract the right people.",
    price: "$67",
    img: "product-playbook.png",
  },
  {
    title: "Brand Strategy Templates",
    desc: "Done-for-you templates to streamline your strategy and execute with confidence.",
    price: "$47",
    img: "product-templates.png",
  },
  {
    title: "CTH Signature Mug",
    desc: "A daily reminder that you're building legacy. Sip with intention.",
    price: "$27",
    img: "product-mug.png",
  },
];

const ASSURE_FOOT = [
  { title: "Secure Checkout", body: "Your information is always protected.", icon: <path d="M13 2 21 5.5 v7 c0 5 -4.5 8.5 -8 9.5 -3.5 -1 -8 -4.5 -8 -9.5 v-7 z" /> },
  { title: "Lifetime Access", body: "Yours forever. No subscriptions.", icon: <path d="M4 8 a7 7 0 0 1 12 -3 l2 2 M18 3 v4 h-4 M18 14 a7 7 0 0 1 -12 3 l-2 -2 M4 19 v-4 h4" /> },
  { title: "Download & Go", body: "Use on your devices immediately.", icon: <path d="M11 2 v11 M6 9 l5 5 5 -5 M3 18 h16" /> },
  { title: "Satisfaction Guaranteed", body: "If it doesn't serve you, let us know.", icon: (<><circle cx="11" cy="9" r="6" /><path d="M11 3 l1.5 3 3.2 0.4 -2.3 2.3 0.6 3.2 L11 10.6 8 12.2 8.6 9 6.3 6.7 9.5 6.3 z" /></>) },
];

export default function EstateStorePage() {
  const rootRef = useRef(null);

  useEffect(() => {
    document.title = "The Store — Core Truth House";
  }, []);

  useEffect(() => {
    document.querySelector(".ec-nav")?.classList.add("is-solid");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const split = SplitText.create(".ec-shop-hero .ec-h1", { type: "lines", mask: "lines", linesClass: "ec-line" });
      gsap.from(split.lines, { yPercent: 115, duration: 1.2, ease: "power4.out", stagger: 0.12, delay: 0.25 });
      gsap.from(".ec-shop-hero-copy > *:not(.ec-h1)", { opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.55 });
      gsap.from(".ec-shop-hero-media", { opacity: 0, scale: 0.97, duration: 1.4, ease: "power3.out", delay: 0.4 });
      gsap.utils.toArray(".ec-reveal").forEach((el) => {
        gsap.from(el.children, {
          opacity: 0, y: 32, duration: 1, ease: "power3.out", stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });
      return () => split.revert();
    }, rootRef);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* ---------- hero ---------- */}
      <section className="ec-sheet" aria-label="The Store">
        <div className="ec-shop-hero">
          <div className="ec-shop-hero-copy">
            <span className="ec-eyebrow">The Store</span>
            <h1 className="ec-h1">
              Tools. Frameworks.
              <br />
              <em>Transformation.</em>
            </h1>
            <div className="ec-cohort-rule" aria-hidden="true" />
            <p className="ec-lede">
              Strategic assets designed to give you clarity today and compound results
              tomorrow. Every resource is rooted in the Core Truth House Operating System.
            </p>
            <div className="ec-shop-marks">
              {HERO_MARKS.map((m) => (
                <div className="ec-shop-mark" key={m.label}>
                  <svg viewBox="0 0 22 22">{m.icon}</svg>
                  <span className="ec-shop-mark-label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ec-shop-hero-media">
            <img src={ASSET("store-hero.png")} alt="Brand Blueprint System book, Brand Architect Playbook on a tablet, and a Core Truth House mug on a marble tray" />
          </div>
        </div>
      </section>

      {/* ---------- assurance band ---------- */}
      <section className="ec-brk" aria-label="Why the store">
        <div className="ec-brk-inner is-four ec-reveal">
          {ASSURE_BAND.map((a) => (
            <div className="ec-brk-col" key={a.title}>
              <span className="ec-brk-ico">
                <svg viewBox="0 0 22 22">{a.icon}</svg>
              </span>
              <span className="ec-brk-col-title">{a.title}</span>
              <span className="ec-brk-col-body">{a.body}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- featured resources ---------- */}
      <section className="ec-shop" aria-label="Featured resources">
        <div className="ec-shop-inner">
          <div className="ec-shop-head ec-reveal">
            <div className="ec-shop-head-main">
              <div className="ec-titleblock">
                <span className="ec-titleblock-no">Sheet S-100</span>
                <span>Featured resources</span>
              </div>
              <h2 className="ec-h2">
                Start. Scale. <em>Systemize.</em>
              </h2>
            </div>
            <a href="#all" className="ec-plan-detail-link">
              View all products →
            </a>
          </div>

          <div className="ec-shop-grid">
            {PRODUCTS.map((p) => (
              <div className="ec-shop-card" key={p.title}>
                <div className="ec-shop-card-media">
                  <img src={ASSET(p.img)} alt={p.title} loading="lazy" />
                </div>
                <div className="ec-shop-card-body">
                  <span className="ec-shop-card-title">{p.title}</span>
                  <span className="ec-shop-card-desc">{p.desc}</span>
                  <span className="ec-shop-card-price">{p.price}</span>
                  <Link to="/store" className="ec-btn ec-btn-gold">
                    Add to cart
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* bundle + gift */}
          <div className="ec-shop-offers ec-reveal">
            <div className="ec-bundle">
              <div className="ec-bundle-copy">
                <span className="ec-bundle-kicker">Bundle &amp; save</span>
                <span className="ec-bundle-title">The Founder's Foundation Kit</span>
                <span className="ec-bundle-note">
                  Everything you need to build your brand on truth, strategy, and clarity.
                </span>
                <div className="ec-bundle-price">
                  <span className="ec-price-now">$187</span>
                  <span className="ec-price-was">$238</span>
                </div>
                <Link to="/store" className="ec-btn ec-btn-gold">
                  Get the bundle
                </Link>
              </div>
              <div className="ec-bundle-media">
                <img src={ASSET("store-bundle.png")} alt="The Founder's Foundation Kit — book, playbook, templates, and mug" />
              </div>
              <div className="ec-bundle-badge">Best Value</div>
            </div>

            <div className="ec-gift">
              <span className="ec-gift-ico">
                <svg viewBox="0 0 40 40">
                  <rect x="6" y="16" width="28" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M4 16 h32 v6 H4 z M20 10 v24 M20 16 c-3 -8 -10 -6 -8 -1 M20 16 c3 -8 10 -6 8 -1" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </span>
              <span className="ec-gift-kicker">Gift it. Share it. Elevate together.</span>
              <span className="ec-gift-title">
                Digital Products
                <br />
                Make the Perfect Gift
              </span>
              <span className="ec-gift-note">Give clarity. Give strategy. Give transformation.</span>
              <Link to="/store" className="ec-btn ec-btn-outline-crimson">
                Send a gift card
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- assurance footer ---------- */}
      <section className="ec-assure" id="all" aria-label="Store assurances">
        <div className="ec-assure-inner ec-reveal">
          {ASSURE_FOOT.map((a) => (
            <div className="ec-assure-item" key={a.title}>
              <svg viewBox="0 0 22 22">{a.icon}</svg>
              <span>
                <div className="ec-assure-title">{a.title}</div>
                <div className="ec-assure-body">{a.body}</div>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
