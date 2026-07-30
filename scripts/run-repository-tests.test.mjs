import test from "node:test";
import assert from "node:assert/strict";
import { discoverTrackedTests } from "./run-repository-tests.mjs";

test("discovers conventional tests repository-wide and deterministically", () => {
  const files = [
    "packages/zeta/tests/nested.test.tsx", "functions/test/handler.spec.cjs",
    "tooling/check.test.ts", "scripts/policy.test.mjs", "src/x.test.jsx",
    "tests/root.js", "test/root.ts", "packages/alpha/__tests__/unit.js",
  ];
  assert.deepEqual(discoverTrackedTests(files), [...files].sort((a, b) => a.localeCompare(b, "en")));
});
test("excludes dependencies, generated output, fixtures, vendor, and archives", () => {
  assert.deepEqual(discoverTrackedTests([
    "node_modules/x/a.test.js", "dist/a.test.js", "generated/a.test.js",
    "vendor/a.test.js", "fixtures/a.test.js", "archive/a.test.js", "src/not-a-test.js",
  ]), []);
});
