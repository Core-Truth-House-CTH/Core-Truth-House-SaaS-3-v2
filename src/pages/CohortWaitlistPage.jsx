import React from "react";
import { Link, useLocation } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import CohortWaitlistForm from "../components/cohort/CohortWaitlistForm.jsx";
import { parseWaitlistQuery } from "../lib/cohortWaitlist.mjs";

// Public waitlist page. Brand Diagnostic results and the /cohort page send
// people here; ?tier= shows the routed tier as "where you'd start".
export default function CohortWaitlistPage() {
  const { search } = useLocation();
  const { source, tier } = parseWaitlistQuery(search);
  return (
    <div className="cth-waitlist-page">
      <PublicHeader active="cohort" />
      <main className="cth-waitlist-page-shell">
        <p className="cth-waitlist-page-eyebrow">The Core Truth Cohort</p>
        <h1>The Founding Cohort</h1>
        <p className="cth-waitlist-page-sub">
          A self-paced cohort for founders building their brand on a clear foundation. <Link to="/cohort">See what's included</Link>.
        </p>
        <CohortWaitlistForm source={source} recommendedTier={tier} />
      </main>
      <PublicFooter />
      <style>{`
        .cth-waitlist-page { background: #f8f4f2; color: var(--cth-purple-deep, #33033c); font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
        .cth-waitlist-page-shell { width: min(680px, calc(100vw - 48px)); margin: 0 auto; padding: 96px 0 120px; text-align: center; }
        .cth-waitlist-page-eyebrow { margin: 0 0 14px; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: var(--cth-crimson, #af0024); }
        .cth-waitlist-page h1 { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(2.2rem, 4vw, 3rem); line-height: 1.1; margin: 0 0 16px; }
        .cth-waitlist-page-sub { margin: 0 auto; max-width: 560px; line-height: 1.65; color: #4a3b4a; }
        .cth-waitlist-page-sub a { color: var(--cth-crimson, #af0024); }
      `}</style>
    </div>
  );
}
