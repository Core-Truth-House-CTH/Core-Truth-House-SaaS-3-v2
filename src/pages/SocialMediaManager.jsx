import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AskTheHouseDrawer from "../components/ask-the-house/AskTheHouseDrawer";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import {
 Plus,
 ChevronLeft,
 ChevronRight,
 Instagram,
 Linkedin,
 Facebook,
 Clock,
 CalendarDays,
 Lightbulb,
 Pencil,
 Send,
 Trash2,
 Wand2,
 Loader2,
 X,
 Share2,
 Hash,
 Sparkles,
 Video,
 Upload,
 Music,
 Store,
 Pin,
 Layout as LayoutIcon,
 Check,
 Calendar as CalendarIcon,
 Grid3x3,
 List as ListIcon,
 AlertCircle,
 RefreshCw,
 Copy,
 BookOpen,
 Link2,
 UserRound,
 BarChart3,
 Heart,
 Image as ImageIcon,
 Search,
} from "lucide-react";
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import CampaignContextBanner from "../components/shared/CampaignContextBanner";
import BestPostingTimes from "../components/social/BestPostingTimes";
import "../styles/social-planner.css";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
// Numbers render in Playfair Display via the .metric-value / *-number CSS rules
// (Cormorant renders 1/0 like I/O at display sizes; CLAUDE.md: score numbers use
// Playfair). Kept in the stylesheet so it stays consistent across all number cells.

const PLATFORM_CFG = {
 instagram: { icon: Instagram, color: "#E1306C", limit: 2200, label: "Instagram" },
 linkedin: { icon: Linkedin, color: "#0A66C2", limit: 3000, label: "LinkedIn" },
 facebook: { icon: Facebook, color: "#1877F2", limit: 5000, label: "Facebook" },
 tiktok: { icon: Music, color: "#FF0050", limit: 2200, label: "TikTok" },
 google_business: { icon: Store, color: "#4285F4", limit: 1500, label: "Google Business" },
 threads: { icon: Hash, color: "#101010", limit: 500, label: "Threads" },
 pinterest: { icon: Pin, color: "#E60023", limit: 500, label: "Pinterest" },
};

const STATUS_CFG = {
 draft: { label: "Draft", tone: "muted" },
 needs_approval: { label: "Needs Approval", tone: "gold" },
 rejected: { label: "Rejected", tone: "crimson" },
 scheduled: { label: "Scheduled", tone: "purple" },
 publishing: {
 label: "Publishing",
 tone: "purple",
 hint: "Being sent to the platform right now.",
 },
 published: { label: "Published", tone: "success" },
 publish_unknown: {
 label: "May Have Posted",
 tone: "gold",
 hint:
 "The platform never sent a reply, so this post may or may not be live. " +
 "Check the platform before doing anything else — publishing again could post it twice.",
 },
 failed: { label: "Failed", tone: "crimson" },
};

const STATUS_FILTER_OPTIONS = [
 { key: "all", label: "All Statuses" },
 { key: "draft", label: "Drafts" },
 { key: "scheduled", label: "Scheduled" },
 { key: "needs_approval", label: "Needs Approval" },
 { key: "publishing", label: "Publishing" },
 { key: "published", label: "Published" },
 { key: "publish_unknown", label: "May Have Posted" },
 { key: "failed", label: "Failed" },
];

// Mirrors the server's publish-owned check (routes/social.py _publish_locked and
// services/social_dispatch._CLAIM_GUARD_FIELDS). Once a post is published, in
// flight, or unresolved, editing it here cannot change what is already live on
// the platform — so we stop pretending it can.
const PUBLISH_LOCKED_STATUSES = ["published", "publishing", "publish_unknown"];

function isPublishLocked(post) {
 if (!post) return false;
 if (PUBLISH_LOCKED_STATUSES.includes(post.status)) return true;
 return Boolean(
 post.published_at ||
 post.platform_post_id ||
 post.zernio_post_id ||
 post.ayrshare_post_id
 );
}

const SORT_OPTIONS = [
 { key: "time", label: "Most recent" },
 { key: "likes", label: "Most likes" },
 { key: "shares", label: "Most shares" },
 { key: "comments", label: "Most comments" },
 { key: "clicks", label: "Most clicks" },
];

const TONES = [
 "professional",
 "casual",
 "witty",
 "inspirational",
 "educational",
 "conversational",
];

const SURFACES = [
 { key: "publish", label: "Publish Calendar", icon: CalendarIcon },
 { key: "grid", label: "Instagram Grid", icon: Grid3x3 },
 { key: "posts", label: "Posts", icon: ListIcon },
 { key: "times", label: "Best Times", icon: Clock },
];

