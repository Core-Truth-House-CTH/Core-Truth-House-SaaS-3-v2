import { CircleDot } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import WorkspaceShell from "./WorkspaceShell";
import WorkspaceLibraryView from "./WorkspaceLibraryView";
import WorkspaceActiveWorkView from "./WorkspaceActiveWorkView";
import { ActivityView, MembersView, Overview, StorageView } from "./WorkspaceOverviewViews";
import { useWorkspaceSuiteData } from "./workspaceData";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useWorkspaceSuiteData();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const views = {
    "/workspace/library": <WorkspaceLibraryView data={data} />,
    "/workspace/active-work": <WorkspaceActiveWorkView data={data} />,
    "/workspace/members": <MembersView data={data} navigate={navigate} />,
    "/workspace/activity": <ActivityView data={data} />,
    "/workspace/storage": <StorageView data={data} navigate={navigate} />,
  };

  return (
    <WorkspaceShell summary={data.summary} loading={data.loading} error={data.error} onRefresh={data.reload}>
      {data.loading && !data.detail ? (
        <div className="ws-loading"><CircleDot className="ws-pulse" size={20} /> Loading workspace…</div>
      ) : views[pathname] || (pathname === "/workspace" ? <Overview data={data} navigate={navigate} /> : <Navigate to="/workspace" replace />)}
    </WorkspaceShell>
  );
}

export { useWorkspaceSuiteData } from "./workspaceData";
