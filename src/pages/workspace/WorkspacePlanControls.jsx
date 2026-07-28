import { useMemo, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  AlertTriangle, Bell, CircleDollarSign, Download, Link2, Trash2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { formatDateTime } from "./workspaceRoutes";
import { Pill, Status, messageFor } from "./WorkspaceControlPrimitives";
import {
  disconnectSupportedIntegrations,
  downloadTenantExport,
  requestWorkspaceDeletion,
} from "./workspaceApi";

const deletionSchema = z.object({
  confirmation: z.string().trim().min(1),
  reason: z.string().trim().max(1000),
  exportConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Confirm that a Workspace export has been downloaded." }),
  }),
});

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
    `${item.actor} ${item.action} ${item.module} ${item.detail}`.toLowerCase().includes(query.toLowerCase())
  ), [data.activity, query]);

  if (!data.companionAvailable) {
    const summary = data.activitySummary || {};
    const entries = [
      ["AI credits used", summary.total_credits_used ?? 0],
      ["Content generated", summary.content_generated ?? 0],
      ["Members represented", Object.keys(summary.credits_by_member || {}).length],
    ];
    return (
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Detailed Activity</h2><p>The event service is unavailable, so only the verified tenant summary is shown.</p></div><Pill tone="gold">Summary</Pill></div>
        <div className="ws-stat-grid">{entries.map(([label, value]) => <div key={label}><Bell size={18} /><strong>{value}</strong><span>{label}</span></div>)}</div>
      </article>
    );
  }

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Detailed Workspace Audit</h2><p>Workspace activity is separate from the platform administration audit.</p></div><Pill tone="green">{filtered.length} events</Pill></div>
      <label className="ws-search-field"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member, action, or module" /></label>
      {filtered.length ? (
        <div className="ws-table-wrap"><table className="ws-table"><thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Module</th><th>Detail</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{formatDateTime(item.createdAt)}</td><td>{item.actor}</td><td>{item.role}</td><td>{item.action.replaceAll("_", " ")}</td><td>{item.module.replaceAll("_", " ")}</td><td>{item.detail || "—"}</td></tr>)}</tbody></table></div>
      ) : <div className="ws-empty"><Bell size={22} /><h3>No matching activity</h3><p>Workspace lifecycle and control actions will appear here.</p></div>}
    </article>
  );
}

export function DangerControl({ data }) {
  const name = data.activeWorkspace?.name || "workspace";
  const [form, setForm] = useState({ confirmation: "", reason: "", exportConfirmed: false });
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const downloadArchive = async () => {
    setBusy("archive");
    setMessage("");
    try {
      await downloadTenantExport(name);
      setForm((current) => ({ ...current, exportConfirmed: true }));
      setMessage("Tenant-scoped archive downloaded.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    setMessage("");
    try {
      const result = await disconnectSupportedIntegrations();
      setMessage(`${result.disconnected} supported AI integration${result.disconnected === 1 ? "" : "s"} disconnected${result.failed ? `; ${result.failed} could not be changed` : ""}.`);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const requestDeletion = async () => {
    setMessage("");
    const parsed = deletionSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message || "Complete the deletion request.");
      return;
    }
    if (parsed.data.confirmation !== name) {
      setMessage(`Type “${name}” exactly to continue.`);
      return;
    }
    if (!data.companionAvailable) {
      setMessage("Deletion requests are unavailable until the Workspace companion API is deployed.");
      return;
    }

    setBusy("delete");
    try {
      const result = await requestWorkspaceDeletion({
        reason: parsed.data.reason,
        export_confirmed: true,
      });
      setMessage(`Deletion request submitted. Retention is scheduled through ${formatDateTime(result?.retention_until)}.`);
      setOpen(false);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  return (
    <article className="ws-panel danger-panel">
      <div className="ws-panel-head"><div><h2>Danger Zone</h2><p>Owner-only actions are audited and never perform an immediate destructive delete.</p></div><Pill tone="red">Owner only</Pill></div>
      <div className="ws-danger-row"><div><strong>Download final archive</strong><p>Download the supported tenant collections before a lifecycle request.</p></div><button className="ws-btn secondary" onClick={() => void downloadArchive()} disabled={Boolean(busy)}><Download size={16} /> {busy === "archive" ? "Preparing…" : "Download Archive"}</button></div>
      <div className="ws-danger-row"><div><strong>Disconnect supported AI integrations</strong><p>Disconnect OpenAI, fal.ai, and Higgsfield Workspace credentials.</p></div><button className="ws-btn secondary" onClick={() => void disconnect()} disabled={Boolean(busy)}><Link2 size={16} /> {busy === "disconnect" ? "Disconnecting…" : "Disconnect AI Providers"}</button></div>
      <div className="ws-danger-row critical"><div><strong>Request Workspace deletion</strong><p>Creates an audited request with a 30-day retention window. It does not delete data immediately.</p></div><button className="ws-btn danger" onClick={() => setOpen(true)} disabled={!data.companionAvailable}><Trash2 size={16} /> Request Deletion</button></div>
      <Status tone="danger">{message}</Status>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="ws-dialog-overlay" />
          <AlertDialog.Content className="ws-dialog-content">
            <div className="ws-dialog-head"><div><AlertDialog.Title>Request deletion for {name}?</AlertDialog.Title><AlertDialog.Description>This creates a pending, retention-aware request. No immediate destructive operation is performed.</AlertDialog.Description></div><AlertDialog.Cancel className="ws-icon-btn"><X size={17} /></AlertDialog.Cancel></div>
            <div className="ws-privacy-card danger"><AlertTriangle size={18} /><div><strong>Owner confirmation required</strong><p>Download an export, then type the Workspace name exactly.</p></div></div>
            <div className="ws-form">
              <label><span>Workspace name</span><input value={form.confirmation} onChange={(event) => setForm((current) => ({ ...current, confirmation: event.target.value }))} /></label>
              <label><span>Reason, optional</span><textarea rows="4" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} /></label>
              <label className="ws-check"><input type="checkbox" checked={form.exportConfirmed} onChange={(event) => setForm((current) => ({ ...current, exportConfirmed: event.target.checked }))} /><span>I downloaded or intentionally confirmed the final Workspace export.</span></label>
            </div>
            <Status tone="danger">{message}</Status>
            <div className="ws-dialog-actions"><AlertDialog.Cancel className="ws-btn secondary">Cancel</AlertDialog.Cancel><button type="button" className="ws-btn danger" onClick={() => void requestDeletion()} disabled={busy === "delete"}>{busy === "delete" ? "Submitting…" : "Submit Deletion Request"}</button></div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </article>
  );
}
