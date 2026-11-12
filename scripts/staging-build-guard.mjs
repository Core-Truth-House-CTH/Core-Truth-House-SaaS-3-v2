// Staging-only safeguards. Nothing here runs in a production build.
import fs from "node:fs";
import path from "node:path";

export const STAGING_API_ORIGIN = "https://staging-api.coretruthhouse.com";

// Text that must never appear in a staging artifact. The production API address is matched
// only when not preceded by a hostname character, so "staging-api.coretruthhouse.com" passes.
export const FORBIDDEN = [
  { name: "production API address", pattern: /(?<![A-Za-z0-9-])api\.coretruthhouse\.com/i },
  { name: "production Clerk address", pattern: /(?<![A-Za-z0-9-])clerk\.coretruthhouse\.com/i },
  { name: "live Stripe/Clerk key", pattern: /\b(?:pk|sk|rk)_live_[A-Za-z0-9]/ },
];
const TEXT_EXTENSIONS = new Set([".js", ".mjs", ".css", ".html", ".json", ".txt", ".xml", ".map", ".webmanifest"]);

/** Checks the build-time settings a staging build is allowed to use. Returns the API origin. */
export function validateStagingEnv(env = {}) {
  const value = key => (typeof env[key] === "string" ? env[key].trim() : "");
  if (value("VITE_API_BASE_URL") !== STAGING_API_ORIGIN) {
    throw new Error(`Staging build: VITE_API_BASE_URL must be exactly ${STAGING_API_ORIGIN}`);
  }
  for (const key of ["VITE_BACKEND_URL", "VITE_API_URL"]) {
    if (value(key) && value(key) !== STAGING_API_ORIGIN) {
      throw new Error(`Staging build: ${key} must be unset or exactly ${STAGING_API_ORIGIN}`);
    }
  }
  for (const key of ["VITE_STRIPE_PUBLISHABLE_KEY", "VITE_CLERK_PUBLISHABLE_KEY"]) {
    if (!value(key).startsWith("pk_test_")) {
      throw new Error(`Staging build: ${key} is required and must be a test key (pk_test_...)`);
    }
  }
  return STAGING_API_ORIGIN;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

/** Scans a built artifact. Returns { findings, files, stagingOriginSeen }. */
export function scanArtifact(dir) {
  if (!fs.existsSync(path.join(dir, "index.html"))) throw new Error(`Staging scan: ${dir} has no index.html`);
  const findings = [];
  let files = 0;
  let stagingOriginSeen = false;
  for (const file of walk(dir)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    files += 1;
    const text = fs.readFileSync(file, "utf8");
    if (text.includes(STAGING_API_ORIGIN)) stagingOriginSeen = true;
    for (const { name, pattern } of FORBIDDEN) {
      if (pattern.test(text)) findings.push({ file: path.relative(dir, file), what: name });
    }
  }
  return { findings, files, stagingOriginSeen };
}

export function assertArtifactClean(dir) {
  const result = scanArtifact(dir);
  if (result.findings.length) {
    const list = result.findings.slice(0, 20).map(f => `  ${f.what} in ${f.file}`).join("\n");
    throw new Error(`Staging scan FAILED: production references found in the artifact:\n${list}`);
  }
  if (!result.stagingOriginSeen) throw new Error(`Staging scan FAILED: ${STAGING_API_ORIGIN} not found in the artifact`);
  return result;
}
