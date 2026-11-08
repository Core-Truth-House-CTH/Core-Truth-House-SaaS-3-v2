import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { loadEnv, loadConfigFromFile } from "vite";
import {
  API_KEYS, assertNoProduction, canonicalOrigin, readPinnedOrigin,
  validateApiEnvironment, inspectRawStagingInputs, preflightStaging,
  scanStagingSources, validateResolvedStagingConfig, assertIsolatedOutput,
  scanStagingOutput, writeStagingManifest, verifyStagingManifest,
} from "../scripts/staging-api-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://reviewed-stage.example.invalid";
const production = "https://api.coretruthhouse.com";
const validEnv = () => Object.fromEntries(API_KEYS.map(key => [key, origin]));
function fixture(t) {
  fs.mkdirSync(path.join(root, ".artifacts"), { recursive: true });
  const directory = fs.mkdtempSync(path.join(root, ".artifacts/guard-test-"));
  fs.mkdirSync(path.join(directory, "config"));
  fs.writeFileSync(path.join(directory, "config/staging-api.json"), JSON.stringify({ origin, reviewed: true }));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function outputFixture(t) {
  const directory = fixture(t);
  const output = path.join(directory, ".artifacts/staging/fixture");
  fs.mkdirSync(path.join(output, "assets"), { recursive: true });
  fs.writeFileSync(path.join(output, "index.html"), '<html><head></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></body></html>');
  fs.writeFileSync(path.join(output, "assets/app.js"), 'export const api = "' + origin + '";');
  fs.writeFileSync(path.join(output, "assets/app.css"), "body { color: purple; }");
  return { directory, output };
}
function resolvedConfig(directory, output) {
  return {
    mode: "staging", command: "build", root: directory, envDir: directory, envPrefix: "VITE_",
    env: { ...validEnv(), MODE: "staging" },
    build: { outDir: output }, server: {}, preview: {}, publicDir: path.join(directory, "public"),
    define: { "import.meta.env.CTH_STAGING_API_ORIGIN": JSON.stringify(origin), "import.meta.env.CTH_API_FALLBACK": '""' },
  };
}

test("valid independently reviewed fixture passes with Vite's actual environment loading", t => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, ".env.staging"), API_KEYS.map(key => key + "=" + origin).join("\n"));
  assert.equal(preflightStaging({ root: directory, env: loadEnv("staging", directory, "VITE_"), shell: {} }), origin);
});
test("repository staging policy is intentionally unverified", () => assert.throws(() => readPinnedOrigin(root), /unverified/));
test("missing, null and unreviewed policy cannot be self-approved by environment", t => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, "config/staging-api.json"), JSON.stringify({ origin: null, reviewed: true }));
  assert.throws(() => preflightStaging({ root: directory, env: validEnv(), shell: { EXPECTED_STAGING_API: origin } }));
  fs.writeFileSync(path.join(directory, "config/staging-api.json"), JSON.stringify({ origin, reviewed: false }));
  assert.throws(() => readPinnedOrigin(directory), /unverified/);
  fs.unlinkSync(path.join(directory, "config/staging-api.json"));
  assert.throws(() => readPinnedOrigin(directory), /missing/);
});
for (const key of API_KEYS) {
  for (const value of [undefined, "", production, "https://foreign.example.invalid"]) {
    test(key + " rejects " + (value === production ? "production" : String(value)), () => {
      assert.throws(() => validateApiEnvironment({ ...validEnv(), [key]: value }, origin));
    });
  }
}
for (const value of ["http://stage.example.invalid", "/api", "//stage.example.invalid", "https://user:pass@stage.example.invalid", origin + "/api", origin + "/", origin + ":8443", origin + ":443", origin + "?x=1", origin + "#x", "https://stage.example.invalid.", " https://stage.example.invalid", "https://STAGE.example.invalid", "not a URL"]) {
  test("invalid origin form rejected: " + value, () => assert.throws(() => canonicalOrigin(value)));
}
const escaped = [
  "https://API.CORETRUTHHOUSE.COM./api",
  "https://api.coretruthhouse.com:443",
  "https://api.coretruthhouse.com@stage.example.invalid",
  "https:\\/\\/api.coretruthhouse.com",
  "https://api\\u002ecoretruthhouse\\x2ecom",
  "https://%61%70%69%2ecoretruthhouse.com",
  "https://%2561%2570%2569%252ecoretruthhouse.com",
  "https://api&#46;coretruthhouse&#x2e;com",
  '"https://api." + "coretruthhouse.com"',
];
for (const [index, value] of escaped.entries()) test("production spelling rejected " + index, () => assert.throws(() => assertNoProduction(value), /production API/));
test("public canonical website domain is permitted", () => assert.doesNotThrow(() => assertNoProduction("https://coretruthhouse.com")));
for (const filename of [".env", ".env.local", ".env.staging", ".env.staging.local"]) {
  test("shadowed raw production configuration is rejected: " + filename, t => {
    const directory = fixture(t);
    fs.writeFileSync(path.join(directory, filename), "VITE_API_BASE_URL=" + production + "\nVITE_API_BASE_URL=" + origin);
    assert.throws(() => inspectRawStagingInputs(directory, {}, origin), /production API/);
  });
}
test("raw shadowed foreign aliases and expansions fail closed", t => {
  const directory = fixture(t);
  for (const value of ["https://foreign.example.invalid", "$" + "{OTHER_API}", ""]) {
    fs.writeFileSync(path.join(directory, ".env.staging"), "VITE_BACKEND_URL=" + value);
    assert.throws(() => inspectRawStagingInputs(directory, {}, origin));
  }
});
test("unconsumed production-mode dotenv is not read in staging", t => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, ".env.production"), "VITE_API_URL=" + production);
  assert.doesNotThrow(() => inspectRawStagingInputs(directory, {}, origin));
});
test("shell overrides and legacy/runtime inputs are rejected even with valid effective aliases", t => {
  const directory = fixture(t);
  for (const shell of [
    { VITE_API_URL: production }, { VITE_BACKEND_URL: "https://foreign.example.invalid" },
    { VITE_SOMETHING: production }, { REACT_APP_API_BASE_URL: origin },
    { __API_BASE_URL__: origin }, { NODE_ENV: "development" },
  ]) assert.throws(() => inspectRawStagingInputs(directory, shell, origin));
});
test("Vite-expanded and shell-overridden production values reject", t => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, ".env.staging"), "PROD_HOST=" + production + "\nVITE_API_URL=$" + "{PROD_HOST}");
  assert.throws(() => validateApiEnvironment({ ...validEnv(), ...loadEnv("staging", directory, "VITE_") }, origin));
  const prior = process.env.VITE_BACKEND_URL;
  try {
    process.env.VITE_BACKEND_URL = production;
    assert.throws(() => validateApiEnvironment({ ...validEnv(), ...loadEnv("staging", directory, "VITE_") }, origin));
  } finally {
    if (prior === undefined) delete process.env.VITE_BACKEND_URL;
    else process.env.VITE_BACKEND_URL = prior;
  }
});
test("hardcoded source/runtime/public fallback is rejected", t => {
  const directory = fixture(t);
  fs.mkdirSync(path.join(directory, "src"));
  fs.writeFileSync(path.join(directory, "src/runtime.js"), 'window.__API_BASE_URL__="' + escaped[4] + '";');
  assert.throws(() => scanStagingSources(directory), /production API/);
});
test("real source contains no production API host fallback", () => assert.doesNotThrow(() => scanStagingSources(root)));
test("resolved config rejects mode, output, proxy, env and define bypasses", t => {
  const directory = fixture(t);
  const output = path.join(directory, ".artifacts/staging/test");
  const config = resolvedConfig(directory, output);
  assert.doesNotThrow(() => validateResolvedStagingConfig(config, origin, output));
  for (const mutation of [
    c => { c.mode = "production"; }, c => { c.command = "serve"; },
    c => { c.env.MODE = "production"; }, c => { c.env.VITE_API_URL = production; },
    c => { c.envDir = "/tmp"; }, c => { c.envPrefix = ""; },
    c => { c.build.outDir = "dist"; }, c => { c.build.write = false; },
    c => { c.build.ssr = true; }, c => { c.build.watch = {}; },
    c => { c.publicDir = "/tmp"; }, c => { c.server.proxy = { "/api": { target: production } }; },
    c => { c.preview.proxy = { "/api": { target: origin } }; },
    c => { c.define["window.__API_BASE_URL__"] = JSON.stringify(origin); },
    c => { c.define["import.meta.env.CTH_API_FALLBACK"] = JSON.stringify(production); },
    c => { c.define["import.meta.env.CTH_STAGING_API_ORIGIN"] = JSON.stringify("https://foreign.example.invalid"); },
  ]) {
    const bad = structuredClone(config);
    mutation(bad);
    assert.throws(() => validateResolvedStagingConfig(bad, origin, output));
  }
});
for (const configFile of ["vite.config.js", "vite.config.ts"]) {
  test(configFile + " direct Vite config loading fails closed before any build", async () => {
    await assert.rejects(loadConfigFromFile({ command: "build", mode: "staging" }, path.join(root, configFile), root, "silent"), /unverified/);
  });
}
test("non-staging Vite config retains production fallback and Stripe guard", async () => {
  const result = await loadConfigFromFile({ command: "serve", mode: "development" }, path.join(root, "vite.config.js"), root, "silent");
  assert.equal(result.config.define["import.meta.env.CTH_API_FALLBACK"], JSON.stringify(production));
  assert.equal(result.config.plugins.some(plugin => plugin?.name === "cth-staging-api-guard"), false);
  assert.match(fs.readFileSync(path.join(root, "vite.config.js"), "utf8"), /mode === 'production'.*validateStripePublishableKey/);
});
test("staging package entry is fixed and includes lint; production mode override blocked", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(packageJson.scripts["build:staging"], "node scripts/build-staging.mjs");
  const script = fs.readFileSync(path.join(root, "scripts/build-staging.mjs"), "utf8");
  assert.match(script, /eslint\/bin\/eslint.js/);
  assert.match(script, /"--config", "vite.config.js", "--mode", "staging"/);
  assert.throws(() => execFileSync(process.execPath, [path.join(root, "scripts/build-production.mjs"), "--mode", "staging"], { stdio: "pipe" }), /build:staging/);
});
test("positive output fixture and integrity manifest pass, mutation fails", t => {
  const { directory, output } = outputFixture(t);
  assert.equal(scanStagingOutput(directory, output, origin).length, 3);
  writeStagingManifest(directory, output, origin, "a".repeat(40));
  assert.equal(verifyStagingManifest(directory, output).mode, "staging");
  fs.appendFileSync(path.join(output, "assets/app.css"), "\nchanged");
  assert.throws(() => verifyStagingManifest(directory, output), /changed after verification/);
});
for (const extension of ["html", "js", "json", "css", "map", "webmanifest", "txt", "unknown"]) {
  test("emitted production host is rejected in " + extension, t => {
    const { directory, output } = outputFixture(t);
    fs.writeFileSync(path.join(output, "contaminated." + extension), escaped[4]);
    assert.throws(() => scanStagingOutput(directory, output, origin), /production API/);
  });
}
for (const [extension, compress] of [["gz", gzipSync], ["br", brotliCompressSync]]) {
  test("compressed emitted production host is rejected in " + extension, t => {
    const { directory, output } = outputFixture(t);
    fs.writeFileSync(path.join(output, "worker.js." + extension), compress(Buffer.from(escaped[6])));
    assert.throws(() => scanStagingOutput(directory, output, origin), /production API/);
  });
}
test("missing, empty and unpinned output fails", t => {
  const { directory, output } = outputFixture(t);
  assert.throws(() => scanStagingOutput(directory, path.join(directory, ".artifacts/staging/missing"), origin), /missing/);
  fs.writeFileSync(path.join(output, "assets/app.js"), "");
  assert.throws(() => scanStagingOutput(directory, output, origin), /no JavaScript/);
  fs.unlinkSync(path.join(output, "index.html"));
  assert.throws(() => scanStagingOutput(directory, output, origin), /missing/);
});
test("unsafe, pre-existing or symlinked output and secret-like files fail", t => {
  const { directory, output } = outputFixture(t);
  assert.throws(() => assertIsolatedOutput(directory, path.join(directory, "dist")));
  assert.throws(() => assertIsolatedOutput(directory, output, { mustBeNew: true }));
  fs.symlinkSync(path.join(output, "assets/app.js"), path.join(output, "linked.js"));
  assert.throws(() => scanStagingOutput(directory, output, origin), /symlink/);
  fs.unlinkSync(path.join(output, "linked.js"));
  fs.writeFileSync(path.join(output, ".env.staging"), "fixture");
  assert.throws(() => scanStagingOutput(directory, output, origin), /secret files/);
});
test("both real route postprocessors use fixture DIST_DIR and final scan catches late contamination", t => {
  const { directory, output } = outputFixture(t);
  for (const script of ["create-route-html.cjs", "inject-static-route-metadata.mjs"]) {
    execFileSync(process.execPath, [path.join(root, "scripts", script)], { cwd: directory, env: { ...process.env, DIST_DIR: output }, stdio: "pipe" });
  }
  assert.ok(fs.existsSync(path.join(output, "brand-diagnostic/index.html")));
  assert.ok(!fs.existsSync(path.join(directory, "dist")));
  assert.ok(scanStagingOutput(directory, output, origin).length > 3);
  fs.appendFileSync(path.join(output, "brand-diagnostic/index.html"), "<script>" + escaped[7] + "</script>");
  assert.throws(() => scanStagingOutput(directory, output, origin), /production API/);
});

