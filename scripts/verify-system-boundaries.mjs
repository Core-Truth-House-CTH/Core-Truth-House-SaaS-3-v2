import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error(`ARCHITECTURE CONTRACT FAILED: ${message}`);
  process.exitCode = 1;
}

function collectFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return [];

  if (statSync(absolutePath).isFile()) return [absolutePath];

  const files = [];
  for (const entry of readdirSync(absolutePath)) {
    const child = path.join(absolutePath, entry);
    if (statSync(child).isDirectory()) {
      files.push(...collectFiles(path.relative(root, child)));
    } else if (/\.(?:js|jsx|ts|tsx|css)$/.test(entry)) {
      files.push(child);
    }
  }
  return files;
}

const registrySource = read("src/navigation/pageRegistry.jsx");
const appRoutesSource = read("src/config/appRoutes.js");

if (!/["'`]\/command-center["'`]\s*:\s*CommandCenterNext\b/.test(registrySource)) {
  fail("The approved /command-center route no longer resolves to CommandCenterNext.");
}

if (!/path\s*:\s*["'`]\/command-center["'`][\s\S]{0,220}?requiredPlan\s*:\s*["'`]foundation["'`]/.test(appRoutesSource)) {
  fail("The Command Center Foundation entitlement contract changed or disappeared.");
}

const foundationLocations = [
  "src/features/foundation",
  "src/features/foundationTruth",
  "src/pages/foundation",
  "src/pages/foundationTruth",
];

const foundationFiles = foundationLocations.flatMap(collectFiles);

const bannedPatterns = [
  {
    pattern: /axios\.create\s*\(/,
    reason: "Foundation must use the shared Axios API client.",
  },
  {
    pattern: /from\s+["']axios["']/,
    reason: "Foundation must not import Axios directly.",
  },
  {
    pattern: /\bClerkProvider\b/,
    reason: "Foundation must reuse the shared Clerk provider.",
  },
  {
    pattern: /\b(?:WorkspaceProvider|TenantProvider|EntitlementProvider|NotificationProvider)\b/,
    reason: "Foundation must not create a competing shared provider.",
  },
  {
    pattern: /(?:import|from)[^\n]*(?:GlobalSidebar|CommandCenterSidebar|AuthenticatedSidebar|LegacySidebar|\/Sidebar)/i,
    reason: "Foundation must not introduce a global or inner-page sidebar.",
  },
  {
    pattern: /\blocalStorage\b/,
    reason: "Foundation production data must use the canonical workspace record, not local storage.",
  },
  {
    pattern: /window\.location\s*=|window\.location\.href\s*=/,
    reason: "Foundation navigation must use the shared router.",
  },
];

for (const absolutePath of foundationFiles) {
  const source = readFileSync(absolutePath, "utf8");
  const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, "/");

  for (const { pattern, reason } of bannedPatterns) {
    if (pattern.test(source)) {
      fail(`${relativePath}: ${reason}`);
    }
  }
}

const foundationRoutesPresent = /["'`]\/foundation(?:\/|["'`])/.test(
  `${appRoutesSource}\n${registrySource}`,
);

if (foundationRoutesPresent && foundationFiles.length === 0) {
  fail("Foundation routes exist, but no dedicated Foundation feature directory was found.");
}

if (!process.exitCode) {
  console.log(
    `Architecture contract passed. ${foundationFiles.length} Foundation source files inspected.`,
  );
}
