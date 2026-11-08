import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertPinnedApiTarget } from "../src/lib/apiOriginPolicy.mjs";

const origin = "https://reviewed-stage.example.invalid";
const policySource = fs.readFileSync(new URL("../src/lib/apiOriginPolicy.mjs", import.meta.url), "utf8").replace("export function", "function");
const configSource = fs.readFileSync(new URL("../src/lib/apiConfig.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/, "").replaceAll("import.meta.env", "environment")
  .replaceAll("export const", "const").replaceAll("export function", "function");
const clientSource = fs.readFileSync(new URL("../src/lib/apiClient.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/, "").replace(/export \{[^}]+\};/, "")
  .replace("export function configureApiClient", "function configureApiClient").replace("export default apiClient;", "");
function loadRuntime(environment, windowValue = {}, processValue = { env: {} }, fetchDouble = globalThis.fetch) {
  return new Function("environment", "window", "process", "fetch", policySource + "\n" + configSource + "\n" + clientSource +
    "\nreturn { getApiBaseUrl, assertApiTarget, apiFetch, ApiClient, buildUrl };")(environment, windowValue, processValue, fetchDouble);
}
function stageEnv() {
  return { MODE: "staging", CTH_STAGING_API_ORIGIN: origin, VITE_API_BASE_URL: origin, VITE_BACKEND_URL: origin, VITE_API_URL: origin, CTH_API_FALLBACK: "" };
}
test("runtime accepts only pinned origin and its API paths", () => {
  assert.equal(assertPinnedApiTarget(origin + "/api/test", origin), origin + "/api/test");
  for (const value of ["https://api.coretruthhouse.com", "https://foreign.example.invalid/api", "/api", "//foreign.example.invalid", origin + "@foreign.example.invalid", "https://user@" + new URL(origin).host]) {
    assert.throws(() => assertPinnedApiTarget(value, origin));
  }
  assert.throws(() => assertPinnedApiTarget(origin, ""));
});
test("all staging aliases validate and no runtime global override is used", () => {
  assert.equal(loadRuntime(stageEnv()).getApiBaseUrl(), origin);
  for (const key of ["VITE_API_BASE_URL", "VITE_BACKEND_URL", "VITE_API_URL"]) {
    assert.throws(() => loadRuntime({ ...stageEnv(), [key]: undefined }));
    assert.throws(() => loadRuntime({ ...stageEnv(), [key]: "https://api.coretruthhouse.com" }));
  }
  assert.throws(() => loadRuntime(stageEnv(), { __API_BASE_URL__: "https://api.coretruthhouse.com" }), /overrides/);
});
test("staging client configure, absolute URLs and mutable baseUrl cannot switch origins", () => {
  const { ApiClient, buildUrl } = loadRuntime(stageEnv());
  const client = new ApiClient();
  assert.equal(client.buildApiUrl("/api/test"), origin + "/api/test");
  assert.throws(() => client.configure({ baseUrl: "https://api.coretruthhouse.com" }));
  assert.throws(() => client.configure({ baseUrl: "" }));
  assert.throws(() => client.buildApiUrl("https://foreign.example.invalid/api"));
  assert.throws(() => buildUrl("", "/api/test"));
  client.baseUrl = "https://foreign.example.invalid";
  assert.throws(() => client.buildApiUrl("/api/test"));
});
test("non-staging preserves modern, legacy, runtime and fallback resolution", () => {
  const base = { MODE: "production", CTH_API_FALLBACK: "https://api.coretruthhouse.com" };
  assert.equal(loadRuntime(base).getApiBaseUrl(), "");
  assert.equal(loadRuntime(base).getApiBaseUrl({ productionFallback: true }), "https://api.coretruthhouse.com");
  assert.equal(loadRuntime({ ...base, VITE_BACKEND_URL: "https://backend.example" }).getApiBaseUrl(), "https://backend.example");
  assert.equal(loadRuntime(base, {}, { env: { REACT_APP_API_BASE_URL: "/legacy" } }).getApiBaseUrl(), "/legacy");
  assert.equal(loadRuntime(base, { __API_BASE_URL__: "/runtime" }).getApiBaseUrl(), "/runtime");
  const { ApiClient } = loadRuntime(base);
  const client = new ApiClient();
  client.configure({ baseUrl: "/custom" });
  assert.equal(client.buildApiUrl("/api/test"), "/custom/api/test");
  assert.equal(client.buildApiUrl("https://external.example/file"), "https://external.example/file");
});

test("staging raw/API-client fetch forces redirect error and never sends to a foreign target", async () => {
  for (const status of [307, 308]) {
    const calls = [];
    const networkDouble = async (url, options) => {
      calls.push({ url, options });
      // Model Fetch's redirect:error semantics without a server or any network.
      if (options.redirect === "error") throw new TypeError("Redirect blocked: " + status);
      calls.push({ url: "https://api.coretruthhouse.com", options });
      throw new Error("Unsafe forwarded request");
    };
    const { apiFetch, ApiClient } = loadRuntime(stageEnv(), {}, { env: {} }, networkDouble);
    await assert.rejects(apiFetch(origin + "/api/test", {
      method: "POST", body: "private-fixture", headers: { Authorization: "fixture-token" }, redirect: "follow",
    }), /Redirect blocked/);
    const client = new ApiClient();
    client.configure({ getToken: async () => "fixture-token" });
    await assert.rejects(client.post("/api/test", { fixture: true }), /Redirect blocked/);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(call => call.url.startsWith(origin + "/") && call.options.redirect === "error"));
    assert.throws(() => apiFetch("https://api.coretruthhouse.com/api/test", { method: "POST", body: "private-fixture" }));
    assert.equal(calls.length, 2);
  }
});
test("non-staging raw fetch keeps caller options unchanged", async () => {
  let received;
  const options = { method: "POST", redirect: "follow", body: "fixture" };
  const { apiFetch } = loadRuntime({ MODE: "production" }, {}, { env: {} }, async (url, init) => { received = { url, init }; return "ok"; });
  assert.equal(await apiFetch("/api/test", options), "ok");
  assert.equal(received.init, options);
  assert.equal(received.url, "/api/test");
});
test("Axios staging interceptor selects Fetch redirect:error; production retains original Axios", async () => {
  const { default: axios } = await import("axios");
  const transport = fs.readFileSync(new URL("../src/lib/apiAxios.js", import.meta.url), "utf8")
    .replace(/^import .*;$/gm, "").replace("export default apiAxios;", "return apiAxios;");
  const runtime = loadRuntime(stageEnv());
  const create = new Function("axios", "assertApiTarget", "getApiBaseUrl", "isStagingApi", transport);
  const productionAxios = create(axios, runtime.assertApiTarget, runtime.getApiBaseUrl, false);
  assert.equal(productionAxios, axios);
  const stagingAxios = create(axios, runtime.assertApiTarget, runtime.getApiBaseUrl, true);
  const interceptor = stagingAxios.interceptors.request.handlers[0].fulfilled;
  const guarded = interceptor({ url: origin + "/api/test", adapter: "xhr", fetchOptions: { redirect: "follow" } });
  assert.equal(guarded.adapter, "fetch");
  assert.equal(guarded.fetchOptions.redirect, "error");
  assert.throws(() => interceptor({ url: "https://api.coretruthhouse.com/api/test" }));
});

test("real Axios Fetch adapter carries the locked redirect policy to a no-network Fetch double", async () => {
  const { default: axios } = await import("axios");
  const source = fs.readFileSync(new URL("../src/lib/apiAxios.js", import.meta.url), "utf8")
    .replace(/^import .*;$/gm, "").replace("export default apiAxios;", "return apiAxios;");
  const runtime = loadRuntime(stageEnv());
  for (const status of [307, 308]) {
    const transport = new Function("axios", "assertApiTarget", "getApiBaseUrl", "isStagingApi", source)(
      axios, runtime.assertApiTarget, runtime.getApiBaseUrl, true,
    );
    const requests = [];
    const fetchDouble = async request => {
      requests.push({ url: request.url, redirect: request.redirect, body: await request.clone().text(), authorization: request.headers.get("authorization") });
      if (request.redirect === "error") throw new TypeError("Redirect blocked: " + status);
      throw new Error("Unsafe redirect policy");
    };
    await assert.rejects(transport.post(origin + "/api/test", { fixture: true }, {
      headers: { Authorization: "fixture-token" }, fetchOptions: { redirect: "follow" }, env: { fetch: fetchDouble },
    }));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, origin + "/api/test");
    assert.equal(requests[0].redirect, "error");
    assert.equal(requests[0].authorization, "fixture-token");
    assert.equal(requests[0].body, '{"fixture":true}');
  }
});
test("raw fetch remains only in the shared dispatcher and explicit external-media reads", () => {
  const directory = new URL("../src/", import.meta.url);
  const allowed = new Map([
    ["lib/apiConfig.js", 2],
    ["pages/StudiosVisual.jsx", 1],
    ["pages/StudiosVoice.jsx", 1],
  ]);
  function walk(base, prefix = "") {
    for (const item of fs.readdirSync(base, { withFileTypes: true })) {
      const relative = prefix + item.name;
      if (item.isDirectory()) walk(new URL(item.name + "/", base), relative + "/");
      else if (/\.(?:js|jsx|mjs)$/.test(item.name)) {
        const text = fs.readFileSync(new URL(item.name, base), "utf8");
        const count = [...text.matchAll(/(?<![A-Za-z0-9_.])fetch\(/g)].length;
        assert.equal(count, allowed.get(relative) || 0, relative);
      }
    }
  }
  walk(directory);
});
