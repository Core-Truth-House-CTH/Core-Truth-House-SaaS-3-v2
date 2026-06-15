import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import apiClient from "../../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Every-3-hours column ticks.
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

const PILLS = [
  { key: "all", label: "All" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "tiktok", label: "TikTok" },
  { key: "threads", label: "Threads" },
];

function shortHour(hour) {
  const suffix = hour < 12 ? "am" : "pm";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}${suffix}`;
}

function ScoreBar({ value, color, height = 8 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 999,
        background: "var(--cth-command-panel-soft)",
        overflow: "hidden",
      }}
    >
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 200ms ease" }} />
    </div>
  );
}

export default function BestPostingTimes({ workspaceId, connections = {} }) {
  const [platform, setPlatform] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await apiClient.get("/api/social/posting-times/analysis", { params: { platform } });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load posting times:", err);
          setError(err?.message || "Could not load posting-time analysis.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [platform, workspaceId]);

  // Which platform pills to show: All, plus any platform with a connection or post data.
  const visiblePills = useMemo(() => {
    const withData = new Set(data?.platforms_with_data || []);
    return PILLS.filter(
      (p) => p.key === "all" || Boolean(connections?.[p.key]) || withData.has(p.key)
    );
  }, [data, connections]);

  // Set of "dayName-hour" keys for the recommended (top 3) slots.
  const topKeys = useMemo(() => {
    const s = new Set();
    (data?.top_times || []).forEach((t) => s.add(`${t.day}-${t.hour}`));
    return s;
  }, [data]);

  // Per-cell breakdown lookup (only the top slots carry signal/engagement detail).
  const breakdown = useMemo(() => {
    const m = {};
    (data?.top_times || []).forEach((t) => {
      m[`${t.day}-${t.hour}`] = { signal: t.signal_score, engagement: t.engagement_score };
    });
    return m;
  }, [data]);

  const heatmap = data?.heatmap || [];
  const noData = Boolean(data) && data.signal_count === 0 && data.post_count === 0;

  // ---- Platform selector pills ----
  const pillRow = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
      {visiblePills.map((p) => {
        const active = platform === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => setPlatform(p.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: active ? "var(--cth-command-crimson)" : "var(--cth-command-panel)",
              color: active ? "#fff" : "var(--cth-command-ink)",
              border: "1px solid " + (active ? "var(--cth-command-crimson)" : "var(--cth-command-border)"),
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 32, fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)" }}>
        <Loader2 size={16} className="animate-spin" /> Analyzing your best posting times…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 16, borderRadius: 10, fontFamily: SANS, fontSize: 13, background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-crimson)", color: "var(--cth-command-ink)" }}>
        <AlertCircle size={16} style={{ color: "var(--cth-command-crimson)", flexShrink: 0, marginTop: 1 }} />
        <span>{error}</span>
      </div>
    );
  }

  // ---- Empty state (no data at all): Zuri dark card ----
  if (noData) {
    return (
      <>
        {pillRow}
        <div
          style={{
            background: "#1a0828",
            border: "1px solid var(--cth-command-border)",
            borderRadius: 16,
            padding: "48px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "50%", margin: "0 auto 18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <Clock size={24} style={{ color: "var(--cth-command-gold)" }} />
          </div>
          <h3 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 10px" }}>
            Find your best times
          </h3>
          <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.72)", maxWidth: 460, margin: "0 auto" }}>
            Start posting and confirming buyer signals to see when your audience is most active. Best Times improves with every signal you confirm and every post you publish.
          </p>
        </div>
      </>
    );
  }

  // ---- Data source legend ----
  const legend = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, marginBottom: 18 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--cth-command-crimson)" }} />
        Buyer signal activity ({data?.signal_count ?? 0} signals)
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--cth-command-muted)" }} />
        Post engagement ({data?.post_count ?? 0} posts)
      </span>
    </div>
  );

  const baselineNote = data?.is_baseline ? (
    <p style={{ fontFamily: SANS, fontSize: 12, fontStyle: "italic", color: "var(--cth-command-gold)", margin: "0 0 18px" }}>
      Limited data — showing industry baselines. Post more to see your personalized times.
    </p>
  ) : null;

  // ---- Top 3 recommended times ----
  const topCards = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
      {(data?.top_times || []).map((t, i) => {
        const isTop = i === 0;
        return (
          <div
            key={`${t.day}-${t.hour}`}
            style={{
              background: "var(--cth-command-panel)",
              border: "1px solid " + (isTop ? "var(--cth-command-crimson)" : "var(--cth-command-border)"),
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: isTop ? "var(--cth-command-crimson)" : "var(--cth-command-muted)" }}>
                {isTop ? "Top pick" : `#${i + 1}`}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: "var(--cth-command-ink)" }}>
                {t.combined_score}
              </span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)" }}>
              {t.day}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)", marginBottom: 12 }}>
              {t.display_time}
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: SANS, fontSize: 10, color: "var(--cth-command-muted)", marginBottom: 3 }}>Combined</div>
              <ScoreBar value={t.combined_score} color="var(--cth-command-crimson)" height={8} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontSize: 10, color: "var(--cth-command-muted)", marginBottom: 3 }}>Signal {t.signal_score}</div>
                <ScoreBar value={t.signal_score} color="var(--cth-command-crimson)" height={5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontSize: 10, color: "var(--cth-command-muted)", marginBottom: 3 }}>Engage {t.engagement_score}</div>
                <ScoreBar value={t.engagement_score} color="var(--cth-command-muted)" height={5} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ---- Weekly heatmap ----
  const heatmapGrid = (
    <div style={{ background: "var(--cth-command-panel)", border: "1px solid var(--cth-command-border)", borderRadius: 12, padding: 16, overflowX: "auto" }}>
      <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "var(--cth-command-ink)", marginBottom: 12 }}>
        Weekly activity heatmap
      </div>
      <div style={{ minWidth: 560 }}>
        {/* Column header (hour ticks) */}
        <div style={{ display: "flex", marginBottom: 4 }}>
          <div style={{ width: 34, flexShrink: 0 }} />
          <div style={{ flex: 1, position: "relative", height: 14 }}>
            {HOUR_TICKS.map((h) => (
              <span
                key={h}
                style={{
                  position: "absolute",
                  left: `${(h / 24) * 100}%`,
                  fontFamily: SANS,
                  fontSize: 9,
                  color: "var(--cth-command-muted)",
                }}
              >
                {shortHour(h)}
              </span>
            ))}
          </div>
        </div>

        {/* Rows */}
        {DAY_LABELS.map((label, day) => (
          <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            <div style={{ width: 34, flexShrink: 0, fontFamily: SANS, fontSize: 10, fontWeight: 600, color: "var(--cth-command-muted)" }}>
              {label}
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 2 }}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const score = (heatmap[day] && heatmap[day][hour]) || 0;
                const key = `${DAY_NAMES[day]}-${hour}`;
                const isTopCell = topKeys.has(key);
                const bd = breakdown[key];
                const tip = bd
                  ? `${DAY_NAMES[day]} ${shortHour(hour)} — Score: ${score} (Signals: ${bd.signal}, Engagement: ${bd.engagement})`
                  : `${DAY_NAMES[day]} ${shortHour(hour)} — Score: ${score}`;
                return (
                  <div
                    key={hour}
                    title={tip}
                    style={{
                      position: "relative",
                      aspectRatio: "1 / 1",
                      borderRadius: 2,
                      background: "var(--cth-command-panel-soft)",
                      border: isTopCell ? "1.5px solid #fff" : "1px solid var(--cth-command-border)",
                      boxShadow: isTopCell ? "0 0 0 1px var(--cth-command-crimson)" : "none",
                      overflow: "hidden",
                      cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "var(--cth-command-crimson)",
                        opacity: Math.max(0, Math.min(1, score / 100)),
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {pillRow}
      {legend}
      {baselineNote}
      {topCards}
      {heatmapGrid}
    </>
  );
}
