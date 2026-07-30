// Estate shell — shared cinematic chrome (nav, footer, page transitions) for the public marketing site.
// Owns the fixed nav, the "turning the sheet" page transition, buttered scrolling,
// and the full site footer. Pages render through the outlet inside the smooth wrapper.

import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import "../../styles/estate-concept.css";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const ASSET = (name) => `/estate-assets/${name}`;

const TransitionContext = createContext({ go: (to) => {} });
export const useEstateNav = () => useContext(TransitionContext);

/* Link that leaves through the dark — internal estate routes only */
export function SheetLink({ to, className, children, ...rest }) {
  const { go } = useEstateNav();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export default function EstateShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const pendingRef = useRef(false);
  const firstRef = useRef(true);
  const [menuOpen, setMenuOpen] = useState(false);

  /* close the mobile menu on route change, and on Escape */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  /* buttered scroll for the whole concept site */
  useLayoutEffect(() => {
    gsap.set(overlayRef.current, { yPercent: 101 });
    const fine = window.matchMedia("(min-width: 1021px)").matches;
    const noPref = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    let smoother;
    if (fine && noPref) {
      smoother = ScrollSmoother.create({
        wrapper: "#ec-smooth-wrapper",
        content: "#ec-smooth-content",
        smooth: 1.4,
        effects: false,
      });
    }
    return () => smoother?.kill();
  }, []);

  const go = (to) => {
    if (to === location.pathname || pendingRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      navigate(to);
      return;
    }
    pendingRef.current = true;
    /* the sheet rises from below and covers the page */
    gsap.to(overlayRef.current, {
      yPercent: 0,
      duration: 0.55,
      ease: "power3.inOut",
      onComplete: () => navigate(to),
    });
  };

  /* on arrival: reset scroll, refresh triggers, lift the sheet */
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTop(0);
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    if (pendingRef.current) {
      /* the sheet lifts away upward, revealing the new page */
      gsap.to(overlayRef.current, {
        yPercent: -101,
        duration: 0.7,
        delay: 0.2,
        ease: "power3.inOut",
        onComplete: () => {
          gsap.set(overlayRef.current, { yPercent: 101 });
          pendingRef.current = false;
        },
      });
    }
  }, [location.pathname]);

  const navLink = (label, to) => (
    <SheetLink to={to} key={to}>
      {label}
    </SheetLink>
  );

  return (
    <TransitionContext.Provider value={{ go }}>
      <div className="ec-root">
        <header className="ec-nav">
          <SheetLink to="/" className="ec-nav-brand">
            <img src={ASSET("cth-seal.webp")} alt="" />
            <span className="ec-nav-wordmark">
              Core Truth
              <br />
              House
            </span>
          </SheetLink>
          <nav className="ec-nav-links" aria-label="Site">
            {navLink("The System", "/methodology")}
            {navLink("Tiers", "/tiers")}
            {navLink("Store", "/store")}
            {navLink("Cohort", "/cohort")}
            {navLink("About", "/about")}
            <Link to="/sign-in">Login</Link>
          </nav>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-crimson ec-nav-cta">
            Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
          <button
            type="button"
            className={`ec-nav-toggle${menuOpen ? " is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="ec-mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {/* ---------- mobile menu ---------- */}
        <div
          className={`ec-mobile-menu${menuOpen ? " is-open" : ""}`}
          id="ec-mobile-menu"
          hidden={!menuOpen}
        >
          <nav aria-label="Site (mobile)">
            <SheetLink to="/">Home</SheetLink>
            <SheetLink to="/methodology">The System</SheetLink>
            <SheetLink to="/tiers">Tiers</SheetLink>
            <SheetLink to="/store">Store</SheetLink>
            <SheetLink to="/cohort">Cohort</SheetLink>
            <SheetLink to="/about">About</SheetLink>
            <SheetLink to="/contact">Contact</SheetLink>
            <Link to="/sign-in" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </nav>
          <Link to="/brand-diagnostic/" className="ec-btn ec-btn-crimson" onClick={() => setMenuOpen(false)}>
            Start the Brand Diagnostic <span className="ec-btn-arrow">→</span>
          </Link>
        </div>

        <div id="ec-smooth-wrapper">
          <div id="ec-smooth-content">
            <Outlet />

            {/* ---------- full site footer ---------- */}
            <footer className="ec-bigfooter">
              <div className="ec-bigfooter-inner">
                <div className="ec-bigfooter-brand">
                  <img src={ASSET("cth-seal.webp")} alt="" />
                  <span className="ec-bigfooter-tagline">Where serious brands are built.</span>
                  <h4 style={{ marginTop: 18 }}>Newsletter</h4>
                  <form className="ec-newsletter" onSubmit={(e) => e.preventDefault()}>
                    <input type="email" placeholder="Email address" aria-label="Email address" />
                    <button type="submit">Join</button>
                  </form>
                  <span className="ec-newsletter-note">
                    Quiet strategy notes for serious founders.
                  </span>
                </div>
                <div>
                  <h4>The House</h4>
                  <ul>
                    <li>{navLink("The System", "/methodology")}</li>
                    <li>{navLink("Tiers", "/tiers")}</li>
                    <li>{navLink("Cohort", "/cohort")}</li>
                    <li><Link to="/brand-diagnostic/">The Diagnostic</Link></li>
                    <li>{navLink("About", "/about")}</li>
                    <li><Link to="/blog">Case Studies</Link></li>
                    <li>{navLink("FAQ", "/contact")}</li>
                  </ul>
                </div>
                <div>
                  <h4>Studios</h4>
                  <ul>
                    <li>{navLink("The Store", "/store")}</li>
                    <li><Link to="/store">AI Headshot Generator</Link></li>
                  </ul>
                  <h4 style={{ marginTop: 26 }}>Resources</h4>
                  <ul>
                    <li><Link to="/blog">Field Notes</Link></li>
                  </ul>
                </div>
                <div>
                  <h4>Connect</h4>
                  <ul>
                    <li>{navLink("Contact", "/contact")}</li>
                    <li><Link to="/sign-in">Member Login</Link></li>
                  </ul>
                  <h4 style={{ marginTop: 26 }}>Social handles</h4>
                  <div className="ec-social-row">
                    <a href="https://www.instagram.com/coretruthhouse/" target="_blank" rel="noopener noreferrer" aria-label="Core Truth House on Instagram">
                      <img src={ASSET("social-instagram.webp")} alt="" />
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=61589383311165" target="_blank" rel="noopener noreferrer" aria-label="Core Truth House on Facebook">
                      <img src={ASSET("social-facebook.webp")} alt="" />
                    </a>
                    <a href="https://www.tiktok.com/@coretruthhouse" target="_blank" rel="noopener noreferrer" aria-label="Core Truth House on TikTok">
                      <img src={ASSET("social-tiktok.webp")} alt="" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="ec-bigfooter-bottom">
                <span>© 2026 Core Truth House. All rights reserved.</span>
                <span className="ec-footer-hand">one blueprint · one builder · one legacy</span>
                <div style={{ display: "flex", gap: 22 }}>
                  <Link to="/terms">Terms of Service</Link>
                  <Link to="/privacy">Privacy Policy</Link>
                  <Link to="/privacy#cookies">Cookie Policy</Link>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* ---------- page transition: turning the sheet ---------- */}
        <div className="ec-turnsheet" ref={overlayRef} aria-hidden="true">
          <img src={ASSET("cth-seal.webp")} alt="" />
          <span>turning the sheet…</span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
