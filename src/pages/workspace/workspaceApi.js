import apiClient from "../../lib/apiClient";

export const WORKSPACE_ENDPOINTS = {
  settings: "/api/settings",
  tenantSummary: "/api/tenant-data/summary",
  tenantExport: "/api/tenant-data/full-export",
  controls: "/api/workspace-controls",
  workbench: "/api/workspace-controls/workbench",
  decisions: "/api/workspace-controls/decisions",
  decision: (decisionId) => `/api/workspace-controls/decisions/${encodeURIComponent(decisionId)}`,
  activity: "/api/workspace-controls/activity",
  supportConsent: "/api/workspace-controls/support-consent",
  clientWorkspaces: "/api/workspace-controls/client-workspaces",
  deletionRequests: "/api/workspace-controls/deletion-requests",
  integrations: {
    higgsfield: "/api/integrations/higgsfield",
    openai: "/api/integrations/openai",
    fal: "/api/integrations/fal",
  },
};

const ALLOWED_SETTINGS_FIELDS = new Set([
  "workspace_name",
  "timezone",
  "locale",
  "brand_visibility",
  "notification_mode",
  "custom_domain",
  "logo_url",
  "primary_color",
  "secondary_color",
]);

export async function getWorkspaceSettings() {
  const payload = await apiClient.get(WORKSPACE_ENDPOINTS.settings);
  return payload?.settings || payload || {};
}

export async function patchWorkspaceSettings(patch) {
  const payload = Object.fromEntries(
    Object.entries(patch || {}).filter(
      ([key, value]) => ALLOWED_SETTINGS_FIELDS.has(key) && value !== undefined
    )
  );

  if (!Object.keys(payload).length) {
    throw new Error("This control does not have a supported workspace settings endpoint yet.");
  }

  const result = await apiClient.patch(WORKSPACE_ENDPOINTS.settings, payload);
  return result?.settings || result || {};
}

export async function getTenantSummary() {
  return apiClient.get(WORKSPACE_ENDPOINTS.tenantSummary);
}

export async function getWorkspaceControls() {
  const payload = await apiClient.get(WORKSPACE_ENDPOINTS.controls);
  return payload?.controls || payload || {};
}

export async function patchWorkspaceWorkbench(patch) {
  const payload = await apiClient.patch(WORKSPACE_ENDPOINTS.workbench, patch);
  return payload?.controls || payload || {};
}

export async function getWorkspaceDecisions() {
  const payload = await apiClient.get(WORKSPACE_ENDPOINTS.decisions);
  return Array.isArray(payload?.decisions) ? payload.decisions : [];
}

export async function createWorkspaceDecision(payload) {
  const result = await apiClient.post(WORKSPACE_ENDPOINTS.decisions, payload);
  return result?.decision || result;
}

export async function updateWorkspaceDecision(decisionId, patch) {
  const result = await apiClient.patch(WORKSPACE_ENDPOINTS.decision(decisionId), patch);
  return result?.decision || result;
}

export async function getWorkspaceActivity() {
  const payload = await apiClient.get(WORKSPACE_ENDPOINTS.activity);
  return Array.isArray(payload?.events) ? payload.events : [];
}

export async function updateSupportConsent(payload) {
  const result = await apiClient.put(WORKSPACE_ENDPOINTS.supportConsent, payload);
  return result?.support_consent || result;
}

export async function createClientWorkspace(payload) {
  const result = await apiClient.post(WORKSPACE_ENDPOINTS.clientWorkspaces, payload);
  return result?.workspace || result;
}

export async function requestWorkspaceDeletion(payload) {
  const result = await apiClient.post(WORKSPACE_ENDPOINTS.deletionRequests, payload);
  return result?.deletion_request || result;
}

export async function downloadTenantExport(workspaceName = "workspace") {
  const payload = await apiClient.get(WORKSPACE_ENDPOINTS.tenantExport);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(workspaceName || "workspace")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return payload;
}

export async function getIntegrationStatuses() {
  const entries = Object.entries(WORKSPACE_ENDPOINTS.integrations);
  const settled = await Promise.allSettled(
    entries.map(([, path]) => apiClient.get(path))
  );

  return Object.fromEntries(
    settled.map((result, index) => {
      const [provider] = entries[index];
      if (result.status === "fulfilled") {
        return [provider, { available: true, ...result.value }];
      }
      return [provider, { available: false, connected: false }];
    })
  );
}

export async function disconnectSupportedIntegrations() {
  const entries = Object.entries(WORKSPACE_ENDPOINTS.integrations);
  const settled = await Promise.allSettled(
    entries.map(([, path]) => apiClient.delete(path))
  );
  const failed = settled.filter((result) => result.status === "rejected");
  if (failed.length === settled.length) {
    throw failed[0]?.reason || new Error("No supported integration could be disconnected.");
  }
  return { disconnected: settled.length - failed.length, failed: failed.length };
}
