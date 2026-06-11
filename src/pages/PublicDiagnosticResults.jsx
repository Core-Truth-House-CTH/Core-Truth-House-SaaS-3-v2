import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Sparkles, Target } from "lucide-react";

import {
 buildLiveDimensions,
 buildNextMoves,
} from "../utils/diagnosticDimensions";

const LOGO = "/brand-assets/logo/cth-logo-seal.png";

const API_BASE = (
 import.meta.env.VITE_API_BASE_URL ||
 import.meta.env.VITE_API_URL ||
 "https://api.coretruthhouse.com"
).replace(/\/$/, "");

function ScoreRing({ score = 0, total = 60 }) {
 const pct = Math.max(0, Math.min(100, Math.round((Number(score || 0) / total) * 100)));
 const ringStyle = {
 background: `radial-gradient(circle, #fffaf6 0 54%, transparent 56%), conic-gradient(#af0024 0 ${pct}%, rgba(119,67,72,.14) ${pct}% 100%)`,
 };
 return (
 <div className="pdr-ring" style={ringStyle}>
 <div>
 <strong>{score}</strong>
 <span>/{total}</span>
 </div>
 </div>
 );
}

export default function PublicDiagnosticResults() {
 const { token } = useParams();
 const [status, setStatus] = useState("loading"); // loading | ready | notfound
 const [data, setData] = useState(null);

 useEffect(() => {
 let cancelled = false;

 async function load() {
 if (!token) {
 setStatus("notfound");
 return;
 }
 try {
 const response = await fetch(
 `${API_BASE}/api/public/diagnostic-results/${encodeURIComponent(token)}`
 );
 if (!response.ok) {
 if (!cancelled) setStatus("notfound");
 return;
 }
 const payload = await response.json();
 if (cancelled) return;
 setData(payload);
 setStatus("ready");
 } catch (error) {
 if (!cancelled) setStatus("notfound");
 }
 }

 load();
 return () => {
 cancelled = true;
 };
 }, [token]);

 const answers = data?.answers || {};
 const liveDimensions = useMemo(() => buildLiveDimensions(answers), [answers]);
 const nextMoves = useMemo(() => buildNextMoves(answers), [answers]);

 const overallAverage = useMemo(() => {
 if (!liveDimensions.length) return 0;
 return Math.round(
 liveDimensions.reduce((sum, item) => sum + Number(item[1] || 0), 0) /
 liveDimensions.length
 );
 }, [liveDimensions]);

 const topGaps = Array.isArray(data?.top_gaps) ? data.top_gaps : [];

 const signUpHref =
 data &&
 `/sign-up?tier=${encodeURIComponent(data.recommended_tier || "")}` +
 `&source=diagnostic_return` +
 `&score=${encodeURIComponent(data.score ?? "")}` +
 `&first_name=${encodeURIComponent(data.first_name || "")}`;

 return (
 <main className="pdr-page">
 {status === "loading" ? (
 <div className="pdr-state">
 <img src={LOGO} alt="" />
 <p>Loading your results...</p>
 </div>
 ) : null}

 {status === "notfound" ? (
 <div className="pdr-state">
 <img src={LOGO} alt="" />
 <h1>Results not found or not yet complete</h1>
 <p>
 This results link is not available. It may be incomplete, or the link may be
 incorrect.
 </p>
 <a className="pdr-primary-btn" href="/brand-diagnostic">
 Take the Brand Diagnostic
 <ArrowRight size={16} />
 </a>
 </div>
 ) : null}

 {status === "ready" && data ? (
 <>
 <header className="pdr-header">
 <a className="pdr-brand" href="/">
 <img src={LOGO} alt="" />
 Core Truth House
 </a>
 <span className="pdr-crumb">Brand Diagnostic Results</span>
 </header>

 <section className="pdr-wrap">
 <div className="pdr-hero">
 <ScoreRing score={Number(data.score || 0)} total={60} />
 <div className="pdr-hero-copy">
 <p className="pdr-kicker">
 {data.first_name ? `${data.first_name}, here are your results` : "Your results"}
 </p>
 <h1>{data.recommended_tier || "Brand Readiness"}</h1>
 <p className="pdr-range">Score range: {data.score_range || "—"}</p>
 </div>
 </div>

 {topGaps.length ? (
 <section className="pdr-card pdr-gaps">
 <div className="pdr-card-head">
 <Target size={20} />
 <h2>Top Gaps to Address First</h2>
 </div>
 <div className="pdr-gap-list">
 {topGaps.slice(0, 3).map((gap, index) => (
 <article key={`${gap}-${index}`}>
 <span>{index + 1}</span>
 <p>{gap}</p>
 </article>
 ))}
 </div>
 </section>
 ) : null}

 <section className="pdr-card">
 <div className="pdr-card-head">
 <h2>Diagnostic Dimensions</h2>
 <p className="pdr-avg">
 Overall Average <strong>{overallAverage}/100</strong>
 </p>
 </div>
 <div className="pdr-dim-grid">
 {liveDimensions.map(([name, score, text, icon]) => (
 <article key={name}>
 <img src={icon} alt="" />
 <h3>{name}</h3>
 <strong>
 {score}
 <span>/100</span>
 </strong>
 <i>
 <b style={{ width: `${score}%` }} />
 </i>
 <p>{text}</p>
 </article>
 ))}
 </div>
 </section>

 <section className="pdr-card pdr-next">
 <div className="pdr-card-head">
 <Sparkles size={20} />
 <h2>Next Best Moves</h2>
 </div>
 <div className="pdr-next-list">
 {nextMoves.map(([title, text, icon], index) => (
 <article key={title}>
 <span>{index + 1}</span>
 <img src={icon} alt="" />
 <div>
 <h3>{title}</h3>
 <p>{text}</p>
 </div>
 </article>
 ))}
 </div>
 </section>

 <a className="pdr-powered" href="https://coretruthhouse.com">
 Powered by Core Truth House
 </a>
 </section>

 <div className="pdr-cta-bar">
 <p>Ready to fix this? Start building your brand infrastructure.</p>
 <a href={signUpHref}>
 Start Building
 <ArrowRight size={16} />
 </a>
 </div>
 </>
 ) : null}

 <style>{`
 .pdr-page {
 min-height: 100vh;
 background: linear-gradient(180deg, #fffaf6 0%, #f4ece6 100%);
 color: #2b1040;
 font-family: 'DM Sans', system-ui, sans-serif;
 }

 .pdr-page * { box-sizing: border-box; }

 .pdr-state {
 min-height: 100vh;
 display: grid;
 place-content: center;
 justify-items: center;
 gap: 14px;
 text-align: center;
 padding: 40px 24px;
 }

 .pdr-state img { width: 56px; opacity: .85; }

 .pdr-state h1 {
 margin: 0;
 font-family: Georgia, serif;
 font-size: clamp(1.8rem, 4vw, 2.6rem);
 letter-spacing: -.03em;
 }

 .pdr-state p {
 margin: 0;
 max-width: 460px;
 color: rgba(43,16,64,.7);
 line-height: 1.6;
 }

 .pdr-header {
 min-height: 64px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 18px;
 padding: 0 34px;
 border-bottom: 1px solid rgba(119,67,72,.2);
 background: rgba(255,249,244,.82);
 position: sticky;
 top: 0;
 z-index: 20;
 }

 .pdr-brand {
 display: inline-flex;
 align-items: center;
 gap: 8px;
 color: #af0024;
 font-family: Georgia, serif;
 font-weight: 800;
 text-decoration: none;
 }

 .pdr-brand img { width: 28px; height: 28px; }

 .pdr-crumb {
 text-transform: uppercase;
 letter-spacing: .16em;
 color: rgba(43,16,64,.56);
 font-size: 11px;
 font-weight: 900;
 }

 .pdr-wrap {
 width: min(100% - 48px, 1080px);
 margin: 0 auto;
 padding: 34px 0 140px;
 display: grid;
 gap: 18px;
 }

 .pdr-hero {
 display: grid;
 grid-template-columns: 180px 1fr;
 gap: 28px;
 align-items: center;
 padding: 26px;
 border: 1px solid rgba(119,67,72,.26);
 border-radius: 12px;
 background: rgba(255,255,255,.56);
 box-shadow: 0 20px 50px rgba(43,16,64,.055);
 }

 .pdr-kicker {
 margin: 0 0 10px;
 color: rgba(43,16,64,.70);
 text-transform: uppercase;
 letter-spacing: .14em;
 font-size: 11px;
 font-weight: 900;
 }

 .pdr-hero-copy h1 {
 margin: 0;
 font-family: Georgia, serif;
 font-size: clamp(2.4rem, 4vw, 3.6rem);
 line-height: .95;
 letter-spacing: -.05em;
 }

 .pdr-range {
 margin: 12px 0 0;
 color: rgba(43,16,64,.62);
 font-weight: 800;
 }

 .pdr-ring {
 position: relative;
 width: 170px;
 height: 170px;
 border-radius: 50%;
 display: grid;
 place-items: center;
 }

 .pdr-ring div {
 width: 132px;
 height: 132px;
 border-radius: 50%;
 display: grid;
 place-content: center;
 text-align: center;
 background: #fffaf6;
 }

 .pdr-ring strong {
 font-family: Georgia, serif;
 font-size: 52px;
 line-height: .9;
 font-weight: 500;
 }

 .pdr-ring span {
 color: rgba(43,16,64,.58);
 font-size: 15px;
 }

 .pdr-card {
 border: 1px solid rgba(119,67,72,.26);
 border-radius: 12px;
 background: rgba(255,255,255,.56);
 box-shadow: 0 20px 50px rgba(43,16,64,.055);
 padding: 20px 22px;
 }

 .pdr-card-head {
 display: flex;
 align-items: center;
 gap: 10px;
 margin-bottom: 16px;
 color: #af0024;
 }

 .pdr-card-head h2 {
 margin: 0;
 color: rgba(43,16,64,.72);
 text-transform: uppercase;
 letter-spacing: .14em;
 font-size: 12px;
 font-weight: 900;
 }

 .pdr-card-head .pdr-avg {
 margin: 0 0 0 auto;
 font-family: Georgia, serif;
 font-size: 13px;
 color: rgba(43,16,64,.62);
 }

 .pdr-card-head .pdr-avg strong { color: #af0024; }

 .pdr-gap-list { display: grid; gap: 10px; }

 .pdr-gap-list article {
 display: flex;
 align-items: center;
 gap: 12px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 10px;
 background: rgba(255,249,244,.64);
 padding: 12px 14px;
 }

 .pdr-gap-list span {
 width: 28px;
 height: 28px;
 flex: 0 0 28px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 border: 1px solid rgba(196,169,91,.58);
 color: #b5793f;
 font-family: Georgia, serif;
 }

 .pdr-gap-list p {
 margin: 0;
 font-weight: 800;
 color: #2b1040;
 }

 .pdr-dim-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 10px;
 }

 .pdr-dim-grid article {
 min-height: 158px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 10px;
 background: rgba(255,249,244,.64);
 padding: 14px;
 }

 .pdr-dim-grid img {
 width: 26px;
 height: 26px;
 object-fit: contain;
 margin-bottom: 9px;
 }

 .pdr-dim-grid h3 {
 display: inline;
 margin: 0;
 font-family: Georgia, serif;
 font-size: 14px;
 }

 .pdr-dim-grid strong {
 float: right;
 font-family: Georgia, serif;
 font-size: 18px;
 font-weight: 500;
 }

 .pdr-dim-grid strong span {
 font-size: 10px;
 color: rgba(43,16,64,.55);
 }

 .pdr-dim-grid i {
 clear: both;
 display: block;
 height: 5px;
 border-radius: 999px;
 background: rgba(119,67,72,.13);
 overflow: hidden;
 margin: 16px 0 10px;
 }

 .pdr-dim-grid b {
 display: block;
 height: 100%;
 background: linear-gradient(90deg, #af0024, #c4a95b);
 }

 .pdr-dim-grid p {
 margin: 0;
 text-align: center;
 color: rgba(43,16,64,.64);
 font-size: 11px;
 line-height: 1.35;
 }

 .pdr-next-list { display: grid; gap: 10px; }

 .pdr-next-list article {
 display: grid;
 grid-template-columns: 30px 38px 1fr;
 align-items: center;
 gap: 12px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 10px;
 background: rgba(255,249,244,.64);
 padding: 14px;
 }

 .pdr-next-list > div { min-width: 0; }

 .pdr-next-list article > span {
 width: 27px;
 height: 27px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,.58);
 border-radius: 50%;
 color: #b5793f;
 font-family: Georgia, serif;
 }

 .pdr-next-list img { width: 30px; height: 30px; object-fit: contain; }

 .pdr-next-list h3 {
 margin: 0 0 4px;
 font-family: Georgia, serif;
 font-size: 15px;
 }

 .pdr-next-list p {
 margin: 0;
 color: rgba(43,16,64,.64);
 font-size: 12px;
 line-height: 1.4;
 }

 .pdr-powered {
 justify-self: center;
 margin-top: 8px;
 color: rgba(43,16,64,.5);
 font-size: 12px;
 letter-spacing: .04em;
 text-decoration: none;
 }

 .pdr-powered:hover { color: #af0024; }

 .pdr-primary-btn {
 min-height: 44px;
 display: inline-flex;
 align-items: center;
 gap: 9px;
 border-radius: 8px;
 padding: 0 20px;
 background: linear-gradient(135deg, #af0024, #e04e35);
 color: white;
 text-decoration: none;
 font-size: 14px;
 font-weight: 900;
 }

 .pdr-cta-bar {
 position: fixed;
 left: 0;
 right: 0;
 bottom: 0;
 z-index: 40;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 20px;
 flex-wrap: wrap;
 padding: 16px 24px;
 background: #af0024;
 color: #ffffff;
 box-shadow: 0 -10px 40px rgba(43,16,64,.18);
 }

 .pdr-cta-bar p {
 margin: 0;
 font-family: Georgia, serif;
 font-size: 16px;
 font-weight: 600;
 }

 .pdr-cta-bar a {
 min-height: 44px;
 display: inline-flex;
 align-items: center;
 gap: 8px;
 border-radius: 8px;
 padding: 0 22px;
 background: #ffffff;
 color: #af0024;
 text-decoration: none;
 font-size: 14px;
 font-weight: 900;
 white-space: nowrap;
 }

 @media (max-width: 860px) {
 .pdr-hero { grid-template-columns: 1fr; justify-items: center; text-align: center; }
 .pdr-dim-grid { grid-template-columns: 1fr 1fr; }
 }

 @media (max-width: 560px) {
 .pdr-cta-bar { flex-direction: column; gap: 10px; text-align: center; }
 .pdr-cta-bar p { font-size: 14px; }
 }
 `}</style>
 </main>
 );
}
