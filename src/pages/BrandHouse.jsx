import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";

import AuthShell from "../components/AuthShell";
import { useBrandHealth } from "../context/BrandHealthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";
import { fetchCommandCenterOverview } from "../lib/commandCenterOverview";
import { authoritativeHouseLevels, fallbackHouseLevels } from "./CommandCenterNext";
import "../styles/brand-house.css";

// The one approved house asset, shared byte-for-byte with the Command Center.
const HOUSE_ASSET = "/command-center-assets/brand-house.png";

// Same hotspot coordinates as the Command Center card, from the approved prototype.
const HOUSE_HOTSPOTS = {
  estate: { left: "68%", top: "18%" },
  house: { left: "51%", top: "43%" },
  structure: { left: "33%", top: "62%" },
  foundation: { left: "67%", top: "70%" },
};

export default function BrandHouse() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { healthData } = useBrandHealth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [stats, setStats] = useState(null);

  // Which source the percentages on screen came from: "pending" until a request
  // resolves, then "overview" (authoritative) or "stats" (the verified 501
  // fallback), or "error"/"empty" when there is nothing to show. Percentages are
  // derived only from the two resolved sources, so a slow load or a retry can
  // never be mistaken for genuine completion data.
  const [dataSource, setDataSource] = useState("pending");

  // Monotonic id of the latest Brand House load; see the stale-response guard
  // below. Same reviewed pattern the Command Center uses.
  const loadRequestRef = useRef(0);

  const load = useCallback(async () => {
    // Claim the generation before anything else - including the no-workspace
    // branch - so switching away from a workspace also invalidates whatever is
    // still in flight for the previous one. Only the newest load may write
    // state; a slower earlier request would otherwise resolve last and show the
    // previous workspace's metrics under the current workspace's heading.
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    const isStale = () => loadRequestRef.current !== requestId;

    if (!activeWorkspaceId) {
      setLoading(false);
      setError("");
      setOverview(null);
      setStats(null);
      setDataSource("empty");
      return;
    }

    setLoading(true);
    setError("");
    // Every load - including a retry over data already on screen - starts
    // unresolved, so nothing is derived until a source actually answers.
    setDataSource("pending");

    try {
      const result = await fetchCommandCenterOverview(activeWorkspaceId);
      if (isStale()) return;

      if (result.available) {
        setOverview(result.data);
        setStats(null);
        setDataSource("overview");
        return;
      }

      // Same verified fallback source the Command Center uses, so both views
      // report identical completion percentages. A failure here is deliberately
      // NOT swallowed: normalising it to null rendered every level as 0%, so a
      // backend outage looked like a genuinely empty Brand House. Letting it
      // throw reaches the outer catch, which clears stale data and shows the
      // error instead of fabricating zero completion.
      const workspaceStats = await apiClient.get(
        API_PATHS.workspace.stats(activeWorkspaceId)
      );
      if (isStale()) return;

      setOverview(null);
      setStats(workspaceStats);
      setDataSource("stats");
    } catch (requestError) {
      if (isStale()) return;

      setOverview(null);
      setStats(null);
      setDataSource("error");
      setError(requestError?.message || "The Brand House could not be loaded.");
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    load();

    // Invalidate the in-flight generation on unmount so a late response cannot
    // write to an unmounted Brand House. This only retires the generation - no
    // request is cancelled and no shared/global fetch behaviour changes.
    return () => {
      loadRequestRef.current += 1;
    };
  }, [load]);

  // Real backend completion percentages - never prototype sample numbers.
  const levels = useMemo(() => {
    // Percentages require a resolved source. While the load is still pending -
    // on first mount and immediately after a retry - `overview` and `stats` are
    // both null, so the fallback would convert empty inputs plus whatever the
    // independently cached Brand Health context holds into mostly-zero or
    // partially cached floors, before the request has established anything. The
    // same applies once a load has failed. Only an authoritative overview or a
    // successful stats fallback may produce levels; everything else renders no
    // card at all, leaving just the hero, the error alert and Refresh.
    if (loading) return null;
    if (dataSource === "overview") {
      return overview?.brandHouse ? authoritativeHouseLevels(overview.brandHouse) : null;
    }
    if (dataSource !== "stats") return null;

    return fallbackHouseLevels({
      modules: healthData?.modules || {},
      stats: stats || {},
      score: Math.round(Number(healthData?.overall_score) || 0),
    });
  }, [loading, dataSource, overview, healthData, stats]);

  // Approved order runs top floor first: Estate down to Foundation.
  const levelsTopDown = useMemo(() => (levels ? [...levels].reverse() : []), [levels]);

  return (
    <AuthShell>
      <main className="bh-page">
        <div className="bh-head">
          <button type="button" className="bh-back" onClick={() => navigate("/command-center-next")}>
            <ArrowLeft size={15} aria-hidden="true" /> Command Center
          </button>
          <button type="button" className="bh-refresh" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "is-spinning" : ""} aria-hidden="true" /> Refresh
          </button>
        </div>

        <section className="bh-hero">
          <span className="bh-eyebrow">Interactive Operating System</span>
          <h1>Your Brand House</h1>
          <p>Explore every layer of your Brand Operating System and see which rooms are complete, active, or waiting.</p>
        </section>

        {error ? <div className="bh-alert" role="alert">{error}</div> : null}

        {levels ? (
        <section className="bh-card">
          <div className="bh-levels">
            {levelsTopDown.map((level) => (
              <button
                key={level.key}
                type="button"
                className="bh-level"
                onClick={() => navigate(level.route)}
                aria-label={`Open ${level.label}, ${level.value}% complete`}
              >
                <span className="bh-level-icon" aria-hidden="true"><Home size={15} /></span>
                <span className="bh-level-copy">
                  <strong>{level.label.toUpperCase()}</strong>
                  <small>{level.rooms}</small>
                </span>
                <em>{level.value}%</em>
              </button>
            ))}
          </div>

          <div className="bh-visual">
            <img src={HOUSE_ASSET} alt="The Core Truth House brand operating system" />
            {levels.map((level) => {
              const position = HOUSE_HOTSPOTS[level.key];
              if (!position) return null;
              return (
                <button
                  key={level.key}
                  type="button"
                  className="bh-hotspot"
                  style={position}
                  onClick={() => navigate(level.route)}
                  aria-label={`Open ${level.label}, ${level.value}% complete`}
                />
              );
            })}
          </div>
        </section>
        ) : null}
      </main>
    </AuthShell>
  );
}
