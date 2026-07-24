import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Compass,
  Gauge,
  Home,
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

const CONSULT_PROMPTS = [
  "Why aren’t people buying?",
  "Rewrite my homepage.",
  "Build my launch strategy.",
  "Analyze my positioning.",
];

// Rows for the Brand Health card. These read REAL module scores from the Brand
// Health service - no invented copy. A module scoring 0 (or absent) is dropped
// rather than shown as a fabricated insight.
const HEALTH_ROWS = [
  { key: "brand_foundation", label: "Brand Foundation" },
  { key: "strategic_os", label: "Positioning & Messaging" },
  { key: "content_studio", label: "Content Consistency" },
];

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

export function fallbackHouseLevels({ modules, stats, score }) {
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

export function authoritativeHouseLevels(brandHouse) {
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

// The approved Brand House asset. The same file is used by the Command Center
// and the /brand-house page - there is exactly one house image in the repo.
const HOUSE_ASSET = "/command-center-assets/brand-house.png";

// The approved Core Truth House seal, already present in the repo and byte
// identical to the approved source.
const SEAL_ASSET = "/command-center-assets/cth-logo-seal.png";

// Static interface copy from the approved Command Center prototype's floor rail.
// These are UI descriptors, not workspace data - the real completion values keep
// coming from the authoritative overview response.
const HOUSE_LEVEL_DESCRIPTORS = {
  estate: "Legacy & Scale",
  house: "Systems & Offers",
  structure: "Messaging & Positioning",
  foundation: "Identity & Clarity",
};

// Hotspot coordinates are taken from the approved prototype (.hot1-.hot4) and
// are percentages, so they stay on the correct room as the image scales.
const HOUSE_HOTSPOTS = {
  estate: { left: "68%", top: "18%" },
  house: { left: "51%", top: "43%" },
  structure: { left: "33%", top: "62%" },
  foundation: { left: "67%", top: "70%" },
};

function HouseVisual({ levels, onOpen, className = "" }) {
  return (
    <div className={`ccn-house-visual ${className}`.trim()}>
      <img src={HOUSE_ASSET} alt="The Core Truth House brand operating system" />
      {levels.map((level) => {
        const position = HOUSE_HOTSPOTS[level.key];
        if (!position) return null;
        return (
          <button
            key={level.key}
            type="button"
            className="ccn-house-hotspot"
            style={position}
            onClick={() => onOpen(level.route)}
            aria-label={`Open ${level.label}, ${level.value}% complete`}
          />
        );
      })}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone, onClick }) {
  const displayValue = value === null || value === undefined ? "—" : value;
  // Without this the flattened name reads "Buyer Signals00 awaiting confirmation"
  // and never says where the card goes. The note stays in the name so the real
  // supporting text is not lost to assistive technology.
  // "Go to" rather than "Open" - several labels already begin with "Open",
  // which would otherwise be announced as "Open Open Decisions".
  const spokenName = `${label}: ${displayValue}. ${note}. Go to ${label}.`;

  return (
    <button
      type="button"
      className={`ccn-metric ccn-metric--${tone}`}
      onClick={onClick}
      aria-label={spokenName}
    >
      <span className="ccn-metric-head">
        <small>{label}</small>
        <span className="ccn-metric-icon"><Icon size={16} aria-hidden="true" /></span>
      </span>
      <strong>{displayValue}</strong>
      <span className="ccn-metric-foot">
        <em>{note}</em>
        <ArrowRight className="ccn-metric-arrow" size={15} aria-hidden="true" />
      </span>
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

  // Monotonic id of the latest dashboard load; see the stale-response guard below.
  const loadRequestRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      setDataSource("empty");
      setData({});
      setError("");
      return;
    }

    // Guard against out-of-order responses when the workspace changes mid-flight:
    // only the most recently started request may write state. Without this, a
    // slow request for a previous workspace can resolve last and overwrite the
    // current workspace's metrics under its heading.
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    const isStale = () => loadRequestRef.current !== requestId;

    setLoading(true);
    setError("");

    try {
      const overviewResult = await fetchCommandCenterOverview(activeWorkspaceId);
      if (isStale()) return;

      if (overviewResult.available) {
        setData({ overview: overviewResult.data });
        setDataSource("overview");
        return;
      }

      const fallback = await loadLegacySources();
      if (isStale()) return;
      setData(fallback.data);
      setDataSource("legacy-fallback");
      if (fallback.failed) {
        setError(`${fallback.failed} verified workspace data source${fallback.failed === 1 ? " is" : "s are"} temporarily unavailable.`);
      }
    } catch (requestError) {
      if (isStale()) return;
      setData({});
      setDataSource("error");
      setError(requestError?.message || "The Command Center could not be loaded.");
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [activeWorkspaceId, loadLegacySources]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Brand Signals is only "live" when the panel is reading the consolidated
  // overview response - never on legacy fallback, empty, pending or error. This
  // reuses the existing dataSource state; it adds no request, poll or socket.
  const signalsLive = dataSource === "overview" && !error;

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

  // Local browser clock, not server UTC. Ticks once a minute purely so the
  // displayed time (and the daypart greeting) stay current while the page sits
  // open - it triggers no request of any kind.
  const [consultQuestion, setConsultQuestion] = useState("");

  // Blank or whitespace-only input does nothing. On a real question we open the
  // existing Ask the House panel; the question cannot be handed over because
  // that panel exposes no prefill contract, so it stays in the field.
  const handleConsultSubmit = useCallback((event) => {
    event.preventDefault();
    if (!consultQuestion.trim()) return;
    open("command-center-consult");
  }, [consultQuestion, open]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = greetingForHour(now.getHours());
  // Named distinctly from the module-level dateLabel() formatter: a local
  // `const dateLabel` would shadow that helper across the whole component and
  // throw a TDZ ReferenceError when the fallback path calls it during render.
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(now),
    [now],
  );
  const timeLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now),
    [now],
  );
  // Machine-readable local values for the <time> elements.
  const pad = (value) => String(value).padStart(2, "0");
  const dateTimeAttr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeAttr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Approved composition lists the House top floor first (Estate -> Foundation);
  // the data layer returns it bottom-up, so present a reversed copy.
  const houseLevelsTopDown = useMemo(() => [...derived.houseLevels].reverse(), [derived.houseLevels]);

  const healthRows = useMemo(() => {
    const modules = healthData?.modules || {};
    return HEALTH_ROWS
      .map((row) => ({ ...row, value: Math.round(modulePercent(modules, row.key)) }))
      .filter((row) => row.value > 0);
  }, [healthData]);

  return (
    <AuthShell activeNav="command-center">
      <main className="ccn-page">
        <section className="ccn-heading-row">
          <div>
            <h1>
              {greeting}, {firstName}.
              <Sparkles className="ccn-greeting-sparkle" size={26} aria-hidden="true" focusable="false" />
            </h1>
            <p>The House has organized what needs your attention inside {activeWorkspace?.name || "this workspace"}.</p>
          </div>
          <div className="ccn-heading-meta">
            <span className="ccn-heading-stamp">
              <time dateTime={dateTimeAttr}>{todayLabel}</time>
              <span className="ccn-stamp-dot" aria-hidden="true" />
              <time dateTime={timeAttr}>{timeLabel}</time>
            </span>
            <button type="button" className="ccn-refresh" onClick={loadDashboard} disabled={loading}>
              <RefreshCw size={15} className={loading ? "is-spinning" : ""} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </section>

        {dataSource === "legacy-fallback" ? (
          <div className="ccn-data-source" role="status">
            The consolidated Command Center backend is pending. This preview is using verified existing workspace sources and leaves unsupported metrics blank.
          </div>
        ) : null}

        {error ? <div className="ccn-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /> {error}</div> : null}

        <div className="ccn-layout">
          <div className="ccn-col ccn-col-left">
            <article className="ccn-card ccn-health-card">
              <button type="button" className="ccn-health-score" onClick={() => navigate("/brand-health")}>
                <span className="ccn-card-label">Brand Health Score</span>
                <strong>{derived.score === null || derived.score === undefined ? "—" : derived.score}</strong>
                <small>{derived.scoreStatus}</small>
              </button>
              <div className="ccn-health-detail">
                {healthRows.length ? (
                  <div className="ccn-health-rows">
                    {healthRows.map((row) => (
                      <div key={row.key} className="ccn-health-row">
                        <span className={`ccn-health-dot ${row.value >= 70 ? "is-good" : "is-warn"}`} aria-hidden="true">
                          {row.value >= 70 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        </span>
                        <span><strong>{row.label}</strong><small>{row.value}% complete</small></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ccn-health-note">{derived.scoreStatus}</p>
                )}
                <button type="button" className="ccn-link" onClick={() => navigate("/brand-health")}>
                  View Full Report <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>

            <article className="ccn-next-move">
              {/* Static section label, matching its sibling panels ("YOUR BRAND HOUSE").
                  The backend still sends nextMove.eyebrow; it is intentionally not used
                  as the section heading so the approved copy stays stable. */}
              <span className="ccn-panel-eyebrow"><Sparkles size={14} aria-hidden="true" /> YOUR NEXT MOVE</span>
              <h2>{derived.nextMove.title}</h2>
              <p>{derived.nextMove.body}</p>
              <div className="ccn-next-actions">
                <button type="button" className="ccn-gold-btn" onClick={() => navigate(derived.nextMove.route)}>
                  {derived.nextMove.action} <ArrowRight size={15} aria-hidden="true" />
                </button>
                <button type="button" className="ccn-ghost-btn" onClick={() => open("command-center-next-move")}>
                  Ask Zuri Why
                </button>
              </div>
            </article>

            <article className="ccn-card ccn-intelligence">
              <div className="ccn-card-heading"><div><span>Daily Intelligence</span><small>Evidence worth acting on today</small></div></div>
              {derived.intelligence.length ? (
                <div className="ccn-intel-row">
                  {/* Approved composition shows three cards; the normalization keeps
                      its own limit and only the presentation is capped here. */}
                  {derived.intelligence.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} type="button" className="ccn-intel-card" onClick={() => navigate(item.route)}>
                        <span className="ccn-intel-eyebrow">
                          <Icon size={12} aria-hidden="true" />
                          {item.label}
                        </span>
                        <p>{item.title}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ccn-intel-empty">
                  <EmptyState>Complete the diagnostic, confirm signals, or create a campaign to begin the daily intelligence feed.</EmptyState>
                </div>
              )}
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
          </div>

          <div className="ccn-col ccn-col-center">
            <section className="ccn-metrics" aria-label="Command Center summary">
              <MetricCard icon={Radar} label="Buyer Signals" value={derived.confirmedSignalCount} note={`${derived.unconfirmedSignalCount} awaiting confirmation`} tone="gold" onClick={() => navigate("/signal-inbox")} />
              <MetricCard icon={Compass} label="Open Decisions" value={derived.openDecisions} note={derived.openDecisions === null ? "Decision endpoint pending" : "Unresolved strategic decisions"} tone="purple" onClick={() => navigate("/workspace?view=decisions")} />
              <MetricCard icon={Workflow} label="Active Work" value={derived.activeWork} note={`${derived.activeCampaignCount} active campaigns`} tone="green" onClick={() => navigate("/workspace?view=work")} />
              <MetricCard icon={AlertTriangle} label="System Alerts" value={derived.systemAlerts} note={derived.systemAlerts === null ? "Alert endpoint pending" : derived.systemAlerts ? "Review workspace health" : "All systems normal"} tone="orange" onClick={() => navigate("/alerts")} />
            </section>

            <article className="ccn-card ccn-house-card">
              <span className="ccn-card-label">Your Brand House</span>
              <div className="ccn-house-body">
                <div className="ccn-level-list">
                  {houseLevelsTopDown.map((level) => (
                    <button key={level.key} type="button" onClick={() => navigate(level.route)}>
                      <span className="ccn-level-icon" aria-hidden="true"><Home size={14} /></span>
                      {/* The approved Command Center rail is architectural navigation:
                          name and descriptor only. level.value stays in state and is
                          announced on the matching hotspot; the detailed completion
                          view lives on /brand-house. */}
                      <span>
                        <strong>{level.label.toUpperCase()}</strong>
                        <small>{HOUSE_LEVEL_DESCRIPTORS[level.key] || level.rooms}</small>
                      </span>
                    </button>
                  ))}
                </div>
                <HouseVisual levels={derived.houseLevels} onOpen={navigate} />
              </div>
              <div className="ccn-house-foot">
                <small>Select a level to open that room.</small>
                <button type="button" className="ccn-outline-btn" onClick={() => navigate("/brand-house")}>
                  Explore the House <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </article>

            <article className="ccn-card ccn-progress-card">
              <div className="ccn-card-heading"><div><span>Recent Progress</span><small>Movement recorded in this workspace</small></div><button type="button" onClick={() => navigate("/workspace?view=activity")}>View activity</button></div>
              {derived.recentProgress.length ? (
                <div className="ccn-progress-row">
                  {derived.recentProgress.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} type="button" className="ccn-progress-item" onClick={() => navigate(item.route)}>
                        <span className="ccn-progress-when">
                          <Icon size={12} aria-hidden="true" />
                          {item.meta}
                        </span>
                        <strong>{item.title}</strong>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ccn-progress-empty">
                  <EmptyState>Workspace milestones will appear here as the tenant completes real work.</EmptyState>
                </div>
              )}
            </article>

            <article className="ccn-card ccn-workbench">
              <div className="ccn-card-heading"><div><span>Active Workbench</span><small>What is currently being built</small></div><button type="button" onClick={() => navigate("/workspace?view=work")}>Open workspace</button></div>
              {derived.workbench.length ? (
                <div className="ccn-workbench-row">
                  {derived.workbench.map((item) => (
                    <button key={item.id} type="button" className="ccn-work-card" onClick={() => navigate(item.route)}>
                      <span className="ccn-work-type">{item.type}</span>
                      <strong>{item.title}</strong>
                      <span className="ccn-work-status">
                        <span className="ccn-work-dot" aria-hidden="true" />
                        {item.status}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ccn-workbench-empty">
                  <EmptyState>Start a campaign, build an offer, or generate content to place work on the bench.</EmptyState>
                </div>
              )}
            </article>
          </div>

          <aside className="ccn-col ccn-col-right">
            <article className="ccn-card ccn-signals-card">
              <div className="ccn-card-heading ccn-signals-heading">
                <div>
                  <span>Brand Signals</span>
                  <small>What the market is showing you</small>
                </div>
                {signalsLive ? (
                  <span className="ccn-live-status" aria-label="Brand Signals connected to the workspace overview">
                    <span className="ccn-live-dot" aria-hidden="true" />
                    LIVE
                  </span>
                ) : null}
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
              <div className="ccn-signals-foot">
                <button type="button" className="ccn-link" onClick={() => navigate("/signal-inbox")}>
                  View All Signals <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>

            <article className="ccn-card ccn-consult-card">
              <div className="ccn-card-heading ccn-consult-heading">
                <span>Consult the House</span>
                <small>AI Brand Architect</small>
              </div>
              <div className="ccn-consult-intro">
                <div className="ccn-consult-seal">
                  <img src={SEAL_ASSET} alt="" />
                </div>
                <div>
                  <strong>I’m your AI Brand Architect.</strong>
                  <p>I help you make high-impact moves that build a brand that lasts.</p>
                </div>
              </div>
              <div className="ccn-prompt-list">
                {CONSULT_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" className="ccn-prompt" onClick={() => open("command-center-consult")}>
                    <span className="ccn-prompt-mark" aria-hidden="true" />
                    <span>{prompt}</span>
                    <ChevronRight size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
              {/* Opens the existing Ask the House panel. That panel's open(section)
                  contract takes a section id only - it has no prompt-prefill
                  parameter - so the typed question is not passed and the field is
                  left intact rather than discarded. */}
              <form className="ccn-consult-composer" onSubmit={handleConsultSubmit}>
                <label className="ccn-visually-hidden" htmlFor="ccn-consult-question">Ask a strategic question</label>
                <input
                  id="ccn-consult-question"
                  type="text"
                  value={consultQuestion}
                  onChange={(event) => setConsultQuestion(event.target.value)}
                  placeholder="Ask a strategic question..."
                  autoComplete="off"
                />
                <button type="submit" className="ccn-consult-send" aria-label="Ask the House">
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </form>
            </article>
          </aside>
        </div>

        {loading ? <div className="ccn-loading" role="status"><CircleDot size={15} aria-hidden="true" /> Updating workspace intelligence…</div> : null}
      </main>

      <AskTheHouseDrawer open={isOpen} onClose={close} surface="command_center" sectionId={sectionId} />
    </AuthShell>
  );
}
