import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { formatBytes, normalizeList, normalizeNumber } from "./workspaceRoutes";
import { activityRecord, documentRecord, errorText, memberRecord, workRecord } from "./workspaceRecords";

export function useWorkspaceSuiteData() {
  const { activeWorkspaceId, activeWorkspace, workspaces } = useWorkspace();
  const [state, setState] = useState({
    loading: true,
    error: "",
    detail: null,
    stats: null,
    settings: null,
    members: [],
    invites: [],
    activity: [],
    documents: [],
    assets: [],
    workItems: [],
    usage: null,
    billing: null,
  });

  const load = useCallback(async () => {
    if (!activeWorkspaceId) {
      setState((current) => ({
        ...current,
        loading: false,
        error: "No active workspace is available.",
      }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));
    const requests = {
      detail: apiClient.get(API_PATHS.workspace.detail(activeWorkspaceId)),
      stats: apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId)),
      settings: apiClient.get(API_PATHS.workspace.settings(activeWorkspaceId)),
      members: apiClient.get(API_PATHS.teams.members(activeWorkspaceId)),
      invites: apiClient.get(API_PATHS.teams.pendingInvites(activeWorkspaceId)),
      activity: apiClient.get(API_PATHS.teams.activitySummary(activeWorkspaceId)),
      documents: apiClient.get(API_PATHS.documents.list({ limit: 100 })),
      assets: apiClient.get(API_PATHS.persist.assets),
      campaigns: apiClient.get(API_PATHS.campaigns.list),
      offers: apiClient.get(API_PATHS.offers.list),
      usage: apiClient.get(API_PATHS.usage.summary),
      billing: apiClient.get(API_PATHS.billing.summary),
    };

    const keys = Object.keys(requests);
    const settled = await Promise.allSettled(Object.values(requests));
    const payload = {};
    const failures = [];
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") payload[keys[index]] = result.value;
      else failures.push(`${keys[index]}: ${errorText(result.reason)}`);
    });

    const campaigns = normalizeList(payload.campaigns, ["campaigns"]);
    const offers = normalizeList(payload.offers, ["offers"]);
    setState({
      loading: false,
      error: failures.length ? `Some data is unavailable: ${failures.join(" · ")}` : "",
      detail: payload.detail || activeWorkspace?.raw || activeWorkspace || null,
      stats: payload.stats || null,
      settings: payload.settings || null,
      members: normalizeList(payload.members, ["members", "users"]).map(memberRecord),
      invites: normalizeList(payload.invites, ["invites", "pending_invites"]),
      activity: normalizeList(payload.activity, ["activity", "events", "items"]).map(activityRecord),
      documents: normalizeList(payload.documents, ["documents"]).map(documentRecord),
      assets: normalizeList(payload.assets, ["assets", "media_assets"]),
      workItems: [
        ...campaigns.map((item, index) => workRecord(item, "Campaign", index)),
        ...offers.map((item, index) => workRecord(item, "Offer", index)),
      ],
      usage: payload.usage || null,
      billing: payload.billing || null,
    });
  }, [activeWorkspace, activeWorkspaceId]);

  useEffect(() => { void load(); }, [load]);

  const storageUsed = normalizeNumber(
    state.usage?.storage_used_bytes || state.usage?.storage?.used_bytes ||
    state.stats?.storage_used_bytes || state.stats?.storage?.used_bytes
  );
  const storageLimit = normalizeNumber(
    state.usage?.storage_limit_bytes || state.usage?.storage?.limit_bytes ||
    state.billing?.limits?.storage_bytes || state.stats?.storage_limit_bytes
  );
  const summary = {
    memberCount: state.members.length,
    pendingInvites: state.invites.length,
    workCount: state.workItems.length,
    reviewCount: state.workItems.filter((item) => item.status === "review").length,
    storageLabel: formatBytes(storageUsed),
    storageLimitLabel: storageLimit ? formatBytes(storageLimit) : "",
  };

  return {
    ...state,
    activeWorkspaceId,
    activeWorkspace,
    workspaces,
    summary,
    storageUsed,
    storageLimit,
    reload: load,
  };
}
