import { useCallback, useEffect, useRef, useState } from "react";
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

/*
 * Every slice below is derived from a tenant's API payload. On a workspace
 * change they are all cleared before anything renders, so the previous tenant's
 * counts, plan, settings, logo, or Brand Memory can never appear beneath the new
 * tenant's selector. `detail` is included: it carries the previous workspace's
 * raw record.
 */
const EMPTY_TENANT_SLICES = {
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
  companionAvailable: false,
  error: "",
  companionError: "",
};

const INITIAL_STATE = {
  loading: true,
  // The workspace whose payload is currently committed to state. Until this
  // equals the active workspace id, nothing on screen belongs to the active
  // tenant and no write may be attempted.
  loadedWorkspaceId: null,
  ...EMPTY_TENANT_SLICES,
};

export function useWorkspaceSuiteData() {
  const {
    activeWorkspaceId,
    activeWorkspace,
    workspaces,
    refreshWorkspaces,
  } = useWorkspace();
  const [state, setState] = useState(INITIAL_STATE);

  // Monotonic request ownership. Only the most recently started load may commit.
  const fetchSequenceRef = useRef(0);
  // Mirrors the active workspace id so an in-flight closure can test it against
  // the id that is current *now*, not the one captured when it started.
  const activeWorkspaceIdRef = useRef(activeWorkspaceId);
  activeWorkspaceIdRef.current = activeWorkspaceId;

  // Clearing during render (not in an effect) means the stale tenant payload is
  // never committed to the DOM, not even for a single frame.
  const [trackedWorkspaceId, setTrackedWorkspaceId] = useState(activeWorkspaceId);
  if (trackedWorkspaceId !== activeWorkspaceId) {
    setTrackedWorkspaceId(activeWorkspaceId);
    // Abandon any in-flight load belonging to the workspace we just left.
    fetchSequenceRef.current += 1;
    setState((current) => ({
      ...current,
      ...EMPTY_TENANT_SLICES,
      loading: true,
      loadedWorkspaceId: null,
    }));
  }

  const load = useCallback(async () => {
    // Claim ownership of this load and snapshot the tenant it belongs to.
    const requestId = (fetchSequenceRef.current += 1);
    const requestedWorkspaceId = activeWorkspaceId;
    const requestedWorkspace = activeWorkspace;
    const isCurrent = () =>
      requestId === fetchSequenceRef.current &&
      requestedWorkspaceId === activeWorkspaceIdRef.current;

    if (!requestedWorkspaceId) {
      setState((current) => ({
        ...current,
        ...EMPTY_TENANT_SLICES,
        loading: false,
        loadedWorkspaceId: null,
        error: "No active workspace is available.",
      }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "", companionError: "" }));
    const coreRequests = {
      stats: apiClient.get(API_PATHS.workspace.stats(requestedWorkspaceId)),
      settings: getWorkspaceSettings(),
      members: apiClient.get(API_PATHS.teams.members(requestedWorkspaceId)),
      invites: apiClient.get(API_PATHS.teams.pendingInvites(requestedWorkspaceId)),
      activitySummary: apiClient.get(API_PATHS.teams.activitySummary(requestedWorkspaceId)),
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

    // A load that no longer owns the sequence, or whose tenant is no longer
    // active, must not touch visible state - fulfilled or rejected.
    if (!isCurrent()) return;

    const campaigns = normalizeList(payload.campaigns, ["campaigns"]);
    const offers = normalizeList(payload.offers, ["offers"]);
    const companionAvailable = Boolean(payload.controls);
    setState({
      loading: false,
      loadedWorkspaceId: requestedWorkspaceId,
      error: coreFailures.length ? `Some data is unavailable: ${coreFailures.join(" · ")}` : "",
      companionError: companionFailures.length && companionAvailable
        ? `Some Workspace controls are unavailable: ${companionFailures.join(" · ")}`
        : "",
      companionAvailable,
      detail: requestedWorkspace?.raw || requestedWorkspace || null,
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

  /*
   * Refreshing the brand panel must not re-fetch (and therefore re-seed) the
   * whole Workspace, which would discard unsaved edits in the settings forms.
   * It obeys the same ownership rules and stays optional: a failure leaves the
   * panel's existing honest state alone.
   */
  const [brandMemoryRefreshing, setBrandMemoryRefreshing] = useState(false);
  const refreshBrandMemory = useCallback(async () => {
    const requestId = fetchSequenceRef.current;
    const requestedWorkspaceId = activeWorkspaceIdRef.current;
    if (!requestedWorkspaceId) return;

    setBrandMemoryRefreshing(true);
    let payload = null;
    try {
      payload = await apiClient.get(API_PATHS.persist.brandMemory);
    } catch {
      payload = null;
    }

    const stillCurrent =
      requestId === fetchSequenceRef.current &&
      requestedWorkspaceId === activeWorkspaceIdRef.current;
    setBrandMemoryRefreshing(false);
    if (!stillCurrent) return;

    setState((current) =>
      current.loadedWorkspaceId === requestedWorkspaceId
        ? { ...current, brandMemory: payload || null }
        : current
    );
  }, []);

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

  /*
   * The single condition every consumer must use before presenting tenant data
   * as authoritative, or attempting any write: the load has finished, what is
   * committed belongs to the workspace that is active right now, and a settings
   * payload actually arrived.
   */
  const dataReadyForActiveWorkspace =
    !state.loading &&
    state.loadedWorkspaceId === activeWorkspaceId &&
    Boolean(state.settings);

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
    refreshBrandMemory,
    brandMemoryRefreshing,
    dataReadyForActiveWorkspace,
  };
}
