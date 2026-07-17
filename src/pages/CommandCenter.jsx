import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Compass,
  Layers3,
  Loader2,
  Megaphone,
  PenTool,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { useBrandHealth } from "../context/BrandHealthContext";
import { usePlan } from "../context/PlanContext";
import { useUser } from "../hooks/useAuth";
import { PLAN_INFO, normalizePlan } from "../config/planAccess";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const COMMAND_CENTER_CSS = `
.cth-command-page {
  --cc-night: #0d0010;
  --cc-purple: #33033c;
  --cc-ink: #2b1040;
  --cc-crimson: #af002a;
  --cc-gold: #c4a95b;
  --cc-ivory: #f8f4f2;
  --cc-blush: #efe7e3;
  --cc-panel: #fffaf7;
  --cc-panel-soft: #f5ece8;
  --cc-border: #d8c5c3;
  --cc-muted: #7c6576;
  min-height: 100%;
  background:
    radial-gradient(circle at 12% 8%, rgba(196,169,91,0.12), transparent 28%),
    linear-gradient(180deg, #f8f4f2 0%, #efe7e3 48%, #f8f4f2 100%);
  color: var(--cc-ink);
}
.cth-command-page * { box-sizing: border-box; }

.cc-shell {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(28px, 4vw, 52px) clamp(20px, 4vw, 44px) 64px;
  display: flex;
  flex-direction: column;
  gap: clamp(24px, 3vw, 36px);
}

/* 1 — Greeting */
.cc-greeting {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(34px, 4.4vw, 48px);
  line-height: 1.04;
  letter-spacing: -0.01em;
  color: var(--cc-ink);
}
.cc-greeting-sub {
  margin: 8px 0 0;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: var(--cc-muted);
}

/* 2 + 3 — Hero + stats in one row: score card left (auto), stats right (1fr).
   align-items:start so the stat cards stay compact and do NOT stretch to the
   score card's height. */
.cc-top-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: start;
}

/* 2 — Brand Health score card: ring LEFT, text stack RIGHT */
.cc-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 22px;
  background: #fff;
  border: 0.5px solid var(--cc-border);
  border-radius: 12px;
}
.cc-ring-wrap { position: relative; width: 68px; height: 68px; flex-shrink: 0; }
.cc-ring-num { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.cc-ring-score { font-family: var(--font-display); font-weight: 600; font-size: 18px; line-height: 1; color: var(--cc-ink); }
.cc-ring-max { font-size: 7px; color: var(--cc-muted); }
.cc-score-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cc-muted); margin-bottom: 3px; }
.cc-score-status { font-family: var(--font-display); font-weight: 500; font-size: 17px; line-height: 1; color: var(--cc-gold); margin-bottom: 4px; }
.cc-score-hint { font-size: 10px; color: var(--cc-muted); }

/* 3 — Stat cards: compact, label top / Cormorant number / colored note. */
.cc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.cc-stat {
  background: #fff;
  border: 0.5px solid var(--cc-border);
  border-radius: 10px;
  padding: 14px 14px 12px;
}
.cc-stat-label { font-size: 9px; color: var(--cc-muted); margin-bottom: 5px; letter-spacing: 0.03em; }
.cc-stat-num { font-family: var(--font-display); font-weight: 500; font-size: 26px; line-height: 1; color: var(--cc-ink); }
.cc-stat-note { font-size: 9px; margin-top: 4px; }

/* 4 — Brand OS Pipeline */
.cc-section-head {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cc-muted);
  margin-bottom: 12px;
}
.cc-pipeline {
  padding: 16px 18px;
  background: #fff;
  border: 0.5px solid var(--cc-border);
  border-radius: 12px;
}
.cc-pipe-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  cursor: pointer;
}
.cc-pipe-name {
  width: 84px;
  flex-shrink: 0;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px;
  color: #3d2d4a;
}
.cc-pipe-track { flex: 1; height: 3px; background: #f0e8e5; border-radius: 2px; overflow: hidden; }
.cc-pipe-fill { height: 100%; border-radius: 2px; transition: width 240ms ease; }
.cc-pipe-pct {
  width: 96px;
  flex-shrink: 0;
  text-align: right;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 9px;
  color: var(--cc-muted);
}

/* 5 — Today's Focus + Zuri */
.cc-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  align-items: stretch;
}
.cc-focus {
  padding: clamp(22px, 2.6vw, 30px);
  background: rgba(255,250,247,0.86);
  border: 1px solid var(--cc-border);
  box-shadow: 0 14px 40px rgba(51,3,60,0.05);
}
.cc-focus-row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid rgba(216,197,195,0.55);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
  color: var(--cc-ink);
}
.cc-focus-row:last-child { border-bottom: 0; }
.cc-focus-num {
  width: 24px; height: 24px;
  border-radius: 999px;
  display: grid; place-items: center;
  background: var(--cc-crimson);
  color: #fff;
  font-size: 12px; font-weight: 700;
}
.cc-zuri {
  display: flex;
  flex-direction: column;
  padding: clamp(24px, 2.8vw, 32px);
  color: #fff;
  background:
    radial-gradient(circle at top right, rgba(196,169,91,0.22), transparent 36%),
    linear-gradient(135deg, #33033c 0%, #19051f 68%, #0d0010 100%);
  box-shadow: 0 20px 44px rgba(51,3,60,0.2);
}
.cc-zuri-head { display: flex; align-items: center; gap: 12px; }
.cc-zuri-avatar {
  width: 44px; height: 44px;
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 0;
  display: grid; place-items: center;
}
.cc-zuri-avatar img { width: 100%; height: 100%; object-fit: cover; }
.cc-zuri-avatar span { font-family: var(--font-display); font-weight: 500; font-size: 20px; color: var(--cc-gold); }
.cc-zuri-name { font-family: var(--font-display); font-weight: 500; font-size: 20px; line-height: 1; color: #fff; }
.cc-zuri-role { font-family: "DM Sans", system-ui, sans-serif; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cc-gold); margin-top: 3px; }
.cc-zuri-label {
  margin-top: 22px;
  display: inline-flex; align-items: center; gap: 8px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--cc-gold);
}
.cc-zuri-title { margin: 12px 0 0; font-family: var(--font-display); font-weight: 500; font-size: clamp(24px, 2vw, 30px); line-height: 1.08; color: #fff; }
.cc-zuri-body { margin: 13px 0 0; font-family: "DM Sans", system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.78); }
.cc-zuri-cta {
  margin-top: auto;
  align-self: flex-start;
  margin-top: 24px;
  border: 0;
  padding: 11px 18px;
  background: linear-gradient(135deg, #c4a95b, #b88d35);
  color: #fffaf7;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
  cursor: pointer;
}

.cc-error {
  border: 1px solid rgba(175,0,42,0.25);
  background: rgba(175,0,42,0.08);
  color: #8a0924;
  padding: 14px 16px;
  display: flex; gap: 8px; align-items: center;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 14px;
}

/* Diagnostic welcome banner — dark Zuri card pattern */
.cc-diag-welcome {
  position: relative;
  padding: clamp(24px, 3vw, 38px);
  background: #1a0828;
  color: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 44px rgba(26,8,40,0.32);
  overflow: hidden;
}
.cc-diag-welcome::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(196,169,91,0.18), transparent 42%);
  pointer-events: none;
}
.cc-diag-welcome > * { position: relative; z-index: 1; }
.cc-diag-welcome-title {
  margin: 0;
  max-width: 640px;
  font-family: "Cormorant Garamond", var(--font-display), Georgia, serif;
  font-weight: 600;
  font-size: clamp(28px, 3.4vw, 42px);
  line-height: 1.04;
  letter-spacing: -0.01em;
  color: #fff;
}
.cc-diag-welcome-line {
  margin: 12px 0 0;
  max-width: 640px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255,255,255,0.82);
}
.cc-diag-welcome-cta {
  margin-top: 22px;
  border: 0;
  padding: 12px 24px;
  background: var(--cc-crimson);
  color: #fff;
  border-radius: 999px;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 13px; font-weight: 800; letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 14px 32px rgba(175,0,42,0.32);
}
.cc-diag-welcome-dismiss {
  position: absolute;
  top: 16px; right: 16px;
  z-index: 2;
  border: 0;
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.74);
  width: 32px; height: 32px;
  border-radius: 999px;
  display: grid; place-items: center;
  cursor: pointer;
}
.cc-diag-welcome-dismiss:hover { background: rgba(255,255,255,0.18); }

@media (max-width: 880px) {
  .cc-top-row { grid-template-columns: 1fr; }
  .cc-hero { flex-direction: column-reverse; align-items: flex-start; }
  .cc-stats { grid-template-columns: 1fr; }
  .cc-bottom { grid-template-columns: 1fr; }
  .cc-pipe-row { grid-template-columns: 130px 1fr 46px; gap: 12px; }
}
`;

