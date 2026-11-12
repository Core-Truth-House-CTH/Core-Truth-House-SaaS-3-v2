import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STAGING_API_ORIGIN, validateStagingEnv, scanArtifact, assertArtifactClean } from "../scripts/staging-build-guard.mjs";
import { productionApiOrigin } from "../config/production-api.mjs";

const goodEnv = {
  VITE_API_BASE_URL: STAGING_API_ORIGIN,
  VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_a",
  VITE_CLERK_PUBLISHABLE_KEY: "pk_test_b",
};

test("a correct staging environment passes", () => {
  assert.equal(validateStagingEnv(goodEnv), STAGING_API_ORIGIN);
  assert.equal(validateStagingEnv({ ...goodEnv, VITE_API_URL: STAGING_API_ORIGIN }), STAGING_API_ORIGIN);
});

test("the API origin must match exactly", () => {
  for (const bad of [undefined, "", productionApiOrigin, STAGING_API_ORIGIN + "/", STAGING_API_ORIGIN.toUpperCase(),
    "http://staging-api.coretruthhouse.com", "https://staging-api.coretruthhouse.com:8443",
    "https://staging-api.coretruthhouse.com.evil.example", "https://evil-staging-api.coretruthhouse.com"]) {
    assert.throws(() => validateStagingEnv({ ...goodEnv, VITE_API_BASE_URL: bad }), /VITE_API_BASE_URL must be exactly/, String(bad));
  }
});

test("alternate API settings may not point elsewhere", () => {
  for (const key of ["VITE_BACKEND_URL", "VITE_API_URL"]) {
    assert.throws(() => validateStagingEnv({ ...goodEnv, [key]: productionApiOrigin }), new RegExp(key));
  }
});

test("live or missing publishable keys are refused", () => {
  for (const key of ["VITE_STRIPE_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY"]) {
    assert.throws(() => validateStagingEnv({ ...goodEnv, [key]: "pk_live_x" }), /test key/);
    assert.throws(() => validateStagingEnv({ ...goodEnv, [key]: "" }), /test key/);
  }
});

function artifact(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cth-scan-"));
  for (const [name, text] of Object.entries({ "index.html": "<html></html>", ...files })) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  return dir;
}

test("a clean staging artifact passes the scan", () => {
  const dir = artifact({ "assets/a.js": `fetch("${STAGING_API_ORIGIN}/health")` });
  assert.equal(assertArtifactClean(dir).findings.length, 0);
});

test("the production API address is caught anywhere in the artifact", () => {
  for (const [file, text] of [
    ["assets/a.js", `const b="${productionApiOrigin}"`],
    ["assets/b.js", "x='https://API.CORETRUTHHOUSE.COM/api'"],
    ["index.html", "<link href=//api.coretruthhouse.com>"],
    ["assets/c.css", "@import url(https://api.coretruthhouse.com/x.css)"],
  ]) {
    const dir = artifact({ "assets/ok.js": STAGING_API_ORIGIN, [file]: text });
    assert.ok(scanArtifact(dir).findings.some(f => f.what === "production API address"), file);
    assert.throws(() => assertArtifactClean(dir), /Staging scan FAILED/);
  }
});

test("production Clerk address and live keys are caught", () => {
  for (const text of ["https://clerk.coretruthhouse.com/v1", "pk_live_Y2xlcmsu", "sk_live_abc", "rk_live_abc"]) {
    const dir = artifact({ "assets/ok.js": STAGING_API_ORIGIN, "assets/x.js": text });
    assert.throws(() => assertArtifactClean(dir), /Staging scan FAILED/, text);
  }
});

test("an artifact that never mentions the staging API address fails", () => {
  const dir = artifact({ "assets/a.js": "console.log(1)" });
  assert.throws(() => assertArtifactClean(dir), /not found in the artifact/);
});

test("source code has no hardcoded production API address outside config/production-api.mjs", () => {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
  const hits = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.(jsx?|tsx?|css)$/.test(e.name) && /api\.coretruthhouse\.com/i.test(fs.readFileSync(f, "utf8"))) hits.push(f);
  });
  walk(src);
  assert.deepEqual(hits, []);
});
