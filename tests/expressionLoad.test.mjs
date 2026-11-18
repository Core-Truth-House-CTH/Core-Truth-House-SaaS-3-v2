import test from "node:test";
import assert from "node:assert/strict";
import { loadExpressionData, IDENTITY_PATH, FOUNDATION_PATH, ASSETS_PATH } from "../src/lib/expressionLoad.mjs";

const httpError = (status, message = `Request failed with status ${status}`) => Object.assign(new Error(message), { status });

function fakeGet(answers) {
  const calls = [];
  const get = async (path, options) => {
    calls.push({ path, options });
    const a = answers[path];
    if (a instanceof Error) throw a;
    return a;
  };
  return { get, calls };
}

const FOUNDATION = { foundation: { tone_of_voice: "Calm, exact" } };
const ASSET = { status: "confirmed", context: "brand_asset", url: "/a.png" };

test("a new member with no saved identity (404) gets the empty form, not an error", async () => {
  const { get } = fakeGet({ [IDENTITY_PATH]: httpError(404, "Brand identity not found"), [FOUNDATION_PATH]: FOUNDATION, [ASSETS_PATH]: { assets: [] } });
  const d = await loadExpressionData(get, { userId: "user_1", workspaceId: "ws_1" });
  assert.equal(d.error, "");
  assert.deepEqual(d.identity, {});
  assert.equal(d.identitySaved, false);
  assert.equal(d.foundation.tone_of_voice, "Calm, exact");
  assert.deepEqual(d.assets, []);
  assert.equal(d.assetsError, "");
});

test("a saved identity loads as before", async () => {
  const { get, calls } = fakeGet({ [IDENTITY_PATH]: { colors: ["#33033c"] }, [FOUNDATION_PATH]: FOUNDATION,
    [ASSETS_PATH]: { assets: [ASSET, { ...ASSET, status: "pending" }, { ...ASSET, context: "other" }] } });
  const d = await loadExpressionData(get, { userId: "user_1", workspaceId: "ws_1" });
  assert.deepEqual(d.identity, { colors: ["#33033c"] });
  assert.equal(d.identitySaved, true);
  assert.deepEqual(d.assets, [ASSET]);                                   // only confirmed brand assets, as before
  assert.deepEqual(calls.find((c) => c.path === IDENTITY_PATH).options, { params: { user_id: "user_1" } });
  assert.deepEqual(calls.find((c) => c.path === ASSETS_PATH).options, { params: { category: "brand_asset", workspace_id: "ws_1" } });
});

test("other identity failures are still errors (only 404 means nothing saved)", async () => {
  for (const status of [401, 403, 500, undefined]) {
    const { get } = fakeGet({ [IDENTITY_PATH]: httpError(status, `boom ${status}`), [FOUNDATION_PATH]: FOUNDATION, [ASSETS_PATH]: { assets: [] } });
    const d = await loadExpressionData(get, { workspaceId: "ws_1" });
    assert.equal(d.error, `boom ${status}`, String(status));
  }
});

test("Brand Foundation failing is an error: tone cannot be shown or saved safely without it", async () => {
  const { get } = fakeGet({ [IDENTITY_PATH]: {}, [FOUNDATION_PATH]: httpError(500, "Foundation down"), [ASSETS_PATH]: { assets: [] } });
  assert.equal((await loadExpressionData(get, { workspaceId: "ws_1" })).error, "Foundation down");
});

test("assets failing leaves the form usable with a short notice", async () => {
  const { get } = fakeGet({ [IDENTITY_PATH]: httpError(404), [FOUNDATION_PATH]: FOUNDATION, [ASSETS_PATH]: httpError(403) });
  const d = await loadExpressionData(get, { workspaceId: "ws_1" });
  assert.equal(d.error, "");
  assert.deepEqual(d.assets, []);
  assert.match(d.assetsError, /still edit and save/);
});

test("no workspace yet: assets are not requested", async () => {
  const { get, calls } = fakeGet({ [IDENTITY_PATH]: {}, [FOUNDATION_PATH]: FOUNDATION });
  const d = await loadExpressionData(get, {});
  assert.equal(d.error, "");
  assert.equal(calls.some((c) => c.path === ASSETS_PATH), false);
  assert.deepEqual(calls.find((c) => c.path === IDENTITY_PATH).options, { params: {} });
});
