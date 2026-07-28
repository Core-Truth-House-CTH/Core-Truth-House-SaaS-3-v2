import * as ScrollArea from "@radix-ui/react-scroll-area";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FolderKanban,
  HardDrive,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import { useWorkspace } from "../../context/WorkspaceContext";
import WorkspaceTopControls from "./WorkspaceTopControls";
import {
  CONTROL_TABS,
  WORKSPACE_TABS,
  routeIsControl,
  routeMeta,
} from "./workspaceRoutes";
import "../../styles/workspace-suite.css";

function NavigationStrip({ items, pathname, onNavigate, ariaLabel }) {
  return (
    <ScrollArea.Root className="ws-scroll-root" type="auto">
      <ScrollArea.Viewport className="ws-scroll-viewport">
        <nav className="ws-subnav" aria-label={ariaLabel}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                className={`ws-subnav-link${active ? " active" : ""}${item.danger ? " danger" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(item.path)}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{item.label}</span>
                {item.estateOnly ? <small>Estate</small> : null}
              </button>
            );
          })}
        </nav>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="ws-scrollbar" orientation="horizontal">
        <ScrollArea.Thumb className="ws-scroll-thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

/*
 * The approved summary card: icon tile, uppercase label, serif value, a short
 * detail line, and one optional action. `dot` renders the reference status dot
 * and is only ever passed a resolved tone - never an assumed healthy one.
 */
export function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  actionLabel,
  onAction,
  dot,
  tone,
}) {
  return (
    <article className={`ws-summary-card${tone ? ` ${tone}` : ""}`}>
      {dot ? <span className={`ws-summary-dot ${dot}`} aria-hidden="true" /> : null}
      <div className="ws-summary-body">
        {Icon ? (
          <span className="ws-summary-icon" aria-hidden="true">
            <Icon size={20} />
          </span>
        ) : null}
        <div className="ws-summary-copy">
          <span className="ws-summary-label">{label}</span>
          <strong className="ws-summary-value">{value}</strong>
          {detail ? <small className="ws-summary-detail">{detail}</small> : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="ws-summary-action" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}

export default function WorkspaceShell({
  children,
  summary,
  loading,
  error,
  onRefresh,
  actions,
  status,
  summaryCards,
  variant = "inner",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = useWorkspace();
  const meta = routeMeta(location.pathname);
  const controls = routeIsControl(location.pathname);
  const landing = variant === "landing";
  const currentWorkspace = workspace.activeWorkspace;

  const workspaceName = currentWorkspace?.name || "Active Workspace";
  const memberCount = summary?.memberCount ?? 0;
  const workCount = summary?.workCount ?? 0;
  const storageLabel = summary?.storageLabel || "0 B";

  const backTo = controls && !landing ? "/workspace/controls/general" : "/workspace";
  const backLabel =
    controls && !landing ? "Back to Workspace Controls" : "Back to Workspace";
  const showBack = location.pathname !== "/workspace";

  return (
    <AuthShell activeNav="workspace" variant="workspace-light">
      <main className="ws-page">
        <header className="ws-head">
          <div className="ws-head-copy">
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </div>

          <div className="ws-head-controls">
            <WorkspaceTopControls />
            {actions || onRefresh ? (
              <div className="ws-head-actions">
                {actions}
                {onRefresh ? (
                  <button
                    type="button"
                    className="ws-btn secondary"
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      size={15}
                      className={loading ? "ws-spin" : ""}
                      aria-hidden="true"
                    />
                    Refresh
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="ws-head-status">
              <span className="ws-head-status-slot">{status}</span>
              {showBack ? (
                <button
                  type="button"
                  className="ws-backlink"
                  onClick={() => navigate(backTo)}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  {backLabel}
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {landing ? null : (
          <>
            <NavigationStrip
              items={WORKSPACE_TABS}
              pathname={location.pathname}
              onNavigate={navigate}
              ariaLabel="Workspace sections"
            />
            {controls ? (
              <NavigationStrip
                items={CONTROL_TABS}
                pathname={location.pathname}
                onNavigate={navigate}
                ariaLabel="Workspace controls"
              />
            ) : null}
          </>
        )}

        <section className="ws-summary-grid" aria-label="Workspace summary">
          {summaryCards || (
            <>
              <SummaryCard
                icon={Settings}
                label="Workspace"
                value={workspaceName}
                detail="Private tenant environment"
                actionLabel="View Workspace"
                onAction={() => navigate("/workspace")}
              />
              <SummaryCard
                icon={Users}
                label="Active Members"
                value={memberCount}
                detail={
                  summary?.pendingInvites
                    ? `${summary.pendingInvites} pending invitation${summary.pendingInvites === 1 ? "" : "s"}`
                    : "No pending invitations"
                }
                actionLabel="Manage Members"
                onAction={() => navigate("/workspace/members")}
              />
              <SummaryCard
                icon={FolderKanban}
                label="Active Work"
                value={workCount}
                detail={
                  summary?.reviewCount
                    ? `${summary.reviewCount} awaiting review`
                    : "No approvals waiting"
                }
                actionLabel="Open Active Work"
                onAction={() => navigate("/workspace/active-work")}
              />
              <SummaryCard
                icon={HardDrive}
                label="Storage"
                value={storageLabel}
                detail={
                  summary?.storageLimitLabel
                    ? `of ${summary.storageLimitLabel}`
                    : "Workspace-scoped usage"
                }
                actionLabel="Review Storage"
                onAction={() => navigate("/workspace/storage")}
              />
            </>
          )}
        </section>

        {error ? (
          <div className="ws-alert" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <div>
              <strong>Some workspace data could not be loaded.</strong>
              <p>{error}</p>
            </div>
          </div>
        ) : null}

        <section className="ws-content">{children}</section>
      </main>
    </AuthShell>
  );
}
