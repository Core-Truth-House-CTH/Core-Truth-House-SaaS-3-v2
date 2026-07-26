import apiClient from "../../lib/apiClient";

export const WORKSPACE_ENDPOINTS = {
  settings: "/api/settings",
  tenantSummary: "/api/tenant-data/summary",
  tenantExport: "/api/tenant-data/full-export",
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
