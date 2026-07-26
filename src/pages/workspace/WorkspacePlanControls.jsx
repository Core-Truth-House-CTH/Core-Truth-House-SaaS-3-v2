import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  AlertTriangle, Bell, CircleDollarSign, Download, Link2, Trash2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "./workspaceRoutes";
import { Pill, Status, messageFor } from "./WorkspaceControlPrimitives";
import { disconnectSupportedIntegrations, downloadTenantExport } from "./workspaceApi";

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
  const summary = data.activitySummary || {};
  const entries = [
    ["AI credits used", summary.total_credits_used ?? 0],
    ["Content generated", summary.content_generated ?? 0],
    ["Members represented", Object.keys(summary.credits_by_member || {}).length],
  ];

  return (
    <article className="ws-panel">
      <div className="ws-panel-head"><div><h2>Detailed Activity</h2><p>The live team service currently exposes a tenant-scoped activity summary, not a member-by-member event stream.</p></div><Pill tone="green">Verified source</Pill></div>
      <div className="ws-stat-grid">{entries.map(([label, value]) => <div key={label}><Bell size={18} /><strong>{value}</strong><span>{label}</span></div>)}</div>
      <div className="ws-privacy-card"><AlertTriangle size={18} /><div><strong>No fabricated audit rows</strong><p>A chronological event table will activate only after the backend exposes an enforceable tenant audit endpoint.</p></div></div>
    </article>
  );
}

export function DangerControl({ data }) {
  const name = data.activeWorkspace?.name || "workspace";
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const downloadArchive = async () => {
    setBusy("archive");
    try {
      await downloadTenantExport(name);
      setMessage("Tenant-scoped archive downloaded.");
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    try {
      const result = await disconnectSupportedIntegrations();
      setMessage(`${result.disconnected} supported AI integration${result.disconnected === 1 ? "" : "s"} disconnected${result.failed ? `; ${result.failed} could not be changed` : ""}.`);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy("");
    }
  };

  return (
    <article className="ws-panel danger-panel">
      <div className="ws-panel-head"><div><h2>Danger Zone</h2><p>Owner-only actions are irreversible or disruptive.</p></div><Pill tone="red">Owner only</Pill></div>
      <div className="ws-danger-row"><div><strong>Download final archive</strong><p>Download the supported tenant collections before a major change.</p></div><button className="ws-btn secondary" onClick={() => void downloadArchive()} disabled={Boolean(busy)}><Download size={16} /> {busy === "archive" ? "Preparing…" : "Download Archive"}</button></div>
      <div className="ws-danger-row"><div><strong>Disconnect supported AI integrations</strong><p>Disconnect OpenAI, fal.ai, and Higgsfield workspace credentials.</p></div><button className="ws-btn secondary" onClick={() => void disconnect()} disabled={Boolean(busy)}><Link2 size={16} /> {busy === "disconnect" ? "Disconnecting…" : "Disconnect AI Providers"}</button></div>
      <div className="ws-danger-row critical"><div><strong>Delete workspace</strong><p>Deletion remains blocked until a retention-aware owner endpoint is deployed.</p></div><button className="ws-btn danger" onClick={() => setOpen(true)}><Trash2 size={16} /> Review Deletion Requirement</button></div>
      <Status tone="danger">{message}</Status>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="ws-dialog-overlay" />
          <AlertDialog.Content className="ws-dialog-content">
            <div className="ws-dialog-head"><div><AlertDialog.Title>Workspace deletion is not available</AlertDialog.Title><AlertDialog.Description>The current backend has no tenant-owner deletion endpoint with export, retention, ownership, and audit safeguards.</AlertDialog.Description></div><AlertDialog.Cancel className="ws-icon-btn"><X size={17} /></AlertDialog.Cancel></div>
            <div className="ws-privacy-card danger"><AlertTriangle size={18} /><div><strong>No unsafe request will be sent</strong><p>{name} remains unchanged. This control will activate only after the complete deletion contract is deployed.</p></div></div>
            <div className="ws-dialog-actions"><AlertDialog.Cancel className="ws-btn primary">Close</AlertDialog.Cancel></div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </article>
  );
}
