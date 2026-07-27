import {
  Activity,
  Archive,
  Bell,
  Blocks,
  BookOpen,
  Compass,
  CreditCard,
  Database,
  FolderKanban,
  Gauge,
  HardDrive,
  KeyRound,
  Library,
  LockKeyhole,
  Plug,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Workflow,
} from "lucide-react";

export const WORKSPACE_TABS = [
  { path: "/workspace", label: "Overview", icon: Gauge },
  { path: "/workspace/library", label: "Library", icon: Library },
  { path: "/workspace/active-work", label: "Active Work", icon: FolderKanban },
  { path: "/workspace/decisions", label: "Decisions", icon: Compass },
  { path: "/workspace/members", label: "Members", icon: Users },
  { path: "/workspace/activity", label: "Activity", icon: Activity },
  { path: "/workspace/storage", label: "Storage", icon: HardDrive },
  { path: "/workspace/controls/general", label: "Controls", icon: Settings },
];

export const CONTROL_TABS = [
  { path: "/workspace/controls/general", label: "General", icon: SlidersHorizontal },
  { path: "/workspace/controls/members", label: "Members", icon: Users },
  {
    path: "/workspace/controls/client-workspaces",
    label: "Client Workspaces",
    icon: Blocks,
    estateOnly: true,
  },
  {
    path: "/workspace/controls/roles-permissions",
    label: "Roles & Permissions",
    icon: KeyRound,
    estateOnly: true,
  },
  { path: "/workspace/controls/approvals", label: "Approvals", icon: ShieldCheck },
  { path: "/workspace/controls/notifications", label: "Notifications", icon: Bell },
  { path: "/workspace/controls/integrations", label: "Integrations", icon: Plug },
  { path: "/workspace/controls/data-privacy", label: "Data & Privacy", icon: LockKeyhole },
  { path: "/workspace/controls/plan-billing", label: "Plan & Billing", icon: CreditCard },
  { path: "/workspace/controls/activity-log", label: "Activity Log", icon: BookOpen },
  { path: "/workspace/controls/danger-zone", label: "Danger Zone", icon: Archive, danger: true },
];

export const ROUTE_META = {
  "/workspace": {
    eyebrow: "Tenant Operating Library",
    title: "Workspace",
    description:
      "Everything in this space belongs to the active tenant workspace. Content, members, integrations, AI context, and audit history remain private and workspace-scoped.",
  },
  "/workspace/library": {
    eyebrow: "Tenant Files & Assets",
    title: "Workspace Library",
    description:
      "Search and manage documents, media, reports, content, and campaign assets belonging only to the active workspace.",
  },
  "/workspace/active-work": {
    eyebrow: "Tenant Workbench",
    title: "Active Work",
    description:
      "Continue campaigns, documents, content, offers, and systems already in motion inside the active workspace.",
  },
  "/workspace/decisions": {
    eyebrow: "Tenant Decision Queue",
    title: "Open Decisions",
    description:
      "Review work that is awaiting a decision while the dedicated strategic-decision service is completed.",
  },
  "/workspace/members": {
    eyebrow: "Tenant Members & Client Access",
    title: "Members",
    description:
      "Manage only the people invited into the active workspace. Estate client workspaces remain isolated and have separate member directories.",
  },
  "/workspace/activity": {
    eyebrow: "Tenant Audit History",
    title: "Workspace Activity",
    description:
      "Review the tenant-scoped activity summary. Core Truth House platform administration uses a separate audit log.",
  },
  "/workspace/storage": {
    eyebrow: "Tenant Usage & Limits",
    title: "Storage",
    description:
      "View known storage used by this workspace. Client workspace storage remains separately metered and isolated.",
  },
  "/workspace/controls/general": {
    eyebrow: "Workspace Controls",
    title: "General",
    description: "Manage workspace identity, defaults, operating preferences, and active brand context.",
  },
  "/workspace/controls/members": {
    eyebrow: "Workspace Controls",
    title: "Member Access",
    description: "Invite members, update access, and keep every permission scoped to the active workspace.",
  },
  "/workspace/controls/client-workspaces": {
    eyebrow: "Estate Controls",
    title: "Client Workspaces",
    description: "View and enter isolated client Houses with their own members, Brand Memory, and audit history.",
  },
  "/workspace/controls/roles-permissions": {
    eyebrow: "Estate Controls",
    title: "Roles & Permissions",
    description: "Review enforceable permission profiles without weakening workspace or tenant boundaries.",
  },
  "/workspace/controls/approvals": {
    eyebrow: "Workspace Controls",
    title: "Approvals",
    description: "Review the planned approval controls for campaigns, content, assets, and system changes.",
  },
  "/workspace/controls/notifications": {
    eyebrow: "Workspace Controls",
    title: "Notifications",
    description: "Choose the supported workspace notification mode.",
  },
  "/workspace/controls/integrations": {
    eyebrow: "Workspace Controls",
    title: "Integrations",
    description: "Connect supported AI providers while preserving encrypted tenant-specific credentials and data boundaries.",
  },
  "/workspace/controls/data-privacy": {
    eyebrow: "Workspace Controls",
    title: "Data & Privacy",
    description: "Review exports, visibility, support-access boundaries, and tenant privacy.",
  },
  "/workspace/controls/plan-billing": {
    eyebrow: "Workspace Controls",
    title: "Plan & Billing",
    description: "Review the active plan, usage, limits, and billing access for this workspace.",
  },
  "/workspace/controls/activity-log": {
    eyebrow: "Workspace Controls",
    title: "Detailed Activity",
    description: "Review the verified workspace activity summary without fabricating unavailable event history.",
  },
  "/workspace/controls/danger-zone": {
    eyebrow: "Owner Controls",
    title: "Danger Zone",
    description: "Critical workspace actions require owner confirmation and a supported backend endpoint.",
  },
};

export const WORK_STATUS_COLUMNS = [
  { id: "draft", label: "Draft" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "approved", label: "Approved" },
];

export function normalizeList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatBytes(value) {
  const bytes = normalizeNumber(value);
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 2 ? 1 : 0)} ${units[index]}`;
}

export function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function normalizeStatus(value) {
  const raw = String(value || "draft").toLowerCase().replace(/[_\s]+/g, "-");
  if (raw.includes("progress") || raw === "active") return "in-progress";
  if (raw.includes("review") || raw.includes("pending")) return "review";
  if (raw.includes("approve") || raw.includes("complete") || raw.includes("published")) {
    return "approved";
  }
  return "draft";
}

export function routeIsControl(pathname) {
  return pathname.startsWith("/workspace/controls/");
}

export function routeMeta(pathname) {
  return ROUTE_META[pathname] || ROUTE_META["/workspace"];
}

export function workspaceIconForType(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("campaign")) return Workflow;
  if (normalized.includes("document") || normalized.includes("report")) return BookOpen;
  if (normalized.includes("asset") || normalized.includes("media")) return Database;
  return FolderKanban;
}

export function requiredPlanForWorkspacePath(pathname) {
  if (pathname === "/workspace/controls/plan-billing") return "free";
  if (
    pathname === "/workspace/controls/client-workspaces" ||
    pathname === "/workspace/controls/roles-permissions"
  ) {
    return "estate";
  }
  return "foundation";
}
