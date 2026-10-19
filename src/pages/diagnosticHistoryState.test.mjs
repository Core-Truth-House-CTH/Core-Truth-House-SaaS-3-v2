import test from "node:test";
import assert from "node:assert/strict";
import { getDiagnosticHistoryViewState } from "./diagnosticHistoryState.mjs";

const ready = {
  authLoaded: true,
  isSignedIn: true,
  workspaceInitialized: true,
  activeWorkspaceId: "workspace-a",
  historyLoaded: true,
};

test("history stays in a loading state while auth, workspace, or history is pending", () => {
  assert.equal(getDiagnosticHistoryViewState({ ...ready, authLoaded: false }), "checking-auth");
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, workspaceInitialized: false }),
    "loading-workspace",
  );
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, workspaceLoading: true }),
    "loading-workspace",
  );
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, historyLoaded: false }),
    "loading-history",
  );
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, historyLoading: true }),
    "loading-history",
  );
});

test("missing workspace and history failures never render the empty state", () => {
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, activeWorkspaceId: null, resultCount: 0 }),
    "workspace-unavailable",
  );
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, historyError: "Unauthorized", resultCount: 0 }),
    "error",
  );
});

test("the empty state only follows a successful empty history response", () => {
  assert.equal(getDiagnosticHistoryViewState({ ...ready, resultCount: 0 }), "empty");
  assert.equal(getDiagnosticHistoryViewState({ ...ready, resultCount: 1 }), "results");
  assert.equal(
    getDiagnosticHistoryViewState({ ...ready, isSignedIn: false }),
    "signed-out",
  );
});
