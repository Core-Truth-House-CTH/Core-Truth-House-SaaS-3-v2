import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  ArrowRight,
  Layers3,
  Compass,
  Building2,
  Crown,
  Loader2,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";
import apiClient from "../lib/apiClient";

const SECTION_META = {
  getting_started: { title: "Getting Started", tier: "All", icon: Compass },
  foundation: { title: "Foundation", tier: "Foundation", icon: Layers3 },
  structure: { title: "Structure", tier: "Structure", icon: Building2 },
  systems_workspace: { title: "Systems + Workspace", tier: "Structure", icon: Crown },
};

const SECTION_KEY_ALIASES = {
  // New canonical keys
  getting_started: "getting_started",
  "getting-started": "getting_started",
  foundation: "foundation",
  structure: "structure",
  systems_workspace: "systems_workspace",
  "systems-workspace": "systems_workspace",
  "systems-and-workspace": "systems_workspace",
  // Legacy keys mapped forward
  "start-here": "getting_started",
  "quick-start": "getting_started",
  quickstart: "getting_started",
  quickStart: "getting_started",
  "foundation-tier": "foundation",
  "structure-tier": "structure",
  "house-tier": "systems_workspace",
  house: "systems_workspace",
  "estate-tier": "systems_workspace",
  estate: "systems_workspace",
};

const TIER_STYLES = {
  All: { background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)" },
  Foundation: { background: "var(--cth-command-purple)", color: "var(--cth-command-panel)" },
  Structure: { background: "var(--cth-command-gold)", color: "var(--cth-command-ink)" },
  House: { background: "var(--cth-command-crimson)", color: "var(--cth-command-panel)" },
  Estate: { background: "var(--cth-command-ink)", color: "var(--cth-command-panel)" },
};

function normalizeSectionKey(value) {
  const raw = String(value || "").trim();
  return SECTION_KEY_ALIASES[raw] || raw;
}

function buildSectionsFromArticles(articles = []) {
  const next = {};
  Object.keys(SECTION_META).forEach((key) => {
    next[key] = { title: SECTION_META[key].title, articles: [] };
  });

  articles.forEach((article) => {
    const rawSectionKey = article.section_key || article.sectionKey || "getting_started";
    const sectionKey = normalizeSectionKey(rawSectionKey);
    if (!next[sectionKey]) return;

    next[sectionKey].articles.push({
      id: article.id,
      title: article.title,
      tier: article.tier || "All",
      duration: article.duration || "3 min read",
      section: article.section || next[sectionKey].title,
      sectionKey,
      body: Array.isArray(article.body) ? article.body : [],
      slug: article.slug || "",
      sort_order: Number.isFinite(article.sort_order) ? article.sort_order : 0,
    });
  });

  Object.keys(next).forEach((key) => {
    next[key].articles.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  });

  return next;
}

function flattenSections(sections) {
  return Object.entries(sections).flatMap(([sectionKey, sectionValue]) =>
    sectionValue.articles.map((article) => ({
      ...article,
      sectionKey,
      section: sectionValue.title,
    }))
  );
}

function PanelCard({ title, subtitle, children, actions = null }) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        background: "var(--cth-command-panel)",
        border: "1px solid var(--cth-command-border)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--cth-command-border)" }}
      >
        <div>
          <div
            className="font-serif text-sm font-semibold"
            style={{ color: "var(--cth-command-ink)" }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              className="mt-1 text-xs"
              style={{ color: "var(--cth-command-muted)" }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <div
      className="flex items-center gap-2 rounded-md px-3 py-2"
      style={{
        background: "var(--cth-command-blush)",
        border: "1px solid var(--cth-command-border)",
      }}
    >
      <Search size={15} style={{ color: "var(--cth-command-muted)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search guides and docs..."
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "var(--cth-command-ink)" }}
      />
    </div>
  );
}

function TierBadge({ tier }) {
  const normalizedTier = String(tier || "All")
    .replace("Foundation+", "Foundation")
    .replace("Structure+", "Structure")
    .replace("House+", "House");

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={TIER_STYLES[normalizedTier] || TIER_STYLES.All}
    >
      {normalizedTier}
    </span>
  );
}

