import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../lib/apiClient";
import {
  BookOpen,
  Search,
  ArrowRight,
  Layers3,
  Compass,
  Building2,
  Crown,
} from "lucide-react";

const SECTION_META = {
  quickStart: { title: "Start Here", icon: Compass },
  foundation: { title: "Foundation", icon: Layers3 },
  structure: { title: "Structure", icon: Building2 },
  house: { title: "House", icon: BookOpen },
  estate: { title: "Estate", icon: Crown },
};

const SECTION_KEY_ALIASES = {
  "start-here": "quickStart",
  "quick-start": "quickStart",
  quickstart: "quickStart",
  quickStart: "quickStart",
  "foundation-tier": "foundation",
  foundation: "foundation",
  "structure-tier": "structure",
  structure: "structure",
  "house-tier": "house",
  house: "house",
  "estate-tier": "estate",
  estate: "estate",
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
    const rawSectionKey = article.section_key || article.sectionKey || "quickStart";
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
    <div className="rounded-2xl border border-[var(--cth-border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cth-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--cth-ink)]">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-[var(--cth-muted)]">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SearchInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--cth-border)] bg-white px-3 py-2">
      <Search size={15} className="text-[var(--cth-muted)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search guides and docs..."
        className="w-full bg-transparent text-sm text-[var(--cth-ink)] outline-none placeholder:text-[var(--cth-muted)]"
      />
    </div>
  );
}

function TierBadge({ tier }) {
  const normalizedTier = String(tier || "All")
    .replace("Foundation+", "Foundation")
    .replace("Structure+", "Structure")
    .replace("House+", "House");

  const styles = {
    All: "bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]",
    Foundation: "bg-[rgba(45,106,79,0.12)] text-[var(--cth-status-success)]",
    Structure: "bg-[var(--cth-kb-structure-bg)] text-[var(--cth-kb-structure-text)]",
    House: "bg-[rgba(118,59,91,0.12)] text-[var(--cth-admin-ruby)]",
    Estate: "bg-[var(--cth-kb-estate-bg)] text-[var(--cth-kb-estate-text)]",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${styles[normalizedTier] || styles.All}`}>
      {normalizedTier}
    </span>
  );
}

function SectionTab({ section, active, count = 0, onClick }) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
        active
          ? "bg-[var(--cth-ink)] text-[var(--cth-on-dark)]"
          : "text-[var(--cth-ink-soft)] hover:bg-[var(--cth-blush)] hover:text-[var(--cth-ink)]"
      }`}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon size={16} />
        <span>{section.title}</span>
      </span>

      <span
        className={`inline-flex min-w-[24px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          active
            ? "bg-[var(--cth-on-dark)] text-[var(--cth-ink)]"
            : "bg-[var(--cth-blush)] text-[var(--cth-ink-soft)]"
        }`}
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
  const [activeSection, setActiveSection] = useState("quickStart");
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

  const totalArticleCount = useMemo(() => flattenSections(sections).length, [sections]);
  const sectionArticleCount = sections?.[activeSection]?.articles?.length || 0;

  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();

    return flattenSections(sections).filter((article) => {
      const haystack = `${article.title} ${article.section} ${article.body.join(" ")}`.toLowerCase();
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--cth-admin-ruby)_12%,var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Member</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Knowledge Base</h2>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          Browse guides, references, and how-tos curated by the Core Truth House team.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--cth-admin-ruby)_12%,var(--cth-admin-panel))] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-ruby)]">
            Total Articles: {totalArticleCount}
          </span>
          <span className="inline-flex items-center rounded-full bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]">
            This Section: {sectionArticleCount}
          </span>
        </div>
      </section>

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
                  const sectionArticles = sections?.[sectionKey]?.articles || [];
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
                        <div className="ml-2 space-y-1.5 border-l border-[var(--cth-border)] pl-3">
                          {sectionArticles.length === 0 ? (
                            <div className="text-xs text-[var(--cth-muted)]">No articles in this section.</div>
                          ) : (
                            sectionArticles.map((article) => {
                              const isSelected =
                                selectedArticleId === article.id ||
                                (!selectedArticleId && activeArticle?.id === article.id);

                              return (
                                <button
                                  key={article.id}
                                  onClick={() => {
                                    setActiveSection(sectionKey);
                                    setSelectedArticleId(article.id);
                                  }}
                                  className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                                    isSelected
                                      ? "border-[var(--cth-border)] bg-[var(--cth-blush)]"
                                      : "border-transparent bg-transparent hover:border-[var(--cth-border)] hover:bg-[var(--cth-blush)]"
                                  }`}
                                >
                                  <div className="text-[13px] font-medium leading-5 text-[var(--cth-ink)] line-clamp-2">
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
                  <div className="text-sm text-[var(--cth-muted)]">No help articles found.</div>
                ) : (
                  searchResults.slice(0, 10).map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        setActiveSection(article.sectionKey);
                        setSelectedArticleId(article.id);
                        setQuery("");
                      }}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-[var(--cth-border)] bg-[var(--cth-blush)] px-3 py-3 text-left hover:border-[var(--cth-ruby)]"
                    >
                      <div>
                        <p className="text-sm text-[var(--cth-ink)]">{article.title}</p>
                        <p className="text-xs text-[var(--cth-muted)]">{article.section}</p>
                      </div>
                      <ArrowRight size={14} className="text-[var(--cth-muted)]" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </PanelCard>

        <PanelCard
          title={activeArticle ? activeArticle.title : "Knowledge Article"}
          subtitle={activeArticle ? `${activeArticle.section} • ${activeArticle.duration}` : "Select an article"}
          actions={activeArticle ? <TierBadge tier={activeArticle.tier} /> : null}
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : loadError ? (
            <div className="text-sm text-[var(--cth-status-danger-deep)]">{loadError}</div>
          ) : !activeArticle ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">
              {totalArticleCount === 0
                ? "No published articles are available yet. Check back soon."
                : "No article selected."}
            </div>
          ) : (
            <div className="space-y-4">
              {activeArticle.body.length === 0 ? (
                <p className="text-sm text-[var(--cth-admin-muted)]">This article has no content yet.</p>
              ) : (
                activeArticle.body.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-8 text-[var(--cth-copy-body-soft)]">
                    {paragraph}
                  </p>
                ))
              )}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
