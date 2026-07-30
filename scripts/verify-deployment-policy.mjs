import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const approvedReleaseWorkflow = ".github/workflows/cth-approved-release.yml";
const approvalMarker = "CTH_APPROVED_IMMUTABLE_RELEASE";

const allowedGovernanceFiles = new Set([
  ".github/workflows/cth-governance-gate.yml",
  "scripts/verify-deployment-policy.mjs",
]);

function fail(message) {
  console.error(`DEPLOYMENT POLICY FAILED: ${message}`);
  process.exitCode = 1;
}

function changedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF?.trim();
  if (!baseRef) {
    console.log("Deployment policy: no pull request base ref; no diff-scoped files to inspect.");
    return [];
  }

  try {
    return execFileSync("git", ["diff", "--name-only", `origin/${baseRef}...HEAD`], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
  } catch (error) {
    fail(`Could not calculate the pull request diff: ${error.message}`);
    return [];
  }
}

function isOperationalFile(relativePath) {
  if (relativePath.startsWith(".github/workflows/")) return true;
  if (/\.(?:sh|bash|service|conf)$/i.test(relativePath)) return true;
  return /(?:^|\/)(?:deploy|deployment|release|activate|rollback|infrastructure|operations|vps|server)(?:\/|[-_.])/i.test(
    relativePath,
  );
}

for (const relativePath of changedFiles().filter(isOperationalFile)) {
  if (allowedGovernanceFiles.has(relativePath)) continue;

  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) continue;

  if (relativePath !== approvedReleaseWorkflow) {
    fail(
      `${relativePath} changes operational or deployment behavior outside the approved release workflow. Move it to a separately reviewed release-control PR.`,
    );
    continue;
  }

  const source = readFileSync(absolutePath, "utf8");
  if (!source.includes(approvalMarker)) {
    fail(`${relativePath} is missing approval marker ${approvalMarker}.`);
  }
  if (!/workflow_dispatch\s*:/.test(source)) {
    fail(`${relativePath} must require an explicit workflow_dispatch promotion.`);
  }
  if (!/environment\s*:\s*production/i.test(source)) {
    fail(`${relativePath} must use the protected production environment.`);
  }
  if (!/actions\/download-artifact@/i.test(source)) {
    fail(`${relativePath} must download a previously tested immutable artifact.`);
  }
  if (!/(?:sha256sum|artifact-digest|digest)/i.test(source)) {
    fail(`${relativePath} must verify the artifact digest before activation.`);
  }
}

if (!process.exitCode) {
  console.log("Deployment policy passed: no unauthorized operational changes detected.");
}
