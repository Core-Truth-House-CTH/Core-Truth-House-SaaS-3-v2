import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { domainToASCII } from "node:url";
import { gunzipSync, brotliDecompressSync } from "node:zlib";

export const API_KEYS = Object.freeze(["VITE_API_BASE_URL", "VITE_BACKEND_URL", "VITE_API_URL"]);
export const LEGACY_KEYS = Object.freeze(["REACT_APP_API_BASE_URL", "REACT_APP_BACKEND_URL", "REACT_APP_API_URL", "__API_BASE_URL__"]);
const ENV_FILES = [".env", ".env.local", ".env.staging", ".env.staging.local"];
const MANIFEST = "staging-manifest.json";
const TEXT_EXTENSIONS = /\.(?:[cm]?[jt]sx?|html?|json|css|map|svg|xml|txt|webmanifest|ya?ml|toml|ini|conf|gz|br)$/i;

function stop(reason) { throw new Error("Staging API guard: " + reason); }

// Decode common JS/JSON, URL and HTML spellings before checking. Values are never logged.
export function decodedText(value, lineSeparator = "") {
  let text = String(value);
  for (let i = 0; i < 8; i += 1) {
    const next = text
      .replace(/\\+u\{([0-9a-f]{1,6})\}/gi, (_, hex) => String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)))
      .replace(/\\+u([0-9a-f]{4})|\\+x([0-9a-f]{2})/gi, (_, a, b) => String.fromCharCode(parseInt(a || b, 16)))
      .replace(/&#x([0-9a-f]+);?|&#([0-9]+);?/gi, (_, hex, dec) => String.fromCodePoint(Math.min(parseInt(hex || dec, hex ? 16 : 10), 0x10ffff)))
      .replace(/&period;/gi, ".").replace(/&colon;/gi, ":").replace(/&sol;/gi, "/").replace(/&amp;/gi, "&")
      .replace(/(?:%[0-9a-f]{2})+/gi, sequence => {
        // Percent escapes represent UTF-8 bytes, not Latin-1 code points.
        try { return decodeURIComponent(sequence); } catch { return sequence; }
      })
      .replace(/\\\//g, "/").replace(/\\\\/g, "\\")
      .replace(/["'`]\s*\+\s*["'`]/g, "");
    if (next === text) break;
    text = next;
  }
  return text.normalize("NFKC").replace(/[\u3002\uFF0E\uFF61]/g, ".").replace(/[\t\r\n]/g, lineSeparator).toLowerCase();
}

export function assertNoProduction(value, label = "input") {
  // Also catches uppercase, trailing-dot, port, subdomain and credential disguises.
  // Scan both URL-style ignored line breaks and text-file assignment boundaries.
  const decodedForms = [decodedText(value), decodedText(value, " ")];
  // WHATWG URL parsing applies IDNA mappings, including ignored Unicode code
  // points. Canonicalize host-shaped tokens as well as normalizing display text.
  for (const decoded of decodedForms) {
    for (const match of decoded.matchAll(/[\p{L}\p{N}\p{M}\p{Cf}.\-]+/gu)) {
      if (!match[0].includes(".")) continue;
      const ascii = domainToASCII(match[0]);
      // Match complete DNS labels, not a substring of staging-api or another label.
      // Keep rejecting production subdomains and host-suffix disguises.
      if (/(?:^|\.)api\.coretruthhouse\.com(?:\.|$)/i.test(ascii)) {
        stop(label + " contains a browser-normalized production API hostname");
      }
    }
  }
}

export function canonicalOrigin(value, label = "API origin") {
  if (typeof value !== "string" || !value || value !== value.trim()) stop(label + " is missing or malformed");
  assertNoProduction(value, label);
  let parsed;
  try { parsed = new URL(value); } catch { stop(label + " must be an absolute HTTPS origin"); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash ||
      parsed.pathname !== "/" || parsed.hostname.endsWith(".") ||
      value !== parsed.origin || !parsed.hostname.includes(".") || /[\\%]/.test(value)) {
    stop(label + " must be a canonical HTTPS origin without credentials, path, port or escapes");
  }
  // URL normalizes :443 away; explicit ports (including 443) are not accepted.
  if (parsed.port || /:\d+(?:\/|$)/.test(value)) stop(label + " must not specify a port");
  // This staging target is a single reviewed origin, not a hostname pattern.
  if (value !== "https://staging-api.coretruthhouse.com") {
    stop(label + " must exactly match the single reviewed staging API origin");
  }
  return parsed.origin;
}

export function readPinnedOrigin(root) {
  const file = path.join(root, "config/staging-api.json");
  assertRegularFile(file, "reviewed staging policy");
  let policy;
  try { policy = JSON.parse(fs.readFileSync(file, "utf8")); } catch { stop("reviewed staging policy is invalid"); }
  if (policy.reviewed !== true) stop("staging API origin is unverified; review config/staging-api.json before any staging build");
  return canonicalOrigin(policy.origin, "reviewed staging API origin");
}

function assertRegularFile(file, label) {
  let stat;
  try { stat = fs.lstatSync(file); } catch { stop(label + " is missing"); }
  if (!stat.isFile() || stat.isSymbolicLink()) stop(label + " must be a regular file");
}

export function validateApiEnvironment(env, origin) {
  canonicalOrigin(origin, "reviewed staging API origin");
  for (const key of API_KEYS) {
    if (canonicalOrigin(env[key], key) !== origin) stop(key + " does not match the reviewed staging API origin");
  }
  for (const key of LEGACY_KEYS) {
    if (env[key] !== undefined && env[key] !== "") stop(key + " is not permitted in staging");
  }
}

export function inspectRawStagingInputs(root, shell = process.env, origin) {
  for (const name of ENV_FILES) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    assertRegularFile(file, name);
    const raw = fs.readFileSync(file, "utf8");
    assertNoProduction(raw, name);
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (LEGACY_KEYS.includes(key)) stop(name + " declares a legacy API override");
      if (!API_KEYS.includes(key)) continue;
      let value = rawValue.trim();
      if (/^["']/.test(value)) {
        const quote = value[0];
        const end = value.lastIndexOf(quote);
        if (end === 0 || value.slice(end + 1).trim().replace(/^#.*$/, "")) stop(name + " has an invalid API assignment");
        value = value.slice(1, end);
      } else {
        value = value.replace(/\s+#.*$/, "").trim();
      }
      // Literal pins make shadowed values auditable; expansion is intentionally unsupported for API aliases.
      if (canonicalOrigin(value, name + ":" + key) !== origin) stop(name + " has a shadowed or mismatched API assignment");
    }
  }
  for (const [key, value] of Object.entries(shell)) {
    if (/^(?:VITE_|REACT_APP_|CTH_)|API|BACKEND/i.test(key)) assertNoProduction(value, "shell configuration");
    if (LEGACY_KEYS.includes(key) && value !== "") stop("shell configuration declares a legacy API override");
    if (API_KEYS.includes(key) && canonicalOrigin(value, key) !== origin) stop(key + " shell override does not match the reviewed origin");
  }
  if (shell.NODE_ENV && shell.NODE_ENV !== "production") stop("staging builds require NODE_ENV=production");
}

function walk(directory, onFile) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) stop("symlinks are not permitted in staging inputs or output");
    if (entry.isDirectory()) walk(file, onFile);
    else if (entry.isFile()) onFile(file);
    else stop("unexpected non-regular staging file");
  }
}

export function scanStagingSources(root) {
  for (const folder of ["src", "public"]) {
    const directory = path.join(root, folder);
    if (fs.existsSync(directory)) {
      if (fs.lstatSync(directory).isSymbolicLink()) stop("staging source directory must not be a symlink");
      walk(directory, file => {
        if (TEXT_EXTENSIONS.test(file)) assertNoProduction(readScanText(file), path.relative(root, file));
      });
    }
  }
  if (fs.existsSync(path.join(root, "index.html"))) assertNoProduction(fs.readFileSync(path.join(root, "index.html"), "utf8"), "index.html");
}

export function preflightStaging({ root, env, shell = process.env }) {
  const origin = readPinnedOrigin(root);
  inspectRawStagingInputs(root, shell, origin);
  validateApiEnvironment(env, origin);
  scanStagingSources(root);
  return origin;
}

export function validateResolvedStagingConfig(config, origin, expectedOutDir) {
  if (config.mode !== "staging" || config.command !== "build" || config.env?.MODE !== "staging") stop("build target and Vite mode must both be staging");
  validateApiEnvironment(config.env, origin);
  if (config.envDir !== config.root) stop("staging must use the reviewed root environment directory");
  if (config.envPrefix !== "VITE_" && JSON.stringify(config.envPrefix) !== '["VITE_"]') stop("staging envPrefix overrides are not permitted");
  if (path.resolve(config.root, config.build.outDir) !== expectedOutDir) stop("staging output directory was overridden");
  if (config.build.write === false || config.build.lib || config.build.ssr || config.build.watch) stop("staging requires a one-shot written browser build");
  if (config.publicDir && path.resolve(config.publicDir) !== path.join(config.root, "public")) stop("staging publicDir overrides are not permitted");
  if (Object.keys(config.server?.proxy || {}).length || Object.keys(config.preview?.proxy || {}).length) stop("staging proxy overrides are not permitted");
  assertNoProduction(JSON.stringify(config.define || {}), "Vite defines");
  for (const key of Object.keys(config.define || {})) {
    if (/API|BACKEND|process\.env|window\./i.test(key) &&
        !["import.meta.env.CTH_API_FALLBACK", "import.meta.env.CTH_STAGING_API_ORIGIN"].includes(key)) stop("custom API/runtime Vite defines are not permitted");
  }
  if (config.define?.["import.meta.env.CTH_STAGING_API_ORIGIN"] !== JSON.stringify(origin) ||
      config.define?.["import.meta.env.CTH_API_FALLBACK"] !== '""') stop("staging compile-time API pins were overridden");
}

export function assertIsolatedOutput(root, output, { mustBeNew = false } = {}) {
  const resolvedRoot = fs.realpathSync(root);
  const absolute = path.resolve(output);
  const allowed = path.join(resolvedRoot, ".artifacts", "staging");
  const relative = path.relative(allowed, absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) stop("output must be a child of .artifacts/staging");
  let cursor = resolvedRoot;
  for (const part of path.relative(resolvedRoot, absolute).split(path.sep)) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && (fs.lstatSync(cursor).isSymbolicLink() || !fs.lstatSync(cursor).isDirectory())) stop("output path must contain only real directories");
  }
  if (mustBeNew && fs.existsSync(absolute)) stop("staging output already exists; use a fresh isolated directory");
  return absolute;
}

