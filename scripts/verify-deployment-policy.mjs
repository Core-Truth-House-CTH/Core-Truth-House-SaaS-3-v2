import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseWorkflow = ".github/workflows/cth-approved-release.yml";
const governanceWorkflow = ".github/workflows/cth-governance-gate.yml";
const policyScript = "scripts/verify-deployment-policy.mjs";
const policyTest = "scripts/verify-deployment-policy.test.mjs";
const pathPatterns = [
  /(?:^|\/)Dockerfile(?:\..+)?$/i, /(?:^|\/)(?:docker-)?compose(?:\.[^.]+)?\.ya?ml$/i,
  /(?:^|\/)(?:container|infrastructure|infra|operations|deployment|deploy|release)(?:\/|$)/i,
  /(?:^|\/)(?:netlify\.toml|vercel\.json|render\.ya?ml|fly\.toml)$/i,
  /(?:^|\/)(?:nginx|systemd|pm2)(?:[./_-]|$)/i, /\.(?:service|conf)$/i,
  /(?:^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i, /\.(?:sh|bash)$/i,
];
const contentPattern = /\b(?:ssh|scp|rsync|systemctl|kubectl|flyctl|vercel|netlify)\b|\bdocker\s+(?:push|compose|stack)\b|\b(?:tar|unzip)\s+[^\n]*(?:dist|artifact|release)|\b(?:activate|rollback)\s+[^\n]*(?:release|production)|actions\/(?:download|upload)-artifact@/i;
const forbiddenRemote = /\b(?:ssh|scp|rsync|systemctl|kubectl|flyctl|vercel|netlify|docker\s+(?:push|compose)|curl[^\n]*\|\s*(?:sh|bash))\b/i;

export function parseWorkflow(source, file = "workflow") {
  try { return yaml.load(source); }
  catch (error) { throw new Error(`${file} is not valid YAML: ${error.message}`); }
}
const stepsText = (job) => (job?.steps ?? []).map((step) => [step.name, step.uses, step.run, JSON.stringify(step.with ?? {})].filter(Boolean).join(" ")).join("\n");
const needs = (job) => new Set(Array.isArray(job?.needs) ? job.needs : job?.needs ? [job.needs] : []);

export function validateReleaseWorkflow(source) {
  const errors = [];
  let workflow;
  try { workflow = parseWorkflow(source, releaseWorkflow); } catch (error) { return [error.message]; }
  const triggers = workflow?.on;
  if (!triggers || typeof triggers !== "object" || Object.keys(triggers).sort().join(",") !== "workflow_dispatch") errors.push("Release workflow trigger must be exactly workflow_dispatch.");
  const inputs = triggers?.workflow_dispatch?.inputs ?? {};
  for (const input of ["workflow_run_id", "commit_sha", "artifact_name", "artifact_digest"]) if (inputs[input]?.required !== true) errors.push(`workflow_dispatch input ${input} must be required.`);
  if (workflow?.permissions?.contents !== "read" || workflow?.permissions?.actions !== "read" || Object.keys(workflow?.permissions ?? {}).some((key) => !["contents", "actions"].includes(key))) errors.push("Release workflow permissions must be exactly contents: read and actions: read.");
  const jobs = workflow?.jobs ?? {};
  const order = ["select-artifact", "verify-artifact", "deploy-staging", "validate-staging", "promote-production", "rollback"];
  for (const name of order) if (!jobs[name]) errors.push(`Required release job missing: ${name}.`);
  for (let index = 1; index < order.length - 1; index += 1) if (jobs[order[index]] && !needs(jobs[order[index]]).has(order[index - 1])) errors.push(`${order[index]} must need ${order[index - 1]}.`);
  if (jobs.rollback && !needs(jobs.rollback).has("promote-production")) errors.push("rollback must reference the production promotion job.");
  const all = Object.values(jobs).map(stepsText).join("\n");
  if (/latest|last successful|head_branch/i.test(all)) errors.push("Mutable or latest-successful artifact selection is prohibited.");
  if (!/workflow_run_id/.test(stepsText(jobs["select-artifact"])) || !/commit_sha/.test(stepsText(jobs["select-artifact"]))) errors.push("Artifact selection must bind the approved workflow run and commit SHA.");
  if (!/artifact_name/.test(all) || !/artifact_digest/.test(all)) errors.push("Artifact name and digest inputs must be used.");
  const verify = stepsText(jobs["verify-artifact"]);
  if (!/(?:sha256sum|artifact_digest)/i.test(verify)) errors.push("Digest validation is required in verify-artifact.");
  if (/(?:tar\s|unzip|extract)/i.test(verify) && verify.search(/(?:tar\s|unzip|extract)/i) < verify.search(/(?:sha256sum|artifact_digest)/i)) errors.push("Digest validation must occur before extraction.");
  if (!/artifact_name/.test(stepsText(jobs["deploy-staging"])) || !/artifact_name/.test(stepsText(jobs["promote-production"]))) errors.push("Staging and production must use the same named tested artifact.");
  if (!/validat/i.test(stepsText(jobs["validate-staging"]))) errors.push("Staging validation must be explicit.");
  if (!/activat/i.test(stepsText(jobs["promote-production"]))) errors.push("Production activation must be explicit and occur after validation.");
  if (!/(?:previous|versioned|release_id)/i.test(stepsText(jobs.rollback))) errors.push("Rollback must reference a previously versioned release.");
  if (/\b(?:npm|yarn|pnpm)\s+(?:install|build)|\bvite\s+build\b/i.test(all)) errors.push("Release workflow must not rebuild product code.");
  return errors;
}

export function isSensitiveRecord(record) {
  const paths = [record.oldPath, record.newPath].filter(Boolean);
  if (paths.some((file) => pathPatterns.some((pattern) => pattern.test(file)))) return true;
  if (paths.every((file) => /\.(?:md|mdx)$/i.test(file))) return false;
  if (paths.includes("package.json")) {
    try {
      const before = JSON.parse(record.oldContent || "{}").scripts ?? {};
      const after = JSON.parse(record.newContent || "{}").scripts ?? {};
      return Object.keys({ ...before, ...after }).some((name) => before[name] !== after[name] && contentPattern.test([before[name], after[name]].filter(Boolean).join("\n")));
    } catch { return true; }
  }
  return contentPattern.test([record.oldContent, record.newContent].join("\n"));
}

export function evaluateChanges(records) {
  const errors = [];
  for (const record of records.filter(isSensitiveRecord)) {
    const paths = [record.oldPath, record.newPath].filter(Boolean);
    if (paths.includes(policyTest) && record.status !== "D") continue;
    if (paths.includes(policyScript) && record.status !== "D") {
      const source = record.newContent ?? "";
      const invariants = ["--name-status", "-z", "-M", "-C", "oldContent", "newContent", "evaluateChanges", "validateReleaseWorkflow"];
      const missing = invariants.filter((value) => !source.includes(value));
      if (missing.length || /(?:const|let|var)\s+allowedGovernanceFiles|process\.exit\(0\)/.test(source)) {
        errors.push(`${policyScript} removes required status/content checks or introduces a fail-open bypass: ${missing.join(", ") || "forbidden bypass"}.`);
      }
      continue;
    }
    if (paths.includes(releaseWorkflow) && record.status !== "D") {
      errors.push(...validateReleaseWorkflow(record.newContent ?? "").map((error) => `${releaseWorkflow}: ${error}`));
      continue;
    }
    if (paths.includes(governanceWorkflow) && record.status !== "D" && !forbiddenRemote.test(record.newContent ?? "")) continue;
    errors.push(`${record.status} ${paths.join(" -> ")} changes a deployment-sensitive surface outside the structurally approved release workflow.`);
  }
  return errors;
}

function gitOutput(args, repositoryRoot) { return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }); }
function changedRecords(repositoryRoot) {
  const base = process.env.GITHUB_BASE_REF?.trim();
  if (!base) return [];
  const baseRef = `origin/${base}`;
  const fields = gitOutput(["diff", "--name-status", "-z", "-M", "-C", `${baseRef}...HEAD`], repositoryRoot).split("\0");
  const records = [];
  for (let index = 0; index < fields.length - 1;) {
    const status = fields[index++]; const code = status[0]; const oldPath = fields[index++]; const newPath = ["R", "C"].includes(code) ? fields[index++] : oldPath;
    const oldContent = ["A"].includes(code) ? "" : (() => { try { return gitOutput(["show", `${baseRef}:${oldPath}`], repositoryRoot); } catch { return ""; } })();
    const absolute = path.join(repositoryRoot, newPath);
    const newContent = code === "D" || !existsSync(absolute) ? "" : readFileSync(absolute, "utf8");
    records.push({ status: code, oldPath, newPath, oldContent, newContent });
  }
  return records;
}

export function runDeploymentPolicy(repositoryRoot = root) {
  let errors = [];
  try { errors = evaluateChanges(changedRecords(repositoryRoot)); }
  catch (error) { errors = [`Could not calculate or inspect the pull request diff: ${error.message}`]; }
  for (const error of errors) console.error(`DEPLOYMENT POLICY FAILED: ${error}`);
  if (!errors.length) console.log("Deployment policy passed: all added, modified, deleted, copied, and renamed paths were evaluated.");
  return errors.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = runDeploymentPolicy();
