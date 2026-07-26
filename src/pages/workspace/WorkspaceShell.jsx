import * as ScrollArea from "@radix-ui/react-scroll-area";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../../components/AuthShell";
import { useWorkspace } from "../../context/WorkspaceContext";
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

function SummaryCard({ label, value, detail, onClick }) {
  return (
    <button type="button" className="ws-summary-card" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </button>
  );
}

export default function WorkspaceShell({
  children,
  summary,
  loading,
  error,
  onRefresh,
  actions,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = useWorkspace();
  const meta = routeMeta(location.pathname);
  const controls = routeIsControl(location.pathname);
  const currentWorkspace = workspace.activeWorkspace;

  const workspaceName = currentWorkspace?.name || "Active Workspace";
  const plan = String(currentWorkspace?.plan || "foundation");
  const memberCount = summary?.memberCount ?? 0;
  const workCount = summary?.workCount ?? 0;
  const storageLabel = summary?.storageLabel || "0 B";

  return (
    <AuthShell activeNav="workspace">
      <main className="ws-page">
        <section className="ws-hero">
          <div className="ws-hero-copy">
            <div className="ws-eyebrow">{meta.eyebrow}</div>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
            <div className="ws-privacy-note">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                Tenant content is isolated to <strong>{workspaceName}</strong>. Support access requires owner consent.
              </span>
            </div>
          </div>

          <div className="ws-hero-actions">
            {controls ? (
              <button type="button" className="ws-btn secondary" onClick={() => navigate("/workspace")}>
                <ArrowLeft size={16} aria-hidden="true" />
                Workspace
              </button>
            ) : null}
            <button
              type="button"
              className="ws-btn secondary"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "ws-spin" : ""} aria-hidden="true" />
              Refresh
            </button>
            {!controls ? (
              <button
                type="button"
                className="ws-btn primary"
                onClick={() => navigate("/workspace/controls/general")}
              >
                <Settings size={16} aria-hidden="true" />
                Workspace Controls
              </button>
            ) : null}
            {actions}
          </div>
        </section>

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

        <section className="ws-summary-grid" aria-label="Workspace summary">
          <SummaryCard
            label="Current Workspace"
            value={workspaceName}
            detail={`${plan.charAt(0).toUpperCase()}${plan.slice(1)} · Private tenant`}
            onClick={() => navigate("/workspace")}
          />
          <SummaryCard
            label="Active Members"
            value={memberCount}
            detail={summary?.pendingInvites ? `${summary.pendingInvites} pending invitation${summary.pendingInvites === 1 ? "" : "s"}` : "No pending invitations"}
            onClick={() => navigate("/workspace/members")}
          />
          <SummaryCard
            label="Active Work"
            value={workCount}
            detail={summary?.reviewCount ? `${summary.reviewCount} awaiting review` : "No approvals waiting"}
            onClick={() => navigate("/workspace/active-work")}
          />
          <SummaryCard
            label="Storage"
            value={storageLabel}
            detail={summary?.storageLimitLabel ? `of ${summary.storageLimitLabel}` : "Workspace-scoped usage"}
            onClick={() => navigate("/workspace/storage")}
          />
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
