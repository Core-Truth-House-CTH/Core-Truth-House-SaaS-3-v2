import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const approvedReleaseWorkflow = ".github/workflows/cth-approved-release.yml";
const approvalMarker = "CTH_APPROVED_IMMUTABLE_RELEASE";
const selfPath = "scripts/verify-deployment-policy.mjs";

function fail(message) {
  console.error(`DEPLOYMENT POLICY FAILED: ${message}`);
  process.exitCode = 1;
}

function changedFiles() {
  const baseRef = process.env.GITHUB_BASE_REF?.trim();
  if (!baseRef) {
    console.log(
      "Deployment policy: no pull request base ref; no diff-scoped deployment files to inspect.",
    );
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

function isDeploymentSensitive(relativePath) {
  if (relativePath === selfPath) return false;
  if (relativePath.startsWith(".github/workflows/")) return true;
  if (/\.(?:sh|bash|service|conf|ya?ml)$/i.test(relativePath)) return true;
  return /(?:^|\/)(?:deploy|release|activate|rollback|nginx|systemd|docker)/i.test(
    relativePath,
  );
}

const prohibitedPatterns = [
  {
    pattern: /runs-on\s*:\s*(?:\[[^\]]*\bself-hosted\b|self-hosted)/i,
    label: "self-hosted runner",
  },
  {
    pattern:
      /(?:appleboy\/ssh-action|sshpass|\bssh\s+[^\n]+@|\bscp\s+|\bsftp\s+|\brsync\s+)/i,
    label: "direct remote-shell or file-transfer command",
  },
  { pattern: /\/var\/www\//i, label: "direct production filesystem path" },
  {
    pattern:
      /\b(?:systemctl|service\s+nginx|nginx\s+-s|pm2\s+(?:restart|reload|start|stop))\b/i,
    label: "direct service mutation",
  },
  {
    pattern: /\bgit\s+(?:pull|checkout|reset)\b/i,
    label: "source checkout or mutation on a deployment target",
  },
  {
    pattern: /\b(?:yarn|npm|pnpm)\s+(?:install|ci|build|run\s+build)\b/i,
    label: "dependency install or source build in deployment logic",
  },
];

for (const relativePath of changedFiles().filter(isDeploymentSensitive)) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) continue;
  const source = readFileSync(absolutePath, "utf8");
  const isApprovedWorkflow =
    relativePath === approvedReleaseWorkflow && source.includes(approvalMarker);

  for (const { pattern, label } of prohibitedPatterns) {
    if (pattern.test(source) && !isApprovedWorkflow) {
      fail(
        `${relativePath} contains a ${label}. Feature and governance PRs may not mutate the VPS.`,
      );
    }
  }

  if (relativePath === approvedReleaseWorkflow) {
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
    if (/\b(?:yarn|npm|pnpm)\s+(?:install|ci|build|run\s+build)\b/i.test(source)) {
      fail(
        `${relativePath} must promote a tested artifact and may not rebuild source during deployment.`,
      );
    }
  }
}

if (!process.exitCode) {
  console.log("Deployment policy passed: no unauthorized VPS or release mutations detected.");
}
