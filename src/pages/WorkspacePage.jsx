import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { usePlan } from "../context/PlanContext";
import { normalizePlan, PLAN_INFO } from "../config/planAccess";
import { PLAN_ORDER } from "../config/routeConfig";
import WorkspaceOverviewPage from "./workspace/WorkspacePage";
import WorkspaceControlsPage from "./workspace/WorkspaceControlsPage";
import { requiredPlanForWorkspacePath } from "./workspace/workspaceRoutes";
import "../styles/workspace-suite.css";

function WorkspaceAccessGate({ requiredPlan }) {
  const navigate = useNavigate();
  const planState = usePlan();
  const currentPlan = normalizePlan(planState?.plan);
  const currentOrder = PLAN_ORDER.indexOf(currentPlan);
  const requiredOrder = PLAN_ORDER.indexOf(requiredPlan);
  const canAccess = currentOrder >= requiredOrder;

  if (canAccess) return null;

  const target = PLAN_INFO[requiredPlan] || PLAN_INFO.foundation;
  return (
    <AuthShell activeNav="workspace">
      <main className="ws-page">
        <article className="ws-panel ws-gate-card">
          <div className="ws-eyebrow">Workspace Access</div>
          <h1>{target.name} Required</h1>
          <p>
            This workspace section is protected by your plan. Your tenant data and
            current workspace remain unchanged.
          </p>
          <div className="ws-dialog-actions">
            <button type="button" className="ws-btn secondary" onClick={() => navigate("/command-center-next")}>
              Return to Command Center
            </button>
            <button type="button" className="ws-btn primary" onClick={() => navigate("/billing")}>
              Review Plan &amp; Billing
            </button>
          </div>
        </article>
      </main>
    </AuthShell>
  );
}

export default function WorkspaceRoute() {
  const location = useLocation();
  const planState = usePlan();
  const requiredPlan = requiredPlanForWorkspacePath(location.pathname);
  const currentPlan = normalizePlan(planState?.plan);
  const canAccess =
    PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);

  if (!canAccess) {
    return <WorkspaceAccessGate requiredPlan={requiredPlan} />;
  }

  return location.pathname.startsWith("/workspace/controls/") ? (
    <WorkspaceControlsPage />
  ) : (
    <WorkspaceOverviewPage />
  );
}
