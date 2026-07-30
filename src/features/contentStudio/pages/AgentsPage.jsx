import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Plus } from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import { AgentCard } from "../components/Cards";
import { FilterTabs, PageHeader } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useAsyncResource } from "../hooks/useAsyncResource";
import { listCustomAgents, listOfficialAgents } from "../api/contentStudioApi";
import { useContentStudio } from "../context/ContentStudioProvider";

/** Approved screen 3 — Core Truth House Agents. */

const FILTERS = [
  { value: "all", label: "All Agents" },
  { value: "content", label: "Content Creation" },
  { value: "strategy", label: "Strategy" },
  { value: "conversion", label: "Conversion" },
  { value: "research", label: "Research" },
  { value: "visual", label: "Visual" },
  { value: "analysis", label: "Analysis" },
];

function AgentsPageInner() {
  const [filter, setFilter] = useState("all");
  const { canCreate } = useContentStudio();

  const official = useAsyncResource(() => listOfficialAgents(), []);
  const custom = useAsyncResource(() => listCustomAgents(), []);

  const officialAgents = official.data?.agents || [];
  const customAgents = custom.data?.agents || [];

  const visibleOfficial = useMemo(
    () => (filter === "all" ? officialAgents : officialAgents.filter((a) => a.category === filter)),
    [officialAgents, filter],
  );
  const visibleCustom = useMemo(
    () => (filter === "all" ? customAgents : customAgents.filter((a) => a.category === filter)),
    [customAgents, filter],
  );

  const featured = officialAgents.find((a) => a.id === "brand-guardian") || officialAgents[0] || null;

  return (
    <div className="cs-page">
      <PageHeader
        title="Core Truth House Agents"
        subtitle="Official agents built and trained by Core Truth House."
        actions={
          <>
            <a className="cs-btn cs-btn-secondary" href="/knowledge-base">
              How Agents Work
            </a>
            {/* Creation is entitlement-gated on the server; the link is always
                visible so the requirement is discoverable, and the target page
                explains the gate rather than failing silently. */}
            <Link to="/content-studio/agents/new" className="cs-btn cs-btn-primary">
              <Plus size={14} aria-hidden="true" />
              Create Custom Agent
            </Link>
          </>
        }
      />

      <FilterTabs tabs={FILTERS} value={filter} onChange={setFilter} label="Filter agents by category" />

      {official.loading ? (
        <LoadingState label="Loading official agents" />
      ) : official.error ? (
        <ErrorState error={official.error} onRetry={official.reload} />
      ) : (
        <>
          <section aria-labelledby="cs-official-heading" style={{ marginBottom: 34 }}>
            <h2 id="cs-official-heading" className="cs-h3" style={{ marginBottom: 12 }}>
              Official agents ({visibleOfficial.length})
            </h2>
            {visibleOfficial.length === 0 ? (
              <EmptyState title="No agents in this category" description="Try another filter." icon={Bot} />
            ) : (
              <div className="cs-grid cs-grid-4">
                {visibleOfficial.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    to={`/content-studio/agents/${encodeURIComponent(agent.id)}`}
                  />
                ))}
              </div>
            )}
          </section>

          {featured ? (
            <section
              aria-labelledby="cs-featured-heading"
              className="cs-card"
              style={{
                padding: 20,
                marginBottom: 34,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
                background: "var(--cs-blush)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p className="cs-h3" style={{ marginBottom: 7 }} id="cs-featured-heading">
                  Featured Agent
                </p>
                <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: "var(--cs-ink)" }}>
                  {featured.name}
                </p>
                <p style={{ fontSize: 12.5, color: "var(--cs-ruby)", margin: "3px 0 0" }}>
                  {featured.description || "Ensure every piece of content stays on-brand and on-message."}
                </p>
              </div>
              <Link
                to={`/content-studio/agents/${encodeURIComponent(featured.id)}`}
                className="cs-btn cs-btn-primary"
              >
                Start Session
              </Link>
            </section>
          ) : null}
        </>
      )}

      <section aria-labelledby="cs-custom-heading">
        <h2 id="cs-custom-heading" className="cs-h3" style={{ marginBottom: 12 }}>
          Your custom agents ({visibleCustom.length})
        </h2>

        {custom.loading ? (
          <LoadingState label="Loading your agents" rows={2} />
        ) : custom.error ? (
          <ErrorState error={custom.error} onRetry={custom.reload} />
        ) : visibleCustom.length === 0 ? (
          <EmptyState
            title="No custom agents yet"
            description={
              canCreate
                ? "Build an agent trained on your brand voice and knowledge."
                : "Custom agents are available on Estate with an active trial or add-on."
            }
            icon={Bot}
            action={
              <Link to="/content-studio/agents/new" className="cs-btn cs-btn-primary">
                Create Custom Agent
              </Link>
            }
          />
        ) : (
          <div className="cs-grid cs-grid-4">
            {visibleCustom.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                to={`/content-studio/agents/${encodeURIComponent(agent.id)}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <ContentStudioShell title="Agents">
      <AgentsPageInner />
    </ContentStudioShell>
  );
}
