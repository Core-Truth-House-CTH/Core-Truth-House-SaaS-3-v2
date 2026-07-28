import {
  BookOpen,
  Building2,
  CheckCircle2,
  Crown,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import WorkspaceShell, { SummaryCard } from "./WorkspaceShell";
import WorkspacePrivacyControl from "./WorkspacePrivacyControl";
import WorkspaceGeneralControls, { useGeneralControlsForms } from "./WorkspaceGeneralControls";
import { useWorkspaceSuiteData } from "./workspaceData";
import { planLabel } from "../../components/AuthShell";
import {
  ClientWorkspacesControl, MembersControl, RolesControl,
} from "./WorkspaceAccessControls";
import {
  IntegrationsControl, PreferencesControl,
} from "./WorkspaceSettingsControls";
import {
  ActivityLogControl, BillingControl, DangerControl,
} from "./WorkspacePlanControls";

/*
 * System status is derived, never assumed. "All Systems Operational" is only
 * reachable when the load finished with no core failure and no companion
 * failure; anything else reports the honest partial or degraded state.
 */
function systemStatus(data) {
  if (data.loading) {
    return { value: "Checking…", detail: "Reading workspace services", dot: "muted" };
  }
  if (data.error) {
    return {
      value: "Degraded Service",
      detail: "Some workspace data could not be loaded",
      dot: "red",
    };
  }
  if (data.companionError || !data.companionAvailable) {
    return {
      value: "Partial Service",
      detail: data.companionAvailable
        ? "Some Workspace controls are unavailable"
        : "Workspace controls service not reachable",
      dot: "amber",
    };
  }
  return {
    value: "All Systems Operational",
    detail: "All required workspace services responded",
    dot: "green",
  };
}

/* The saved line only claims a save once the settings service confirmed one. */
function savedStatusFor(forms) {
  if (forms.dirty) {
    return <span className="ws-saved pending">Unsaved changes</span>;
  }
  if (forms.tone === "danger") {
    return <span className="ws-saved failed">Changes not saved</span>;
  }
  return (
    <span className="ws-saved">
      <CheckCircle2 size={14} aria-hidden="true" />
      {forms.savedAt ? "All changes saved" : "No unsaved changes"}
    </span>
  );
}

function GeneralControlsLanding({ data }) {
  const navigate = useNavigate();
  const forms = useGeneralControlsForms(data);
  const status = systemStatus(data);

  const workspaceName = data.activeWorkspace?.name || "Active Workspace";
  const rawPlan = data.activeWorkspace?.plan;
  const planName = rawPlan ? planLabel(rawPlan) : "Plan unavailable";
  const renewal = data.billing?.renews_at || data.billing?.current_period_end;
  const planDetail = renewal
    ? `Renews ${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(renewal))}`
    : "Renewal date unavailable";

  const summaryCards = (
    <>
      <SummaryCard
        icon={Building2}
        label="Workspace"
        value={workspaceName}
        detail="Private tenant environment"
        actionLabel="View Workspace"
        onAction={() => navigate("/workspace")}
      />
      <SummaryCard
        icon={Crown}
        label="Plan"
        value={planName}
        detail={planDetail}
        actionLabel="Manage Plan"
        onAction={() => navigate("/workspace/controls/plan-billing")}
      />
      <SummaryCard
        icon={Users}
        label="Active Members"
        value={data.summary.memberCount}
        detail={
          data.summary.pendingInvites
            ? `${data.summary.pendingInvites} Pending Invitation${data.summary.pendingInvites === 1 ? "" : "s"}`
            : "No pending invitations"
        }
        actionLabel="Manage Members"
        onAction={() => navigate("/workspace/controls/members")}
      />
      <SummaryCard
        icon={ShieldCheck}
        label="System Status"
        value={status.value}
        detail={status.detail}
        dot={status.dot}
        actionLabel="View System Health"
        onAction={() => navigate("/workspace/activity")}
      />
    </>
  );

  const actions = (
    <>
      <button
        type="button"
        className="ws-btn secondary"
        onClick={() => navigate("/workspace/controls/activity-log")}
      >
        <BookOpen size={15} aria-hidden="true" />
        View Activity Log
      </button>
      <button
        type="button"
        className="ws-btn primary"
        onClick={() => void forms.save("all")}
        disabled={forms.saving || !forms.dirty}
      >
        {forms.saving ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  const savedStatus = savedStatusFor(forms);

  return (
    <WorkspaceShell
      variant="landing"
      summary={data.summary}
      loading={data.loading}
      error={[data.error, data.companionError].filter(Boolean).join(" · ")}
      actions={actions}
      status={savedStatus}
      summaryCards={summaryCards}
    >
      {data.loading && !data.detail ? (
        <div className="ws-loading">
          <RefreshCw className="ws-spin" size={20} /> Loading workspace controls…
        </div>
      ) : (
        <WorkspaceGeneralControls data={data} forms={forms} />
      )}
    </WorkspaceShell>
  );
}

export default function WorkspaceControlsPage() {
  const location = useLocation();
  const data = useWorkspaceSuiteData();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const views = {
    "/workspace/controls/members": <MembersControl data={data} />,
    "/workspace/controls/client-workspaces": <ClientWorkspacesControl data={data} />,
    "/workspace/controls/roles-permissions": <RolesControl data={data} />,
    "/workspace/controls/approvals": <PreferencesControl data={data} kind="approvals" />,
    "/workspace/controls/notifications": <PreferencesControl data={data} kind="notifications" />,
    "/workspace/controls/integrations": <IntegrationsControl data={data} />,
    "/workspace/controls/data-privacy": <WorkspacePrivacyControl data={data} />,
    "/workspace/controls/plan-billing": <BillingControl data={data} />,
    "/workspace/controls/activity-log": <ActivityLogControl data={data} />,
    "/workspace/controls/danger-zone": <DangerControl data={data} />,
  };
  const shellError = [data.error, data.companionError].filter(Boolean).join(" · ");

  if (pathname === "/workspace/controls/general") {
    return <GeneralControlsLanding data={data} />;
  }

  return (
    <WorkspaceShell summary={data.summary} loading={data.loading} error={shellError} onRefresh={data.reload}>
      {data.loading && !data.detail ? (
        <div className="ws-loading"><RefreshCw className="ws-spin" size={20} /> Loading workspace controls…</div>
      ) : views[pathname] || <Navigate to="/workspace/controls/general" replace />}
    </WorkspaceShell>
  );
}
