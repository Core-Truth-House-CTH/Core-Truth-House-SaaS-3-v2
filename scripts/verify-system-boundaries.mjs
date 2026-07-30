import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "@babel/parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];
const registryPath = "src/navigation/pageRegistry.jsx";

const normalize = (value) => value.replaceAll(path.sep, "/");

export function extractStaticImports(source, filename = "unknown.js") {
  let ast;
  try {
    ast = parse(source, { sourceType: "unambiguous", sourceFilename: filename, plugins: ["jsx", "typescript", "dynamicImport"] });
  } catch (error) {
    throw new Error(`Cannot parse reachable module ${filename}: ${error.message}`);
  }
  const imports = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source?.value) imports.push(node.source.value);
    if (node.type === "CallExpression" && ["Import", "Identifier"].includes(node.callee?.type)) {
      const isImport = node.callee.type === "Import";
      const isRequire = node.callee.type === "Identifier" && node.callee.name === "require";
      if (isImport || isRequire) {
        const argument = node.arguments?.[0];
        if (argument?.type !== "StringLiteral") throw new Error(`Non-static ${isImport ? "dynamic import" : "require"} in reachable module ${filename}`);
        imports.push(argument.value);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) for (const child of value) visit(child);
      else if (value && typeof value === "object" && typeof value.type === "string") visit(value);
    }
  };
  visit(ast.program);
  return [...new Set(imports)];
}

