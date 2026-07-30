import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Braces,
  Building2,
  Clapperboard,
  Mail,
  Megaphone,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

import ContentStudioShell from "../components/ContentStudioShell";
import TrialPanel from "../components/TrialPanel";
import HouseIllustration from "../components/HouseIllustration";
import { AgentCard } from "../components/Cards";
import { PageHeader, StatCard } from "../components/Primitives";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useAsyncResource } from "../hooks/useAsyncResource";
import {
  listAutomations,
  listCustomAgents,
  listOfficialAgents,
  listStoryboards,
} from "../api/contentStudioApi";

/**
 * Approved screen 1 — Content Studio Dashboard.
 *
 * Metric policy: the numbers in the design PNG (156 / 89 / 34 / 94-of-100) are
 * design placeholders. Nothing here hardcodes them. Each tile either shows a
 * value honestly derived from a real API response, or an explicit
 * "Not yet measured" state. See the metric-gap notes in the session report.
 */

const CATEGORY_TILES = [
  { label: "Authority Content", icon: BookOpen },
  { label: "Lead Generation", icon: Users },
  { label: "Offer Launch", icon: ShoppingBag },
  { label: "Customer Education", icon: Braces },
  { label: "Brand Story", icon: Building2 },
  { label: "Community Building", icon: Users },
  { label: "Sales Content", icon: Megaphone },
  { label: "Email Campaign", icon: Mail },
];

