import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, KeyRound, Plus, ShieldCheck, UserCog, UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useWorkspace } from "../../context/WorkspaceContext";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { formatDateTime, normalizeList } from "./workspaceRoutes";
import { Modal, Pill, Status, messageFor, saveSettings } from "./WorkspaceControlPrimitives";

const generalSchema = z.object({
  name: z.string().trim().min(2),
  timezone: z.string().trim().min(2),
  description: z.string().trim().max(500),
});
const inviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["viewer", "editor", "admin", "billing", "guest"]),
});
const clientSchema = z.object({
  name: z.string().trim().min(2),
  ownerEmail: z.string().trim().email(),
  template: z.enum(["blank", "service-brand", "founder-brand"]),
});
const roleSchema = z.object({
  name: z.string().trim().min(2),
  permissions: z.array(z.string()).min(1),
});

export function GeneralControl({ data }) {
  const [form, setForm] = useState({ name: "", timezone: "America/Chicago", description: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm({
    name: data.detail?.name || data.activeWorkspace?.name || "",
    timezone: data.settings?.timezone || "America/Chicago",
    description: data.settings?.description || data.detail?.description || "",
  }), [data.activeWorkspace, data.detail, data.settings]);

  const submit = async (event) => {
    event.preventDefault();
    const parsed = generalSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Check the workspace details.");
      return;
    }
    setSaving(true);
    try {
      await saveSettings(data, parsed.data);
      setMessage("Workspace settings saved.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Workspace Identity</h2><p>These values belong to the active tenant only.</p></div><Pill tone="green">Private</Pill></div>
        <form className="ws-form" onSubmit={submit}>
          <label><span>Workspace name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label><span>Timezone</span><select value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}><option value="America/Chicago">Central Time</option><option value="America/New_York">Eastern Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option></select></label>
          <label><span>Description</span><textarea rows="5" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <Status>{message}</Status>
          <button className="ws-btn primary" disabled={saving}>{saving ? "Saving…" : "Save General Settings"}</button>
        </form>
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Tenant Boundary</h2><p>Workspace-scoped data remains isolated.</p></div><ShieldCheck size={21} /></div>
        <div className="ws-detail-list"><div><span>Workspace ID</span><strong>{data.activeWorkspaceId ? `${data.activeWorkspaceId.slice(0, 8)}…` : "Unavailable"}</strong></div><div><span>Status</span><strong>{data.activeWorkspace?.status || "Active"}</strong></div><div><span>Role</span><strong>{data.activeWorkspace?.role || "Member"}</strong></div><div><span>Support access</span><strong>{data.settings?.privacy?.support_access ? "Owner approved" : "Not granted"}</strong></div></div>
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
    try {
      await apiClient.patch(API_PATHS.teams.memberRole(data.activeWorkspaceId, member.id), { role });
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
          <tr key={member.id}><td><strong>{member.name}</strong></td><td>{member.email || "Not provided"}</td><td><select value={member.role} onChange={(event) => void changeRole(member, event.target.value)}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option><option value="billing">Billing</option><option value="guest">Guest</option></select></td><td><Pill tone={member.status === "active" ? "green" : "gold"}>{member.status}</Pill></td><td>{formatDateTime(member.lastActive)}</td></tr>
        ))}</tbody></table></div>
      ) : <div className="ws-empty"><Users size={22} /><h3>No members returned</h3><p>Invite tools are ready, but the backend returned no member records.</p></div>}
      <Modal open={open} onOpenChange={setOpen} title="Invite Member" description="Invitation access is limited to the active workspace.">
        <form className="ws-form" onSubmit={invite}>
          <label><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label><span>Access profile</span><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option><option value="billing">Billing</option><option value="guest">Guest</option></select></label>
          <Status>{message}</Status>
          <div className="ws-dialog-actions"><Dialog.Close className="ws-btn secondary">Cancel</Dialog.Close><button className="ws-btn primary" disabled={saving}>{saving ? "Sending…" : "Send Invitation"}</button></div>
        </form>
      </Modal>
    </article>
  );
}

