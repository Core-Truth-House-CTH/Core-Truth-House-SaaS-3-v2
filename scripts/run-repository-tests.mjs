import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const executable = new Set([".js", ".mjs", ".cjs"]);
const excludedSegments = new Set(["node_modules", "dist", "build", "coverage", "generated", "vendor", "vendored", "fixtures", "__fixtures__", "archive", "archived"]);

export function isTestPath(file) {
  const normalized = file.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (segments.some((segment) => excludedSegments.has(segment.toLowerCase()))) return false;
  const extension = path.posix.extname(normalized);
  if (!extensions.has(extension)) return false;
  const basename = path.posix.basename(normalized);
  return /\.(?:test|spec)\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(basename)
    || segments.some((segment) => ["test", "tests", "__tests__"].includes(segment.toLowerCase()));
}

export function discoverTrackedTests(trackedFiles) {
  return [...new Set(trackedFiles.filter(isTestPath))].sort((a, b) => a.localeCompare(b, "en"));
}

function trackedFiles(repositoryRoot) {
  return execFileSync("git", ["ls-files", "-z"], { cwd: repositoryRoot })
    .toString("utf8").split("\0").filter(Boolean);
}

export function runRepositoryTests(repositoryRoot = root) {
  let tests;
  try {
    tests = discoverTrackedTests(trackedFiles(repositoryRoot));
  } catch (error) {
    console.error(`TEST DISCOVERY FAILED: git ls-files failed: ${error.message}`);
    return 1;
  }
  if (!tests.length) {
    console.error("TEST DISCOVERY FAILED: no tracked repository test files matched supported conventions.");
    return 1;
  }
  console.log(`Discovered ${tests.length} tracked repository test files:`);
  for (const file of tests) console.log(`DISCOVERED: ${file}`);
  const unsupported = tests.filter((file) => !executable.has(path.posix.extname(file)));
  if (unsupported.length) {
    for (const file of unsupported) console.error(`UNSUPPORTED TEST RUNNER: ${file} is tracked and discoverable, but Node cannot execute ${path.posix.extname(file)} tests without an approved runner.`);
    return 1;
  }
  for (const file of tests) console.log(`EXECUTING: ${file}`);
  const result = spawnSync(process.execPath, ["--test", ...tests], { cwd: repositoryRoot, stdio: "inherit", env: process.env });
  if (result.error) {
    console.error(`TEST EXECUTION FAILED: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = runRepositoryTests();