function readScanText(file) {
  let bytes = fs.readFileSync(file);
  try {
    if (file.endsWith(".gz")) bytes = gunzipSync(bytes);
    if (file.endsWith(".br")) bytes = brotliDecompressSync(bytes);
  } catch { stop("compressed staging artifact cannot be decoded"); }
  return bytes.toString("utf8");
}

export function scanStagingOutput(root, output, origin) {
  canonicalOrigin(origin, "reviewed staging API origin");
  const absolute = assertIsolatedOutput(root, output);
  if (!fs.existsSync(absolute)) stop("staging output is missing");
  assertRegularFile(path.join(absolute, "index.html"), "staging index.html");
  const files = [];
  let hasOrigin = false;
  let javascriptCount = 0;
  walk(absolute, file => {
    const relative = path.relative(absolute, file).split(path.sep).join("/");
    if (relative === MANIFEST) return;
    if (/^\.env(?:\.|$)/i.test(path.basename(file)) || /\.(?:pem|key|p12|pfx)$/i.test(file)) stop("configuration or secret files must not be emitted");
    const bytes = fs.readFileSync(file);
    // Scan every emitted file; compressed assets are decompressed first.
    const content = readScanText(file);
    assertNoProduction(content, "emitted artifact " + relative);
    if (/\.[cm]?js$/i.test(file)) {
      javascriptCount += 1;
      if (content.includes(origin)) hasOrigin = true;
    }
    files.push({ path: relative, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
  });
  if (!files.length || !javascriptCount || !hasOrigin) stop("staging output is empty or has no JavaScript containing the reviewed API origin");
  return files;
}

export function writeStagingManifest(root, output, origin, commit) {
  if (!/^[0-9a-f]{40}$/.test(commit)) stop("artifact requires a verified source commit");
  const files = scanStagingOutput(root, output, origin);
  const manifest = { schema: 1, mode: "staging", apiOrigin: origin, commit, createdAt: new Date().toISOString(), files };
  fs.writeFileSync(path.join(output, MANIFEST), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
  return manifest;
}

export function verifyStagingManifest(root, output) {
  const origin = readPinnedOrigin(root);
  assertIsolatedOutput(root, output);
  const manifestFile = path.join(output, MANIFEST);
  assertRegularFile(manifestFile, "staging manifest");
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")); } catch { stop("staging manifest is invalid"); }
  if (manifest.schema !== 1 || manifest.mode !== "staging" || manifest.apiOrigin !== origin || !/^[0-9a-f]{40}$/.test(manifest.commit)) stop("staging manifest does not match reviewed policy");
  if (JSON.stringify(scanStagingOutput(root, output, origin)) !== JSON.stringify(manifest.files)) stop("staging artifact changed after verification");
  return manifest;
}
