import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = "docs/builds/foundation-truth/FOUNDATION-DATA-CONTRACT.json";

export function parseRoutes(appSource, registrySource) {
  const app = [...appSource.matchAll(/\bpath\s*:\s*["'`]([^"'`]+)["'`]/g)].map((match) => ({
    path: match[1],
    block: appSource.slice(match.index, appSource.indexOf("}", match.index) + 1),
  }));
  const body = registrySource.match(/const\s+pageRegistry\s*=\s*\{([\s\S]*?)\n\};/)?.[1];
  if (body === undefined) throw new Error("Could not locate the pageRegistry object.");
  const registry = [...body.matchAll(/["'`]([^"'`]+)["'`]\s*:\s*([A-Za-z_$][\w$]*)/g)]
    .filter((match) => match[1].startsWith("/"))
    .map((match) => ({ path: match[1], component: match[2], offset: match.index }));
  const redirects = new Map(
    [...registrySource.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*<Navigate\s+[^>]*\bto=["'`]([^"'`]+)["'`]/g)]
      .map((match) => [match[1], match[2]]),
  );
  return { app, registry, redirects };
}

function duplicates(values) {
  const seen = new Set();
  return [...new Set(values.filter((value) => seen.has(value) || !seen.add(value)))].sort();
}

export function validateRouteContract({ contract, app, registry, redirects = new Map() }) {
  const errors = [];
  const appPaths = app.map((entry) => entry.path);
  const registryPaths = registry.map((entry) => entry.path);
  for (const route of duplicates(appPaths)) errors.push(`Duplicate APP_ROUTES path: ${route}`);
  for (const route of duplicates(registryPaths)) errors.push(`Duplicate pageRegistry path: ${route}`);

  if (!["contract-only", "implementation-active"].includes(contract.implementationPhase)) {
    errors.push(`Unsupported implementationPhase: ${contract.implementationPhase}`);
    return errors;
  }

  const expected = new Set(contract.canonicalRoutes);
  const actualApp = appPaths.filter((route) => route === "/foundation" || route.startsWith("/foundation/"));
  const actualRegistry = registryPaths.filter((route) => route === "/foundation" || route.startsWith("/foundation/"))
    .filter((route) => route !== "/foundation/*");
  const unexpected = [...new Set([...actualApp, ...actualRegistry].filter((route) => !expected.has(route)))];
  for (const route of unexpected.sort()) errors.push(`Unexpected Foundation route variant: ${route}`);

  if (contract.implementationPhase === "contract-only") {
    if (actualApp.length || actualRegistry.length) {
      errors.push("contract-only requires zero canonical Foundation routes in both route registries; change the phase in the same reviewed change as the complete route family.");
    }
  } else {
    for (const route of contract.canonicalRoutes) {
      const appEntries = app.filter((entry) => entry.path === route);
      const registryEntries = registry.filter((entry) => entry.path === route);
      if (appEntries.length !== 1) errors.push(`${route} must appear exactly once in APP_ROUTES.`);
      if (registryEntries.length !== 1) errors.push(`${route} must appear exactly once in pageRegistry.`);
      if (appEntries.length === 1) {
        const block = appEntries[0].block;
        if (!new RegExp("requiredPlan\\s*:\\s*[\"'\\x60]" + contract.routeGate.requiredPlan + "[\"'\\x60]").test(block)) {
          errors.push(`${route} must declare requiredPlan: "${contract.routeGate.requiredPlan}".`);
        }
        if (!new RegExp("gateType\\s*:\\s*[\"'\\x60]" + contract.routeGate.gateType + "[\"'\\x60]").test(block)) {
          errors.push(`${route} must declare gateType: "${contract.routeGate.gateType}".`);
        }
      }
    }
    const wildcard = registry.find((entry) => entry.path === "/foundation/*");
    if (wildcard) {
      for (const route of contract.canonicalRoutes) {
        const entry = registry.find((candidate) => candidate.path === route);
        if (!entry || entry.offset > wildcard.offset) errors.push(`/foundation/* must be registered after ${route}.`);
      }
    }
  }

  const componentByRoute = new Map(registry.map(({ path: route, component }) => [route, component]));
  for (const migration of contract.legacyCompatibility) {
    if (!appPaths.includes(migration.route)) errors.push(`${migration.route} is missing from APP_ROUTES.`);
    const expectedComponent = contract.implementationPhase === "contract-only"
      ? migration.contractOnlyComponent : migration.implementationActiveComponent;
    const actual = componentByRoute.get(migration.route);
    if (actual !== expectedComponent) {
      errors.push(`${migration.route} resolves to ${actual ?? "nothing"}; exact ${contract.implementationPhase} target is ${expectedComponent}.`);
    }
    if (contract.implementationPhase === "implementation-active" && migration.behavior === "redirect") {
      const destination = redirects.get(expectedComponent);
      if (destination !== migration.approvedRedirect) {
        errors.push(`${migration.route} must redirect exactly to ${migration.approvedRedirect}; found ${destination ?? "no static redirect"}.`);
      }
    }
  }
  return errors;
}

export function runRouteContract(repositoryRoot = root) {
  const contract = JSON.parse(readFileSync(path.join(repositoryRoot, contractPath), "utf8"));
  const parsed = parseRoutes(
    readFileSync(path.join(repositoryRoot, "src/config/appRoutes.js"), "utf8"),
    readFileSync(path.join(repositoryRoot, "src/navigation/pageRegistry.jsx"), "utf8"),
  );
  const errors = validateRouteContract({ contract, ...parsed });
  for (const error of errors) console.error(`ROUTE CONTRACT FAILED: ${error}`);
  if (errors.length) return 1;
  console.log(`Route contract passed in ${contract.implementationPhase} phase: ${parsed.app.length} APP_ROUTES entries and ${parsed.registry.length} pageRegistry entries checked.`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = runRouteContract();
