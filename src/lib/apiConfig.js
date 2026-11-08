import { assertPinnedApiTarget } from "./apiOriginPolicy.mjs";

export const isStagingApi = import.meta.env.MODE === "staging";
const pinnedOrigin = import.meta.env.CTH_STAGING_API_ORIGIN;

export function assertApiTarget(value, { originOnly = false } = {}) {
  if (isStagingApi) return assertPinnedApiTarget(value, pinnedOrigin, { originOnly });
  return value;
}

export function getApiBaseUrl({ productionFallback = false } = {}) {
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
  const candidates = [
    env.VITE_API_BASE_URL,
    env.VITE_BACKEND_URL,
    env.VITE_API_URL,
    typeof process !== "undefined" ? process?.env?.REACT_APP_API_BASE_URL : undefined,
    typeof process !== "undefined" ? process?.env?.REACT_APP_BACKEND_URL : undefined,
    typeof window !== "undefined" ? window.__API_BASE_URL__ : undefined,
    productionFallback ? env.CTH_API_FALLBACK : undefined,
  ];
  return String(candidates.find(value => value && value !== "undefined" && value !== "null") || "").trim().replace(/\/+$/, "");
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
