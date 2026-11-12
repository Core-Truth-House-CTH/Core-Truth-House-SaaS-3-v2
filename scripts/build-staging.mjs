// Usage: yarn build:staging   (no arguments)
// Builds a staging artifact into a NEW folder under .artifacts/staging/ and scans it.
// Settings (VITE_*) come from .env.staging or the environment; they are validated first.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { loadEnv } from "vite";
import { validateStagingEnv, assertArtifactClean } from "./staging-build-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.length !== 2) throw new Error("Staging build takes no arguments.");

const env = loadEnv("staging", root, "VITE_");
const origin = validateStagingEnv(env);
const out = path.join(root, ".artifacts/staging", new Date().toISOString().replace(/[:.]/g, "-"));
if (fs.existsSync(out)) throw new Error(`Staging build: ${out} already exists`);

const run = (file, args, extra = {}) =>
  execFileSync(process.execPath, [path.join(root, file), ...args], {
    cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production", ...extra },
  });

run("node_modules/eslint/bin/eslint.js", ["src"]);
run("node_modules/vite/bin/vite.js", ["build", "--mode", "staging", "--outDir", out]);
run("scripts/create-route-html.cjs", [], { DIST_DIR: out });
run("scripts/inject-static-route-metadata.mjs", [], { DIST_DIR: out });
const { files } = assertArtifactClean(out);
console.log(`Staging artifact ready: ${path.relative(root, out)} (${origin}; ${files} text files scanned clean)`);
