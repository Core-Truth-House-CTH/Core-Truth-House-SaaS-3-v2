import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import NotificationBell from "../components/NotificationBell";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ContactRound,
  Copy,
  Download,
  Facebook,
  FileText,
  Hash,
  Heart,
  Home,
  ImagePlus,
  Instagram,
  Linkedin,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Music,
  PenTool,
  Pin,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings,
  Share2,
  Twitter,
  ShieldCheck,
  Smile,
  Sparkles,
  Store as StoreIcon,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  Video,
  X,
} from "lucide-react";

const ADMIN_ROLES = ["SUPER_ADMIN", "OPS_ADMIN", "BILLING_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];
const REFRESH_INTERVAL_MS = 7000;
const MAX_INLINE_IMAGE_BYTES = 100 * 1024;

const TABS = [
  { id: "about", label: "About" },
  { id: "discussion", label: "Discussion" },
  { id: "wins", label: "Wins" },
  { id: "events", label: "Events" },
  { id: "files", label: "Files" },
];

const SAAS_LINKS = [
  { path: "/command-center", label: "Command Center", icon: Home },
  { path: "/brand-intelligence", label: "Brand Intelligence", icon: Sparkles },
  { path: "/strategic-os", label: "Strategic OS", icon: Compass },
  { path: "/content-studio", label: "Content Studio", icon: PenTool },
  { path: "/campaign-builder", label: "Campaign Builder", icon: Rocket },
  { path: "/calendar", label: "Calendar", icon: CalendarIcon },
  { path: "/crm", label: "CRM", icon: ContactRound },
  { path: "/tutorials", label: "Tutorials", icon: Video },
  { path: "/community", label: "Community", icon: UsersRound },
  { path: "/store", label: "Store", icon: StoreIcon },
];

// lucide-react has no native TikTok icon; using Music as the closest visual fallback
const SOCIAL_PROVIDERS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "twitter", label: "Twitter / X", icon: Twitter },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "tiktok", label: "TikTok", icon: Music },
];

const RULES = [
  "Keep posts tied to progress: clarity, offers, content, systems, or implementation.",
  "Be helpful and direct. No vague advice, no performative reactions.",
  "Respect cohort confidentiality. What's shared here stays here.",
  "Keep self-promotion in the Wins thread only.",
  "When tagged, reply within 48 hours.",
];

const EMOJIS = [
  "😀", "😂", "😍", "🥳", "😎", "🤔", "😢", "😡",
  "🔥", "💯", "🚀", "✨", "👍", "👎", "🙏", "👏",
  "💪", "❤️", "💔", "🎉", "✅", "❌", "💡", "📌",
  "⚡", "🌟", "💼", "📈", "🎯", "🏆", "🤝", "👀",
];

const EVENT_TYPE_LABELS = {
  office_hours: "Office Hours",
  workshop: "Workshop",
  cohort_call: "Cohort Call",
  deadline: "Deadline",
  other: "Other",
};

const EVENT_TYPE_COLORS = {
  office_hours: "var(--cth-command-gold)",
  workshop: "var(--cth-command-purple)",
  cohort_call: "var(--cth-command-crimson)",
  deadline: "var(--cth-command-cinnabar)",
  other: "var(--cth-command-muted)",
};

function classNames(...items) { return items.filter(Boolean).join(" "); }

function ymd(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventDateKey(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatFileDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

const FILE_CATEGORY_BY_EXT = {
  ".pdf": "document",
  ".docx": "document",
  ".xlsx": "document",
  ".pptx": "document",
  ".txt": "document",
  ".csv": "document",
  ".md": "document",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
  ".mov": "video",
  ".mp3": "audio",
  ".zip": "archive",
};

function fileCategoryFromExt(ext) {
  if (!ext) return "other";
  return FILE_CATEGORY_BY_EXT[String(ext).toLowerCase()] || "other";
}

const FILE_CATEGORY_COLORS = {
  document: "var(--cth-command-purple)",
  image: "var(--cth-command-gold)",
  video: "var(--cth-command-crimson)",
  audio: "var(--cth-command-cinnabar)",
  archive: "var(--cth-command-muted)",
  other: "var(--cth-command-muted)",
};

const FILE_CATEGORY_ICONS = {
  document: FileText,
  image: ImagePlus,
  video: Video,
  audio: Music,
  archive: FileText,
  other: FileText,
};

function initials(name, fallback = "CM") {
  const clean = String(name || "").trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || fallback;
}

function timeAgo(iso) {
  if (!iso) return "just now";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  const secs = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function pickItems(response, key, fallback = []) {
  if (!response) return fallback;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  return fallback;
}

function resolveAssetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof apiClient.buildApiUrl === "function") return apiClient.buildApiUrl(path);
  return path;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractAttachedImage(body) {
  const match = body && body.match(/\[IMAGE:(data:image\/[a-z]+;base64,[^\]]+)\]/i);
  if (!match) return { text: body || "", image: "" };
  return { text: body.replace(match[0], "").trim(), image: match[1] };
}

function useClickOutside(ref, onClose, active = true) {
  useEffect(() => {
    if (!active) return;
    function onClick(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, onClose, active]);
}

// =========================================================
// Primitives
// =========================================================

function Avatar({ name, profileImage, size = 36, ring = false }) {
  const url = resolveAssetUrl(profileImage);
  const ringStyle = ring ? { boxShadow: "0 0 0 2px var(--cth-command-panel)" } : {};
  if (url) {
    return (
      <img
        src={url}
        alt={name || "Member"}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{
          width: size,
          height: size,
          border: "1px solid var(--cth-command-border)",
          background: "var(--cth-command-panel-soft)",
          ...ringStyle,
        }}
      />
    );
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: "var(--cth-command-ink)",
        color: "var(--cth-command-panel)",
        fontSize: Math.max(10, Math.floor(size * 0.36)),
        ...ringStyle,
      }}
    >
      {initials(name)}
    </div>
  );
}

