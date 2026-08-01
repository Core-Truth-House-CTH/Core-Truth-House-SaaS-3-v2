import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";
import { createServer } from "vite";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const vite = await createServer({ root, logLevel: "silent", define: { "import.meta.env": "{}" }, server: { middlewareMode: true }, appType: "custom" });
after(() => vite.close());

const {
  AUTHORITY_STATUS,
  EMPTY_AUTHORITY,
  createIdleAuthorityState,
  startAuthorityRequest,
  settleAuthorityIdle,
  failAuthorityRequest,
  resolveAuthorityRequest,
  getAuthorityStateView,
  getAuthorityRequestKey,
  executeAuthorityRequest,
  PlanAuthorityProvider,
  usePlan,
} = await vite.ssrLoadModule("/src/context/PlanContext.jsx");
const { hasBackendAdminAuthority } = await vite.ssrLoadModule("/src/admin/AdminProtectedRoute.jsx");

const authority = (overrides = {}) => ({
  user_id: "internal-42",
  clerk_user_id: "user-1",
  workspace_id: "workspace-1",
  plan: "house",
  plan_id: "house",
  subscription_status: "active",
  product_access_active: true,
  global_role: "MEMBER",
  workspace_role: "MEMBER",
  is_admin: false,
  is_super_admin: false,
  entitlements: [],
  limits: {},
  features: {},
  ...overrides,
});

const key = "user-1::workspace-1";
const loadingState = (generation = 1) =>
  startAuthorityRequest(createIdleAuthorityState(), key, generation);
const resolve = (state, data = authority(), overrides = {}) =>
  resolveAuthorityRequest(state, {
    key,
    generation: state.generation,
    data,
    clerkUserId: "user-1",
    workspaceId: "workspace-1",
    ...overrides,
  });

