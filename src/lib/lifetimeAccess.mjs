// This value must come from the authenticated, workspace-scoped plan API.
// Workspace metadata, Clerk metadata and URL parameters cannot establish it.
export function verifiedLifetimeAccess(effectiveAccess) {
  return effectiveAccess?.plan === "estate" && effectiveAccess?.lifetime === true && effectiveAccess?.active === true;
}

export async function claimCohortSeat({ token, workspaceId, post, refreshWorkspaces, refreshPlan }) {
  if (!token || !workspaceId) throw new Error("A claim link and workspace are required.");
  const result = await post("/api/cohort/invite/redeem", { token, workspace_id: workspaceId });
  if (result?.success !== true || result?.workspace_id !== workspaceId) {
    throw new Error("Workspace access was not confirmed.");
  }
  // A successful grant is recoverable if either refresh fails: retain the claim token
  // until canonical access has refreshed, and retry the idempotent redemption.
  await refreshWorkspaces();
  const plan = await refreshPlan();
  if (!plan) throw new Error("Access refresh did not complete.");
}

const CLAIM_STORAGE_KEY = "cth.cohort.claim";
export function rememberClaimToken(token) {
  if (!token) throw new Error("A claim link is required.");
  sessionStorage.setItem(CLAIM_STORAGE_KEY, token);
}
export function readClaimToken() {
  try { return sessionStorage.getItem(CLAIM_STORAGE_KEY); } catch { return null; }
}
export function forgetClaimToken(token) {
  // An old in-flight claim must not erase a newer link in this tab.
  if (readClaimToken() === token) sessionStorage.removeItem(CLAIM_STORAGE_KEY);
}
