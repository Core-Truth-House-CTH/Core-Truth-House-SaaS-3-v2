import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, PlayCircle, Trash2 } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import { PageHeader, StatCard, StatusBadge } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState, PermissionNotice } from "../components/States";
import { formatDate } from "../components/Cards";
import { useAsyncResource, useMutation } from "../hooks/useAsyncResource";
import {
  deleteAutomation,
  getAutomation,
  listAutomationRuns,
  testAutomation,
  updateAutomation,
} from "../api/contentStudioApi";
import { useContentStudio } from "../context/ContentStudioProvider";
import { canDeleteResource, deleteDenialReason } from "../utilities/permissions";

/** Automation detail: status changes, test run, run history. */

function AutomationDetailInner() {
  const { automationId } = useParams();
  const navigate = useNavigate();
  const { viewer, canCreate } = useContentStudio();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const detail = useAsyncResource(() => getAutomation(automationId), [automationId]);
  const runs = useAsyncResource(() => listAutomationRuns(automationId, { limit: 25 }), [automationId]);

  const automation = detail.data;
  const runItems = runs.data?.runs || [];

  const removal = useMutation(() => deleteAutomation(automationId));
  const statusChange = useMutation((status) => updateAutomation(automationId, { status }));
  const testRun = useMutation(() => testAutomation(automationId));

  const canDelete = automation ? canDeleteResource(viewer, automation) : false;
  const denialReason = automation ? deleteDenialReason(viewer, automation) : null;

  const handleDelete = async () => {
    const result = await removal.mutate();
    if (result.ok) {
      setConfirmOpen(false);
      navigate("/content-studio/automations", { replace: true });
    }
  };

  const handleStatus = async (status) => {
    setNotice(null);
    const result = await statusChange.mutate(status);
    if (result.ok) {
      detail.reload();
      setNotice({ tone: "success", message: `Automation is now ${status}.` });
    }
  };

  const handleTest = async () => {
    setNotice(null);
    const result = await testRun.mutate();
    if (result.ok) {
      detail.reload();
      runs.reload();
      setNotice({
        tone: "success",
        message: `Test run completed — ${result.data?.run?.steps_evaluated ?? 0} steps evaluated.`,
      });
    }
  };

  if (detail.loading) {
    return <div className="cs-page"><LoadingState label="Loading automation" /></div>;
  }

  if (detail.error) {
    return (
      <div className="cs-page">
        <ErrorState error={detail.error} onRetry={detail.reload} />
        <Link to="/content-studio/automations" className="cs-btn cs-btn-secondary" style={{ marginTop: 16 }}>
          Back to automations
        </Link>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="cs-page">
        <EmptyState title="Automation not available" description="This automation is not available in your workspace." />
      </div>
    );
  }

  const runCount = Number(automation.run_count || 0);
  const successRate =
    runCount > 0 ? `${Math.round((Number(automation.success_count || 0) / runCount) * 100)}%` : null;

  return (
    <div className="cs-page">
      <Link to="/content-studio/automations" className="cs-btn cs-btn-ghost" style={{ marginBottom: 12 }}>
        <ChevronLeft size={14} aria-hidden="true" />
        All automations
      </Link>

      <PageHeader
        title={automation.name}
        subtitle={automation.description || "No description."}
        actions={
          <>
            <StatusBadge status={automation.status} />
            {canCreate ? (
              <>
                <button
                  type="button"
                  className="cs-btn cs-btn-secondary"
                  onClick={handleTest}
                  disabled={testRun.busy}
                >
                  <PlayCircle size={14} aria-hidden="true" />
                  {testRun.busy ? "Running…" : "Test run"}
                </button>
                {automation.status !== "active" ? (
                  <button
                    type="button"
                    className="cs-btn cs-btn-primary"
                    onClick={() => handleStatus("active")}
                    disabled={statusChange.busy}
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cs-btn cs-btn-secondary"
                    onClick={() => handleStatus("paused")}
                    disabled={statusChange.busy}
                  >
                    Pause
                  </button>
                )}
              </>
            ) : null}

            {/* Deletion is never entitlement-gated — only creator/admin gated. */}
            {canDelete ? (
              <button type="button" className="cs-btn cs-btn-secondary" onClick={() => setConfirmOpen(true)}>
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            ) : null}
          </>
        }
      />

      {denialReason ? <PermissionNotice reason={denialReason} /> : null}

      {notice ? (
        <p role="status" style={{ fontSize: 13, color: "var(--cs-status-active)", marginBottom: 16 }}>
          {notice.message}
        </p>
      ) : null}

      {statusChange.error ? <ErrorState error={statusChange.error} compact /> : null}
      {testRun.error ? <ErrorState error={testRun.error} compact /> : null}

      <div className="cs-grid cs-grid-4" style={{ margin: "18px 0 26px" }}>
        <StatCard label="Trigger" value={automation.trigger?.type || "—"} />
        <StatCard label="Steps" value={(automation.steps || []).length} />
        <StatCard label="Runs" value={runCount} />
        <StatCard label="Success Rate" value={successRate} unavailable={!successRate} />
      </div>

      <section aria-labelledby="cs-steps-heading" style={{ marginBottom: 28 }}>
        <h2 id="cs-steps-heading" className="cs-h2" style={{ fontSize: 19, marginBottom: 12 }}>
          Steps
        </h2>
        {(automation.steps || []).length === 0 ? (
          <EmptyState title="No steps yet" description="This automation has no steps configured." />
        ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {automation.steps.map((step, index) => (
              <li key={step.id || index} className="cs-card" style={{ padding: "12px 16px", display: "flex", gap: 12 }}>
                <span className="cs-badge">{index + 1}</span>
                <span style={{ fontSize: 13, color: "var(--cs-ink)" }}>{step.type}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="cs-runs-heading">
        <h2 id="cs-runs-heading" className="cs-h2" style={{ fontSize: 19, marginBottom: 12 }}>
          Run history
        </h2>
        {runs.loading ? (
          <LoadingState label="Loading runs" rows={2} />
        ) : runs.error ? (
          <ErrorState error={runs.error} onRetry={runs.reload} compact />
        ) : runItems.length === 0 ? (
          <EmptyState title="No runs yet" description="Use Test run to check this automation end to end." />
        ) : (
          <div className="cs-table-wrap">
            <table className="cs-table cs-table-stack">
              <caption className="sr-only">Automation run history</caption>
              <thead>
                <tr>
                  <th scope="col">Run</th>
                  <th scope="col">Status</th>
                  <th scope="col">Steps evaluated</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {runItems.map((run) => (
                  <tr key={run.id}>
                    <td data-label="Run">{run.is_test ? "Test run" : "Scheduled run"}</td>
                    <td data-label="Status"><StatusBadge status={run.status} /></td>
                    <td data-label="Steps evaluated">{run.steps_evaluated ?? "—"}</td>
                    <td data-label="When">{formatDate(run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        busy={removal.busy}
        error={removal.error}
        title={`Delete “${automation.name}”?`}
        description="This removes the automation and its run history from your workspace."
      />
    </div>
  );
}

export default function AutomationDetailPage() {
  return (
    <ContentStudioShell title="Automation detail">
      <AutomationDetailInner />
    </ContentStudioShell>
  );
}
