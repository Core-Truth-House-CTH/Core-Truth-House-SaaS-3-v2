import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDot,
  Compass,
  Gauge,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  PenTool,
  Radar,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WandSparkles,
  Workflow,
} from "lucide-react";

import AuthShell from "../components/AuthShell";
import AskTheHouseDrawer from "../components/ask-the-house/AskTheHouseDrawer";
import { useAskTheHouse } from "../context/AskTheHouseContext";
import { useBrandHealth } from "../context/BrandHealthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";
import { fetchCommandCenterOverview } from "../lib/commandCenterOverview";
import "../styles/command-center-next.css";

const SIGNAL_LABELS = {
  1: "Recognition",
  2: "Problem Ownership",
  3: "Solution Curiosity",
  4: "Offer Curiosity",
  5: "Purchase Movement",
};

const QUICK_ACTIONS = [
  { label: "Run Brand Diagnostic", helper: "Find the structural gap", icon: Gauge, route: "/brand-audit" },
  { label: "Generate Content", helper: "Create from Brand Memory", icon: PenTool, route: "/content-studio" },
  { label: "Create Campaign", helper: "Connect message to movement", icon: Megaphone, route: "/campaign-builder" },
  { label: "Build Offer", helper: "Shape the transformation", icon: BriefcaseBusiness, route: "/offer-builder" },
  { label: "Audit Website", helper: "Review clarity and conversion", icon: SearchCheck, route: "/brand-intelligence" },
  { label: "Analyze Competitor", helper: "Map market positioning", icon: Radar, route: "/brand-positioning" },
  { label: "Record Pitch", helper: "Practice expert articulation", icon: MessageSquareText, route: "/studios/voice" },
];

