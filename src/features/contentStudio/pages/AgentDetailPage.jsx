import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Trash2 } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import { FilterTabs, PageHeader, StatusBadge } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState, PermissionNotice } from "../components/States";
import { useAsyncResource, useMutation } from "../hooks/useAsyncResource";
import { deleteCustomAgent, listCustomAgents, listOfficialAgents } from "../api/contentStudioApi";
import { useContentStudio } from "../context/ContentStudioProvider";
import { canDeleteResource, deleteDenialReason } from "../utilities/permissions";

/** Approved screen 4 — Agent Detail. */

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "instructions", label: "Instructions" },
  { value: "knowledge", label: "Knowledge" },
  { value: "outputs", label: "Outputs" },
  { value: "runs", label: "Recent Runs" },
];

function AgentDetailInner() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { viewer } = useContentStudio();
  const [tab, setTab] = useState("overview");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const official = useAsyncResource(() => listOfficialAgents(), []);
  const custom = useAsyncResource(() => listCustomAgents(), []);

  const agent = useMemo(() => {
    const all = [...(official.data?.agents || []), ...(custom.data?.agents || [])];
    return all.find((item) => String(item.id) === String(agentId)) || null;
  }, [official.data, custom.data, agentId]);

  const isOfficial = agent?.managed_by === "core_truth_house";
  const canDelete = !isOfficial && canDeleteResource(viewer, agent || {});
  const denialReason = !isOfficial && agent ? deleteDenialReason(viewer, agent) : null;

  const removal = useMutation(() => deleteCustomAgent(agentId));

  const handleDelete = async () => {
    const result = await removal.mutate();
    if (result.ok) {
      setConfirmOpen(false);
      navigate("/content-studio/agents", { replace: true });
    }
  };

  const loading = official.loading || custom.loading;
  const error = official.error || custom.error;

  if (loading) {
    return (
      <div className="cs-page">
        <LoadingState label="Loading agent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cs-page">
        <ErrorState error={error} onRetry={() => { official.reload(); custom.reload(); }} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="cs-page">
        <EmptyState
          title="Agent not available"
          description="This agent is not available in your workspace."
          action={
            <Link to="/content-studio/agents" className="cs-btn cs-btn-primary">
              Back to agents
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="cs-page">
      <Link to="/content-studio/agents" className="cs-btn cs-btn-ghost" style={{ marginBottom: 12 }}>
        <ChevronLeft size={14} aria-hidden="true" />
        All agents
      </Link>

      <PageHeader
        title={agent.name}
        subtitle={agent.description}
        eyebrow={isOfficial ? "Official agent" : "Custom agent"}
        actions={
          <>
            <StatusBadge status={agent.status || "active"} />
            {canDelete ? (
              <button type="button" className="cs-btn cs-btn-secondary" onClick={() => setConfirmOpen(true)}>
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            ) : null}
            <button type="button" className="cs-btn cs-btn-primary">
              Start Session
            </button>
          </>
        }
      />

      {denialReason ? <PermissionNotice reason={denialReason} /> : null}

      <FilterTabs tabs={TABS} value={tab} onChange={setTab} label="Agent sections" />

      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)?.label}>
        {tab === "overview" ? (
          <div className="cs-grid cs-grid-3">
            <section className="cs-card cs-card-pad">
              <h2 className="cs-h3" style={{ marginBottom: 10 }}>About this agent</h2>
              <p style={{ fontSize: 13, color: "var(--cs-ruby)", lineHeight: 1.65, margin: 0 }}>
                {agent.description || "No description provided."}
              </p>
              {agent.category ? (
                <p style={{ marginTop: 14 }}>
                  <span className="cs-badge cs-badge-category">{agent.category}</span>
                </p>
              ) : null}
            </section>

            <section className="cs-card cs-card-pad">
              <h2 className="cs-h3" style={{ marginBottom: 10 }}>Outputs</h2>
              {(agent.output_types || []).length ? (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--cs-ruby)", lineHeight: 1.8 }}>
                  {agent.output_types.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: "var(--cs-tuscany)", margin: 0 }}>
                  No output types configured.
                </p>
              )}
            </section>

            <section className="cs-card cs-card-pad">
              <h2 className="cs-h3" style={{ marginBottom: 10 }}>Tools</h2>
              {(agent.tools || []).length ? (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--cs-ruby)", lineHeight: 1.8 }}>
                  {agent.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: "var(--cs-tuscany)", margin: 0 }}>No tools configured.</p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "instructions" ? (
          <section className="cs-card cs-card-pad">
            <h2 className="cs-h3" style={{ marginBottom: 10 }}>Instructions</h2>
            <p style={{ fontSize: 13, color: "var(--cs-ruby)", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
              {agent.instructions || "This agent has no custom instructions."}
            </p>
          </section>
        ) : null}

        {tab === "knowledge" ? (
          <section className="cs-card cs-card-pad">
            <h2 className="cs-h3" style={{ marginBottom: 10 }}>Knowledge sources</h2>
            {(agent.knowledge_source_ids || []).length ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "var(--cs-ruby)", lineHeight: 1.8 }}>
                {agent.knowledge_source_ids.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 13, color: "var(--cs-tuscany)", margin: 0 }}>
                No knowledge sources linked.
              </p>
            )}
          </section>
        ) : null}

        {/* The backend exposes no per-agent output or run history endpoint, so
            these tabs state that plainly rather than showing invented rows. */}
        {tab === "outputs" || tab === "runs" ? (
          <EmptyState
            title={tab === "outputs" ? "No stored outputs" : "No run history"}
            description="Core Truth House does not record this for agents yet. It will appear here once the backend exposes it."
          />
        ) : null}
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        busy={removal.busy}
        error={removal.error}
        title={`Delete “${agent.name}”?`}
        description="This removes the agent from your workspace. This cannot be undone."
      />
    </div>
  );
}

export default function AgentDetailPage() {
  return (
    <ContentStudioShell title="Agent detail">
      <AgentDetailInner />
    </ContentStudioShell>
  );
}