function SectionTab({ section, active, count = 0, onClick }) {
  const Icon = section.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors"
      style={{
        background: active ? "var(--cth-command-purple)" : "transparent",
        color: active ? "var(--cth-command-panel)" : "var(--cth-command-ink)",
      }}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon size={16} />
        <span>{section.title}</span>
      </span>

      <span
        className="inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          background: active
            ? "var(--cth-command-panel)"
            : "var(--cth-command-blush)",
          color: active ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

export default function KnowledgeBasePage() {
  const [sections, setSections] = useState(() => buildSectionsFromArticles([]));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("getting_started");
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await apiClient.request("GET", "/api/knowledge-base/");
        if (cancelled) return;
        const articles = Array.isArray(res?.articles) ? res.articles : [];
        setSections(buildSectionsFromArticles(articles));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load knowledge base:", err);
        setLoadError(err?.message || "Failed to load knowledge base");
        setSections(buildSectionsFromArticles([]));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalArticleCount = useMemo(
    () => flattenSections(sections).length,
    [sections]
  );

  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    return flattenSections(sections).filter((article) => {
      const haystack = `${article.title} ${article.section} ${article.body.join(
        " "
      )}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, sections]);

  const visibleArticles =
    query.trim().length >= 2
      ? searchResults
      : sections?.[activeSection]?.articles || [];

  const activeArticle =
    visibleArticles.find((a) => a.id === selectedArticleId) ||
    visibleArticles[0] ||
    null;

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            className="text-2xl md:text-[32px] leading-tight truncate"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}
          >
            Knowledge Base
          </h1>
          <p
            className="text-xs md:text-sm truncate"
            style={{ margin: "6px 0 0 0", color: "var(--cth-command-muted)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Browse guides, references, and how-tos curated by the Core Truth House team.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <PanelCard title="Browse" subtitle="Search and explore by category">
            <div className="space-y-4">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setSelectedArticleId(null);
                }}
              />

              {query.trim().length < 2 ? (
                <div className="space-y-3">
                  {Object.entries(SECTION_META).map(([sectionKey, sectionValue]) => {
                    const sectionArticles =
                      sections?.[sectionKey]?.articles || [];
                    const isActiveSection = activeSection === sectionKey;
                    const sectionCount = sectionArticles.length;

                    return (
                      <div key={sectionKey} className="space-y-2">
                        <SectionTab
                          section={sectionValue}
                          active={isActiveSection}
                          count={sectionCount}
                          onClick={() => {
                            setActiveSection(sectionKey);
                            setSelectedArticleId(null);
                          }}
                        />

                        {isActiveSection ? (
                          <div
                            className="ml-2 space-y-1.5 pl-3"
                            style={{
                              borderLeft:
                                "1px solid var(--cth-command-border)",
                            }}
                          >
                            {sectionArticles.length === 0 ? (
                              <div
                                className="text-xs"
                                style={{ color: "var(--cth-command-muted)" }}
                              >
                                No articles in this section.
                              </div>
                            ) : (
                              sectionArticles.map((article) => {
                                const isSelected =
                                  selectedArticleId === article.id ||
                                  (!selectedArticleId &&
                                    activeArticle?.id === article.id);

                                return (
                                  <button
                                    key={article.id}
                                    type="button"
                                    onClick={() => {
                                      setActiveSection(sectionKey);
                                      setSelectedArticleId(article.id);
                                    }}
                                    className="w-full rounded-md px-2.5 py-2 text-left transition"
                                    style={{
                                      background: isSelected
                                        ? "var(--cth-command-blush)"
                                        : "transparent",
                                      border: isSelected
                                        ? "1px solid var(--cth-command-border)"
                                        : "1px solid transparent",
                                    }}
                                  >
                                    <div
                                      className="text-[13px] font-medium leading-5 line-clamp-2"
                                      style={{
                                        color: "var(--cth-command-ink)",
                                      }}
                                    >
                                      {article.title}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.length === 0 ? (
                    <div
                      className="text-sm"
                      style={{ color: "var(--cth-command-muted)" }}
                    >
                      No help articles found.
                    </div>
                  ) : (
                    searchResults.slice(0, 10).map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => {
                          setActiveSection(article.sectionKey);
                          setSelectedArticleId(article.id);
                          setQuery("");
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-md px-3 py-3 text-left"
                        style={{
                          background: "var(--cth-command-blush)",
                          border: "1px solid var(--cth-command-border)",
                        }}
                      >
                        <div>
                          <p
                            className="text-sm"
                            style={{ color: "var(--cth-command-ink)" }}
                          >
                            {article.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--cth-command-muted)" }}
                          >
                            {article.section}
                          </p>
                        </div>
                        <ArrowRight
                          size={14}
                          style={{ color: "var(--cth-command-muted)" }}
                        />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard
            title={activeArticle ? activeArticle.title : "Knowledge Article"}
            subtitle={
              activeArticle
                ? `${activeArticle.section} • ${activeArticle.duration}`
                : "Select an article"
            }
            actions={
              activeArticle ? <TierBadge tier={activeArticle.tier} /> : null
            }
          >
            {loading ? (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--cth-command-muted)" }}
              >
                <Loader2 size={14} className="animate-spin" /> Loading...
              </div>
            ) : loadError ? (
              <div
                className="text-sm"
                style={{ color: "var(--cth-command-crimson)" }}
              >
                {loadError}
              </div>
            ) : !activeArticle ? (
              <div
                className="text-sm"
                style={{ color: "var(--cth-command-muted)" }}
              >
                {totalArticleCount === 0
                  ? "No published articles are available yet. Check back soon."
                  : "No article selected."}
              </div>
            ) : (
              <div className="space-y-4">
                {activeArticle.body.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--cth-command-muted)" }}
                  >
                    This article has no content yet.
                  </p>
                ) : (
                  activeArticle.body.map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-sm leading-8"
                      style={{ color: "var(--cth-command-ink)" }}
                    >
                      {paragraph}
                    </p>
                  ))
                )}
              </div>
            )}
          </PanelCard>
        </div>
      </main>
    </DashboardLayout>
  );
}