export function analyzeReachableGraph({ files, entries, contract, aliases = { "@/": "src/" } }) {
  const errors = [];
  const visited = new Set();
  const resolve = (from, specifier) => {
    let target;
    if (specifier.startsWith(".")) target = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
    else {
      const alias = Object.entries(aliases).find(([prefix]) => specifier.startsWith(prefix));
      if (!alias) return null;
      target = path.posix.join(alias[1], specifier.slice(alias[0].length));
    }
    const candidates = [target, ...extensions.map((ext) => target + ext), ...extensions.map((ext) => path.posix.join(target, "index" + ext))];
    const found = candidates.find((candidate) => files.has(candidate));
    if (!found) errors.push(`${from}: unresolved reachable import ${specifier}`);
    return found;
  };
  const queue = [...entries];
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    if (!files.has(current)) { errors.push(`Missing reachable entry ${current}`); continue; }
    visited.add(current);
    let imports = [];
    try { imports = extractStaticImports(files.get(current), current); }
    catch (error) { errors.push(error.message); }
    for (const specifier of imports) {
      const resolved = resolve(current, specifier);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }
  if (!visited.has(contract.adapterPath)) errors.push(`Foundation routes must reach canonical adapter ${contract.adapterPath}.`);
  if (visited.has(contract.adapterPath)) {
    const adapterSource = files.get(contract.adapterPath);
    if (contract.endpointPrefix && !adapterSource.includes(contract.endpointPrefix)) errors.push(`${contract.adapterPath} must use endpoint prefix ${contract.endpointPrefix}.`);
    for (const name of contract.requiredExports ?? []) {
      if (!new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${name}\\b`).test(adapterSource)) errors.push(`${contract.adapterPath} must export ${name}.`);
    }
    for (const mode of contract.requiredReadModes ?? []) {
      if (!new RegExp(`["'\\x60]${mode}["'\\x60]`).test(adapterSource)) errors.push(`${contract.adapterPath} must explicitly support ${mode} reads.`);
    }
  }
  for (const file of visited) {
    if (file === contract.sharedClientPath) continue;
    const source = files.get(file);
    const isAdapter = file === contract.adapterPath;
    const imports = (() => { try { return extractStaticImports(source, file); } catch { return []; } })();
    if (/\b(?:localStorage|sessionStorage|indexedDB)\b/.test(source)) errors.push(`${file}: browser persistence is prohibited.`);
    if (/\bClerkProvider\b|\b(?:WorkspaceProvider|TenantProvider|EntitlementProvider|NotificationProvider)\b/.test(source)) errors.push(`${file}: competing shared provider is prohibited.`);
    if (/axios\.create\s*\(|(?:from\s+["']axios["']|require\(\s*["']axios["'])/.test(source)) errors.push(`${file}: direct Axios use is prohibited.`);
    if (!isAdapter) {
      if (/\bfetch\s*\(|["'`]\/api\//.test(source)) errors.push(`${file}: direct API access is prohibited; use ${contract.adapterPath}.`);
      for (const specifier of imports) {
        const resolved = resolve(file, specifier);
        if (resolved === contract.sharedClientPath || /(?:^|\/)(?:apiClient|persistence|storage)(?:\.[^/]+)?$/i.test(specifier)) {
          errors.push(`${file}: unauthorized persistence/API adapter import ${specifier}; use ${contract.adapterPath}.`);
        }
      }
    }
  }
  return { errors: [...new Set(errors)], visited };
}

function collectFiles(repositoryRoot, relative = ".") {
  const result = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(repositoryRoot, dir), { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", "build", "coverage"].includes(entry.name)) continue;
      const child = normalize(path.join(dir, entry.name)).replace(/^\.\//, "");
      if (entry.isDirectory()) walk(child);
      else if (extensions.includes(path.extname(entry.name))) result.set(child, readFileSync(path.join(repositoryRoot, child), "utf8"));
    }
  };
  walk(relative);
  return result;
}

function foundationEntries(registrySource, contract) {
  const imports = new Map([...registrySource.matchAll(/const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']/g)].map((m) => [m[1], m[2]]));
  const entries = [];
  for (const match of registrySource.matchAll(/["'](\/foundation(?:\/[^"']*)?)["']\s*:\s*(\w+)/g)) {
    if (match[1] === "/foundation/*") continue;
    const specifier = imports.get(match[2]);
    if (!specifier?.startsWith(contract.routeImportPrefix)) throw new Error(`${match[1]} lacks an approved static Foundation import.`);
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(registryPath), specifier));
    entries.push(target);
  }
  return entries;
}

export function runSystemBoundaries(repositoryRoot = root) {
  const contract = JSON.parse(readFileSync(path.join(repositoryRoot, "docs/builds/foundation-truth/FOUNDATION-DATA-CONTRACT.json"), "utf8"));
  const files = collectFiles(repositoryRoot);
  const registry = files.get(registryPath);
  const appRoutes = files.get("src/config/appRoutes.js");
  const featureFiles = [...files.keys()].filter((file) => file.startsWith(contract.featureRoot + "/"));
  let errors = [];
  if (!/["'`]\/command-center["'`]\s*:\s*CommandCenterNext\b/.test(registry)) errors.push("The approved /command-center route no longer resolves to CommandCenterNext.");
  if (!/path\s*:\s*["'`]\/command-center["'`][\s\S]{0,220}?requiredPlan\s*:\s*["'`]foundation["'`]/.test(appRoutes)) errors.push("The Command Center Foundation entitlement contract changed or disappeared.");
  if (contract.implementationPhase === "contract-only") {
    if (featureFiles.length) errors.push(`contract-only prohibits Foundation product implementation files: ${featureFiles.join(", ")}`);
    if (registry.includes(contract.routeImportPrefix)) errors.push("contract-only prohibits Foundation product imports.");
  } else if (contract.implementationPhase === "implementation-active") {
    try {
      const result = analyzeReachableGraph({ files, entries: foundationEntries(registry, contract), contract });
      errors = result.errors;
      if (!result.visited.has(contract.sharedClientPath)) errors.push(`Canonical adapter must reach shared client ${contract.sharedClientPath}.`);
    } catch (error) { errors.push(error.message); }
  } else errors.push(`Unsupported implementationPhase: ${contract.implementationPhase}`);
  for (const error of errors) console.error(`ARCHITECTURE CONTRACT FAILED: ${error}`);
  if (!errors.length) console.log(`Architecture contract passed in ${contract.implementationPhase} phase; ${featureFiles.length} Foundation files inspected.`);
  return errors.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = runSystemBoundaries();
