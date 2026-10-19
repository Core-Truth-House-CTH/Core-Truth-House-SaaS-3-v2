export function getDiagnosticHistoryViewState({
  authLoaded = false,
  isSignedIn = false,
  workspaceLoading = false,
  workspaceInitialized = false,
  activeWorkspaceId = null,
  historyLoading = false,
  historyLoaded = false,
  historyError = "",
  resultCount = 0,
} = {}) {
  if (!authLoaded) return "checking-auth";
  if (!isSignedIn) return "signed-out";
  if (workspaceLoading || !workspaceInitialized) return "loading-workspace";
  if (!activeWorkspaceId) return "workspace-unavailable";
  if (historyLoading || !historyLoaded) return "loading-history";
  if (historyError) return "error";
  return resultCount > 0 ? "results" : "empty";
}
