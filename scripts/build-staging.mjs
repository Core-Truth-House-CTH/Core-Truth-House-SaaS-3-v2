import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { loadEnv } from "vite";
import { preflightStaging, verifyStagingManifest } from "./staging-api-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.length !== 2) throw new Error("Staging build takes no caller-supplied mode, config, origin or output arguments.");
process.env.NODE_ENV ||= "production";
process.env.CTH_BUILD_TARGET = "staging";
const origin = preflightStaging({ root, env: loadEnv("staging", root, "VITE_") });
const output = path.join(root, ".artifacts/staging", new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomUUID());
const options = { cwd: root, stdio: "inherit", env: { ...process.env, CTH_STAGING_OUT_DIR: output } };
execFileSync(process.execPath, [path.join(root, "node_modules/eslint/bin/eslint.js"), "src"], options);
execFileSync(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "build", "--config", "vite.config.js", "--mode", "staging"], options);
verifyStagingManifest(root, output);
console.log("Verified staging artifact: " + path.relative(root, output) + " (" + origin + ")");
