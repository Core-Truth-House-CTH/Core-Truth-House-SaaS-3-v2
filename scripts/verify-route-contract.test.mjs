import test from "node:test";
import assert from "node:assert/strict";
import contractBase from "../docs/builds/foundation-truth/FOUNDATION-DATA-CONTRACT.json" with { type: "json" };
import { validateRouteContract } from "./verify-route-contract.mjs";

const canonical = contractBase.canonicalRoutes;
const legacyApp = contractBase.legacyCompatibility.map(({ route }) => ({ path: route, block: `{ path: "${route}" }` }));
const legacyRegistry = (phase) => contractBase.legacyCompatibility.map((entry) => ({
  path: entry.route,
  component: phase === "contract-only" ? entry.contractOnlyComponent : entry.implementationActiveComponent,
}));
const route = (path) => ({ path, block: `{ path: "${path}", requiredPlan: "foundation", gateType: "page" }` });
const redirects = new Map(contractBase.legacyCompatibility.filter((x) => x.approvedRedirect).map((x) => [x.implementationActiveComponent, x.approvedRedirect]));
const errors = (phase, count, options = {}) => validateRouteContract({
  contract: { ...contractBase, implementationPhase: phase },
  app: [...legacyApp, ...canonical.slice(0, count).map(route), ...(options.extraApp ?? [])],
  registry: [...legacyRegistry(phase), ...canonical.slice(0, count).map((path) => ({ path, component: "Page" })), ...(options.extraRegistry ?? [])],
  redirects,
});

test("contract-only accepts zero and rejects every partial or complete family", () => {
  assert.deepEqual(errors("contract-only", 0), []);
  for (let count = 1; count <= 8; count += 1) assert.notEqual(errors("contract-only", count).length, 0);
});
test("implementation-active requires all eight exact gated routes", () => {
  for (let count = 0; count < 8; count += 1) assert.notEqual(errors("implementation-active", count).length, 0);
  assert.deepEqual(errors("implementation-active", 8), []);
});
test("duplicates and unexpected variants fail", () => {
  assert.match(errors("implementation-active", 8, { extraApp: [route("/foundation")] }).join("\n"), /Duplicate/);
  assert.match(errors("implementation-active", 8, { extraRegistry: [{ path: "/foundation/other", component: "Page" }] }).join("\n"), /Unexpected/);
});
test("every protected legacy route has one phase-specific exact target", () => {
  for (const migration of contractBase.legacyCompatibility) {
    const bad = legacyRegistry("implementation-active").map((entry) => entry.path === migration.route ? { ...entry, component: "Wrong" } : entry);
    const result = validateRouteContract({ contract: { ...contractBase, implementationPhase: "implementation-active" }, app: [...legacyApp, ...canonical.map(route)], registry: [...bad, ...canonical.map((path) => ({ path, component: "Page" }))], redirects });
    assert.match(result.join("\n"), new RegExp(migration.route.replaceAll("/", "\\/")));
  }
});