export function ClientWorkspacesControl({ data }) {
  const { selectWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", ownerEmail: "", template: "blank" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const clients = data.workspaces.filter((item) => item.id !== data.activeWorkspaceId);

  const create = async (event) => {
    event.preventDefault();
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Complete the client workspace details.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/api/workspaces", {
        name: parsed.data.name,
        owner_email: parsed.data.ownerEmail,
        template: parsed.data.template,
        workspace_type: "client",
      }, { workspace: false });
      setOpen(false);
      await data.reload();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  const enter = (workspace) => {
    selectWorkspace(workspace);
    navigate("/workspace");
  };

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Estate Client Workspaces</h2><p>Each client House has its own ID, members, integrations, and audit history.</p></div><button className="ws-btn primary" onClick={() => setOpen(true)}><Plus size={16} /> Create Client Workspace</button></div>
      <Status>{message}</Status>
      {clients.length ? <div className="ws-client-grid">{clients.map((workspace) => (
        <button key={workspace.id} className="ws-client-card" onClick={() => enter(workspace)}><span className="ws-avatar">{workspace.name.charAt(0).toUpperCase()}</span><div><strong>{workspace.name}</strong><p>{workspace.role || "member"} · {workspace.status || "active"}</p><small>Isolated tenant workspace</small></div><ArrowRight size={18} /></button>
      ))}</div> : <div className="ws-empty"><Users size={22} /><h3>No client workspaces yet</h3><p>Create an isolated client House when Estate workspace provisioning is available.</p></div>}
      <Modal open={open} onOpenChange={setOpen} title="Create Client Workspace" description="A separate tenant boundary will be created for the client.">
        <form className="ws-form" onSubmit={create}>
          <label><span>Client workspace name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label><span>Owner email</span><input type="email" value={form.ownerEmail} onChange={(event) => setForm((current) => ({ ...current, ownerEmail: event.target.value }))} /></label>
          <label><span>Starting template</span><select value={form.template} onChange={(event) => setForm((current) => ({ ...current, template: event.target.value }))}><option value="blank">Blank Brand House</option><option value="service-brand">Service Brand</option><option value="founder-brand">Founder Brand</option></select></label>
          <div className="ws-privacy-card"><ShieldCheck size={18} /><div><strong>Separate House</strong><p>A new workspace ID, member directory, integrations, and audit log will be created.</p></div></div>
          <Status>{message}</Status>
          <div className="ws-dialog-actions"><Dialog.Close className="ws-btn secondary">Cancel</Dialog.Close><button className="ws-btn primary" disabled={saving}>{saving ? "Creating…" : "Create Workspace"}</button></div>
        </form>
      </Modal>
    </article>
  );
}

const permissionOptions = ["content", "campaigns", "crm", "reports", "members", "billing", "workspace-controls"];
export function RolesControl({ data }) {
  const existing = normalizeList(data.settings?.roles, ["roles"]);
  const [form, setForm] = useState({ name: "Client Content Manager", permissions: ["content", "campaigns"] });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const toggle = (permission) => setForm((current) => ({
    ...current,
    permissions: current.permissions.includes(permission)
      ? current.permissions.filter((item) => item !== permission)
      : [...current.permissions, permission],
  }));
  const save = async (event) => {
    event.preventDefault();
    const parsed = roleSchema.safeParse(form);
    if (!parsed.success) {
      setMessage("Add a role name and at least one permission.");
      return;
    }
    setSaving(true);
    try {
      await saveSettings(data, { custom_roles: [...existing, parsed.data] });
      setMessage("Custom role saved.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Permission Profiles</h2><p>Estate roles keep module access explicit.</p></div><Pill tone="gold">Estate</Pill></div>
        {existing.length ? existing.map((role) => <div key={role.name} className="ws-row"><KeyRound size={17} /><span><strong>{role.name}</strong><small>{(role.permissions || []).join(", ")}</small></span></div>) : <div className="ws-empty"><UserCog size={22} /><h3>No custom roles yet</h3><p>Create a reusable permission profile for client teams.</p></div>}
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Create Custom Role</h2><p>Start with the smallest access the role needs.</p></div></div>
        <form className="ws-form" onSubmit={save}>
          <label><span>Role name</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <div className="ws-check-grid">{permissionOptions.map((permission) => <label key={permission} className="ws-check"><input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => toggle(permission)} /><span>{permission.replace("-", " ")}</span></label>)}</div>
          <Status>{message}</Status>
          <button className="ws-btn primary" disabled={saving}>{saving ? "Saving…" : "Create Role"}</button>
        </form>
      </article>
    </div>
  );
}
