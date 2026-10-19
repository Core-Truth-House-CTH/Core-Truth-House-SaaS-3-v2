import React, { useCallback, useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import ApiClientBootstrap from "./ApiClientBootstrap";
import { HAS_CLERK } from "../hooks/useAuth";
import { useAuth } from "../hooks/useAuth";
import { WorkspaceProvider, useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import { buildLiveDimensions, questions } from "../utils/diagnosticDimensions";
import { buildDiagnosticAuthPath } from "../pages/brandDiagnosticDraft.mjs";

const CLERK_KEY_RAW = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const RESPONSE_LABELS = ["", "Not yet", "Somewhat", "Mostly", "Yes"];
const tierPlan = {
  Foundation: { reason: "Build the core truth, buyer clarity, beliefs, and voice your brand needs to grow from." },
  Structure: { reason: "Connect your content, offers, and conversion path into a system people can follow." },
  House: { reason: "Integrate your identity, offers, content, and launch planning into one operating system." },
  Estate: { reason: "Refine a strong brand for consistent execution and scale." },
};

function ReportContent() {
  const auth = useAuth();
  const { activeWorkspaceId, initialized } = useWorkspace();
  const { resultId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = useCallback(async () => {
    try { return (await auth.getToken?.()) || null; } catch { return null; }
  }, [auth]);
  const getWorkspaceId = useCallback(async () => activeWorkspaceId || null, [activeWorkspaceId]);

  const load = useCallback(async () => {
    if (!auth.isLoaded || !auth.isSignedIn || !initialized || !activeWorkspaceId) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/api/brand-diagnostic/results/${encodeURIComponent(resultId)}`);
      if (!response?.result) throw new Error("This saved report is not available in the current workspace.");
      setResult(response.result);
    } catch (loadError) {
      setError(loadError?.message || "We could not load this saved report.");
    } finally {
      setLoading(false);
    }
  }, [auth.isLoaded, auth.isSignedIn, initialized, activeWorkspaceId, resultId]);

  useEffect(() => { load(); }, [load]);

  if (!auth.isLoaded) return <main className="pdr-shell"><p>Checking your account…</p></main>;
  if (!auth.isSignedIn) {
    const signInPath = buildDiagnosticAuthPath("/sign-in", location.pathname, location.search);
    return <Navigate to={signInPath} replace />;
  }
  if (!initialized) return <main className="pdr-shell"><p>Loading your workspace…</p></main>;
  if (!activeWorkspaceId) return <main className="pdr-shell"><section className="pdr-card"><h1>Select a workspace to view this report</h1><p>Your saved diagnostic is private to its original workspace. Return to the diagnostic portal, select that workspace, and open the report again.</p><Link to="/brand-diagnostic">Return to diagnostics</Link></section></main>;
  if (loading) return <main className="pdr-shell"><p>Loading your private report…</p></main>;

  const tier = tierPlan[result?.recommended_tier] || tierPlan.Foundation;
  const dimensions = result ? buildLiveDimensions(result.answers || {}) : [];
  const interpretation = result?.interpretation || {};

  return (
    <main className="pdr-shell">
      <header className="pdr-header">
        <Link to="/brand-diagnostic"><ArrowLeft size={16} /> All diagnostics</Link>
        <p>CORE TRUTH HOUSE · PRIVATE BRAND DIAGNOSTIC</p>
      </header>
      {error ? <section className="pdr-card" role="alert"><h1>Report unavailable</h1><p>{error}</p><button type="button" onClick={load}><RefreshCw size={15} /> Try again</button></section> : null}
      {result ? <>
        <section className="pdr-hero">
          <p className="pdr-eyebrow">{result.business_name || "Your brand"} · {new Date(result.created_at).toLocaleDateString()}</p>
          <h1>Your Brand Diagnostic</h1>
          <p className="pdr-subtitle">Your results are saved to this account and workspace.</p>
          <div className="pdr-score"><strong>{result.score}</strong><span>/ 60</span></div>
          <h2>{result.recommended_tier} is your recommended starting plan</h2>
          <p>{interpretation.starting_plan?.rationale || "This starting point is based on your saved diagnostic score."}</p>
          <a className="pdr-plan-link" href="/tiers#residency">Explore {result.recommended_tier} plan options</a>
          <p className="pdr-note">Your report is available without a paid plan. Plan access applies to paid system features.</p>
        </section>

        <section className="pdr-section">
          <h2>What your scores say</h2>
          <div className="pdr-grid">
            {dimensions.map(([name, score, explanation]) => <article className="pdr-card" key={name}>
              <div className="pdr-card-title"><h3>{name}</h3><strong>{score}/100</strong></div>
              <div className="pdr-meter"><span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
              <p>{explanation}</p>
            </article>)}
          </div>
        </section>

        <section className="pdr-section">
          <h2>What your answers indicate</h2>
          <p className="pdr-scope-note">{interpretation.scope_note}</p>
          {interpretation.context?.length ? <div className="pdr-context">
            <h3>Context you provided</h3>
            {interpretation.context.map((item) => <p key={item.label}><strong>{item.label}:</strong> {item.value}</p>)}
          </div> : null}
          {interpretation.challenge_fit ? <article className="pdr-card pdr-challenge">
            <p className="pdr-eyebrow">YOUR SELECTED FOCUS</p>
            <h3>{interpretation.challenge_fit.selected_challenge}</h3>
            <p>{interpretation.challenge_fit.note}</p>
          </article> : null}
          <div className="pdr-grid pdr-category-grid">
            {(interpretation.category_summaries || []).map((item) => <article className="pdr-card" key={item.category}>
              <div className="pdr-card-title"><h3>{item.category}</h3><strong>{item.average == null ? "—" : `${item.average}/4`}</strong></div>
              <p>{item.summary}</p>
              {item.evidence?.length ? <details><summary>See the answers behind this</summary><ul>{item.evidence.map((evidence) => <li key={evidence.question_id}><strong>{evidence.question_label}:</strong> {evidence.answer_label}</li>)}</ul></details> : null}
            </article>)}
          </div>
        </section>

        {interpretation.cross_answer_patterns?.length ? <section className="pdr-section">
          <h2>Patterns to check</h2>
          <p>These are possible readings of pairs of self-reported answers. Use the suggested check to see whether each applies to your situation.</p>
          <div className="pdr-grid">
            {interpretation.cross_answer_patterns.map((pattern) => <article className="pdr-card" key={pattern.title}>
              <p className="pdr-eyebrow">POSSIBLE PATTERN</p><h3>{pattern.title}</h3>
              <p><strong>What you reported:</strong> {pattern.observation}</p>
              <p><strong>Possible reading:</strong> {pattern.interpretation}</p>
              <p><strong>Check:</strong> {pattern.validation_action}</p>
              <details><summary>Evidence</summary><ul>{pattern.evidence?.map((evidence) => <li key={evidence.question_id}>{evidence.question_label}: {evidence.answer_label}</li>)}</ul></details>
            </article>)}
          </div>
        </section> : null}

        <section className="pdr-section">
          <h2>Prioritized next steps</h2>
          <div className="pdr-grid">
            {(interpretation.priority_actions || []).map((action) => <article className="pdr-card" key={action.evidence?.question_id || action.priority}>
              <p className="pdr-eyebrow">PRIORITY {action.priority} · {action.category}</p>
              <h3>{action.question_label}</h3>
              <p>{action.why}</p>
              <p><strong>Try this:</strong> {action.action}</p>
            </article>)}
          </div>
        </section>

        <section className="pdr-section">
          <h2>Your answers</h2>
          <div className="pdr-answers">{questions.map(([id, label, category, prompt]) => <article key={id}>
            <div><small>{category}</small><h3>{prompt}</h3></div><strong>{RESPONSE_LABELS[result.answers?.[id]] || "—"}</strong>
          </article>)}</div>
        </section>
        <footer className="pdr-footer"><Link to="/brand-diagnostic">Return to your diagnostic portal</Link><span>Private to your account and selected workspace.</span></footer>
      </> : null}
      <style>{`
        .pdr-shell{min-height:100vh;background:#fbf7f1;color:#33033c;padding:32px clamp(20px,6vw,88px) 64px;font-family:'DM Sans',sans-serif}
        .pdr-header{max-width:1080px;margin:0 auto 36px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d8c5c3;padding-bottom:18px}
        .pdr-header a,.pdr-footer a{color:#33033c;text-decoration:none;display:inline-flex;gap:8px;align-items:center}.pdr-header p,.pdr-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#806d78}
        .pdr-hero,.pdr-section,.pdr-footer{max-width:1080px;margin:0 auto}.pdr-hero{background:#33033c;color:#fbf7f1;padding:clamp(28px,5vw,56px);border-radius:5px}.pdr-hero .pdr-eyebrow{color:#ddc77b}.pdr-hero h1{font:500 clamp(32px,5vw,54px)/1.1 'Playfair Display',serif;margin:12px 0}.pdr-subtitle{color:#e4dbe2}.pdr-score{display:flex;align-items:baseline;gap:10px;margin:28px 0}.pdr-score strong{font:500 72px 'Playfair Display',serif;color:#ddc77b}.pdr-score span{font-size:18px}.pdr-hero h2{font:500 26px 'Playfair Display',serif;margin-bottom:8px}.pdr-plan-link{display:inline-block;background:#ddc77b;color:#33033c;text-decoration:none;padding:12px 18px;margin-top:12px;font-weight:700}.pdr-note{font-size:13px;color:#e4dbe2;margin-top:20px}
        .pdr-section{padding-top:38px}.pdr-section>h2{font:500 30px 'Playfair Display',serif;margin:0 0 18px}.pdr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.pdr-card{background:#fffdfa;border:1px solid #d8c5c3;padding:20px}.pdr-card h3,.pdr-answers h3{font-size:16px;margin:0 0 8px}.pdr-card p{line-height:1.6;color:#645763}.pdr-card-title{display:flex;justify-content:space-between;gap:10px}.pdr-card-title strong{color:#7d1238}.pdr-meter{height:6px;background:#efe7e3;margin:14px 0}.pdr-meter span{display:block;height:100%;background:#bd9d4d}.pdr-answers{border-top:1px solid #d8c5c3}.pdr-answers article{display:flex;justify-content:space-between;gap:24px;padding:16px 12px;border-bottom:1px solid #d8c5c3}.pdr-answers small{color:#806d78}.pdr-answers h3{font-weight:500;line-height:1.5;margin-top:4px}.pdr-answers strong{white-space:nowrap;color:#7d1238}.pdr-footer{display:flex;justify-content:space-between;padding-top:32px;color:#806d78;font-size:13px}.pdr-card button{display:inline-flex;gap:8px;align-items:center;padding:10px 14px;background:#33033c;color:white;border:0;cursor:pointer}.pdr-card details{margin-top:12px;color:#645763}.pdr-card summary{cursor:pointer;color:#7d1238}.pdr-card ul{padding-left:20px;line-height:1.7}.pdr-scope-note{max-width:800px;color:#645763;line-height:1.6}.pdr-context{border-left:3px solid #bd9d4d;padding:8px 18px;margin:18px 0;color:#645763}.pdr-challenge{margin:16px 0;background:#f5eee8}.pdr-challenge .pdr-eyebrow{color:#7d1238}@media(max-width:640px){.pdr-header,.pdr-footer{align-items:flex-start;flex-direction:column;gap:12px}.pdr-answers article{flex-direction:column;gap:8px}}
      `}</style>
    </main>
  );
}

function ReportRuntime() {
  const auth = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const getToken = useCallback(async () => (await auth.getToken?.()) || null, [auth]);
  const getWorkspaceId = useCallback(async () => activeWorkspaceId || null, [activeWorkspaceId]);
  return <ApiClientBootstrap getToken={getToken} getWorkspaceId={getWorkspaceId}><ReportContent /></ApiClientBootstrap>;
}

export default function PrivateDiagnosticReportRoute() {
  const page = <WorkspaceProvider><ReportRuntime /></WorkspaceProvider>;
  if (!HAS_CLERK) return page;
  return <ClerkProvider publishableKey={CLERK_KEY_RAW} signInUrl="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/command-center">{page}</ClerkProvider>;
}
