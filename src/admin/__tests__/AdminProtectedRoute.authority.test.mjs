import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";
import { createServer } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const vite = await createServer({ root, logLevel: "silent", define: { "import.meta.env": "{}" }, server: { middlewareMode: true }, appType: "custom" });
after(() => vite.close());
const { getAdminRouteDecision } = await vite.ssrLoadModule("/src/admin/AdminProtectedRoute.jsx");

const memberAuthority = {
  authorityLoading: false,
  planResolved: true,
  isAdmin: false,
  isSuperAdmin: false,
  userRole: "MEMBER",
  globalRole: "MEMBER",
  workspaceRole: "MEMBER",
};

const decision = (overrides = {}) => getAdminRouteDecision({
  clerkLoaded: true,
  user: { id: "user-1" },
  authority: memberAuthority,
  ...overrides,
});

describe("AdminProtectedRoute production decisions", () => {
  it("redirects a signed-out user after Clerk has loaded", () => {
    assert.equal(decision({ user: null, authority: { authorityLoading: true } }), "sign-in");
  });

  it("does not treat signed-out state as entitlement loading", () => {
    assert.notEqual(decision({ user: null, authority: { authorityLoading: true } }), "authority-loading");
  });

  it("shows loading for a signed-in current authority request", () => {
    assert.equal(decision({ authority: { authorityLoading: true } }), "authority-loading");
  });

  it("denies failed authority", () => {
    assert.equal(decision({ authority: { ...memberAuthority, planResolved: false, authorityFailed: true } }), "denied");
  });

  it("allows backend is_admin authority", () => {
    assert.equal(decision({ authority: { ...memberAuthority, isAdmin: true } }), "allowed");
  });

  it("allows backend is_super_admin authority", () => {
    assert.equal(decision({ authority: { ...memberAuthority, isSuperAdmin: true } }), "allowed");
  });

  it("denies when both backend Admin flags are false", () => {
    assert.equal(decision(), "denied");
  });

  for (const [label, authorityField] of [
    ["global_role ADMIN", { globalRole: "ADMIN" }],
    ["global_role SUPER_ADMIN", { globalRole: "SUPER_ADMIN" }],
    ["workspace_role admin", { workspaceRole: "admin" }],
    ["derived userRole admin", { userRole: "admin" }],
  ]) {
    it(`denies ${label} when both flags are false`, () => {
      assert.equal(decision({ authority: { ...memberAuthority, ...authorityField } }), "denied");
    });
  }

  it("ignores Clerk metadata", () => {
    assert.equal(decision({ user: { id: "user-1", publicMetadata: { is_admin: true, global_role: "SUPER_ADMIN" } } }), "denied");
  });

  it("ignores workspace ownership", () => {
    assert.equal(decision({ authority: { ...memberAuthority, owner_id: "user-1" } }), "denied");
  });

  it("ignores admin_notes", () => {
    assert.equal(decision({ authority: { ...memberAuthority, admin_notes: "super administrator" } }), "denied");
  });

  it("ignores updated_by_role", () => {
    assert.equal(decision({ authority: { ...memberAuthority, updated_by_role: "SUPER_ADMIN" } }), "denied");
  });
});