describe("PlanContext authority state machine", () => {
  it("keeps idle signed-out state closed and not loading", () => {
    const view = getAuthorityStateView(createIdleAuthorityState(), null);
    assert.equal(view.authorityStatus, AUTHORITY_STATUS.IDLE);
    assert.equal(view.authorityLoading, false);
    assert.equal(view.hasActivePlan, false);
    assert.equal(view.authority, EMPTY_AUTHORITY);
  });

  it("makes a repeated no-key transition idempotent", () => {
    const idle = createIdleAuthorityState(1);
    assert.equal(settleAuthorityIdle(idle, 2), idle);
    assert.equal(getAuthorityRequestKey(null, null), null);
  });

  it("does not create a request when only the auth wrapper identity changes", () => {
    const firstAuth = { getToken: async () => "token" };
    const secondAuth = { getToken: firstAuth.getToken };
    assert.notEqual(firstAuth, secondAuth);
    const requestKey = getAuthorityRequestKey("user-1", "workspace-1");
    const started = startAuthorityRequest(createIdleAuthorityState(), requestKey, 1);
    assert.equal(startAuthorityRequest(started, requestKey, 1), started);
  });

  it("starts one request for a current valid user and workspace key", () => {
    const requestKey = getAuthorityRequestKey("user-1", "workspace-1");
    const started = startAuthorityRequest(createIdleAuthorityState(), requestKey, 1);
    assert.equal(started.key, key);
    assert.equal(started.status, AUTHORITY_STATUS.LOADING);
  });

  it("starts a keyed request by clearing previous authority", () => {
    const resolved = resolve(loadingState());
    const next = startAuthorityRequest(resolved, key, 2);
    assert.equal(next.status, AUTHORITY_STATUS.LOADING);
    assert.equal(next.authority, EMPTY_AUTHORITY);
    assert.equal(getAuthorityStateView(next, key).authorityLoading, true);
  });

  it("resolves a valid current response and activates product access", () => {
    const state = resolve(loadingState());
    const view = getAuthorityStateView(state, key);
    assert.equal(view.authorityStatus, AUTHORITY_STATUS.RESOLVED);
    assert.equal(view.authorityLoading, false);
    assert.equal(view.planResolved, true);
    assert.equal(view.hasActivePlan, true);
  });

  it("makes a current API failure terminal and not loading", () => {
    const state = failAuthorityRequest(loadingState(), key, 1);
    const view = getAuthorityStateView(state, key);
    assert.equal(view.authorityStatus, AUTHORITY_STATUS.FAILED);
    assert.equal(view.authorityLoading, false);
    assert.equal(view.authorityFailed, true);
    assert.equal(view.hasActivePlan, false);
  });

  it("makes a tokenless production request terminal and not loading", async () => {
    const result = await executeAuthorityRequest({
      getToken: async () => null,
      fetchAuthority: async () => assert.fail("tokenless request must not call the API"),
    });
    assert.equal(result.type, "failed");
    const state = failAuthorityRequest(loadingState(7), key, 7);
    assert.deepEqual(
      getAuthorityStateView(state, key),
      {
        authority: EMPTY_AUTHORITY,
        authorityStatus: AUTHORITY_STATUS.FAILED,
        authorityLoading: false,
        authoritySettled: true,
        authorityFailed: true,
        planResolved: false,
        hasActivePlan: false,
      },
    );
  });

  it("makes a production API rejection terminal and not loading", async () => {
    const result = await executeAuthorityRequest({
      getToken: async () => "token",
      fetchAuthority: async () => { throw new Error("unavailable"); },
    });
    assert.equal(result.type, "failed");
    assert.equal(result.error.message, "unavailable");
    const view = getAuthorityStateView(failAuthorityRequest(loadingState(), key, 1), key);
    assert.equal(view.authorityFailed, true);
    assert.equal(view.authorityLoading, false);
  });

  it("ignores a late production completion after lifecycle cleanup", async () => {
    let ownsLifecycle = true;
    let completeRequest;
    const pending = executeAuthorityRequest({
      getToken: async () => "token",
      fetchAuthority: () => new Promise((resolveRequest) => { completeRequest = resolveRequest; }),
      ownsLifecycle: () => ownsLifecycle,
    });
    await Promise.resolve();
    ownsLifecycle = false;
    completeRequest(authority());
    assert.deepEqual(await pending, { type: "ignored" });
  });

  it("allows an explicit retry to start after failure", () => {
    const failed = failAuthorityRequest(loadingState(1), key, 1);
    const retry = startAuthorityRequest(failed, key, 2);
    assert.equal(retry.status, AUTHORITY_STATUS.LOADING);
    assert.equal(retry.generation, 2);
    assert.equal(retry.authority, EMPTY_AUTHORITY);
  });

  it("turns a malformed current response into failed authority", () => {
    const state = resolve(loadingState(), authority({ features: undefined }));
    assert.equal(state.status, AUTHORITY_STATUS.FAILED);
    assert.equal(state.authority, EMPTY_AUTHORITY);
  });

  it("ignores a stale successful response", () => {
    const current = startAuthorityRequest(loadingState(1), key, 2);
    const stale = resolveAuthorityRequest(current, {
      key,
      generation: 1,
      data: authority(),
      clerkUserId: "user-1",
      workspaceId: "workspace-1",
    });
    assert.equal(stale, current);
  });

  it("ignores a stale failed response", () => {
    const current = startAuthorityRequest(loadingState(1), key, 2);
    assert.equal(failAuthorityRequest(current, key, 1), current);
  });

  it("invalidates the prior request on a user switch", () => {
    const old = loadingState(1);
    const switched = startAuthorityRequest(old, "user-2::workspace-1", 2);
    const lateOld = resolveAuthorityRequest(switched, {
      key,
      generation: 1,
      data: authority(),
      clerkUserId: "user-1",
      workspaceId: "workspace-1",
    });
    assert.equal(lateOld, switched);
    assert.equal(getAuthorityStateView(switched, "user-2::workspace-1").hasActivePlan, false);
  });

  it("invalidates the prior request on a workspace switch", () => {
    const old = loadingState(1);
    const switched = startAuthorityRequest(old, "user-1::workspace-2", 2);
    assert.equal(failAuthorityRequest(switched, key, 1), switched);
    assert.equal(getAuthorityStateView(switched, "user-1::workspace-2").authorityLoading, true);
  });

  it("fails closed on a Clerk identity conflict", () => {
    assert.equal(resolve(loadingState(), authority({ clerk_user_id: "user-2" })).status, AUTHORITY_STATUS.FAILED);
  });

  it("fails closed on a workspace conflict", () => {
    assert.equal(resolve(loadingState(), authority({ workspace_id: "workspace-2" })).status, AUTHORITY_STATUS.FAILED);
  });

  it("fails closed on conflicting or unknown plans", () => {
    assert.equal(resolve(loadingState(), authority({ plan_id: "estate" })).status, AUTHORITY_STATUS.FAILED);
    assert.equal(resolve(loadingState(), authority({ plan: "unknown", plan_id: "unknown" })).status, AUTHORITY_STATUS.FAILED);
  });

  it("does not derive Admin flags from backend role strings", () => {
    const globalRole = resolve(loadingState(), authority({ global_role: "SUPER_ADMIN" }));
    assert.equal(globalRole.authority.isAdmin, false);
    assert.equal(globalRole.authority.isSuperAdmin, false);
    const workspaceRole = resolve(loadingState(2), authority({ workspace_role: "admin" }));
    assert.equal(workspaceRole.authority.isAdmin, false);
  });
});

