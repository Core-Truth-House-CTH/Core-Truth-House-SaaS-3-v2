import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const contract = JSON.parse(
  readFileSync(
    path.join(root, "docs/builds/foundation-truth/FOUNDATION-DATA-CONTRACT.json"),
    "utf8",
  ),
);

const codeExtensions = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];
const registryPath = "src/navigation/pageRegistry.jsx";
const appRoutesPath = "src/config/appRoutes.js";

function normalize(relativePath) {
  return relativePath.replaceAll(path.sep, "/");
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error(`ARCHITECTURE CONTRACT FAILED: ${message}`);
  process.exitCode = 1;
}

function collectCodeFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return [];
  if (statSync(absolutePath).isFile()) {
    return codeExtensions.includes(path.extname(absolutePath)) ? [normalize(relativePath)] : [];
  }

  return readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const child = normalize(path.join(relativePath, entry.name));
    return entry.isDirectory()
      ? collectCodeFiles(child)
      : codeExtensions.includes(path.extname(entry.name))
        ? [child]
        : [];
  });
}

function getChangedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF?.trim();
  if (!baseRef) return new Set();

  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", `origin/${baseRef}...HEAD`],
      { cwd: root, encoding: "utf8" },
    );
    return new Set(output.split("\n").map((value) => value.trim()).filter(Boolean));
  } catch (error) {
    fail(`Could not calculate the pull request diff: ${error.message}`);
    return new Set();
  }
}

function importSpecifiers(source) {
  const specifiers = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function resolveLocalImport(fromRelativePath, specifier) {
  if (!specifier.startsWith(".")) return null;

  const base = path.resolve(root, path.dirname(fromRelativePath), specifier);
  const candidates = [base];
  for (const extension of codeExtensions) candidates.push(`${base}${extension}`);
  for (const extension of codeExtensions) candidates.push(path.join(base, `index${extension}`));

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return normalize(path.relative(root, candidate));
    }
  }

  const extension = path.extname(specifier);
  if (extension && !codeExtensions.includes(extension)) return null;

  fail(`Could not resolve local import ${specifier} from ${fromRelativePath}.`);
  return null;
}

function buildReachableGraph(entryFiles) {
  const queue = [...entryFiles];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const source = read(current);
    for (const specifier of importSpecifiers(source)) {
      const resolved = resolveLocalImport(current, specifier);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }

  return visited;
}

function parseFoundationEntries(registrySource) {
  const lazyImports = new Map();
  for (const match of registrySource.matchAll(
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)/g,
  )) {
    lazyImports.set(match[1], match[2]);
  }

  const bodyMatch = registrySource.match(/const\s+pageRegistry\s*=\s*\{([\s\S]*?)\n\};/);
  if (!bodyMatch) {
    fail("Could not locate the pageRegistry object.");
    return [];
  }

  const entries = [];
  for (const match of bodyMatch[1].matchAll(
    /["'](\/foundation(?:\/[^"']*)?)["']\s*:\s*([A-Za-z_$][\w$]*)/g,
  )) {
    const route = match[1];
    if (route === "/foundation/*") continue;
    const component = match[2];
    const specifier = lazyImports.get(component);
    if (!specifier) {
      fail(`${route} must resolve through a statically identifiable lazy import.`);
      continue;
    }
    if (!specifier.startsWith(contract.routeImportPrefix)) {
      fail(
        `${route} imports ${specifier}; Foundation route components must live under ${contract.routeImportPrefix}.`,
      );
      continue;
    }
    const resolved = resolveLocalImport(registryPath, specifier);
    if (resolved) entries.push(resolved);
  }
  return entries;
}

function assertCanonicalAdapter(reachableFiles) {
  if (!existsSync(path.join(root, contract.adapterPath))) {
    fail(`Foundation implementation requires canonical adapter ${contract.adapterPath}.`);
    return;
  }

  if (!reachableFiles.has(contract.adapterPath)) {
    fail(`Foundation routes must reach the canonical adapter ${contract.adapterPath}.`);
  }

  const source = read(contract.adapterPath);
  const sharedClientImports = importSpecifiers(source)
    .map((specifier) => resolveLocalImport(contract.adapterPath, specifier))
    .filter(Boolean);

  if (!sharedClientImports.includes(contract.sharedClientPath)) {
    fail(`${contract.adapterPath} must import ${contract.sharedClientPath}.`);
  }

  if (!source.includes(contract.endpointPrefix)) {
    fail(`${contract.adapterPath} must use endpoint prefix ${contract.endpointPrefix}.`);
  }

  for (const exportName of contract.requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${exportName}\\b|export\\s+const\\s+${exportName}\\b`,
    );
    if (!exportPattern.test(source)) fail(`${contract.adapterPath} must export ${exportName}.`);
  }

  for (const readMode of contract.requiredReadModes) {
    if (!new RegExp(`["'\`]${readMode}["'\`]`).test(source)) {
      fail(`${contract.adapterPath} must explicitly support the ${readMode} read mode.`);
    }
  }
}

