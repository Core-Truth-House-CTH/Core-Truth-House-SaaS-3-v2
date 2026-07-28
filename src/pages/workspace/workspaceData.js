import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import { formatBytes, normalizeList, normalizeNumber } from "./workspaceRoutes";
import {
  activityRecord,
  decisionRecord,
  documentRecord,
  errorText,
  memberRecord,
  workRecord,
} from "./workspaceRecords";
import {
  getTenantSummary,
  getWorkspaceActivity,
  getWorkspaceControls,
  getWorkspaceDecisions,
  getWorkspaceSettings,
} from "./workspaceApi";

export function useWorkspaceSuiteData() {
  const {
    activeWorkspaceId,
    activeWorkspace,
    workspaces,
    refreshWorkspaces,
  } = useWorkspace();
  const [state, setState] = useState({
    loading: true,
    error: "",
    companionError: "",
    companionAvailable: false,
    detail: null,
    stats: null,
    settings: null,
    controls: null,
    members: [],
    invites: [],
    activity: [],
    activitySummary: null,
    decisions: [],
    documents: [],
    assets: [],
    workItems: [],
    tenantSummary: null,
    usage: null,
    billing: null,
    brandMemory: null,
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

    setState((current) => ({ ...current, loading: true, error: "", companionError: "" }));
    const coreRequests = {
      stats: apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId)),
      settings: getWorkspaceSettings(),
      members: apiClient.get(API_PATHS.teams.members(activeWorkspaceId)),
      invites: apiClient.get(API_PATHS.teams.pendingInvites(activeWorkspaceId)),
      activitySummary: apiClient.get(API_PATHS.teams.activitySummary(activeWorkspaceId)),
      documents: apiClient.get(API_PATHS.documents.list({ limit: 100 })),
      assets: apiClient.get(API_PATHS.persist.assets),
      campaigns: apiClient.get(API_PATHS.campaigns.list),
      offers: apiClient.get(API_PATHS.offers.list),
      tenantSummary: getTenantSummary(),
      usage: apiClient.get(API_PATHS.usage.summary),
      billing: apiClient.get(API_PATHS.billing.summary),
    };
    const companionRequests = {
      controls: getWorkspaceControls(),
      decisions: getWorkspaceDecisions(),
      activity: getWorkspaceActivity(),
    };
    // Optional reads back a panel that has an explicit disconnected state, so a
    // failure here is not a workspace error - it just renders as "not connected".
    const optionalRequests = {
      brandMemory: apiClient.get(API_PATHS.persist.brandMemory),
    };
    const requests = { ...coreRequests, ...companionRequests, ...optionalRequests };
    const keys = Object.keys(requests);
    const settled = await Promise.allSettled(Object.values(requests));
    const payload = {};
    const coreFailures = [];
    const companionFailures = [];

    settled.forEach((result, index) => {
      const key = keys[index];
      if (result.status === "fulfilled") {
        payload[key] = result.value;
        return;
      }
      if (Object.hasOwn(optionalRequests, key)) return;
      const description = `${key}: ${errorText(result.reason)}`;
      if (Object.hasOwn(companionRequests, key)) companionFailures.push(description);
      else coreFailures.push(description);
    });

    const campaigns = normalizeList(payload.campaigns, ["campaigns"]);
    const offers = normalizeList(payload.offers, ["offers"]);
    const companionAvailable = Boolean(payload.controls);
    setState({
      loading: false,
      error: coreFailures.length ? `Some data is unavailable: ${coreFailures.join(" · ")}` : "",
      companionError: companionFailures.length && companionAvailable
        ? `Some Workspace controls are unavailable: ${companionFailures.join(" · ")}`
        : "",
      companionAvailable,
      detail: activeWorkspace?.raw || activeWorkspace || null,
      stats: payload.stats || null,
      settings: payload.settings || null,
      controls: payload.controls || null,
      members: normalizeList(payload.members, ["members", "users"]).map(memberRecord),
      invites: normalizeList(payload.invites, ["invites", "pending_invites"]),
      activity: normalizeList(payload.activity, ["events"]).map(activityRecord),
      activitySummary: payload.activitySummary || null,
      decisions: normalizeList(payload.decisions, ["decisions"]).map(decisionRecord),
      documents: normalizeList(payload.documents, ["documents"]).map(documentRecord),
      assets: normalizeList(payload.assets, ["assets", "media_assets"]),
      workItems: [
        ...campaigns.map((item, index) => workRecord(item, "Campaign", index)),
        ...offers.map((item, index) => workRecord(item, "Offer", index)),
      ],
      tenantSummary: payload.tenantSummary || null,
      usage: payload.usage || null,
      billing: payload.billing || null,
      brandMemory: payload.brandMemory || null,
    });
  }, [activeWorkspace, activeWorkspaceId]);

  useEffect(() => { void load(); }, [load]);

  const documentBytes = normalizeNumber(
    state.tenantSummary?.collections?.documents?.total_size_bytes
  );
  const knownAssetBytes = state.assets.reduce(
    (total, item) => total + normalizeNumber(item?.size_bytes || item?.file_size),
    0
  );
  const storageUsed = documentBytes + knownAssetBytes;
  const storageLimit = normalizeNumber(
    state.billing?.limits?.storage_bytes || state.stats?.storage_limit_bytes
  );
  const summary = {
    memberCount: state.members.length,
    pendingInvites: state.invites.length,
    workCount: state.workItems.length,
    reviewCount: state.decisions.filter((item) => !["resolved", "archived"].includes(item.status)).length ||
      state.workItems.filter((item) => item.status === "review").length,
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
    refreshWorkspaces,
    reload: load,
  };
}
