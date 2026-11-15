import { assertPinnedApiTarget } from "./apiOriginPolicy.mjs";

export const isStagingApi = import.meta.env.MODE === "staging";
const pinnedOrigin = import.meta.env.CTH_STAGING_API_ORIGIN;

export function assertApiTarget(value, { originOnly = false } = {}) {
  if (isStagingApi) return assertPinnedApiTarget(value, pinnedOrigin, { originOnly });
  return value;
}

export function getApiBaseUrl() {
  const env = import.meta.env;
  if (isStagingApi) {
    for (const key of ["VITE_API_BASE_URL", "VITE_BACKEND_URL", "VITE_API_URL"]) {
      assertPinnedApiTarget(env[key], pinnedOrigin, { originOnly: true });
    }
    if (typeof window !== "undefined" && window.__API_BASE_URL__ != null) {
      throw new Error("Runtime API overrides are disabled in staging.");
    }
    return pinnedOrigin;
  }
  const value = String(env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!value || value === "undefined" || value === "null") {
    throw new Error("VITE_API_BASE_URL is not set. The API origin must be provided at build time.");
  }
  return value;
}

/** Raw internal API requests share the same origin and redirect policy as ApiClient. */
export function apiFetch(url, options = {}) {
  if (isStagingApi) {
    getApiBaseUrl(); // Recheck runtime overrides immediately before dispatch.
    assertApiTarget(url);
    return fetch(url, { ...options, redirect: "error" });
  }
  return fetch(url, options);
}
