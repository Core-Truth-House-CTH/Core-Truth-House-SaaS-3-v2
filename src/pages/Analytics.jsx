import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Globe2,
  HeartPulse,
  Menu,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Radar,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { NotificationBell } from "../components/NotificationBell";
import AskTheHouseDrawer from "../components/ask-the-house/AskTheHouseDrawer";
import { useAskTheHouse } from "../context/AskTheHouseContext";
import { usePlan } from "../context/PlanContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useClerk, useUser } from "../hooks/useAuth";
import { PLAN_ORDER } from "../config/routeConfig";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";
import "../styles/reports.css";

const REPORT_TABS = [
  { key: "overview", label: "Overview", path: "/analytics" },
  { key: "brand-health", label: "Brand Health", path: "/brand-health" },
  { key: "content", label: "Content", path: "/social-media-manager?surface=posts" },
  { key: "buyer-signals", label: "Buyer Signals", path: "/signal-inbox" },
  { key: "campaigns", label: "Campaigns", path: "/campaign-builder" },
  { key: "conversions", label: "Conversions", path: "/analytics?tab=conversions" },
  { key: "crm", label: "CRM & Revenue", path: "/crm" },
  { key: "saved", label: "Saved Reports", path: "/analytics?tab=saved" },
];

const SIGNAL_LEVELS = [
  { value: 1, label: "Recognition" },
  { value: 2, label: "Problem Ownership" },
  { value: 3, label: "Solution Curiosity" },
  { value: 4, label: "Offer Curiosity" },
  { value: 5, label: "Purchase Movement" },
];

const DONUT_COLORS = ["#af0024", "#33033c", "#6f5aa8", "#e04e35", "#c4a95b", "#2d6a4f"];

function numberFrom(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function arrayFrom(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numberFrom(value));
}

function compact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numberFrom(value));
}

function percent(value) {
  return `${Math.max(0, Math.round(numberFrom(value)))}%`;
}

function formatPlan(plan) {
  const value = String(plan || "foundation").toLowerCase();
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} Plan`;
}

function safeText(value, fallback = "Not available") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

async function safeRequest(request) {
  try {
    return await request();
  } catch (error) {
    console.error("Reports data request failed", error);
    return null;
  }
}

function MetricCard({ icon: Icon, tone, eyebrow, primary, secondary, caption, change, onClick }) {
  return (
    <button type="button" className="cth-reports-metric" onClick={onClick}>
      <span className={`cth-reports-icon cth-reports-icon--${tone}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="cth-reports-metric__body">
        <span className="cth-reports-eyebrow">{eyebrow}</span>
        <span className="cth-reports-metric__values">
          <span>
            <strong>{primary.value}</strong>
            <small>{primary.label}</small>
          </span>
          {secondary ? (
            <span>
              <strong>{secondary.value}</strong>
              <small>{secondary.label}</small>
            </span>
          ) : null}
        </span>
        {caption ? <span className="cth-reports-caption">{caption}</span> : null}
        <span className={`cth-reports-change ${change?.direction === "down" ? "is-down" : ""}`}>
          {change?.direction === "down" ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
          {change?.label || "Current period"}
        </span>
      </span>
    </button>
  );
}

