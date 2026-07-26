import { RefreshCw } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import WorkspaceShell from "./WorkspaceShell";
import { useWorkspaceSuiteData } from "./workspaceData";
import {
  ClientWorkspacesControl, GeneralControl, MembersControl, RolesControl,
} from "./WorkspaceAccessControls";
import {
  IntegrationsControl, PreferencesControl, PrivacyControl,
} from "./WorkspaceSettingsControls";
import {
  ActivityLogControl, BillingControl, DangerControl,
} from "./WorkspacePlanControls";

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
    "/workspace/controls/data-privacy": <PrivacyControl data={data} />,
    "/workspace/controls/plan-billing": <BillingControl data={data} />,
    "/workspace/controls/activity-log": <ActivityLogControl data={data} />,
    "/workspace/controls/danger-zone": <DangerControl data={data} />,
  };

  return (
    <WorkspaceShell summary={data.summary} loading={data.loading} error={data.error} onRefresh={data.reload}>
      {data.loading && !data.detail ? (
        <div className="ws-loading"><RefreshCw className="ws-spin" size={20} /> Loading workspace controls…</div>
      ) : views[pathname] || (pathname === "/workspace/controls/general" ? <GeneralControl data={data} /> : <Navigate to="/workspace/controls/general" replace />)}
    </WorkspaceShell>
  );
}
