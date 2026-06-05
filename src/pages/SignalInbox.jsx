import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Link2,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Radar,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import { toast } from "sonner";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const PAGE_STYLE = { background: "var(--cth-command-blush)", minHeight: "100vh" };

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 12,
};

// Fallbacks mirror backend buyer_signals.py — used until /meta resolves.
const LEVELS_FALLBACK = [
  { value: 1, label: "Recognition" },
  { value: 2, label: "Problem Ownership" },
  { value: 3, label: "Solution Curiosity" },
  { value: 4, label: "Offer Curiosity" },
  { value: 5, label: "Purchase Movement" },
];

const ENTITY_TYPES_FALLBACK = [
  "contact",
  "offer",
  "content",
  "campaign",
  "diagnostic",
  "relationship",
  "message",
];

// Level intensity ramp — cool/muted at recognition, warm/committed at purchase.
// Existing --cth-command-* tokens only (no per-level custom hex).
const LEVEL_COLOR = {
  1: "var(--cth-command-muted)",
  2: "var(--cth-command-ink)",
  3: "var(--cth-command-gold)",
  4: "var(--cth-command-crimson)",
  5: "var(--cth-command-purple)",
};

// Tracking-link editor option lists (match backend enums).
const SIGNAL_LEVELS = [
  { value: 1, label: "1 · Recognition" },
  { value: 2, label: "2 · Problem Ownership" },
  { value: 3, label: "3 · Solution Curiosity" },
  { value: 4, label: "4 · Offer Curiosity" },
  { value: 5, label: "5 · Purchase Movement" },
];

const SOURCE_PLATFORMS = [
  "Instagram", "LinkedIn", "TikTok", "YouTube", "Email", "Podcast",
  "X / Twitter", "Facebook", "Threads", "Website", "Other",
];

const CTA_TYPES = [
  "Book a call", "Join waitlist", "View pricing", "Download diagnostic",
  "Start checkout", "Read content", "Watch video", "Other",
];

// Must match backend CONVERSION_EVENT_TYPES exactly (mail.py).
const EVENT_TYPES = [
  "Booked call", "Joined waitlist", "Clicked pricing",
  "Downloaded diagnostic", "Started checkout", "Purchased",
];

const EMPTY_FORM = {
  link_name: "",
  target_url: "",
  source_platform: "",
  campaign_id: "",
  offer_id: "",
  signal_level: "",
  cta_type: "",
  notes: "",
  is_active: true,
};

// Page is Foundation+. Free/audit get the full LockedView.
const PAGE_LOCKED_PLANS = new Set(["free", "audit"]);
// Structure+ tabs lock for Foundation and below.
const STRUCTURE_LOCKED_PLANS = new Set(["free", "audit", "foundation"]);

const TABS = [
  { id: "new", label: "New Signals", tier: "foundation" },
  { id: "levels", label: "Signal Levels", tier: "foundation" },
  { id: "links", label: "Tracking Links", tier: "structure" },
  { id: "sources", label: "Source Activity", tier: "structure" },
  { id: "conversions", label: "Conversion Events", tier: "structure" },
  { id: "recommended", label: "Recommended Action", tier: "foundation" },
];

function sourceLabel(value) {
  const raw = String(value || "").replace(/_/g, " ");
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function LevelBadge({ level, levels }) {
  const meta = levels.find((l) => l.value === level);
  const color = LEVEL_COLOR[level] || "var(--cth-command-muted)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{
        background: "var(--cth-command-panel-soft)",
        border: `1px solid ${color}`,
        color,
        fontFamily: SANS,
      }}
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
        style={{ background: color, color: "var(--cth-command-panel)" }}
      >
        {level}
      </span>
      {meta?.label || `Level ${level}`}
    </span>
  );
}