// ---------------------------------------------------------------------------
// Score / audit helpers (retained from prior version, trimmed to what's used)
// ---------------------------------------------------------------------------

function clampCommandScore(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function firstAuditScore(scoreBag, keys) {
  for (const key of keys) {
    const value = scoreBag?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return clampCommandScore(value, null);
    }
  }
  return null;
}

function averageAuditScores(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  if (!valid.length) return null;
  return clampCommandScore(valid.reduce((sum, value) => sum + Number(value), 0) / valid.length, null);
}

function cthBestMoveDayIndex(length) {
  if (!length) return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return day % length;
}

function buildDailyBestMove({ latestAudit, progress }) {
  const scoreBag = latestAudit?.module_scores || latestAudit?.scores || {};
  const overall = clampCommandScore(
    latestAudit?.overall_score ?? latestAudit?.overallScore ?? latestAudit?.score ?? scoreBag?.overall,
    null
  );
  const clarity = averageAuditScores([
    firstAuditScore(scoreBag, ["brand_foundation", "foundation"]),
    firstAuditScore(scoreBag, ["visual_identity", "identity"]),
  ]);
  const structure = averageAuditScores([
    firstAuditScore(scoreBag, ["offer_suite", "offers"]),
    firstAuditScore(scoreBag, ["systems_and_sops", "systems"]),
  ]);
  const execution = averageAuditScores([
    firstAuditScore(scoreBag, ["content_library", "content"]),
    firstAuditScore(scoreBag, ["launch_readiness", "launch"]),
  ]);

  const candidates = [];
  if (!overall || overall <= 0) {
    candidates.push({ key: "complete-diagnostic", priority: 100, title: "Complete your Brand Diagnostic", body: "I need a current score before I can recommend the most accurate next move.", cta: "Start diagnostic", route: "/brand-audit" });
  }
  if (Number.isFinite(clarity) && clarity < 75) {
    candidates.push({ key: "strengthen-clarity", priority: 100 - clarity, title: "Strengthen your Brand Foundation", body: "Your clarity layer is asking for attention. Tighten the truth, audience, promise, and voice before adding more execution.", cta: "Open Brand Foundation", route: "/brand-foundation" });
  }
  if (Number.isFinite(structure) && structure < 75) {
    candidates.push({ key: "review-structure", priority: 100 - structure, title: "Review your Offer and System structure", body: "The brand has momentum, but the structure needs stronger rules. Clarify the path between offers, systems, and decisions.", cta: "Open Offer Builder", route: "/offer-builder" });
  }
  if (Number.isFinite(execution) && execution < 75) {
    const launchScore = firstAuditScore(scoreBag, ["launch_readiness", "launch"]);
    candidates.push({
      key: "tighten-execution",
      priority: 100 - execution,
      title: launchScore !== null && launchScore < 70 ? "Clarify your next campaign path" : "Build one aligned content pillar",
      body: launchScore !== null && launchScore < 70 ? "Your launch readiness is the pressure point. Define the campaign direction before creating more disconnected content." : "Execution gets easier when content has a clear job. Choose one pillar and turn it into a focused content direction.",
      cta: launchScore !== null && launchScore < 70 ? "Open Campaign Builder" : "Open Content Studio",
      route: launchScore !== null && launchScore < 70 ? "/campaign-builder" : "/content-studio",
    });
  }
  if (progress && !progress.strategic_os_started) {
    candidates.push({ key: "start-strategic-os", priority: 32, title: "Turn your strategy into an operating system", body: "Your brand needs a decision layer. Use Strategic OS to connect positioning, offers, content, and execution.", cta: "Open Strategic OS", route: "/strategic-os" });
  }
  if (progress && !progress.first_campaign_created) {
    candidates.push({ key: "create-first-campaign", priority: 26, title: "Create your next aligned campaign", body: "A clear campaign turns brand truth into visible movement. Build one campaign that connects message, offer, and action.", cta: "Open Campaign Builder", route: "/campaign-builder" });
  }
  if (!candidates.length) {
    candidates.push({ key: "optimize-conversion-path", priority: 20, title: "Optimize one conversion path", body: "Your foundation is strong enough to refine the path from attention to action. Choose one page, offer, or funnel to sharpen today.", cta: "Open Insights", route: "/analytics" });
  }

  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  const urgent = sorted.filter((item) => item.priority >= 35);
  const pool = urgent.length > 1 ? urgent.slice(0, 2) : sorted.slice(0, 1);
  return pool[cthBestMoveDayIndex(pool.length)] || sorted[0];
}

