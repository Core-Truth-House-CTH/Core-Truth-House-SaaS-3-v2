import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
 { label: "The System", to: "/methodology" },
 { label: "Tiers", to: "/tiers" },
 { label: "Studios", to: "/store" },
 { label: "Cohort", to: "/cohort" },
 { label: "About", to: "/about" },
];

function isActive(item, active) {
 if (!active) return false;

 const normalized = active.toLowerCase();

 if (item.label === "Studios" && normalized === "store") return true;
 if (item.label === "About" && normalized === "about") return true;
 if (item.label === "The System" && normalized === "system") return true;
 if (item.label === "Tiers" && (normalized === "tiers" || normalized === "pricing")) return true;

 return item.label.toLowerCase() === normalized;
}

export default function PublicHeader({ active = "" }) {
 const [menuOpen, setMenuOpen] = useState(false);
 const location = useLocation();

 useEffect(() => {
 setMenuOpen(false);
 }, [location.pathname]);

 useEffect(() => {
 if (!menuOpen) return undefined;

 const previousOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";

 return () => {
 document.body.style.overflow = previousOverflow;
 };
 }, [menuOpen]);

 return (
 <header className="cth-public-header">
 <div className="cth-public-shell cth-public-header-inner">
 <Link to="/" className="cth-public-wordmark" aria-label="Core Truth House home">
 <img
 src="/brand-assets/logo/cth-logo-seal.png"
 alt=""
 aria-hidden="true"
 className="cth-public-logo-seal"
 />
 <span>Core Truth House</span>
 </Link>

 <nav className="cth-public-nav" aria-label="Public navigation">
 {navItems.map((item) =>
 item.to ? (
 <Link
 key={item.label}
 to={item.to}
 className={isActive(item, active) ? "active" : ""}
 >
 {item.label}
 </Link>
 ) : (
 <a
 key={item.label}
 href={item.href}
 className={isActive(item, active) ? "active" : ""}
 >
 {item.label}
 </a>
 )
 )}
 </nav>

 <div className="cth-public-actions">
 <a href="/brand-diagnostic/" className="cth-public-header-cta">
 Start the Brand Diagnostic
 </a>

 <Link to="/sign-in" className="cth-public-login-link">
 Login
 </Link>

 <button
 type="button"
 className="cth-public-menu-toggle"
 aria-label={menuOpen ? "Close menu" : "Open menu"}
 aria-expanded={menuOpen}
 aria-controls="cth-public-mobile-menu"
 onClick={() => setMenuOpen((open) => !open)}
 >
 {menuOpen ? (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
 <line x1="6" y1="6" x2="18" y2="18" />
 <line x1="18" y1="6" x2="6" y2="18" />
 </svg>
 ) : (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
 <line x1="3" y1="7" x2="21" y2="7" />
 <line x1="3" y1="12" x2="21" y2="12" />
 <line x1="3" y1="17" x2="21" y2="17" />
 </svg>
 )}
 </button>
 </div>
 </div>

 {menuOpen && (
 <button
 type="button"
 className="cth-public-mobile-backdrop"
 aria-label="Close menu"
 onClick={() => setMenuOpen(false)}
 />
 )}

 {menuOpen && (
 <div className="cth-public-mobile-menu" id="cth-public-mobile-menu">
 <nav className="cth-public-mobile-nav" aria-label="Mobile navigation">
 {navItems.map((item) =>
 item.to ? (
 <Link
 key={item.label}
 to={item.to}
 className={isActive(item, active) ? "active" : ""}
 onClick={() => setMenuOpen(false)}
 >
 {item.label}
 </Link>
 ) : (
 <a
 key={item.label}
 href={item.href}
 className={isActive(item, active) ? "active" : ""}
 onClick={() => setMenuOpen(false)}
 >
 {item.label}
 </a>
 )
 )}
 </nav>

 <div className="cth-public-mobile-actions">
 <a
 href="/brand-diagnostic/"
 className="cth-public-header-cta"
 onClick={() => setMenuOpen(false)}
 >
 Start the Brand Diagnostic
 </a>
 <Link
 to="/sign-in"
 className="cth-public-mobile-login"
 onClick={() => setMenuOpen(false)}
 >
 Login
 </Link>
 </div>
 </div>
 )}

 <style>{`
 .cth-public-header {
 position: sticky;
 top: 0;
 z-index: 100;
 background: rgba(248, 241, 236, 0.96);
 border-bottom: 1px solid var(--cth-border);
 backdrop-filter: blur(16px);
 }

 .cth-public-shell {
 width: min(1540px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-public-header-inner {
 min-height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-public-wordmark {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 color: var(--cth-purple-deep);
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 20px;
 font-weight: 800;
 letter-spacing: -0.03em;
 white-space: nowrap;
 }

 .cth-public-logo-seal {
 width: 42px;
 height: 42px;
 object-fit: contain;
 display: block;
 }

 .cth-public-nav {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 30px;
 margin-left: auto;
 }

 .cth-public-nav a {
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 12px;
 font-weight: 850;
 letter-spacing: 0.045em;
 transition: color 180ms ease;
 white-space: nowrap;
 }

 .cth-public-nav a:hover,
 .cth-public-nav a.active {
 color: var(--cth-crimson);
 }

 .cth-public-actions {
 display: inline-flex;
 align-items: center;
 gap: 16px;
 margin-left: 6px;
 }

 .cth-public-header-cta {
 min-height: 44px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 padding: 0 22px;
 border-radius: 6px;
 background: var(--cth-crimson);
 color: var(--cth-white);
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.12em;
 font-size: 10.5px;
 font-weight: 950;
 box-shadow: 0 14px 28px rgba(175, 0, 36, 0.16);
 transition: background 180ms ease, transform 180ms ease;
 white-space: nowrap;
 }

 .cth-public-header-cta:hover {
 background: var(--cth-action-hover);
 transform: translateY(-1px);
 }

 .cth-public-login-link {
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 12px;
 font-weight: 850;
 letter-spacing: 0.045em;
 white-space: nowrap;
 transition: color 180ms ease;
 }

 .cth-public-login-link:hover {
 color: var(--cth-crimson);
 }

 .cth-public-menu-toggle {
 display: none;
 align-items: center;
 justify-content: center;
 width: 44px;
 height: 44px;
 margin-left: 4px;
 padding: 0;
 border: 1px solid var(--cth-border);
 border-radius: 6px;
 background: transparent;
 color: var(--cth-ruby);
 cursor: pointer;
 transition: color 180ms ease, border-color 180ms ease;
 }

 .cth-public-menu-toggle:hover {
 color: var(--cth-crimson);
 border-color: var(--cth-crimson);
 }

 .cth-public-menu-toggle svg {
 width: 22px;
 height: 22px;
 display: block;
 }

 .cth-public-mobile-backdrop {
 display: none;
 position: absolute;
 top: 100%;
 left: 0;
 right: 0;
 height: 100vh;
 border: 0;
 padding: 0;
 margin: 0;
 background: rgba(43, 16, 64, 0.32);
 background: color-mix(in srgb, var(--cth-purple-deep) 32%, transparent);
 backdrop-filter: blur(2px);
 cursor: default;
 z-index: 98;
 }

 .cth-public-mobile-menu {
 display: none;
 position: absolute;
 top: 100%;
 left: 0;
 right: 0;
 background: rgba(248, 241, 236, 0.98);
 border-bottom: 1px solid var(--cth-border);
 backdrop-filter: blur(16px);
 box-shadow: 0 24px 44px rgba(43, 16, 64, 0.14);
 padding: 16px 0 24px;
 z-index: 99;
 }

 .cth-public-mobile-nav {
 width: min(100% - 34px, 1540px);
 margin: 0 auto;
 display: flex;
 flex-direction: column;
 }

 .cth-public-mobile-nav a {
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 15px;
 font-weight: 850;
 letter-spacing: 0.04em;
 padding: 15px 4px;
 border-bottom: 1px solid var(--cth-border);
 transition: color 180ms ease;
 }

 .cth-public-mobile-nav a:hover,
 .cth-public-mobile-nav a.active {
 color: var(--cth-crimson);
 }

 .cth-public-mobile-actions {
 width: min(100% - 34px, 1540px);
 margin: 20px auto 0;
 display: flex;
 flex-direction: column;
 gap: 14px;
 }

 .cth-public-mobile-actions .cth-public-header-cta {
 width: 100%;
 }

 .cth-public-mobile-login {
 color: var(--cth-ruby);
 text-decoration: none;
 text-align: center;
 font-size: 13px;
 font-weight: 850;
 letter-spacing: 0.045em;
 padding: 4px;
 transition: color 180ms ease;
 }

 .cth-public-mobile-login:hover {
 color: var(--cth-crimson);
 }

 @media (max-width: 1100px) {
 .cth-public-shell {
 width: min(100% - 34px, 1540px);
 }

 .cth-public-nav {
 display: none;
 }

 .cth-public-menu-toggle {
 display: inline-flex;
 }

 .cth-public-mobile-backdrop {
 display: block;
 }

 .cth-public-mobile-menu {
 display: block;
 }

 .cth-public-actions {
 margin-left: auto;
 }
 }

 @media (max-width: 640px) {
 .cth-public-header-inner {
 min-height: 68px;
 gap: 14px;
 }

 .cth-public-wordmark span {
 font-size: 17px;
 }

 .cth-public-logo-seal {
 width: 38px;
 height: 38px;
 }



 .cth-public-header-cta {
 min-height: 40px;
 padding: 0 13px;
 font-size: 9.5px;
 letter-spacing: 0.08em;
 }

 .cth-public-login-link {
 display: none;
 }
 }

 @media (max-width: 430px) {
 .cth-public-wordmark span {
 display: none;
 }
 }
 `}</style>
 </header>
 );
}