const DOM_GLOBALS = [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "Event",
  "CustomEvent",
  "MutationObserver",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "IS_REACT_ACT_ENVIRONMENT",
];

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://app.coretruthhouse.test/",
  });
  const previous = new Map(
    DOM_GLOBALS.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );
  const values = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    MutationObserver: dom.window.MutationObserver,
    requestAnimationFrame: (callback) => setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [name, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  return () => {
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function mountedAuthority(initialProps, { strict = false } = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const snapshots = [];
  const transitions = [];
  let latest = null;
  let renderCount = 0;
  let currentProps = initialProps;

  function Probe() {
    const value = usePlan();
    latest = value;
    renderCount += 1;
    React.useEffect(() => {
      snapshots.push(value);
      if (transitions.at(-1) !== value.authorityStatus) transitions.push(value.authorityStatus);
    }, [value]);
    return null;
  }

  function element(props) {
    const provider = React.createElement(
      PlanAuthorityProvider,
      props,
      React.createElement(Probe),
    );
    return strict ? React.createElement(React.StrictMode, null, provider) : provider;
  }

  return {
    snapshots,
    transitions,
    get latest() { return latest; },
    get renderCount() { return renderCount; },
    async mount() {
      await act(async () => { root.render(element(currentProps)); });
    },
    async rerender(nextProps) {
      currentProps = nextProps;
      await act(async () => { root.render(element(currentProps)); });
    },
    async flush(callback) {
      await act(async () => {
        if (callback) callback();
        await Promise.resolve();
      });
    },
    async unmount() {
      await act(async () => { root.unmount(); });
      container.remove();
    },
  };
}

function responseFor({
  userId = "user-1",
  workspaceId = "workspace-1",
  plan = "house",
  productAccessActive = true,
  globalRole = "MEMBER",
  workspaceRole = "MEMBER",
  isAdmin = false,
  isSuperAdmin = false,
} = {}) {
  return authority({
    clerk_user_id: userId,
    workspace_id: workspaceId,
    plan,
    plan_id: plan,
    product_access_active: productAccessActive,
    global_role: globalRole,
    workspace_role: workspaceRole,
    is_admin: isAdmin,
    is_super_admin: isSuperAdmin,
  });
}

async function withMountedDom(run) {
  const restore = installDom();
  try {
    await run();
  } finally {
    restore();
  }
}

describe("mounted PlanAuthorityProvider lifecycle", () => {
  it("settles fallback signed-out auth without a render, effect, or request loop", async () => {
    await withMountedDom(async () => {
      let requests = 0;
      let effects = 0;
      const mounted = mountedAuthority({
        userId: null,
        isUserLoaded: true,
        authLoaded: true,
        workspaceInitialized: true,
        activeWorkspaceId: null,
        getToken: async () => null,
        fetchAuthority: async () => { requests += 1; },
        onAuthorityEffect: () => { effects += 1; },
      });
      await mounted.mount();
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.IDLE);
      assert.equal(mounted.latest.loading, false);
      assert.equal(mounted.latest.hasActivePlan, false);
      assert.equal(mounted.latest.isAdmin, false);
      assert.equal(requests, 0);
      assert.equal(effects, 1);
      assert.equal(mounted.renderCount, 1);
      assert.deepEqual(mounted.transitions, [AUTHORITY_STATUS.IDLE]);
      await mounted.unmount();
    });
  });

  it("ignores unstable auth wrapper identities for no-key and current-key renders", async () => {
    await withMountedDom(async () => {
      let requests = 0;
      let effects = 0;
      const stableToken = async () => "token";
      const fetchAuthority = async () => {
        requests += 1;
        return responseFor();
      };
      const base = {
        userId: null,
        activeWorkspaceId: null,
        getToken: () => stableToken(),
        fetchAuthority,
        onAuthorityEffect: () => { effects += 1; },
      };
      const mounted = mountedAuthority(base);
      await mounted.mount();
      await mounted.rerender({ ...base, getToken: () => stableToken() });
      assert.equal(requests, 0);

      const keyed = { ...base, userId: "user-1", activeWorkspaceId: "workspace-1" };
      await mounted.rerender(keyed);
      assert.equal(requests, 1);
      await mounted.rerender({ ...keyed, getToken: () => stableToken() });
      assert.equal(requests, 1);
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
      assert.equal(effects, 2);
      assert.ok(mounted.renderCount < 12, `render count ${mounted.renderCount}`);
      await mounted.unmount();
    });
  });

  it("remains deterministic under StrictMode effect replay", async () => {
    await withMountedDom(async () => {
      let requests = 0;
      let effects = 0;
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: async () => "token",
        fetchAuthority: async () => {
          requests += 1;
          return responseFor();
        },
        onAuthorityEffect: () => { effects += 1; },
      }, { strict: true });
      await mounted.mount();
      assert.equal(requests, 1);
      assert.equal(effects, 2);
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
      assert.equal(mounted.latest.hasActivePlan, true);
      assert.equal(mounted.latest.clerk_user_id, undefined);
      assert.ok(mounted.renderCount < 16, `render count ${mounted.renderCount}`);
      await mounted.unmount();
    });
  });

  it("renders loading then terminal failure for a tokenless request", async () => {
    await withMountedDom(async () => {
      const token = deferred();
      let requests = 0;
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: () => token.promise,
        fetchAuthority: async () => { requests += 1; },
      });
      await mounted.mount();
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.LOADING);
      assert.equal(mounted.latest.loading, true);
      await mounted.flush(() => token.resolve(null));
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.FAILED);
      assert.equal(mounted.latest.loading, false);
      assert.equal(mounted.latest.hasActivePlan, false);
      assert.equal(mounted.latest.isAdmin, false);
      assert.equal(requests, 0);
      await mounted.unmount();
    });
  });

  it("reaches terminal failure and clears access after API rejection", async () => {
    await withMountedDom(async () => {
      const api = deferred();
      const consoleErrors = [];
      const originalConsoleError = console.error;
      console.error = (...args) => consoleErrors.push(args);
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: async () => "token",
        fetchAuthority: () => api.promise,
      });
      try {
        await mounted.mount();
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.LOADING);
        await mounted.flush(() => api.reject(new Error("offline")));
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.FAILED);
        assert.equal(mounted.latest.loading, false);
        assert.equal(mounted.latest.hasActivePlan, false);
        assert.equal(mounted.latest.isAdmin, false);
        assert.equal(consoleErrors.length, 1);
      } finally {
        console.error = originalConsoleError;
        await mounted.unmount();
      }
    });
  });

  it("resolves a valid current Backend PR #4 response", async () => {
    await withMountedDom(async () => {
      const api = deferred();
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: async () => "token",
        fetchAuthority: () => api.promise,
      });
      await mounted.mount();
      await mounted.flush(() => api.resolve(responseFor({ productAccessActive: true, isAdmin: true })));
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
      assert.equal(mounted.latest.plan, "house");
      assert.equal(mounted.latest.hasActivePlan, true);
      assert.equal(mounted.latest.isAdmin, true);
      assert.equal(hasBackendAdminAuthority(mounted.latest), true);
      await mounted.unmount();
    });
  });

  it("retries once after failure and resolves only the retry", async () => {
    await withMountedDom(async () => {
      const retry = deferred();
      let requests = 0;
      const consoleErrors = [];
      const originalConsoleError = console.error;
      console.error = (...args) => consoleErrors.push(args);
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: async () => "token",
        fetchAuthority: async () => {
          requests += 1;
          if (requests === 1) throw new Error("first failed");
          return retry.promise;
        },
      });
      try {
        await mounted.mount();
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.FAILED);
        await act(async () => { void mounted.latest.refreshPlan(); });
        assert.equal(requests, 2);
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.LOADING);
        await mounted.flush(() => retry.resolve(responseFor()));
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
        assert.equal(mounted.latest.hasActivePlan, true);
        assert.equal(consoleErrors.length, 1);
      } finally {
        console.error = originalConsoleError;
        await mounted.unmount();
      }
    });
  });

  it("accepts only workspace B after a late workspace A success", async () => {
    await withMountedDom(async () => {
      const requests = new Map();
      const fetchAuthority = ({ workspaceId }) => {
        const request = deferred();
        requests.set(workspaceId, request);
        return request.promise;
      };
      const base = {
        userId: "user-1",
        activeWorkspaceId: "workspace-a",
        getToken: async () => "token",
        fetchAuthority,
      };
      const mounted = mountedAuthority(base);
      await mounted.mount();
      await mounted.rerender({ ...base, activeWorkspaceId: "workspace-b" });
      assert.equal(mounted.latest.hasActivePlan, false);
      await mounted.flush(() => requests.get("workspace-a").resolve(responseFor({ workspaceId: "workspace-a" })));
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.LOADING);
      await mounted.flush(() => requests.get("workspace-b").resolve(responseFor({ workspaceId: "workspace-b" })));
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
      assert.equal(mounted.latest.hasActivePlan, true);
      await mounted.unmount();
    });
  });

  it("ignores a late workspace A failure after switching to B", async () => {
    await withMountedDom(async () => {
      const requests = new Map();
      const fetchAuthority = ({ workspaceId }) => {
        const request = deferred();
        requests.set(workspaceId, request);
        return request.promise;
      };
      const base = { userId: "user-1", activeWorkspaceId: "workspace-a", getToken: async () => "token", fetchAuthority };
      const mounted = mountedAuthority(base);
      const originalConsoleError = console.error;
      console.error = () => {};
      try {
        await mounted.mount();
        await mounted.rerender({ ...base, activeWorkspaceId: "workspace-b" });
        await mounted.flush(() => requests.get("workspace-a").reject(new Error("late A")));
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.LOADING);
        await mounted.flush(() => requests.get("workspace-b").resolve(responseFor({ workspaceId: "workspace-b" })));
        assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
      } finally {
        console.error = originalConsoleError;
        await mounted.unmount();
      }
    });
  });

  it("accepts only user B after switching during user A request", async () => {
    await withMountedDom(async () => {
      const requests = new Map();
      let currentUser = "user-a";
      const fetchAuthority = () => {
        const request = deferred();
        requests.set(currentUser, request);
        return request.promise;
      };
      const base = { userId: currentUser, activeWorkspaceId: "workspace-1", getToken: async () => "token", fetchAuthority };
      const mounted = mountedAuthority(base);
      await mounted.mount();
      currentUser = "user-b";
      await mounted.rerender({ ...base, userId: currentUser });
      assert.equal(mounted.latest.hasActivePlan, false);
      await mounted.flush(() => requests.get("user-a").resolve(responseFor({ userId: "user-a" })));
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.LOADING);
      await mounted.flush(() => requests.get("user-b").resolve(responseFor({ userId: "user-b" })));
      assert.equal(mounted.latest.authorityStatus, AUTHORITY_STATUS.RESOLVED);
      await mounted.unmount();
    });
  });

  it("suppresses completion after unmount during token wait", async () => {
    await withMountedDom(async () => {
      const token = deferred();
      let requests = 0;
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: () => token.promise,
        fetchAuthority: async () => { requests += 1; },
      });
      await mounted.mount();
      const transitionsBeforeUnmount = mounted.snapshots.length;
      await mounted.unmount();
      token.resolve("token");
      await token.promise;
      await Promise.resolve();
      assert.equal(requests, 0);
      assert.equal(mounted.snapshots.length, transitionsBeforeUnmount);
    });
  });

  it("suppresses API resolve and reject after unmount", async () => {
    await withMountedDom(async () => {
      for (const mode of ["resolve", "reject"]) {
        const api = deferred();
        const mounted = mountedAuthority({
          userId: "user-1",
          activeWorkspaceId: "workspace-1",
          getToken: async () => "token",
          fetchAuthority: () => api.promise,
        });
        await mounted.mount();
        const transitionsBeforeUnmount = mounted.snapshots.length;
        await mounted.unmount();
        if (mode === "resolve") api.resolve(responseFor());
        else api.reject(new Error("late rejection"));
        await api.promise.catch(() => {});
        await Promise.resolve();
        assert.equal(mounted.snapshots.length, transitionsBeforeUnmount);
      }
    });
  });

  it("uses only mounted backend Admin flags despite role inconsistencies", async () => {
    await withMountedDom(async () => {
      let scenario = responseFor({ globalRole: "ADMIN" });
      const mounted = mountedAuthority({
        userId: "user-1",
        activeWorkspaceId: "workspace-1",
        getToken: async () => "token",
        fetchAuthority: async () => scenario,
      });
      await mounted.mount();
      assert.equal(hasBackendAdminAuthority(mounted.latest), false);

      const cases = [
        responseFor({ userId: "user-2", globalRole: "SUPER_ADMIN" }),
        responseFor({ userId: "user-3", workspaceRole: "admin" }),
        responseFor({ userId: "user-4", globalRole: "admin" }),
        responseFor({ userId: "user-5", isAdmin: true }),
        responseFor({ userId: "user-6", isSuperAdmin: true }),
      ];
      for (let index = 0; index < cases.length; index += 1) {
        scenario = cases[index];
        const userId = `user-${index + 2}`;
        await mounted.rerender({
          userId,
          activeWorkspaceId: "workspace-1",
          getToken: async () => "token",
          fetchAuthority: async () => scenario,
        });
        const shouldAllow = index >= 3;
        assert.equal(hasBackendAdminAuthority(mounted.latest), shouldAllow, userId);
      }
      await mounted.unmount();
    });
  });
});