const registrySource = read(registryPath);
const appRoutesSource = read(appRoutesPath);
const changedFiles = getChangedFiles();

if (!/["'`]\/command-center["'`]\s*:\s*CommandCenterNext\b/.test(registrySource)) {
  fail("The approved /command-center route no longer resolves to CommandCenterNext.");
}

if (!/path\s*:\s*["'`]\/command-center["'`][\s\S]{0,220}?requiredPlan\s*:\s*["'`]foundation["'`]/.test(appRoutesSource)) {
  fail("The Command Center Foundation entitlement contract changed or disappeared.");
}

const foundationFeatureFiles = collectCodeFiles(contract.featureRoot);
const foundationRouteEntries = parseFoundationEntries(registrySource);
const foundationImplementationStarted =
  foundationFeatureFiles.length > 0 || foundationRouteEntries.length > 0;
const reachableFiles = buildReachableGraph(foundationRouteEntries);

if (foundationImplementationStarted && foundationRouteEntries.length === 0) {
  fail("Foundation source exists without registered canonical Foundation route components.");
}

for (const file of foundationFeatureFiles) reachableFiles.add(file);

const bannedEverywhere = [
  { pattern: /axios\.create\s*\(/, reason: "Foundation must use the shared API client." },
  { pattern: /from\s+["']axios["']/, reason: "Foundation must not import Axios directly." },
  { pattern: /\bClerkProvider\b/, reason: "Foundation must reuse the shared Clerk provider." },
  {
    pattern: /\b(?:WorkspaceProvider|TenantProvider|EntitlementProvider|NotificationProvider)\b/,
    reason: "Foundation must not create a competing shared provider.",
  },
  {
    pattern:
      /(?:import|from)[^\n]*(?:GlobalSidebar|CommandCenterSidebar|AuthenticatedSidebar|LegacySidebar|\/Sidebar)/i,
    reason: "Foundation must not introduce a global or inner-page sidebar.",
  },
  {
    pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    reason: "Foundation data must use the canonical workspace record.",
  },
  {
    pattern: /window\.location\s*=|window\.location\.href\s*=/,
    reason: "Foundation navigation must use the shared router.",
  },
];

for (const relativePath of reachableFiles) {
  const source = read(relativePath);
  const isAdapter = relativePath === contract.adapterPath;
  const isSharedClient = relativePath === contract.sharedClientPath;
  const isFoundationFile = relativePath.startsWith(`${contract.featureRoot}/`);
  const isChangedReachableFile = changedFiles.has(relativePath);
  const enforce = isFoundationFile || isChangedReachableFile;

  if (!enforce || isSharedClient) continue;

  for (const { pattern, reason } of bannedEverywhere) {
    if (pattern.test(source)) fail(`${relativePath}: ${reason}`);
  }

  if (!isAdapter) {
    if (/\bfetch\s*\(/.test(source)) {
      fail(`${relativePath}: direct fetch is prohibited; use ${contract.adapterPath}.`);
    }
    if (/["'`]\/api\//.test(source)) {
      fail(`${relativePath}: direct API paths are prohibited; use ${contract.adapterPath}.`);
    }

    const resolvedImports = importSpecifiers(source)
      .map((specifier) => resolveLocalImport(relativePath, specifier))
      .filter(Boolean);
    if (resolvedImports.includes(contract.sharedClientPath)) {
      fail(
        `${relativePath}: only ${contract.adapterPath} may import the shared API client for Foundation persistence.`,
      );
    }
  }
}

if (foundationImplementationStarted) assertCanonicalAdapter(reachableFiles);

if (!process.exitCode) {
  console.log(
    `Architecture contract passed. ${foundationFeatureFiles.length} Foundation files and ${reachableFiles.size} reachable files inspected.`,
  );
}