function DashboardCard({ label, value, sub, accent }) {
  const isLong = typeof value === "string" && value.length > 11;
  return (
    <div style={{ ...CARD_STYLE, borderRadius: 10, padding: "11px 13px", minHeight: 78, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
      <div style={{ fontFamily: SANS, fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 600, marginBottom: 5 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: isLong ? 13 : 18,
          fontWeight: 600,
          color: accent ? "var(--cth-command-crimson)" : "var(--cth-command-ink)",
          lineHeight: 1.2,
        }}
      >
        {value ?? "—"}
      </div>
      {sub ? (
        <div style={{ fontFamily: SANS, fontSize: 9, color: "var(--cth-command-muted)", marginTop: 3 }}>{sub}</div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-page locked view (free / audit) — matches CustomerJourney pattern,
// using --cth-command-* tokens.
// ---------------------------------------------------------------------------

function LockedView() {
  return (
    <DashboardLayout>
      <header className="cth-page-header" style={{ background: "var(--cth-command-panel)", borderBottom: "0.5px solid var(--cth-command-border)" }}>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-[32px] leading-tight truncate" style={{ fontFamily: SERIF, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
            Signal Inbox
          </h1>
          <p className="text-xs md:text-sm truncate" style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: SANS }}>
            Track, confirm, and act on every sign of buying intent.
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto" style={PAGE_STYLE}>
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
          <div style={{ ...CARD_STYLE, padding: 40, textAlign: "center" }}>
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center"
              style={{ borderRadius: 10, background: "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)", color: "var(--cth-command-crimson)" }}
            >
              <Lock size={22} />
            </div>
            <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cth-command-muted)", margin: "18px 0 0" }}>
              Foundation Plan Required
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: "var(--cth-command-ink)", margin: "8px 0 0", lineHeight: 1.2 }}>
              Signal Inbox
            </h2>
            <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.65, color: "var(--cth-command-muted)", margin: "14px auto 24px", maxWidth: 520 }}>
              Track, confirm, and act on every sign of buying intent — buyer signals, tracking
              links, source attribution, and your next best move. Available on The Foundation plan and above.
            </p>
            <a
              href="/billing"
              className="inline-flex items-center gap-2"
              style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, padding: "12px 22px", fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer", textDecoration: "none" }}
            >
              Upgrade to Foundation
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Inline locked card for Structure+ tabs viewed by Foundation users.
function LockedTabCard({ tabLabel }) {
  return (
    <div style={{ ...CARD_STYLE, padding: 36, textAlign: "center" }}>
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center"
        style={{ borderRadius: 10, background: "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)", color: "var(--cth-command-crimson)" }}
      >
        <Lock size={20} />
      </div>
      <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cth-command-muted)", margin: "16px 0 0" }}>
        Structure Plan Required
      </p>
      <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: "var(--cth-command-ink)", margin: "6px 0 0", lineHeight: 1.2 }}>
        {tabLabel}
      </h3>
      <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.6, color: "var(--cth-command-muted)", margin: "12px auto 20px", maxWidth: 460 }}>
        {tabLabel} unlocks on The Structure plan and above — full tracking links, source
        attribution, and conversion events for every signal.
      </p>
      <a
        href="/billing"
        className="inline-flex items-center gap-2"
        style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", border: "none", borderRadius: 8, padding: "10px 18px", fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer", textDecoration: "none" }}
      >
        Upgrade to Structure
        <ChevronRight size={13} />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SignalInbox() {
  const { plan, isSuperAdmin } = usePlan();
  const normalizedPlan = String(plan || "free").toLowerCase();
  const pageLocked = !isSuperAdmin && PAGE_LOCKED_PLANS.has(normalizedPlan);
  const structureLocked = !isSuperAdmin && STRUCTURE_LOCKED_PLANS.has(normalizedPlan);

  const [activeTab, setActiveTab] = useState("new");

  // Meta + inbox (New Signals)
  const [levels, setLevels] = useState(LEVELS_FALLBACK);
  const [sources, setSources] = useState([]);
  const [entityTypes, setEntityTypes] = useState(ENTITY_TYPES_FALLBACK);

  const [signals, setSignals] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [error, setError] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [busyId, setBusyId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  // Aux data (levels / tracking / attribution)
  const [confirmedSignals, setConfirmedSignals] = useState([]);
  const [attribution, setAttribution] = useState([]);
  const [links, setLinks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [offers, setOffers] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  // Tracking-link editor + conversions
  const [isSaving, setIsSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [conversionsByLink, setConversionsByLink] = useState({});
  const [convLoadingId, setConvLoadingId] = useState(null);
  const [tagForm, setTagForm] = useState({ event_type: "", note: "" });
  const [isTagging, setIsTagging] = useState(false);

  // Conversion Events (aggregate)
  const [allConversions, setAllConversions] = useState([]);
  const [convAllLoading, setConvAllLoading] = useState(false);
  const [convAllLoaded, setConvAllLoaded] = useState(false);

  const fld = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const campaignName = useCallback((id) => campaigns.find((c) => c.id === id)?.name || "", [campaigns]);
  const offerName = useCallback((id) => offers.find((o) => o.id === id)?.name || "", [offers]);

  // ---- loaders ----
  const loadMeta = useCallback(async () => {
    try {
      const res = await apiClient.get(API_PATHS.buyerSignals.meta);
      if (Array.isArray(res?.levels) && res.levels.length) setLevels(res.levels);
      if (Array.isArray(res?.sources)) setSources(res.sources);
      if (Array.isArray(res?.entity_types)) setEntityTypes(res.entity_types);
    } catch (err) {
      console.warn("Signal meta unavailable, using fallbacks", err);
    }
  }, []);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    setError("");
    try {
      const query = {};
      if (sourceFilter) query.source = sourceFilter;
      if (levelFilter) query.level = levelFilter;
      const res = await apiClient.get(API_PATHS.buyerSignals.inbox(query));
      setSignals(Array.isArray(res?.signals) ? res.signals : []);
    } catch (err) {
      console.error("Failed to load signal inbox", err);
      setError(err?.message || "Could not load the signal inbox.");
    } finally {
      setLoadingInbox(false);
    }
  }, [sourceFilter, levelFilter]);

  const loadAux = useCallback(async () => {
    const [confirmedRes, linksRes, dashRes, campRes, offerRes, attrRes] = await Promise.all([
      apiClient.get(API_PATHS.buyerSignals.list({ status: "confirmed" })).catch(() => ({ signals: [] })),
      apiClient.get(API_PATHS.trackingLinks.list).catch(() => ({ tracking_links: [] })),
      apiClient.get(API_PATHS.trackingLinks.dashboard).catch(() => null),
      apiClient.get(API_PATHS.campaigns.list).catch(() => ({ campaigns: [] })),
      apiClient.get(API_PATHS.offers.list).catch(() => ({ offers: [] })),
      apiClient.get(API_PATHS.buyerSignals.attribution).catch(() => ({ attribution: [] })),
    ]);
    const allConfirmed = Array.isArray(confirmedRes?.signals) ? confirmedRes.signals : [];
    setConfirmedSignals(allConfirmed.filter((s) => String(s?.status).toLowerCase() === "confirmed"));
    setLinks(Array.isArray(linksRes?.tracking_links) ? linksRes.tracking_links : []);
    setDashboard(dashRes || null);
    setCampaigns(Array.isArray(campRes?.campaigns) ? campRes.campaigns : []);
    setOffers(Array.isArray(offerRes?.offers) ? offerRes.offers : []);
    setAttribution(Array.isArray(attrRes?.attribution) ? attrRes.attribution : []);
  }, []);

  useEffect(() => {
    if (pageLocked) return;
    loadMeta();
    loadAux();
  }, [pageLocked, loadMeta, loadAux]);

  useEffect(() => {
    if (pageLocked) return;
    loadInbox();
  }, [pageLocked, loadInbox]);

  // Lazy-load all conversions when the Conversion Events tab is opened.
  const loadAllConversions = useCallback(async () => {
    setConvAllLoading(true);
    try {
      const results = await Promise.all(
        links.map((l) =>
          apiClient
            .get(API_PATHS.trackingLinks.conversions(l.id))
            .then((r) =>
              (Array.isArray(r?.conversions) ? r.conversions : []).map((c) => ({
                ...c,
                linkName: l.link_name || l.label || "Untitled link",
                linkId: l.id,
              }))
            )
            .catch(() => [])
        )
      );
      const flat = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllConversions(flat);
    } finally {
      setConvAllLoaded(true);
      setConvAllLoading(false);
    }
  }, [links]);

  useEffect(() => {
    if (activeTab === "conversions" && !structureLocked && !convAllLoaded && !convAllLoading) {
      loadAllConversions();
    }
  }, [activeTab, structureLocked, convAllLoaded, convAllLoading, loadAllConversions]);

  // ---- inbox actions ----
  async function handleDismiss(signal) {
    setBusyId(signal.id);
    setError("");
    try {
      await apiClient.patch(API_PATHS.buyerSignals.byId(signal.id), { status: "dismissed" });
      setSignals((cur) => cur.filter((s) => s.id !== signal.id));
    } catch (err) {
      setError(err?.message || "Could not dismiss this signal.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(signal) {
    setBusyId(signal.id);
    setError("");
    try {
      await apiClient.delete(API_PATHS.buyerSignals.byId(signal.id));
      setSignals((cur) => cur.filter((s) => s.id !== signal.id));
    } catch (err) {
      setError(err?.message || "Could not delete this signal.");
    } finally {
      setBusyId("");
    }
  }

  // ---- tracking-link actions ----
  function openCreateLink() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEditLink(link) {
    setEditingId(link.id);
    setForm({
      link_name: link.link_name || link.label || "",
      target_url: link.target_url || "",
      source_platform: link.source_platform || link.platform || "",
      campaign_id: link.campaign_id || "",
      offer_id: link.offer_id || "",
      signal_level: link.signal_level || "",
      cta_type: link.cta_type || "",
      notes: link.notes || "",
      is_active: link.is_active !== false,
    });
    setEditorOpen(true);
  }

  async function handleSaveLink() {
    if (!form.link_name.trim()) {
      toast.error("Give the link a name.");
      return;
    }
    if (!/^https?:\/\//i.test(form.target_url.trim())) {
      toast.error("Destination URL must start with http:// or https://");
      return;
    }
    setIsSaving(true);
    const payload = {
      link_name: form.link_name.trim(),
      label: form.link_name.trim(),
      target_url: form.target_url.trim(),
      source_platform: form.source_platform,
      source_type: "manual",
      campaign_id: form.campaign_id || null,
      offer_id: form.offer_id || null,
      signal_level: form.signal_level === "" ? null : Number(form.signal_level),
      cta_type: form.cta_type,
      notes: form.notes,
      is_active: form.is_active,
    };
    try {
      if (editingId) {
        await apiClient.patch(API_PATHS.trackingLinks.byId(editingId), payload);
        toast.success("Link updated.");
      } else {
        await apiClient.post(API_PATHS.trackingLinks.create, payload);
        toast.success("Link created.");
      }
      setEditorOpen(false);
      await loadAux();
    } catch (e) {
      console.error("Save failed:", e);
      toast.error(e.response?.data?.detail || "Could not save link.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteLink() {
    const link = pendingDelete;
    setPendingDelete(null);
    if (!link) return;
    try {
      await apiClient.delete(API_PATHS.trackingLinks.byId(link.id));
      toast.success("Link deleted.");
      await loadAux();
    } catch (e) {
      console.error("Delete failed:", e);
      toast.error("Could not delete link.");
    }
  }

  const loadConversions = useCallback(async (linkId) => {
    setConvLoadingId(linkId);
    try {
      const res = await apiClient.get(API_PATHS.trackingLinks.conversions(linkId));
      setConversionsByLink((prev) => ({
        ...prev,
        [linkId]: Array.isArray(res?.conversions) ? res.conversions : [],
      }));
    } catch (e) {
      console.error("Failed to load conversions:", e);
      toast.error("Could not load conversion tags.");
    } finally {
      setConvLoadingId(null);
    }
  }, []);

  function toggleExpand(link) {
    setTagForm({ event_type: "", note: "" });
    if (expandedId === link.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(link.id);
    if (!conversionsByLink[link.id]) loadConversions(link.id);
  }

  async function handleAddTag(linkId) {
    if (!tagForm.event_type) {
      toast.error("Pick an event type.");
      return;
    }
    setIsTagging(true);
    try {
      await apiClient.post(API_PATHS.trackingLinks.conversions(linkId), {
        event_type: tagForm.event_type,
        note: tagForm.note.trim(),
      });
      toast.success("Conversion tagged.");
      setTagForm({ event_type: "", note: "" });
      await loadConversions(linkId);
      setConvAllLoaded(false); // aggregate view will refresh on next open
    } catch (e) {
      console.error("Tag failed:", e);
      toast.error(e.response?.data?.detail || "Could not tag conversion.");
    } finally {
      setIsTagging(false);
    }
  }

  function copyTrackingUrl(link) {
    const url = link.tracking_url || (link.tracking_id ? `${window.location.origin}/api/mail/r/${link.tracking_id}` : "");
    if (!url) {
      toast.error("No trackable URL on this link.");
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => toast.success("Trackable URL copied."),
      () => toast.error("Copy failed.")
    );
  }

  // ---- derived ----
  const pendingCount = signals.length;

  const levelName = (n) => levels.find((l) => l.value === Number(n))?.label || (n ? `Level ${n}` : "");

  const dashCards = [
    { label: "Total clicks", value: dashboard?.total_clicks ?? 0, sub: "across all links" },
    { label: "Top source", value: dashboard?.top_source || "—" },
    { label: "Highest level", value: dashboard?.highest_signal_level ? `L${dashboard.highest_signal_level}` : "—", sub: dashboard?.highest_signal_level ? levelName(dashboard.highest_signal_level) : "" },
    { label: "Best campaign", value: dashboard?.best_campaign || "—" },
    { label: "Drop-off stage", value: dashboard?.drop_off_stage || "—" },
    { label: "Pending signals", value: pendingCount, sub: "need review", accent: true },
  ];

  const signalCountsByLevel = levels.map((lvl) => {
    const count = confirmedSignals.filter(
      (s) => Number(s.confirmed_level ?? s.level ?? s.suggested_level) === lvl.value
    ).length;
    return { ...lvl, count };
  });
  const signalMax = Math.max(1, ...signalCountsByLevel.map((l) => l.count));
  const confirmedTotal = confirmedSignals.length;

  const attributionRows = attribution.filter((a) =>
    ["campaign", "offer"].includes(String(a.entity_type).toLowerCase())
  );

  const recommendation = dashboard?.recommended_next_action ||
    "Keep logging and confirming signals. As buyers move through your tracking links, your next best move will sharpen here.";

  if (pageLocked) return <LockedView />;

  const tabIsLocked = (tab) => tab.tier === "structure" && structureLocked;

  return (
    <DashboardLayout>
      <div className="flex flex-col" style={PAGE_STYLE} data-testid="signal-inbox-page">
        <header className="cth-page-header">
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl md:text-[32px] leading-tight truncate"
              style={{ fontFamily: SERIF, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
            >
              Signal Inbox
            </h1>
            <p
              className="text-xs md:text-sm truncate"
              style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: SANS }}
            >
              Track, confirm, and act on every sign of buying intent.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", fontFamily: SANS, border: "none", cursor: "pointer" }}
              data-testid="log-signal-btn"
            >
              <Plus size={13} /> Log a signal
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto" style={{ padding: "18px 20px" }}>
          <div className="mx-auto" style={{ maxWidth: 1060 }}>
            {/* Dashboard strip — always visible */}
            <div
              className="grid"
              style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8, marginBottom: 14 }}
              data-testid="dashboard-strip"
            >
              {dashCards.map((c) => (
                <DashboardCard key={c.label} label={c.label} value={c.value} sub={c.sub} accent={c.accent} />
              ))}
            </div>

            {/* Tab pills */}
            <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 14 }} data-testid="tab-pills">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={`tab-${tab.id}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: SANS,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      border: `1px solid ${active ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
                      background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel)",
                      color: active ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
                    }}
                  >
                    {tabIsLocked(tab) ? <Lock size={10} /> : null}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {error ? (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
                style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-error)", color: "var(--cth-command-ink)", marginBottom: 12 }}
              >
                <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-error)" }} />
                <div className="flex-1">{error}</div>
                <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}>
                  <X size={12} />
                </button>
              </div>
            ) : null}

            {/* ---------------- Tab bodies ---------------- */}
            {(() => {
              const tab = TABS.find((t) => t.id === activeTab);
              if (tab && tabIsLocked(tab)) return <LockedTabCard tabLabel={tab.label} />;

              if (activeTab === "new") {
                return (
                  <NewSignalsTab
                    signals={signals}
                    levels={levels}
                    sources={sources}
                    loading={loadingInbox}
                    busyId={busyId}
                    sourceFilter={sourceFilter}
                    levelFilter={levelFilter}
                    setSourceFilter={setSourceFilter}
                    setLevelFilter={setLevelFilter}
                    onConfirm={setConfirmTarget}
                    onDismiss={handleDismiss}
                    onDelete={handleDelete}
                  />
                );
              }
              if (activeTab === "levels") {
                return (
                  <SignalLevelsTab
                    rows={signalCountsByLevel}
                    max={signalMax}
                    total={confirmedTotal}
                    onGotoNew={() => setActiveTab("new")}
                  />
                );
              }
              if (activeTab === "links") {
                return (
                  <TrackingLinksTab
                    links={links}
                    campaignName={campaignName}
                    offerName={offerName}
                    expandedId={expandedId}
                    conversionsByLink={conversionsByLink}
                    convLoadingId={convLoadingId}
                    tagForm={tagForm}
                    setTagForm={setTagForm}
                    isTagging={isTagging}
                    onToggleExpand={toggleExpand}
                    onAddTag={handleAddTag}
                    onCopy={copyTrackingUrl}
                    onEdit={openEditLink}
                    onDelete={setPendingDelete}
                    onNewLink={openCreateLink}
                  />
                );
              }
              if (activeTab === "sources") {
                return (
                  <SourceActivityTab
                    rows={attributionRows}
                    levels={levels}
                    campaignName={campaignName}
                    offerName={offerName}
                  />
                );
              }
              if (activeTab === "conversions") {
                return (
                  <ConversionEventsTab
                    rows={allConversions}
                    loading={convAllLoading}
                  />
                );
              }
              if (activeTab === "recommended") {
                return (
                  <RecommendedActionTab
                    recommendation={recommendation}
                    onAct={() => setActiveTab("new")}
                  />
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Tracking-link editor modal */}
        {editorOpen ? (
          <LinkEditorModal
            form={form}
            fld={fld}
            editingId={editingId}
            isSaving={isSaving}
            campaigns={campaigns}
            offers={offers}
            onClose={() => setEditorOpen(false)}
            onSave={handleSaveLink}
          />
        ) : null}

        {/* Delete confirm */}
        {pendingDelete ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setPendingDelete(null)}
            style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(13,0,16,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ ...CARD_STYLE, width: "100%", maxWidth: 420, padding: 24 }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>Delete tracking link</h2>
              <p style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)", margin: "10px 0 20px", lineHeight: 1.55 }}>
                This permanently deletes “{pendingDelete.link_name || pendingDelete.label || "this link"}” and its conversion tags. This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setPendingDelete(null)} style={ghostBtn}>Cancel</button>
                <button type="button" onClick={confirmDeleteLink} style={primaryBtn}>Delete</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Signal modals */}
      {showCreate ? (
        <CreateSignalModal
          levels={levels}
          entityTypes={entityTypes}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            if (created) setSignals((cur) => [created, ...cur]);
          }}
          setError={setError}
        />
      ) : null}

      {confirmTarget ? (
        <ConfirmSignalModal
          signal={confirmTarget}
          levels={levels}
          entityTypes={entityTypes}
          onClose={() => setConfirmTarget(null)}
          onConfirmed={(id) => {
            setConfirmTarget(null);
            setSignals((cur) => cur.filter((s) => s.id !== id));
            loadAux();
          }}
          setError={setError}
        />
      ) : null}
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Shared button styles
// ---------------------------------------------------------------------------

