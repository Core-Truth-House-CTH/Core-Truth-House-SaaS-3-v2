import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error(`ROUTE CONTRACT FAILED: ${message}`);
  process.exitCode = 1;
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeBlock(source, route) {
  const lines = source.split("\n");
  const pathPattern = new RegExp(`\\bpath\\s*:\\s*["'\`]${escapeRegex(route)}["'\`]`);
  const pathLine = lines.findIndex((line) => pathPattern.test(line));
  if (pathLine < 0) return null;

  let start = pathLine;
  while (start >= 0 && !/^\s*\{\s*$/.test(lines[start])) start -= 1;

  let end = pathLine;
  while (end < lines.length && !/^\s*\},?\s*$/.test(lines[end])) end += 1;

  if (start < 0 || end >= lines.length) return null;
  return lines.slice(start, end + 1).join("\n");
}

const appRoutesSource = read("src/config/appRoutes.js");
const registrySource = read("src/navigation/pageRegistry.jsx");

const appRoutes = [...appRoutesSource.matchAll(/\bpath\s*:\s*["'`]([^"'`]+)["'`]/g)].map(
  (match) => match[1],
);

const registryBodyMatch = registrySource.match(/const\s+pageRegistry\s*=\s*\{([\s\S]*?)\n\};/);
if (!registryBodyMatch) {
  fail("Could not locate the pageRegistry object.");
  process.exit(1);
}

const registryBody = registryBodyMatch[1];
const registryEntries = [...registryBody.matchAll(/["'`]([^"'`]+)["'`]\s*:\s*([A-Za-z_$][\w$]*)/g)]
  .filter((match) => match[1].startsWith("/"));
const registryRoutes = registryEntries.map((match) => match[1]);
const registryComponents = new Map(registryEntries.map((match) => [match[1], match[2]]));

for (const route of duplicates(appRoutes)) fail(`Duplicate APP_ROUTES path: ${route}`);
for (const route of duplicates(registryRoutes)) fail(`Duplicate pageRegistry path: ${route}`);

const legacyRouteContract = new Map([
  ["/command-center", ["CommandCenterNext"]],
  ["/brand-house", ["BrandHouse"]],
  ["/workspace", ["WorkspacePage"]],
  ["/brand-audit", ["BrandAudit"]],
  ["/brand-foundation", ["BrandFoundation", "FoundationHomeLegacyRedirect"]],
  ["/audience", ["Audience", "FoundationAudienceLegacyRedirect"]],
  ["/brand-positioning", ["BrandPositioning", "FoundationPositioningLegacyRedirect"]],
  ["/messaging-structure", ["MessagingStructure", "FoundationMessagingLegacyRedirect"]],
  ["/identity-studio", ["IdentityStudio"]],
  ["/systems-builder", ["SystemsBuilder"]],
  ["/content-studio", ["CSDashboard"]],
  ["/brand-memory", ["BrandFoundation"]],
]);

for (const [route, allowedComponents] of legacyRouteContract) {
  if (!appRoutes.includes(route)) fail(`${route} is missing from APP_ROUTES.`);
  const actualComponent = registryComponents.get(route);
  if (!actualComponent) {
    fail(`${route} is missing from pageRegistry.`);
  } else if (!allowedComponents.includes(actualComponent)) {
    fail(
      `${route} resolves to ${actualComponent}; allowed compatibility target(s): ${allowedComponents.join(", ")}.`,
    );
  }
}

const foundationRoutes = [
  "/foundation",
  "/foundation/diagnostic",
  "/foundation/core-truth",
  "/foundation/audience",
  "/foundation/positioning",
  "/foundation/messaging",
  "/foundation/expression",
  "/foundation/review",
];

const foundationImplementationStarted = foundationRoutes.some(
  (route) => appRoutes.includes(route) || registryRoutes.includes(route),
);

if (foundationImplementationStarted) {
  for (const route of foundationRoutes) {
    if (!appRoutes.includes(route)) fail(`${route} is missing from APP_ROUTES.`);
    if (!registryRoutes.includes(route)) fail(`${route} is missing from pageRegistry.`);

    const block = routeBlock(appRoutesSource, route);
    if (!block) {
      fail(`Could not parse APP_ROUTES metadata for ${route}.`);
      continue;
    }

    if (!/requiredPlan\s*:\s*["'`]foundation["'`]/.test(block)) {
      fail(`${route} must declare requiredPlan: "foundation".`);
    }

    if (!/gateType\s*:\s*["'`]page["'`]/.test(block)) {
      fail(`${route} must declare gateType: "page".`);
    }
  }

  const wildcardMatch = registryEntries.find((match) => match[1] === "/foundation/*");
  if (wildcardMatch) {
    const wildcardIndex = registryBody.indexOf(wildcardMatch[0]);
    for (const route of foundationRoutes) {
      const entry = registryEntries.find((match) => match[1] === route);
      if (!entry || registryBody.indexOf(entry[0]) > wildcardIndex) {
        fail(`/foundation/* must be registered after the defined route ${route}.`);
      }
    }
  }
}

if (!process.exitCode) {
  console.log(
    `Route contract passed: ${appRoutes.length} APP_ROUTES entries and ${registryRoutes.length} pageRegistry entries checked.`,
  );
}
