import * as Progress from "@radix-ui/react-progress";
import {
  Archive, Database, File, FileImage, FolderOpen,
  Mail, ShieldCheck, UserPlus, Users,
} from "lucide-react";
import { Empty, Pill } from "./WorkspacePrimitives";
import {
  formatBytes, formatDateTime, normalizeNumber, workspaceIconForType,
} from "./workspaceRoutes";

export function Overview({ data, navigate }) {
  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head">
          <div><h2>Continue Your Work</h2><p>Current campaigns, offers, and approvals inside this workspace.</p></div>
          <button className="ws-btn secondary compact" onClick={() => navigate("/workspace/active-work")}>View All Work</button>
        </div>
        {data.workItems.length ? (
          <div className="ws-project-grid">
            {data.workItems.slice(0, 4).map((item) => {
              const Icon = workspaceIconForType(item.type);
              return (
                <button key={item.id} className="ws-project-card" onClick={() => navigate("/workspace/active-work")}>
                  <Icon size={19} />
                  <strong>{item.title}</strong>
                  <p>{item.dueAt ? `Due ${formatDateTime(item.dueAt)}` : item.owner}</p>
                  <Pill tone={item.status === "review" ? "gold" : item.status === "approved" ? "green" : "default"}>{item.status.replace("-", " ")}</Pill>
                </button>
              );
            })}
          </div>
        ) : <Empty title="No active work yet" description="Campaigns and offers saved to this workspace will appear here automatically." />}
      </article>

      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Workspace Boundary</h2><p>Everything shown here is scoped to the active tenant.</p></div><Pill tone="green">Private</Pill></div>
        <div className="ws-boundary-list">
          <div><ShieldCheck size={18} /><span><strong>Tenant content</strong><small>Core Truth House does not automatically view tenant content.</small></span></div>
          <div><Users size={18} /><span><strong>Member access</strong><small>Only invited members can enter this workspace.</small></span></div>
          <div><Archive size={18} /><span><strong>Separate audit</strong><small>Platform administration uses a different audit trail.</small></span></div>
        </div>
      </article>

      <button className="ws-tile" onClick={() => navigate("/workspace/library")}>
        <FolderOpen size={20} /><strong>Workspace Library</strong>
        <p>{data.documents.length + data.assets.length} workspace-scoped files and assets.</p><span>Open Library</span>
      </button>
      <button className="ws-tile" onClick={() => navigate("/workspace/members")}>
        <Users size={20} /><strong>Members & Client Workspaces</strong>
        <p>Manage invited people and isolated Estate client spaces.</p><span>{data.members.length} active members</span>
      </button>
    </div>
  );
}

export function MembersView({ data, navigate }) {
  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head">
          <div><h2>Workspace Members</h2><p>{data.members.length} active members and {data.invites.length} pending invitations.</p></div>
          <button className="ws-btn primary" onClick={() => navigate("/workspace/controls/members")}><UserPlus size={16} /> Manage Access</button>
        </div>
        {data.members.length ? <div className="ws-member-grid">{data.members.map((member) => (
          <article key={member.id} className="ws-member-card">
            <span className="ws-avatar">{member.name.charAt(0).toUpperCase()}</span>
            <div><strong>{member.name}</strong><p>{member.email || member.role}</p><small>{member.lastActive ? `Last active ${formatDateTime(member.lastActive)}` : "Activity not recorded"}</small></div>
            <Pill tone={member.status === "active" ? "green" : "gold"}>{member.role}</Pill>
          </article>
        ))}</div> : <Empty icon={Users} title="No member records returned" description="Invite and access tools remain available from Workspace Controls." />}
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Pending Invitations</h2><p>Invitations remain scoped to this workspace.</p></div><Pill>{data.invites.length}</Pill></div>
        {data.invites.length ? data.invites.map((invite) => (
          <div key={invite.id || invite.invite_id || invite.email} className="ws-row"><Mail size={17} /><span><strong>{invite.email || "Pending member"}</strong><small>{invite.role || "member"}</small></span><Pill tone="gold">Pending</Pill></div>
        )) : <Empty icon={Mail} title="No pending invitations" description="New invitations will appear here until accepted or withdrawn." />}
      </article>
    </div>
  );
}

export function StorageView({ data, navigate }) {
  const percent = data.storageLimit ? Math.min(100, Math.round((data.storageUsed / data.storageLimit) * 100)) : 0;
  const media = data.assets.reduce((total, item) => total + normalizeNumber(item?.size_bytes || item?.file_size), 0);
  const docs = normalizeNumber(data.tenantSummary?.collections?.documents?.total_size_bytes) || data.documents.reduce((total, item) => total + item.size, 0);
  return (
    <div className="ws-grid two">
      <article className="ws-panel">
        <div className="ws-panel-head"><div><h2>Storage Usage</h2><p>{formatBytes(data.storageUsed)} known usage{data.storageLimit ? ` of ${formatBytes(data.storageLimit)}` : ""}.</p></div><Pill tone={percent > 80 ? "red" : percent > 60 ? "gold" : "green"}>{data.storageLimit ? `${percent}% used` : "Known files"}</Pill></div>
        <Progress.Root className="ws-progress" value={percent}><Progress.Indicator className="ws-progress-indicator" style={{ transform: `translateX(-${100 - percent}%)` }} /></Progress.Root>
        <div className="ws-stat-grid"><div><FileImage size={18} /><strong>{formatBytes(media)}</strong><span>Known media size</span></div><div><File size={18} /><strong>{formatBytes(docs)}</strong><span>Documents and reports</span></div><div><Database size={18} /><strong>{data.documents.length + data.assets.length}</strong><span>Total stored items</span></div></div>
      </article>
      <article className="ws-panel soft">
        <div className="ws-panel-head"><div><h2>Plan Limits</h2><p>Usage and limits come from the active subscription.</p></div><button className="ws-btn secondary compact" onClick={() => navigate("/workspace/controls/plan-billing")}>Plan & Billing</button></div>
        <div className="ws-detail-list"><div><span>Current plan</span><strong>{data.billing?.plan_name || data.billing?.plan || data.activeWorkspace?.plan || "Foundation"}</strong></div><div><span>Known storage used</span><strong>{formatBytes(data.storageUsed)}</strong></div><div><span>Storage allowance</span><strong>{data.storageLimit ? formatBytes(data.storageLimit) : "Not returned by billing"}</strong></div><div><span>Workspace isolation</span><strong>Enabled</strong></div></div>
      </article>
    </div>
  );
}
