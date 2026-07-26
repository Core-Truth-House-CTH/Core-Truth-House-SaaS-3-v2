import { useMemo, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  AlertTriangle, Bell, CircleDollarSign, Download, Link2, Trash2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { formatDateTime } from "./workspaceRoutes";
import { Pill, Status, messageFor } from "./WorkspaceControlPrimitives";

export function BillingControl({ data }) {
  const navigate = useNavigate();
  const plan = data.billing?.plan_name || data.billing?.plan || data.activeWorkspace?.plan || "Foundation";
  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Current Plan</h2><p>Plan and limits belong to the active workspace.</p></div><Pill tone="gold">{plan}</Pill></div>
        <div className="ws-detail-list"><div><span>Status</span><strong>{data.billing?.status || data.activeWorkspace?.status || "Active"}</strong></div><div><span>Billing cycle</span><strong>{data.billing?.billing_interval || "Monthly"}</strong></div><div><span>Credit balance</span><strong>{data.billing?.credit_balance ?? "See billing"}</strong></div><div><span>Next billing date</span><strong>{formatDateTime(data.billing?.next_billing_at)}</strong></div></div>
        <button className="ws-btn primary" onClick={() => navigate("/billing")}><CircleDollarSign size={16} /> Open Billing</button>
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Workspace Limits</h2><p>Limits are read from subscription and usage records.</p></div></div>
        <div className="ws-detail-list"><div><span>Members</span><strong>{data.members.length}</strong></div><div><span>Client workspaces</span><strong>{Math.max(0, data.workspaces.length - 1)}</strong></div><div><span>Stored items</span><strong>{data.documents.length + data.assets.length}</strong></div><div><span>Plan access</span><strong>{plan}</strong></div></div>
      </article>
    </div>
  );
}

export function ActivityLogControl({ data }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => data.activity.filter((item) =>
    `${item.actor} ${item.action} ${item.detail}`.toLowerCase().includes(query.toLowerCase())
  ), [data.activity, query]);

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Detailed Audit</h2><p>Workspace activity is separate from the platform audit.</p></div><Pill>{filtered.length} events</Pill></div>
      <label className="ws-search-field"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member, action, or module" /></label>
      {filtered.length ? (
        <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Time</th><th>Member</th><th>Action</th><th>Detail</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{formatDateTime(item.createdAt)}</td><td>{item.actor}</td><td>{item.action}</td><td>{item.detail || "—"}</td></tr>)}</tbody></table></div>
      ) : <div className="ws-empty"><Bell size={22} /><h3>No matching activity</h3><p>New member and module activity will appear here.</p></div>}
    </article>
  );
}

export function DangerControl({ data }) {
  const name = data.activeWorkspace?.name || "workspace";
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const requestArchive = async () => {
    setBusy("archive");
    try {
      await apiClient.post(`/api/workspaces/${encodeURIComponent(data.activeWorkspaceId)}/exports`, { scope: "workspace", final: true });
      setMessage("Final workspace archive requested.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    try {
      await apiClient.patch(API_PATHS.workspace.settings(data.activeWorkspaceId), { integrations: {} });
      await data.reload();
      setMessage("Workspace integrations disconnected.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (confirmation.trim() !== name) {
      setMessage(`Type “${name}” exactly to continue.`);
      return;
    }
    try {
      await apiClient.delete(API_PATHS.workspace.detail(data.activeWorkspaceId));
      setMessage("Workspace deletion request submitted.");
      setOpen(false);
    } catch (error) {
      setMessage(messageFor(error));
    }
  };

  return (
    <article className="ws-panel danger-panel">
      <div className="ws-panel-head"><div><h2>Danger Zone</h2><p>Owner-only actions are irreversible or disruptive.</p></div><Pill tone="red">Owner only</Pill></div>
      <div className="ws-danger-row"><div><strong>Download final archive</strong><p>Create an export before a major change.</p></div><button className="ws-btn secondary" onClick={() => void requestArchive()} disabled={Boolean(busy)}><Download size={16} /> {busy === "archive" ? "Requesting…" : "Request Archive"}</button></div>
      <div className="ws-danger-row"><div><strong>Disconnect all integrations</strong><p>Remove connected systems while keeping records.</p></div><button className="ws-btn secondary" onClick={() => void disconnect()} disabled={Boolean(busy)}><Link2 size={16} /> {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}</button></div>
      <div className="ws-danger-row critical"><div><strong>Delete workspace</strong><p>Begin the supported deletion and retention process.</p></div><button className="ws-btn danger" onClick={() => setOpen(true)}><Trash2 size={16} /> Delete Workspace</button></div>
      <Status tone="danger">{message}</Status>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="ws-dialog-overlay" />
          <AlertDialog.Content className="ws-dialog-content">
            <div className="ws-dialog-head"><div><AlertDialog.Title>Delete {name}?</AlertDialog.Title><AlertDialog.Description>This requires an owner-authorized backend endpoint.</AlertDialog.Description></div><AlertDialog.Cancel className="ws-icon-btn"><X size={17} /></AlertDialog.Cancel></div>
            <div className="ws-privacy-card danger"><AlertTriangle size={18} /><div><strong>Confirmation required</strong><p>Type the workspace name exactly.</p></div></div>
            <label className="ws-form"><span>Workspace name</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
            <div className="ws-dialog-actions"><AlertDialog.Cancel className="ws-btn secondary">Cancel</AlertDialog.Cancel><AlertDialog.Action className="ws-btn danger" onClick={(event) => { event.preventDefault(); void remove(); }}>Submit Deletion Request</AlertDialog.Action></div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </article>
  );
}
