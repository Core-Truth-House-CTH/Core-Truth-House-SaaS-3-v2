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
const registryRoutes = [...registryBody.matchAll(/["'`]([^"'`]+)["'`]\s*:/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("/"));

for (const route of duplicates(appRoutes)) {
  fail(`Duplicate APP_ROUTES path: ${route}`);
}

for (const route of duplicates(registryRoutes)) {
  fail(`Duplicate pageRegistry path: ${route}`);
}

const protectedSharedRoutes = [
  "/command-center",
  "/brand-house",
  "/workspace",
  "/brand-audit",
  "/brand-foundation",
  "/audience",
  "/brand-positioning",
  "/messaging-structure",
  "/identity-studio",
  "/systems-builder",
  "/content-studio",
];

for (const route of protectedSharedRoutes) {
  if (!appRoutes.includes(route)) fail(`${route} is missing from APP_ROUTES.`);
  if (!registryRoutes.includes(route)) fail(`${route} is missing from pageRegistry.`);
}

if (!/["'`]\/command-center["'`]\s*:\s*CommandCenterNext\b/.test(registryBody)) {
  fail("/command-center must continue to resolve to CommandCenterNext.");
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
  }

  const wildcardIndex = registryBody.search(/["'`]\/foundation\/\*["'`]\s*:/);
  if (wildcardIndex >= 0) {
    for (const route of foundationRoutes) {
      const routeIndex = registryBody.indexOf(`"${route}"`);
      const singleQuoteIndex = registryBody.indexOf(`'${route}'`);
      const resolvedIndex = routeIndex >= 0 ? routeIndex : singleQuoteIndex;
      if (resolvedIndex < 0 || resolvedIndex > wildcardIndex) {
        fail(`/foundation/* must be registered after the defined route ${route}.`);
      }
    }
  }
}

const unresolvedLegacyRoute = "/brand-memory";
if (!appRoutes.includes(unresolvedLegacyRoute) || !registryRoutes.includes(unresolvedLegacyRoute)) {
  fail("/brand-memory must remain registered until its existing product ownership is resolved.");
}

if (!process.exitCode) {
  console.log(
    `Route contract passed: ${appRoutes.length} APP_ROUTES entries and ${registryRoutes.length} pageRegistry entries checked.`,
  );
}
