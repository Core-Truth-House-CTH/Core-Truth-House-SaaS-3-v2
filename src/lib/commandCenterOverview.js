import apiClient from "./apiClient";

export const COMMAND_CENTER_OVERVIEW_PATH = "/api/command-center/overview";

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeRoute(value, fallback) {
  const route = String(value || "").trim();
  return route.startsWith("/") ? route : fallback;
}

export function normalizeCommandCenterOverview(payload, expectedWorkspaceId) {
  const root = safeObject(payload);
  const workspaceId = String(root.workspace_id || "").trim();
  const expected = String(expectedWorkspaceId || "").trim();

  if (!workspaceId) {
    throw new Error("Command Center response is missing workspace_id.");
  }

  if (expected && workspaceId !== expected) {
    const error = new Error("Command Center response does not match the active workspace.");
    error.code = "workspace_response_mismatch";
    throw error;
  }

  const brandHealth = safeObject(root.brand_health);
  const buyerSignals = safeObject(root.buyer_signals);
  const openDecisions = safeObject(root.open_decisions);
  const activeWork = safeObject(root.active_work);
  const systemAlerts = safeObject(root.system_alerts);
  const brandHouse = safeObject(root.brand_house);
  const nextMove = safeObject(root.next_move);

  return {
    workspaceId,
    generatedAt: root.generated_at || null,
    brandHealth: {
      score: Math.max(0, Math.min(100, finiteNumber(brandHealth.score))),
      status: String(brandHealth.status || "").trim(),
      change: finiteNumber(brandHealth.change),
    },
    buyerSignals: {
      confirmed: Math.max(0, finiteNumber(buyerSignals.confirmed)),
      unconfirmed: Math.max(0, finiteNumber(buyerSignals.unconfirmed)),
      recent: safeArray(buyerSignals.recent),
    },
    openDecisions: {
      count: Math.max(0, finiteNumber(openDecisions.count)),
      items: safeArray(openDecisions.items),
    },
    activeWork: {
      count: Math.max(0, finiteNumber(activeWork.count)),
      campaignCount: Math.max(0, finiteNumber(activeWork.campaign_count)),
      items: safeArray(activeWork.items),
    },
    systemAlerts: {
      count: Math.max(0, finiteNumber(systemAlerts.count)),
      items: safeArray(systemAlerts.items),
    },
    brandHouse: {
      foundation: Math.max(0, Math.min(100, finiteNumber(brandHouse.foundation))),
      structure: Math.max(0, Math.min(100, finiteNumber(brandHouse.structure))),
      house: Math.max(0, Math.min(100, finiteNumber(brandHouse.house))),
      estate: Math.max(0, Math.min(100, finiteNumber(brandHouse.estate))),
    },
    nextMove: {
      eyebrow: String(nextMove.eyebrow || "NEXT BEST MOVE").trim(),
      title: String(nextMove.title || "Review the next structural move").trim(),
      body: String(nextMove.body || "Open the recommended room to continue building the brand system.").trim(),
      action: String(nextMove.action || "Open recommendation").trim(),
      route: safeRoute(nextMove.route, "/brand-health"),
      evidenceIds: safeArray(nextMove.evidence_ids),
    },
    dailyIntelligence: safeArray(root.daily_intelligence),
    recentProgress: safeArray(root.recent_progress),
  };
}

export async function fetchCommandCenterOverview(activeWorkspaceId, options = {}) {
  try {
    const payload = await apiClient.get(COMMAND_CENTER_OVERVIEW_PATH, {
      signal: options.signal,
    });

    return {
      available: true,
      source: "command-center-overview",
      data: normalizeCommandCenterOverview(payload, activeWorkspaceId),
      error: null,
    };
  } catch (error) {
    // Only an explicit not-implemented response means "this endpoint is not
    // deployed yet", which is what legacy fallback exists for. The endpoint
    // contract assigns 404 to a validated workspace that does not exist, so a
    // 404 is a real workspace error and must reach the page instead of being
    // replaced by partial legacy metrics.
    if (error?.status === 501) {
      return {
        available: false,
        source: "legacy-fallback",
        data: null,
        error,
      };
    }

    throw error;
  }
}

export default {
  COMMAND_CENTER_OVERVIEW_PATH,
  fetchCommandCenterOverview,
  normalizeCommandCenterOverview,
};
