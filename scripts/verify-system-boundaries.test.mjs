import test from "node:test";
import assert from "node:assert/strict";
import { analyzeReachableGraph } from "./verify-system-boundaries.mjs";

const contract = { adapterPath: "src/features/foundation/api/foundationApi.js", sharedClientPath: "src/lib/apiClient.js" };
const adapter = `import client from "@/lib/apiClient"; export const getFoundation=()=>client.get("/api/foundation");`;
const base = (entry, extras = {}) => new Map(Object.entries({ "src/entry.js": entry, [contract.adapterPath]: adapter, [contract.sharedClientPath]: "export default {}", ...extras }));
const check = (entry, extras) => analyzeReachableGraph({ files: base(entry, extras), entries: ["src/entry.js"], contract }).errors;

test("canonical-adapter-only graph passes", () => assert.deepEqual(check(`import "./features/foundation/api/foundationApi";`), []));
test("unchanged reachable helper direct API call fails", () => assert.match(check(`import "./shared"; import "./features/foundation/api/foundationApi";`, { "src/shared.js": `fetch("/api/bad")` }).join("\n"), /direct API/));
test("re-export chains and index resolution are traced", () => assert.deepEqual(check(`import "./bridge";`, { "src/bridge.js": `export * from "./features/foundation/api";`, "src/features/foundation/api/index.js": `export * from "./foundationApi";` }), []));
test("alias imports are traced", () => assert.deepEqual(check(`import "@/features/foundation/api/foundationApi";`), []));
test("static require is traced", () => assert.deepEqual(check(`require("./features/foundation/api/foundationApi")`), []));
test("static dynamic import is traced", () => assert.deepEqual(check(`import("./features/foundation/api/foundationApi")`), []));
test("unresolved reachable import fails closed", () => assert.match(check(`import "./missing"`).join("\n"), /unresolved reachable import/));