export default function DashboardPage() {
  const [query, setQuery] = useState("");

  const official = useAsyncResource(() => listOfficialAgents(), []);
  const custom = useAsyncResource(() => listCustomAgents(), []);
  const storyboards = useAsyncResource(() => listStoryboards(), []);
  const automations = useAsyncResource(() => listAutomations(), []);

  const officialAgents = official.data?.agents || [];
  const customAgents = custom.data?.agents || [];
  const storyboardItems = storyboards.data?.storyboards || [];
  const automationItems = automations.data?.automations || [];

  const filteredTiles = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return CATEGORY_TILES;
    return CATEGORY_TILES.filter((tile) => tile.label.toLowerCase().includes(term));
  }, [query]);

  const matchingAgents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return [...officialAgents, ...customAgents]
      .filter((agent) => String(agent.name || "").toLowerCase().includes(term))
      .slice(0, 4);
  }, [query, officialAgents, customAgents]);

  const anyLoading = official.loading || custom.loading || storyboards.loading || automations.loading;

  // Honest metrics only. Counts come straight from list responses; anything the
  // backend cannot yet supply is passed as null and renders as unavailable.
  const activeAutomations = automationItems.filter((item) => item.status === "active").length;

  return (
    <ContentStudioShell title="Content Studio">
      <div className="cs-page">
        <PageHeader title="Content Studio" subtitle="Every piece of content starts with strategy." />

        <div className="cs-split" style={{ marginBottom: 30 }}>
          <section aria-labelledby="cs-build-heading">
            <div
              className="cs-card"
              style={{ padding: "22px 22px 26px", position: "relative", overflow: "hidden" }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: -10,
                  top: 8,
                  width: 230,
                  opacity: 0.5,
                  pointerEvents: "none",
                }}
              >
                <HouseIllustration />
              </div>

              <h2 id="cs-build-heading" className="cs-h2" style={{ position: "relative", marginBottom: 14 }}>
                What are we building today?
              </h2>

              <div style={{ position: "relative", maxWidth: 430 }}>
                <label className="sr-only" htmlFor="cs-goal-search">
                  Search goals or templates
                </label>
                <Search
                  size={14}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--cs-tuscany)",
                  }}
                />
                <input
                  id="cs-goal-search"
                  type="search"
                  className="cs-input"
                  style={{ paddingLeft: 34 }}
                  placeholder="Search goals or templates…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              {query.trim() && matchingAgents.length > 0 ? (
                <div style={{ position: "relative", marginTop: 14 }}>
                  <p className="cs-h3" style={{ marginBottom: 8 }}>
                    Matching agents
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
                    {matchingAgents.map((agent) => (
                      <li key={agent.id}>
                        <Link
                          to={`/content-studio/agents/${encodeURIComponent(agent.id)}`}
                          style={{ fontSize: 13, color: "var(--cs-crimson)", textDecoration: "none" }}
                        >
                          {agent.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="cs-grid cs-grid-4" style={{ position: "relative", marginTop: 20 }}>
                {filteredTiles.map(({ label, icon: Icon }) => (
                  <Link
                    key={label}
                    to={`/content-studio/composer?goal=${encodeURIComponent(label)}`}
                    className="cs-card"
                    style={{
                      padding: "16px 12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      textAlign: "center",
                      textDecoration: "none",
                      background: "var(--cs-panel)",
                    }}
                  >
                    <Icon size={17} aria-hidden="true" style={{ color: "var(--cs-crimson)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--cs-ink)", lineHeight: 1.35 }}>{label}</span>
                  </Link>
                ))}
              </div>

              {filteredTiles.length === 0 ? (
                <p style={{ position: "relative", marginTop: 16, fontSize: 13, color: "var(--cs-ruby)" }}>
                  No templates match “{query}”.
                </p>
              ) : null}
            </div>
          </section>

          <TrialPanel />
        </div>

        {/* ---- Content overview ---- */}
        <section aria-labelledby="cs-overview-heading" style={{ marginBottom: 30 }}>
          <h2 id="cs-overview-heading" className="cs-h2" style={{ marginBottom: 14 }}>
            Content Overview
          </h2>

          {anyLoading ? (
            <LoadingState label="Loading workspace activity" rows={1} />
          ) : (
            <div className="cs-grid cs-grid-4">
              <StatCard
                label="Custom Agents"
                value={custom.error ? null : customAgents.length}
                hint="Built by your workspace"
                unavailable={Boolean(custom.error)}
              />
              <StatCard
                label="Storyboards"
                value={storyboards.error ? null : storyboardItems.length}
                hint={storyboardItems.length === 1 ? "1 storyboard" : `${storyboardItems.length} storyboards`}
                unavailable={Boolean(storyboards.error)}
              />
              <StatCard
                label="Automations"
                value={automations.error ? null : automationItems.length}
                hint={`${activeAutomations} active`}
                unavailable={Boolean(automations.error)}
              />
              {/* No endpoint supplies a content score yet. Showing the design's
                  94/100 would be fabricated, so this stays explicitly unmeasured. */}
              <StatCard label="Avg. Content Score" value={null} unavailable />
            </div>
          )}
        </section>

        {/* ---- Recent projects (storyboards are the only real project records today) ---- */}
        <section aria-labelledby="cs-recent-heading" style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <h2 id="cs-recent-heading" className="cs-h2">
              Recent Projects
            </h2>
            <Link to="/content-studio/storyboards" className="cs-btn cs-btn-ghost">
              View all
            </Link>
          </div>

          {storyboards.loading ? (
            <LoadingState label="Loading projects" rows={2} />
          ) : storyboards.error ? (
            <ErrorState error={storyboards.error} onRetry={storyboards.reload} compact />
          ) : storyboardItems.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Storyboards you build will appear here."
              icon={Clapperboard}
              action={
                <Link to="/content-studio/storyboards" className="cs-btn cs-btn-primary">
                  Open Storyboard Builder
                </Link>
              }
            />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {storyboardItems.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link
                    to="/content-studio/storyboards"
                    className="cs-card"
                    style={{
                      padding: "13px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, color: "var(--cs-ink)" }}>{item.title}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "var(--cs-ruby)", marginTop: 2 }}>
                        {(item.scenes?.length || 0)} {item.scenes?.length === 1 ? "scene" : "scenes"} · {item.format}
                      </span>
                    </span>
                    <span className="cs-badge">{item.status || "draft"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- Official agents row ---- */}
        <section aria-labelledby="cs-agents-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <h2 id="cs-agents-heading" className="cs-h2">
              Core Truth House Agents
            </h2>
            <Link to="/content-studio/agents" className="cs-btn cs-btn-ghost">
              View all
            </Link>
          </div>

          {official.loading ? (
            <LoadingState label="Loading agents" rows={1} />
          ) : official.error ? (
            <ErrorState error={official.error} onRetry={official.reload} compact />
          ) : (
            <div className="cs-grid cs-grid-4">
              {officialAgents.slice(0, 4).map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  to={`/content-studio/agents/${encodeURIComponent(agent.id)}`}
                />
              ))}
            </div>
          )}
        </section>

        <p style={{ marginTop: 28, fontSize: 12, color: "var(--cs-tuscany)", display: "flex", gap: 6, alignItems: "center" }}>
          <Sparkles size={12} aria-hidden="true" />
          Metrics shown are derived from live workspace records. Tiles marked “Not yet measured” have no
          backend source yet.
        </p>
      </div>
    </ContentStudioShell>
  );
}