function ReportHeader({ dateRange, setDateRange, comparison, setComparison, channel, setChannel, onExport, onCreate }) {
  return (
    <div className="cth-reports-heading-row">
      <div>
        <h1>REPORTS</h1>
        <p>See what is creating movement and where the House recommends focus.</p>
      </div>
      <div className="cth-reports-filters">
        <label>
          <CalendarDays size={15} />
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <label>
          <ArrowRight size={15} />
          <select value={comparison} onChange={(event) => setComparison(event.target.value)}>
            <option value="previous-period">Compare: Previous Period</option>
            <option value="previous-month">Compare: Previous Month</option>
            <option value="none">No Comparison</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <label>
          <Globe2 size={15} />
          <select value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="all">All Channels</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <button type="button" className="cth-reports-button cth-reports-button--ghost" onClick={onExport}>
          <Upload size={15} /> Export
        </button>
        <button type="button" className="cth-reports-button cth-reports-button--primary" onClick={onCreate}>
          Create Saved Report <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

function ReportTopBar({ searchValue, setSearchValue }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { plan } = usePlan();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { label: "Command Center", path: "/command-center" },
    { label: "Workspace", path: "/workspace-library" },
    { label: "Reports", path: "/analytics" },
    { label: "Signal OS", path: "/signal-inbox" },
    { label: "Knowledge Base", path: "/knowledge-base" },
  ];

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (query) navigate(`/knowledge-base?q=${encodeURIComponent(query)}`);
  };

  const displayName = user?.fullName || user?.firstName || "Workspace Owner";
  const avatar = user?.imageUrl || user?.profileImageUrl || "";

  return (
    <header className="cth-reports-topbar">
      <div className="cth-reports-brand" onClick={() => navigate("/command-center")} role="button" tabIndex={0}>
        <img src="/cth-logo.png" alt="Core Truth House" />
        <span>CORE TRUTH HOUSE</span>
      </div>

      <nav className={`cth-reports-nav ${mobileOpen ? "is-open" : ""}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? "is-active" : ""}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="cth-reports-topbar__actions">
        <form className="cth-reports-search" onSubmit={submitSearch}>
          <Search size={15} />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search the House..."
            aria-label="Search the House"
          />
          <button type="submit" aria-label="Submit search"><Search size={16} /></button>
        </form>
        <NotificationBell />
        <div className="cth-reports-profile-wrap">
          <button type="button" className="cth-reports-profile" onClick={() => setProfileOpen((open) => !open)}>
            {avatar ? <img src={avatar} alt="" /> : <span><UserRound size={18} /></span>}
            <span>
              <strong>{displayName}</strong>
              <small>{formatPlan(plan)}</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {profileOpen ? (
            <div className="cth-reports-profile-menu">
              <button type="button" onClick={() => navigate("/settings")}>Workspace Settings</button>
              <button type="button" onClick={() => navigate("/billing")}>Plan & Billing</button>
              <button type="button" onClick={() => signOut({ redirectUrl: "/" })}>Sign Out</button>
            </div>
          ) : null}
        </div>
        <button type="button" className="cth-reports-mobile-toggle" onClick={() => setMobileOpen((open) => !open)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}

function HouseIntelligence({ houseData, onOpen }) {
  return (
    <section className="cth-reports-card cth-reports-house-card">
      <div className="cth-reports-card-title">HOUSE INTELLIGENCE <span title="Workspace-scoped Brand House progress">ⓘ</span></div>
      <div className="cth-reports-house-list">
        {houseData.map((item) => (
          <button type="button" key={item.label} onClick={() => onOpen(item.path)} className="cth-reports-house-row">
            <span className="cth-reports-house-row__heading">
              <strong>{item.label}</strong>
              <em style={{ color: item.color }}>{percent(item.value)}</em>
            </span>
            <span className="cth-reports-progress"><i style={{ width: percent(item.value), background: item.color }} /></span>
            <span className="cth-reports-house-meta">
              <span><small>Strongest Room</small>{item.strongest}</span>
              <span><small>Needs Attention</small>{item.needs}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="cth-reports-link-button" onClick={() => onOpen("/brand-foundation")}>
        Go to Your Brand House <ArrowRight size={14} />
      </button>
    </section>
  );
}

function PerformanceStory({ series, onDetails }) {
  const hasData = series.length > 0;
  return (
    <section className="cth-reports-card cth-reports-performance-card">
      <div className="cth-reports-card-title-row">
        <div className="cth-reports-card-title">PERFORMANCE STORY</div>
        <div className="cth-reports-legend">
          <span><i style={{ background: "#af0024" }} /> Brand Health</span>
          <span><i style={{ background: "#dc9411" }} /> Buyer Signals</span>
          <span><i style={{ background: "#6f5aa8" }} /> Content Published</span>
          <span><i style={{ background: "#2d8b57" }} /> Conversions</span>
          <span>+2 More <ChevronDown size={12} /></span>
        </div>
      </div>
      <div className="cth-reports-performance-layout">
        <div className="cth-reports-chart-wrap">
          {hasData ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#eadfde" strokeDasharray="2 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7c6576" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#7c6576" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d8c5c3", fontSize: 11 }} />
                <Line type="monotone" dataKey="brandHealth" name="Brand Health" stroke="#af0024" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="buyerSignals" name="Buyer Signals" stroke="#dc9411" strokeWidth={1.8} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="contentPublished" name="Content Published" stroke="#6f5aa8" strokeWidth={1.8} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#2d8b57" strokeWidth={1.8} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="campaignActivity" name="Campaign Activity" stroke="#4d7ca8" strokeWidth={1.4} strokeDasharray="4 3" dot={{ r: 1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="cth-reports-empty-chart">Run a Brand Audit and confirm buyer signals to populate the performance story.</div>
          )}
        </div>
        <div className="cth-reports-key-insight">
          <span>KEY INSIGHT</span>
          <p>Brand movement is connected to the work recorded inside this workspace. Open the full report to review the exact source activity.</p>
          <button type="button" onClick={onDetails}>View Full Report</button>
        </div>
      </div>
    </section>
  );
}

function ZuriSummary({ summary, onBuild, onAsk }) {
  return (
    <section className="cth-reports-zuri">
      <div className="cth-reports-zuri__title">
        <span>ZURI’S REPORT SUMMARY</span>
        <Sparkles size={16} />
      </div>
      <div className="cth-reports-zuri__item">
        <Sparkles size={17} />
        <span><strong>What Changed</strong><p>{summary.changed}</p></span>
      </div>
      <div className="cth-reports-zuri__item">
        <Radar size={17} />
        <span><strong>Why It Matters</strong><p>{summary.matters}</p></span>
      </div>
      <div className="cth-reports-zuri__item">
        <Target size={17} />
        <span><strong>Recommended Response</strong><p>{summary.response}</p></span>
      </div>
      <div className="cth-reports-zuri__actions">
        <button type="button" onClick={onBuild}>Build This Campaign</button>
        <button type="button" onClick={onAsk}>Ask Zuri About This Report</button>
      </div>
    </section>
  );
}

function ContentPerformance({ breakdown }) {
  const normalized = breakdown.map((item, index) => ({
    name: safeText(item.type || item.name || item.platform, `Channel ${index + 1}`),
    value: numberFrom(item.count, item.value, item.total),
  })).filter((item) => item.value > 0);
  const total = normalized.reduce((sum, item) => sum + item.value, 0);
  const topShare = total > 0 ? Math.round((normalized[0]?.value || 0) / total * 100) : 0;
  return (
    <section className="cth-reports-card cth-reports-small-card">
      <div className="cth-reports-card-title">CONTENT &amp; CHANNEL PERFORMANCE</div>
      <div className="cth-reports-donut-layout">
        <div className="cth-reports-donut">
          {normalized.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={normalized} dataKey="value" nameKey="name" innerRadius={48} outerRadius={66} paddingAngle={1}>
                  {normalized.map((_, index) => <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="cth-reports-donut-empty" />}
          <span><strong>{topShare}%</strong><small>Total Share</small></span>
        </div>
        <div className="cth-reports-breakdown-list">
          {(normalized.length ? normalized : [{ name: "No content yet", value: 0 }]).slice(0, 4).map((item, index) => (
            <div key={item.name}><i style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} /><span>{item.name}</span><strong>{total ? Math.round(item.value / total * 100) : 0}%</strong></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuyerMovement({ counts, total }) {
  return (
    <section className="cth-reports-card cth-reports-small-card">
      <div className="cth-reports-card-title">BUYER SIGNAL MOVEMENT</div>
      <div className="cth-reports-funnel-layout">
        <div className="cth-reports-funnel">
          {counts.map((item, index) => (
            <div key={item.label} style={{ width: `${100 - index * 14}%`, background: `rgba(220,148,17,${0.95 - index * 0.14})` }} />
          ))}
        </div>
        <div className="cth-reports-funnel-labels">
          {counts.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>)}
        </div>
      </div>
      <div className="cth-reports-total-line"><strong>{total}</strong> Confirmed Signals</div>
    </section>
  );
}

function CampaignPerformance({ activeCampaigns, readiness, reach, clickRate, conversions, costPerResult, onOpen }) {
  return (
    <button type="button" className="cth-reports-card cth-reports-small-card cth-reports-card-button" onClick={onOpen}>
      <div className="cth-reports-card-title">CAMPAIGN PERFORMANCE</div>
      <div className="cth-reports-campaign-layout">
        <div className="cth-reports-campaign-count"><small>Active Campaigns</small><strong>{activeCampaigns}</strong></div>
        <div className="cth-reports-score-ring" style={{ "--score": `${Math.min(100, readiness) * 3.6}deg` }}>
          <span><strong>{percent(readiness)}</strong><small>Avg Goal Progress</small></span>
        </div>
        <div className="cth-reports-campaign-stats">
          <div><span>Reach</span><strong>{compact(reach)}</strong></div>
          <div><span>Click Rate</span><strong>{numberFrom(clickRate).toFixed(1)}%</strong></div>
          <div><span>Conversions</span><strong>{conversions}</strong></div>
          <div><span>Cost per Result</span><strong>{money(costPerResult)}</strong></div>
        </div>
      </div>
    </button>
  );
}

function ConversionPaths({ visits, applications, opportunities, pipelineValue, onOpen }) {
  const steps = [
    { icon: Target, label: "Social Post" },
    { icon: BookOpen, label: "Article" },
    { icon: FileText, label: "Offer Page" },
    { icon: FileText, label: "Application" },
    { icon: CircleDollarSign, label: "Opportunity" },
  ];
  return (
    <section className="cth-reports-card cth-reports-small-card">
      <div className="cth-reports-card-title">CONVERSION PATHS</div>
      <small className="cth-reports-subtle">Top Performing Path</small>
      <div className="cth-reports-path-icons">
        {steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <span><step.icon size={17} /><small>{step.label}</small></span>
            {index < steps.length - 1 ? <ArrowRight size={14} /> : null}
          </React.Fragment>
        ))}
      </div>
      <div className="cth-reports-path-stats">
        <span><strong>{compact(visits)}</strong><small>Visits</small></span>
        <span><strong>{compact(applications)}</strong><small>Applications</small></span>
        <span><strong>{compact(opportunities)}</strong><small>Opportunities</small></span>
        <span><strong>{money(pipelineValue)}</strong><small>Pipeline Value</small></span>
      </div>
      <button type="button" className="cth-reports-text-link" onClick={onOpen}>View All Conversion Paths <ArrowRight size={13} /></button>
    </section>
  );
}

function BottomMetricStrip({ title, metrics }) {
  return (
    <section className="cth-reports-card cth-reports-bottom-strip">
      <div className="cth-reports-card-title">{title}</div>
      <div className="cth-reports-bottom-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button type="button" key={metric.label} onClick={metric.onClick}>
              <Icon size={22} />
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
              <em className={metric.direction === "down" ? "is-down" : ""}>{metric.change}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SavedReports({ onOpen, onCreate, onExport }) {
  const rows = [
    { title: "Monthly Brand Performance", subtitle: "Live workspace report" },
    { title: "Campaign Retrospective · Brand OS", subtitle: "Campaign report template" },
  ];
  return (
    <section className="cth-reports-card cth-reports-saved" id="saved-reports">
      <div className="cth-reports-card-title">SAVED REPORTS</div>
      <div className="cth-reports-saved-list">
        {rows.map((row) => (
          <div key={row.title}>
            <FileText size={16} />
            <span><strong>{row.title}</strong><small>{row.subtitle}</small></span>
            <button type="button" onClick={onOpen} aria-label={`Open ${row.title}`}><Play size={14} /></button>
            <button type="button" onClick={onCreate} aria-label={`Edit ${row.title}`}><Pencil size={14} /></button>
            <button type="button" onClick={onExport} aria-label={`Export ${row.title}`}><MoreVertical size={15} /></button>
          </div>
        ))}
      </div>
      <button type="button" className="cth-reports-text-link" onClick={onOpen}>View All Saved Reports <ArrowRight size={13} /></button>
    </section>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeWorkspaceId } = useWorkspace();
  const { plan } = usePlan();
  const { isOpen, open, close, sectionId } = useAskTheHouse();

  const [dateRange, setDateRange] = useState("30d");
  const [comparison, setComparison] = useState("previous-period");
  const [channel, setChannel] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({});

  const normalizedPlan = String(plan || "free").toLowerCase();
  const planIndex = PLAN_ORDER.indexOf(normalizedPlan);
  const isHousePlus = planIndex >= PLAN_ORDER.indexOf("house");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const requests = [
      safeRequest(() => apiClient.get(API_PATHS.analytics.overview)),
      safeRequest(() => apiClient.get(API_PATHS.analytics.brandProgress)),
      safeRequest(() => apiClient.get(API_PATHS.analytics.aiUsage)),
      safeRequest(() => apiClient.get(API_PATHS.analytics.contentBreakdown)),
      safeRequest(() => apiClient.get(API_PATHS.analytics.mediaBreakdown)),
      safeRequest(() => apiClient.get(API_PATHS.analytics.brandMemory)),
      safeRequest(() => apiClient.get(API_PATHS.buyerSignals.list({ status: "confirmed" }))),
      safeRequest(() => apiClient.get(API_PATHS.buyerSignals.attribution)),
      safeRequest(() => apiClient.get(API_PATHS.campaigns.list)),
      safeRequest(() => apiClient.get(API_PATHS.trackingLinks.dashboard)),
      safeRequest(() => apiClient.get(API_PATHS.crm.dashboard)),
      safeRequest(() => apiClient.get(API_PATHS.usage.summary)),
      activeWorkspaceId ? safeRequest(() => apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId))) : Promise.resolve(null),
    ];

    try {
      const [overview, brandProgress, aiUsage, contentBreakdown, mediaBreakdown, brandMemory, signals, attribution, campaigns, tracking, crm, usage, workspaceStats] = await Promise.all(requests);
      setData({ overview, brandProgress, aiUsage, contentBreakdown, mediaBreakdown, brandMemory, signals, attribution, campaigns, tracking, crm, usage, workspaceStats });
    } catch (requestError) {
      console.error("Failed to assemble reports", requestError);
      setError("Some report data could not be loaded. The available workspace data is shown below.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, dateRange, comparison, channel]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const derived = useMemo(() => {
    const overview = data.overview || {};
    const summary = overview.summary || {};
    const progress = arrayFrom(data.brandProgress, ["progress"]);
    const latest = progress[progress.length - 1] || {};
    const aiUsage = arrayFrom(data.aiUsage, ["usage"]);
    const contentBreakdown = arrayFrom(data.contentBreakdown, ["breakdown"]);
    const signals = arrayFrom(data.signals, ["signals"]).filter((signal) => String(signal?.status || "confirmed").toLowerCase() === "confirmed");
    const campaigns = arrayFrom(data.campaigns, ["campaigns", "items", "results"]);
    const activeCampaigns = campaigns.filter((campaign) => !["complete", "completed", "archived", "cancelled"].includes(String(campaign?.status || "active").toLowerCase()));
    const tracking = data.tracking || {};
    const crm = data.crm || {};
    const usage = data.usage || {};
    const workspaceStats = data.workspaceStats || {};
    const brandMemory = data.brandMemory || {};

    const confirmedSignals = signals.length;
    const purchaseMovement = signals.filter((signal) => numberFrom(signal.confirmed_level, signal.level, signal.suggested_level) === 5).length;
    const signalCounts = SIGNAL_LEVELS.map((level) => ({
      ...level,
      count: signals.filter((signal) => numberFrom(signal.confirmed_level, signal.level, signal.suggested_level) === level.value).length,
    }));

    const brandHealth = numberFrom(summary.brand_audit_score, latest.overall, brandMemory.memory_score);
    const contentPublished = numberFrom(workspaceStats.social_posts, summary.total_content);
    const aboveBaseline = numberFrom(workspaceStats.above_baseline_content, overview.above_baseline_content);
    const trackedActions = numberFrom(tracking.total_clicks, tracking.clicks, tracking.total_events, crm.total_activities);
    const qualifiedMovements = numberFrom(tracking.total_conversions, tracking.conversions, crm.qualified_leads, crm.open_opportunities);

    const signalByDate = new Map();
    signals.forEach((signal) => {
      const date = String(signal.created_at || signal.createdAt || "").slice(0, 10);
      if (date) signalByDate.set(date, (signalByDate.get(date) || 0) + 1);
    });
    let runningSignals = 0;
    const performanceSeries = progress.map((point) => {
      const dateKey = String(point.date || point.created_at || "").slice(0, 10);
      runningSignals += signalByDate.get(dateKey) || 0;
      return {
        date: dateKey ? dateKey.slice(5) : "",
        brandHealth: numberFrom(point.overall, point.brand_health, brandHealth),
        buyerSignals: runningSignals,
        contentPublished: numberFrom(point.content, contentPublished),
        conversions: numberFrom(point.launch, qualifiedMovements),
        campaignActivity: numberFrom(point.systems, activeCampaigns.length),
      };
    });

    const roomGroups = [
      {
        label: "FOUNDATION",
        path: "/brand-foundation",
        color: "#2d8b57",
        rooms: [
          { label: "Brand Foundation", value: numberFrom(latest.foundation, summary.foundation_completion) },
          { label: "Brand Identity", value: numberFrom(latest.identity, brandMemory.memory_score) },
        ],
      },
      {
        label: "STRUCTURE",
        path: "/systems-builder",
        color: "#dc9411",
        rooms: [
          { label: "Offer Architecture", value: numberFrom(latest.offers, workspaceStats.offers_completion) },
          { label: "Messaging Structure", value: numberFrom(workspaceStats.messaging_completion, latest.foundation) },
          { label: "Brand Systems", value: numberFrom(latest.systems, workspaceStats.systems_completion) },
        ],
      },
      {
        label: "HOUSE",
        path: "/campaign-builder",
        color: "#f15a24",
        rooms: [
          { label: "Content System", value: numberFrom(latest.content, workspaceStats.content_completion) },
          { label: "Campaign System", value: numberFrom(workspaceStats.campaign_completion) },
          { label: "Launch Readiness", value: numberFrom(latest.launch, workspaceStats.launch_readiness) },
        ],
      },
      {
        label: "ESTATE",
        path: "/workspace-library",
        color: "#7655a8",
        rooms: [
          { label: "Publishing System", value: numberFrom(workspaceStats.publishing_completion) },
          { label: "CRM Consistency", value: numberFrom(workspaceStats.crm_completion, crm.pipeline_health) },
          { label: "Workspace Usage", value: numberFrom(usage.percentage, latest.overall) },
        ],
      },
    ].map((group) => {
      const ordered = [...group.rooms].sort((a, b) => b.value - a.value);
      const value = group.rooms.length ? group.rooms.reduce((sum, room) => sum + room.value, 0) / group.rooms.length : 0;
      return { ...group, value, strongest: ordered[0]?.label || "No data yet", needs: ordered[ordered.length - 1]?.label || "No data yet" };
    });

    const visits = numberFrom(tracking.total_clicks, tracking.clicks, tracking.visits);
    const applications = numberFrom(tracking.applications, crm.new_leads, crm.qualified_leads);
    const opportunities = numberFrom(crm.open_opportunities, crm.deals_open, qualifiedMovements);
    const pipelineValue = numberFrom(crm.pipeline_value, crm.total_pipeline_value, crm.weighted_pipeline);
    const reach = numberFrom(tracking.reach, tracking.total_visits, visits);
    const clickRate = reach > 0 ? (visits / reach) * 100 : numberFrom(tracking.click_rate);
    const conversions = numberFrom(tracking.total_conversions, tracking.conversions, qualifiedMovements);
    const costPerResult = numberFrom(tracking.cost_per_result, tracking.cpr);

    const summaryText = {
      changed: purchaseMovement > 0
        ? `${purchaseMovement} buyer signal${purchaseMovement === 1 ? " reached" : "s reached"} Purchase Movement during this reporting period.`
        : confirmedSignals > 0
          ? `${confirmedSignals} buyer signal${confirmedSignals === 1 ? " was" : "s were"} confirmed in this workspace.`
          : brandHealth > 0
            ? `Brand Health is currently ${Math.round(brandHealth)} and the House is tracking the work connected to that score.`
            : "The House is ready to build your first evidence-based performance story.",
      matters: confirmedSignals > 0
        ? "Confirmed signals show where audience attention is becoming measurable buyer movement."
        : "Connected content, campaigns, and tracking links give the House enough evidence to identify what is working.",
      response: confirmedSignals > 0
        ? "Open the strongest attributed signal, review the message that created it, and build the next campaign from that evidence."
        : "Connect a tracking link, publish one aligned campaign, and confirm incoming signals before changing the core message.",
    };

    const creditsUsed = numberFrom(usage.used, usage.usage_used, usage.credits_used, summary.ai_generations_this_month);
    const creditsLimit = numberFrom(usage.limit, usage.usage_limit, usage.credits_limit);

    return {
      summary,
      brandHealth,
      confirmedSignals,
      purchaseMovement,
      contentPublished,
      aboveBaseline,
      trackedActions,
      qualifiedMovements,
      signalCounts,
      performanceSeries,
      roomGroups,
      contentBreakdown,
      activeCampaigns: activeCampaigns.length,
      readiness: numberFrom(latest.launch, workspaceStats.launch_readiness),
      reach,
      clickRate,
      conversions,
      costPerResult,
      visits,
      applications,
      opportunities,
      pipelineValue,
      newContacts: numberFrom(crm.new_contacts, crm.contacts_new, workspaceStats.contacts_count),
      openOpportunities: opportunities,
      wonValue: numberFrom(crm.won_value, crm.closed_won_value),
      salesCycle: numberFrom(crm.average_sales_cycle_days, crm.avg_sales_cycle_days),
      creditsUsed,
      creditsLimit,
      contentGenerated: numberFrom(workspaceStats.content_generated, brandMemory.utilization?.content_generated, summary.total_content),
      mediaCreated: numberFrom(workspaceStats.total_media, summary.total_media),
      brandMemoryQueries: numberFrom(brandMemory.utilization?.queries, brandMemory.utilization?.ai_generations_this_month, summary.ai_generations_this_month),
      activeMembers: numberFrom(workspaceStats.active_members, workspaceStats.members_count),
      summaryText,
      aiUsage,
    };
  }, [data]);

  const exportReport = useCallback(async () => {
    const report = await safeRequest(() => apiClient.get(API_PATHS.analytics.report({ range: dateRange, comparison, channel })));
    const payload = report || { generated_at: new Date().toISOString(), workspace_id: activeWorkspaceId, filters: { dateRange, comparison, channel }, summary: derived };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `core-truth-house-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [activeWorkspaceId, channel, comparison, dateRange, derived]);

  const activeTab = searchParams.get("tab") || "overview";
  const handleTab = (tab) => {
    if (tab.key === "overview") {
      setSearchParams({});
      return;
    }
    if (tab.path.startsWith("/analytics?")) {
      setSearchParams({ tab: tab.key });
      return;
    }
    navigate(tab.path);
  };

  const crmMetrics = [
    { label: "New Contacts", value: compact(derived.newContacts), change: "Current period", icon: Users, onClick: () => navigate("/crm") },
    { label: "Open Opportunities", value: compact(derived.openOpportunities), change: "Active pipeline", icon: Target, onClick: () => navigate("/crm") },
    { label: "Pipeline Value", value: money(derived.pipelineValue), change: "Workspace scoped", icon: BarChart3, onClick: () => navigate("/crm") },
    { label: "Won Value", value: money(derived.wonValue), change: "Closed won", icon: CircleDollarSign, onClick: () => navigate("/crm") },
    { label: "Avg Sales Cycle", value: `${Math.round(derived.salesCycle)} days`, change: "Current average", icon: Activity, onClick: () => navigate("/crm") },
  ];

  const usageMetrics = [
    { label: "AI Credits Used", value: `${compact(derived.creditsUsed)} / ${compact(derived.creditsLimit)}`, change: percent(derived.creditsLimit ? derived.creditsUsed / derived.creditsLimit * 100 : 0), icon: Sparkles, onClick: () => navigate("/billing") },
    { label: "Content Generated", value: compact(derived.contentGenerated), change: "Workspace total", icon: FileText, onClick: () => navigate("/content-studio") },
    { label: "Media Created", value: compact(derived.mediaCreated), change: "Workspace total", icon: Upload, onClick: () => navigate("/workspace-library") },
    { label: "Brand Memory", value: compact(derived.brandMemoryQueries), change: "Queries", icon: Radar, onClick: () => navigate("/brand-memory") },
    { label: "Active Members", value: compact(derived.activeMembers), change: "Current workspace", icon: Users, onClick: () => navigate("/members") },
  ];

  return (
    <div className="cth-reports-page">
      <ReportTopBar searchValue={searchValue} setSearchValue={setSearchValue} />
      <main className="cth-reports-main">
        <ReportHeader
          dateRange={dateRange}
          setDateRange={setDateRange}
          comparison={comparison}
          setComparison={setComparison}
          channel={channel}
          setChannel={setChannel}
          onExport={exportReport}
          onCreate={() => navigate("/workspace-library?view=saved-reports&create=1")}
        />

        <div className="cth-reports-tabs" role="tablist">
          {REPORT_TABS.map((tab) => (
            <button type="button" key={tab.key} className={activeTab === tab.key ? "is-active" : ""} onClick={() => handleTab(tab)}>
              {tab.label}
            </button>
          ))}
        </div>

        {error ? <div className="cth-reports-error">{error}</div> : null}
        {loading ? <div className="cth-reports-loading">Loading workspace reports…</div> : null}

        <div className="cth-reports-dashboard" aria-busy={loading}>
          <div className="cth-reports-metrics-grid">
            <MetricCard
              icon={HeartPulse}
              tone="rose"
              eyebrow="BRAND HEALTH SCORE"
              primary={{ value: Math.round(derived.brandHealth), label: "Current Score" }}
              caption="Workspace Brand Health"
              change={{ label: "View score details" }}
              onClick={() => navigate("/brand-health")}
            />
            <MetricCard
              icon={Users}
              tone="gold"
              eyebrow="BUYER MOVEMENT"
              primary={{ value: derived.confirmedSignals, label: "Confirmed Signals" }}
              secondary={{ value: derived.purchaseMovement, label: "Purchase Movement" }}
              change={{ label: "Open Signal Inbox" }}
              onClick={() => navigate("/signal-inbox")}
            />
            <MetricCard
              icon={FileText}
              tone="purple"
              eyebrow="CONTENT MOMENTUM"
              primary={{ value: derived.contentPublished, label: "Published Assets" }}
              secondary={{ value: derived.aboveBaseline, label: "Above Baseline" }}
              change={{ label: "Open Social Planner" }}
              onClick={() => navigate("/social-media-manager?surface=posts")}
            />
            <MetricCard
              icon={Target}
              tone="green"
              eyebrow="CONVERSION ACTIVITY"
              primary={{ value: derived.trackedActions, label: "Tracked Actions" }}
              secondary={{ value: derived.qualifiedMovements, label: "Qualified Movements" }}
              change={{ label: "View conversion paths" }}
              onClick={() => setSearchParams({ tab: "conversions" })}
            />
          </div>

          <HouseIntelligence houseData={derived.roomGroups} onOpen={navigate} />
          <PerformanceStory series={derived.performanceSeries} onDetails={() => navigate("/brand-health")} />
          <ZuriSummary summary={derived.summaryText} onBuild={() => navigate("/campaign-builder")} onAsk={() => open("reports-summary")} />

          <div className="cth-reports-middle-grid">
            <ContentPerformance breakdown={derived.contentBreakdown} />
            <BuyerMovement counts={derived.signalCounts} total={derived.confirmedSignals} />
            <CampaignPerformance
              activeCampaigns={derived.activeCampaigns}
              readiness={derived.readiness}
              reach={derived.reach}
              clickRate={derived.clickRate}
              conversions={derived.conversions}
              costPerResult={derived.costPerResult}
              onOpen={() => navigate("/campaign-builder")}
            />
            <ConversionPaths
              visits={derived.visits}
              applications={derived.applications}
              opportunities={derived.opportunities}
              pipelineValue={derived.pipelineValue}
              onOpen={() => setSearchParams({ tab: "conversions" })}
            />
          </div>

          <div className="cth-reports-bottom-grid">
            {isHousePlus ? (
              <BottomMetricStrip title="CRM & REVENUE" metrics={crmMetrics} />
            ) : (
              <section className="cth-reports-card cth-reports-locked-card">
                <div className="cth-reports-card-title">CRM &amp; REVENUE</div>
                <p>Available on The House plan and above.</p>
                <button type="button" onClick={() => navigate("/billing")}>View Plan Options</button>
              </section>
            )}
            <BottomMetricStrip title="AI & WORKSPACE USAGE" metrics={usageMetrics} />
            <SavedReports onOpen={() => navigate("/workspace-library?view=saved-reports")} onCreate={() => navigate("/workspace-library?view=saved-reports&create=1")} onExport={exportReport} />
          </div>
        </div>
      </main>

      <AskTheHouseDrawer open={isOpen} onClose={close} surface="command_center" sectionId={sectionId} />
    </div>
  );
}