function getPriorityScore(scoreBag, keys) {
  for (const key of keys) {
    const value = scoreBag?.[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.max(0, Math.min(100, Math.round(numeric)));
  }
  return null;
}

function buildPriorityActions({ latestAudit, milestones }) {
  const scoreBag = latestAudit?.module_scores || latestAudit?.scores || {};
  const overall = getPriorityScore(scoreBag, ["overall"]) ??
    (Number.isFinite(Number(latestAudit?.overall_score)) ? Math.round(Number(latestAudit.overall_score)) : null);

  const actions = [];
  if (!overall || overall <= 0) {
    actions.push({ key: "brand-audit", title: "Complete Brand Diagnostic", status: "Start here", route: "/brand-audit", urgency: 100 });
  }

  const scoreActions = [
    { key: "brand-foundation", title: "Strengthen Brand Foundation", score: getPriorityScore(scoreBag, ["brand_foundation", "foundation"]), route: "/brand-foundation" },
    { key: "visual-identity", title: "Review Identity Studio", score: getPriorityScore(scoreBag, ["visual_identity", "identity"]), route: "/identity-studio" },
    { key: "offer-suite", title: "Clarify Offer Architecture", score: getPriorityScore(scoreBag, ["offer_suite", "offers"]), route: "/offer-builder" },
    { key: "systems", title: "Build One Repeatable System", score: getPriorityScore(scoreBag, ["systems_and_sops", "systems"]), route: "/systems-builder" },
    { key: "content-library", title: "Create One Aligned Content Pillar", score: getPriorityScore(scoreBag, ["content_library", "content"]), route: "/content-studio" },
    { key: "launch-readiness", title: "Clarify Your Next Campaign Path", score: getPriorityScore(scoreBag, ["launch_readiness", "launch"]), route: "/campaign-builder" },
  ];
  scoreActions.forEach((item) => {
    if (!Number.isFinite(Number(item.score))) return;
    if (item.score < 70) actions.push({ ...item, status: `${item.score}/100`, urgency: 100 - item.score });
    else if (item.score < 85) actions.push({ ...item, status: `${item.score}/100`, urgency: 85 - item.score });
  });

  if (milestones && !milestones.strategic_os_started) actions.push({ key: "strategic-os", title: "Start Strategic OS", status: "Next layer", route: "/strategic-os", urgency: 34 });
  if (milestones && !milestones.first_campaign_created) actions.push({ key: "first-campaign", title: "Create First Campaign", status: "Growth move", route: "/campaign-builder", urgency: 28 });

  if (!actions.length) {
    actions.push(
      { key: "optimize-path", title: "Optimize One Conversion Path", status: "Ready", route: "/analytics", urgency: 20 },
      { key: "review-library", title: "Review Workspace Library", status: "Maintain", route: "/workspace-library", urgency: 12 }
    );
  }
  return actions.sort((a, b) => b.urgency - a.urgency).slice(0, 5);
}

// Brand OS Pipeline — Option A: module completion reflects REAL signals, not
// loose "started/created" onboarding flags. A module is complete when its live
// brand-health module score clears the threshold OR a real artifact exists.
// The dropped flags (strategic_os_started, first_campaign_created,
// analytics_viewed, *_complete) were the source of the inflated percentages.
const PIPELINE_COMPLETE_THRESHOLD = 70;

// Identity Studio's Foundation-stage slot = "identity foundation complete": the
// blended brand-health module (colors + fonts + assets), NOT the dead
// workspace_stats.has_identity flag (which read the never-written `identity`
// collection and contributed 0 permanently). The module has 4 checkpoints —
// colors>=3, fonts>=1, >=1 brand asset, >=3 brand assets — and the slot is
// "done" only at the full 4/4 bar.
const IDENTITY_STUDIO_DONE_CHECKPOINTS = 4;

function moduleScore(modules, key) {
  const v = Number(modules?.[key]?.score);
  return Number.isFinite(v) ? v : null;
}

function identityStudioComplete(modules) {
  const completed = Number(modules?.identity_studio?.completed);
  return Number.isFinite(completed) && completed >= IDENTITY_STUDIO_DONE_CHECKPOINTS;
}

function buildPipelineStages(workspaceStats, healthData) {
  const s = workspaceStats || {};
  const h = healthData?.modules || {};
  // complete = (scored module clears threshold) OR (real artifact present)
  const done = (scoreKey, artifact) => {
    const sc = moduleScore(h, scoreKey);
    if (sc !== null) return sc >= PIPELINE_COMPLETE_THRESHOLD || Boolean(artifact);
    return Boolean(artifact);
  };

  const stages = [
    { id: "brand_core", label: "Foundation", icon: ShieldCheck, modules: [
      done("brand_foundation", s.has_brand_foundation),
      Boolean(s.has_positioning),
      Boolean(s.has_messaging),
      Boolean(Number(s.total_avatars) > 0),
      identityStudioComplete(h),
    ], route: "/brand-foundation" },
    { id: "strategy", label: "Structure", icon: Compass, modules: [
      done("strategic_os", false), // real completion only — "started" no longer counts
      Boolean(s.has_customer_journey),
    ], route: "/strategic-os" },
    { id: "systems", label: "House", icon: Layers3, modules: [
      Boolean(Number(s.total_campaigns) > 0),
      done("offer_builder", Number(s.total_offers) > 0),
      done("systems_builder", Number(s.total_systems) > 0),
    ], route: "/campaign-builder" },
    { id: "content", label: "Estate", icon: PenTool, modules: [
      done("content_studio", Number(s.total_content) > 0),
      Boolean(s.has_prompts),
      Boolean(Number(s.total_media) > 0),
    ], route: "/content-studio" },
    { id: "launch", label: "Systems", icon: Megaphone, modules: [
      Boolean(s.has_social_planner),
      Boolean(Number(s.total_crm_contacts) > 0),
      // analytics_active removed: nothing emits it, so it read false forever and
      // capped this stage at 2/3. Reporting 2/2 is honest until a real analytics
      // signal is defined (see Pass 2 note).
    ], route: "/social-media-manager" },
  ];

  return stages.map((stage) => {
    const completedCount = stage.modules.filter(Boolean).length;
    const totalCount = stage.modules.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const status = pct === 100 ? "complete" : pct > 0 ? "active" : "not_started";
    return { id: stage.id, label: stage.label, icon: stage.icon, route: stage.route, completedCount, totalCount, pct, status };
  });
}

function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Diagnostic tier → first move copy + destination module for the welcome banner.
const TIER_WELCOME = {
  Foundation: {
    line: "Your first move is Brand Foundation. That is where your positioning, beliefs, and brand promise get built into structure.",
    route: "/brand-foundation",
  },
  Structure: {
    line: "Head to Brand Positioning and Messaging Structure. Your score shows the gaps are in how your brand communicates, not what it offers.",
    route: "/brand-positioning",
  },
  House: {
    line: "Start with Identity Studio and Strategic OS. You are ready to build the operational layer.",
    route: "/identity-studio",
  },
  Estate: {
    line: "Your brand is established. Head to Campaign Builder and Signal Inbox to start running it at scale.",
    route: "/signal-inbox",
  },
};

function DiagnosticWelcomeBanner({ context, onGo, onDismiss }) {
  const tier = context?.tier || "";
  const score = context?.score || "";
  const firstName = context?.first_name || "";
  const tierLine = TIER_WELCOME[tier]?.line || TIER_WELCOME.Foundation.line;
  return (
    <section className="cc-diag-welcome">
      <button
        type="button"
        className="cc-diag-welcome-dismiss"
        aria-label="Dismiss welcome"
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
      <h2 className="cc-diag-welcome-title">
        {firstName
          ? `Welcome to Core Truth House, ${firstName}.`
          : "Welcome to Core Truth House."}
      </h2>
      <p className="cc-diag-welcome-line">
        Your brand diagnostic score was {score}/60. You are starting in the {tier} tier.
      </p>
      <p className="cc-diag-welcome-line">{tierLine}</p>
      <button type="button" className="cc-diag-welcome-cta" onClick={onGo}>
        Let’s go →
      </button>
    </section>
  );
}

// Generic first-login welcome for founders who did NOT arrive via the diagnostic
// and have zero onboarding milestones complete. Dismissal is per-user localStorage.
function GenericWelcomeBanner({ firstName, onGo, onDismiss }) {
  return (
    <section className="cc-diag-welcome">
      <button
        type="button"
        className="cc-diag-welcome-dismiss"
        aria-label="Dismiss welcome"
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
      <h2 className="cc-diag-welcome-title">
        {firstName
          ? `Welcome to Core Truth House, ${firstName}.`
          : "Welcome to Core Truth House."}
      </h2>
      <p className="cc-diag-welcome-line">Your brand infrastructure starts here.</p>
      <button type="button" className="cc-diag-welcome-cta" onClick={onGo}>
        Start the Brand Audit →
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function ScoreRing({ score, launchReady, hasScore = true }) {
  const C = 175.93; // circumference: 2π·28
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = C * (1 - pct / 100);
  const color = launchReady ? "#2d6a4f" : "#5d0012";
  return (
    <div className="cc-ring-wrap">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r="28" fill="none" stroke="#f0e8e5" strokeWidth="5" />
        {hasScore ? (
          <circle
            cx="34" cy="34" r="28" fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={C} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 34 34)"
          />
        ) : null}
      </svg>
      <div className="cc-ring-num">
        {hasScore ? (
          <>
            <div className="cc-ring-score">{pct}</div>
            <div className="cc-ring-max">/100</div>
          </>
        ) : (
          <div className="cc-ring-max" style={{ fontSize: 8, lineHeight: 1.25, padding: "0 8px", color: "var(--cc-muted)" }}>
            No score yet
          </div>
        )}
      </div>
    </div>
  );
}

// Score card: ring LEFT, text stack (label / status / hint) RIGHT.
function HealthHero({ score, rating, launchReady, hint, hasScore = true }) {
  return (
    <section className="cc-hero">
      <ScoreRing score={score} launchReady={launchReady} hasScore={hasScore} />
      <div>
        <div className="cc-score-label">Brand Health Score</div>
        <div className="cc-score-status">{rating}</div>
        <div className="cc-score-hint">{hint}</div>
      </div>
    </section>
  );
}

function StatCards({ activeProjects, signalsThisWeek, signalsUnconfirmed, tasksCompleted }) {
  const cards = [
    {
      label: "Active projects", value: activeProjects,
      note: activeProjects > 0 ? "on track" : "ready to start",
      noteColor: activeProjects > 0 ? "#2d6a4f" : "var(--cc-muted)",
    },
    {
      label: "Signals this week", value: signalsThisWeek,
      note: signalsUnconfirmed > 0 ? `${signalsUnconfirmed} unconfirmed` : "all confirmed",
      noteColor: signalsUnconfirmed > 0 ? "#c4a95b" : "#2d6a4f",
    },
    { label: "Tasks completed", value: tasksCompleted, note: "this week", noteColor: "var(--cc-muted)" },
  ];
  return (
    <div className="cc-stats">
      {cards.map(({ label, value, note, noteColor }) => (
        <article className="cc-stat" key={label}>
          <div className="cc-stat-label">{label}</div>
          <div className="cc-stat-num">{value}</div>
          <div className="cc-stat-note" style={{ color: noteColor }}>{note}</div>
        </article>
      ))}
    </div>
  );
}

function Pipeline({ stages, navigate }) {
  const colorFor = (st) => (st.status === "complete" ? "#2d6a4f" : st.status === "active" ? "#c4a95b" : "#d8c5c3");
  return (
    <section>
      <div className="cc-section-head">Brand OS Pipeline</div>
      <div className="cc-pipeline">
        {stages.map((stage) => {
          const color = colorFor(stage);
          const width = stage.pct === 0 ? 8 : stage.pct;
          return (
            <div
              key={stage.id}
              className="cc-pipe-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(stage.route)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(stage.route); } }}
            >
              <div className="cc-pipe-name">{stage.label}</div>
              <div className="cc-pipe-track"><div className="cc-pipe-fill" style={{ width: `${width}%`, background: color }} /></div>
              <div className="cc-pipe-pct" style={stage.status === "complete" ? { color: "#2d6a4f" } : undefined}>
                {stage.completedCount} / {stage.totalCount} complete
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TodayFocus({ actions, navigate }) {
  const items = actions.slice(0, 4);
  return (
    <section className="cc-focus">
      <div className="cc-section-head">Today’s Focus</div>
      {items.map((item, index) => (
        <button key={item.key || item.title} type="button" className="cc-focus-row" onClick={() => navigate(item.route || "/brand-audit")}>
          <span className="cc-focus-num">{index + 1}</span>
          <span>{item.title}</span>
          <ArrowUpRight size={15} color="var(--cc-muted)" />
        </button>
      ))}
    </section>
  );
}

function ZuriCard({ bestMove, navigate }) {
  const move = bestMove || {
    title: "Complete your Brand Diagnostic",
    body: "I need a current score before I can recommend the most accurate next move.",
    cta: "Start diagnostic",
    route: "/brand-audit",
  };
  return (
    <section className="cc-zuri">
      <div className="cc-zuri-head">
        <div className="cc-zuri-avatar">
          <img src="/zuri.png" alt="Zuri" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div className="cc-zuri-name">Zuri</div>
          <div className="cc-zuri-role">Brand Architect</div>
        </div>
      </div>
      <div className="cc-zuri-label"><Sparkles size={14} /> Next best move</div>
      <h3 className="cc-zuri-title">{move.title}</h3>
      <p className="cc-zuri-body">{move.body}</p>
      <button type="button" className="cc-zuri-cta" onClick={() => navigate(move.route || "/brand-audit")}>
        {move.cta || "Start this action"} →
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function CommandCenter() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const { healthData, registerRefreshCallback } = useBrandHealth();
  const { plan } = usePlan();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [latestAudit, setLatestAudit] = useState(null);
  const [workspaceStats, setWorkspaceStats] = useState(null);
  const [signalsThisWeek, setSignalsThisWeek] = useState(0);
  const [signalsUnconfirmed, setSignalsUnconfirmed] = useState(0);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const redeemAttemptedRef = useRef(false);

  useEffect(() => {
    const cohortToken = searchParams.get("cohort_token");
    if (!cohortToken || !activeWorkspaceId || redeemAttemptedRef.current) return;
    redeemAttemptedRef.current = true;
    (async () => {
      try {
        await apiClient.post(`/api/cohort/invite/${encodeURIComponent(cohortToken)}/redeem`);
      } catch (err) {
        const detail = err?.payload?.detail || err?.message || "Could not claim your cohort seat.";
        alert(`Cohort claim failed: ${detail}\n\nPlease contact hello@coretruthhouse.com.`);
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete("cohort_token");
        setSearchParams(next, { replace: true });
      }
    })();
  }, [searchParams, activeWorkspaceId, setSearchParams]);

  // Personalized welcome banner driven by the diagnostic context persisted at sign-up.
  const [diagnosticWelcome, setDiagnosticWelcome] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cth_diagnostic_context");
      if (!raw) return;
      const ctx = JSON.parse(raw);
      if (ctx && ctx.shown !== true) {
        setDiagnosticWelcome(ctx);
      }
    } catch (err) {
      console.error("Failed to read diagnostic context", err);
    }
  }, []);

  const markDiagnosticShown = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("cth_diagnostic_context");
      const ctx = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(
        "cth_diagnostic_context",
        JSON.stringify({ ...ctx, shown: true })
      );
    } catch (err) {
      console.error("Failed to update diagnostic context", err);
    }
    setDiagnosticWelcome(null);
  }, []);

  const handleDiagnosticGo = useCallback(() => {
    const route = TIER_WELCOME[diagnosticWelcome?.tier]?.route || "/brand-foundation";
    markDiagnosticShown();
    navigate(route);
  }, [diagnosticWelcome, markDiagnosticShown, navigate]);

  // Generic welcome banner: any founder with zero milestones who hasn't dismissed it.
  const [showGenericWelcome, setShowGenericWelcome] = useState(false);

  const dismissGenericWelcome = useCallback(() => {
    try {
      const uid = user?.id;
      if (uid) localStorage.setItem(`cth-welcome-${uid}`, "true");
    } catch (err) {
      console.error("Failed to persist welcome dismissal", err);
    }
    setShowGenericWelcome(false);
  }, [user?.id]);

  const handleGenericGo = useCallback(() => {
    dismissGenericWelcome();
    navigate("/brand-audit");
  }, [dismissGenericWelcome, navigate]);

  useEffect(() => {
    if (loading) return;
    if (diagnosticWelcome) { setShowGenericWelcome(false); return; } // diagnostic banner wins
    const uid = user?.id;
    if (!uid) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(`cth-welcome-${uid}`) === "true";
    } catch (err) {
      console.error("Failed to read welcome dismissal", err);
    }
    if (dismissed) { setShowGenericWelcome(false); return; }
    const anyMilestone = [
      progress?.audit_complete, progress?.brand_memory_complete, progress?.foundation_complete,
      progress?.strategic_os_started, progress?.first_campaign_created,
    ].some(Boolean);
    setShowGenericWelcome(!anyMilestone);
  }, [loading, diagnosticWelcome, user?.id, progress]);

  const firstName = useMemo(() => {
    return user?.firstName || (user?.fullName || "").split(" ")[0] || user?.name || activeWorkspace?.name || "there";
  }, [activeWorkspace?.name, user?.firstName, user?.fullName, user?.name]);

  const loadCommandCenter = useCallback(async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      apiClient.get(API_PATHS.onboarding.progress, { params: { user_id: user?.id, workspace_id: activeWorkspaceId } }),
      apiClient.get(API_PATHS.audit.latest, { params: { workspace_id: activeWorkspaceId, user_id: user?.id, _t: Date.now() } }),
      apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId)),
      apiClient.get(API_PATHS.buyerSignals.list({})),
    ]);

    const [progressResult, auditResult, statsResult, signalsResult] = results;

    if (progressResult.status === "fulfilled") setProgress(progressResult.value || {});
    if (auditResult.status === "fulfilled") {
      setLatestAudit(auditResult.value?.audit || auditResult.value?.data?.audit || auditResult.value || null);
    }
    if (statsResult.status === "fulfilled") setWorkspaceStats(statsResult.value || null);

    // Signals this week = records created within the last 7 days. Fallback 0.
    if (signalsResult.status === "fulfilled") {
      const list = Array.isArray(signalsResult.value?.signals) ? signalsResult.value.signals : [];
      const cutoff = Date.now() - 7 * 86400000;
      const thisWeek = list.filter((sig) => {
        const t = new Date(sig?.created_at || 0).getTime();
        return Number.isFinite(t) && t >= cutoff;
      });
      setSignalsThisWeek(thisWeek.length);
      setSignalsUnconfirmed(thisWeek.filter((sig) => String(sig?.status || "") === "pending").length);
    } else {
      setSignalsThisWeek(0);
      setSignalsUnconfirmed(0);
    }

    if (results.every((item) => item.status === "rejected")) {
      setError("Some workspace data could not load, but the Command Center is still available.");
    }
    setLoading(false);
  }, [activeWorkspaceId, user?.id]);

  useEffect(() => { loadCommandCenter(); }, [loadCommandCenter]);
  useEffect(() => {
    const unregister = registerRefreshCallback(loadCommandCenter);
    return unregister;
  }, [registerRefreshCallback, loadCommandCenter]);

  // No real audit/health score yet → show an honest empty state, never a fake 78.
  const hasScore = Boolean(latestAudit) || Number.isFinite(Number(healthData?.overall_score));
  const overallScore = latestAudit?.overall_score ?? latestAudit?.scores?.overall ?? 0;
  const rating = latestAudit?.brand_health_rating || latestAudit?.rating || "Complete your Brand Audit to see your score.";
  const displayScore = Number.isFinite(Number(healthData?.overall_score)) ? Number(healthData.overall_score) : overallScore;
  const displayRating = healthData?.rating || rating;

  const bestMove = useMemo(() => buildDailyBestMove({ latestAudit, progress }), [latestAudit, progress]);
  const priorityActions = useMemo(() => buildPriorityActions({ latestAudit, milestones: progress }), [latestAudit, progress]);
  const pipelineStages = useMemo(() => buildPipelineStages(workspaceStats, healthData), [workspaceStats, healthData]);

  const launchReady = Boolean(healthData?.launch_ready);
  const launchThreshold = Number(healthData?.launch_threshold) || 60;
  const ptsToGo = Math.max(0, launchThreshold - displayScore);
  const launchHint = launchReady ? "Launch ready" : `${ptsToGo} points to launch-ready`;
  const scoreHint = priorityActions[0]?.title || (launchReady ? "Launch ready" : "Keep building to raise your score");

  // total_campaigns is the only campaign count the stats endpoint emits; the four
  // prior keys (active_projects/activeProjects/campaigns/campaign_count) are never
  // emitted, so this card read undefined and sat at 0 permanently.
  const activeProjects = Number(workspaceStats?.total_campaigns) || 0;
  const tasksCompleted = [
    progress?.audit_complete, progress?.brand_memory_complete, progress?.foundation_complete,
    progress?.strategic_os_started, progress?.first_campaign_created,
  ].filter(Boolean).length;

  const greeting = greetingFor(new Date());
  const planLabel = PLAN_INFO[normalizePlan(plan)]?.name || "Free";
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <DashboardLayout>
      <style>{COMMAND_CENTER_CSS}</style>
      <main className="cth-command-page">
        <div className="cc-shell">
          {/* 0 — Welcome banner: diagnostic-personalized first, else generic first-login */}
          {diagnosticWelcome ? (
            <DiagnosticWelcomeBanner
              context={diagnosticWelcome}
              onGo={handleDiagnosticGo}
              onDismiss={markDiagnosticShown}
            />
          ) : showGenericWelcome ? (
            <GenericWelcomeBanner
              firstName={firstName && firstName !== "there" ? firstName : ""}
              onGo={handleGenericGo}
              onDismiss={dismissGenericWelcome}
            />
          ) : null}

          {/* 1 — Greeting */}
          <header>
            <h1 className="cc-greeting">{greeting}, {firstName}.</h1>
            <p className="cc-greeting-sub">{dateLabel} &nbsp;·&nbsp; {planLabel} &nbsp;·&nbsp; {launchHint}</p>
          </header>

          {error ? (
            <div className="cc-error"><AlertCircle size={16} /><span>{error}</span></div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader2 className="animate-spin" size={28} color="#af002a" />
            </div>
          ) : (
            <>
              {/* 2 + 3 — Brand Health hero (left) + stat cards (right) in one row */}
              <div className="cc-top-row">
                <HealthHero score={displayScore} rating={displayRating} launchReady={launchReady} hint={scoreHint} hasScore={hasScore} />
                <StatCards
                  activeProjects={activeProjects}
                  signalsThisWeek={signalsThisWeek}
                  signalsUnconfirmed={signalsUnconfirmed}
                  tasksCompleted={tasksCompleted}
                />
              </div>

              {/* 4 — Brand OS Pipeline */}
              <Pipeline stages={pipelineStages} navigate={navigate} />

              {/* 5 — Today's Focus + Zuri */}
              <div className="cc-bottom">
                <TodayFocus actions={priorityActions} navigate={navigate} />
                <ZuriCard bestMove={bestMove} navigate={navigate} />
              </div>
            </>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
