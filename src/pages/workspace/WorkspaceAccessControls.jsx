import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useWorkspace } from "../../context/WorkspaceContext";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { formatDateTime } from "./workspaceRoutes";
import { Modal, Pill, Status, messageFor } from "./WorkspaceControlPrimitives";
import { createClientWorkspace, patchWorkspaceSettings } from "./workspaceApi";

const generalSchema = z.object({
  workspace_name: z.string().trim().min(2, "Add a workspace name."),
  timezone: z.string().trim().min(2),
  locale: z.string().trim().min(2),
  brand_visibility: z.enum(["private", "internal", "public"]),
});
const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["viewer", "member", "editor", "admin", "billing", "guest"]),
});
const clientSchema = z.object({
  name: z.string().trim().min(2, "Add a client Workspace name.").max(200),
  client_email: z.union([z.literal(""), z.string().trim().email("Enter a valid client email.")]),
  template: z.enum(["blank", "service-brand", "founder-brand"]),
});

export function GeneralControl({ data }) {
  const [form, setForm] = useState({
    workspace_name: "",
    timezone: "America/Chicago",
    locale: "en-US",
    brand_visibility: "private",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm({
    workspace_name: data.settings?.workspace_name || data.activeWorkspace?.name || "",
    timezone: data.settings?.timezone || "America/Chicago",
    locale: data.settings?.locale || "en-US",
    brand_visibility: data.settings?.brand_visibility || "private",
  }), [data.activeWorkspace, data.settings]);

  const submit = async (event) => {
    event.preventDefault();
    const parsed = generalSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Check the workspace details.");
      return;
    }
    setSaving(true);
    try {
      await patchWorkspaceSettings(parsed.data);
      setMessage("Workspace settings saved.");
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Workspace Identity</h2><p>These values are supported by the tenant settings service.</p></div><Pill tone="green">Private</Pill></div>
        <form className="ws-form" onSubmit={submit}>
          <label><span>Workspace name</span><input value={form.workspace_name} onChange={(event) => setForm((current) => ({ ...current, workspace_name: event.target.value }))} /></label>
          <label><span>Timezone</span><select value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}><option value="America/Chicago">Central Time</option><option value="America/New_York">Eastern Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option><option value="UTC">UTC</option></select></label>
          <label><span>Locale</span><select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}><option value="en-US">English (United States)</option></select></label>
          <label><span>Brand visibility</span><select value={form.brand_visibility} onChange={(event) => setForm((current) => ({ ...current, brand_visibility: event.target.value }))}><option value="private">Private</option><option value="internal">Internal</option><option value="public">Public</option></select></label>
          <Status>{message}</Status>
          <button className="ws-btn primary" disabled={saving}>{saving ? "Saving…" : "Save General Settings"}</button>
        </form>
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Tenant Boundary</h2><p>Workspace-scoped data remains isolated.</p></div><ShieldCheck size={21} /></div>
        <div className="ws-detail-list"><div><span>Workspace ID</span><strong>{data.activeWorkspaceId ? `${data.activeWorkspaceId.slice(0, 8)}…` : "Unavailable"}</strong></div><div><span>Status</span><strong>{data.activeWorkspace?.status || "Active"}</strong></div><div><span>Role</span><strong>{data.activeWorkspace?.role || "Member"}</strong></div><div><span>Visibility</span><strong>{form.brand_visibility}</strong></div></div>
      </article>
    </div>
  );
}