function StackedAvatars({ members, max = 5, size = 28 }) {
  const visible = members.slice(0, max);
  const overflow = Math.max(0, members.length - max);
  return (
    <div className="flex items-center" style={{ marginLeft: 0 }}>
      <div className="flex -space-x-2">
        {visible.map((m) => (
          <Avatar
            key={m.user_id || m.id}
            name={m.display_name || m.name}
            profileImage={m.profile_image_url}
            size={size}
            ring
          />
        ))}
        {overflow > 0 ? (
          <div
            className="grid place-items-center rounded-full font-semibold"
            style={{
              width: size,
              height: size,
              background: "var(--cth-command-panel-soft)",
              color: "var(--cth-command-ink)",
              border: "1px solid var(--cth-command-border)",
              boxShadow: "0 0 0 2px var(--cth-command-panel)",
              fontSize: Math.max(9, Math.floor(size * 0.34)),
            }}
          >
            +{overflow}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoleBadge({ role, isAdmin }) {
  if (!isAdmin) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{
          background: "var(--cth-command-panel-soft)",
          color: "var(--cth-command-muted)",
          border: "1px solid var(--cth-command-border)",
        }}
      >
        Member
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{ background: "var(--cth-command-ink)", color: "var(--cth-command-panel)" }}
    >
      <ShieldCheck size={11} /> {role || "Admin"}
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div
      className="fixed bottom-5 left-1/2 z-[1300] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
      style={{
        background: "var(--cth-command-ink)",
        color: "var(--cth-command-panel)",
      }}
    >
      {message}
    </div>
  );
}

// =========================================================
// Composer pieces
// =========================================================

function EmojiPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-30 mb-2 grid w-[280px] grid-cols-8 gap-1 rounded-xl p-3 shadow-lg"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick(emoji)}
          className="rounded text-lg leading-none hover:bg-[var(--cth-command-panel-soft)]"
          style={{ padding: "4px 0" }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ComposerToolbar({ onFile, onEmoji, fileAccept = "image/*", children }) {
  const fileRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  return (
    <div className="relative flex items-center gap-1">
      <input
        ref={fileRef}
        type="file"
        accept={fileAccept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <button type="button" onClick={() => fileRef.current?.click()} title="Attach image"
        className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-muted)" }}>
        <ImagePlus size={16} />
      </button>
      <button type="button" onClick={() => setShowEmoji((v) => !v)} title="Insert emoji"
        className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-muted)" }}>
        <Smile size={16} />
      </button>
      {showEmoji ? (
        <EmojiPicker onPick={(e) => { onEmoji(e); setShowEmoji(false); }} onClose={() => setShowEmoji(false)} />
      ) : null}
      {children}
    </div>
  );
}

function ChannelDropdown({ channels, activeChannelId, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  const current = channels.find((c) => c.id === activeChannelId) || channels[0];
  if (!channels.length) return null;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition-colors hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-muted)" }}>
        <Hash size={12} />
        {current?.name || "Channel"}
        <ChevronDown size={12} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl py-1 shadow-lg"
          style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
          {channels.map((channel) => (
            <button key={channel.id} type="button" disabled={channel.locked}
              onClick={() => { onChange(channel.id); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs disabled:opacity-40 hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-ink)" }}>
              <span className="truncate">{channel.name}</span>
              {channel.locked ? <Lock size={11} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// =========================================================
// Top Nav components
// =========================================================

function CommunityTopNav({
  searchQuery,
  onSearchChange,
  onOpenDrawer,
  onChatClick,
  onProfileClick,
  profileOpen,
  profileRef,
  user,
  onSignOut,
  onPeopleClick,
  navigate,
}) {
  return (
    <header
      className="sticky top-0 z-40 mb-0 w-full"
      style={{
        background: "var(--cth-command-ink)",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-2 sm:px-5">
        {/* Left: wordmark + search */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/command-center")}
            className="hidden shrink-0 font-serif text-sm font-semibold sm:inline tracking-tight"
            style={{ color: "var(--cth-command-gold)" }}
          >
            Core Truth House
          </button>
          <div
            className="relative hidden min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1.5 md:flex"
            style={{ background: "rgba(255,255,255,0.08)", maxWidth: 360 }}
          >
            <Search size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search community"
              className="w-full bg-transparent text-xs outline-none placeholder:text-white/40"
              style={{ color: "var(--cth-command-panel)" }}
            />
          </div>
        </div>

        {/* Center: nav icons */}
        <nav className="flex items-center gap-1">
          <NavIconButton title="Home" onClick={() => navigate("/command-center")} icon={Home} />
          <NavIconButton title="Videos" onClick={() => navigate("/tutorials")} icon={Video} />
          <NavIconButton title="Store" onClick={() => navigate("/store")} icon={StoreIcon} />
          <NavIconButton title="People" onClick={onPeopleClick} icon={UsersRound} />
        </nav>

        {/* Right: drawer + chat + bell + avatar */}
        <div className="flex items-center gap-1.5">
          <NavIconButton title="Menu" onClick={onOpenDrawer} icon={Menu} />
          <NavIconButton title="Chat" onClick={onChatClick} icon={MessageCircle} />
          <div style={{ color: "var(--cth-command-panel)" }}>
            <NotificationBell />
          </div>
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={onProfileClick}
              className="grid h-8 w-8 place-items-center overflow-hidden rounded-full transition-opacity hover:opacity-80"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.fullName || "Profile"} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center font-semibold"
                  style={{ background: "var(--cth-command-purple)", color: "var(--cth-command-gold)", fontSize: 11 }}>
                  {initials(user?.fullName || user?.firstName || "U")}
                </div>
              )}
            </button>
            {profileOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl shadow-lg"
                style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
                <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
                  <p className="truncate text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }}>
                    {user?.fullName || user?.firstName || "Account"}
                  </p>
                  <p className="truncate text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                    {user?.primaryEmailAddress?.emailAddress || ""}
                  </p>
                </div>
                <button type="button" onClick={() => navigate("/command-center")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--cth-command-panel-soft)]"
                  style={{ color: "var(--cth-command-ink)" }}>
                  <Home size={12} /> Command Center
                </button>
                <button type="button" onClick={onSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--cth-command-panel-soft)]"
                  style={{ color: "var(--cth-command-crimson)" }}>
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="px-3 pb-2 md:hidden">
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Search size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search community"
            className="w-full bg-transparent text-xs outline-none placeholder:text-white/40"
            style={{ color: "var(--cth-command-panel)" }}
          />
        </div>
      </div>
    </header>
  );
}

function NavIconButton({ title, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full transition-colors"
      style={{ color: "var(--cth-command-panel)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={17} />
    </button>
  );
}

function NavDrawer({ open, onClose, navigate }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex" onClick={onClose}>
      <div className="flex-1" style={{ background: "rgba(13,0,16,0.5)" }} />
      <aside
        onClick={(event) => event.stopPropagation()}
        className="h-full w-full max-w-xs overflow-y-auto"
        style={{ background: "var(--cth-command-panel)", borderLeft: "1px solid var(--cth-command-border)" }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <p className="font-serif text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
            Navigate
          </p>
          <button type="button" onClick={onClose} className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>
        <nav className="py-2">
          {SAAS_LINKS.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => { navigate(link.path); onClose(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-ink)" }}
            >
              <link.icon size={15} style={{ color: "var(--cth-command-crimson)" }} />
              <span>{link.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}

// =========================================================
// Hero action buttons (Invite / Share / Joined)
// =========================================================

function InviteModal({ open, onClose }) {
  // TODO: wire to backend invite/waitlist endpoint once available
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" style={{ background: "rgba(13,0,16,0.55)" }} onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            Invite to community
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 text-sm leading-6" style={{ color: "var(--cth-command-ink)" }}>
          <p>
            This sends a private invite link. The recipient must complete the brand diagnostic scorecard and pay before access is granted.
          </p>
          <p className="mt-3" style={{ color: "var(--cth-command-muted)" }}>
            If the current cohort is full, the invitee is automatically added to the waitlist for the next cohort.
          </p>
          <input
            type="email"
            placeholder="recipient@example.com"
            className="mt-4 w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--cth-command-blush)",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-ink)",
            }}
          />
          <textarea
            rows={3}
            placeholder="Personal note (optional)"
            className="mt-2 w-full resize-y rounded-md px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--cth-command-blush)",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-ink)",
            }}
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--cth-command-border)" }}>
          <button type="button" onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ color: "var(--cth-command-muted)" }}>
            Cancel
          </button>
          <button type="button" onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--cth-command-crimson)", color: "#fff" }}>
            <UserPlus size={12} /> Send invite
          </button>
        </div>
      </div>
    </div>
  );
}

function SharePopover({ open, onClose, anchorRef, onCopy, cohortName }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose, open);
  if (!open) return null;
  const shareUrl = "https://coretruthhouse.com/cohort";
  const shareText = `Join me in the ${cohortName || "Core Truth House"} cohort`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const em = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`;
  return (
    <div ref={ref} className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-xl shadow-lg"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <a href={tw} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-ink)" }}>
        <Share2 size={12} /> Share on X
      </a>
      <a href={fb} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-ink)" }}>
        <Share2 size={12} /> Share on Facebook
      </a>
      <a href={li} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-ink)" }}>
        <Share2 size={12} /> Share on LinkedIn
      </a>
      <a href={em} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-ink)" }}>
        <Mail size={12} /> Share via email
      </a>
      <button type="button" onClick={onCopy}
        className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-ink)", borderColor: "var(--cth-command-border)" }}>
        <Copy size={12} /> Copy link
      </button>
    </div>
  );
}

function JoinedDropdown({ open, onClose, onManageNotifications, onLeave }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose, open);
  if (!open) return null;
  return (
    <div ref={ref} className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl shadow-lg"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <button type="button" onClick={onManageNotifications}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-ink)" }}>
        <Settings size={12} /> Manage notifications
      </button>
      <button type="button" onClick={onLeave}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--cth-command-panel-soft)]"
        style={{ color: "var(--cth-command-crimson)" }}>
        <LogOut size={12} /> Leave group
      </button>
    </div>
  );
}

function HeroActions({ cohortName, onInvite, onLeave, onToast }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [joinedOpen, setJoinedOpen] = useState(false);
  const shareWrapRef = useRef(null);
  const joinedWrapRef = useRef(null);

  async function handleShareClick() {
    const shareUrl = "https://coretruthhouse.com/cohort";
    const shareText = `Join me in the ${cohortName || "Core Truth House"} cohort`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: cohortName, text: shareText, url: shareUrl });
        return;
      } catch {
        // user dismissed or failed — fall through to popover
      }
    }
    setShareOpen(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText("https://coretruthhouse.com/cohort");
      onToast("Link copied");
    } catch {
      onToast("Could not copy link");
    }
    setShareOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onInvite}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
        style={{ background: "var(--cth-command-crimson)", color: "#fff" }}
      >
        <UserPlus size={13} /> Invite
      </button>
      <div ref={shareWrapRef} className="relative">
        <button
          type="button"
          onClick={handleShareClick}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
          style={{
            background: "var(--cth-command-panel)",
            color: "var(--cth-command-ink)",
            border: "1px solid var(--cth-command-border)",
          }}
        >
          <Share2 size={13} /> Share
        </button>
        <SharePopover open={shareOpen} onClose={() => setShareOpen(false)} anchorRef={shareWrapRef} onCopy={handleCopy} cohortName={cohortName} />
      </div>
      <div ref={joinedWrapRef} className="relative">
        <button
          type="button"
          onClick={() => setJoinedOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
          style={{
            background: "var(--cth-command-panel-soft)",
            color: "var(--cth-command-ink)",
            border: "1px solid var(--cth-command-border)",
          }}
        >
          <Check size={13} /> Joined
          <ChevronDown size={11} />
        </button>
        <JoinedDropdown
          open={joinedOpen}
          onClose={() => setJoinedOpen(false)}
          onManageNotifications={() => { setJoinedOpen(false); onToast("Coming soon"); }}
          onLeave={() => { setJoinedOpen(false); onLeave(); }}
        />
      </div>
    </div>
  );
}

// =========================================================
// Tab bar
// =========================================================

function TabBar({ active, onChange, isAdmin, onOpenSettings }) {
  return (
    <div
      className="sticky top-[52px] z-30 w-full"
      style={{
        background: "var(--cth-command-blush)",
        borderBottom: "1px solid var(--cth-command-border)",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-3 sm:px-5">
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className="relative px-3 py-3 text-sm font-semibold transition-colors"
                style={{
                  color: isActive ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
                }}
              >
                {tab.label}
                <span
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-opacity"
                  style={{
                    background: "var(--cth-command-crimson)",
                    opacity: isActive ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </nav>
        {isAdmin === true ? (
          <button
            type="button"
            onClick={onOpenSettings}
            title="Community settings"
            className="rounded-full p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
            style={{ color: "var(--cth-command-muted)" }}
          >
            <Settings size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// =========================================================
// Settings drawer (admin only)
// =========================================================

function SettingsDrawer({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex justify-end" onClick={onClose}>
      <div className="flex-1" style={{ background: "rgba(13,0,16,0.5)" }} />
      <aside
        onClick={(event) => event.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto"
        style={{ background: "var(--cth-command-blush)", borderLeft: "1px solid var(--cth-command-border)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: "var(--cth-command-blush)", borderBottom: "1px solid var(--cth-command-border)" }}>
          <h2 className="inline-flex items-center gap-2 font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            <Settings size={14} style={{ color: "var(--cth-command-crimson)" }} /> Community settings
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-3">
          {children}
        </div>
      </aside>
    </div>
  );
}

// =========================================================
// Admin panel (reused inside SettingsDrawer)
// =========================================================

function AdminPanel({
  settings, selectedMember, onSaveSettings, onSaveSocialLinks, onCreateChannel, onCreateResource,
  onSaveMember, onAvatarUpload, onRefresh, saving,
}) {
  const [section, setSection] = useState("settings");
  const [settingsDraft, setSettingsDraft] = useState({
    cohort_name: settings?.cohort_name || "",
    cohort_description: settings?.cohort_description || "",
    cover_image_url: settings?.cover_image_url || "",
  });
  useEffect(() => {
    setSettingsDraft({
      cohort_name: settings?.cohort_name || "",
      cohort_description: settings?.cohort_description || "",
      cover_image_url: settings?.cover_image_url || "",
    });
  }, [settings?.cohort_name, settings?.cohort_description, settings?.cover_image_url]);

  const [coverPreviewUrl, setCoverPreviewUrl] = useState(settings?.cover_image_url || "");
  useEffect(() => {
    const t = setTimeout(() => setCoverPreviewUrl(settingsDraft.cover_image_url || ""), 400);
    return () => clearTimeout(t);
  }, [settingsDraft.cover_image_url]);

  const [socialDraft, setSocialDraft] = useState({
    instagram: settings?.social_links?.instagram || "",
    facebook: settings?.social_links?.facebook || "",
    twitter: settings?.social_links?.twitter || "",
    linkedin: settings?.social_links?.linkedin || "",
    tiktok: settings?.social_links?.tiktok || "",
  });
  useEffect(() => {
    setSocialDraft({
      instagram: settings?.social_links?.instagram || "",
      facebook: settings?.social_links?.facebook || "",
      twitter: settings?.social_links?.twitter || "",
      linkedin: settings?.social_links?.linkedin || "",
      tiktok: settings?.social_links?.tiktok || "",
    });
  }, [
    settings?.social_links?.instagram,
    settings?.social_links?.facebook,
    settings?.social_links?.twitter,
    settings?.social_links?.linkedin,
    settings?.social_links?.tiktok,
  ]);

  const [channelDraft, setChannelDraft] = useState({ name: "", description: "", locked: false });
  const [resourceDraft, setResourceDraft] = useState({ title: "", url: "", description: "" });
  const [memberDraft, setMemberDraft] = useState({
    user_id: "", display_name: "", role: "", cohort_stage: "", location: "", timezone: "",
    focus: "", offer: "", needs_support_with: "", tags: "",
  });
  useEffect(() => {
    if (selectedMember?.user_id) {
      setMemberDraft({
        user_id: selectedMember.user_id || "",
        display_name: selectedMember.display_name || selectedMember.name || "",
        role: selectedMember.role || "",
        cohort_stage: selectedMember.cohort_stage || selectedMember.cohort || "",
        location: selectedMember.location || "",
        timezone: selectedMember.timezone || "",
        focus: selectedMember.focus || "",
        offer: selectedMember.offer || "",
        needs_support_with: selectedMember.needs_support_with || selectedMember.needs || "",
        tags: Array.isArray(selectedMember.tags) ? selectedMember.tags.join(", ") : (selectedMember.tags || ""),
      });
    }
  }, [selectedMember]);

  const avatarInputRef = useRef(null);
  const inputStyle = {
    background: "var(--cth-command-panel)",
    border: "1px solid var(--cth-command-border)",
    color: "var(--cth-command-ink)",
  };
  const buttonPrimary = { background: "var(--cth-command-crimson)", color: "#fff" };

  function toggle(name) { setSection((current) => (current === name ? null : name)); }

  const sectionToggle = (key, label) => (
    <button type="button" onClick={() => toggle(key)}
      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold hover:bg-[var(--cth-command-panel-soft)]"
      style={{ color: "var(--cth-command-ink)" }}>
      <span className="inline-flex items-center gap-1.5">
        <Plus size={12} /> {label}
      </span>
      <ChevronDown size={12} style={{ transform: section === key ? "rotate(180deg)" : "none" }} />
    </button>
  );

  return (
    <div className="space-y-2 rounded-xl p-3"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-crimson)" }}>
      <div className="flex items-center justify-end">
        <button type="button" onClick={onRefresh} title="Refresh"
          className="rounded-md p-1.5 hover:bg-[var(--cth-command-panel-soft)]"
          style={{ color: "var(--cth-command-muted)" }}>
          <RefreshCw size={13} />
        </button>
      </div>

      {sectionToggle("settings", "Cohort settings")}
      {section === "settings" ? (
        <form onSubmit={(e) => { e.preventDefault(); onSaveSettings(settingsDraft); }} className="space-y-2 px-2">
          <input type="text" value={settingsDraft.cohort_name}
            onChange={(e) => setSettingsDraft({ ...settingsDraft, cohort_name: e.target.value })}
            placeholder="Cohort name"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <textarea value={settingsDraft.cohort_description}
            onChange={(e) => setSettingsDraft({ ...settingsDraft, cohort_description: e.target.value })}
            placeholder="About text" rows={3}
            className="w-full resize-y rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <input type="url" value={settingsDraft.cover_image_url}
            onChange={(e) => setSettingsDraft({ ...settingsDraft, cover_image_url: e.target.value })}
            placeholder="Cover image URL (https://...)"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <p className="text-[10px]" style={{ color: "var(--cth-command-muted)" }}>
            Recommended: 1640 × 856px. Use a direct image URL ending in .jpg, .png, or .webp.
          </p>
          {coverPreviewUrl ? (
            <div key={coverPreviewUrl} className="overflow-hidden rounded"
              style={{ border: "1px solid var(--cth-command-border)" }}>
              <img
                src={coverPreviewUrl}
                alt="Cover preview"
                className="block h-20 w-full object-cover"
                onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
              />
            </div>
          ) : null}
          <button type="submit" disabled={saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-50"
            style={buttonPrimary}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Save settings
          </button>
        </form>
      ) : null}

      {sectionToggle("social", "Social links")}
      {section === "social" ? (
        <form onSubmit={(e) => { e.preventDefault(); onSaveSocialLinks(socialDraft); }} className="space-y-2 px-2">
          {SOCIAL_PROVIDERS.map((provider) => (
            <input
              key={provider.key}
              type="url"
              value={socialDraft[provider.key]}
              onChange={(e) => setSocialDraft({ ...socialDraft, [provider.key]: e.target.value })}
              placeholder={`${provider.label} URL`}
              className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          ))}
          <button type="submit" disabled={saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-50"
            style={buttonPrimary}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Save social links
          </button>
        </form>
      ) : null}

      {sectionToggle("channel", "Create channel")}
      {section === "channel" ? (
        <form onSubmit={(e) => { e.preventDefault(); onCreateChannel(channelDraft, () => setChannelDraft({ name: "", description: "", locked: false })); }}
          className="space-y-2 px-2">
          <input type="text" value={channelDraft.name}
            onChange={(e) => setChannelDraft({ ...channelDraft, name: e.target.value })}
            placeholder="Channel name"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <textarea value={channelDraft.description}
            onChange={(e) => setChannelDraft({ ...channelDraft, description: e.target.value })}
            placeholder="Description" rows={2}
            className="w-full resize-y rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cth-command-muted)" }}>
            <input type="checkbox" checked={channelDraft.locked}
              onChange={(e) => setChannelDraft({ ...channelDraft, locked: e.target.checked })} />
            Lock channel (admin posts only)
          </label>
          <button type="submit" disabled={!channelDraft.name.trim() || saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-50"
            style={buttonPrimary}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add channel
          </button>
        </form>
      ) : null}

      {sectionToggle("resource", "Pin resource")}
      {section === "resource" ? (
        <form onSubmit={(e) => { e.preventDefault(); onCreateResource(resourceDraft, () => setResourceDraft({ title: "", url: "", description: "" })); }}
          className="space-y-2 px-2">
          <input type="text" value={resourceDraft.title}
            onChange={(e) => setResourceDraft({ ...resourceDraft, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <input type="url" value={resourceDraft.url}
            onChange={(e) => setResourceDraft({ ...resourceDraft, url: e.target.value })}
            placeholder="URL"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <textarea value={resourceDraft.description}
            onChange={(e) => setResourceDraft({ ...resourceDraft, description: e.target.value })}
            placeholder="Description" rows={2}
            className="w-full resize-y rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <button type="submit" disabled={!resourceDraft.title.trim() || saving}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-50"
            style={buttonPrimary}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Pin size={12} />}
            Pin resource
          </button>
        </form>
      ) : null}

      {sectionToggle("member", "Member access")}
      {section === "member" ? (
        <form onSubmit={(e) => { e.preventDefault(); onSaveMember(memberDraft); }} className="space-y-2 px-2">
          <input type="text" value={memberDraft.user_id}
            onChange={(e) => setMemberDraft({ ...memberDraft, user_id: e.target.value })}
            placeholder="User ID (Clerk)"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <p className="text-[10px]" style={{ color: "var(--cth-command-muted)" }}>
            Manual add, comped, internal, or testing access.
          </p>
          <input type="text" value={memberDraft.display_name}
            onChange={(e) => setMemberDraft({ ...memberDraft, display_name: e.target.value })}
            placeholder="Display name"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={memberDraft.role}
              onChange={(e) => setMemberDraft({ ...memberDraft, role: e.target.value })}
              placeholder="Role"
              className="rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
            <input type="text" value={memberDraft.cohort_stage}
              onChange={(e) => setMemberDraft({ ...memberDraft, cohort_stage: e.target.value })}
              placeholder="Cohort stage"
              className="rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
            <input type="text" value={memberDraft.location}
              onChange={(e) => setMemberDraft({ ...memberDraft, location: e.target.value })}
              placeholder="Location"
              className="rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
            <input type="text" value={memberDraft.timezone}
              onChange={(e) => setMemberDraft({ ...memberDraft, timezone: e.target.value })}
              placeholder="Timezone"
              className="rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          </div>
          <textarea value={memberDraft.focus}
            onChange={(e) => setMemberDraft({ ...memberDraft, focus: e.target.value })}
            placeholder="Focus" rows={2}
            className="w-full resize-y rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <textarea value={memberDraft.offer}
            onChange={(e) => setMemberDraft({ ...memberDraft, offer: e.target.value })}
            placeholder="Offer" rows={2}
            className="w-full resize-y rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <textarea value={memberDraft.needs_support_with}
            onChange={(e) => setMemberDraft({ ...memberDraft, needs_support_with: e.target.value })}
            placeholder="Needs support with" rows={2}
            className="w-full resize-y rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
          <input type="text" value={memberDraft.tags}
            onChange={(e) => setMemberDraft({ ...memberDraft, tags: e.target.value })}
            placeholder="Tags (comma separated)"
            className="w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />

          <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && memberDraft.user_id.trim()) onAvatarUpload(memberDraft.user_id.trim(), file);
              event.target.value = "";
            }} />
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" disabled={!memberDraft.user_id.trim() || saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-50"
              style={buttonPrimary}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Save member
            </button>
            <button type="button" onClick={() => avatarInputRef.current?.click()}
              disabled={!memberDraft.user_id.trim() || saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-ink)", border: "1px solid var(--cth-command-border)" }}>
              <ImagePlus size={12} /> Avatar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

// =========================================================
// Post composer
// =========================================================

function PostComposer({
  viewerName, viewerAvatar, channels, activeChannelId, onChangeChannel,
  onPost, posting, disabled, disabledReason,
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const textareaRef = useRef(null);
  const trimmed = body.trim();
  const canSubmit = !!trimmed && !posting && !disabled;

  async function handleFile(file) {
    setImageError("");
    if (file.size > MAX_INLINE_IMAGE_BYTES) {
      setImageError(`Image too large (max ${Math.round(MAX_INLINE_IMAGE_BYTES / 1024)} KB)`);
      return;
    }
    try { setImage(await fileToDataUrl(file)); }
    catch { setImageError("Could not read file."); }
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) { setBody((v) => v + emoji); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + emoji + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const finalBody = image ? `${trimmed}\n[IMAGE:${image}]` : trimmed;
    const finalTitle = title.trim() || trimmed.split("\n")[0].slice(0, 160) || "Update";
    const ok = await onPost({ title: finalTitle, body: finalBody });
    if (ok) { setTitle(""); setBody(""); setImage(""); setShowTitle(false); }
  }

  return (
    <section className="rounded-xl p-3 sm:p-4"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-2.5">
          <Avatar name={viewerName} profileImage={viewerAvatar} size={36} />
          <div className="min-w-0 flex-1">
            {showTitle ? (
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title" maxLength={160}
                className="mb-2 w-full rounded-md px-2.5 py-1.5 text-sm font-semibold outline-none"
                style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
            ) : null}
            {image ? (
              <div className="relative mb-2 overflow-hidden rounded-md"
                style={{ border: "1px solid var(--cth-command-border)" }}>
                <img src={image} alt="Attachment preview" className="max-h-40 w-auto" />
                <button type="button" onClick={() => setImage("")}
                  className="absolute right-1 top-1 rounded-full p-1 backdrop-blur-sm"
                  style={{ background: "rgba(13,0,16,0.55)", color: "#fff" }}>
                  <X size={12} />
                </button>
              </div>
            ) : null}
            <textarea ref={textareaRef} value={body}
              onChange={(e) => setBody(e.target.value)} disabled={disabled}
              placeholder={disabled ? (disabledReason || "Posting unavailable.") : `What are you working on${viewerName ? `, ${viewerName.split(" ")[0]}` : ""}?`}
              rows={2}
              className="min-h-[56px] w-full resize-y rounded-md px-2.5 py-2 text-sm leading-6 outline-none disabled:opacity-60"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
            {imageError ? (
              <p className="mt-1 text-xs" style={{ color: "var(--cth-command-crimson)" }}>{imageError}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 pl-[46px]">
          <ComposerToolbar onFile={handleFile} onEmoji={insertEmoji}>
            <button type="button" onClick={() => setShowTitle((v) => !v)}
              className="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-muted)" }}>
              {showTitle ? "Hide title" : "Add title"}
            </button>
          </ComposerToolbar>
          <div className="flex items-center gap-2">
            <ChannelDropdown channels={channels} activeChannelId={activeChannelId} onChange={onChangeChannel} />
            <button type="submit" disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ background: "var(--cth-command-ink)", color: "var(--cth-command-panel)" }}>
              {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {posting ? "Posting" : "Post"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

// =========================================================
// Comments
// =========================================================

function CommentRow({ message, authorName, authorAvatar, onToggleLike }) {
  const { text, image } = extractAttachedImage(message.body);
  return (
    <li className="flex items-start gap-2">
      <Avatar name={authorName} profileImage={authorAvatar} size={28} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl px-3 py-2"
          style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }}>{authorName}</p>
          {text ? (
            <p className="mt-0.5 whitespace-pre-wrap text-sm leading-6" style={{ color: "var(--cth-command-ink)" }}>
              {text}
            </p>
          ) : null}
          {image ? (
            <img src={image} alt="Attachment" className="mt-2 max-h-60 rounded"
              style={{ border: "1px solid var(--cth-command-border)" }} />
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3 px-1 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
          <span>{timeAgo(message.created_at)}</span>
          <button type="button" onClick={() => onToggleLike(message)}
            className="inline-flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
            style={{ color: message.liked_by_me ? "var(--cth-command-crimson)" : "var(--cth-command-muted)" }}>
            <Heart size={11} fill={message.liked_by_me ? "currentColor" : "none"} />
            {message.like_count > 0 ? message.like_count : "Like"}
          </button>
        </div>
      </div>
    </li>
  );
}

function CommentsSection({ thread, messages, loading, viewerName, viewerAvatar, membersById, onPostComment, onToggleLikeMessage, posting }) {
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");
  const textareaRef = useRef(null);
  const trimmed = draft.trim();

  async function handleFile(file) {
    setImageError("");
    if (file.size > MAX_INLINE_IMAGE_BYTES) { setImageError(`Image too large (max ${Math.round(MAX_INLINE_IMAGE_BYTES / 1024)} KB)`); return; }
    try { setImage(await fileToDataUrl(file)); } catch { setImageError("Could not read file."); }
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) { setDraft((v) => v + emoji); return; }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!trimmed || posting) return;
    const finalBody = image ? `${trimmed}\n[IMAGE:${image}]` : trimmed;
    const ok = await onPostComment(thread, finalBody);
    if (ok) { setDraft(""); setImage(""); }
  }

  return (
    <div className="mt-3 rounded-lg p-3"
      style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)" }}>
      {loading ? (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cth-command-muted)" }}>
          <Loader2 size={12} className="animate-spin" /> Loading replies...
        </div>
      ) : messages.length ? (
        <ul className="space-y-2">
          {messages.map((message) => {
            const author = membersById.get(message.author_user_id);
            return (
              <CommentRow
                key={message.id}
                message={message}
                authorName={author?.display_name || author?.name || "Cohort Member"}
                authorAvatar={author?.profile_image_url}
                onToggleLike={(msg) => onToggleLikeMessage(thread, msg)}
              />
            );
          })}
        </ul>
      ) : (
        <p className="text-xs" style={{ color: "var(--cth-command-muted)" }}>No replies yet. Start the conversation.</p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex items-start gap-2">
        <Avatar name={viewerName} profileImage={viewerAvatar} size={28} />
        <div className="min-w-0 flex-1">
          {image ? (
            <div className="relative mb-1.5 overflow-hidden rounded-md"
              style={{ border: "1px solid var(--cth-command-border)" }}>
              <img src={image} alt="Attachment preview" className="max-h-32 w-auto" />
              <button type="button" onClick={() => setImage("")}
                className="absolute right-1 top-1 rounded-full p-1"
                style={{ background: "rgba(13,0,16,0.55)", color: "#fff" }}>
                <X size={11} />
              </button>
            </div>
          ) : null}
          <textarea ref={textareaRef} value={draft}
            onChange={(e) => setDraft(e.target.value)} placeholder="Write a reply..." rows={1}
            className="min-h-[36px] w-full resize-y rounded-2xl px-3 py-1.5 text-sm leading-6 outline-none"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
          {imageError ? <p className="mt-0.5 text-[11px]" style={{ color: "var(--cth-command-crimson)" }}>{imageError}</p> : null}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <ComposerToolbar onFile={handleFile} onEmoji={insertEmoji} />
            <button type="submit" disabled={!trimmed || posting}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
              style={{ background: "var(--cth-command-ink)", color: "var(--cth-command-panel)" }}>
              {posting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
              Reply
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// =========================================================
// Thread card
// =========================================================

function ThreadCard({
  thread, authorName, authorAvatar, isAdmin, expanded, messages, messagesLoading,
  viewerName, viewerAvatar, membersById, onToggleLikeThread, onToggleExpand,
  onPostComment, onToggleLikeMessage, onPin, onDelete, commentPosting,
}) {
  const { text, image } = extractAttachedImage(thread.body);
  return (
    <article className="rounded-xl p-3 sm:p-4"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <Avatar name={authorName} profileImage={authorAvatar} size={38} />
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>{authorName}</p>
            <p className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
              {timeAgo(thread.created_at)}
              {thread.pinned ? (
                <span className="ml-2 inline-flex items-center gap-1" style={{ color: "var(--cth-command-crimson)" }}>
                  <Pin size={10} /> Pinned
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => onPin(thread)} title={thread.pinned ? "Unpin" : "Pin"}
              className="rounded-full p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: thread.pinned ? "var(--cth-command-crimson)" : "var(--cth-command-muted)" }}>
              <Pin size={14} fill={thread.pinned ? "currentColor" : "none"} />
            </button>
            <button type="button" onClick={() => onDelete(thread)} title="Delete"
              className="rounded-full p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-muted)" }}>
              <Trash2 size={14} />
            </button>
          </div>
        ) : null}
      </header>

      {thread.title && thread.title.trim() && thread.title !== text && thread.title !== thread.body ? (
        <h3 className="mt-2 font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>{thread.title}</h3>
      ) : null}
      {text ? (
        <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6" style={{ color: "var(--cth-command-ink)" }}>{text}</p>
      ) : null}
      {image ? (
        <img src={image} alt="Attachment" className="mt-3 max-h-96 w-full rounded-lg object-cover"
          style={{ border: "1px solid var(--cth-command-border)" }} />
      ) : null}

      <div className="mt-3 flex items-center gap-1 border-t pt-2" style={{ borderColor: "var(--cth-command-border)" }}>
        <button type="button" onClick={() => onToggleLikeThread(thread)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors"
          style={{
            color: thread.liked_by_me ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
            background: thread.liked_by_me ? "rgba(175,0,42,0.08)" : "transparent",
          }}>
          <Heart size={14} fill={thread.liked_by_me ? "currentColor" : "none"} />
          {thread.like_count > 0 ? thread.like_count : ""} Like
        </button>
        <button type="button" onClick={() => onToggleExpand(thread)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-[var(--cth-command-panel-soft)]"
          style={{ color: "var(--cth-command-muted)" }}>
          <MessageSquare size={14} />
          {thread.reply_count > 0 ? `${thread.reply_count} ` : ""}Comment{thread.reply_count === 1 ? "" : "s"}
        </button>
      </div>

      {expanded ? (
        <CommentsSection
          thread={thread} messages={messages} loading={messagesLoading}
          viewerName={viewerName} viewerAvatar={viewerAvatar} membersById={membersById}
          onPostComment={onPostComment} onToggleLikeMessage={onToggleLikeMessage} posting={commentPosting}
        />
      ) : null}
    </article>
  );
}

// =========================================================
// Pinned resources strip
// =========================================================

function PinnedStrip({ resources }) {
  if (!resources.length) return null;
  return (
    <section className="overflow-x-auto rounded-xl p-3"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <p className="mb-2 inline-flex items-center gap-1.5 font-serif text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--cth-command-muted)" }}>
        <Pin size={11} /> Pinned
      </p>
      <div className="flex gap-2">
        {resources.map((resource) => {
          const inner = (
            <span className="flex items-center gap-2 text-xs" style={{ color: "var(--cth-command-ink)" }}>
              <FileText size={12} style={{ color: "var(--cth-command-crimson)" }} />
              <span className="truncate">{resource.title}</span>
            </span>
          );
          return resource.url ? (
            <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer"
              className="shrink-0 rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
              {inner}
            </a>
          ) : (
            <div key={resource.id} className="shrink-0 rounded-full px-3 py-1.5"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// =========================================================
// Discussion / Wins three-column sidebars
// =========================================================

function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors"
      style={{
        background: active ? "var(--cth-command-purple)" : "transparent",
        color: active ? "var(--cth-command-gold)" : "var(--cth-command-panel)",
      }}
    >
      <Icon size={13} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function DiscussionLeftSidebar({
  cohortName,
  memberCount,
  channels,
  activeChannelId,
  onChooseChannel,
  navFilter,
  onChangeNavFilter,
  onCreatePostClick,
}) {
  return (
    <aside
      className="self-start rounded-xl p-3"
      style={{
        background: "var(--cth-command-ink)",
        position: "sticky",
        top: 120,
        height: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <div className="px-1 pb-2">
        <p
          className="font-serif text-sm font-semibold leading-tight"
          style={{ color: "var(--cth-command-gold)" }}
        >
          {cohortName}
        </p>
        <p
          className="mt-0.5 text-[11px]"
          style={{ color: "var(--cth-command-blush)" }}
        >
          {memberCount} member{memberCount === 1 ? "" : "s"}
        </p>
      </div>
      <button
        type="button"
        onClick={onCreatePostClick}
        className="mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
        style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
      >
        <Plus size={12} /> Create post
      </button>
      <nav className="space-y-0.5">
        <SidebarNavItem
          icon={Hash}
          label="All Posts"
          active={navFilter === "all"}
          onClick={() => onChangeNavFilter("all")}
        />
        <SidebarNavItem
          icon={UserRound}
          label="My Posts"
          active={navFilter === "mine"}
          onClick={() => onChangeNavFilter("mine")}
        />
      </nav>
      <div
        className="my-3"
        style={{ borderTop: "1px solid var(--cth-command-purple)" }}
      />
      <p
        className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--cth-command-gold)" }}
      >
        Channels
      </p>
      {channels.length ? (
        <div className="flex flex-wrap gap-1.5 px-1">
          {channels.map((channel) => {
            const active = channel.id === activeChannelId;
            return (
              <button
                key={channel.id}
                type="button"
                disabled={channel.locked}
                onClick={() => onChooseChannel(channel.id)}
                className="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold disabled:opacity-40"
                style={{
                  background: active ? "var(--cth-command-crimson)" : "var(--cth-command-purple)",
                  color: active ? "var(--cth-command-panel)" : "var(--cth-command-gold)",
                }}
              >
                {channel.locked ? <Lock size={10} /> : <Hash size={10} />}
                <span className="truncate">{channel.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-2 text-[11px]" style={{ color: "var(--cth-command-blush)" }}>
          No channels yet.
        </p>
      )}
    </aside>
  );
}

function DiscussionRightSidebar({ settings, members, threads, channels }) {
  const cardStyle = {
    background: "var(--cth-command-panel)",
    border: "1px solid var(--cth-command-border)",
  };
  const cohortDescription =
    settings?.cohort_description ||
    "A private cohort space. Share progress, ask focused questions, connect your work back to the system.";
  const activeNow = members.slice(0, 8);

  return (
    <aside
      className="space-y-3 self-start"
      style={{
        position: "sticky",
        top: 120,
        height: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <section className="rounded-xl p-3" style={cardStyle}>
        <h3
          className="font-serif text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--cth-command-muted)" }}
        >
          About
        </h3>
        <p
          className="mt-2 text-xs leading-5"
          style={{ color: "var(--cth-command-ink)" }}
        >
          {cohortDescription}
        </p>
        <div
          className="mt-3 flex items-center justify-between border-t pt-2 text-[11px]"
          style={{ borderColor: "var(--cth-command-border)", color: "var(--cth-command-muted)" }}
        >
          <span>
            {members.length} member{members.length === 1 ? "" : "s"}
          </span>
          <span>
            {threads.length} post{threads.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      <section className="rounded-xl p-3" style={cardStyle}>
        <h3
          className="font-serif text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--cth-command-muted)" }}
        >
          Active Now
        </h3>
        {activeNow.length ? (
          <ul className="mt-2 space-y-2">
            {activeNow.map((member) => (
              <li key={member.user_id || member.id} className="flex items-center gap-2">
                <Avatar
                  name={member.display_name || member.name}
                  profileImage={member.profile_image_url}
                  size={24}
                />
                <p
                  className="truncate text-[11px] font-semibold"
                  style={{ color: "var(--cth-command-ink)" }}
                >
                  {member.display_name || member.name || "Cohort Member"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="mt-2 text-[11px]"
            style={{ color: "var(--cth-command-muted)" }}
          >
            No members yet.
          </p>
        )}
      </section>

      <section className="rounded-xl p-3" style={cardStyle}>
        <h3
          className="font-serif text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--cth-command-muted)" }}
        >
          Post Types
        </h3>
        {channels.length ? (
          <ul className="mt-2 space-y-1">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center gap-1.5 text-[11px]"
                style={{ color: "var(--cth-command-ink)" }}
              >
                <Hash size={11} style={{ color: "var(--cth-command-crimson)" }} />
                <span className="truncate">{channel.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="mt-2 text-[11px]"
            style={{ color: "var(--cth-command-muted)" }}
          >
            No channels yet.
          </p>
        )}
      </section>
    </aside>
  );
}

// =========================================================
// About tab content
// =========================================================

function AboutTab({ settings, members, threads }) {
  const recent = useMemo(() => {
    const next = [...threads];
    next.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return next.slice(0, 10);
  }, [threads]);

  const cardStyle = {
    background: "var(--cth-command-panel)",
    border: "1px solid var(--cth-command-border)",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <section className="rounded-xl p-4 sm:p-5" style={cardStyle}>
          <h2 className="font-serif text-base font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
            About
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: "var(--cth-command-ink)" }}>
            {settings?.cohort_description || "A private cohort space. Share progress, ask focused questions, connect your work back to the system."}
          </p>
        </section>

        <section className="rounded-xl p-4 sm:p-5" style={cardStyle}>
          <h2 className="font-serif text-base font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
            Rules
          </h2>
          {/* TODO: pull from settings.community_rules once backend supports a rules field */}
          <ol className="mt-3 space-y-2 text-sm leading-6" style={{ color: "var(--cth-command-ink)" }}>
            {RULES.map((rule, index) => (
              <li key={rule} className="flex gap-3">
                <span className="font-serif text-sm font-semibold" style={{ color: "var(--cth-command-crimson)" }}>
                  {index + 1}.
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl p-4 sm:p-5" style={cardStyle}>
          <h2 className="font-serif text-base font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
            Recent activity
          </h2>
          {recent.length ? (
            <ul className="mt-3 space-y-2">
              {recent.map((thread) => (
                <li key={thread.id} className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-[var(--cth-command-panel-soft)]">
                  <span className="truncate text-sm" style={{ color: "var(--cth-command-ink)" }}>{thread.title || "Untitled"}</span>
                  <span className="shrink-0 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>{timeAgo(thread.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm" style={{ color: "var(--cth-command-muted)" }}>No activity yet.</p>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl p-4" style={cardStyle}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
              Members
            </h2>
            <span className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>{members.length}</span>
          </div>
          {members.length ? (
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={member.user_id || member.id} className="flex items-center gap-2.5">
                  <Avatar name={member.display_name || member.name} profileImage={member.profile_image_url} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>
                      {member.display_name || member.name || "Cohort Member"}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                      {member.role || member.cohort_stage || "Member"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs" style={{ color: "var(--cth-command-muted)" }}>No members yet.</p>
          )}
        </section>
      </aside>
    </div>
  );
}

// =========================================================
// Events tab — calendar with month nav, event chips, detail panel, admin CRUD
// =========================================================

function EventDetailCard({ event, isAdmin, onEdit, onDelete }) {
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || "Event";
  const typeColor = EVENT_TYPE_COLORS[event.event_type] || "var(--cth-command-muted)";
  const startLabel = event.all_day ? "All day" : formatTime(event.starts_at);
  const endLabel = !event.all_day && event.ends_at ? formatTime(event.ends_at) : "";
  const timeLabel = event.all_day ? "All day" : (endLabel ? `${startLabel} – ${endLabel}` : startLabel);

  return (
    <li className="rounded-md p-3"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ background: typeColor, color: "var(--cth-command-panel)" }}>
              {typeLabel}
            </span>
            <h4 className="min-w-0 truncate font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>
              {event.title}
            </h4>
          </div>
        </div>
        {isAdmin ? (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onEdit} title="Edit"
              className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-muted)" }}>
              <PenTool size={13} />
            </button>
            <button type="button" onClick={onDelete} title="Delete"
              className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-muted)" }}>
              <Trash2 size={13} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--cth-command-ink)" }}>
        <div className="flex items-center gap-1.5">
          <Clock size={12} style={{ color: "var(--cth-command-muted)" }} />
          <span>{timeLabel}</span>
        </div>
        {event.location ? (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: "var(--cth-command-muted)" }} />
            <span className="truncate">{event.location}</span>
          </div>
        ) : null}
        {event.meeting_url ? (
          <div className="flex items-center gap-1.5">
            <Video size={12} style={{ color: "var(--cth-command-muted)" }} />
            <a href={event.meeting_url} target="_blank" rel="noreferrer"
              className="truncate underline" style={{ color: "var(--cth-command-crimson)" }}>
              {event.meeting_url}
            </a>
          </div>
        ) : null}
      </div>

      {event.description ? (
        <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5" style={{ color: "var(--cth-command-ink)" }}>
          {event.description}
        </p>
      ) : null}
    </li>
  );
}

function EventModal({ mode, event, initialDate, onClose, onSubmit }) {
  const isEdit = mode === "edit";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => {
    if (isEdit && event) {
      const start = event.starts_at ? new Date(event.starts_at) : null;
      const end = event.ends_at ? new Date(event.ends_at) : null;
      const pad = (n) => String(n).padStart(2, "0");
      const localYmd = (d) => d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";
      const localHm = (d) => d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
      return {
        title: event.title || "",
        description: event.description || "",
        date: localYmd(start),
        startTime: localHm(start),
        endTime: localHm(end),
        allDay: !!event.all_day,
        location: event.location || "",
        meetingUrl: event.meeting_url || "",
        eventType: event.event_type || "other",
      };
    }
    return {
      title: "",
      description: "",
      date: initialDate || "",
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      location: "",
      meetingUrl: "",
      eventType: "other",
    };
  });

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setError("");
    const title = form.title.trim();
    if (!title) { setError("Title is required."); return; }
    if (!form.date) { setError("Date is required."); return; }

    let startsIso;
    let endsIso = null;
    if (form.allDay) {
      const startLocal = new Date(`${form.date}T00:00:00`);
      if (Number.isNaN(startLocal.getTime())) { setError("Invalid date."); return; }
      startsIso = startLocal.toISOString();
    } else {
      if (!form.startTime) { setError("Start time is required."); return; }
      const startLocal = new Date(`${form.date}T${form.startTime}:00`);
      if (Number.isNaN(startLocal.getTime())) { setError("Invalid start time."); return; }
      startsIso = startLocal.toISOString();
      if (form.endTime) {
        const endLocal = new Date(`${form.date}T${form.endTime}:00`);
        if (Number.isNaN(endLocal.getTime())) { setError("Invalid end time."); return; }
        if (endLocal.getTime() < startLocal.getTime()) {
          setError("End time must be on or after start time.");
          return;
        }
        endsIso = endLocal.toISOString();
      }
    }

    const payload = {
      title,
      description: form.description.trim(),
      starts_at: startsIso,
      ends_at: endsIso,
      all_day: !!form.allDay,
      location: form.location.trim(),
      meeting_url: form.meetingUrl.trim(),
      event_type: form.eventType,
    };

    setSubmitting(true);
    try {
      const ok = await onSubmit(payload);
      if (!ok) setError("Could not save event.");
    } catch (err) {
      setError(err?.message || "Could not save event.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--cth-command-blush)",
    border: "1px solid var(--cth-command-border)",
    color: "var(--cth-command-ink)",
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      style={{ background: "rgba(13,0,16,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {isEdit ? "Edit event" : "Create event"}
          </h3>
          <button type="button" onClick={onClose}
            className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4 text-sm">
          <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)}
            placeholder="Title" maxLength={180}
            className="w-full rounded-md px-2.5 py-1.5 text-sm outline-none" style={inputStyle} />

          <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
            placeholder="Description (optional)" rows={3} maxLength={4000}
            className="w-full resize-y rounded-md px-2.5 py-1.5 text-sm outline-none" style={inputStyle} />

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
              Date
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
            </label>
            <label className="text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
              Type
              <select value={form.eventType} onChange={(e) => update("eventType", e.target.value)}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle}>
                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cth-command-muted)" }}>
            <input type="checkbox" checked={form.allDay}
              onChange={(e) => update("allDay", e.target.checked)} />
            All-day event
          </label>

          {!form.allDay ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
                Start time
                <input type="time" value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className="mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
              </label>
              <label className="text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
                End time
                <input type="time" value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                  className="mt-1 w-full rounded-md px-2 py-1.5 text-xs outline-none" style={inputStyle} />
              </label>
            </div>
          ) : null}

          <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
            placeholder="Location (optional)" maxLength={500}
            className="w-full rounded-md px-2.5 py-1.5 text-sm outline-none" style={inputStyle} />

          <input type="url" value={form.meetingUrl} onChange={(e) => update("meetingUrl", e.target.value)}
            placeholder="Meeting URL (optional)" maxLength={1000}
            className="w-full rounded-md px-2.5 py-1.5 text-sm outline-none" style={inputStyle} />

          {error ? (
            <p className="text-xs" style={{ color: "var(--cth-command-crimson)" }}>{error}</p>
          ) : null}
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: "1px solid var(--cth-command-border)" }}>
          <button type="button" onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ color: "var(--cth-command-muted)" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {isEdit ? "Save changes" : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventsTab({ events, isAdmin, onCreate, onUpdate, onDelete }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalState, setModalState] = useState(null);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const eventsByDay = useMemo(() => {
    const map = new Map();
    (events || []).forEach((event) => {
      const key = eventDateKey(event.starts_at);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    map.forEach((list) => list.sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || "")));
    return map;
  }, [events]);

  const isViewingTodaysMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isToday = (day) => isViewingTodaysMonth && day === today.getDate();

  const selectedEvents = selectedDate ? (eventsByDay.get(selectedDate) || []) : [];
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : "";

  function goPrev() {
    setSelectedDate(null);
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function goNext() {
    setSelectedDate(null);
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }
  function goToday() {
    setSelectedDate(null);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  return (
    <section className="rounded-xl p-4 sm:p-5"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={goPrev} title="Previous month"
            className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
            style={{ color: "var(--cth-command-muted)" }}>
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-[180px] text-center font-serif text-base font-semibold"
            style={{ color: "var(--cth-command-ink)" }}>
            {monthName}
          </h2>
          <button type="button" onClick={goNext} title="Next month"
            className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
            style={{ color: "var(--cth-command-muted)" }}>
            <ChevronRight size={16} />
          </button>
          {!isViewingTodaysMonth ? (
            <button type="button" onClick={goToday}
              className="ml-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{ color: "var(--cth-command-muted)" }}>
              Today
            </button>
          ) : null}
        </div>
        {isAdmin ? (
          <button type="button" onClick={() => setModalState({ mode: "create", initialDate: selectedDate || "" })}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            <Plus size={13} /> Create event
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--cth-command-muted)" }}>
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`pad-${index}`} className="aspect-square rounded-md" style={{ background: "transparent" }} />;
          }
          const key = ymd(viewYear, viewMonth, day);
          const dayEvents = eventsByDay.get(key) || [];
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate((current) => current === key ? null : key)}
              className="flex aspect-square flex-col items-stretch rounded-md p-1 text-left transition-colors hover:bg-[var(--cth-command-panel-soft)]"
              style={{
                background: "var(--cth-command-blush)",
                border: isSelected
                  ? "1px solid var(--cth-command-crimson)"
                  : "1px solid var(--cth-command-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="inline-grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold"
                  style={{
                    background: isToday(day) ? "var(--cth-command-crimson)" : "transparent",
                    color: isToday(day) ? "var(--cth-command-panel)" : "var(--cth-command-ink)",
                  }}
                >
                  {day}
                </span>
                {dayEvents.length > 0 ? (
                  <span className="text-[9px] font-semibold"
                    style={{ color: "var(--cth-command-muted)" }}>
                    {dayEvents.length}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div key={event.id}
                    className="truncate rounded-sm px-1 py-0.5 text-[9px] font-semibold leading-tight"
                    style={{
                      background: EVENT_TYPE_COLORS[event.event_type] || "var(--cth-command-muted)",
                      color: "var(--cth-command-panel)",
                    }}>
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <div className="text-[9px]" style={{ color: "var(--cth-command-muted)" }}>
                    +{dayEvents.length - 2} more
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="mt-5 rounded-lg p-4"
          style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-serif text-sm font-semibold" style={{ color: "var(--cth-command-ink)" }}>
              {selectedDateLabel}
            </h3>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button type="button"
                  onClick={() => setModalState({ mode: "create", initialDate: selectedDate })}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                  style={{
                    background: "var(--cth-command-panel)",
                    color: "var(--cth-command-ink)",
                    border: "1px solid var(--cth-command-border)",
                  }}>
                  <Plus size={11} /> Add event
                </button>
              ) : null}
              <button type="button" onClick={() => setSelectedDate(null)}
                className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
                <X size={13} />
              </button>
            </div>
          </div>
          {selectedEvents.length ? (
            <ul className="space-y-3">
              {selectedEvents.map((event) => (
                <EventDetailCard key={event.id} event={event} isAdmin={isAdmin}
                  onEdit={() => setModalState({ mode: "edit", event })}
                  onDelete={() => onDelete(event)} />
              ))}
            </ul>
          ) : (
            <p className="text-xs" style={{ color: "var(--cth-command-muted)" }}>
              No events on this day.
            </p>
          )}
        </div>
      ) : null}

      {!selectedDate && !(events && events.length) ? (
        <p className="mt-5 text-center text-sm" style={{ color: "var(--cth-command-muted)" }}>
          No events scheduled yet. Office hours, workshops, and cohort meetings will appear here.
        </p>
      ) : null}

      {modalState ? (
        <EventModal
          mode={modalState.mode}
          event={modalState.mode === "edit" ? modalState.event : null}
          initialDate={modalState.mode === "create" ? (modalState.initialDate || "") : ""}
          onClose={() => setModalState(null)}
          onSubmit={async (payload) => {
            if (modalState.mode === "create") {
              const ok = await onCreate(payload);
              if (ok) setModalState(null);
              return ok;
            }
            const ok = await onUpdate(modalState.event.id, payload);
            if (ok) setModalState(null);
            return ok;
          }}
        />
      ) : null}
    </section>
  );
}

// =========================================================
// Files tab — list, upload, download, delete with server-side search
// =========================================================

function FilesTab({ files, viewerId, isAdmin, onUpload, onDelete, onDownload, error, uploading }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient.get(
          `/api/community/files?q=${encodeURIComponent(trimmed)}&limit=200`
        );
        setSearchResults(pickItems(response, "files", []));
      } catch (err) {
        console.error("File search failed", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const visibleFiles = useMemo(() => {
    if (searchResults === null) return files || [];
    const knownIds = new Set((files || []).map((f) => f.id));
    return searchResults.filter((f) => knownIds.has(f.id));
  }, [searchResults, files]);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (selected) await onUpload(selected);
  }

  const headerPill = {
    background: "var(--cth-command-ink)",
    color: "var(--cth-command-panel)",
  };

  return (
    <section className="space-y-4 rounded-xl p-4 sm:p-5"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: "var(--cth-command-ink)" }}>
          Files
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
            style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
            <Search size={13} style={{ color: "var(--cth-command-muted)" }} />
            <input type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files"
              className="bg-transparent text-xs outline-none placeholder:text-[color:var(--cth-command-muted)]"
              style={{ color: "var(--cth-command-ink)", width: 160 }} />
            {searching ? (
              <Loader2 size={12} className="animate-spin"
                style={{ color: "var(--cth-command-muted)" }} />
            ) : null}
          </div>
          <input ref={fileInputRef} type="file" className="hidden"
            onChange={handleFileSelected} />
          <button type="button" onClick={handleUploadClick} disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? "Uploading" : "Upload file"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-xs" style={{ color: "var(--cth-command-crimson)" }}>{error}</p>
      ) : null}

      <div style={{ borderTop: "1px solid var(--cth-command-border)" }} />

      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
        <div className="flex-1 rounded-full px-3 py-1.5" style={headerPill}>File</div>
        <div className="rounded-full px-3 py-1.5 text-center" style={{ ...headerPill, width: 80 }}>Type</div>
        <div className="rounded-full px-3 py-1.5 text-center" style={{ ...headerPill, width: 80 }}>Size</div>
        <div className="rounded-full px-3 py-1.5 text-center" style={{ ...headerPill, width: 140 }}>Uploaded by</div>
        <div className="rounded-full px-3 py-1.5 text-center" style={{ ...headerPill, width: 110 }}>Date</div>
        <div className="rounded-full px-3 py-1.5 text-center" style={{ ...headerPill, width: 80 }}>Actions</div>
      </div>

      {visibleFiles.length ? (
        <ul className="space-y-2">
          {visibleFiles.map((file) => {
            const category = fileCategoryFromExt(file.extension);
            const Icon = FILE_CATEGORY_ICONS[category] || FileText;
            const color = FILE_CATEGORY_COLORS[category] || "var(--cth-command-muted)";
            const canDelete = isAdmin === true || file.uploader_user_id === viewerId;
            const extLabel = String(file.extension || "").replace(/^\./, "").toUpperCase() || "FILE";
            return (
              <li key={file.id} className="flex items-center gap-2 rounded-md p-2"
                style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Icon size={16} style={{ color, flexShrink: 0 }} />
                  <span className="truncate text-xs font-semibold"
                    style={{ color: "var(--cth-command-ink)" }} title={file.filename}>
                    {file.filename}
                  </span>
                </div>
                <div className="text-center text-[11px] font-semibold uppercase"
                  style={{ width: 80, color }}>
                  {extLabel}
                </div>
                <div className="text-center text-[11px]"
                  style={{ width: 80, color: "var(--cth-command-muted)" }}>
                  {formatFileSize(file.size_bytes)}
                </div>
                <div className="truncate text-center text-[11px]"
                  style={{ width: 140, color: "var(--cth-command-ink)" }}
                  title={file.uploader_name || ""}>
                  {file.uploader_name || "—"}
                </div>
                <div className="text-center text-[11px]"
                  style={{ width: 110, color: "var(--cth-command-muted)" }}>
                  {formatFileDate(file.created_at)}
                </div>
                <div className="flex items-center justify-center gap-1" style={{ width: 80 }}>
                  <button type="button" onClick={() => onDownload(file)} title="Download"
                    className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
                    style={{ color: "var(--cth-command-muted)" }}>
                    <Download size={13} />
                  </button>
                  {canDelete ? (
                    <button type="button" onClick={() => onDelete(file)} title="Delete"
                      className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)]"
                      style={{ color: "var(--cth-command-muted)" }}>
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="py-14 text-center">
          <p className="text-sm" style={{ color: "var(--cth-command-muted)" }}>
            {searchQuery.trim() ? "No files match that search." : "No files shared yet."}
          </p>
        </div>
      )}
    </section>
  );
}

// =========================================================
// Cover edit affordance
// =========================================================

function CoverEditButton({ onSubmit, currentUrl }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentUrl || "");
  useEffect(() => { setUrl(currentUrl || ""); }, [currentUrl]);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
        style={{ background: "rgba(248,244,242,0.92)", color: "var(--cth-command-ink)" }}>
        <ImagePlus size={13} /> Edit cover
      </button>
    );
  }
  return (
    <form
      onSubmit={(event) => { event.preventDefault(); onSubmit(url); setOpen(false); }}
      className="flex items-center gap-2 rounded-xl px-2 py-1.5 backdrop-blur-sm"
      style={{ background: "rgba(248,244,242,0.95)", border: "1px solid var(--cth-command-border)" }}
    >
      <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
        placeholder="Cover image URL"
        className="w-56 rounded px-2 py-1 text-xs outline-none sm:w-72"
        style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
      <button type="submit"
        className="rounded-md px-2.5 py-1 text-xs font-semibold"
        style={{ background: "var(--cth-command-crimson)", color: "#fff" }}>
        Save
      </button>
      <button type="button"
        onClick={() => { setOpen(false); setUrl(currentUrl || ""); }}
        className="rounded-md p-1" style={{ color: "var(--cth-command-muted)" }}>
        <X size={13} />
      </button>
    </form>
  );
}

// =========================================================
// Main component
// =========================================================

export default function CommunityPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { userRole, isSuperAdmin } = usePlan();

  const isAdmin = isSuperAdmin === true || ADMIN_ROLES.includes(userRole);

  // Data
  const [settings, setSettings] = useState(null);
  const [coverImageError, setCoverImageError] = useState(false);
  useEffect(() => { setCoverImageError(false); }, [settings?.cover_image_url]);
  const [channels, setChannels] = useState([]);
  const [resources, setResources] = useState([]);
  const [members, setMembers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [events, setEvents] = useState([]);
  const [files, setFiles] = useState([]);
  const [filesError, setFilesError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState("discussion");
  const [activeChannelId, setActiveChannelId] = useState("");
  const [activeChannelIdManual, setActiveChannelIdManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Async
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [toast, setToast] = useState("");

  // Drawer / modal state
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const profileRef = useRef(null);
  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);

  // Thread expansion / messages
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [commentPosting, setCommentPosting] = useState(false);

  // Discussion / Wins three-column local view state
  const [navFilter, setNavFilter] = useState("all");
  const composerRef = useRef(null);
  function focusComposer() {
    const textarea = composerRef.current?.querySelector("textarea");
    if (!textarea) return;
    textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    textarea.focus();
  }

  const viewerId = user?.id || "";
  const viewerName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "You";
  const viewerAvatar = user?.imageUrl || "";

  const membersById = useMemo(() => {
    const map = new Map();
    members.forEach((member) => {
      if (member.user_id) map.set(member.user_id, member);
      if (member.id && !map.has(member.id)) map.set(member.id, member);
    });
    return map;
  }, [members]);

  const sortedThreads = useMemo(() => {
    const next = [...threads];
    next.sort((a, b) => {
      if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return next;
  }, [threads]);

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedThreads;
    return sortedThreads.filter((t) => {
      const title = (t.title || "").toLowerCase();
      const body = (t.body || "").toLowerCase();
      return title.includes(q) || body.includes(q);
    });
  }, [sortedThreads, searchQuery]);

  const winsThreads = useMemo(() => {
    return sortedThreads.filter((t) => {
      const channelId = String(t.channel_id || "").toLowerCase();
      return channelId === "wins" || t.pinned;
    });
  }, [sortedThreads]);

  const selectedMember = useMemo(() => {
    if (!viewerId) return null;
    return members.find((member) => member.user_id === viewerId) || null;
  }, [members, viewerId]);

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const eventsFromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const eventsToIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const eventsUrl = `/api/community/events?from=${encodeURIComponent(eventsFromIso)}&to=${encodeURIComponent(eventsToIso)}&limit=200`;
      const [settingsRes, channelsRes, threadsRes, membersRes, resourcesRes, eventsRes, filesRes] = await Promise.all([
        apiClient.get("/api/community/settings").catch(() => null),
        apiClient.get("/api/community/channels").catch(() => null),
        apiClient.get("/api/community/threads").catch(() => null),
        apiClient.get("/api/community/members").catch(() => null),
        apiClient.get("/api/community/resources").catch(() => null),
        apiClient.get(eventsUrl).catch(() => null),
        apiClient.get("/api/community/files?limit=200").catch(() => null),
      ]);
      if (settingsRes) setSettings(settingsRes);
      const nextChannels = pickItems(channelsRes, "channels", []);
      setChannels(nextChannels);
      setThreads(pickItems(threadsRes, "threads", []));
      setMembers(pickItems(membersRes, "members", []));
      setResources(pickItems(resourcesRes, "resources", []));
      setEvents(pickItems(eventsRes, "events", []));
      setFiles(pickItems(filesRes, "files", []));
      if (!activeChannelIdManual) {
        const firstOpen = nextChannels.find((c) => !c.locked && c.status !== "archived");
        if (firstOpen) setActiveChannelId(firstOpen.id);
        else if (nextChannels[0]) setActiveChannelId(nextChannels[0].id);
      }
    } catch (err) {
      console.error("Failed to load community", err);
      if (!silent) setError(err?.message || "Community could not load.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeChannelIdManual]);

  const loadMessages = useCallback(async (threadId, { silent = false } = {}) => {
    if (!threadId) return;
    if (!silent) setMessagesLoading(true);
    try {
      const response = await apiClient.get(`/api/community/threads/${threadId}/messages`);
      const list = pickItems(response, "messages", []);
      setMessagesByThread((current) => ({ ...current, [threadId]: list }));
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadAll({ silent: true });
      if (expandedThreadId) loadMessages(expandedThreadId, { silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadAll, loadMessages, expandedThreadId]);

  useEffect(() => {
    function onFocus() {
      loadAll({ silent: true });
      if (expandedThreadId) loadMessages(expandedThreadId, { silent: true });
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadAll, loadMessages, expandedThreadId]);

  function chooseChannel(id) { setActiveChannelId(id); setActiveChannelIdManual(true); }

  async function handleCreatePost({ title, body }) {
    if (!activeChannelId) { setError("No channel available to post to."); return false; }
    setPosting(true);
    setError("");
    try {
      const response = await apiClient.post("/api/community/threads", { channel_id: activeChannelId, title, body });
      const newThread = response?.thread;
      if (newThread) {
        setThreads((current) => [
          { ...newThread, liked_by_me: false, like_count: 0, reply_count: newThread.reply_count ?? 0 },
          ...current,
        ]);
      } else {
        await loadAll({ silent: true });
      }
      return true;
    } catch (err) {
      console.error("Failed to post", err);
      setError(err?.message || "Could not post.");
      return false;
    } finally {
      setPosting(false);
    }
  }

  async function handleToggleLikeThread(thread) {
    const wasLiked = !!thread.liked_by_me;
    setThreads((current) =>
      current.map((t) => t.id === thread.id
        ? { ...t, liked_by_me: !wasLiked, like_count: Math.max(0, (t.like_count || 0) + (wasLiked ? -1 : 1)) }
        : t));
    try {
      if (wasLiked) await apiClient.delete(`/api/community/threads/${thread.id}/like`);
      else await apiClient.post(`/api/community/threads/${thread.id}/like`);
    } catch (err) {
      console.error("Like toggle failed", err);
      setThreads((current) =>
        current.map((t) => t.id === thread.id
          ? { ...t, liked_by_me: wasLiked, like_count: Math.max(0, (t.like_count || 0) + (wasLiked ? 1 : -1)) }
          : t));
    }
  }

  async function handleToggleLikeMessage(thread, message) {
    const wasLiked = !!message.liked_by_me;
    setMessagesByThread((current) => {
      const list = current[thread.id] || [];
      return {
        ...current,
        [thread.id]: list.map((m) => m.id === message.id
          ? { ...m, liked_by_me: !wasLiked, like_count: Math.max(0, (m.like_count || 0) + (wasLiked ? -1 : 1)) }
          : m),
      };
    });
    try {
      if (wasLiked) await apiClient.delete(`/api/community/threads/${thread.id}/messages/${message.id}/like`);
      else await apiClient.post(`/api/community/threads/${thread.id}/messages/${message.id}/like`);
    } catch (err) {
      console.error("Message like toggle failed", err);
      setMessagesByThread((current) => {
        const list = current[thread.id] || [];
        return {
          ...current,
          [thread.id]: list.map((m) => m.id === message.id
            ? { ...m, liked_by_me: wasLiked, like_count: Math.max(0, (m.like_count || 0) + (wasLiked ? 1 : -1)) }
            : m),
        };
      });
    }
  }

  function handleToggleExpand(thread) {
    setExpandedThreadId((current) => {
      const next = current === thread.id ? null : thread.id;
      if (next) loadMessages(thread.id);
      return next;
    });
  }

  async function handlePostComment(thread, body) {
    setCommentPosting(true);
    try {
      const response = await apiClient.post(`/api/community/threads/${thread.id}/messages`, { body });
      const newMessage = response?.message;
      if (newMessage) {
        setMessagesByThread((current) => {
          const list = current[thread.id] || [];
          return { ...current, [thread.id]: [...list, { ...newMessage, liked_by_me: false, like_count: 0 }] };
        });
        setThreads((current) =>
          current.map((t) => t.id === thread.id ? { ...t, reply_count: (t.reply_count || 0) + 1 } : t));
      } else {
        await loadMessages(thread.id, { silent: true });
      }
      return true;
    } catch (err) {
      console.error("Comment failed", err);
      setError(err?.message || "Could not post reply.");
      return false;
    } finally {
      setCommentPosting(false);
    }
  }

  async function handlePin(thread) {
    const nextPinned = !thread.pinned;
    setThreads((current) => current.map((t) => t.id === thread.id ? { ...t, pinned: nextPinned } : t));
    try {
      await apiClient.patch(`/api/community/threads/${thread.id}`, { pinned: nextPinned });
    } catch (err) {
      console.error("Pin failed", err);
      setThreads((current) => current.map((t) => t.id === thread.id ? { ...t, pinned: thread.pinned } : t));
    }
  }

  async function handleDelete(thread) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const snapshot = threads;
    setThreads((current) => current.filter((t) => t.id !== thread.id));
    try {
      await apiClient.patch(`/api/community/threads/${thread.id}`, { status: "archived" });
    } catch (err) {
      console.error("Delete failed", err);
      setThreads(snapshot);
      setError(err?.message || "Could not delete post.");
    }
  }

  async function handleSaveSettings(draft) {
    setSavingSettings(true);
    setError("");
    try {
      const payload = {};
      if ((draft.cohort_name || "") !== (settings?.cohort_name || "")) payload.cohort_name = draft.cohort_name;
      if ((draft.cohort_description || "") !== (settings?.cohort_description || "")) payload.cohort_description = draft.cohort_description;
      if ((draft.cover_image_url || "") !== (settings?.cover_image_url || "")) payload.cover_image_url = draft.cover_image_url;
      if (Object.keys(payload).length) {
        const response = await apiClient.patch("/api/community/settings", payload);
        setSettings(response || { ...settings, ...payload });
      }
    } catch (err) {
      console.error("Settings save failed", err);
      setError(err?.message || "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSaveSocialLinks(draft) {
    setSavingSettings(true);
    setError("");
    try {
      const social_links = {};
      Object.keys(draft).forEach((key) => {
        const value = (draft[key] || "").trim();
        if (value) social_links[key] = value;
      });
      const response = await apiClient.patch("/api/community/settings", { social_links });
      setSettings(response || { ...settings, social_links });
    } catch (err) {
      console.error("Social links save failed", err);
      setError(err?.message || "Could not save social links.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSaveCoverUrl(url) {
    setSavingSettings(true);
    setError("");
    try {
      const response = await apiClient.patch("/api/community/settings", { cover_image_url: url });
      setSettings(response || { ...settings, cover_image_url: url });
    } catch (err) {
      console.error("Cover save failed", err);
      setError(err?.message || "Could not save cover image.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleCreateChannel(form, reset) {
    setAdminBusy(true);
    setError("");
    try {
      await apiClient.post("/api/community/channels", {
        name: form.name, description: form.description,
        locked: !!form.locked, status: "active", order: 100,
      });
      reset?.();
      await loadAll({ silent: true });
    } catch (err) {
      console.error("Channel create failed", err);
      setError(err?.message || "Could not create channel.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleCreateResource(form, reset) {
    setAdminBusy(true);
    setError("");
    try {
      await apiClient.post("/api/community/resources", {
        title: form.title, url: form.url, description: form.description,
        resource_type: "link", order: 100, pinned: true,
      });
      reset?.();
      await loadAll({ silent: true });
    } catch (err) {
      console.error("Resource create failed", err);
      setError(err?.message || "Could not pin resource.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleSaveMember(form) {
    const userId = String(form.user_id || "").trim();
    if (!userId) return;
    setAdminBusy(true);
    setError("");
    try {
      await apiClient.patch(`/api/community/members/${encodeURIComponent(userId)}`, {
        display_name: form.display_name, role: form.role, cohort_stage: form.cohort_stage,
        location: form.location, timezone: form.timezone, focus: form.focus, offer: form.offer,
        needs_support_with: form.needs_support_with,
        tags: String(form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
        visible: true,
      });
      await loadAll({ silent: true });
    } catch (err) {
      console.error("Member save failed", err);
      setError(err?.message || "Could not save member.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAvatarUpload(userId, file) {
    setAdminBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = typeof apiClient.buildApiUrl === "function"
        ? apiClient.buildApiUrl(`/api/community/members/${encodeURIComponent(userId)}/avatar`)
        : `/api/community/members/${encodeURIComponent(userId)}/avatar`;
      const headers = typeof apiClient.getAuthHeaders === "function"
        ? await apiClient.getAuthHeaders({ isFormData: true })
        : {};
      const response = await fetch(url, { method: "POST", headers, credentials: "include", body: formData });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Avatar upload failed.");
      }
      await loadAll({ silent: true });
    } catch (err) {
      console.error("Avatar upload failed", err);
      setError(err?.message || "Could not upload avatar.");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleLeaveGroup() {
    if (!viewerId) { setToast("Not signed in"); return; }
    if (!window.confirm("Leave this community? You can be re-added by an admin.")) return;
    try {
      await apiClient.patch(`/api/community/members/${encodeURIComponent(viewerId)}`, { visible: false });
      // TODO: backend should support a real /leave endpoint with proper unenroll semantics
      setToast("You have left the community");
      await loadAll({ silent: true });
    } catch (err) {
      console.error("Leave failed", err);
      setToast(err?.message || "Could not leave");
    }
  }

  async function handleCreateEvent(payload) {
    setError("");
    try {
      const response = await apiClient.post("/api/community/events", payload);
      const newEvent = response?.event;
      if (newEvent) {
        setEvents((current) =>
          [...current, newEvent].sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))
        );
      } else {
        await loadAll({ silent: true });
      }
      return true;
    } catch (err) {
      console.error("Event create failed", err);
      setError(err?.message || "Could not create event.");
      return false;
    }
  }

  async function handleUpdateEvent(eventId, patch) {
    setError("");
    try {
      const response = await apiClient.patch(`/api/community/events/${eventId}`, patch);
      const updated = response?.event;
      if (updated) {
        setEvents((current) => current.map((event) => (event.id === eventId ? updated : event)));
      } else {
        await loadAll({ silent: true });
      }
      return true;
    } catch (err) {
      console.error("Event update failed", err);
      setError(err?.message || "Could not update event.");
      return false;
    }
  }

  async function handleDeleteEvent(event) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    const snapshot = events;
    setEvents((current) => current.filter((e) => e.id !== event.id));
    try {
      await apiClient.delete(`/api/community/events/${event.id}`);
    } catch (err) {
      console.error("Event delete failed", err);
      setEvents(snapshot);
      setError(err?.message || "Could not delete event.");
    }
  }

  async function handleUploadFile(file) {
    setFilesError("");
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = typeof apiClient.buildApiUrl === "function"
        ? apiClient.buildApiUrl("/api/community/files")
        : "/api/community/files";
      const headers = typeof apiClient.getAuthHeaders === "function"
        ? await apiClient.getAuthHeaders({ isFormData: true })
        : {};
      const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        let message = `Upload failed (${response.status})`;
        try {
          const parsed = JSON.parse(text);
          if (parsed?.detail) message = parsed.detail;
        } catch { /* not JSON */ }
        throw new Error(message);
      }
      const data = await response.json();
      const newFile = data?.file;
      if (newFile) {
        setFiles((current) => [newFile, ...current]);
      } else {
        await loadAll({ silent: true });
      }
      return true;
    } catch (err) {
      console.error("File upload failed", err);
      setFilesError(err?.message || "Could not upload file.");
      return false;
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeleteFile(file) {
    if (!window.confirm(`Delete "${file.filename}"? This cannot be undone.`)) return;
    setFilesError("");
    const snapshot = files;
    setFiles((current) => current.filter((f) => f.id !== file.id));
    try {
      await apiClient.delete(`/api/community/files/${file.id}`);
    } catch (err) {
      console.error("File delete failed", err);
      setFiles(snapshot);
      setFilesError(err?.message || "Could not delete file.");
    }
  }

  async function handleDownloadFile(file) {
    setFilesError("");
    try {
      const url = typeof apiClient.buildApiUrl === "function"
        ? apiClient.buildApiUrl(`/api/community/files/${file.id}/download`)
        : `/api/community/files/${file.id}/download`;
      const headers = typeof apiClient.getAuthHeaders === "function"
        ? await apiClient.getAuthHeaders()
        : {};
      const response = await fetch(url, {
        method: "GET",
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.filename || "download";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("File download failed", err);
      setFilesError(err?.message || "Could not download file.");
    }
  }

  function handleSignOut() {
    if (typeof signOut === "function") signOut();
  }

  const cohortName = settings?.cohort_name || "Core Truth House Cohort";
  const coverUrl = settings?.cover_image_url;

  return (
    <div className="min-h-screen" style={{ background: "var(--cth-command-blush)", color: "var(--cth-command-ink)" }}>
      <CommunityTopNav
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenDrawer={() => setNavDrawerOpen(true)}
        onChatClick={() => setToast("Chat coming soon")}
        onProfileClick={() => setProfileOpen((v) => !v)}
        profileOpen={profileOpen}
        profileRef={profileRef}
        user={user}
        onSignOut={handleSignOut}
        onPeopleClick={() => setActiveTab("about")}
        navigate={navigate}
      />

      <NavDrawer open={navDrawerOpen} onClose={() => setNavDrawerOpen(false)} navigate={navigate} />

      {/* Cover image: full-width, flush below TopNav, fixed height, object-cover top */}
      <div
        className="community-cover relative mt-0 block h-[240px] w-screen sm:h-[320px]"
        style={{ background: "linear-gradient(135deg, var(--cth-command-purple) 0%, var(--cth-command-crimson) 100%)", marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}
      >
        {coverUrl && coverUrl.trim() && !coverImageError ? (
          <img
            key={coverUrl}
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setCoverImageError(true)}
          />
        ) : null}
        {isAdmin ? (
          <div className="absolute right-3 top-3 sm:right-5 sm:top-4">
            <CoverEditButton currentUrl={coverUrl} onSubmit={handleSaveCoverUrl} />
          </div>
        ) : null}
      </div>

      {/* Hero row: one left-right split, vertically centered on desktop, no wrap on the action buttons */}
      <section className="mx-auto max-w-[1400px] px-3 pt-3 pb-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold leading-none sm:text-3xl md:text-4xl" style={{ color: "var(--cth-command-ink)" }}>
              {cohortName}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: "var(--cth-command-muted)" }}>
                {members.length} member{members.length === 1 ? "" : "s"}
              </span>
              {members.length ? <StackedAvatars members={members} max={5} size={32} /> : null}
            </div>
          </div>
          <div className="shrink-0">
            <HeroActions
              cohortName={cohortName}
              onInvite={() => setInviteOpen(true)}
              onLeave={handleLeaveGroup}
              onToast={setToast}
            />
          </div>
        </div>
      </section>

      {/* Thin rule */}
      <div style={{ borderTop: "1px solid var(--cth-command-border)" }} />

      {/* Tab bar */}
      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        isAdmin={isAdmin}
        onOpenSettings={() => setSettingsDrawerOpen(true)}
      />

      {error ? (
        <div className="mx-auto mt-3 flex max-w-[1400px] items-start gap-2 px-3 sm:px-5">
          <div className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{ background: "rgba(175,0,42,0.10)", border: "1px solid var(--cth-command-crimson)", color: "var(--cth-command-ink)" }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-crimson)" }} />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} className="shrink-0" style={{ color: "var(--cth-command-muted)" }}>
              <X size={12} />
            </button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5">
        {activeTab === "about" ? (
          <AboutTab settings={settings} members={members} threads={threads} />
        ) : null}

        {activeTab === "discussion" ? (
          <div className="grid gap-4 grid-cols-[200px_minmax(0,1fr)_200px]">
            <DiscussionLeftSidebar
              cohortName={cohortName}
              memberCount={members.length}
              channels={channels}
              activeChannelId={activeChannelId}
              onChooseChannel={chooseChannel}
              navFilter={navFilter}
              onChangeNavFilter={setNavFilter}
              onCreatePostClick={focusComposer}
            />
            <div className="space-y-3">
              <div ref={composerRef}>
                <PostComposer
                  viewerName={viewerName}
                  viewerAvatar={viewerAvatar}
                  channels={channels}
                  activeChannelId={activeChannelId}
                  onChangeChannel={chooseChannel}
                  onPost={handleCreatePost}
                  posting={posting}
                  disabled={!activeChannelId && !loading}
                  disabledReason="No channel available yet."
                />
              </div>

              {(() => {
                const visible = navFilter === "mine"
                  ? searchFiltered.filter((t) => t.author_user_id === viewerId)
                  : searchFiltered;
                if (loading && !threads.length) {
                  return (
                    <div className="rounded-xl p-5 text-sm"
                      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
                      <Loader2 size={14} className="mr-2 inline-block animate-spin" /> Loading...
                    </div>
                  );
                }
                if (!visible.length) {
                  return (
                    <div className="rounded-xl p-5 text-center"
                      style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}>
                      <p className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
                        {searchQuery
                          ? "No posts match that search."
                          : navFilter === "mine"
                            ? "You haven't posted yet."
                            : "No posts yet."}
                      </p>
                      {!searchQuery && navFilter !== "mine" ? (
                        <p className="mt-1 text-xs" style={{ color: "var(--cth-command-muted)" }}>Be the first to share progress.</p>
                      ) : null}
                    </div>
                  );
                }
                return visible.map((thread) => {
                  const author = membersById.get(thread.author_user_id);
                  const isOwnPost = thread.author_user_id === viewerId;
                  return (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      authorName={isOwnPost ? viewerName : (author?.display_name || author?.name || "Cohort Member")}
                      authorAvatar={isOwnPost ? viewerAvatar : author?.profile_image_url}
                      isAdmin={isAdmin}
                      expanded={expandedThreadId === thread.id}
                      messages={messagesByThread[thread.id] || []}
                      messagesLoading={expandedThreadId === thread.id && messagesLoading}
                      viewerName={viewerName}
                      viewerAvatar={viewerAvatar}
                      membersById={membersById}
                      onToggleLikeThread={handleToggleLikeThread}
                      onToggleExpand={handleToggleExpand}
                      onPostComment={handlePostComment}
                      onToggleLikeMessage={handleToggleLikeMessage}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      commentPosting={commentPosting && expandedThreadId === thread.id}
                    />
                  );
                });
              })()}
            </div>
            <DiscussionRightSidebar
              settings={settings}
              members={members}
              threads={threads}
              channels={channels}
            />
          </div>
        ) : null}

        {activeTab === "wins" ? (
          <div className="grid gap-4 grid-cols-[200px_minmax(0,1fr)_200px]">
            <DiscussionLeftSidebar
              cohortName={cohortName}
              memberCount={members.length}
              channels={channels}
              activeChannelId={activeChannelId}
              onChooseChannel={chooseChannel}
              navFilter={navFilter}
              onChangeNavFilter={setNavFilter}
              onCreatePostClick={focusComposer}
            />
            <div className="space-y-3">
              <div ref={composerRef}>
                <PostComposer
                  viewerName={viewerName}
                  viewerAvatar={viewerAvatar}
                  channels={channels}
                  activeChannelId={activeChannelId}
                  onChangeChannel={chooseChannel}
                  onPost={handleCreatePost}
                  posting={posting}
                  disabled={!activeChannelId && !loading}
                  disabledReason="No channel available yet."
                />
              </div>

              {(() => {
                const visible = navFilter === "mine"
                  ? winsThreads.filter((t) => t.author_user_id === viewerId)
                  : winsThreads;
                if (!visible.length) {
                  return (
                    <div className="rounded-xl p-5 text-center"
                      style={{ background: "var(--cth-command-panel)", border: "1px dashed var(--cth-command-border)" }}>
                      <p className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
                        {navFilter === "mine" ? "You haven't posted to wins yet." : "No wins yet."}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--cth-command-muted)" }}>
                        Pin a thread or post to the wins channel to feature it here.
                      </p>
                    </div>
                  );
                }
                return visible.map((thread) => {
                  const author = membersById.get(thread.author_user_id);
                  const isOwnPost = thread.author_user_id === viewerId;
                  return (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      authorName={isOwnPost ? viewerName : (author?.display_name || author?.name || "Cohort Member")}
                      authorAvatar={isOwnPost ? viewerAvatar : author?.profile_image_url}
                      isAdmin={isAdmin}
                      expanded={expandedThreadId === thread.id}
                      messages={messagesByThread[thread.id] || []}
                      messagesLoading={expandedThreadId === thread.id && messagesLoading}
                      viewerName={viewerName}
                      viewerAvatar={viewerAvatar}
                      membersById={membersById}
                      onToggleLikeThread={handleToggleLikeThread}
                      onToggleExpand={handleToggleExpand}
                      onPostComment={handlePostComment}
                      onToggleLikeMessage={handleToggleLikeMessage}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      commentPosting={commentPosting && expandedThreadId === thread.id}
                    />
                  );
                });
              })()}
            </div>
            <DiscussionRightSidebar
              settings={settings}
              members={members}
              threads={threads}
              channels={channels}
            />
          </div>
        ) : null}

        {activeTab === "events" ? (
          <EventsTab
            events={events}
            isAdmin={isAdmin}
            onCreate={handleCreateEvent}
            onUpdate={handleUpdateEvent}
            onDelete={handleDeleteEvent}
          />
        ) : null}

        {activeTab === "files" ? (
          <FilesTab
            files={files}
            viewerId={viewerId}
            isAdmin={isAdmin}
            onUpload={handleUploadFile}
            onDelete={handleDeleteFile}
            onDownload={handleDownloadFile}
            error={filesError}
            uploading={uploadingFile}
          />
        ) : null}

        <div className="h-8" />
      </main>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <SettingsDrawer open={settingsDrawerOpen && isAdmin === true} onClose={() => setSettingsDrawerOpen(false)}>
        {isAdmin ? (
          <AdminPanel
            settings={settings}
            selectedMember={selectedMember}
            onSaveSettings={handleSaveSettings}
            onSaveSocialLinks={handleSaveSocialLinks}
            onCreateChannel={handleCreateChannel}
            onCreateResource={handleCreateResource}
            onSaveMember={handleSaveMember}
            onAvatarUpload={handleAvatarUpload}
            onRefresh={() => loadAll()}
            saving={savingSettings || adminBusy}
          />
        ) : null}
      </SettingsDrawer>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