test("actual Vite resolver accepts reviewed fixture through both config entry points without building", async t => {
  const { resolveConfig } = await import("vite");
  const priorNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  t.after(() => { if (priorNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = priorNodeEnv; });
  for (const configName of ["vite.config.js", "vite.config.ts"]) {
    const directory = fixture(t);
    for (const file of ["vite.config.js", "vite.config.ts", "config/production-api.mjs", "scripts/staging-api-guard.mjs", "scripts/staging-vite-plugin.mjs", "scripts/stripe-publishable-key-guard.mjs"]) {
      fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
      fs.copyFileSync(path.join(root, file), path.join(directory, file));
    }
    fs.writeFileSync(path.join(directory, ".env.staging"), API_KEYS.map(key => key + "=" + origin).join("\n"));
    const config = await resolveConfig({ configFile: path.join(directory, configName), mode: "staging", logLevel: "silent" }, "build", "production");
    assert.equal(config.mode, "staging");
    assert.ok(config.plugins.some(plugin => plugin.name === "cth-staging-api-guard"));
    assert.equal(config.define["import.meta.env.CTH_API_FALLBACK"], '""');
    assert.ok(!fs.existsSync(config.build.outDir));
    await assert.rejects(resolveConfig({
      configFile: path.join(directory, configName), mode: "staging", logLevel: "silent",
      define: { "import.meta.env.VITE_API_URL": JSON.stringify(production) },
    }, "build", "production"), /production API|defines/);
  }
});

test("WHATWG/IDNA Unicode production spellings reject in literal, escaped and raw shadowed input", t => {
  const directory = fixture(t);
  for (const value of [
    "https://api\u3002coretruthhouse.com",
    "https://api\uFF0Ecoretruthhouse.com",
    "https://api\uFF61coretruthhouse.com",
    "https://api.\uFF43oretruthhouse.com",
    "https://api.co\u00ADretruthhouse.com",
    "https://api.co\u200Bretruthhouse.com",
    "https://api.co\uFEFFretruthhouse.com",
  ]) {
    assert.equal(new URL(value).hostname, "api.coretruthhouse.com");
    assert.throws(() => assertNoProduction(value), /production API/);
    const percentEncoded = encodeURI(value);
    assert.equal(new URL(percentEncoded).hostname, "api.coretruthhouse.com");
    assert.throws(() => assertNoProduction(percentEncoded), /production API/);
    assert.throws(() => assertNoProduction("50% complete; malformed %EF%ZZ; " + percentEncoded), /production API/);
    fs.writeFileSync(path.join(directory, ".env.staging"), "SHADOWED=" + percentEncoded + "\nVITE_API_URL=" + origin);
    assert.throws(() => inspectRawStagingInputs(directory, {}, origin), /production API/);
    assert.throws(() => assertNoProduction(percentEncoded.replaceAll("%", "%25")), /production API/);
    const artifact = outputFixture(t);
    fs.writeFileSync(path.join(artifact.output, "encoded.js"), JSON.stringify(percentEncoded));
    assert.throws(() => scanStagingOutput(artifact.directory, artifact.output, origin), /production API/);
    const escapedValue = [...value].map(character => character.charCodeAt(0) > 127 ? "\\\\u" + character.charCodeAt(0).toString(16).padStart(4, "0") : character).join("");
    assert.throws(() => assertNoProduction(escapedValue), /production API/);
    fs.writeFileSync(path.join(directory, ".env.staging"), "SHADOWED=" + value + "\nVITE_API_URL=" + origin);
    assert.throws(() => inspectRawStagingInputs(directory, {}, origin), /production API/);
  }
});
test("non-staging TypeScript config retains prior dev bind/proxy", async () => {
  const result = await loadConfigFromFile({ command: "serve", mode: "development" }, path.join(root, "vite.config.ts"), root, "silent");
  assert.equal(result.config.server.host, "0.0.0.0");
  assert.equal(result.config.server.proxy["/api"].target, production);
});

test("UTF-8 percent decoding tolerates malformed escapes without losing ASCII host detection", () => {
  assert.doesNotThrow(() => assertNoProduction("fixture-%EF%ZZ-%C2"));
  assert.throws(() => assertNoProduction("https://api.coretruthhouse.com/%EF%ZZ"), /production API/);
});

test("staging target cannot be relabeled with production Vite mode", async () => {
  const previous = process.env.CTH_BUILD_TARGET;
  process.env.CTH_BUILD_TARGET = "staging";
  try {
    await assert.rejects(loadConfigFromFile({ command: "build", mode: "production" }, path.join(root, "vite.config.js"), root, "silent"), /requires Vite staging mode/);
  } finally {
    if (previous === undefined) delete process.env.CTH_BUILD_TARGET;
    else process.env.CTH_BUILD_TARGET = previous;
  }
});