const SOCIAL_CONNECT_PLATFORMS = [
 { key: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", urlKey: "instagram_connect", note: "Posting + profile sync" },
 { key: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", urlKey: "facebook_connect", note: "Page posting" },
 { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2", urlKey: "linkedin_connect", note: "Personal share" },
 { key: "tiktok", label: "TikTok", icon: Music, color: "#FF0050", urlKey: "tiktok_connect", note: "Video posting" },
 { key: "pinterest", label: "Pinterest", icon: Pin, color: "#E60023", urlKey: "pinterest_connect", note: "Pin posting" },
 { key: "google_business", label: "Google Business", icon: Store, color: "#4285F4", urlKey: "google_business_connect", note: "Local Posts" },
 { key: "threads", label: "Threads", icon: Hash, color: "#101010", urlKey: "threads_connect", note: "Thread posting" },
];

const PAGE_STYLE = {
 background: "var(--cth-blush)",
 minHeight: "100%",
};

const PANEL_STYLE = {
 background: "var(--cth-panel-white)",
 border: "1px solid var(--cth-border)",
 borderRadius: 4,
};

const SOFT_PANEL_STYLE = {
 background: "var(--cth-blush)",
 border: "1px solid var(--cth-border)",
 borderRadius: 4,
};

const INPUT_STYLE = {
 width: "100%",
 background: "var(--cth-panel-white)",
 border: "1px solid var(--cth-border)",
 borderRadius: 4,
 padding: "10px 12px",
 color: "var(--cth-ink)",
 fontFamily: SANS,
 fontSize: 14,
 outline: "none",
};

const SMALL_INPUT_STYLE = {
 ...INPUT_STYLE,
 padding: "8px 12px",
 fontSize: 13,
};

const PRIMARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 4,
 background: "var(--cth-purple-deep)",
 color: "var(--cth-gold)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "8px 14px",
 borderRadius: 4,
 background: "transparent",
 border: "1px solid var(--cth-border)",
 color: "var(--cth-ink)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 cursor: "pointer",
};

const DESTRUCTIVE_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 4,
 background: "var(--cth-crimson)",
 color: "var(--cth-ivory)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const DESTRUCTIVE_OUTLINE_STYLE = {
 ...SECONDARY_BUTTON_STYLE,
 color: "var(--cth-crimson)",
 border: "1px solid var(--cth-crimson)",
};

const EYEBROW_STYLE = {
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 color: "var(--cth-muted)",
};

function backendAssetUrl(url) {
 if (!url) return "";
 if (/^https?:\/\//i.test(url)) return url;

 const base =
 import.meta.env.VITE_API_BASE_URL ||
 import.meta.env.VITE_BACKEND_URL ||
 "https://api.coretruthhouse.com";

 return `${String(base).replace(/\/+$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

function FieldLabel({ children, hint }) {
 return (
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
 <label style={{ ...EYEBROW_STYLE, fontSize: 11 }}>{children}</label>
 {hint ? <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-muted)" }}>{hint}</span> : null}
 </div>
 );
}

function Eyebrow({ children }) {
 return <div style={EYEBROW_STYLE}>{children}</div>;
}

function Chip({ children, tone = "muted" }) {
 const tones = {
 default: { background: "rgba(175,0,42,0.10)", border: "1px solid rgba(175,0,42,0.22)", color: "var(--cth-crimson)" },
 crimson: { background: "rgba(175,0,42,0.10)", border: "1px solid rgba(175,0,42,0.22)", color: "var(--cth-crimson)" },
 muted: { background: "var(--cth-blush)", border: "1px solid var(--cth-border)", color: "var(--cth-muted)" },
 gold: { background: "rgba(196,169,91,0.18)", border: "1px solid rgba(196,169,91,0.40)", color: "var(--cth-purple-deep)" },
 purple: { background: "rgba(51,3,60,0.10)", border: "1px solid rgba(51,3,60,0.22)", color: "var(--cth-purple-deep)" },
 success: { background: "rgba(34,135,90,0.12)", border: "1px solid rgba(34,135,90,0.28)", color: "#15803d" },
 };
 const style = tones[tone] || tones.muted;
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 borderRadius: 999,
 padding: "3px 10px",
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.06em",
 textTransform: "uppercase",
 ...style,
 }}
 >
 {children}
 </span>
 );
}

function PlatformBadge({ platform, size = "sm" }) {
 const cfg = PLATFORM_CFG[platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const padding = size === "sm" ? "3px 10px" : "6px 12px";
 const fontSize = size === "sm" ? 11 : 12;
 const iconSize = size === "sm" ? 11 : 13;
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 6,
 borderRadius: 999,
 padding,
 background: `${cfg.color}15`,
 color: cfg.color,
 border: `1px solid ${cfg.color}25`,
 fontFamily: SANS,
 fontSize,
 fontWeight: 600,
 letterSpacing: "0.04em",
 }}
 >
 <Icon size={iconSize} /> {cfg.label}
 </span>
 );
}

function MetricTile({ label, value, note, icon: Icon }) {
 return (
 <article className="metric-card">
 {Icon ? <Icon size={20} className="metric-icon" aria-hidden="true" /> : null}
 <span className="metric-label">{label}</span>
 <strong className="metric-value">{value}</strong>
 {note ? <span className="metric-note">{note}</span> : null}
 </article>
 );
}

function Panel({ eyebrow, title, subtitle, action, children, padding = 24 }) {
 const showHeader = Boolean(eyebrow || title || subtitle || action);
 return (
 <section style={{ ...PANEL_STYLE, padding }}>
 {showHeader ? (
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 20,
 }}
 >
 <div style={{ minWidth: 0 }}>
 {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
 {title ? (
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-ink)",
 margin: eyebrow ? "6px 0 0" : 0,
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {title}
 </h2>
 ) : null}
 {subtitle ? (
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-muted)",
 margin: "6px 0 0",
 lineHeight: 1.5,
 }}
 >
 {subtitle}
 </p>
 ) : null}
 </div>
 {action}
 </div>
 ) : null}
 {children}
 </section>
 );
}

function EmptyState({ icon: Icon, title, body }) {
 return (
 <div
 style={{
 padding: "32px 18px",
 textAlign: "center",
 background: "var(--cth-blush)",
 border: "1px dashed var(--cth-border)",
 borderRadius: 4,
 }}
 >
 {Icon ? (
 <Icon
 size={28}
 style={{ color: "var(--cth-muted)", display: "block", margin: "0 auto 10px" }}
 />
 ) : null}
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 16,
 fontWeight: 600,
 color: "var(--cth-ink)",
 marginBottom: 6,
 }}
 >
 {title}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-muted)" }}>{body}</div>
 </div>
 );
}

function IconButton({ onClick, label, hoverColor = "var(--cth-crimson)", disabled = false, busy = false, children }) {
 const [hover, setHover] = useState(false);
 return (
 <button
 type="button"
 aria-label={label}
 onClick={onClick}
 disabled={disabled || busy}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 width: 32,
 height: 32,
 borderRadius: 4,
 background: "transparent",
 border: `1px solid ${hover && !disabled ? "var(--cth-border)" : "transparent"}`,
 color: hover && !disabled ? hoverColor : "var(--cth-muted)",
 cursor: disabled || busy ? "default" : "pointer",
 opacity: disabled ? 0.4 : 1,
 transition: "color 150ms ease, border-color 150ms ease",
 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : children}
 </button>
 );
}

function TabBar({ value, onChange }) {
 return (
 <div className="primary-tabs">
 {SURFACES.map((tab) => {
 const Icon = tab.icon;
 const active = value === tab.key;
 return (
 <button
 key={tab.key}
 type="button"
 className={`primary-tab${active ? " active" : ""}`}
 onClick={() => onChange(tab.key)}
 style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
 >
 <Icon size={14} /> {tab.label}
 </button>
 );
 })}
 </div>
 );
}

function Toast({ toast }) {
 if (!toast) return null;
 const isError = toast.tone === "error";
 return (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: "fixed",
 bottom: 24,
 right: 24,
 zIndex: 80,
 background: "var(--cth-panel-white)",
 border: `1px solid ${isError ? "var(--cth-crimson)" : "var(--cth-gold)"}`,
 borderRadius: 4,
 padding: "12px 18px",
 boxShadow: "0 20px 40px rgba(13,0,16,0.18)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 color: "var(--cth-ink)",
 display: "flex",
 alignItems: "center",
 gap: 10,
 maxWidth: 420,
 }}
 >
 {isError ? <AlertCircle size={16} style={{ color: "var(--cth-crimson)", flexShrink: 0 }} /> : null}
 <span>{toast.message}</span>
 </div>
 );
}

function ConfirmModal({ confirm, busy, onCancel, onConfirm }) {
 if (!confirm) return null;
 return (
 <div
 role="presentation"
 onClick={onCancel}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 70,
 background: "rgba(13, 0, 16, 0.6)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 padding: 16,
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 onClick={(e) => e.stopPropagation()}
 style={{
 width: "100%",
 maxWidth: 480,
 background: "var(--cth-panel-white)",
 border: "1px solid var(--cth-border)",
 borderRadius: 4,
 padding: 28,
 boxShadow: "0 30px 60px rgba(13,0,16,0.25)",
 }}
 >
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 {confirm.title}
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-muted)",
 margin: "12px 0 24px",
 lineHeight: 1.55,
 }}
 >
 {confirm.body}
 </p>
 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
 <button
 type="button"
 onClick={onCancel}
 disabled={busy}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={onConfirm}
 disabled={busy}
 style={{
 ...(confirm.confirmTone === "primary" ? PRIMARY_BUTTON_STYLE : DESTRUCTIVE_BUTTON_STYLE),
 opacity: busy ? 0.7 : 1,
 }}
 >
 {busy
 ? <Loader2 size={14} className="animate-spin" />
 : confirm.confirmTone === "primary"
 ? <Send size={14} />
 : <Trash2 size={14} />}
 {confirm.confirmLabel || "Delete"}
 </button>
 </div>
 </div>
 </div>
 );
}

export default function SocialMediaManager() {
 const { currentWorkspace } = useWorkspace();
 const location = useLocation();
 const navigate = useNavigate();
 const handoff = location.state || {};
 const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
 const surfaceParam = new URLSearchParams(location.search).get("surface");

 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [posts, setPosts] = useState([]);
 const [calendarData, setCalendarData] = useState({});
 const [platforms, setPlatforms] = useState([]);
 const [analytics, setAnalytics] = useState(null);
 const [currentDate, setCurrentDate] = useState(new Date());
 const [calendarMode, setCalendarMode] = useState("month");
 const [showModal, setShowModal] = useState(null);
 const [editingPostId, setEditingPostId] = useState(null);
 const [formData, setFormData] = useState({});
 const [selectedPlatforms, setSelectedPlatforms] = useState([]);
 const [activePlatformTab, setActivePlatformTab] = useState("instagram");
 const [platformContent, setPlatformContent] = useState({});
 const [zuriChatOpen, setZuriChatOpen] = useState(false);
 const [generating, setGenerating] = useState(false);
 const [savingPost, setSavingPost] = useState(false);
 const [activeView, setActiveView] = useState("publish");
 const [filterPlatform, setFilterPlatform] = useState("all");
 const [filterStatus, setFilterStatus] = useState("all");
 const [filterContentJob, setFilterContentJob] = useState("all");
 const [filterCampaign, setFilterCampaign] = useState("all");
 const [postSearch, setPostSearch] = useState("");
 const [sortBy, setSortBy] = useState("time");
 // Calendar view filters (independent from the Posts view filters).
 const [calPlatform, setCalPlatform] = useState("all");
 const [calStatus, setCalStatus] = useState("all");
 const [calContentJob, setCalContentJob] = useState("all");
 const [calCampaign, setCalCampaign] = useState("all");
 const [calPillar, setCalPillar] = useState("all");
 // Instagram Grid controls.
 const [gridPreviewFrom, setGridPreviewFrom] = useState("");
 const [gridCampaign, setGridCampaign] = useState("all");
 const [selectedPostIds, setSelectedPostIds] = useState([]);
 const [bulkScheduleDate, setBulkScheduleDate] = useState("");
 const [bulkScheduling, setBulkScheduling] = useState(false);
 const [publishingId, setPublishingId] = useState(null);
 const [recycleBusy, setRecycleBusy] = useState(false);
 const [syncingProfile, setSyncingProfile] = useState(false);
 const [connections, setConnections] = useState({});
 const [connectionsLoading, setConnectionsLoading] = useState(false);
 const [actionBusyPlatform, setActionBusyPlatform] = useState("");
 const [pinterestBoards, setPinterestBoards] = useState([]);
 const [pinterestBoardsLoading, setPinterestBoardsLoading] = useState(false);
 const [gbpLocations, setGbpLocations] = useState([]);
 const [gbpLocationsLoading, setGbpLocationsLoading] = useState(false);
 const [routing, setRouting] = useState(null);
 const [routingLoading, setRoutingLoading] = useState(false);
 const routingMode = routing?.mode || "direct";

 // Backwards-compatible aliases for the existing IG-only sync UI.
 const igConnection =
 connections.instagram ||
 (routing?.zernio?.connected_platforms || []).find((c) => c.platform === "instagram") ||
 (routing?.ayrshare?.connected_platforms || []).find((c) => c.platform === "instagram") ||
 null;
 const igConnectionLoading = connectionsLoading;
 const igActionBusy = actionBusyPlatform === "instagram";
 const [gridProfile, setGridProfile] = useState({
 handle: "yourbrand",
 display_name: "Your Brand",
 category: "Brand / Business",
 bio_line_1: "Write a clear brand promise",
 bio_line_2: "Show what you help people do",
 bio_line_3: "Add a simple CTA or offer",
 website: "yourbrand.com",
 avatar_url: "",
 posts_count: 0,
 followers_count: 0,
 following_count: 0,
 });

 const [confirm, setConfirm] = useState(null);
 const [confirmBusy, setConfirmBusy] = useState(false);
 const [toast, setToast] = useState(null);

 const showToast = (message, tone = "success", duration = 2500) => setToast({ message, tone, duration });

 useEffect(() => {
 if (!toast) return undefined;
 const id = setTimeout(() => setToast(null), toast.duration || 2500);
 return () => clearTimeout(id);
 }, [toast]);

 const closePostModal = () => {
 setShowModal(null);
 setSelectedBrandAsset(null);
 setZuriChatOpen(false);
 if (surfaceParam === "create") {
 navigate("/social-media-manager?surface=publish", { replace: true });
 }
 };

 useEffect(() => {
 const allowed = new Set(["create", "plan", "grid", "publish", "linkhub", "posts"]);
 if (!surfaceParam || !allowed.has(surfaceParam)) return;

 if (surfaceParam === "create") {
 setActiveView("publish");
 setSelectedPlatforms((prev) => (prev.length ? prev : ["instagram"]));
 setFormData((d) => ({ ...d, platform: d.platform || "instagram" }));
 setShowModal("post");
 return;
 }

 const mapped =
 surfaceParam === "plan"
 ? "publish"
 : surfaceParam === "linkhub"
 ? "posts"
 : surfaceParam;

 setActiveView(mapped);
 // Only sync from URL on URL changes — do NOT depend on activeView/showModal/selectedPlatforms,
 // otherwise this effect re-runs after every user-initiated tab click and reverts it.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [surfaceParam]);

 useEffect(() => {
 if (!selectedPlatforms.length) {
 if (activePlatformTab !== "") setActivePlatformTab("");
 return;
 }
 if (!selectedPlatforms.includes(activePlatformTab)) {
 setActivePlatformTab(selectedPlatforms[0]);
 }
 }, [selectedPlatforms, activePlatformTab]);

 useEffect(() => {
 try {
 const raw = localStorage.getItem(`cth-social-grid-profile:${workspaceId}`);
 if (!raw) return;
 const saved = JSON.parse(raw);
 setGridProfile((prev) => ({ ...prev, ...saved }));
 } catch (err) {
 console.error("Grid profile load error:", err);
 }
 }, [workspaceId]);

 useEffect(() => {
 try {
 localStorage.setItem(
 `cth-social-grid-profile:${workspaceId}`,
 JSON.stringify(gridProfile)
 );
 } catch (err) {
 console.error("Grid profile save error:", err);
 }
 }, [gridProfile, workspaceId]);

 const [gridSlots, setGridSlots] = useState([]);
 const [draggedGridIndex, setDraggedGridIndex] = useState(null);
 const [pendingGridSlotIndex, setPendingGridSlotIndex] = useState(null);
 const [uploadingMedia, setUploadingMedia] = useState(false);
 const [mediaPreview, setMediaPreview] = useState([]);
 const mediaInputRef = useRef(null);
 const gridSlotFileInputRef = useRef(null);
 const gridAvatarInputRef = useRef(null);

 const currentYear = currentDate.getFullYear();
 const currentMonth = currentDate.getMonth() + 1;

 useEffect(() => {
 if (!workspaceId) return;
 void fetchAllData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [currentYear, currentMonth, workspaceId]);

 useEffect(() => {
 if (!workspaceId) return;
 void loadAllConnections();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [workspaceId]);

 useEffect(() => {
 const params = new URLSearchParams(location.search);
 let matchedPlatform = null;
 let status = null;

 const aggregatorKeys = [
 { urlKey: "zernio_connect", label: "Zernio" },
 { urlKey: "ayrshare_connect", label: "Ayrshare" },
 ];
 for (const v of aggregatorKeys) {
 const value = params.get(v.urlKey);
 if (value) {
 if (value === "success") {
 const platform = params.get("platform");
 showToast(
 platform
 ? `${v.label} connected · ${platform} ready`
 : `${v.label} connected`
 );
 void loadAllConnections();
 } else if (value === "error") {
 const detail = params.get("reason") || params.get("detail") || "Connection failed";
 showToast(`${v.label} connect failed: ${detail}`, "error");
 }
 const cleaned = new URLSearchParams(location.search);
 cleaned.delete(v.urlKey);
 ["platform", "reason", "detail"].forEach((k) => cleaned.delete(k));
 const qs = cleaned.toString();
 navigate(`${location.pathname}${qs ? `?${qs}` : ""}`, { replace: true });
 return;
 }
 }

 for (const platform of SOCIAL_CONNECT_PLATFORMS) {
 const value = params.get(platform.urlKey);
 if (value) {
 matchedPlatform = platform;
 status = value;
 break;
 }
 }

 if (!matchedPlatform || !status) return;

 if (status === "success") {
 const username = params.get("username") || params.get("page") || params.get("name") || params.get("account");
 showToast(
 username
 ? `${matchedPlatform.label} connected as ${username}`
 : `${matchedPlatform.label} connected`
 );
 void loadAllConnections();
 } else if (status === "error") {
 const detail = params.get("detail") || params.get("reason") || "Connection failed";
 showToast(`${matchedPlatform.label} connect failed: ${detail}`, "error");
 }

 const cleaned = new URLSearchParams(location.search);
 SOCIAL_CONNECT_PLATFORMS.forEach((p) => cleaned.delete(p.urlKey));
 ["username", "page", "name", "account", "reason", "detail"].forEach((k) => cleaned.delete(k));
 const qs = cleaned.toString();
 navigate(`${location.pathname}${qs ? `?${qs}` : ""}`, { replace: true });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [location.search]);

 const [activeCampaignId, setActiveCampaignId] = useState(() => handoff?.campaignId || null);
 const [activeCampaignName, setActiveCampaignName] = useState(() => handoff?.campaignName || null);

 const [showCampaignDrawer, setShowCampaignDrawer] = useState(false);
 const [drawerCampaigns, setDrawerCampaigns] = useState([]);
 const [drawerCampaignsLoading, setDrawerCampaignsLoading] = useState(false);
 const [drawerSelectedCampaignId, setDrawerSelectedCampaignId] = useState(null);
 const [drawerContent, setDrawerContent] = useState([]);
 const [drawerMedia, setDrawerMedia] = useState([]);
 const [drawerSelectedContentId, setDrawerSelectedContentId] = useState(null);
 const [drawerSelectedMediaIds, setDrawerSelectedMediaIds] = useState([]);
 const [drawerLoading, setDrawerLoading] = useState(false);
 // Brand Assets tab inside the media picker drawer. Selection only holds the
 // asset in composer state (asset_id + url); no persistence / generate call yet.
 const [drawerTab, setDrawerTab] = useState("campaign"); // 'campaign' | 'brand_assets'
 const [brandAssets, setBrandAssets] = useState([]);
 const [brandAssetsLoading, setBrandAssetsLoading] = useState(false);
 const [selectedBrandAsset, setSelectedBrandAsset] = useState(null); // { asset_id, url, label }
 // Vision copy generation from the selected brand asset. Disabled + spinner while
 // in flight so the (paid) call can't double-fire.
 const [captionFromAssetLoading, setCaptionFromAssetLoading] = useState(false);

 useEffect(() => {
 if (!handoff) return;
 const pf = handoff.prefillContent;
 const pt = handoff.prefillTitle;
 const cid = handoff.contentItemId;
 const camp = handoff.campaignId;
 const campName = handoff.campaignName;
 if (!pf && !pt && !cid && !camp) return;

 if (camp) {
 setActiveCampaignId(camp);
 if (campName) setActiveCampaignName(campName);
 }
 setFormData((prev) => ({
 ...prev,
 ...(pf ? { content: pf } : {}),
 ...(pt ? { title: pt } : {}),
 ...(cid ? { content_item_id: cid } : {}),
 ...(camp ? { campaign_id: camp } : {}),
 }));
 if (pf || pt) {
 setShowModal("post");
 if (!selectedPlatforms.length) setSelectedPlatforms(["instagram"]);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [handoff?.prefillContent, handoff?.prefillTitle, handoff?.contentItemId, handoff?.campaignId, handoff?.campaignName]);

 useEffect(() => {
 if (!handoff?.campaignId || !Array.isArray(handoff?.contentPlan) || !handoff.contentPlan.length) return;

 const firstItem = handoff.contentPlan[0] || {};
 const platformLower = String(firstItem.platform || "").toLowerCase();
 const normalizedPlatform = platformLower.includes("linkedin")
 ? "linkedin"
 : platformLower.includes("instagram")
 ? "instagram"
 : platformLower.includes("facebook")
 ? "facebook"
 : platformLower.includes("tiktok")
 ? "tiktok"
 : "instagram";

 setActiveView("publish");
 setShowModal("post");
 setSelectedPlatforms([normalizedPlatform]);
 setFormData((prev) => ({
 ...prev,
 campaign_id: handoff.campaignId || "",
 title: handoff.campaignName || "",
 topic: firstItem.topic || handoff.offerName || handoff.campaignName || "",
 platform: normalizedPlatform,
 content: prev.content || "",
 scheduled_date: prev.scheduled_date || new Date().toISOString().slice(0, 10),
 media_urls: prev.media_urls || [],
 }));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [handoff]);

 async function fetchAllData(opts = {}) {
 const { silent = false } = opts;
 if (silent) setRefreshing(true);
 else setLoading(true);

 try {
 const [postsRes, calRes, platRes, anaRes] = await Promise.all([
 apiClient.get("/api/social/posts", { params: { limit: 50 } }),
 apiClient.get("/api/social/posts/calendar", {
 params: { year: currentYear, month: currentMonth },
 }),
 apiClient.get("/api/social/platforms"),
 apiClient.get("/api/social/analytics"),
 ]);

 const fetchedPosts = postsRes?.posts || [];
 setPosts(fetchedPosts);
 setCalendarData(calRes?.calendar || {});
 setPlatforms(platRes?.platforms || []);
 setAnalytics(anaRes || null);
 return { posts: fetchedPosts };
 } catch (err) {
 console.error("Social fetch error:", err);
 setPosts([]);
 setCalendarData({});
 setPlatforms([]);
 setAnalytics(null);
 if (silent) showToast("Could not refresh social data", "error");
 return { posts: [] };
 } finally {
 setLoading(false);
 setRefreshing(false);
 }
 }

 async function openCampaignDrawer() {
 setShowCampaignDrawer(true);
 setDrawerCampaignsLoading(true);
 setDrawerSelectedCampaignId(null);
 setDrawerContent([]);
 setDrawerMedia([]);
 setDrawerSelectedContentId(null);
 setDrawerSelectedMediaIds([]);
 try {
 const res = await apiClient.get('/api/campaigns', {
 params: { user_id: currentWorkspace?.user_id || '', workspace_id: workspaceId },
 });
 setDrawerCampaigns(res?.campaigns || []);
 } catch (err) {
 console.error('Failed to load campaigns for drawer:', err);
 setDrawerCampaigns([]);
 showToast("Could not load campaigns", "error");
 } finally {
 setDrawerCampaignsLoading(false);
 }
 }

 async function loadBrandAssets() {
 if (!workspaceId) return;
 setBrandAssetsLoading(true);
 try {
 const res = await apiClient.get('/api/media-upload/assets', {
 params: { context: 'brand_asset', workspace_id: workspaceId },
 });
 setBrandAssets(Array.isArray(res?.assets) ? res.assets : []);
 } catch (err) {
 console.error('Failed to load brand assets for drawer:', err);
 setBrandAssets([]);
 showToast("Could not load brand assets", "error");
 } finally {
 setBrandAssetsLoading(false);
 }
 }

 function openDrawerTab(tab) {
 setDrawerTab(tab);
 if (tab === "brand_assets" && brandAssets.length === 0) loadBrandAssets();
 }

 // Direct entry point from the composer Media section: opens the picker drawer
 // straight onto the Brand Assets tab (and loads campaigns for the other tab).
 function openBrandAssetPicker() {
 setDrawerTab("brand_assets");
 loadBrandAssets();
 openCampaignDrawer();
 }

 async function selectDrawerCampaign(campaign) {
 if (!campaign?.id) return;
 setDrawerSelectedCampaignId(campaign.id);
 setDrawerSelectedContentId(null);
 setDrawerSelectedMediaIds([]);
 setDrawerLoading(true);
 try {
 const [contentRes, mediaRes] = await Promise.allSettled([
 apiClient.get('/api/persist/content/library', {
 params: {
 user_id: currentWorkspace?.user_id || '',
 workspace_id: workspaceId,
 campaign_id: campaign.id,
 },
 }),
 apiClient.get(`/api/media/campaign/${campaign.id}`),
 ]);
 const allContent = contentRes.status === 'fulfilled' ? (contentRes.value?.items || contentRes.value?.content || []) : [];
 setDrawerContent(allContent.filter((it) => it.campaign_id === campaign.id));
 setDrawerMedia(mediaRes.status === 'fulfilled' ? (mediaRes.value?.media || []) : []);
 } catch (err) {
 console.error('Failed to load campaign assets for drawer:', err);
 showToast("Could not load campaign assets", "error");
 } finally {
 setDrawerLoading(false);
 }
 }

 function applyDrawerSelections() {
 const selectedCampaign = drawerCampaigns.find((c) => c.id === drawerSelectedCampaignId);
 const selectedContent = drawerContent.find((c) => c.id === drawerSelectedContentId);
 const selectedMediaItems = drawerMedia.filter((m) => drawerSelectedMediaIds.includes(m.asset_id || m.id));
 const mediaUrls = selectedMediaItems
 .map((m) => m.preview_url || m.file_url || m.url || '')
 .filter(Boolean);
 const mediaIds = selectedMediaItems.map((m) => m.asset_id || m.id).filter(Boolean);

 if (selectedCampaign) {
 setActiveCampaignId(selectedCampaign.id);
 setActiveCampaignName(selectedCampaign.name || null);
 }

 setFormData((prev) => ({
 ...prev,
 campaign_id: selectedCampaign?.id || prev.campaign_id || null,
 content: selectedContent?.content || prev.content || '',
 title: selectedContent?.title || prev.title || '',
 content_item_id: selectedContent?.id || prev.content_item_id || null,
 media_urls: [...(prev.media_urls || []), ...mediaUrls],
 media_asset_ids: [...(prev.media_asset_ids || []), ...mediaIds],
 }));

 if (!selectedPlatforms.length) setSelectedPlatforms(['instagram']);
 setShowCampaignDrawer(false);
 setShowModal('post');
 }

 const activePlatformKey = activePlatformTab || formData.platform || selectedPlatforms[0] || "instagram";
 const activePlatformData = platformContent[activePlatformKey] || {};
 const charLimit = PLATFORM_CFG[activePlatformKey]?.limit || 2200;
 const charCount = (activePlatformData.content || formData.content || "").length;

 const overLimitPlatforms = useMemo(() => {
 return selectedPlatforms.filter((pid) => {
 const limit = PLATFORM_CFG[pid]?.limit || 2200;
 const content = (platformContent[pid]?.content) || (pid === activePlatformKey ? (formData.content || "") : "");
 return content.length > limit;
 });
 }, [selectedPlatforms, platformContent, formData.content, activePlatformKey]);

 const canSavePost =
 selectedPlatforms.length > 0 &&
 (Object.values(platformContent).some((entry) => entry?.content) ||
 formData.content || formData.topic || formData.title) &&
 overLimitPlatforms.length === 0;

 // Merge the picked brand asset into a post's media_urls so it persists to the
 // backend and flows to the publish dispatch. Spread-first + deduped: with no
 // asset selected this returns the base array unchanged, so asset-less posts and
 // any already-uploaded media are untouched.
 const mediaUrlsWithAsset = (base) => {
 const urls = [...(base || [])];
 if (selectedBrandAsset?.url && !urls.includes(selectedBrandAsset.url)) {
 urls.push(selectedBrandAsset.url);
 }
 return urls;
 };

 async function handleCreatePost() {
 setSavingPost(true);
 try {
 if (editingPostId) {
 const postData = {
 ...formData,
 media_urls: mediaUrlsWithAsset(formData.media_urls),
 cta_url: formData.cta_url || "",
 link_in_bio_url: formData.link_in_bio_url || "",
 content: activePlatformData.content || formData.content || "",
 hashtags: activePlatformData.hashtags || formData.hashtags || [],
 platform: formData.platform || activePlatformKey || "instagram",
 campaign_id: formData.campaign_id || activeCampaignId || null,
 content_item_id: formData.content_item_id || null,
 media_asset_ids: formData.media_asset_ids || [],
 platform_extra: formData.platform_extra || {},
 };
 // status is derived server-side on update. Sending it here is what re-armed
 // published posts for the scheduler; the server ignores it now, and we
 // should not pretend to set it.
 delete postData.status;

 await apiClient.put(`/api/social/posts/${editingPostId}`, postData);
 showToast("Post updated");

 closePostModal();
 setEditingPostId(null);
 setFormData({});
 setSelectedPlatforms([]);
 setActivePlatformTab("instagram");
 setPlatformContent({});
 setMediaPreview([]);
 setSelectedBrandAsset(null);
 await fetchAllData({ silent: true });
 } else {
 const platformsToSave = selectedPlatforms.length
 ? selectedPlatforms
 : [formData.platform || "instagram"];

 const responses = await Promise.all(
 platformsToSave.map((platformId) => {
 const platformData = platformContent[platformId] || {};
 const postData = {
 ...formData,
 platform: platformId,
 content: platformData.content || formData.content || "",
 hashtags: platformData.hashtags || formData.hashtags || [],
 media_urls: mediaUrlsWithAsset(formData.media_urls),
 cta_url: formData.cta_url || "",
 link_in_bio_url: formData.link_in_bio_url || "",
 campaign_id: formData.campaign_id || activeCampaignId || null,
 content_item_id: formData.content_item_id || null,
 media_asset_ids: formData.media_asset_ids || [],
 platform_extra: formData.platform_extra || {},
 // POST /posts still takes status (only PUT derives it), and the schedule
 // input no longer sets it — so derive it here from the one thing it
 // actually depends on.
 status: formData.scheduled_for ? "scheduled" : "draft",
 };

 return apiClient.post("/api/social/posts", postData);
 })
 );
 showToast(`${platformsToSave.length} post${platformsToSave.length === 1 ? "" : "s"} saved`);

 // Capture new post ID(s) — defensive against varying response shapes
 const newIds = responses
 .map((r) => r?.post?.id || r?.id || r?.data?.post?.id || r?.data?.id)
 .filter(Boolean);

 const fetchResult = await fetchAllData({ silent: true });
 const fetchedPosts = fetchResult?.posts || [];

 // Single new post → re-open in edit mode so user can finalize.
 // Multi-platform → close modal, switch to Posts view (newest first).
 if (platformsToSave.length === 1 && newIds.length === 1) {
 const newPost = fetchedPosts.find((p) => String(p.id) === String(newIds[0]));
 if (newPost) {
 if (surfaceParam === "create") {
 navigate("/social-media-manager?surface=publish", { replace: true });
 }
 handleEditPost(newPost);
 return;
 }
 }

 closePostModal();
 setEditingPostId(null);
 setFormData({});
 setSelectedPlatforms([]);
 setActivePlatformTab("instagram");
 setPlatformContent({});
 setMediaPreview([]);
 setSelectedBrandAsset(null);
 setActiveView("posts");
 }
 } catch (err) {
 console.error("Create post error:", err);
 showToast("Could not save post", "error");
 } finally {
 setSavingPost(false);
 }
 }

 async function handleBulkSchedule() {
 if (!selectedPostIds.length || !bulkScheduleDate) return;

 // Never re-schedule something already published or in flight. The server
 // refuses to recompute their status anyway, but sending the PUT at all would
 // silently do nothing and report success.
 const schedulableIds = selectedPostIds.filter((id) => {
 const post = posts.find((p) => p.id === id);
 return post && !isPublishLocked(post);
 });

 if (!schedulableIds.length) {
 showToast("Those posts are already published — nothing to schedule", "error");
 return;
 }

 setBulkScheduling(true);
 try {
 await Promise.all(
 schedulableIds.map((id) =>
 // status is derived server-side from scheduled_for.
 apiClient.put(`/api/social/posts/${id}`, {
 scheduled_for: new Date(bulkScheduleDate).toISOString(),
 })
 )
 );

 const count = schedulableIds.length;
 setSelectedPostIds([]);
 setBulkScheduleDate("");
 await fetchAllData({ silent: true });
 showToast(`${count} post${count === 1 ? "" : "s"} scheduled`);
 } catch (err) {
 console.error("Bulk schedule error:", err);
 showToast("Bulk scheduling failed", "error");
 } finally {
 setBulkScheduling(false);
 }
 }

 function handleRecycleTopPost() {
 setRecycleBusy(true);
 try {
 const ranked = [...posts].sort((a, b) => {
 const aScore =
 Number(a.engagement_rate || 0) +
 Number(a.clicks || 0) +
 Number(a.likes || 0) +
 Number(a.comments || 0) +
 Number(a.shares || 0);

 const bScore =
 Number(b.engagement_rate || 0) +
 Number(b.clicks || 0) +
 Number(b.likes || 0) +
 Number(b.comments || 0) +
 Number(b.shares || 0);

 return bScore - aScore;
 });

 const sourcePost =
 ranked.find((post) => post.status === "published") ||
 ranked.find((post) => post.status === "scheduled") ||
 ranked[0];

 if (!sourcePost) {
 showToast("No posts available to recycle yet", "error");
 return;
 }

 openAsDraftCopy(sourcePost, { recycle: true });
 } finally {
 setRecycleBusy(false);
 }
 }

 // Open a copy of an existing post as a brand-new draft. editingPostId stays
 // null, so saving POSTs a fresh row — no platform_post_id, no published_at,
 // status draft. This is the only sanctioned way to act on a published post:
 // its content is already live and cannot be edited from here, but wanting a
 // variant of it is the real intent behind trying to edit one.
 function openAsDraftCopy(sourcePost, { recycle = false } = {}) {
 if (!sourcePost) return;
 setShowModal("post");
 setEditingPostId(null);
 setSelectedPlatforms([sourcePost.platform || "instagram"]);
 setPlatformContent({});
 setFormData({
 title: sourcePost.title || sourcePost.topic || "",
 topic: sourcePost.topic || sourcePost.title || "",
 platform: sourcePost.platform || "instagram",
 content: sourcePost.content || "",
 hashtags: sourcePost.hashtags || [],
 media_urls: sourcePost.media_urls || [],
 media_asset_ids: sourcePost.media_asset_ids || [],
 first_comment: sourcePost.first_comment || "",
 cta_url: sourcePost.cta_url || "",
 link_in_bio_url: sourcePost.link_in_bio_url || "",
 campaign_id: sourcePost.campaign_id || null,
 content_item_id: sourcePost.content_item_id || null,
 platform_extra: sourcePost.platform_extra || {},
 // A copy is never born scheduled — the user picks a new time deliberately.
 scheduled_for: null,
 status: "draft",
 recycled_from_post_id: sourcePost.id,
 recycle_mode: recycle,
 duplicate_mode: !recycle,
 });
 setMediaPreview(
 (sourcePost.media_urls || []).map((url, i) => ({
 url,
 name: `${recycle ? "recycled" : "copy"}-${i + 1}`,
 type: "image",
 }))
 );
 }

 async function handleMediaUpload(event) {
 const files = event.target.files;
 if (!files?.length) return;

 setUploadingMedia(true);

 try {
 const newUrls = [...(formData.media_urls || [])];
 const newPreviews = [...mediaPreview];

 for (const file of files) {
 const fd = new FormData();
 fd.append("file", file);

 const res = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 newUrls.push(res.file_url);
 newPreviews.push({
 url: res.file_url,
 name: file.name,
 type: res.media_type,
 });
 }

 setFormData((d) => ({ ...d, media_urls: newUrls }));
 setMediaPreview(newPreviews);
 } catch (err) {
 console.error("Upload error:", err);
 showToast("Media upload failed", "error");
 } finally {
 setUploadingMedia(false);
 if (mediaInputRef.current) mediaInputRef.current.value = "";
 }
 }

 async function handleGridFileDrop(event, slotIndex) {
 event.preventDefault();

 const file = event.dataTransfer?.files?.[0];
 if (!file) {
 handleGridDrop(slotIndex);
 return;
 }

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 showToast("Please drop an image file for Instagram grid planning", "error");
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 await apiClient.post("/api/social/posts", {
 platform: "instagram",
 content: "",
 topic: file.name.replace(/\.[^.]+$/, ""),
 media_urls: [uploadRes.file_url],
 status: "draft",
 hashtags: [],
 });

 await fetchAllData({ silent: true });
 showToast("Image added to grid");
 } catch (err) {
 console.error("Grid file drop upload error:", err);
 showToast("Could not add image to grid", "error");
 }
 }

 async function handleGridSlotFileSelect(event) {
 const file = event.target.files?.[0];
 if (!file) return;

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 showToast("Please choose an image file for Instagram grid planning", "error");
 if (gridSlotFileInputRef.current) gridSlotFileInputRef.current.value = "";
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 await apiClient.post("/api/social/posts", {
 platform: "instagram",
 content: "",
 topic: file.name.replace(/\.[^.]+$/, ""),
 media_urls: [uploadRes.file_url],
 status: "draft",
 hashtags: [],
 });

 await fetchAllData({ silent: true });
 showToast("Image added to grid");
 } catch (err) {
 console.error("Grid slot file select upload error:", err);
 showToast("Could not add image to grid", "error");
 } finally {
 setPendingGridSlotIndex(null);
 if (gridSlotFileInputRef.current) gridSlotFileInputRef.current.value = "";
 }
 }

 async function handleGridAvatarSelect(event) {
 const file = event.target.files?.[0];
 if (!file) return;

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 showToast("Please choose an image file for the avatar", "error");
 if (gridAvatarInputRef.current) gridAvatarInputRef.current.value = "";
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 setGridProfile((prev) => ({
 ...prev,
 avatar_url: uploadRes.file_url,
 }));
 showToast("Avatar updated");
 } catch (err) {
 console.error("Grid avatar upload error:", err);
 showToast("Could not upload avatar image", "error");
 } finally {
 if (gridAvatarInputRef.current) gridAvatarInputRef.current.value = "";
 }
 }

 async function loadRouting() {
 setRoutingLoading(true);
 try {
 const res = await apiClient.get("/api/social/zernio/connection");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setRouting(payload?.routing || null);
 } catch (err) {
 console.warn("Could not load routing config:", err);
 setRouting(null);
 } finally {
 setRoutingLoading(false);
 }
 }

 async function loadAllConnections() {
 setConnectionsLoading(true);
 try {
 await loadRouting();
 // Direct-mode connections come from per-platform endpoints.
 const results = await Promise.allSettled(
 SOCIAL_CONNECT_PLATFORMS.map((p) =>
 apiClient.get(`/api/social/${p.key}/connection`)
 )
 );
 const next = {};
 SOCIAL_CONNECT_PLATFORMS.forEach((p, idx) => {
 const r = results[idx];
 if (r.status === "fulfilled") {
 const payload = r.value?.data && typeof r.value.data === "object" ? r.value.data : r.value;
 next[p.key] = payload?.connection || null;
 } else {
 next[p.key] = null;
 }
 });
 setConnections(next);
 } finally {
 setConnectionsLoading(false);
 }
 }

 // Resolve connection state for a platform across all routing modes.
 function getPlatformConnection(platformKey) {
 if (routingMode === "direct") {
 return connections[platformKey] || null;
 }
 const vendorBlock = routing?.[routingMode] || {};
 const list = vendorBlock.connected_platforms || [];
 return list.find((c) => c.platform === platformKey) || null;
 }

 async function loadIgConnection() {
 // Refresh just the IG entry; used after explicit IG callbacks.
 try {
 const res = await apiClient.get("/api/social/instagram/connection");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setConnections((prev) => ({ ...prev, instagram: payload?.connection || null }));
 } catch (err) {
 console.warn("Could not load IG connection status:", err);
 }
 }

 const linkedFacebookPageName =
 igConnection?.extra?.page_name || igConnection?.extra?.page_id || null;

 async function handleConnectPlatform(platformKey) {
 console.log("connect start:", { platformKey, routingMode });
 setActionBusyPlatform(platformKey);
 try {
 let url = null;
 if (routingMode === "zernio") {
 const res = await apiClient.post("/api/social/zernio/connect", { platform: platformKey });
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 url = payload?.authorize_url;
 } else if (routingMode === "ayrshare") {
 const res = await apiClient.post("/api/social/ayrshare/connect", { platforms: [platformKey] });
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 url = payload?.authorize_url;
 } else {
 const res = await apiClient.post(`/api/social/${platformKey}/connect`);
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 url = payload?.authorize_url;
 }
 if (!url) {
 throw new Error("Connect endpoint did not return an authorize URL.");
 }
 console.log("connect response:", { platformKey, routingMode, authorize_url: url });
 window.location.href = url;
 } catch (err) {
 console.error(`${platformKey} connect error:`, err);
 const detail = err?.payload?.detail || err?.message;
 const platformLabel =
 SOCIAL_CONNECT_PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 if (err?.status === 500 && /not configured/i.test(detail || "")) {
 showToast(`${platformLabel} OAuth is not configured on the backend yet.`, "error", 8000);
 } else {
 showToast(detail || `Could not start ${platformLabel} connect flow`, "error", 8000);
 }
 } finally {
 setActionBusyPlatform("");
 }
 }

 async function handleDisconnectPlatform(platformKey) {
 setActionBusyPlatform(platformKey);
 try {
 if (routingMode === "zernio") {
 await apiClient.delete(`/api/social/zernio/disconnect?platform=${encodeURIComponent(platformKey)}`);
 } else if (routingMode === "ayrshare") {
 await apiClient.delete(`/api/social/ayrshare/disconnect?platform=${encodeURIComponent(platformKey)}`);
 } else {
 await apiClient.delete(`/api/social/${platformKey}/disconnect`);
 if (platformKey === "instagram") {
 setConnections((prev) => ({ ...prev, facebook: null }));
 }
 }
 setConnections((prev) => ({ ...prev, [platformKey]: null }));
 await loadRouting();
 const platformLabel =
 SOCIAL_CONNECT_PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 showToast(`${platformLabel} disconnected`);
 } catch (err) {
 const detail = err?.response?.data?.detail || err?.message;
 const platformLabel =
 SOCIAL_CONNECT_PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 showToast(detail || `Could not disconnect ${platformLabel}`, "error");
 } finally {
 setActionBusyPlatform("");
 }
 }

 async function handleSetRoutingMode(nextMode) {
 if (nextMode === routingMode) return;
 try {
 // Switching to direct: just clear the aggregator's local cache.
 // Switching to zernio/ayrshare: the first /connect call will set the mode.
 if (nextMode === "direct") {
 // No backend mutation needed; the next direct-mode connect proceeds normally.
 setRouting((prev) => prev ? { ...prev, mode: "direct" } : { mode: "direct" });
 showToast("Routing mode set to Direct.");
 return;
 }
 // Provision/ensure the aggregator profile by hitting /connect with no platform —
 // both vendor /connect endpoints set mode in the backend before returning.
 // We don't redirect though — just toast and let the user click a platform.
 setRouting((prev) => prev ? { ...prev, mode: nextMode } : { mode: nextMode });
 showToast(`Routing mode set to ${nextMode === "zernio" ? "Zernio" : "Ayrshare"}. Click a platform to connect.`);
 } catch (err) {
 const detail = err?.response?.data?.detail || err?.message;
 showToast(detail || "Could not change routing mode.", "error");
 }
 }

 // Compatibility shims so existing IG-specific buttons keep working.
 const handleConnectInstagram = () => handleConnectPlatform("instagram");
 const handleDisconnectInstagram = () => handleDisconnectPlatform("instagram");

 async function loadPinterestBoards() {
 if (!connections.pinterest) return;
 setPinterestBoardsLoading(true);
 try {
 const res = await apiClient.get("/api/social/pinterest/boards");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setPinterestBoards(payload?.boards || []);
 } catch (err) {
 console.warn("Could not load Pinterest boards:", err);
 setPinterestBoards([]);
 } finally {
 setPinterestBoardsLoading(false);
 }
 }

 async function loadGbpLocations() {
 if (!connections.google_business) return;
 setGbpLocationsLoading(true);
 try {
 const res = await apiClient.get("/api/social/google_business/locations");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setGbpLocations(payload?.locations || []);
 } catch (err) {
 console.warn("Could not load Google Business locations:", err);
 setGbpLocations([]);
 } finally {
 setGbpLocationsLoading(false);
 }
 }

 useEffect(() => {
 if (showModal !== "post") return;
 if (selectedPlatforms.includes("pinterest") && connections.pinterest && !pinterestBoards.length) {
 void loadPinterestBoards();
 }
 if (selectedPlatforms.includes("google_business") && connections.google_business && !gbpLocations.length) {
 void loadGbpLocations();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [showModal, selectedPlatforms, connections.pinterest, connections.google_business]);

 async function handleSyncInstagramProfile() {
 setSyncingProfile(true);
 try {
 const res = await apiClient.get("/api/social/instagram/profile");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 const profile = payload?.profile || payload;

 const username = profile?.username || profile?.handle || "";
 const displayName = profile?.name || profile?.display_name || profile?.full_name || "";
 const biography = profile?.biography || profile?.bio || "";
 const avatarUrl = profile?.profile_picture_url || profile?.avatar_url || profile?.profile_pic || "";
 const website = profile?.website || profile?.external_url || "";
 const followersCount = Number(profile?.followers_count ?? profile?.followers ?? 0);
 const followingCount = Number(
 profile?.follows_count ?? profile?.following_count ?? profile?.following ?? 0
 );
 const mediaCount = Number(profile?.media_count ?? profile?.posts_count ?? profile?.posts ?? 0);

 const bioLines = String(biography || "").split(/\r?\n/).filter((line) => line.trim().length);

 if (!username && !displayName && !biography && !avatarUrl) {
 showToast("Instagram returned an empty profile", "error");
 return;
 }

 setGridProfile((prev) => ({
 ...prev,
 handle: username || prev.handle,
 display_name: displayName || prev.display_name,
 bio_line_1: bioLines[0] || prev.bio_line_1,
 bio_line_2: bioLines[1] || prev.bio_line_2,
 bio_line_3: bioLines[2] || prev.bio_line_3,
 avatar_url: avatarUrl || prev.avatar_url,
 website: website || prev.website,
 posts_count: mediaCount || prev.posts_count,
 followers_count: followersCount || prev.followers_count,
 following_count: followingCount || prev.following_count,
 }));

 showToast("Profile synced from Instagram");
 } catch (err) {
 console.error("Instagram sync error:", err);
 const status = err?.response?.status;
 const detail = err?.response?.data?.detail || err?.message;
 if (status === 404) {
 showToast("Instagram sync isn't available yet — connect your account first.", "error");
 } else if (status === 401 || status === 403) {
 showToast("Instagram account is not connected.", "error");
 } else {
 showToast(detail || "Could not sync from Instagram", "error");
 }
 } finally {
 setSyncingProfile(false);
 }
 }

 function removeMedia(index) {
 const urls = [...(formData.media_urls || [])];
 urls.splice(index, 1);

 const previews = [...mediaPreview];
 previews.splice(index, 1);

 setFormData((d) => ({ ...d, media_urls: urls }));
 setMediaPreview(previews);
 }

 function removeHashtag(tag) {
 const currentTags = activePlatformData.hashtags || formData.hashtags || [];
 const next = currentTags.filter((t) => t !== tag);
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 hashtags: next,
 },
 }));
 setFormData((d) => ({ ...d, hashtags: next }));
 }

 const requestDeletePost = (post) => {
 setConfirm({
 kind: "post",
 id: post.id,
 title: "Delete post?",
 body: "This will permanently delete this post. This cannot be undone.",
 confirmLabel: "Delete",
 });
 };

 const requestResetGrid = () => {
 const filled = gridSlots.filter((p) => !p?.isEmpty && p?.id);
 if (!filled.length) return;
 setConfirm({
 kind: "grid",
 ids: filled.map((p) => p.id),
 title: "Reset Instagram grid?",
 body: `This will permanently delete all ${filled.length} planned post${filled.length === 1 ? "" : "s"} in the grid. This cannot be undone.`,
 confirmLabel: "Reset",
 });
 };

 const cancelConfirm = () => {
 if (confirmBusy) return;
 setConfirm(null);
 };

 const requestPublishPost = (post) => {
 if (!post?.id) return;
 setConfirm({
 kind: "publish",
 id: post.id,
 title: "Publish to Instagram now?",
 body: "This post will go live on the connected account immediately. This cannot be undone.",
 confirmLabel: "Publish",
 confirmTone: "primary",
 });
 };

 const performConfirm = async () => {
 if (!confirm) return;
 setConfirmBusy(true);
 try {
 if (confirm.kind === "post") {
 await apiClient.delete(`/api/social/posts/${confirm.id}`);
 await fetchAllData({ silent: true });
 setConfirm(null);
 showToast("Post deleted");
 } else if (confirm.kind === "grid") {
 await Promise.all(confirm.ids.map((id) => apiClient.delete(`/api/social/posts/${id}`)));
 setDraggedGridIndex(null);
 await fetchAllData({ silent: true });
 setConfirm(null);
 showToast("Grid reset");
 } else if (confirm.kind === "publish") {
 await apiClient.post(`/api/social/posts/${confirm.id}/publish`, {});
 await fetchAllData({ silent: true });
 setConfirm(null);
 showToast("Post published");
 }
 } catch (err) {
 console.error("Confirm action error:", err);
 setConfirm(null);
 const errorMessages = {
 grid: "Could not reset grid",
 publish: "Could not publish post",
 post: "Could not delete post",
 };
 showToast(errorMessages[confirm.kind] || "Action failed", "error");
 } finally {
 setConfirmBusy(false);
 }
 };

 function handleEditPost(post) {
 setEditingPostId(post.id);
 setShowModal("post");
 setSelectedPlatforms([post.platform || "instagram"]);
 setFormData({
 ...post,
 media_urls: post.media_urls || [],
 hashtags: post.hashtags || [],
 first_comment: post.first_comment || "",
 cta_url: post.cta_url || "",
 link_in_bio_url: post.link_in_bio_url || "",
 recycle_mode: false,
 duplicate_mode: false,
 });
 setMediaPreview(
 (post.media_urls || []).map((url, i) => ({
 url,
 name: `media-${i + 1}`,
 type: "image",
 }))
 );
 }

 async function handlePublishPost(id) {
 setPublishingId(id);
 try {
 await apiClient.post(`/api/social/posts/${id}/publish`, {});
 await fetchAllData({ silent: true });
 showToast("Post published");
 } catch (err) {
 console.error("Publish error:", err);
 showToast("Could not publish post", "error");
 } finally {
 setPublishingId(null);
 }
 }

 // ── Ask the House (Zuri) chat in the composer ───────────────────────────────
 // A plain-text snapshot of the post being composed, so Zuri can see what you're
 // writing. Effective caption mirrors the textarea: active platform's content,
 // else the shared form field. current_draft is Optional[str] on the backend.
 function buildZuriDraft() {
 const effectiveCaption = (activePlatformData.content || formData.content || "").trim();
 const platforms = selectedPlatforms.length ? selectedPlatforms.join(", ") : activePlatformKey;
 const mediaCount = mediaPreview.length + (selectedBrandAsset ? 1 : 0);
 const parts = [`Platform(s): ${platforms}`];
 if (mediaCount) parts.push(`Media attached: ${mediaCount} item(s)`);
 parts.push(`Current caption:\n${effectiveCaption || "(nothing written yet)"}`);
 return parts.join("\n");
 }

 // "Insert into post" writes Zuri's reply into the ACTIVE platform's content and
 // mirrors the shared form field — the exact dual-write the textarea (:3373) and
 // the caption-from-asset path (:1900) use. Replaces the caption (you asked Zuri
 // to draft it), targets only the active platform, then closes the chat so the
 // updated post is visible.
 function handleZuriInsert(text) {
 const nextValue = (text || "").trim();
 if (!nextValue) return;
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 content: nextValue,
 hashtags: (prev[activePlatformKey] || {}).hashtags || formData.hashtags || [],
 },
 }));
 setFormData((d) => ({
 ...d,
 content:
 activePlatformKey === (d.platform || selectedPlatforms[0] || "instagram")
 ? nextValue
 : d.content,
 }));
 setZuriChatOpen(false);
 showToast("Zuri's draft inserted into your post.", "success");
 }

 // Vision-based copy: send the selected brand asset + the composer's active
 // platform to the backend, which looks at the image and writes on-brand copy.
 // Each call costs money, so the button is disabled while this runs.
 async function handleGenerateFromAsset() {
 if (!selectedBrandAsset?.asset_id || captionFromAssetLoading) return;

 // Empty text field: generate straight in. Existing text: confirm first.
 const existingCopy = (activePlatformData.content || formData.content || "").trim();
 if (existingCopy) {
 const proceed = window.confirm(
 "Replace the current post copy with copy generated from this asset?"
 );
 if (!proceed) return;
 }

 setCaptionFromAssetLoading(true);
 try {
 const res = await apiClient.post("/api/social/generate-caption-from-asset", {
 asset_id: selectedBrandAsset.asset_id,
 platform: activePlatformKey,
 });

 const copy = (res?.copy || "").trim();
 if (!copy) {
 showToast("No copy was returned. Please try again.", "error");
 return;
 }

 // Write into the active platform's content and mirror the shared form field,
 // exactly as the textarea onChange does.
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 content: copy,
 hashtags: (prev[activePlatformKey] || {}).hashtags || formData.hashtags || [],
 },
 }));
 setFormData((d) => ({
 ...d,
 content:
 activePlatformKey === (d.platform || selectedPlatforms[0] || "instagram")
 ? copy
 : d.content,
 }));
 showToast("Copy generated from your brand asset.", "success");
 } catch (err) {
 // 422 brand_foundation_incomplete: surface the specific missing fields,
 // not a generic error. apiClient throws a flat Error with .status/.payload.
 const detail = err?.payload?.detail;
 if (
 err?.status === 422 &&
 detail &&
 typeof detail === "object" &&
 detail.error === "brand_foundation_incomplete"
 ) {
 const missing = Array.isArray(detail.missing) ? detail.missing : [];
 const message =
 detail.message ||
 (missing.length
 ? `Complete your Brand Foundation first — missing: ${missing.join(", ")}.`
 : "Complete your Brand Foundation before generating copy from an asset.");
 showToast(message, "error", 6000);
 } else {
 console.error("caption-from-asset error:", err);
 showToast(err?.message || "Could not generate copy from this asset.", "error");
 }
 } finally {
 setCaptionFromAssetLoading(false);
 }
 }

 async function handleGenerateContent() {
 if (!formData.topic || !selectedPlatforms.length) return;

 setGenerating(true);

 try {
 const results = await Promise.all(
 selectedPlatforms.map(async (platformId) => {
 const res = await apiClient.post("/api/social/generate", {
 topic: formData.topic,
 platform: platformId,
 tone: formData.tone || "professional",
 include_hashtags: true,
 include_cta: true,
 });

 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 const content =
 payload?.generated_content ??
 payload?.content ??
 payload?.text ??
 payload?.result ??
 payload?.message ??
 "";
 const hashtags =
 payload?.hashtags ??
 payload?.tags ??
 [];

 if (!content) {
 console.warn("[social/generate] empty content for", platformId, "response:", res);
 }

 return [platformId, {
 content: typeof content === "string" ? content : "",
 hashtags: Array.isArray(hashtags) ? hashtags : [],
 }];
 })
 );

 const nextPlatformContent = Object.fromEntries(results);
 const allEmpty = Object.values(nextPlatformContent).every((entry) => !entry.content);

 setPlatformContent((prev) => ({
 ...prev,
 ...nextPlatformContent,
 }));

 const primaryPlatform = activePlatformKey || selectedPlatforms[0] || "instagram";
 const primaryData = nextPlatformContent[primaryPlatform] || nextPlatformContent[selectedPlatforms[0]] || {};

 setFormData((d) => ({
 ...d,
 platform: primaryPlatform,
 content: primaryData.content || d.content || "",
 hashtags: primaryData.hashtags?.length ? primaryData.hashtags : (d.hashtags || []),
 }));

 if (allEmpty) {
 showToast("Generator returned no content. Check the backend response.", "error");
 } else {
 showToast("Content generated");
 }
 } catch (err) {
 console.error("AI gen error:", err);
 const message =
 err?.response?.data?.detail || err?.message || "AI generation failed";
 showToast(message, "error");
 } finally {
 setGenerating(false);
 }
 }

 function navigateMonth(dir) {
 const d = new Date(currentDate);
 d.setMonth(d.getMonth() + dir);
 setCurrentDate(d);
 }

 // ----- shared calendar helpers (visual; all fed by real posts/calendarData) -----
 const openNewPost = () => {
 setSelectedPlatforms(["instagram"]);
 setFormData((d) => ({ ...d, platform: d.platform || "instagram" }));
 setShowModal("post");
 };
 // Shared predicate for the calendar toolbar filters (Platform / Status /
 // Content Job / Campaign / Pillar). Applied across month, week, and list views.
 const calFilterMatch = (post) => {
 if (!post) return false;
 if (calPlatform !== "all" && post.platform !== calPlatform) return false;
 if (calStatus !== "all" && post.status !== calStatus) return false;
 if (calContentJob !== "all" && (post.content_job || "") !== calContentJob) return false;
 if (calCampaign !== "all" && String(post.campaign_id || "") !== calCampaign) return false;
 if (calPillar !== "all" && (post.content_pillar || "") !== calPillar) return false;
 return true;
 };
 const spStatusColor = (status) =>
 status === "published" ? "#238a57"
 : status === "scheduled" ? "#7b2ca7"
 : status === "draft" ? "var(--cth-gold)"
 : "#9f7d84";
 const spTime = (raw) => {
 if (!raw) return "";
 const d = new Date(raw);
 return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
 };
 const spPlatformMark = (platform) => {
 const cfg = PLATFORM_CFG[platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 return (
 <span className="platform-mark" style={{ background: cfg.color }}>
 <Icon size={9} />
 </span>
 );
 };
 const isoDate = (d) =>
 `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

 const WEEK_SLOTS = [
 { label: "8:00 AM", h: 8 }, { label: "10:00 AM", h: 10 }, { label: "12:00 PM", h: 12 },
 { label: "2:00 PM", h: 14 }, { label: "4:00 PM", h: 16 }, { label: "6:00 PM", h: 18 },
 ];
 const weekSlotIndex = (hour) => {
 let idx = 0;
 for (let i = 0; i < WEEK_SLOTS.length; i += 1) if (hour >= WEEK_SLOTS[i].h) idx = i;
 return idx;
 };

 function renderWeekView() {
 const today = new Date(); today.setHours(0, 0, 0, 0);
 const weekStart = new Date(currentDate);
 weekStart.setDate(currentDate.getDate() - currentDate.getDay());
 weekStart.setHours(0, 0, 0, 0);
 const days = Array.from({ length: 7 }, (_, i) => {
 const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
 });
 const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
 const isToday = (d) => d.getTime() === today.getTime();

 return (
 <div className="calendar-card week-view-scroll">
 <div className="week-calendar">
 <div className="week-header-spacer"><Clock size={15} /></div>
 {days.map((d) => (
 <div className={`week-day-header${isToday(d) ? " today" : ""}`} key={isoDate(d)}>
 <span className="week-day-name">{names[d.getDay()]}</span>
 <span className="week-day-number">{d.getDate()}</span>
 </div>
 ))}
 {WEEK_SLOTS.map((slot, si) => (
 <React.Fragment key={slot.label}>
 <div className="week-time">{slot.label}</div>
 {days.map((d) => {
 const dayPosts = (calendarData[isoDate(d)] || []).filter(calFilterMatch).filter((p) => {
 const raw = p.scheduled_for || p.created_at;
 if (!raw) return si === 0;
 return weekSlotIndex(new Date(raw).getHours()) === si;
 });
 return (
 <div className={`week-slot${isToday(d) ? " is-today" : ""}`} key={isoDate(d) + si}>
 {dayPosts.length > 0 ? dayPosts.map((post, pi) => (
 <div
 key={pi}
 className="week-event"
 role="button"
 tabIndex={0}
 onClick={() => handleEditPost(post)}
 onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleEditPost(post); } }}
 >
 <div className="week-event-time">{spPlatformMark(post.platform)}{spTime(post.scheduled_for || post.created_at)}</div>
 <div className="week-event-title">{post.content?.slice(0, 50) || "Untitled"}</div>
 </div>
 )) : (
 <button type="button" className="week-empty-cta" onClick={openNewPost}>+ Add post</button>
 )}
 </div>
 );
 })}
 </React.Fragment>
 ))}
 </div>
 </div>
 );
 }

 function renderListView() {
 const groups = Object.keys(calendarData)
 .filter((dateStr) => {
 const [y, mo] = dateStr.split("-").map(Number);
 return y === currentYear && mo === currentMonth;
 })
 .sort();
 if (groups.length === 0) {
 return <div className="calendar-card"><div className="list-empty-day">No posts scheduled this month.</div></div>;
 }
 return (
 <div className="calendar-card list-calendar">
 {groups.map((dateStr) => {
 const dPosts = [...(calendarData[dateStr] || [])].filter(calFilterMatch).sort(
 (a, b) => new Date(a.scheduled_for || a.created_at || 0) - new Date(b.scheduled_for || b.created_at || 0)
 );
 if (dPosts.length === 0) return null;
 const dObj = new Date(`${dateStr}T00:00:00`);
 return (
 <section className="list-date-group" key={dateStr}>
 <div className="list-date-heading">
 <div className="list-date-day">{dObj.toLocaleDateString([], { weekday: "long" })}</div>
 <div className="list-date-number">{dObj.toLocaleDateString([], { month: "long", day: "numeric" })}</div>
 <div className="list-date-count">{dPosts.length} {dPosts.length === 1 ? "post" : "posts"}</div>
 </div>
 <div className="list-posts">
 {dPosts.map((post, pi) => {
 const st = post.status || "scheduled";
 const pillClass = st === "published" ? "published" : st === "draft" ? "approval" : "scheduled";
 const cfg = PLATFORM_CFG[post.platform] || {};
 return (
 <article
 key={pi}
 className="list-post"
 role="button"
 tabIndex={0}
 onClick={() => handleEditPost(post)}
 onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleEditPost(post); } }}
 >
 <div className="list-time">{spTime(post.scheduled_for || post.created_at)}</div>
 {spPlatformMark(post.platform)}
 <div className="list-title">
 {post.content?.slice(0, 60) || "Untitled"}
 <span className="list-subtitle">{cfg.label || post.platform}</span>
 </div>
 <span className={`status-pill ${pillClass}`}>
 <span className="status-dot" style={{ background: spStatusColor(st) }} />
 {st.charAt(0).toUpperCase() + st.slice(1)}
 </span>
 <div className="list-actions"><span className="icon-btn" aria-hidden="true"><Pencil size={13} /></span></div>
 </article>
 );
 })}
 </div>
 </section>
 );
 })}
 </div>
 );
 }

 function renderCalendarRail() {
 const now = new Date();
 const all = posts || [];
 const inMonth = all.filter((p) => {
 if (!p.scheduled_for) return false;
 const d = new Date(p.scheduled_for);
 return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
 });
 const scheduledCount = inMonth.filter((p) => p.status === "scheduled").length;
 const publishedCount = inMonth.filter((p) => p.status === "published").length;
 const upcoming = all
 .filter((p) => p.scheduled_for && new Date(p.scheduled_for) >= now)
 .sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));
 const nextUp = upcoming[0];
 const connectedCount = Object.values(connections || {}).filter(Boolean).length;
 const drafts = all.filter((p) => p.status === "draft" || !p.scheduled_for).slice(0, 5);

 return (
 <aside className="right-rail">
 <section className="panel rail-card">
 <div className="rail-card-title">This Month</div>
 <div className="focus-list">
 <div><div className="focus-label">Scheduled</div><div className="focus-value">{scheduledCount} post{scheduledCount === 1 ? "" : "s"}</div></div>
 <div><div className="focus-label">Published</div><div className="focus-value">{publishedCount} post{publishedCount === 1 ? "" : "s"}</div></div>
 <div><div className="focus-label">Next up</div><div className="focus-value">{nextUp ? `${new Date(nextUp.scheduled_for).toLocaleDateString([], { month: "short", day: "numeric" })} · ${(PLATFORM_CFG[nextUp.platform] || {}).label || nextUp.platform}` : "Nothing scheduled"}</div></div>
 <div><div className="focus-label">Connected platforms</div><div className="focus-value">{connectedCount} connected</div></div>
 </div>
 </section>
 <section className="panel rail-card">
 <div className="rail-card-title">Key Dates <button type="button" className="inline-link" onClick={openNewPost}>+ Add</button></div>
 {upcoming.length === 0 ? (
 <div className="focus-value muted">No upcoming scheduled posts.</div>
 ) : upcoming.slice(0, 5).map((post, i) => (
 <button type="button" key={i} className="key-date" style={{ border: 0, background: "transparent", width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => handleEditPost(post)}>
 <CalendarDays size={13} />
 <strong>{new Date(post.scheduled_for).toLocaleDateString([], { month: "short", day: "numeric" })}</strong>
 <span>{post.content?.slice(0, 30) || "Untitled"}</span>
 </button>
 ))}
 </section>
 <section className="panel rail-card">
 <div className="rail-card-title">Unscheduled Ideas <button type="button" className="inline-link" onClick={() => setActiveView("posts")}>View All</button></div>
 {drafts.length === 0 ? (
 <div className="focus-value muted">No unscheduled drafts.</div>
 ) : drafts.map((post, i) => (
 <button type="button" key={i} className="idea-item" style={{ border: 0, background: "transparent", width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => handleEditPost(post)}>
 <Lightbulb size={13} />
 <span>{post.content?.slice(0, 40) || "Untitled draft"}</span>
 </button>
 ))}
 </section>
 </aside>
 );
 }

 function renderCalendar() {
 const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
 const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
 const cells = [];
 const today = new Date().toISOString().slice(0, 10);

 // Status → dot color (visual only; mirrors the prototype's status accents).
 const statusDot = (status) => {
 if (status === "published") return "#238a57";
 if (status === "scheduled") return "#7b2ca7";
 if (status === "draft") return "var(--cth-gold)";
 return "#9f7d84";
 };
 const postTime = (post) => {
 const raw = post?.scheduled_for || post?.created_at;
 if (!raw) return "";
 const d = new Date(raw);
 return Number.isNaN(d.getTime())
 ? ""
 : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
 };

 for (let i = 0; i < firstDay; i += 1) {
 cells.push(<div key={`e-${i}`} className="day-cell outside" />);
 }

 for (let day = 1; day <= daysInMonth; day += 1) {
 const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
 const dayPosts = (calendarData[dateStr] || []).filter(calFilterMatch);
 const isToday = today === dateStr;

 cells.push(
 <div key={day} className={`day-cell${isToday ? " is-today" : ""}`}>
 <div className="day-number">{day}</div>
 {dayPosts.slice(0, 3).map((post, i) => {
 const cfg = PLATFORM_CFG[post.platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const time = postTime(post);
 return (
 <div
 key={i}
 className="post-card"
 role="button"
 tabIndex={0}
 onClick={() => handleEditPost(post)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 handleEditPost(post);
 }
 }}
 >
 <div className="post-top">
 <span className="platform-mark" style={{ background: cfg.color }}>
 <Icon size={9} />
 </span>
 {time ? <span>{time}</span> : null}
 <span className="status-dot" style={{ background: statusDot(post.status) }} />
 </div>
 <div className="post-title">{post.content?.slice(0, 40) || "Untitled"}</div>
 </div>
 );
 })}
 {dayPosts.length > 3 ? (
 <button
 type="button"
 className="inline-link"
 style={{ padding: "4px 0 0", fontSize: 10 }}
 onClick={() => handleEditPost(dayPosts[3])}
 >
 +{dayPosts.length - 3} more
 </button>
 ) : null}
 </div>
 );
 }

 return cells;
 }

 const filteredPosts = useMemo(() => {
 let next = posts.filter((p) => filterPlatform === "all" || p.platform === filterPlatform);
 if (filterStatus !== "all") next = next.filter((p) => p.status === filterStatus);
 if (filterContentJob !== "all") next = next.filter((p) => (p.content_job || "") === filterContentJob);
 if (filterCampaign !== "all") next = next.filter((p) => String(p.campaign_id || "") === filterCampaign);
 if (postSearch.trim()) {
 const q = postSearch.trim().toLowerCase();
 next = next.filter((p) =>
 [p.topic, p.title, p.content, p.hook]
 .filter(Boolean)
 .some((field) => String(field).toLowerCase().includes(q))
 );
 }

 const metricValue = (post, key) => Number(post?.[key] || 0);

 next.sort((a, b) => {
 if (sortBy === "likes") return metricValue(b, "likes") - metricValue(a, "likes");
 if (sortBy === "shares") return metricValue(b, "shares") - metricValue(a, "shares");
 if (sortBy === "comments") return metricValue(b, "comments") - metricValue(a, "comments");
 if (sortBy === "clicks") return metricValue(b, "clicks") - metricValue(a, "clicks");

 const aTime = new Date(a.scheduled_for || a.created_at || 0).getTime();
 const bTime = new Date(b.scheduled_for || b.created_at || 0).getTime();
 return bTime - aTime;
 });

 return next;
 }, [posts, filterPlatform, filterStatus, filterContentJob, filterCampaign, postSearch, sortBy]);

 // Distinct campaigns present on the loaded posts, for the Posts filter select.
 const postCampaignOptions = useMemo(() => {
 const seen = new Map();
 posts.forEach((p) => {
 if (p.campaign_id && !seen.has(String(p.campaign_id))) {
 seen.set(String(p.campaign_id), p.campaign_name || p.campaign_title || "Campaign");
 }
 });
 return Array.from(seen, ([id, name]) => ({ id, name }));
 }, [posts]);

 const instagramGridPosts = useMemo(() => {
 const fromTime = gridPreviewFrom ? new Date(gridPreviewFrom).getTime() : null;
 const ranked = [...posts]
 .filter((p) => p.platform === "instagram")
 .filter((p) => gridCampaign === "all" || String(p.campaign_id || "") === gridCampaign)
 .filter((p) => {
 if (fromTime === null || Number.isNaN(fromTime)) return true;
 const t = new Date(p.scheduled_for || p.created_at || 0).getTime();
 return t >= fromTime;
 })
 .sort((a, b) => {
 const aDate = new Date(a.scheduled_for || a.created_at || 0).getTime();
 const bDate = new Date(b.scheduled_for || b.created_at || 0).getTime();
 return bDate - aDate;
 });

 const slots = [...ranked.slice(0, 9)];
 while (slots.length < 9) {
 slots.push({
 id: `grid-empty-${slots.length + 1}`,
 isEmpty: true,
 label: `Slot ${slots.length + 1}`,
 });
 }
 return slots;
 }, [posts, gridCampaign, gridPreviewFrom]);

 useEffect(() => {
 setGridSlots(instagramGridPosts);
 }, [instagramGridPosts]);

 const handleGridDrop = (dropIndex) => {
 if (draggedGridIndex === null || draggedGridIndex === dropIndex) return;

 setGridSlots((prev) => {
 const next = [...prev];
 const dragged = next[draggedGridIndex];
 next[draggedGridIndex] = next[dropIndex];
 next[dropIndex] = dragged;
 return next.map((item, idx) =>
 item?.isEmpty ? { ...item, label: `Slot ${idx + 1}` } : item
 );
 });

 setDraggedGridIndex(null);
 };

 const handleManualRefresh = async () => {
 await fetchAllData({ silent: true });
 if (toast?.tone !== "error") {
 showToast("Social data refreshed");
 }
 };

 const totalPosts = analytics?.total_posts || 0;
 const totalScheduled = analytics?.total_scheduled || 0;
 const totalPublished = analytics?.total_published || 0;
 const totalDrafts = posts.filter((p) => p.status === "draft").length;
 const totalNeedsApproval = posts.filter((p) => p.status === "needs_approval").length;

 // Publishing rhythm: published posts averaged over the distinct days that
 // actually carried a publish (derived from real posts, not fabricated).
 const publishedPosts = posts.filter((p) => p.status === "published");
 const activePublishDays = new Set(
 publishedPosts.map((p) => String(p.scheduled_for || "").slice(0, 10)).filter(Boolean)
 );
 const publishingRhythm = activePublishDays.size
 ? (publishedPosts.length / activePublishDays.size).toFixed(1)
 : "0.0";

 // Engagement: average of the engagement rates the posts actually report.
 const engagementSamples = posts
 .map((p) => Number(p.engagement_rate || 0))
 .filter((n) => n > 0);
 const avgEngagement = engagementSamples.length
 ? engagementSamples.reduce((a, b) => a + b, 0) / engagementSamples.length
 : 0;
 const engagementDisplay = `${avgEngagement.toFixed(1)}%`;

 // Performance snapshot — aggregated from the real post metrics the API already
 // returns (reach/impressions, likes/comments/shares, clicks), scoped to the
 // month in view with a month-over-month delta for the trend arrows. No
 // fabricated numbers; arrows are hidden when there is no prior-month baseline.
 const perfNowY = currentDate.getFullYear();
 const perfNowM = currentDate.getMonth();
 const perfPrevDate = new Date(perfNowY, perfNowM - 1, 1);
 const perfPostMonth = (p) => {
 const d = new Date(p.scheduled_for || p.created_at || 0);
 return Number.isNaN(d.getTime()) ? null : { y: d.getFullYear(), m: d.getMonth() };
 };
 const sumFieldForMonth = (key, y, m) =>
 posts.reduce((acc, p) => {
 const pm = perfPostMonth(p);
 return acc + (pm && pm.y === y && pm.m === m ? Number(p[key] || 0) : 0);
 }, 0);
 const engagementForMonth = (y, m) =>
 sumFieldForMonth("likes", y, m) + sumFieldForMonth("comments", y, m) + sumFieldForMonth("shares", y, m);
 const reachField = posts.some((p) => Number(p.reach || 0) > 0) ? "reach" : "impressions";
 const perfReach = sumFieldForMonth(reachField, perfNowY, perfNowM);
 const perfEngagementCount = engagementForMonth(perfNowY, perfNowM);
 const perfClicks = sumFieldForMonth("clicks", perfNowY, perfNowM);
 const prevReach = sumFieldForMonth(reachField, perfPrevDate.getFullYear(), perfPrevDate.getMonth());
 const prevEngagement = engagementForMonth(perfPrevDate.getFullYear(), perfPrevDate.getMonth());
 const prevClicks = sumFieldForMonth("clicks", perfPrevDate.getFullYear(), perfPrevDate.getMonth());
 const pctDelta = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);
 const reachDelta = pctDelta(perfReach, prevReach);
 const engagementDelta = pctDelta(perfEngagementCount, prevEngagement);
 const clicksDelta = pctDelta(perfClicks, prevClicks);
 const formatCompact = (n) => {
 const v = Number(n || 0);
 if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
 if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
 return String(Math.round(v));
 };
 const perfRankScore = (p) =>
 Number(p.engagement_rate || 0) + Number(p.clicks || 0) +
 Number(p.likes || 0) + Number(p.comments || 0) + Number(p.shares || 0);
 const bestPost = [...publishedPosts].sort((a, b) => perfRankScore(b) - perfRankScore(a))[0] || null;
 const platformStats = posts.reduce((acc, p) => {
 const key = p.platform || "instagram";
 if (!acc[key]) acc[key] = { sum: 0, count: 0 };
 acc[key].sum += Number(p.engagement_rate || 0);
 acc[key].count += 1;
 return acc;
 }, {});
 const topPlatformEntry = Object.entries(platformStats)
 .map(([key, v]) => ({ key, avg: v.count ? v.sum / v.count : 0 }))
 .sort((a, b) => b.avg - a.avg)[0] || null;

 // A post already published (or mid-publish, or unresolved) opens read-only:
 // nothing typed here can change what is already on the platform, so offering
 // an edit would just fabricate a local record that disagrees with reality.
 const editingLocked = Boolean(editingPostId) && isPublishLocked(formData);

 const modalTitle = formData.recycle_mode
 ? "Recycle Post"
 : formData.duplicate_mode
 ? "Duplicate as Draft"
 : editingLocked
 ? "Published Post"
 : editingPostId
 ? "Edit Post"
 : "Create Post";

 const modalSubmitLabel = editingPostId
 ? "Update Post"
 : formData.scheduled_for
 ? "Schedule Post"
 : "Save as Draft";

 return (
 <div className="cth-social-planner cth-sp-fullbleed">
 <main className="app-shell">
 <button
 type="button"
 className="cth-sp-back"
 onClick={() => navigate("/command-center")}
 >
 <ChevronLeft size={15} /> Back to Command Center
 </button>
 <header className="page-header">
        <div className="header-copy">
          <div className="eyebrow">Core Truth House</div>
          <h1>Social Planner</h1>
          <p className="subtitle">
            Turn your brand strategy into a clear publishing rhythm. Plan the message, shape it for
            each platform, and move it from idea to published content.
          </p>
        </div>
        <div className="header-actions">
 <button
 data-testid="create-post-btn"
 type="button"
 className="btn btn-primary"
 onClick={() => {
 setSelectedPlatforms(["instagram"]);
 setFormData((d) => ({ ...d, platform: d.platform || "instagram" }));
 setShowModal("post");
 }}
 >
 <Plus size={16} /> Create Post
 </button>
 <button type="button" className="btn btn-secondary" onClick={() => setZuriChatOpen(true)}>
 <Sparkles size={16} /> Ask the House
 </button>
 <button type="button" className="btn btn-secondary" onClick={() => navigate("/content-studio")}>
 <BookOpen size={16} /> Libraries
 </button>
 <button
 type="button"
 className="btn btn-secondary"
 onClick={() => { setDrawerTab("campaign"); openCampaignDrawer(); }}
 >
 <LayoutIcon size={16} /> Campaigns
 </button>
        </div>
      </header>

 <CampaignContextBanner
 campaignId={activeCampaignId}
 campaignName={activeCampaignName}
 label="Composing for campaign:"
 onClear={() => {
 setActiveCampaignId(null);
 setActiveCampaignName(null);
 setFormData((d) => ({ ...d, campaign_id: null }));
 }}
 />

 <div data-testid="social-media-manager" style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
 {loading ? (
 <div style={{ padding: "80px 0", textAlign: "center" }}>
 <Loader2 size={32} className="animate-spin" style={{ color: "var(--cth-crimson)" }} />
 </div>
 ) : (
 <>
 <section className="metrics" aria-label="Social planner metrics">
 <MetricTile icon={CalendarDays} label="Planned" value={totalPosts} note="Posts this month" />
 <MetricTile icon={Clock} label="Scheduled" value={totalScheduled} note="Posts" />
 <MetricTile icon={Send} label="Published" value={totalPublished} note="Posts" />
 <MetricTile icon={Pencil} label="Drafts" value={totalDrafts} note="Posts" />
 <MetricTile icon={UserRound} label="Needs Approval" value={totalNeedsApproval} note="Posts" />
 <MetricTile icon={BarChart3} label="Publishing Rhythm" value={publishingRhythm} note="Posts per active day" />
 <MetricTile icon={Heart} label="Engagement" value={engagementDisplay} note="This month" />
 </section>

 <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
 <TabBar value={activeView} onChange={setActiveView} />
 <button
 type="button"
 onClick={handleManualRefresh}
 disabled={refreshing}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: refreshing ? 0.7 : 1 }}
 >
 {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
 Refresh
 </button>
 </div>

 {activeView === "publish" && (
 <div className="view-pane active">
 <div className="toolbar">
 <div className="segmented" aria-label="Calendar view mode">
 <button type="button" className={`segment${calendarMode === "month" ? " active" : ""}`} onClick={() => setCalendarMode("month")}>Month</button>
 <button type="button" className={`segment${calendarMode === "week" ? " active" : ""}`} onClick={() => setCalendarMode("week")}>Week</button>
 <button type="button" className={`segment${calendarMode === "list" ? " active" : ""}`} onClick={() => setCalendarMode("list")}>List</button>
 </div>
 <div className="month-control">
 <button
 type="button"
 className="icon-btn"
 data-testid="prev-month"
 aria-label="Previous month"
 onClick={() => navigateMonth(-1)}
 >
 <ChevronLeft size={18} />
 </button>
 <strong>{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</strong>
 <button
 type="button"
 className="icon-btn"
 data-testid="next-month"
 aria-label="Next month"
 onClick={() => navigateMonth(1)}
 >
 <ChevronRight size={18} />
 </button>
 </div>

 <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
 <select className="control" value={calPlatform} onChange={(e) => setCalPlatform(e.target.value)} data-testid="cal-platform-filter">
 <option value="all">Platform: All</option>
 {Object.entries(PLATFORM_CFG).map(([id, c]) => (
 <option key={id} value={id}>{c.label}</option>
 ))}
 </select>
 <select className="control" value={calStatus} onChange={(e) => setCalStatus(e.target.value)} data-testid="cal-status-filter">
 <option value="all">Status: All</option>
 <option value="draft">Draft</option>
 <option value="scheduled">Scheduled</option>
 <option value="published">Published</option>
 <option value="needs_approval">Needs Approval</option>
 </select>
 <select className="control" value={calContentJob} onChange={(e) => setCalContentJob(e.target.value)} data-testid="cal-content-job-filter">
 <option value="all">Content Job: All</option>
 <option value="Generate Demand">Generate Demand</option>
 <option value="Convert Demand">Convert Demand</option>
 <option value="Build Loyalty">Build Loyalty</option>
 </select>
 <select className="control" value={calCampaign} onChange={(e) => setCalCampaign(e.target.value)} data-testid="cal-campaign-filter">
 <option value="all">Campaign: All</option>
 {postCampaignOptions.map((c) => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 <select className="control" value={calPillar} onChange={(e) => setCalPillar(e.target.value)} data-testid="cal-pillar-filter">
 <option value="all">Pillar: All</option>
 <option value="Brand Strategy">Brand Strategy</option>
 <option value="Founder Leadership">Founder Leadership</option>
 <option value="Client Transformation">Client Transformation</option>
 <option value="Systems &amp; Operations">Systems &amp; Operations</option>
 <option value="Offers &amp; Conversion">Offers &amp; Conversion</option>
 </select>
 </div>
 </div>

 <div className="calendar-layout">
 <div>
 {calendarMode === "month" && (
 <div className="calendar-card">
 <div className="weekdays">
 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
 <div className="weekday" key={d}>{d}</div>
 ))}
 </div>
 <div className="calendar-grid">
 {renderCalendar()}
 </div>
 </div>
 )}
 {calendarMode === "week" && renderWeekView()}
 {calendarMode === "list" && renderListView()}

 {calendarMode === "month" && Object.keys(calendarData).length === 0 ? (
 <div style={{ marginTop: 16 }}>
 <EmptyState
 icon={CalendarIcon}
 title="No posts scheduled this month"
 body="Use Create Post or open a campaign to populate the calendar."
 />
 </div>
 ) : null}

 <div className="lower-grid">
 <section className="panel content-guide">
 <div className="section-kicker">Content Job Guide</div>
 <div className="guide-grid">
 <article className="guide-card purple">
 <div className="guide-head"><Sparkles size={22} style={{ color: "#9a2de4" }} />Generate Demand</div>
 <p>Create recognition, relevance, curiosity, and problem ownership.</p>
 <div className="examples">Examples: Tips, education, stories, insights, awareness content.</div>
 </article>
 <article className="guide-card red">
 <div className="guide-head"><Send size={22} style={{ color: "#f0472e" }} />Convert Demand</div>
 <p>Move people toward an offer, inquiry, registration, purchase, or next step.</p>
 <div className="examples">Examples: Case studies, demos, offers, testimonials, objections.</div>
 </article>
 <article className="guide-card gold">
 <div className="guide-head"><Heart size={22} style={{ color: "#d99d1e" }} />Build Loyalty</div>
 <p>Strengthen trust, community, retention, advocacy, and client relationships.</p>
 <div className="examples">Examples: Behind the scenes, values, client wins, Q&amp;A, loyalty content.</div>
 </article>
 </div>
 </section>

 <section className="panel performance-card">
 <div className="section-kicker">Performance Snapshot <span className="muted">(This Month)</span></div>
 <div className="performance-grid">
 <div className="performance-item">
 <div className="performance-label">Reach</div>
 <div className="performance-value">{formatCompact(perfReach)}</div>
 {reachDelta !== null ? (
 <div className={reachDelta >= 0 ? "trend-up" : "trend-down"}>{reachDelta >= 0 ? "↑" : "↓"} {Math.abs(reachDelta)}%</div>
 ) : null}
 </div>
 <div className="performance-item">
 <div className="performance-label">Engagement</div>
 <div className="performance-value">{formatCompact(perfEngagementCount)}</div>
 {engagementDelta !== null ? (
 <div className={engagementDelta >= 0 ? "trend-up" : "trend-down"}>{engagementDelta >= 0 ? "↑" : "↓"} {Math.abs(engagementDelta)}%</div>
 ) : null}
 </div>
 <div className="performance-item">
 <div className="performance-label">Clicks</div>
 <div className="performance-value">{formatCompact(perfClicks)}</div>
 {clicksDelta !== null ? (
 <div className={clicksDelta >= 0 ? "trend-up" : "trend-down"}>{clicksDelta >= 0 ? "↑" : "↓"} {Math.abs(clicksDelta)}%</div>
 ) : null}
 </div>
 <div className="performance-item">
 <div className="performance-label">Best Post</div>
 <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
 {bestPost ? spPlatformMark(bestPost.platform) : null}
 <span style={{ fontSize: 10 }}>
 {bestPost ? (bestPost.content?.slice(0, 40) || "Untitled") : "No data yet"}
 </span>
 </div>
 </div>
 <div className="performance-item">
 <div className="performance-label">Top Platform</div>
 <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
 {topPlatformEntry ? spPlatformMark(topPlatformEntry.key) : null}
 <span style={{ fontSize: 10 }}>
 {topPlatformEntry
 ? `${PLATFORM_CFG[topPlatformEntry.key]?.label || topPlatformEntry.key} ${topPlatformEntry.avg.toFixed(1)}%`
 : "No data yet"}
 </span>
 </div>
 </div>
 </div>
 <div className="performance-footer">
 <button type="button" className="btn btn-secondary btn-small" onClick={() => setActiveView("times")}>
 Open Full Social Analytics <ChevronRight size={13} />
 </button>
 </div>
 </section>
 </div>
 </div>

 {renderCalendarRail()}
 </div>
 </div>
 )}

 {activeView === "grid" && (
 <div data-testid="instagram-grid-planner">
            <div className="inner-header">
              <div>
                <div className="eyebrow">Visual Planning</div>
                <h2 className="inner-title">Instagram Grid</h2>
                <p className="inner-subtitle">Preview your planned posts as a complete visual story before they publish.</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {igConnection ? (
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={handleDisconnectInstagram}
                    disabled={igActionBusy}
                    title="Disconnect Instagram"
                    style={{ opacity: igActionBusy ? 0.7 : 1 }}
                  >
                    {igActionBusy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={handleConnectInstagram}
                    disabled={igActionBusy || igConnectionLoading}
                    title="Connect Instagram"
                    style={{ opacity: (igActionBusy || igConnectionLoading) ? 0.7 : 1 }}
                  >
                    {igActionBusy ? <Loader2 size={14} className="animate-spin" /> : <Instagram size={14} />}
                    Connect Instagram + Facebook
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={handleSyncInstagramProfile}
                  disabled={syncingProfile || !igConnection}
                  title={igConnection ? "Sync profile from Instagram" : "Connect Instagram first"}
                  style={{ opacity: (syncingProfile || !igConnection) ? 0.7 : 1 }}
                >
                  {syncingProfile ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {syncingProfile ? "Syncing…" : "Sync Profile"}
                </button>
                <button type="button" className="btn btn-small btn-primary" onClick={openNewPost}>
                  <Plus size={14} /> Add Grid Post
                </button>
              </div>
            </div>

            <div className="ig-layout">
              <aside className="profile-card">
                <input
                  ref={gridAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGridAvatarSelect}
                  style={{ display: "none" }}
                />
                <div className="profile-top">
                  <button
                    type="button"
                    className="avatar"
                    onClick={() => gridAvatarInputRef.current?.click()}
                    title="Upload avatar"
                    style={{ overflow: "hidden", padding: 0, cursor: "pointer", flexShrink: 0 }}
                  >
                    {gridProfile.avatar_url ? (
                      <img
                        src={backendAssetUrl(gridProfile.avatar_url)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12 }}>Upload</span>
                    )}
                  </button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <input
                      className="profile-name"
                      value={gridProfile.display_name}
                      onChange={(e) => setGridProfile((p) => ({ ...p, display_name: e.target.value }))}
                      style={{ background: "transparent", border: "none", outline: "none", padding: 0, width: "100%", fontWeight: 600, color: "var(--cth-ink)" }}
                    />
                    <input
                      className="profile-handle"
                      value={gridProfile.handle}
                      onChange={(e) => setGridProfile((p) => ({ ...p, handle: e.target.value }))}
                      style={{ background: "transparent", border: "none", outline: "none", padding: 0, width: "100%" }}
                    />
                  </div>
                </div>

                <div className="profile-stats">
                  {[
                    { label: "Posts", value: gridProfile.posts_count || gridSlots.filter((p) => !p?.isEmpty).length },
                    { label: "Followers", value: gridProfile.followers_count || 0 },
                    { label: "Following", value: gridProfile.following_count || 0 },
                  ].map((stat) => (
                    <div className="profile-stat" key={stat.label}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="bio">
                  <input
                    value={gridProfile.category}
                    onChange={(e) => setGridProfile((p) => ({ ...p, category: e.target.value }))}
                    style={{ background: "transparent", border: "none", outline: "none", padding: 0, width: "100%", fontWeight: 700, color: "var(--cth-ink)" }}
                  />
                  {[1, 2, 3].map((n) => (
                    <input
                      key={n}
                      value={gridProfile[`bio_line_${n}`]}
                      onChange={(e) => setGridProfile((p) => ({ ...p, [`bio_line_${n}`]: e.target.value }))}
                      style={{ background: "transparent", border: "none", outline: "none", padding: 0, width: "100%", color: "var(--cth-ink)" }}
                    />
                  ))}
                  <input
                    value={gridProfile.website}
                    onChange={(e) => setGridProfile((p) => ({ ...p, website: e.target.value }))}
                    style={{ background: "transparent", border: "none", outline: "none", padding: 0, width: "100%", fontWeight: 600, color: "var(--cth-crimson)" }}
                  />
                </div>

                <hr style={{ border: 0, borderTop: "1px solid var(--cth-border)", margin: "18px 0" }} />

                <div className="section-kicker">Grid Controls</div>
                {igConnection?.username ? (
                  <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span className="status-pill published"><span className="status-dot" style={{ background: "#5bac76" }} />Instagram</span>
                    <span className="muted" style={{ fontSize: 12 }}>@{igConnection.username}</span>
                    {linkedFacebookPageName ? (
                      <>
                        <span className="status-pill published"><span className="status-dot" style={{ background: "#5bac76" }} />Facebook</span>
                        <span className="muted" style={{ fontSize: 12 }}>{linkedFacebookPageName}</span>
                      </>
                    ) : null}
                  </div>
                ) : !igConnectionLoading ? (
                  <div style={{ margin: "10px 0" }}>
                    <span className="status-pill" style={{ background: "var(--cth-blush)", color: "var(--cth-ruby)" }}>Not connected</span>
                  </div>
                ) : null}

                <div className="field" style={{ marginTop: 12 }}>
                  <label>Preview from</label>
                  <input
                    type="date"
                    value={gridPreviewFrom}
                    onChange={(e) => setGridPreviewFrom(e.target.value)}
                    data-testid="grid-preview-from"
                  />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Campaign</label>
                  <select
                    value={gridCampaign}
                    onChange={(e) => setGridCampaign(e.target.value)}
                    data-testid="grid-campaign-filter"
                  >
                    <option value="all">All Campaigns</option>
                    {postCampaignOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <p className="muted" style={{ fontSize: 10, lineHeight: 1.5, marginTop: 12 }}>
                  Drag planned tiles to test the visual order. Published posts remain locked.
                </p>
                <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
                  {gridSlots.filter((p) => !p?.isEmpty).length}/9 planned
                </p>
              </aside>

              <div>
              <input
                ref={gridSlotFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleGridSlotFileSelect}
                style={{ display: "none" }}
              />

              <div className="grid-preview">
                {gridSlots.map((post, index) => {
                  if (post.isEmpty) {
                    return (
                      <div
                        key={post.id}
                        className="grid-tile"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleGridFileDrop(e, index)}
                        style={{ cursor: "default", background: "var(--cth-panel-white)", border: "1px dashed var(--cth-border)", display: "grid", placeItems: "center", padding: 12, textAlign: "center" }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <span className="section-kicker" style={{ margin: 0, fontSize: 10 }}>{post.label}</span>
                          <span className="muted" style={{ fontSize: 11 }}>Drop image or</span>
                          <button
                            type="button"
                            className="btn btn-primary btn-small"
                            onClick={() => {
                              setPendingGridSlotIndex(index);
                              gridSlotFileInputRef.current?.click();
                            }}
                          >
                            Select Image
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
                  const thumb = post.media_urls?.[0];

                  return (
                    <div
                      key={post.id}
                      className="grid-tile"
                      draggable
                      onDragStart={() => setDraggedGridIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleGridDrop(index)}
                      style={{ cursor: "grab" }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleEditPost(post)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleEditPost(post); } }}
                        style={{ position: "absolute", inset: 0 }}
                      >
                        {thumb ? (
                          <img
                            src={backendAssetUrl(thumb)}
                            alt=""
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", padding: 12, textAlign: "center", background: "var(--cth-panel-white)", color: "var(--cth-muted)", fontSize: 12 }}>
                            No media preview
                          </div>
                        )}
                        <div className="grid-overlay">
                          {post.content || post.topic || "Untitled Instagram post"}
                        </div>
                      </div>

                      <span className="planned-badge">{post.content_item_id ? "Reviewed" : statusCfg.label}</span>

                      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4, zIndex: 2 }}>
                        {post.status === "scheduled" ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); requestPublishPost(post); }}
                            aria-label="Publish now"
                            title="Publish now"
                            style={{ width: 28, height: 28, borderRadius: 4, background: "var(--cth-purple-deep)", color: "var(--cth-gold)", border: "none", display: "grid", placeItems: "center", cursor: "pointer" }}
                          >
                            <Send size={13} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); requestDeletePost(post); }}
                          aria-label="Delete post"
                          title="Delete post"
                          style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(13,0,16,0.7)", color: "var(--cth-ivory)", border: "none", display: "grid", placeItems: "center", cursor: "pointer" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {gridSlots.filter((p) => !p?.isEmpty).length === 9 ? (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button type="button" className="btn btn-small btn-danger" onClick={requestResetGrid}>
                    <Trash2 size={14} /> Reset Grid
                  </button>
                </div>
              ) : null}
 </div>
 </div>
 </div>
 )}

 {activeView === "posts" && (
 <div data-testid="posts-list" className="inner-page">
 <div className="inner-header">
 <div>
 <div className="eyebrow">Publishing Queue</div>
 <h2 className="inner-title">Posts</h2>
 <p className="inner-subtitle">Review drafts, scheduled posts, approval requests, and published content in one place.</p>
 </div>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
 <button
 type="button"
 className="btn btn-secondary btn-small"
 onClick={handleRecycleTopPost}
 disabled={recycleBusy}
 style={{ opacity: recycleBusy ? 0.7 : 1 }}
 >
 {recycleBusy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
 Recycle Top Post
 </button>
 <button type="button" className="btn btn-primary btn-small" onClick={openNewPost}>
 <Plus size={14} /> Create Post
 </button>
 </div>
 </div>

                <div style={{ marginTop: 4 }}>
                  <div className="post-filters">
                    <div className="search-wrap">
                      <Search size={14} />
                      <input
                        className="control"
                        style={{ width: "100%" }}
                        placeholder="Search posts"
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        data-testid="post-search"
                      />
                    </div>
                    <select
                      className="control"
                      value={filterPlatform}
                      onChange={(e) => setFilterPlatform(e.target.value)}
                      data-testid="platform-filter"
                    >
                      <option value="all">Platform: All</option>
                      {Object.entries(PLATFORM_CFG).map(([id, c]) => (
                        <option key={id} value={id}>{c.label}</option>
                      ))}
                    </select>
                    <select
                      className="control"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      data-testid="status-filter"
                    >
                      {STATUS_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>{opt.key === "all" ? "Status: All" : opt.label}</option>
                      ))}
                    </select>
                    <select
                      className="control"
                      value={filterContentJob}
                      onChange={(e) => setFilterContentJob(e.target.value)}
                      data-testid="content-job-filter"
                    >
                      <option value="all">Content Job: All</option>
                      <option value="Generate Demand">Generate Demand</option>
                      <option value="Convert Demand">Convert Demand</option>
                      <option value="Build Loyalty">Build Loyalty</option>
                    </select>
                    <select
                      className="control"
                      value={filterCampaign}
                      onChange={(e) => setFilterCampaign(e.target.value)}
                      data-testid="campaign-filter"
                    >
                      <option value="all">Campaign: All</option>
                      {postCampaignOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      className="control"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      data-testid="sort-posts"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>{opt.key === "time" ? "Sort: Most Recent" : opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {filteredPosts.length > 0 ? (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--cth-border)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          className="btn btn-small btn-secondary"
                          onClick={() => {
                            // Published / in-flight posts are never selectable — bulk schedule
                            // cannot do anything with them.
                            const schedulable = filteredPosts.filter((post) => !isPublishLocked(post));
                            if (selectedPostIds.length >= schedulable.length && schedulable.length > 0) {
                              setSelectedPostIds([]);
                            } else {
                              setSelectedPostIds(schedulable.map((post) => post.id));
                            }
                          }}
                        >
                          {selectedPostIds.length >= filteredPosts.filter((p) => !isPublishLocked(p)).length
                            && selectedPostIds.length > 0
                            ? "Clear Selection"
                            : "Select All"}
                        </button>
                        <span className="muted" style={{ fontSize: 12 }}>{selectedPostIds.length} selected</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="datetime-local"
                          className="control"
                          value={bulkScheduleDate}
                          onChange={(e) => setBulkScheduleDate(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-small btn-primary"
                          onClick={handleBulkSchedule}
                          disabled={!selectedPostIds.length || !bulkScheduleDate || bulkScheduling}
                          style={{ opacity: (!selectedPostIds.length || !bulkScheduleDate || bulkScheduling) ? 0.4 : 1 }}
                        >
                          {bulkScheduling ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                          Bulk Schedule
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

 {filteredPosts.length > 0 ? (
 <div className="table-scroll">
 <table className="posts-table">
 <thead>
 <tr>
 <th style={{ width: 34 }}>
 <input
 type="checkbox"
 aria-label="Select all schedulable posts"
 checked={selectedPostIds.length >= filteredPosts.filter((p) => !isPublishLocked(p)).length && selectedPostIds.length > 0}
 onChange={() => {
 const schedulable = filteredPosts.filter((post) => !isPublishLocked(post));
 if (selectedPostIds.length >= schedulable.length && schedulable.length > 0) {
 setSelectedPostIds([]);
 } else {
 setSelectedPostIds(schedulable.map((post) => post.id));
 }
 }}
 style={{ accentColor: "var(--cth-crimson)", cursor: "pointer" }}
 />
 </th>
 <th>Post</th>
 <th>Platform</th>
 <th>Content Job</th>
 <th>Campaign</th>
 <th>Scheduled</th>
 <th>Status</th>
 <th>Performance</th>
 <th aria-label="Actions" />
 </tr>
 </thead>
 <tbody>
 {filteredPosts.map((post) => {
 const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
 const checked = selectedPostIds.includes(post.id);
 // Bulk schedule cannot apply to a post that is already live or in flight.
 const locked = isPublishLocked(post);
 const cfg = PLATFORM_CFG[post.platform] || PLATFORM_CFG.instagram;
 const thumb = post.media_urls?.[0];
 const statusPillClass =
 post.status === "published" ? "status-published"
 : post.status === "scheduled" ? "status-scheduled"
 : post.status === "needs_approval" ? "status-approval"
 : "status-draft";
 const perf =
 post.status === "published"
 ? (Number(post.engagement_rate || 0) > 0 ? `${Number(post.engagement_rate).toFixed(1)}% ER` : "Published")
 : post.status === "scheduled" ? "Preview"
 : post.status === "needs_approval" ? "Pending"
 : "—";
 return (
 <tr key={post.id} data-testid={`post-${post.id}`} style={{ background: checked ? "rgba(175,0,36,0.05)" : "transparent" }}>
 <td>
 <input
 type="checkbox"
 checked={checked}
 disabled={locked}
 title={locked ? "Already published — cannot be scheduled" : undefined}
 onChange={(e) => setSelectedPostIds((prev) => (e.target.checked ? [...prev, post.id] : prev.filter((id) => id !== post.id)))}
 style={{ accentColor: "var(--cth-crimson)", cursor: locked ? "default" : "pointer" }}
 />
 </td>
 <td>
 <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
 {thumb ? (
 <img className="thumb" src={backendAssetUrl(thumb)} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
 ) : (
 <span className="thumb" style={{ display: "grid", placeItems: "center", background: "var(--cth-blush)", color: "var(--cth-muted)" }}>
 <ImageIcon size={16} />
 </span>
 )}
 <div style={{ minWidth: 0 }}>
 <strong style={{ display: "block", color: "var(--cth-ink)" }}>
 {post.topic || post.title || (post.content ? post.content.slice(0, 40) : "Untitled")}
 </strong>
 <div className="muted" style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
 {post.hook || post.content || ""}
 </div>
 </div>
 </div>
 </td>
 <td>
 <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
 {spPlatformMark(post.platform)} {cfg.label}
 </span>
 </td>
 <td style={{ whiteSpace: "nowrap" }}>{post.content_job || "—"}</td>
 <td style={{ whiteSpace: "nowrap" }}>
 {post.campaign_name || post.campaign_title || (post.campaign_id ? "Campaign" : "—")}
 </td>
 <td style={{ whiteSpace: "nowrap" }}>
 {post.scheduled_for
 ? new Date(post.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
 : "Unscheduled"}
 </td>
 <td><span className={`status-pill ${statusPillClass}`}>{statusCfg.label}</span></td>
 <td style={{ whiteSpace: "nowrap" }}>{perf}</td>
 <td>
 <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
 <button type="button" className="icon-btn" aria-label={locked ? "View post" : "Edit post"} onClick={() => handleEditPost(post)}>
 <Pencil size={14} />
 </button>
 {post.status === "scheduled" ? (
 <button type="button" className="icon-btn" aria-label="Publish now" onClick={() => handlePublishPost(post.id)}>
 {publishingId === post.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={14} />}
 </button>
 ) : null}
 {locked ? (
 <button type="button" className="icon-btn" aria-label="Duplicate as draft" onClick={() => openAsDraftCopy(post)}>
 <Copy size={14} />
 </button>
 ) : null}
 <button type="button" className="icon-btn" aria-label="Delete post" onClick={() => requestDeletePost(post)}>
 <Trash2 size={14} />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <EmptyState
 icon={Share2}
 title="No posts match these filters"
 body={posts.length === 0 ? "Create your first social media post to get started." : "Adjust the status, platform, or sort to see results."}
 />
 )}
 </div>
 )}
 </>
 )}

 {activeView === "times" && (
 <BestPostingTimes workspaceId={workspaceId} connections={connections} />
 )}
 </div>

 {showModal === "post" ? (
 <div
 role="presentation"
 onClick={closePostModal}
 data-testid="post-modal"
 style={{
 position: "fixed", inset: 0, zIndex: 50,
 background: "rgba(13, 0, 16, 0.6)",
 display: "flex", alignItems: "center", justifyContent: "center",
 padding: 16,
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 onClick={(e) => e.stopPropagation()}
 style={{
 width: "100%", maxWidth: 1100,
 maxHeight: "90dvh",
 background: "var(--cth-panel-white)",
 border: "1px solid var(--cth-border)",
 borderRadius: 8,
 boxShadow: "0 30px 60px rgba(13,0,16,0.30)",
 display: "flex", flexDirection: "column",
 overflow: "hidden",
 }}
 >
 <div className="modal-header">
 <div>
 <div className="eyebrow">Social Planner</div>
 <h2 className="drawer-title">{modalTitle}</h2>
 <p className="inner-subtitle">Build one strategic content brief and shape the final version for each platform.</p>
 </div>
 <IconButton label="Close modal" onClick={closePostModal}>
 <X size={16} />
 </IconButton>
 </div>

 <div className="modal-body" style={{ flex: 1 }}>
 <div className="composer-grid">
 <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
 {editingLocked ? (
 <div style={{
 display: "flex", gap: 10, alignItems: "flex-start",
 padding: "12px 14px", borderRadius: 4,
 background: "rgba(196,169,91,0.12)",
 border: "1px solid rgba(196,169,91,0.40)",
 }}>
 <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--cth-purple-deep)" }} />
 <div style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: "var(--cth-ink)" }}>
 {formData.status === "publish_unknown" ? (
 <>
 <strong>This post may or may not have gone live.</strong> The platform never
 sent a reply, so we could not confirm it. Check the platform before doing
 anything else — publishing it again could post it twice.
 </>
 ) : formData.status === "publishing" ? (
 <><strong>This post is being published right now.</strong> It is read-only until
 the platform responds.</>
 ) : (
 <>
 <strong>This post is already live.</strong> Editing it here would not change
 what is on the platform, so it is read-only. Use <em>Duplicate as draft</em>
 {" "}to build a new version.
 </>
 )}
 </div>
 </div>
 ) : null}

 <div>
 <div className="section-kicker">Content Brief</div>
 <div className="form-grid" style={{ marginTop: 10 }}>
 <div className="field">
 <label>Content Pillar</label>
 <select
 disabled={editingLocked}
 value={formData.content_pillar || ""}
 onChange={(e) => setFormData((d) => ({ ...d, content_pillar: e.target.value }))}
 >
 <option value="">Select pillar</option>
 <option>Brand Strategy</option>
 <option>Founder Leadership</option>
 <option>Client Transformation</option>
 <option>Systems &amp; Operations</option>
 <option>Offers &amp; Conversion</option>
 </select>
 </div>
 <div className="field">
 <label>Content Job</label>
 <select
 disabled={editingLocked}
 value={formData.content_job || ""}
 onChange={(e) => setFormData((d) => ({ ...d, content_job: e.target.value }))}
 >
 <option value="">Select job</option>
 <option>Generate Demand</option>
 <option>Convert Demand</option>
 <option>Build Loyalty</option>
 </select>
 </div>
 <div className="field">
 <label>Format</label>
 <select
 disabled={editingLocked}
 value={formData.format || ""}
 onChange={(e) => setFormData((d) => ({ ...d, format: e.target.value }))}
 >
 <option value="">Select format</option>
 <option>Carousel</option>
 <option>Text Post</option>
 <option>Short-form Video</option>
 <option>Static Graphic</option>
 <option>Story</option>
 <option>Reel</option>
 </select>
 </div>
 <div className="field">
 <label>CTA</label>
 <input
 disabled={editingLocked}
 value={formData.cta_text || ""}
 onChange={(e) => setFormData((d) => ({ ...d, cta_text: e.target.value }))}
 placeholder="e.g. Start with the Brand Diagnostic"
 />
 </div>
 <div className="field full">
 <label>Hook</label>
 <input
 disabled={editingLocked}
 value={formData.hook || ""}
 onChange={(e) => setFormData((d) => ({ ...d, hook: e.target.value }))}
 placeholder="The first line that stops the scroll"
 />
 </div>
 </div>
 </div>

 <div>
 <FieldLabel>Platforms</FieldLabel>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
 {Object.entries(PLATFORM_CFG).map(([id, cfg]) => {
 const Icon = cfg.icon;
 const active = selectedPlatforms.includes(id);
 return (
 <button
 key={id}
 type="button"
 data-testid={`select-${id}`}
 onClick={() => setSelectedPlatforms((prev) => {
 const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
 setFormData((d) => ({ ...d, platform: next[0] || "" }));
 return next;
 })}
 style={{
 display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
 padding: "12px 6px", borderRadius: 4,
 background: active ? `${cfg.color}15` : "var(--cth-blush)",
 border: `1px solid ${active ? `${cfg.color}50` : "var(--cth-border)"}`,
 color: active ? cfg.color : "var(--cth-muted)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: "pointer",
 }}
 >
 <Icon size={18} />
 <span>{cfg.label.split(" ")[0]}</span>
 </button>
 );
 })}
 </div>
 </div>

 {(selectedPlatforms.includes("pinterest") || selectedPlatforms.includes("google_business")) ? (
 <div style={{
 display: "grid", gap: 12,
 padding: 14,
 background: "var(--cth-blush)",
 border: "1px solid var(--cth-border)",
 borderRadius: 4,
 }}>
 <div style={{ ...EYEBROW_STYLE, color: "var(--cth-crimson)" }}>
 Platform settings
 </div>

 {selectedPlatforms.includes("pinterest") ? (
 <div>
 <FieldLabel
 hint={
 connections.pinterest
 ? null
 : <span style={{ color: "var(--cth-crimson)" }}>Pinterest not connected</span>
 }
 >
 Pinterest board
 </FieldLabel>
 <select
 value={formData.platform_extra?.pinterest_board_id || ""}
 onChange={(e) => setFormData((d) => ({
 ...d,
 platform_extra: {
 ...(d.platform_extra || {}),
 pinterest_board_id: e.target.value || undefined,
 },
 }))}
 disabled={editingLocked || !connections.pinterest || pinterestBoardsLoading}
 style={INPUT_STYLE}
 >
 <option value="">
 {pinterestBoardsLoading
 ? "Loading boards…"
 : pinterestBoards.length
 ? "Select a board"
 : "No boards available"}
 </option>
 {pinterestBoards.map((board) => (
 <option key={board.id} value={board.id}>{board.name}</option>
 ))}
 </select>
 </div>
 ) : null}

 {selectedPlatforms.includes("google_business") ? (
 <div>
 <FieldLabel
 hint={
 connections.google_business
 ? null
 : <span style={{ color: "var(--cth-crimson)" }}>Google Business not connected</span>
 }
 >
 Google Business location
 </FieldLabel>
 <select
 value={formData.platform_extra?.google_business_location_id || ""}
 onChange={(e) => setFormData((d) => ({
 ...d,
 platform_extra: {
 ...(d.platform_extra || {}),
 google_business_location_id: e.target.value || undefined,
 },
 }))}
 disabled={editingLocked || !connections.google_business || gbpLocationsLoading}
 style={INPUT_STYLE}
 >
 <option value="">
 {gbpLocationsLoading
 ? "Loading locations…"
 : gbpLocations.length
 ? "Select a location"
 : "No locations available"}
 </option>
 {gbpLocations.map((loc) => {
 const id = (loc.name || "").split("/").pop();
 return (
 <option key={id} value={id}>{loc.title || id}</option>
 );
 })}
 </select>
 </div>
 ) : null}
 </div>
 ) : null}

 <div>
 {selectedPlatforms.length > 1 ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
 {selectedPlatforms.map((platformId) => {
 const cfg = PLATFORM_CFG[platformId] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const active = activePlatformKey === platformId;
 return (
 <button
 key={platformId}
 type="button"
 onClick={() => setActivePlatformTab(platformId)}
 style={{
 display: "inline-flex", alignItems: "center", gap: 6,
 padding: "6px 12px", borderRadius: 4,
 background: active ? `${cfg.color}15` : "var(--cth-blush)",
 border: `1px solid ${active ? `${cfg.color}50` : "var(--cth-border)"}`,
 color: active ? cfg.color : "var(--cth-muted)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: "pointer",
 }}
 >
 <Icon size={13} /> {cfg.label}
 </button>
 );
 })}
 </div>
 ) : null}

 <FieldLabel
 hint={
 <span style={{ color: charCount > charLimit ? "var(--cth-crimson)" : "var(--cth-muted)" }}>
 {charCount}/{charLimit}
 </span>
 }
 >
 Content {PLATFORM_CFG[activePlatformKey]?.label ? `· ${PLATFORM_CFG[activePlatformKey].label}` : ""}
 </FieldLabel>

 <textarea
 data-testid="post-content-textarea"
 disabled={editingLocked}
 value={activePlatformData.content || formData.content || ""}
 onChange={(e) => {
 const nextValue = e.target.value;
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 content: nextValue,
 hashtags: (prev[activePlatformKey] || {}).hashtags || formData.hashtags || [],
 },
 }));
 setFormData((d) => ({
 ...d,
 content: activePlatformKey === (d.platform || selectedPlatforms[0] || "instagram") ? nextValue : d.content,
 }));
 }}
 placeholder="Write your post or use the AI generator below…"
 rows={5}
 style={{ ...INPUT_STYLE, resize: "vertical" }}
 />
 {charCount > charLimit ? (
 <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 12, color: "var(--cth-crimson)" }}>
 Over the {PLATFORM_CFG[activePlatformKey]?.label || "platform"} limit. Trim before saving.
 </p>
 ) : null}

 <div style={{
 marginTop: 12,
 background: "var(--cth-blush)",
 border: "2px solid var(--cth-gold)",
 borderRadius: 4,
 overflow: "hidden",
 }}>
 <div style={{
 display: "flex", alignItems: "center", gap: 10,
 padding: "12px 16px",
 borderBottom: "1px solid var(--cth-border)",
 background: "var(--cth-panel-white)",
 }}>
 <Sparkles size={16} style={{ color: "var(--cth-crimson)" }} />
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{
 fontFamily: SERIF, fontSize: 15, fontWeight: 600,
 color: "var(--cth-ink)", lineHeight: 1.2,
 }}>
 Ask the House
 </div>
 <div style={{
 fontFamily: SANS, fontSize: 11, color: "var(--cth-muted)",
 marginTop: 2,
 }}>
 Topic + tone → draft caption and hashtags for the active platform.
 </div>
 </div>
 <button
 type="button"
 data-testid="zuri-chat-btn"
 onClick={() => setZuriChatOpen(true)}
 disabled={editingLocked}
 title="Chat with Zuri about this post"
 style={{
 display: "inline-flex", alignItems: "center", gap: 6,
 flexShrink: 0, padding: "8px 12px", borderRadius: 4,
 background: "var(--cth-purple-deep)",
 border: "1px solid var(--cth-purple-deep)",
 color: "var(--cth-gold)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: editingLocked ? "default" : "pointer",
 opacity: editingLocked ? 0.4 : 1,
 }}
 >
 <Sparkles size={14} /> Chat with Zuri
 </button>
 </div>
 <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
 <input
 data-testid="ai-topic-input"
 disabled={editingLocked}
 placeholder="What should the post be about?"
 value={formData.topic || ""}
 onChange={(e) => setFormData((d) => ({ ...d, topic: e.target.value }))}
 style={INPUT_STYLE}
 />
 <div style={{ display: "flex", gap: 8 }}>
 <select
 disabled={editingLocked}
 value={formData.tone || "professional"}
 onChange={(e) => setFormData((d) => ({ ...d, tone: e.target.value }))}
 style={{ ...INPUT_STYLE, flex: 1, textTransform: "capitalize" }}
 >
 {TONES.map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 <button
 data-testid="generate-btn"
 type="button"
 onClick={handleGenerateContent}
 disabled={editingLocked || !formData.topic || !selectedPlatforms.length || generating}
 style={{
 ...PRIMARY_BUTTON_STYLE,
 opacity: (editingLocked || !formData.topic || !selectedPlatforms.length || generating) ? 0.4 : 1,
 }}
 >
 {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
 {generating ? "Generating…" : "Generate"}
 </button>
 </div>
 {(!formData.topic || !selectedPlatforms.length) && !generating ? (
 <p style={{ margin: 0, fontFamily: SANS, fontSize: 11, color: "var(--cth-muted)" }}>
 {!selectedPlatforms.length
 ? "Select at least one platform above to enable generation."
 : "Add a topic to enable generation."}
 </p>
 ) : null}
 </div>
 </div>
 </div>

 {(activePlatformData.hashtags || formData.hashtags || []).length > 0 ? (
 <div>
 <FieldLabel hint="Click a tag to remove">Hashtags</FieldLabel>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {(activePlatformData.hashtags || formData.hashtags || []).map((tag, i) => (
 <button
 key={i}
 type="button"
 onClick={() => removeHashtag(tag)}
 style={{
 display: "inline-flex", alignItems: "center", gap: 4,
 padding: "4px 10px", borderRadius: 999,
 background: "rgba(175,0,42,0.10)",
 border: "1px solid rgba(175,0,42,0.22)",
 color: "var(--cth-crimson)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: "pointer",
 }}
 >
 #{tag}
 <X size={11} />
 </button>
 ))}
 </div>
 </div>
 ) : null}

 <div>
 <FieldLabel>Media (optional)</FieldLabel>
 <input
 ref={mediaInputRef}
 type="file"
 accept="image/*,video/*"
 multiple
 disabled={editingLocked}
 onChange={handleMediaUpload}
 style={{ display: "none" }}
 data-testid="social-media-file-input"
 />

 {mediaPreview.length > 0 ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
 {mediaPreview.map((m, i) => (
 <div key={i} style={{ position: "relative" }}>
 {m.type === "video" ? (
 <div style={{
 width: 80, height: 80, borderRadius: 4,
 background: "var(--cth-blush)",
 border: "1px solid var(--cth-border)",
 display: "flex", alignItems: "center", justifyContent: "center",
 color: "var(--cth-crimson)",
 }}>
 <Video size={22} />
 </div>
 ) : (
 <img
 src={backendAssetUrl(m.url)}
 alt={m.name}
 style={{
 width: 80, height: 80, borderRadius: 4, objectFit: "cover",
 border: "1px solid var(--cth-border)",
 }}
 />
 )}
 <button
 type="button"
 onClick={() => removeMedia(i)}
 aria-label="Remove media"
 style={{
 position: "absolute", top: -6, right: -6,
 width: 22, height: 22, borderRadius: "50%",
 background: "var(--cth-crimson)",
 color: "var(--cth-ivory)",
 border: "none", cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center",
 }}
 >
 <X size={11} />
 </button>
 </div>
 ))}
 </div>
 ) : null}

 <button
 data-testid="upload-media-btn"
 type="button"
 onClick={() => mediaInputRef.current?.click()}
 disabled={uploadingMedia}
 style={{
 width: "100%",
 display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
 padding: "12px 16px", borderRadius: 4,
 background: "var(--cth-blush)",
 border: "1px dashed var(--cth-border)",
 color: "var(--cth-muted)",
 fontFamily: SANS, fontSize: 13, fontWeight: 500,
 cursor: uploadingMedia ? "default" : "pointer",
 opacity: uploadingMedia ? 0.7 : 1,
 }}
 >
 {uploadingMedia ? (
 <><Loader2 size={14} className="animate-spin" /> Uploading…</>
 ) : (
 <><Upload size={14} /> Upload Images or Videos</>
 )}
 </button>

 <button
 data-testid="choose-brand-asset-btn"
 type="button"
 onClick={openBrandAssetPicker}
 style={{
 width: "100%", marginTop: 8,
 display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
 padding: "12px 16px", borderRadius: 4,
 background: "var(--cth-blush)",
 border: "1px dashed var(--cth-border)",
 color: "var(--cth-muted)",
 fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
 }}
 >
 <LayoutIcon size={14} /> Choose from brand library
 </button>

 {selectedBrandAsset ? (
 <>
 <div style={{
 marginTop: 8, display: "flex", alignItems: "center", gap: 8,
 padding: "8px 10px", borderRadius: 4,
 background: "var(--cth-blush)",
 border: "1px solid var(--cth-gold)",
 }}>
 <img
 src={backendAssetUrl(selectedBrandAsset.url)}
 alt=""
 style={{ width: 32, height: 32, borderRadius: 3, objectFit: "cover" }}
 />
 <span style={{ flex: 1, fontFamily: SANS, fontSize: 12, color: "var(--cth-ink)" }}>
 Brand asset selected: {selectedBrandAsset.label}
 </span>
 <button
 type="button"
 onClick={() => setSelectedBrandAsset(null)}
 aria-label="Clear selected brand asset"
 style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cth-muted)", display: "flex" }}
 >
 <X size={12} />
 </button>
 </div>
 <button
 type="button"
 onClick={handleGenerateFromAsset}
 disabled={editingLocked || !selectedBrandAsset || captionFromAssetLoading}
 style={{
 width: "100%", marginTop: 8,
 display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
 padding: "10px 16px", borderRadius: 4,
 background: "var(--cth-gold)",
 border: "1px solid var(--cth-gold)",
 color: "var(--cth-ink)",
 fontFamily: SANS, fontSize: 13, fontWeight: 600,
 cursor: captionFromAssetLoading ? "not-allowed" : "pointer",
 opacity: captionFromAssetLoading ? 0.7 : 1,
 }}
 >
 {captionFromAssetLoading ? (
 <><Loader2 size={14} className="animate-spin" /> Generating…</>
 ) : (
 <><Sparkles size={14} /> Generate copy from this asset</>
 )}
 </button>
 </>
 ) : null}
 </div>

 {editingLocked ? null : (
 <div>
 <FieldLabel>Schedule (optional)</FieldLabel>
 <input
 type="datetime-local"
 value={formData.scheduled_for ? formData.scheduled_for.slice(0, 16) : ""}
 onChange={(e) => setFormData((d) => ({
 ...d,
 scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
 }))}
 style={INPUT_STYLE}
 />
 </div>
 )}

 <div>
 <FieldLabel>CTA URL</FieldLabel>
 <input
 type="url"
 disabled={editingLocked}
 value={formData.cta_url || ""}
 onChange={(e) => setFormData((d) => ({ ...d, cta_url: e.target.value }))}
 placeholder="https://yourdomain.com/cta"
 style={INPUT_STYLE}
 />
 </div>

 <div>
 <FieldLabel>Link-in-bio URL</FieldLabel>
 <input
 type="url"
 disabled={editingLocked}
 value={formData.link_in_bio_url || ""}
 onChange={(e) => setFormData((d) => ({ ...d, link_in_bio_url: e.target.value }))}
 placeholder="https://yourdomain.com/link-in-bio"
 style={INPUT_STYLE}
 />
 </div>

 <div style={{
 borderTop: "1px solid var(--cth-border)",
 paddingTop: 16,
 }}>
 <div style={{ marginBottom: 10 }}>
 <div style={EYEBROW_STYLE}>Tracked Links</div>
 <p style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
 Create tracked links for the CTA, profile, or campaign URL on this post.
 </p>
 </div>
 <TrackingLinkManager
 title="Social Tracking Links"
 subtitle=""
 defaultLabel={formData?.title || formData?.topic || "Social CTA"}
 defaultUrl={
 formData?.cta_url ||
 formData?.link_in_bio_url ||
 handoff?.ctaUrl ||
 handoff?.cta_url ||
 handoff?.landingPageUrl ||
 handoff?.landing_page_url ||
 ""
 }
 context={{
 source: "social_media_manager",
 platform: activePlatformKey || "",
 post_id: editingPostId || "",
 campaign_id: handoff?.campaignId || activeCampaignId || "",
 cta_url: formData?.cta_url || "",
 link_in_bio_url: formData?.link_in_bio_url || "",
 metadata: { surface: activeView || "" },
 }}
 compact
 />
 </div>

 <div>
 <FieldLabel>First comment (optional)</FieldLabel>
 <textarea
 disabled={editingLocked}
 value={formData.first_comment || ""}
 onChange={(e) => setFormData((d) => ({ ...d, first_comment: e.target.value }))}
 rows={3}
 placeholder="Add a first comment to publish right after the post…"
 style={{ ...INPUT_STYLE, resize: "vertical" }}
 />
 </div>
 </div>

 <div>
 <div className="section-kicker">Platform Preview</div>
 <div className="preview-panel">
 <div className="preview-tabs">
 {(selectedPlatforms.length ? selectedPlatforms : [activePlatformKey]).map((pid) => {
 const cfg = PLATFORM_CFG[pid] || PLATFORM_CFG.instagram;
 return (
 <button
 key={pid}
 type="button"
 className={`preview-tab${activePlatformKey === pid ? " active" : ""}`}
 onClick={() => setActivePlatformTab(pid)}
 >
 {cfg.label}
 </button>
 );
 })}
 </div>
 <div className="preview-content">
 <div className="social-preview">
 <div className="social-preview-head">
 <div className="mini-avatar">CTH</div>
 <div>
 <strong>{gridProfile.display_name || "Core Truth House"}</strong>
 <div className="muted" style={{ fontSize: 9 }}>Preview · {gridProfile.handle || "@coretruthhouse"}</div>
 </div>
 </div>
 <div className="social-preview-media">
 <span className="preview-size-badge">
 {({
 instagram: "1080 × 1350 · 4:5",
 facebook: "1200 × 630 · 1.91:1",
 linkedin: "1200 × 627 · 1.91:1",
 tiktok: "1080 × 1920 · 9:16",
 pinterest: "1000 × 1500 · 2:3",
 google_business: "1200 × 900 · 4:3",
 threads: "1080 × 1350 · 4:5",
 }[activePlatformKey] || "1080 × 1350 · 4:5")}
 </span>
 {mediaPreview[0]?.url && mediaPreview[0]?.type !== "video" ? (
 <img src={backendAssetUrl(mediaPreview[0].url)} alt="" />
 ) : (
 <ImageIcon size={38} />
 )}
 </div>
 <div className="social-preview-copy">
 {formData.hook ? (
 <><strong>{formData.hook}</strong>{"\n\n"}</>
 ) : null}
 {activePlatformData.content || formData.content ? (
 activePlatformData.content || formData.content
 ) : (
 <span className="muted">Your caption preview appears here as you write.</span>
 )}
 {(activePlatformData.hashtags || formData.hashtags || []).length ? (
 <>
 {"\n\n"}
 <span style={{ color: "#666" }}>
 {(activePlatformData.hashtags || formData.hashtags || [])
 .map((h) => (String(h).startsWith("#") ? h : `#${h}`))
 .join(" ")}
 </span>
 </>
 ) : null}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="modal-footer">
 <button type="button" onClick={closePostModal} style={SECONDARY_BUTTON_STYLE}>
 {editingLocked ? "Close" : "Cancel"}
 </button>
 {editingLocked ? (
 // No Save: this post is already live and nothing here can change it.
 // Duplicating is the only forward action that makes sense.
 <button
 data-testid="duplicate-post-btn"
 type="button"
 onClick={() => openAsDraftCopy({ ...formData, id: editingPostId })}
 style={PRIMARY_BUTTON_STYLE}
 >
 <Copy size={14} />
 Duplicate as draft
 </button>
 ) : (
 <button
 data-testid="save-post-btn"
 type="button"
 onClick={handleCreatePost}
 disabled={!canSavePost || savingPost}
 style={{
 ...PRIMARY_BUTTON_STYLE,
 opacity: (!canSavePost || savingPost) ? 0.4 : 1,
 }}
 >
 {savingPost ? <Loader2 size={14} className="animate-spin" /> : null}
 {modalSubmitLabel}
 </button>
 )}
 </div>
 </div>
 </div>
 ) : null}

 {showCampaignDrawer ? (
 <>
 <div
 onClick={() => setShowCampaignDrawer(false)}
 style={{
 position: "fixed", inset: 0, zIndex: 60,
 background: "rgba(13, 0, 16, 0.5)",
 }}
 />
 <div
 style={{
 position: "fixed", top: 0, right: 0,
 height: "100vh", width: 420, maxWidth: "100vw",
 background: "var(--cth-panel-white)",
 borderLeft: "1px solid var(--cth-border)",
 boxShadow: "-12px 0 32px rgba(13,0,16,0.18)",
 zIndex: 61,
 display: "flex", flexDirection: "column",
 fontFamily: SANS,
 }}
 >
 <div style={{
 padding: "18px 22px",
 borderBottom: "1px solid var(--cth-border)",
 display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
 }}>
 <div>
 <Eyebrow>Compose</Eyebrow>
 <h3 style={{
 margin: "4px 0 0",
 fontFamily: SERIF, fontSize: 20, fontWeight: 600,
 color: "var(--cth-ink)",
 }}>
 From Campaign
 </h3>
 </div>
 <IconButton label="Close drawer" onClick={() => setShowCampaignDrawer(false)}>
 <X size={16} />
 </IconButton>
 </div>

 <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
 <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
 {[["campaign", "From Campaign"], ["brand_assets", "Brand Assets"]].map(([key, label]) => (
 <button
 key={key}
 type="button"
 onClick={() => openDrawerTab(key)}
 style={{
 flex: 1, padding: "8px 10px", borderRadius: 4, cursor: "pointer",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 background: drawerTab === key ? "rgba(196,169,91,0.15)" : "var(--cth-blush)",
 border: `1px solid ${drawerTab === key ? "var(--cth-gold)" : "var(--cth-border)"}`,
 color: drawerTab === key ? "var(--cth-ink)" : "var(--cth-muted)",
 }}
 >
 {label}
 </button>
 ))}
 </div>

 {drawerTab === "brand_assets" ? (
 brandAssetsLoading ? (
 <p style={{ color: "var(--cth-muted)", fontSize: 13, fontFamily: SANS }}>Loading brand assets…</p>
 ) : brandAssets.length === 0 ? (
 <EmptyState
 icon={LayoutIcon}
 title="No brand assets yet"
 body="Upload brand assets in Identity Studio to use them here."
 />
 ) : (
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
 {brandAssets.map((a) => {
 const id = a.asset_id || a.id;
 const isSel = selectedBrandAsset?.asset_id === id;
 const rawUrl = a.preview_url || a.url || "";
 return (
 <button
 key={id}
 type="button"
 title={a.label || a.filename || "Asset"}
 onClick={() => {
 setSelectedBrandAsset({ asset_id: id, url: rawUrl, label: a.label || a.filename || "Asset" });
 setShowCampaignDrawer(false);
 }}
 style={{
 padding: 0,
 background: "var(--cth-blush)",
 border: `2px solid ${isSel ? "var(--cth-gold)" : "var(--cth-border)"}`,
 borderRadius: 4, cursor: "pointer", overflow: "hidden",
 aspectRatio: "1 / 1", position: "relative",
 }}
 >
 {rawUrl ? (
 <img src={backendAssetUrl(rawUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 ) : null}
 {isSel ? (
 <div style={{
 position: "absolute", top: 4, right: 4,
 background: "var(--cth-purple-deep)", color: "var(--cth-gold)",
 borderRadius: 3, padding: 2,
 }}>
 <Check size={10} />
 </div>
 ) : null}
 </button>
 );
 })}
 </div>
 )
 ) : !drawerSelectedCampaignId ? (
 drawerCampaignsLoading ? (
 <p style={{ color: "var(--cth-muted)", fontSize: 13, fontFamily: SANS }}>Loading campaigns…</p>
 ) : drawerCampaigns.length === 0 ? (
 <EmptyState
 icon={LayoutIcon}
 title="No campaigns yet"
 body="Create one in Campaign Builder to compose social posts from it."
 />
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
 {drawerCampaigns.map((c) => (
 <div
 key={c.id}
 style={{
 padding: "12px 14px",
 ...SOFT_PANEL_STYLE,
 display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
 }}
 >
 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: "var(--cth-ink)" }}>
 {c.name || "Untitled"}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-muted)", textTransform: "capitalize" }}>
 {c.status || "draft"}
 </div>
 </div>
 <button
 type="button"
 onClick={() => selectDrawerCampaign(c)}
 style={{ ...PRIMARY_BUTTON_STYLE, padding: "6px 12px", fontSize: 12 }}
 >
 Use
 </button>
 </div>
 ))}
 </div>
 )
 ) : drawerLoading ? (
 <p style={{ color: "var(--cth-muted)", fontSize: 13, fontFamily: SANS }}>Loading campaign assets…</p>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
 <button
 type="button"
 onClick={() => { setDrawerSelectedCampaignId(null); setDrawerContent([]); setDrawerMedia([]); }}
 style={{
 alignSelf: "flex-start",
 background: "transparent", border: "none", padding: 0,
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 color: "var(--cth-muted)",
 cursor: "pointer",
 textDecoration: "underline",
 }}
 >
 ← Back to campaigns
 </button>

 <div>
 <Eyebrow>Pick Content</Eyebrow>
 {drawerContent.length === 0 ? (
 <p style={{ color: "var(--cth-muted)", fontSize: 12, fontFamily: SANS, margin: "8px 0 0" }}>
 No content for this campaign.
 </p>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
 {drawerContent.map((item) => {
 const isSel = drawerSelectedContentId === item.id;
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => setDrawerSelectedContentId(isSel ? null : item.id)}
 style={{
 textAlign: "left",
 padding: "10px 12px",
 background: isSel ? "rgba(196,169,91,0.15)" : "var(--cth-blush)",
 border: `1px solid ${isSel ? "var(--cth-gold)" : "var(--cth-border)"}`,
 borderRadius: 4,
 cursor: "pointer",
 fontFamily: SANS,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
 {isSel ? <Check size={12} color="var(--cth-purple-deep)" /> : null}
 <span style={{ fontWeight: 600, fontSize: 13, color: "var(--cth-ink)" }}>
 {item.title || item.content_type || "Untitled"}
 </span>
 </div>
 <p style={{ margin: 0, fontSize: 11, color: "var(--cth-muted)", lineHeight: 1.4 }}>
 {(item.content || "").replace(/[#*_>`]/g, "").slice(0, 100)}
 </p>
 </button>
 );
 })}
 </div>
 )}
 </div>

 <div>
 <Eyebrow>Pick Media</Eyebrow>
 {drawerMedia.length === 0 ? (
 <p style={{ color: "var(--cth-muted)", fontSize: 12, fontFamily: SANS, margin: "8px 0 0" }}>
 No media for this campaign.
 </p>
 ) : (
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
 {drawerMedia.map((m) => {
 const id = m.asset_id || m.id;
 const isSel = drawerSelectedMediaIds.includes(id);
 const url = m.preview_url || m.file_url || m.url || "";
 const isVideo = m.media_type === "video" || m.file_type?.startsWith?.("video");
 return (
 <button
 key={id}
 type="button"
 onClick={() => setDrawerSelectedMediaIds((prev) =>
 prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
 )}
 style={{
 padding: 0,
 background: "var(--cth-blush)",
 border: `2px solid ${isSel ? "var(--cth-gold)" : "var(--cth-border)"}`,
 borderRadius: 4,
 cursor: "pointer",
 overflow: "hidden",
 aspectRatio: "1 / 1",
 position: "relative",
 }}
 >
 {url ? (
 isVideo ? (
 <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
 ) : (
 <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 )
 ) : null}
 {isSel ? (
 <div style={{
 position: "absolute", top: 4, right: 4,
 background: "var(--cth-purple-deep)",
 color: "var(--cth-gold)",
 borderRadius: 3, padding: 2,
 }}>
 <Check size={10} />
 </div>
 ) : null}
 </button>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {drawerSelectedCampaignId ? (
 <div style={{ padding: "16px 22px", borderTop: "1px solid var(--cth-border)" }}>
 <button
 type="button"
 onClick={applyDrawerSelections}
 style={{ ...PRIMARY_BUTTON_STYLE, width: "100%", padding: "12px 16px" }}
 >
 Compose Post
 </button>
 </div>
 ) : null}
 </div>
 </>
 ) : null}

 {showModal === "post" ? (
 <AskTheHouseDrawer
 open={zuriChatOpen}
 onClose={() => setZuriChatOpen(false)}
 surface="social_composer"
 currentDraft={buildZuriDraft()}
 onInsert={handleZuriInsert}
 />
 ) : null}

 <ConfirmModal confirm={confirm} busy={confirmBusy} onCancel={cancelConfirm} onConfirm={performConfirm} />
 <Toast toast={toast} />
 </main>
 </div>
 );
}
