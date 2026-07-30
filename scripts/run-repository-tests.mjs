import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const searchRoots = ["src", "scripts"];
const testPattern = /\.(?:test|spec)\.(?:js|mjs|cjs)$/;

function collect(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return [];

  const stat = statSync(absolutePath);
  if (stat.isFile()) {
    return testPattern.test(absolutePath) ? [absolutePath] : [];
  }

  return readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "dist") return [];
    const child = path.join(relativePath, entry.name);
    return entry.isDirectory()
      ? collect(child)
      : testPattern.test(entry.name)
        ? [path.join(root, child)]
        : [];
  });
}

const tests = searchRoots
  .flatMap(collect)
  .map((absolutePath) => path.relative(root, absolutePath).replaceAll(path.sep, "/"))
  .sort();

if (tests.length === 0) {
  console.error("TEST DISCOVERY FAILED: no repository test files were found.");
  process.exit(1);
}

console.log(`Discovered ${tests.length} repository test files:`);
for (const test of tests) console.log(`- ${test}`);

const result = spawnSync(process.execPath, ["--test", ...tests], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(`TEST EXECUTION FAILED: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
