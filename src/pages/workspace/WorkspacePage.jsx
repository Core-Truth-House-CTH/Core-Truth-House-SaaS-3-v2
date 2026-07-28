import { CircleDot } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import WorkspaceShell from "./WorkspaceShell";
import WorkspaceLibraryView from "./WorkspaceLibraryView";
import WorkspaceActiveWorkView from "./WorkspaceActiveWorkView";
import WorkspaceDecisionsView from "./WorkspaceDecisionsView";
import WorkspaceActivityView from "./WorkspaceActivityView";
import {
  MembersView,
  Overview,
  StorageView,
} from "./WorkspaceOverviewViews";
import { useWorkspaceSuiteData } from "./workspaceData";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useWorkspaceSuiteData();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const legacyView = new URLSearchParams(location.search).get("view");
  const legacyDestination = legacyView === "work"
    ? "/workspace/active-work"
    : legacyView === "decisions"
      ? "/workspace/decisions"
      : null;

  if (pathname === "/workspace" && legacyDestination) {
    return <Navigate to={legacyDestination} replace />;
  }

  const views = {
    "/workspace/library": <WorkspaceLibraryView data={data} />,
    "/workspace/active-work": <WorkspaceActiveWorkView data={data} />,
    "/workspace/decisions": <WorkspaceDecisionsView data={data} navigate={navigate} />,
    "/workspace/members": <MembersView data={data} navigate={navigate} />,
    "/workspace/activity": <WorkspaceActivityView data={data} />,
    "/workspace/storage": <StorageView data={data} navigate={navigate} />,
  };

  const shellError = [data.error, data.companionError].filter(Boolean).join(" · ");

  return (
    <WorkspaceShell summary={data.summary} loading={data.loading} error={shellError} onRefresh={data.reload}>
      {data.loading && !data.detail ? (
        <div className="ws-loading"><CircleDot className="ws-pulse" size={20} /> Loading workspace…</div>
      ) : views[pathname] || (pathname === "/workspace" ? <Overview data={data} navigate={navigate} /> : <Navigate to="/workspace" replace />)}
    </WorkspaceShell>
  );
}

export { useWorkspaceSuiteData } from "./workspaceData";