function numberFrom(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function nullableNumber(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function arrayFrom(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function safeText(value, fallback = "Not available yet") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function safeRoute(value, fallback) {
  const route = String(value || "").trim();
  return route.startsWith("/") ? route : fallback;
}

function dateLabel(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function scoreFromAudit(audit) {
  return numberFrom(
    audit?.score,
    audit?.overall_score,
    audit?.brand_readiness_score,
    audit?.result?.score,
    audit?.data?.score
  );
}

function modulePercent(modules, key, fallback = 0) {
  const module = modules?.[key];
  const direct = nullableNumber(module?.score);
  if (direct !== null) return Math.max(0, Math.min(100, direct));
  const completed = nullableNumber(module?.completed);
  const total = nullableNumber(module?.total);
  if (completed !== null && total !== null && total > 0) {
    return Math.round((completed / total) * 100);
  }
  return Math.max(0, Math.min(100, numberFrom(fallback)));
}

function statusCopy(score) {
  if (score >= 85) return "Authority is building";
  if (score >= 70) return "Structure is taking hold";
  if (score >= 50) return "Core systems need alignment";
  if (score > 0) return "The foundation needs attention";
  return "Complete the diagnostic";
}

/**
 * Time-of-day greeting. Pure and exported so it can be unit tested without
 * touching the machine clock.
 *   hour < 12  -> "Good Morning"
 *   12 to 16   -> "Good Afternoon"
 *   17 and up  -> "Good Evening"
 */
export function greetingForHour(hour) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function fallbackNextMove({ score, modules, audit, stats }) {
  if (!audit) {
    return {
      eyebrow: "START HERE",
      title: "Complete your Brand Diagnostic",
      body: "The House needs a current baseline before it can recommend the most accurate structural move.",
      action: "Run the diagnostic",
      route: "/brand-audit",
    };
  }

  const candidates = [
    {
      score: modulePercent(modules, "brand_foundation", stats?.foundation_completion),
      eyebrow: "NEXT BEST MOVE",
      title: "Strengthen the Brand Foundation",
      body: "Clarify the truth, audience, promise, and voice before adding more execution.",
      action: "Open Brand Foundation",
      route: "/brand-foundation",
    },
    {
      score: modulePercent(modules, "offer_builder", stats?.offers_completion),
      eyebrow: "NEXT BEST MOVE",
      title: "Clarify the offer architecture",
      body: "Define the outcome, packaging, and pricing logic buyers are actually choosing between.",
      action: "Open Offer Builder",
      route: "/offer-builder",
    },
    {
      score: modulePercent(modules, "systems_builder", stats?.systems_completion),
      eyebrow: "NEXT BEST MOVE",
      title: "Build one repeatable system",
      body: "Turn one process into documented infrastructure so the brand can move without relying on memory.",
      action: "Open Systems Builder",
      route: "/systems-builder",
    },
    {
      score: modulePercent(modules, "content_studio", stats?.content_completion),
      eyebrow: "NEXT BEST MOVE",
      title: "Create one aligned content direction",
      body: "Give the next piece of content a clear strategic job and connect it to a real offer or decision.",
      action: "Open Content Studio",
      route: "/content-studio",
    },
  ].sort((a, b) => a.score - b.score);

  if (score >= 85 && numberFrom(stats?.total_campaigns) > 0) {
    return {
      eyebrow: "NEXT BEST MOVE",
      title: "Optimize one conversion path",
      body: "The foundation is strong enough to trace attention into action and sharpen the path that is already moving.",
      action: "Open Reports",
      route: "/analytics",
    };
  }

  return candidates[0];
}

function fallbackHouseLevels({ modules, stats, score }) {
  const foundation = Math.round([
    modulePercent(modules, "brand_foundation", stats?.foundation_completion),
    modulePercent(modules, "identity_studio", stats?.identity_completion),
  ].reduce((sum, value) => sum + value, 0) / 2);

  const structure = Math.round([
    modulePercent(modules, "strategic_os", stats?.strategic_completion),
    modulePercent(modules, "offer_builder", stats?.offers_completion),
    modulePercent(modules, "systems_builder", stats?.systems_completion),
  ].reduce((sum, value) => sum + value, 0) / 3);

  const house = Math.round([
    modulePercent(modules, "content_studio", stats?.content_completion),
    numberFrom(stats?.campaign_completion),
    numberFrom(stats?.launch_readiness),
  ].reduce((sum, value) => sum + value, 0) / 3);

  const estate = Math.round([
    numberFrom(stats?.publishing_completion),
    numberFrom(stats?.crm_completion),
    numberFrom(stats?.workspace_usage, score),
  ].reduce((sum, value) => sum + value, 0) / 3);

  return [
    { key: "foundation", label: "Foundation", value: foundation, route: "/brand-foundation", rooms: "Truth · Audience · Identity" },
    { key: "structure", label: "Structure", value: structure, route: "/strategic-os", rooms: "Positioning · Offers · Systems" },
    { key: "house", label: "House", value: house, route: "/campaign-builder", rooms: "Content · Campaigns · Launches" },
    { key: "estate", label: "Estate", value: estate, route: "/workspace", rooms: "Publishing · CRM · Reporting" },
  ];
}

function authoritativeHouseLevels(brandHouse) {
  return [
    { key: "foundation", label: "Foundation", value: brandHouse.foundation, route: "/brand-foundation", rooms: "Truth · Audience · Identity" },
    { key: "structure", label: "Structure", value: brandHouse.structure, route: "/strategic-os", rooms: "Positioning · Offers · Systems" },
    { key: "house", label: "House", value: brandHouse.house, route: "/campaign-builder", rooms: "Content · Campaigns · Launches" },
    { key: "estate", label: "Estate", value: brandHouse.estate, route: "/workspace", rooms: "Publishing · CRM · Reporting" },
  ];
}

function intelligenceIcon(item) {
  const type = String(item?.type || item?.label || "").toLowerCase();
  if (type.includes("signal") || type.includes("audience")) return Radar;
  if (type.includes("campaign") || type.includes("content")) return Megaphone;
  if (type.includes("health") || type.includes("brand")) return TrendingUp;
  return Lightbulb;
}

function progressIcon(item) {
  const type = String(item?.type || item?.title || "").toLowerCase();
  if (type.includes("campaign")) return Megaphone;
  if (type.includes("signal")) return Radar;
  return CheckCircle2;
}

function normalizeSignalCard(signal) {
  const level = numberFrom(signal?.confirmed_level, signal?.level, signal?.suggested_level);
  return {
    id: signal?.id || signal?._id || `${signal?.created_at}-${level}`,
    level,
    title: safeText(signal?.title || signal?.signal_type || signal?.description, "New buyer signal"),
    source: safeText(signal?.source || signal?.entity_type || signal?.channel, "Workspace activity"),
    date: dateLabel(signal?.created_at),
    route: safeRoute(signal?.route, "/signal-inbox"),
  };
}

function normalizeWorkbenchItem(item) {
  return {
    id: item?.id || item?._id || item?.title || item?.name,
    title: safeText(item?.title || item?.name, "Untitled work item"),
    type: safeText(item?.type, "Work"),
    status: safeText(item?.status, "In progress"),
    route: safeRoute(item?.route, "/workspace?view=work"),
  };
}

function normalizeIntelligenceItem(item, index) {
  return {
    id: item?.id || `${item?.label || item?.type || "intelligence"}-${index}`,
    icon: intelligenceIcon(item),
    label: safeText(item?.label || item?.type, "House intelligence"),
    title: safeText(item?.title || item?.summary || item?.body, "New workspace evidence is available."),
    route: safeRoute(item?.route, "/analytics"),
  };
}

function normalizeProgressItem(item, index) {
  return {
    id: item?.id || `${item?.title || item?.type || "progress"}-${index}`,
    icon: progressIcon(item),
    title: safeText(item?.title || item?.summary, "Workspace progress recorded"),
    meta: safeText(item?.meta || item?.status || dateLabel(item?.created_at), "Recently"),
    route: safeRoute(item?.route, "/workspace?view=activity"),
  };
}

function HouseIllustration({ levels, onOpen }) {
  const levelMap = Object.fromEntries(levels.map((level) => [level.key, level]));
  const positions = [
    { left: "7%", top: "66%" },
    { left: "17%", top: "22%" },
    { right: "7%", top: "22%" },
    { right: "9%", top: "68%" },
  ];

  return (
    <div className="ccn-house-visual" role="img" aria-label="Interactive architectural Brand House">
      <svg viewBox="0 0 760 430" aria-hidden="true">
        <defs>
          <linearGradient id="ccn-house-wall" x1="0" x2="1">
            <stop offset="0" stopColor="#fffaf5" />
            <stop offset="1" stopColor="#efe3df" />
          </linearGradient>
          <linearGradient id="ccn-house-glass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#efe6ee" stopOpacity="0.86" />
            <stop offset="1" stopColor="#bea9bc" stopOpacity="0.48" />
          </linearGradient>
          <filter id="ccn-house-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#33033c" floodOpacity="0.18" />
          </filter>
        </defs>
        <path d="M80 345 L660 345 L706 383 L32 383 Z" fill="#c4a95b" opacity="0.18" />
        <g filter="url(#ccn-house-shadow)">
          <path d="M132 152 L364 34 L617 152 L617 345 L132 345 Z" fill="url(#ccn-house-wall)" stroke="#af0024" strokeWidth="3" />
          <path d="M111 154 L364 18 L638 154" fill="none" stroke="#33033c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M364 44 L364 345" stroke="#c4a95b" strokeWidth="3" />
          <rect x="168" y="183" width="156" height="122" rx="4" fill="url(#ccn-house-glass)" stroke="#33033c" strokeWidth="2" />
          <path d="M246 183 V305 M168 244 H324" stroke="#fffaf5" strokeWidth="3" opacity="0.8" />
          <rect x="404" y="177" width="158" height="168" rx="4" fill="#33033c" />
          <rect x="442" y="221" width="82" height="124" rx="2" fill="#af0024" />
          <circle cx="508" cy="284" r="5" fill="#c4a95b" />
          <rect x="155" y="320" width="430" height="25" fill="#260128" />
          <path d="M128 345 H624" stroke="#c4a95b" strokeWidth="5" />
          <path d="M138 150 L364 43 L608 150" fill="none" stroke="#c4a95b" strokeWidth="2" opacity="0.9" />
        </g>
        <g fill="none" stroke="#c4a95b" strokeWidth="1.2" strokeDasharray="5 7" opacity="0.65">
          <path d="M54 92 H250" />
          <path d="M486 82 H708" />
          <path d="M70 402 H690" />
          <path d="M92 74 V328" />
          <path d="M650 92 V330" />
        </g>
      </svg>

      {levels.map((level, index) => (
        <button
          key={level.key}
          type="button"
          className={`ccn-house-marker ccn-house-marker--${level.key}`}
          style={positions[index]}
          onClick={() => onOpen(level.route)}
          aria-label={`Open ${level.label}, ${level.value}% complete`}
        >
          <span>{level.label}</span>
          <strong>{Math.round(levelMap[level.key]?.value || 0)}%</strong>
        </button>
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone, onClick }) {
  return (
    <button type="button" className={`ccn-metric ccn-metric--${tone}`} onClick={onClick}>
      <span className="ccn-metric-icon"><Icon size={18} aria-hidden="true" /></span>
      <span>
        <small>{label}</small>
        <strong>{value === null || value === undefined ? "—" : value}</strong>
        <em>{note}</em>
      </span>
      <ArrowRight size={15} aria-hidden="true" />
    </button>
  );
}

function EmptyState({ children }) {
  return <div className="ccn-empty">{children}</div>;
}

export default function CommandCenterNext() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const { healthData } = useBrandHealth();
  const { isOpen, open, close, sectionId } = useAskTheHouse();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState("pending");
  const [data, setData] = useState({});

  const loadLegacySources = useCallback(async () => {
    const requests = [
      apiClient.get(API_PATHS.onboarding.progress, { params: { workspace_id: activeWorkspaceId, user_id: user?.id } }),
      apiClient.get(API_PATHS.audit.latest, { params: { workspace_id: activeWorkspaceId, user_id: user?.id, _t: Date.now() } }),
      apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId)),
      apiClient.get(API_PATHS.buyerSignals.list({})),
      apiClient.get(API_PATHS.campaigns.list),
      apiClient.get(API_PATHS.crm.dashboard),
      apiClient.get(API_PATHS.analytics.overview),
    ];

    const results = await Promise.allSettled(requests);
    const value = (index) => results[index]?.status === "fulfilled" ? results[index].value : null;
    const failed = results.filter((result) => result.status === "rejected").length;

    return {
      data: {
        overview: null,
        progress: value(0),
        audit: value(1)?.audit || value(1)?.data?.audit || value(1),
        stats: value(2),
        signals: value(3),
        campaigns: value(4),
        crm: value(5),
        analytics: value(6),
      },
      failed,
    };
  }, [activeWorkspaceId, user?.id]);

  const loadDashboard = useCallback(async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      setDataSource("empty");
      setData({});
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const overviewResult = await fetchCommandCenterOverview(activeWorkspaceId);

      if (overviewResult.available) {
        setData({ overview: overviewResult.data });
        setDataSource("overview");
        return;
      }

      const fallback = await loadLegacySources();
      setData(fallback.data);
      setDataSource("legacy-fallback");
      if (fallback.failed) {
        setError(`${fallback.failed} verified workspace data source${fallback.failed === 1 ? " is" : "s are"} temporarily unavailable.`);
      }
    } catch (requestError) {
      setData({});
      setDataSource("error");
      setError(requestError?.message || "The Command Center could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, loadLegacySources]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const derived = useMemo(() => {
    const overview = data.overview || null;

    if (overview) {
      const signalCards = overview.buyerSignals.recent.slice(0, 4).map(normalizeSignalCard);
      const workbench = overview.activeWork.items.slice(0, 3).map(normalizeWorkbenchItem);
      const intelligence = overview.dailyIntelligence.slice(0, 4).map(normalizeIntelligenceItem);
      const recentProgress = overview.recentProgress.slice(0, 4).map(normalizeProgressItem);

      return {
        authoritative: true,
        score: overview.brandHealth.score,
        scoreStatus: overview.brandHealth.status || statusCopy(overview.brandHealth.score),
        confirmedSignalCount: overview.buyerSignals.confirmed,
        unconfirmedSignalCount: overview.buyerSignals.unconfirmed,
        signalCards,
        openDecisions: overview.openDecisions.count,
        activeWork: overview.activeWork.count,
        activeCampaignCount: overview.activeWork.campaignCount,
        systemAlerts: overview.systemAlerts.count,
        nextMove: overview.nextMove,
        houseLevels: authoritativeHouseLevels(overview.brandHouse),
        workbench,
        intelligence,
        recentProgress,
      };
    }

    const modules = healthData?.modules || {};
    const stats = data.stats || {};
    const audit = data.audit || null;
    const progress = data.progress || {};
    const signals = arrayFrom(data.signals, ["signals", "items", "results"]);
    const campaigns = arrayFrom(data.campaigns, ["campaigns", "items", "results"]);

    const score = Math.round(numberFrom(healthData?.overall_score, healthData?.overall, scoreFromAudit(audit)));
    const confirmedSignals = signals.filter((signal) => String(signal?.status || "").toLowerCase() === "confirmed");
    const unconfirmedSignals = signals.filter((signal) => String(signal?.status || "unconfirmed").toLowerCase() !== "confirmed");
    const activeCampaigns = campaigns.filter((campaign) => !["complete", "completed", "archived", "cancelled"].includes(String(campaign?.status || "active").toLowerCase()));

    const signalCards = [...signals]
      .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
      .slice(0, 4)
      .map(normalizeSignalCard);

    const workbench = activeCampaigns.slice(0, 3).map((campaign) => normalizeWorkbenchItem({
      ...campaign,
      type: "Campaign",
      route: "/campaign-builder",
    }));

    if (!workbench.length && numberFrom(stats?.total_content) > 0) {
      workbench.push(normalizeWorkbenchItem({ id: "content", title: "Content Library", type: "Content", status: `${numberFrom(stats?.total_content)} assets`, route: "/content-studio" }));
    }
    if (!workbench.length && numberFrom(stats?.total_offers) > 0) {
      workbench.push(normalizeWorkbenchItem({ id: "offers", title: "Offer Architecture", type: "Offer", status: `${numberFrom(stats?.total_offers)} offers`, route: "/offer-builder" }));
    }

    const intelligence = [
      confirmedSignals.length > 0 ? {
        id: "signals",
        icon: Radar,
        label: "Audience intelligence",
        title: `${confirmedSignals.length} confirmed buyer signal${confirmedSignals.length === 1 ? "" : "s"} are shaping the evidence base.`,
        route: "/signal-inbox",
      } : null,
      score > 0 ? {
        id: "brand-health",
        icon: TrendingUp,
        label: "Brand movement",
        title: `Brand Health is ${score}. ${statusCopy(score)}.`,
        route: "/brand-health",
      } : null,
      activeCampaigns.length > 0 ? {
        id: "campaigns",
        icon: Megaphone,
        label: "Campaign activity",
        title: `${activeCampaigns.length} active campaign${activeCampaigns.length === 1 ? " is" : "s are"} currently moving through the House.`,
        route: "/campaign-builder",
      } : null,
    ].filter(Boolean);

    const recentProgress = [
      audit ? { id: "audit", icon: CheckCircle2, title: "Brand Diagnostic recorded", meta: dateLabel(audit?.created_at || audit?.updated_at), route: "/brand-health" } : null,
      progress?.brand_memory_complete ? { id: "brand-memory", icon: CheckCircle2, title: "Brand Memory connected", meta: "Foundation", route: "/brand-foundation" } : null,
      activeCampaigns[0] ? { id: "campaign", icon: Megaphone, title: safeText(activeCampaigns[0]?.name || activeCampaigns[0]?.title, "Campaign in progress"), meta: safeText(activeCampaigns[0]?.status, "Active"), route: "/campaign-builder" } : null,
      confirmedSignals[0] ? { id: "signal", icon: Radar, title: "Buyer signal confirmed", meta: dateLabel(confirmedSignals[0]?.created_at), route: "/signal-inbox" } : null,
    ].filter(Boolean).slice(0, 4);

    return {
      authoritative: false,
      score,
      scoreStatus: statusCopy(score),
      confirmedSignalCount: confirmedSignals.length,
      unconfirmedSignalCount: unconfirmedSignals.length,
      signalCards,
      openDecisions: null,
      activeWork: activeCampaigns.length + numberFrom(stats?.draft_content, stats?.active_projects),
      activeCampaignCount: activeCampaigns.length,
      systemAlerts: nullableNumber(stats?.system_alerts, stats?.integration_errors, stats?.failed_jobs),
      nextMove: fallbackNextMove({ score, modules, audit, stats }),
      houseLevels: fallbackHouseLevels({ modules, stats, score }),
      workbench,
      intelligence,
      recentProgress,
    };
  }, [data, healthData]);

  const firstName = user?.firstName || (user?.fullName || "").split(" ")[0] || activeWorkspace?.name || "Founder";
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  // Local browser time, not server UTC.
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  return (
    <AuthShell activeNav="command-center">
      <main className="ccn-page">
        <section className="ccn-heading-row">
          <div>
            <span className="ccn-kicker">{today}</span>
            <h1>{greeting}, {firstName}.</h1>
            <p>The House has organized what needs your attention inside {activeWorkspace?.name || "this workspace"}.</p>
          </div>
          <button type="button" className="ccn-refresh" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={15} className={loading ? "is-spinning" : ""} aria-hidden="true" />
            Refresh intelligence
          </button>
        </section>

        {dataSource === "legacy-fallback" ? (
          <div className="ccn-data-source" role="status">
            The consolidated Command Center backend is pending. This preview is using verified existing workspace sources and leaves unsupported metrics blank.
          </div>
        ) : null}

        {error ? <div className="ccn-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /> {error}</div> : null}

        <section className="ccn-metrics" aria-label="Command Center summary">
          <MetricCard icon={Gauge} label="Brand Health Score" value={derived.score || null} note={derived.scoreStatus} tone="crimson" onClick={() => navigate("/brand-health")} />
          <MetricCard icon={Radar} label="Buyer Signals" value={derived.confirmedSignalCount} note={`${derived.unconfirmedSignalCount} awaiting confirmation`} tone="gold" onClick={() => navigate("/signal-inbox")} />
          <MetricCard icon={Compass} label="Open Decisions" value={derived.openDecisions} note={derived.openDecisions === null ? "Decision endpoint pending" : "Unresolved strategic decisions"} tone="purple" onClick={() => navigate("/workspace?view=decisions")} />
          <MetricCard icon={Workflow} label="Active Work" value={derived.activeWork} note={`${derived.activeCampaignCount} active campaigns`} tone="green" onClick={() => navigate("/workspace?view=work")} />
          <MetricCard icon={AlertTriangle} label="System Alerts" value={derived.systemAlerts} note={derived.systemAlerts === null ? "Alert endpoint pending" : derived.systemAlerts ? "Review workspace health" : "All systems normal"} tone="orange" onClick={() => navigate("/alerts")} />
        </section>

        <section className="ccn-primary-grid">
          <article className="ccn-next-move">
            {/* Static section label, matching its sibling panels ("YOUR BRAND HOUSE").
                The backend still sends nextMove.eyebrow; it is intentionally not used
                as the section heading so the approved copy stays stable. */}
            <span className="ccn-panel-eyebrow"><Sparkles size={14} aria-hidden="true" /> YOUR NEXT MOVE</span>
            <h2>{derived.nextMove.title}</h2>
            <p>{derived.nextMove.body}</p>
            <button type="button" onClick={() => navigate(derived.nextMove.route)}>
              {derived.nextMove.action} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </article>

          <aside className="ccn-signals-card">
            <div className="ccn-card-heading">
              <div><span>Brand Signals</span><small>What the market is showing you</small></div>
              <button type="button" onClick={() => navigate("/signal-inbox")}>View all</button>
            </div>
            <div className="ccn-signal-list">
              {derived.signalCards.length ? derived.signalCards.map((signal) => (
                <button key={signal.id} type="button" className="ccn-signal" onClick={() => navigate(signal.route)}>
                  <span className={`ccn-signal-level ccn-signal-level--${signal.level || 1}`}>{signal.level || 1}</span>
                  <span>
                    <strong>{signal.title}</strong>
                    <small>{SIGNAL_LABELS[signal.level] || "Signal"} · {signal.source}</small>
                  </span>
                  <em>{signal.date}</em>
                </button>
              )) : <EmptyState>Confirmed buyer signals will appear here after the tenant reviews them.</EmptyState>}
            </div>
          </aside>
        </section>

        <section className="ccn-house-card">
          <div className="ccn-house-copy">
            <span className="ccn-panel-eyebrow"><ShieldCheck size={14} aria-hidden="true" /> YOUR BRAND HOUSE</span>
            <h2>See the structure behind the brand.</h2>
            <p>Every level opens the real room where the tenant’s work is built, reviewed, and improved.</p>
            <div className="ccn-level-list">
              {derived.houseLevels.map((level) => (
                <button key={level.key} type="button" onClick={() => navigate(level.route)}>
                  <span><strong>{level.label}</strong><small>{level.rooms}</small></span>
                  <em>{level.value}%</em>
                </button>
              ))}
            </div>
          </div>
          <HouseIllustration levels={derived.houseLevels} onOpen={navigate} />
        </section>

        <section className="ccn-consult-card">
          <div className="ccn-consult-icon"><WandSparkles size={28} aria-hidden="true" /></div>
          <div>
            <span>CONSULT THE HOUSE</span>
            <h2>Ask Zuri what the data means before making the next decision.</h2>
            <p>Zuri uses this tenant’s Brand Memory, workspace records, and confirmed signals. Other tenant content is never included.</p>
          </div>
          <button type="button" onClick={() => open("command-center-consult")}>Ask Zuri <ArrowRight size={15} aria-hidden="true" /></button>
        </section>

        <section className="ccn-secondary-grid">
          <article className="ccn-card ccn-intelligence">
            <div className="ccn-card-heading"><div><span>Daily Intelligence</span><small>Evidence worth acting on today</small></div></div>
            <div className="ccn-intelligence-list">
              {derived.intelligence.length ? derived.intelligence.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => navigate(item.route)}>
                    <span><Icon size={17} aria-hidden="true" /></span>
                    <span><small>{item.label}</small><strong>{item.title}</strong></span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                );
              }) : <EmptyState>Complete the diagnostic, confirm signals, or create a campaign to begin the daily intelligence feed.</EmptyState>}
            </div>
          </article>

          <article className="ccn-card ccn-progress-card">
            <div className="ccn-card-heading"><div><span>Recent Progress</span><small>Movement recorded in this workspace</small></div><button type="button" onClick={() => navigate("/workspace?view=activity")}>View activity</button></div>
            <div className="ccn-progress-list">
              {derived.recentProgress.length ? derived.recentProgress.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => navigate(item.route)}>
                    <span><Icon size={15} aria-hidden="true" /></span>
                    <span><strong>{item.title}</strong><small>{item.meta}</small></span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                );
              }) : <EmptyState>Workspace milestones will appear here as the tenant completes real work.</EmptyState>}
            </div>
          </article>
        </section>

        <section className="ccn-bottom-grid">
          <article className="ccn-card ccn-workbench">
            <div className="ccn-card-heading"><div><span>Active Workbench</span><small>What is currently being built</small></div><button type="button" onClick={() => navigate("/workspace?view=work")}>Open workspace</button></div>
            <div className="ccn-workbench-list">
              {derived.workbench.length ? derived.workbench.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(item.route)}>
                  <span className="ccn-work-type">{item.type}</span>
                  <span><strong>{item.title}</strong><small>{item.status}</small></span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              )) : <EmptyState>Start a campaign, build an offer, or generate content to place work on the bench.</EmptyState>}
            </div>
          </article>

          <article className="ccn-card ccn-quick-actions">
            <div className="ccn-card-heading"><div><span>Quick Actions</span><small>Open the right room without searching</small></div></div>
            <div className="ccn-action-grid">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} type="button" onClick={() => navigate(action.route)}>
                    <span><Icon size={17} aria-hidden="true" /></span>
                    <span><strong>{action.label}</strong><small>{action.helper}</small></span>
                  </button>
                );
              })}
            </div>
          </article>
        </section>

        {loading ? <div className="ccn-loading" role="status"><CircleDot size={15} aria-hidden="true" /> Updating workspace intelligence…</div> : null}
      </main>

      <AskTheHouseDrawer open={isOpen} onClose={close} surface="command_center" sectionId={sectionId} />
    </AuthShell>
  );
}