const primaryBtn = {
  background: "var(--cth-command-crimson)",
  color: "var(--cth-command-ivory)",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.03em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

const ghostBtn = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 8,
  padding: "9px 16px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const iconBtn = {
  background: "transparent",
  border: "none",
  color: "var(--cth-command-muted)",
  cursor: "pointer",
  padding: 6,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
};

const inputStyleObj = {
  width: "100%",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 8,
  padding: "8px 12px",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const labelStyleObj = {
  display: "block",
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  marginBottom: 6,
};

// ---------------------------------------------------------------------------
// New Signals tab — original SignalInbox content, unchanged behavior
// ---------------------------------------------------------------------------

function NewSignalsTab({
  signals, levels, sources, loading, busyId,
  sourceFilter, levelFilter, setSourceFilter, setLevelFilter,
  onConfirm, onDismiss, onDelete,
}) {
  const selectStyle = {
    background: "var(--cth-command-panel)",
    border: "1px solid var(--cth-command-border)",
    color: "var(--cth-command-ink)",
    fontFamily: SANS,
  };
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-md px-2.5 py-1.5 text-xs font-semibold"
          style={selectStyle}
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{sourceLabel(s)}</option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-md px-2.5 py-1.5 text-xs font-semibold"
          style={selectStyle}
        >
          <option value="">All levels</option>
          {levels.map((l) => (
            <option key={l.value} value={l.value}>{l.value} · {l.label}</option>
          ))}
        </select>
        {(sourceFilter || levelFilter) && (
          <button
            type="button"
            onClick={() => { setSourceFilter(""); setLevelFilter(""); }}
            className="text-[11px] font-semibold underline"
            style={{ color: "var(--cth-command-muted)" }}
          >
            Clear
          </button>
        )}
      </div>

      {loading && !signals.length ? (
        <div
          className="flex items-center gap-2 rounded-xl p-5 text-sm"
          style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}
        >
          <Loader2 size={14} className="animate-spin" /> Loading the inbox...
        </div>
      ) : !signals.length ? (
        <section
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}
        >
          <Radar size={32} className="mx-auto" style={{ color: "var(--cth-command-crimson)" }} />
          <h3 className="mt-3 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            The inbox is clear
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6" style={{ color: "var(--cth-command-muted)" }}>
            No pending buyer signals right now. Log one manually when you spot real buying
            behavior, and confirmed signals will roll up into Signal Levels.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => {
            const busy = busyId === signal.id;
            const connections = Array.isArray(signal.connections) ? signal.connections : [];
            return (
              <article
                key={signal.id}
                className="rounded-xl p-4"
                style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <LevelBadge level={signal.suggested_level} levels={levels} />
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ background: "var(--cth-command-blush)", color: "var(--cth-command-ink)", fontFamily: SANS }}
                  >
                    {sourceLabel(signal.source)}
                  </span>
                  <span className="ml-auto text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                    {formatDate(signal.created_at)}
                  </span>
                </div>

                {signal.signal_text ? (
                  <p className="mt-2.5 text-sm leading-6" style={{ color: "var(--cth-command-ink)" }}>
                    {signal.signal_text}
                  </p>
                ) : null}
                {signal.behavior_description ? (
                  <p className="mt-1 text-[13px] leading-6" style={{ color: "var(--cth-command-muted)" }}>
                    <span className="font-semibold">Behavior:</span> {signal.behavior_description}
                  </p>
                ) : null}
                {signal.founder_note ? (
                  <p
                    className="mt-2 rounded-md px-2.5 py-1.5 text-[12px] leading-5"
                    style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)" }}
                  >
                    <span className="font-semibold">Note:</span> {signal.founder_note}
                  </p>
                ) : null}

                {connections.length ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {connections.map((c, i) => (
                      <span
                        key={`${c.entity_type}-${c.entity_id}-${i}`}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}
                      >
                        <Link2 size={10} /> {sourceLabel(c.entity_type)}: {c.entity_id}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--cth-command-border)" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onConfirm(signal)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    style={{ background: "var(--cth-command-success)", color: "var(--cth-command-ivory)", fontFamily: SANS, border: "none" }}
                  >
                    <Check size={13} /> Confirm
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDismiss(signal)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)", fontFamily: SANS }}
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={13} />} Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(signal)}
                    title="Delete permanently"
                    className="ml-auto inline-flex items-center rounded-md p-1.5 disabled:opacity-50"
                    style={{ color: "var(--cth-command-error)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
          <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            {signals.length} pending signal{signals.length === 1 ? "" : "s"}.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Levels tab
// ---------------------------------------------------------------------------

function SignalLevelsTab({ rows, max, total, onGotoNew }) {
  return (
    <div style={{ ...CARD_STYLE, padding: "18px 20px" }} data-testid="signal-levels-tab">
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
            Signal Levels
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 11.5, color: "var(--cth-command-muted)", margin: "3px 0 0" }}>
            Confirmed buyer signals across the five levels.
          </p>
        </div>
        <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>{total} confirmed</span>
      </div>

      {total === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--cth-command-muted)", padding: "10px 0", lineHeight: 1.6 }}>
          No confirmed signals yet. Confirm signals in the{" "}
          <button
            type="button"
            onClick={onGotoNew}
            style={{ background: "transparent", border: "none", padding: 0, color: "var(--cth-command-crimson)", fontWeight: 600, cursor: "pointer", fontFamily: SANS, fontSize: 12.5 }}
          >
            New Signals
          </button>{" "}
          tab and they roll up here.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {rows.map((lvl) => (
            <div key={lvl.value} className="flex items-center" style={{ gap: 10 }}>
              <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-ink)", width: 168, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lvl.value} · {lvl.label}
              </span>
              <div style={{ flex: 1, height: 8, background: "var(--cth-command-panel-soft)", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(lvl.count / max) * 100}%`,
                    height: "100%",
                    background: LEVEL_COLOR[lvl.value] || "var(--cth-command-crimson)",
                    borderRadius: 999,
                    minWidth: lvl.count > 0 ? 4 : 0,
                    transition: "width 0.2s",
                  }}
                />
              </div>
              <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: "var(--cth-command-ink)", width: 28, textAlign: "right", flexShrink: 0 }}>
                {lvl.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tracking Links tab — full manager
// ---------------------------------------------------------------------------

function TrackingLinksTab({
  links, campaignName, offerName,
  expandedId, conversionsByLink, convLoadingId, tagForm, setTagForm, isTagging,
  onToggleExpand, onAddTag, onCopy, onEdit, onDelete, onNewLink,
}) {
  return (
    <div style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }} data-testid="tracking-links-tab">
      <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--cth-command-border)" }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
          Your tracking links
        </h2>
        <button type="button" onClick={onNewLink} style={{ ...primaryBtn, padding: "7px 14px", fontSize: 12 }} data-testid="new-link-btn">
          <Plus size={14} /> New link
        </button>
      </div>

      {links.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <Link2 size={28} style={{ color: "var(--cth-command-muted)", margin: "0 auto 10px" }} />
          <p style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)", margin: 0 }}>
            No tracking links yet. Create your first one to start collecting buyer signal.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {links.map((link) => {
            const active = link.is_active !== false;
            const isExpanded = expandedId === link.id;
            const tags = conversionsByLink[link.id] || [];
            return (
              <div key={link.id} style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
                <div className="flex items-center gap-3" style={{ padding: "12px 18px" }}>
                  <button
                    type="button"
                    onClick={() => onToggleExpand(link)}
                    title={isExpanded ? "Collapse" : "Conversion notes"}
                    style={{ ...iconBtn, flexShrink: 0 }}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {link.link_name || link.label || "Untitled link"}
                      </span>
                      <span
                        style={{
                          fontFamily: SANS, fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 999,
                          background: "var(--cth-command-panel-soft)",
                          color: active ? "var(--cth-command-success)" : "var(--cth-command-muted)",
                          border: `1px solid ${active ? "var(--cth-command-success)" : "var(--cth-command-border)"}`,
                        }}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                      {link.signal_level ? (
                        <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 999, background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)", border: "1px solid var(--cth-command-border)" }}>
                          Signal {link.signal_level}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[link.source_platform || link.platform, campaignName(link.campaign_id), offerName(link.offer_id)].filter(Boolean).join(" · ") || link.target_url}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 64 }}>
                    <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", lineHeight: 1 }}>
                      {link.click_count || 0}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 9, color: "var(--cth-command-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      clicks
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => onCopy(link)} title="Copy trackable URL" style={iconBtn}>
                      <Copy size={15} />
                    </button>
                    <button type="button" onClick={() => onEdit(link)} title="Edit" style={iconBtn}>
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => onDelete(link)} title="Delete" style={{ ...iconBtn, color: "var(--cth-command-error)" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div style={{ padding: "4px 18px 16px 41px", background: "var(--cth-command-panel-soft)" }}>
                    <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cth-command-muted)", margin: "8px 0 8px" }}>
                      Conversion notes
                    </div>

                    {convLoadingId === link.id ? (
                      <div style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", padding: "6px 0" }}>Loading…</div>
                    ) : tags.length === 0 ? (
                      <div style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", padding: "2px 0 8px" }}>
                        No conversions tagged yet. Log what happened below.
                      </div>
                    ) : (
                      <div className="flex flex-col" style={{ gap: 6, marginBottom: 10 }}>
                        {tags.map((t) => (
                          <div key={t.id} className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 12 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--cth-command-panel)", color: "var(--cth-command-ink)", border: "1px solid var(--cth-command-border)", flexShrink: 0 }}>
                              <Tag size={10} /> {t.event_type}
                            </span>
                            {t.note ? <span style={{ color: "var(--cth-command-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note}</span> : null}
                            <span style={{ color: "var(--cth-command-muted)", fontSize: 10.5, marginLeft: "auto", flexShrink: 0 }}>{fmtDate(t.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                      <select
                        style={{ ...inputStyleObj, width: "auto", flex: "0 0 auto", minWidth: 170 }}
                        value={tagForm.event_type}
                        onChange={(e) => setTagForm((p) => ({ ...p, event_type: e.target.value }))}
                      >
                        <option value="">Event type…</option>
                        {EVENT_TYPES.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                      </select>
                      <input
                        style={{ ...inputStyleObj, flex: 1 }}
                        value={tagForm.note}
                        onChange={(e) => setTagForm((p) => ({ ...p, note: e.target.value }))}
                        placeholder="Optional note"
                      />
                      <button
                        type="button"
                        onClick={() => onAddTag(link.id)}
                        disabled={isTagging}
                        style={{ ...primaryBtn, flexShrink: 0, padding: "8px 14px", fontSize: 12, opacity: isTagging ? 0.6 : 1 }}
                      >
                        <Plus size={14} /> Add tag
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source Activity tab — attribution by Campaign / Offer
// ---------------------------------------------------------------------------

function SourceActivityTab({ rows, levels, campaignName, offerName }) {
  const resolveName = (row) => {
    const type = String(row.entity_type).toLowerCase();
    if (type === "campaign") return campaignName(row.entity_id) || row.entity_id;
    if (type === "offer") return offerName(row.entity_id) || row.entity_id;
    return row.entity_id;
  };
  return (
    <div style={{ ...CARD_STYLE, padding: "18px 20px" }} data-testid="source-activity-tab">
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
          Source Activity
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 11.5, color: "var(--cth-command-muted)", margin: "3px 0 0" }}>
          Confirmed signals attributed to campaigns and offers.
        </p>
      </div>

      {rows.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--cth-command-muted)", padding: "10px 0", lineHeight: 1.6 }}>
          No attribution data yet. Confirm signals connected to a campaign or offer and they appear here.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 7 }}>
          {rows.map((row, i) => {
            const levelMeta = levels.find((l) => l.value === Number(row.max_level));
            return (
              <div
                key={`${row.entity_type}-${row.entity_id}-${i}`}
                className="flex items-center"
                style={{ gap: 10, padding: "10px 13px", background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", borderRadius: 9 }}
              >
                <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cth-command-muted)", fontWeight: 600, width: 72, flexShrink: 0 }}>
                  {sourceLabel(row.entity_type)}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-ink)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {resolveName(row)}
                </span>
                {row.max_level ? (
                  <span
                    style={{
                      fontFamily: SANS, fontSize: 9, padding: "2px 8px", borderRadius: 999,
                      background: "var(--cth-command-panel)",
                      color: LEVEL_COLOR[row.max_level] || "var(--cth-command-crimson)",
                      border: `1px solid ${LEVEL_COLOR[row.max_level] || "var(--cth-command-border)"}`,
                      flexShrink: 0,
                    }}
                  >
                    L{row.max_level}{levelMeta ? ` · ${levelMeta.label}` : ""}
                  </span>
                ) : null}
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: "var(--cth-command-crimson)", flexShrink: 0, width: 64, textAlign: "right" }}>
                  {row.signal_count} signal{row.signal_count === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversion Events tab — all conversions across all links
// ---------------------------------------------------------------------------

function ConversionEventsTab({ rows, loading }) {
  return (
    <div style={{ ...CARD_STYLE, padding: "18px 20px" }} data-testid="conversion-events-tab">
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
          Conversion Events
        </h2>
        <p style={{ fontFamily: SANS, fontSize: 11.5, color: "var(--cth-command-muted)", margin: "3px 0 0" }}>
          Every conversion tagged across all your tracking links.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--cth-command-muted)", padding: "10px 0" }}>
          <Loader2 size={14} className="animate-spin" /> Loading conversion events…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--cth-command-muted)", padding: "10px 0", lineHeight: 1.6 }}>
          No conversion events yet. Tag conversions on your tracking links and they collect here.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 7 }}>
          {rows.map((row, i) => (
            <div
              key={row.id || `${row.linkId}-${i}`}
              style={{ padding: "10px 13px", background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", borderRadius: 9 }}
            >
              <div className="flex items-center gap-2">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontSize: 10, fontWeight: 600, color: "var(--cth-command-success)" }}>
                  <Tag size={11} /> {row.event_type}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 10.5, color: "var(--cth-command-muted)", marginLeft: "auto", flexShrink: 0 }}>
                  {fmtDate(row.created_at)}
                </span>
              </div>
              {row.note ? (
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: "var(--cth-command-ink)", marginTop: 3 }}>{row.note}</div>
              ) : null}
              <div style={{ fontFamily: SANS, fontSize: 10, color: "var(--cth-command-muted)", marginTop: 3 }}>
                <Link2 size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                {row.linkName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recommended Action tab — dark Zuri card (#1a0828 established exception)
// ---------------------------------------------------------------------------

function RecommendedActionTab({ recommendation, onAct }) {
  return (
    <div style={{ background: "#1a0828", borderRadius: 12, padding: "20px 22px" }} data-testid="recommended-action-tab">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--cth-command-cinnabar)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 500, color: "var(--cth-command-ivory)" }}>Z</span>
        </div>
        <span style={{ fontFamily: SANS, fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7a6090" }}>
          Zuri · Next Best Move
        </span>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: "var(--cth-command-ivory)", marginBottom: 10, lineHeight: 1.3 }}>
        Your next best move
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: "rgba(232,223,240,0.78)", lineHeight: 1.6, marginBottom: 16 }}>
        {recommendation}
      </div>
      <button
        type="button"
        onClick={onAct}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontSize: 11, fontWeight: 500, color: "var(--cth-command-cinnabar)", background: "transparent", border: "1px solid rgba(224,78,53,0.4)", borderRadius: 6, padding: "6px 13px", cursor: "pointer" }}
      >
        Review pending signals
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tracking-link editor modal
// ---------------------------------------------------------------------------

function LinkEditorModal({ form, fld, editingId, isSaving, campaigns, offers, onClose, onSave }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(13,0,16,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ ...CARD_STYLE, borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
        <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--cth-command-border)" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
            {editingId ? "Edit tracking link" : "New tracking link"}
          </h2>
          <button type="button" onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        <div data-mcp-action="signal-log" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyleObj}>Link name</label>
            <input style={inputStyleObj} value={form.link_name} onChange={(e) => fld("link_name", e.target.value)} placeholder="e.g. IG bio → diagnostic" />
          </div>
          <div>
            <label style={labelStyleObj}>Destination URL</label>
            <input style={inputStyleObj} value={form.target_url} onChange={(e) => fld("target_url", e.target.value)} placeholder="https://" />
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyleObj}>Source platform</label>
              <select style={inputStyleObj} value={form.source_platform} onChange={(e) => fld("source_platform", e.target.value)}>
                <option value="">Select…</option>
                {SOURCE_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyleObj}>CTA type</label>
              <select style={inputStyleObj} value={form.cta_type} onChange={(e) => fld("cta_type", e.target.value)}>
                <option value="">Select…</option>
                {CTA_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyleObj}>Campaign</label>
              <select style={inputStyleObj} value={form.campaign_id} onChange={(e) => fld("campaign_id", e.target.value)}>
                <option value="">None</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyleObj}>Offer</label>
              <select style={inputStyleObj} value={form.offer_id} onChange={(e) => fld("offer_id", e.target.value)}>
                <option value="">None</option>
                {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyleObj}>Buyer signal level</label>
            <select style={inputStyleObj} value={form.signal_level} onChange={(e) => fld("signal_level", e.target.value)}>
              <option value="">Not set</option>
              {SIGNAL_LEVELS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyleObj}>Notes</label>
            <textarea style={{ ...inputStyleObj, minHeight: 64, resize: "vertical" }} value={form.notes} onChange={(e) => fld("notes", e.target.value)} placeholder="Anything worth remembering about this link." />
          </div>
          <label className="flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-ink)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => fld("is_active", e.target.checked)} />
            Active
          </label>
        </div>

        <div className="flex items-center justify-end gap-2" style={{ padding: "14px 20px", borderTop: "1px solid var(--cth-command-border)" }}>
          <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
          <button type="button" onClick={onSave} disabled={isSaving} style={{ ...primaryBtn, opacity: isSaving ? 0.6 : 1 }}>
            {isSaving ? "Saving…" : editingId ? "Save changes" : "Create link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal modals (unchanged from prior SignalInbox)
// ---------------------------------------------------------------------------

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(51,3,60,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-5"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {title}
          </h3>
          <button type="button" onClick={onClose} style={{ color: "var(--cth-command-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const fieldLabelCls = "block text-[11px] font-semibold uppercase tracking-[0.12em]";
const fieldLabelStyle = { color: "var(--cth-command-muted)", fontFamily: SANS };
const inputCls = "mt-1 w-full rounded-md px-2.5 py-2 text-sm";
const inputStyle = {
  background: "var(--cth-command-panel-soft)",
  border: "1px solid var(--cth-command-border)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
};

function ConnectionEditor({ entityTypes, entityType, entityId, setEntityType, setEntityId }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className={fieldLabelCls} style={fieldLabelStyle}>Entity type</label>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={inputCls} style={inputStyle}>
          <option value="">Select...</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>{sourceLabel(t)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={fieldLabelCls} style={fieldLabelStyle}>Entity ID</label>
        <input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="e.g. contact id" className={inputCls} style={inputStyle} />
      </div>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50"
      style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-ivory)", fontFamily: SANS, border: "none" }}
    >
      {children}
    </button>
  );
}

function CreateSignalModal({ levels, entityTypes, onClose, onCreated, setError }) {
  const [signalText, setSignalText] = useState("");
  const [behavior, setBehavior] = useState("");
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = (signalText.trim() || behavior.trim()) && !saving;

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const connections = [];
      if (entityType && entityId.trim()) {
        connections.push({ entity_type: entityType, entity_id: entityId.trim() });
      }
      const res = await apiClient.post(API_PATHS.buyerSignals.create, {
        source: "manual",
        signal_text: signalText.trim(),
        behavior_description: behavior.trim(),
        suggested_level: Number(level),
        founder_note: note.trim(),
        connections,
      });
      onCreated(res?.signal || null);
    } catch (err) {
      setError(err?.message || "Could not log this signal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Log a buyer signal" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>What was the signal?</label>
          <textarea value={signalText} onChange={(e) => setSignalText(e.target.value)} rows={2} placeholder="What they said or did that reads as buying intent." className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>Behavior (optional)</label>
          <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} rows={2} placeholder="The observable behavior behind it." className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>Suggested level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls} style={inputStyle}>
            {levels.map((l) => (
              <option key={l.value} value={l.value}>{l.value} · {l.label}</option>
            ))}
          </select>
        </div>
        <ConnectionEditor
          entityTypes={entityTypes}
          entityType={entityType}
          entityId={entityId}
          setEntityType={setEntityType}
          setEntityId={setEntityId}
        />
        <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
          A connection is optional now, but required before you can confirm.
        </p>
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>Founder note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div className="flex gap-2 pt-1">
          <PrimaryButton disabled={!canSave} onClick={submit}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Log signal
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

function ConfirmSignalModal({ signal, levels, entityTypes, onClose, onConfirmed, setError }) {
  const existing = useMemo(
    () => (Array.isArray(signal.connections) ? signal.connections : []),
    [signal]
  );
  const [level, setLevel] = useState(signal.suggested_level || 1);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [saving, setSaving] = useState(false);

  const hasConnection = existing.length > 0 || (entityType && entityId.trim());
  const canConfirm = hasConnection && !saving;

  async function submit() {
    if (!canConfirm) return;
    setSaving(true);
    setError("");
    try {
      const payload = { status: "confirmed", confirmed_level: Number(level) };
      if (!existing.length && entityType && entityId.trim()) {
        payload.connections = [{ entity_type: entityType, entity_id: entityId.trim() }];
      }
      await apiClient.patch(API_PATHS.buyerSignals.byId(signal.id), payload);
      onConfirmed(signal.id);
    } catch (err) {
      setError(err?.message || "Could not confirm this signal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Confirm signal" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className={fieldLabelCls} style={fieldLabelStyle}>Confirmed level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls} style={inputStyle}>
            {levels.map((l) => (
              <option key={l.value} value={l.value}>{l.value} · {l.label}</option>
            ))}
          </select>
        </div>

        {existing.length ? (
          <p className="text-[12px]" style={{ color: "var(--cth-command-muted)" }}>
            Connected to{" "}
            {existing.map((c) => `${sourceLabel(c.entity_type)}: ${c.entity_id}`).join(", ")}.
          </p>
        ) : (
          <div className="space-y-1">
            <ConnectionEditor
              entityTypes={entityTypes}
              entityType={entityType}
              entityId={entityId}
              setEntityType={setEntityType}
              setEntityId={setEntityId}
            />
            <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
              A signal must be connected to at least one entity before it can be confirmed.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold"
            style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)", fontFamily: SANS }}
          >
            Cancel
          </button>
          <PrimaryButton disabled={!canConfirm} onClick={submit}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}
