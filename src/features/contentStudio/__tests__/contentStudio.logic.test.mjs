/**
 * Content Studio logic tests.
 *
 * Run with the Node test runner (Node 20+, no new dependencies):
 *   node --test src/features/contentStudio/__tests__/
 *
 * SCOPE NOTE: this project has no component-test tooling installed — no
 * vitest, jest, testing-library, or jsdom — and the task rules forbid adding
 * dependencies without proving the need. So these tests cover the pure logic
 * that carries the product rules (error classification, deletion permissions,
 * schema validation) and NOT React rendering. Component and route rendering
 * tests are listed as an outstanding gap in the session report; they require
 * an approved tooling addition.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CS_ERROR, classifyApiError, isEntitlementError, isPlanError } from "../utilities/errors.js";
import {
  canDeleteResource,
  canMutate,
  deleteDenialReason,
  isWorkspaceAdminRole,
} from "../utilities/permissions.js";

const err = (status, message = "") => Object.assign(new Error(message), { status });

/* ------------------------------------------------------------------ */
/* 402 vs 403 — the distinction the backend makes and the UI must keep */
/* ------------------------------------------------------------------ */

describe("error classification", () => {
  it("maps 402 to entitlement required, not an auth failure", () => {
    const result = classifyApiError(err(402, "Agents & Automations add-on or active trial required"));
    assert.equal(result.kind, CS_ERROR.ENTITLEMENT_REQUIRED);
    assert.notEqual(result.kind, CS_ERROR.UNAUTHENTICATED);
    assert.match(result.title, /add-on/i);
  });

  it("maps plan 403 to plan required, never to a payment failure", () => {
    const result = classifyApiError(err(403, "Estate plan required"));
    assert.equal(result.kind, CS_ERROR.PLAN_REQUIRED);
    assert.notEqual(result.kind, CS_ERROR.ENTITLEMENT_REQUIRED);
    assert.doesNotMatch(result.message, /payment|billing failed/i);
  });

  it("separates a permission 403 from a plan 403", () => {
    const permission = classifyApiError(
      err(403, "Only the creator or a workspace owner/admin may delete this resource"),
    );
    assert.equal(permission.kind, CS_ERROR.PERMISSION_DENIED);

    const membership = classifyApiError(err(403, "Workspace membership required"));
    assert.equal(membership.kind, CS_ERROR.PERMISSION_DENIED);
  });

  it("402 and 403 never classify as each other", () => {
    assert.equal(isEntitlementError(err(402)), true);
    assert.equal(isEntitlementError(err(403, "Estate plan required")), false);
    assert.equal(isPlanError(err(403, "Estate plan required")), true);
    assert.equal(isPlanError(err(402)), false);
  });

  it("404 copy does not disclose that a foreign-workspace resource exists", () => {
    const result = classifyApiError(err(404, "Agent not found"));
    assert.equal(result.kind, CS_ERROR.NOT_FOUND);
    assert.doesNotMatch(result.message, /another workspace|other workspace|exists/i);
  });

  it("maps 409 to conflict for a reused trial", () => {
    const result = classifyApiError(err(409, "Trial already used for this workspace"));
    assert.equal(result.kind, CS_ERROR.CONFLICT);
    assert.match(result.message, /already used/i);
  });

  it("maps 401, 422 and 5xx distinctly", () => {
    assert.equal(classifyApiError(err(401)).kind, CS_ERROR.UNAUTHENTICATED);
    assert.equal(classifyApiError(err(422)).kind, CS_ERROR.VALIDATION);
    assert.equal(classifyApiError(err(500)).kind, CS_ERROR.SERVER);
    assert.equal(classifyApiError(err(503)).kind, CS_ERROR.SERVER);
  });

  it("only offers retry where retrying could help", () => {
    assert.equal(classifyApiError(err(500)).retryable, true);
    assert.equal(classifyApiError(err(402)).retryable, false);
    assert.equal(classifyApiError(err(403, "Estate plan required")).retryable, false);
    assert.equal(classifyApiError(err(404)).retryable, false);
  });

  it("treats a status-less failure as a network error", () => {
    assert.equal(classifyApiError(new Error("boom")).kind, CS_ERROR.NETWORK);
  });
});

/* ------------------------------------------------------------------ */
/* Deletion permissions — mirrors backend _may_delete                  */
/* ------------------------------------------------------------------ */

describe("deletion permissions", () => {
  const creator = { userId: "user-a", role: "member", isSuperAdmin: false };
  const colleague = { userId: "user-b", role: "member", isSuperAdmin: false };
  const owner = { userId: "user-c", role: "owner", isSuperAdmin: false };
  const admin = { userId: "user-d", role: "admin", isSuperAdmin: false };
  const superAdmin = { userId: "root", role: "member", isSuperAdmin: true };

  const resource = { id: "agent-1", created_by: "user-a" };
  const legacy = { id: "agent-legacy" };

  it("lets the creator delete their own resource", () => {
    assert.equal(canDeleteResource(creator, resource), true);
  });

  it("does not let an ordinary member delete a colleague's resource", () => {
    assert.equal(canDeleteResource(colleague, resource), false);
  });

  it("lets workspace owner and admin delete workspace resources", () => {
    assert.equal(canDeleteResource(owner, resource), true);
    assert.equal(canDeleteResource(admin, resource), true);
  });

  it("lets a super admin delete", () => {
    assert.equal(canDeleteResource(superAdmin, resource), true);
  });

  it("treats legacy rows without created_by as owner/admin only", () => {
    assert.equal(canDeleteResource(creator, legacy), false);
    assert.equal(canDeleteResource(colleague, legacy), false);
    assert.equal(canDeleteResource(owner, legacy), true);
    assert.equal(canDeleteResource(admin, legacy), true);
    assert.equal(canDeleteResource(superAdmin, legacy), true);
  });

  it("does not match a blank creator against a blank viewer id", () => {
    assert.equal(canDeleteResource({ userId: "", role: "member" }, { created_by: "" }), false);
  });

  it("recognises only owner and admin as workspace admin roles", () => {
    assert.equal(isWorkspaceAdminRole("owner"), true);
    assert.equal(isWorkspaceAdminRole("Admin"), true);
    assert.equal(isWorkspaceAdminRole("editor"), false);
    assert.equal(isWorkspaceAdminRole("viewer"), false);
    assert.equal(isWorkspaceAdminRole(null), false);
  });

  it("explains why a delete control is unavailable", () => {
    assert.match(deleteDenialReason(colleague, resource), /created this/i);
    assert.match(deleteDenialReason(colleague, legacy), /owner or admin/i);
    assert.equal(deleteDenialReason(creator, resource), null);
  });
});

/* ------------------------------------------------------------------ */
/* Entitlement gate                                                    */
/* ------------------------------------------------------------------ */

describe("mutation entitlement", () => {
  it("permits mutation only when the backend says creation is allowed", () => {
    assert.equal(canMutate({ custom_creation_allowed: true }), true);
    assert.equal(canMutate({ custom_creation_allowed: false, estate_eligible: true }), false);
    assert.equal(canMutate({}), false);
    assert.equal(canMutate(null), false);
  });

  it("does not infer entitlement from Estate eligibility alone", () => {
    assert.equal(canMutate({ estate_eligible: true, trial_active: false, add_on_active: false }), false);
  });
});
