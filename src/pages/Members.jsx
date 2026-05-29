import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Mail,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import { useUser } from "../hooks/useAuth";
import { usePlan } from "../context/PlanContext";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";

const ADMIN_ROLES = ["SUPER_ADMIN", "OPS_ADMIN", "BILLING_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];

const MANAGEABLE_ROLES = ["admin", "editor", "member", "viewer", "billing", "guest"];

const ROLE_STYLES = {
  owner:   { background: "var(--cth-command-gold)",       color: "var(--cth-command-ink)" },
  admin:   { background: "var(--cth-command-crimson)",    color: "var(--cth-command-panel)" },
  editor:  { background: "var(--cth-command-purple)",     color: "var(--cth-command-panel)" },
  member:  { background: "var(--cth-command-ink)",        color: "var(--cth-command-panel)" },
  viewer:  { background: "var(--cth-command-muted)",      color: "var(--cth-command-panel)" },
  billing: { background: "var(--cth-command-cinnabar)",   color: "var(--cth-command-panel)" },
  guest:   { background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)", border: "1px solid var(--cth-command-border)" },
};

function styleForRole(role) {
  return ROLE_STYLES[String(role || "").toLowerCase()] || ROLE_STYLES.member;
}

function initials(name, fallback = "?") {
  const trimmed = String(name || "").trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || fallback;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(
    undefined,
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

function displayName(member) {
  return member?.name?.trim() || member?.email || "Member";
}

// =========================================================
// Sub-components
// =========================================================

function Avatar({ name, email }) {
  return (
    <div
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
      style={{
        background: "var(--cth-command-blush)",
        color: "var(--cth-command-crimson)",
        border: "1px solid var(--cth-command-border)",
      }}
    >
      {initials(name || email)}
    </div>
  );
}

function RoleBadge({ role }) {
  const style = styleForRole(role);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={style}
    >
      {role || "member"}
    </span>
  );
}

function HeaderPill({ width, flex, align = "center", children }) {
  const style = { background: "var(--cth-command-ink)", color: "var(--cth-command-panel)" };
  if (width !== undefined) style.width = width;
  const baseClass = `rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-${align}`;
  const className = flex ? `flex-1 ${baseClass}` : baseClass;
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function MemberRow({
  member,
  isSelf,
  isWorkspaceAdmin,
  busyRole,
  busyRemove,
  onRoleChange,
  onRemove,
}) {
  const role = String(member?.role || "member").toLowerCase();
  const isOwner = role === "owner";
  const canModify = isWorkspaceAdmin && !isOwner && !isSelf;
  const selfBlocked = isWorkspaceAdmin && isSelf;

  return (
    <li
      className="flex items-center gap-2 rounded-md p-2"
      style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar name={member.name} email={member.email} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            {displayName(member)}
            {isSelf ? (
              <span
                className="ml-1.5 inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)" }}
              >
                You
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="truncate text-center text-[11px]" style={{ width: 200, color: "var(--cth-command-muted)" }} title={member.email || ""}>
        {member.email || "—"}
      </div>

      <div className="flex items-center justify-center" style={{ width: 110 }}>
        {canModify ? (
          busyRole ? (
            <Loader2 size={13} className="animate-spin" style={{ color: "var(--cth-command-muted)" }} />
          ) : (
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] outline-none"
              style={{ ...styleForRole(role), border: "1px solid var(--cth-command-border)" }}
            >
              {MANAGEABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )
        ) : (
          <RoleBadge role={role} />
        )}
      </div>

      <div className="text-center text-[11px]" style={{ width: 110, color: "var(--cth-command-muted)" }}>
        {formatDate(member.created_at)}
      </div>

      <div className="flex items-center justify-center" style={{ width: 80 }}>
        {!isWorkspaceAdmin ? null
         : isOwner ? (
            <span className="text-[10px] italic" style={{ color: "var(--cth-command-muted)" }}>—</span>
          )
         : selfBlocked ? (
            <button
              type="button"
              disabled
              title="You cannot modify your own membership from this page"
              className="rounded-md p-1.5 opacity-40"
              style={{ color: "var(--cth-command-muted)" }}
            >
              <Trash2 size={13} />
            </button>
          )
         : (
            <button
              type="button"
              onClick={onRemove}
              disabled={busyRemove}
              title="Remove member"
              className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)] disabled:opacity-50"
              style={{ color: "var(--cth-command-crimson)" }}
            >
              {busyRemove ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          )}
      </div>
    </li>
  );
}

function InviteRow({ invite, busyResend, busyRevoke, onResend, onRevoke }) {
  return (
    <li
      className="flex items-center gap-2 rounded-md p-2"
      style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)", border: "1px solid var(--cth-command-border)" }}
        >
          <Mail size={13} />
        </div>
        <p className="truncate text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }} title={invite.email}>
          {invite.email}
        </p>
      </div>

      <div className="flex items-center justify-center" style={{ width: 110 }}>
        <RoleBadge role={invite.role} />
      </div>

      <div className="text-center text-[11px]" style={{ width: 110, color: "var(--cth-command-muted)" }}>
        {formatDate(invite.resent_at || invite.created_at)}
      </div>

      <div className="flex items-center justify-center gap-1" style={{ width: 80 }}>
        <button type="button" onClick={onResend} disabled={busyResend} title="Resend"
          className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)] disabled:opacity-50"
          style={{ color: "var(--cth-command-muted)" }}>
          {busyResend ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
        </button>
        <button type="button" onClick={onRevoke} disabled={busyRevoke} title="Revoke"
          className="rounded-md p-1.5 transition-colors hover:bg-[var(--cth-command-panel-soft)] disabled:opacity-50"
          style={{ color: "var(--cth-command-crimson)" }}>
          {busyRevoke ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
        </button>
      </div>
    </li>
  );
}

function InviteModal({ saving, error, onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit({ email: email.trim(), name: name.trim(), role });
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      style={{ background: "rgba(13,0,16,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--cth-command-border)" }}>
          <h3 className="font-serif text-base font-semibold" style={{ color: "var(--cth-command-ink)" }}>
            Invite member
          </h3>
          <button type="button" onClick={onClose}
            className="rounded-full p-1" style={{ color: "var(--cth-command-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4 text-sm">
          <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="founder@example.com"
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-sm outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
          </label>
          <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
            Name (optional)
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={160}
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-sm outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }} />
          </label>
          <label className="block text-[11px] font-semibold" style={{ color: "var(--cth-command-muted)" }}>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-md px-2.5 py-1.5 text-xs outline-none"
              style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-ink)" }}>
              {MANAGEABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

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
          <button type="button" onClick={handleSubmit} disabled={saving || !email.trim()}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Send invite
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivitySummary({ summary, members }) {
  const totalCredits = summary?.total_credits_used ?? 0;
  const contentCount = summary?.content_generated ?? 0;
  const activeMembers = (members || []).filter((m) => String(m.status || "").toLowerCase() === "active").length;
  const byMember = summary?.credits_by_member || {};

  const memberNames = useMemo(() => {
    const map = new Map();
    (members || []).forEach((m) => {
      if (m.user_id) map.set(String(m.user_id), m.name || m.email || "Member");
    });
    return map;
  }, [members]);

  const topContributors = useMemo(() => {
    return Object.entries(byMember)
      .map(([userId, count]) => ({ userId, count: Number(count) || 0 }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [byMember]);

  const tile = (label, value) => (
    <div className="flex-1 rounded-md p-3"
      style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
        {label}
      </p>
      <p className="mt-1 font-serif text-lg font-semibold" style={{ color: "var(--cth-command-ink)" }}>
        {value}
      </p>
    </div>
  );

  return (
    <section className="rounded-xl p-4"
      style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
      <h2 className="font-serif text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
        Workspace activity
      </h2>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {tile("Credits used", totalCredits)}
        {tile("Content generated", contentCount)}
        {tile("Active members", activeMembers)}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--cth-command-muted)" }}>
          Top contributors
        </p>
        {topContributors.length ? (
          <ul className="mt-2 space-y-1.5">
            {topContributors.map((row) => (
              <li key={row.userId} className="flex items-center justify-between rounded-md px-2.5 py-1.5"
                style={{ background: "var(--cth-command-blush)", border: "1px solid var(--cth-command-border)" }}>
                <span className="truncate text-xs font-semibold" style={{ color: "var(--cth-command-ink)" }}>
                  {memberNames.get(row.userId) || row.userId}
                </span>
                <span className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
                  {row.count} credit{row.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
            No credit usage recorded yet.
          </p>
        )}
      </div>
    </section>
  );
}

// =========================================================
// Main component
// =========================================================

export default function Members() {
  const { user } = useUser();
  const { isSuperAdmin, userRole } = usePlan();
  const { activeWorkspaceId } = useWorkspace();

  const isPlatformAdmin = isSuperAdmin === true || ADMIN_ROLES.includes(userRole);
  const currentUserId = user?.id || "";

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [activity, setActivity] = useState(null);
  const [seatUsage, setSeatUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [savingInvite, setSavingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [roleBusyIds, setRoleBusyIds] = useState(() => new Set());
  const [removeBusyIds, setRemoveBusyIds] = useState(() => new Set());
  const [resendBusyIds, setResendBusyIds] = useState(() => new Set());
  const [revokeBusyIds, setRevokeBusyIds] = useState(() => new Set());

  const myMembership = useMemo(
    () => members.find((m) => String(m.user_id || "") === currentUserId) || null,
    [members, currentUserId]
  );

  const isWorkspaceAdmin = useMemo(() => {
    if (isPlatformAdmin) return true;
    const role = String(myMembership?.role || "").toLowerCase();
    return role === "owner" || role === "admin";
  }, [isPlatformAdmin, myMembership]);

  const loadMembers = useCallback(async (workspaceId) => {
    try {
      const response = await apiClient.get(`/api/teams/${encodeURIComponent(workspaceId)}/members`);
      setMembers(Array.isArray(response?.members) ? response.members : []);
      return true;
    } catch (err) {
      console.error("Failed to load members", err);
      setError(err?.message || "Could not load members.");
      return false;
    }
  }, []);

  const loadInvites = useCallback(async (workspaceId) => {
    try {
      const response = await apiClient.get(`/api/teams/${encodeURIComponent(workspaceId)}/pending-invites`);
      setInvites(Array.isArray(response?.invites) ? response.invites : []);
    } catch (err) {
      console.error("Failed to load invites", err);
    }
  }, []);

  const loadActivity = useCallback(async (workspaceId) => {
    try {
      const response = await apiClient.get(`/api/teams/${encodeURIComponent(workspaceId)}/activity-summary`);
      setActivity(response || null);
    } catch (err) {
      console.error("Failed to load activity", err);
    }
  }, []);

  const loadSeatUsage = useCallback(async (workspaceId) => {
    try {
      const response = await apiClient.get(`/api/teams/${encodeURIComponent(workspaceId)}/seat-usage`);
      setSeatUsage(response || null);
    } catch (err) {
      console.error("Failed to load seat usage", err);
      setSeatUsage(null);
    }
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    (async () => {
      await loadMembers(activeWorkspaceId);
      await loadActivity(activeWorkspaceId);
      setLoading(false);
    })();
  }, [activeWorkspaceId, loadMembers, loadActivity]);

  useEffect(() => {
    if (!activeWorkspaceId || !isWorkspaceAdmin) return;
    loadInvites(activeWorkspaceId);
    loadSeatUsage(activeWorkspaceId);
  }, [activeWorkspaceId, isWorkspaceAdmin, loadInvites, loadSeatUsage]);

  async function handleRoleChange(member, nextRole) {
    if (!activeWorkspaceId) return;
    setError("");
    setRoleBusyIds((current) => new Set(current).add(member.id));
    const snapshot = members;
    setMembers((current) => current.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m)));
    try {
      await apiClient.put(
        `/api/teams/${encodeURIComponent(activeWorkspaceId)}/members/${encodeURIComponent(member.id)}/role`,
        { role: nextRole }
      );
    } catch (err) {
      console.error("Role change failed", err);
      setMembers(snapshot);
      setError(err?.message || "Could not update role.");
    } finally {
      setRoleBusyIds((current) => {
        const next = new Set(current);
        next.delete(member.id);
        return next;
      });
    }
  }

  async function handleRemoveMember(member) {
    if (!activeWorkspaceId) return;
    if (!window.confirm(`Remove ${displayName(member)} from this workspace?`)) return;
    setError("");
    setRemoveBusyIds((current) => new Set(current).add(member.id));
    const snapshot = members;
    setMembers((current) => current.filter((m) => m.id !== member.id));
    try {
      await apiClient.delete(
        `/api/teams/${encodeURIComponent(activeWorkspaceId)}/members/${encodeURIComponent(member.id)}`
      );
    } catch (err) {
      console.error("Remove failed", err);
      setMembers(snapshot);
      setError(err?.message || "Could not remove member.");
    } finally {
      setRemoveBusyIds((current) => {
        const next = new Set(current);
        next.delete(member.id);
        return next;
      });
    }
  }

  async function handleSubmitInvite(payload) {
    if (!activeWorkspaceId) return;
    setSavingInvite(true);
    setInviteError("");
    try {
      const response = await apiClient.post(
        `/api/teams/${encodeURIComponent(activeWorkspaceId)}/invite`,
        payload
      );
      const newInvite = response?.member;
      if (newInvite) {
        setInvites((current) => [
          {
            id: newInvite.id,
            email: newInvite.email,
            name: newInvite.name,
            role: newInvite.role,
            status: newInvite.status,
            invite_token: newInvite.invite_token,
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
      } else {
        await loadInvites(activeWorkspaceId);
      }
      await loadSeatUsage(activeWorkspaceId);
      setInviteModalOpen(false);
    } catch (err) {
      console.error("Invite failed", err);
      const detail = err?.response?.data?.detail || err?.message || "Could not send invite.";
      setInviteError(detail);
    } finally {
      setSavingInvite(false);
    }
  }

  async function handleResendInvite(invite) {
    if (!activeWorkspaceId) return;
    setError("");
    setResendBusyIds((current) => new Set(current).add(invite.id));
    try {
      await apiClient.post(
        `/api/teams/${encodeURIComponent(activeWorkspaceId)}/pending-invites/${encodeURIComponent(invite.id)}/resend`
      );
      const nowIso = new Date().toISOString();
      setInvites((current) => current.map((i) => (i.id === invite.id ? { ...i, resent_at: nowIso } : i)));
    } catch (err) {
      console.error("Resend failed", err);
      setError(err?.message || "Could not resend invite.");
    } finally {
      setResendBusyIds((current) => {
        const next = new Set(current);
        next.delete(invite.id);
        return next;
      });
    }
  }

  async function handleRevokeInvite(invite) {
    if (!activeWorkspaceId) return;
    if (!window.confirm(`Revoke invitation for ${invite.email}?`)) return;
    setError("");
    setRevokeBusyIds((current) => new Set(current).add(invite.id));
    const snapshot = invites;
    setInvites((current) => current.filter((i) => i.id !== invite.id));
    try {
      await apiClient.delete(
        `/api/teams/${encodeURIComponent(activeWorkspaceId)}/pending-invites/${encodeURIComponent(invite.id)}`
      );
    } catch (err) {
      console.error("Revoke failed", err);
      setInvites(snapshot);
      setError(err?.message || "Could not revoke invite.");
    } finally {
      setRevokeBusyIds((current) => {
        const next = new Set(current);
        next.delete(invite.id);
        return next;
      });
    }
  }

  const atSeatCap = Boolean(
    seatUsage && typeof seatUsage.limit === "number" && seatUsage.used >= seatUsage.limit
  );

  const headerAction = isWorkspaceAdmin ? (
    <button
      type="button"
      onClick={() => { setInviteError(""); setInviteModalOpen(true); }}
      disabled={atSeatCap}
      title={atSeatCap ? `Seat limit reached for the ${seatUsage?.plan || "current"} plan. Upgrade to add more members.` : ""}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" }}
    >
      <UserPlus size={13} /> Invite member
    </button>
  ) : null;

  if (!activeWorkspaceId) {
    return (
      <DashboardLayout>
        <header className="cth-page-header">
          <div className="min-w-0 flex-1">
            <h1
              className="text-2xl md:text-[32px] leading-tight truncate"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
            >
              Members
            </h1>
            <p
              className="text-xs md:text-sm truncate"
              style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
            >
              Manage who can access this workspace.
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-2 rounded-xl p-5 text-sm"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" }}>
            <Loader2 size={14} className="animate-spin" /> Resolving workspace...
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Members
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Manage who can access this workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {headerAction}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {seatUsage && isWorkspaceAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background: atSeatCap ? "var(--cth-command-error)" : "var(--cth-command-blush)",
                color: atSeatCap ? "var(--cth-command-panel)" : "var(--cth-command-ink)",
                border: "1px solid " + (atSeatCap ? "var(--cth-command-error)" : "var(--cth-command-border)"),
              }}
            >
              Seats: {seatUsage.used} / {seatUsage.limit}
            </span>
            <span className="text-[11px]" style={{ color: "var(--cth-command-muted)" }}>
              {atSeatCap
                ? `Seat limit reached for the ${seatUsage.plan} plan. Upgrade to add more members.`
                : `${seatUsage.plan.charAt(0).toUpperCase() + seatUsage.plan.slice(1)} plan — ${seatUsage.remaining} seat${seatUsage.remaining === 1 ? "" : "s"} remaining.`}
            </span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{ background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-crimson)", color: "var(--cth-command-ink)" }}>
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--cth-command-crimson)" }} />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={() => setError("")} style={{ color: "var(--cth-command-muted)" }}>
              <X size={12} />
            </button>
          </div>
        ) : null}

        <section className="rounded-xl p-4"
          style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
          <div className="mb-3 flex items-center gap-2">
            <Users size={16} style={{ color: "var(--cth-command-crimson)" }} />
            <h2 className="font-serif text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
              Members ({members.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <HeaderPill flex align="left">Member</HeaderPill>
            <HeaderPill width={200}>Email</HeaderPill>
            <HeaderPill width={110}>Role</HeaderPill>
            <HeaderPill width={110}>Joined</HeaderPill>
            <HeaderPill width={80}>Actions</HeaderPill>
          </div>

          {loading && !members.length ? (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--cth-command-muted)" }}>
              <Loader2 size={14} className="animate-spin" /> Loading members...
            </div>
          ) : members.length === 0 ? (
            <p className="mt-3 text-xs" style={{ color: "var(--cth-command-muted)" }}>
              No members yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isSelf={String(member.user_id || "") === currentUserId}
                  isWorkspaceAdmin={isWorkspaceAdmin}
                  busyRole={roleBusyIds.has(member.id)}
                  busyRemove={removeBusyIds.has(member.id)}
                  onRoleChange={(role) => handleRoleChange(member, role)}
                  onRemove={() => handleRemoveMember(member)}
                />
              ))}
            </ul>
          )}

          {isWorkspaceAdmin && myMembership ? (
            <p className="mt-3 text-[10px] italic" style={{ color: "var(--cth-command-muted)" }}>
              You cannot change your own role or remove yourself from this page. Ask another admin or transfer ownership first.
            </p>
          ) : null}
        </section>

        {isWorkspaceAdmin ? (
          <section className="rounded-xl p-4"
            style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)" }}>
            <div className="mb-3 flex items-center gap-2">
              <Mail size={16} style={{ color: "var(--cth-command-crimson)" }} />
              <h2 className="font-serif text-sm font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--cth-command-muted)" }}>
                Pending invites ({invites.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <HeaderPill flex align="left">Email</HeaderPill>
              <HeaderPill width={110}>Role</HeaderPill>
              <HeaderPill width={110}>Sent</HeaderPill>
              <HeaderPill width={80}>Actions</HeaderPill>
            </div>

            {invites.length === 0 ? (
              <p className="mt-3 text-xs" style={{ color: "var(--cth-command-muted)" }}>
                No pending invitations.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {invites.map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    busyResend={resendBusyIds.has(invite.id)}
                    busyRevoke={revokeBusyIds.has(invite.id)}
                    onResend={() => handleResendInvite(invite)}
                    onRevoke={() => handleRevokeInvite(invite)}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <ActivitySummary summary={activity} members={members} />
      </main>

      {inviteModalOpen ? (
        <InviteModal
          saving={savingInvite}
          error={inviteError}
          onClose={() => { if (!savingInvite) setInviteModalOpen(false); }}
          onSubmit={handleSubmitInvite}
        />
      ) : null}
    </DashboardLayout>
  );
}
