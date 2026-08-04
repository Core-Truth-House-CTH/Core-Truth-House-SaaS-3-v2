import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";
import { createServer } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const vite = await createServer({ root, logLevel: "silent", define: { "import.meta.env": "{}" }, server: { middlewareMode: true }, appType: "custom" });
after(() => vite.close());
const { getPlanGateDecision } = await vite.ssrLoadModule("/src/components/PlanGate.jsx");

const decision = (overrides = {}) => getPlanGateDecision({
  authorityLoading: false,
  authoritySettled: true,
  hasActivePlan: true,
  plan: "house",
  route: "/dashboard",
  ...overrides,
});

describe("PlanGate production access decisions", () => {
  it("does not expose paid content while authority is loading", () => {
    assert.equal(decision({ authorityLoading: true }), "loading");
  });

  it("denies failed or otherwise unsettled authority", () => {
    assert.equal(decision({ authoritySettled: false, hasActivePlan: false }), "denied");
  });

  it("denies resolved inactive product access", () => {
    assert.equal(decision({ hasActivePlan: false }), "denied");
  });

  it("allows resolved active access when the plan hierarchy matches", () => {
    assert.equal(decision({ plan: "foundation", route: "/dashboard" }), "allowed");
    assert.equal(decision({ plan: "house", route: "/signal-inbox" }), "allowed");
  });

  it("denies plans below the route requirement", () => {
    assert.equal(decision({ plan: "foundation", route: "/signal-inbox" }), "denied");
  });

  it("denies malformed and unknown plans", () => {
    assert.equal(decision({ plan: null }), "denied");
    assert.equal(decision({ plan: "platinum" }), "denied");
  });
});