export function MembersControl({ data }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "editor" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const invite = async (event) => {
    event.preventDefault();
    const parsed = inviteSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Enter a valid email and role.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(API_PATHS.teams.invite(data.activeWorkspaceId), parsed.data);
      setOpen(false);
      setForm({ email: "", role: "editor" });
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (member, role) => {
    setMessage("");
    try {
      await apiClient.put(API_PATHS.teams.memberRole(data.activeWorkspaceId, member.id), { role });
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Member Access</h2><p>Invitations and permissions remain scoped to this workspace.</p></div><button className="ws-btn primary" onClick={() => setOpen(true)}><UserPlus size={16} /> Invite Member</button></div>
      <Status>{message}</Status>
      {data.members.length ? (
        <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th></tr></thead><tbody>{data.members.map((member) => (
          <tr key={member.id}><td><strong>{member.name}</strong></td><td>{member.email || "Not provided"}</td><td>{member.role === "owner" ? <Pill tone="gold">Owner</Pill> : <select value={member.role} onChange={(event) => void changeRole(member, event.target.value)}><option value="viewer">Viewer</option><option value="member">Member</option><option value="editor">Editor</option><option value="admin">Admin</option><option value="billing">Billing</option><option value="guest">Guest</option></select>}</td><td><Pill tone={member.status === "active" ? "green" : "gold"}>{member.status}</Pill></td><td>{formatDateTime(member.lastActive)}</td></tr>
        ))}</tbody></table></div>
      ) : <div className="ws-empty"><Users size={22} /><h3>No members returned</h3><p>Invite tools are ready, but the backend returned no member records.</p></div>}
      <Modal open={open} onOpenChange={setOpen} title="Invite Member" description="Invitation access is limited to the active workspace.">
        <form className="ws-form" onSubmit={invite}>
          <label><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label><span>Access profile</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}><option value="viewer">Viewer</option><option value="member">Member</option><option value="editor">Editor</option><option value="admin">Admin</option><option value="billing">Billing</option><option value="guest">Guest</option></select></label>
          <Status>{message}</Status>
          <div className="ws-dialog-actions"><Dialog.Close type="button" className="ws-btn secondary">Cancel</Dialog.Close><button className="ws-btn primary" disabled={saving}>{saving ? "Sending…" : "Send Invitation"}</button></div>
        </form>
      </Modal>
    </article>
  );
}

export function ClientWorkspacesControl({ data }) {
  const { selectWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client_email: "", template: "blank" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const clients = data.workspaces.filter((item) =>
    item.id !== data.activeWorkspaceId &&
    (
      item.raw?.parent_workspace_id === data.activeWorkspaceId ||
      item.raw?.managed_by_workspace_id === data.activeWorkspaceId ||
      item.raw?.workspace_type === "client"
    )
  );

  const enter = (workspace) => {
    selectWorkspace(workspace);
    navigate("/workspace");
  };

  const create = async (event) => {
    event.preventDefault();
    setMessage("");
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Check the client Workspace details.");
      return;
    }
    if (!data.companionAvailable) {
      setMessage("Client Workspace provisioning is unavailable until the companion API is deployed.");
      return;
    }

    setSaving(true);
    try {
      await createClientWorkspace({
        name: parsed.data.name,
        client_email: parsed.data.client_email || null,
        template: parsed.data.template,
      });
      setOpen(false);
      setForm({ name: "", client_email: "", template: "blank" });
      setMessage("Isolated client Workspace created.");
      await data.refreshWorkspaces();
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Estate Client Workspaces</h2><p>Each client House has its own ID, members, integrations, Brand Memory, and audit history.</p></div><button className="ws-btn primary" onClick={() => setOpen(true)}><UserPlus size={16} /> Create Client Workspace</button></div>
      <Status>{message}</Status>
      {clients.length ? <div className="ws-client-grid">{clients.map((workspace) => (
        <button key={workspace.id} className="ws-client-card" onClick={() => enter(workspace)}><span className="ws-avatar">{workspace.name.charAt(0).toUpperCase()}</span><div><strong>{workspace.name}</strong><p>{workspace.role || "member"} · {workspace.status || "active"}</p><small>Isolated tenant Workspace</small></div><ArrowRight size={18} /></button>
      ))}</div> : <div className="ws-empty"><Users size={22} /><h3>No client workspaces yet</h3><p>Create a separate client House without mixing client content into the parent Workspace.</p></div>}
      <Modal open={open} onOpenChange={setOpen} title="Create Client Workspace" description="Estate-only provisioning creates a separate tenant boundary and owner membership.">
        <form className="ws-form" onSubmit={create}>
          <label><span>Client Workspace name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label><span>Client email, optional</span><input type="email" value={form.client_email} onChange={(event) => setForm((current) => ({ ...current, client_email: event.target.value }))} /></label>
          <label><span>Starting template</span><select value={form.template} onChange={(event) => setForm((current) => ({ ...current, template: event.target.value }))}><option value="blank">Blank Brand House</option><option value="service-brand">Service Brand</option><option value="founder-brand">Founder Brand</option></select></label>
          <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Separate House</strong><p>The service creates a unique Workspace ID, owner membership, Brand Memory, settings, and audit boundary.</p></div></div>
          <Status>{message}</Status>
          <div className="ws-dialog-actions"><Dialog.Close type="button" className="ws-btn secondary">Cancel</Dialog.Close><button className="ws-btn primary" disabled={saving || !data.companionAvailable}>{saving ? "Creating…" : "Create Client Workspace"}</button></div>
        </form>
      </Modal>
    </article>
  );
}

const roleRows = [
  ["Owner", "Full tenant ownership, billing, access, and critical controls"],
  ["Admin", "Members, modules, settings, and approvals"],
  ["Editor", "Create and update workspace content"],
  ["Member", "Participate in supported Workspace modules"],
  ["Viewer", "Read-only access to approved workspace areas"],
  ["Billing", "Plan, invoices, and usage"],
  ["Guest", "Limited assigned-module access"],
];

export function RolesControl({ data }) {
  const activeRoles = useMemo(() => new Set(data.members.map((member) => member.role)), [data.members]);
  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Permission Profiles</h2><p>Live roles supported by the member service.</p></div><Pill tone="gold">Estate</Pill></div>
        {roleRows.map(([name, description]) => <div key={name} className="ws-row"><KeyRound size={17} /><span><strong>{name}</strong><small>{description}</small></span>{activeRoles.has(name.toLowerCase()) ? <Pill tone="green">In use</Pill> : null}</div>)}
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Custom Roles</h2><p>Custom permission matrices require a dedicated backend policy endpoint.</p></div><LockKeyhole size={21} /></div>
        <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Protected by design</strong><p>The Workspace will not pretend to save a role that the authorization middleware cannot enforce.</p></div></div>
        <Status>Custom role creation remains unavailable until enforcement, audit, and route-check support are deployed together.</Status>
        <button className="ws-btn secondary" disabled>Create Custom Role</button>
      </article>
    </div>
  );
}
