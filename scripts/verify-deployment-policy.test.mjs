import test from "node:test";
import assert from "node:assert/strict";
import { evaluateChanges, validateReleaseWorkflow } from "./verify-deployment-policy.mjs";

const fails = (record) => assert.notEqual(evaluateChanges([record]).length, 0);
test("governance workflow cannot introduce deployment commands", () => fails({ status: "M", oldPath: ".github/workflows/cth-governance-gate.yml", newPath: ".github/workflows/cth-governance-gate.yml", newContent: "jobs:\n  x:\n    steps:\n      - run: ssh prod activate" }));
test("deleted safeguard is sensitive", () => fails({ status: "D", oldPath: "ops/check.service", newPath: "ops/check.service", oldContent: "safeguard" }));
test("renamed deployment file is sensitive", () => fails({ status: "R", oldPath: "deploy.sh", newPath: "safe.txt", oldContent: "release" }));
test("Dockerfile is sensitive", () => fails({ status: "A", oldPath: "Dockerfile", newPath: "Dockerfile", newContent: "FROM node" }));
test("package deployment script is sensitive", () => fails({ status: "M", oldPath: "package.json", newPath: "package.json", newContent: '{"scripts":{"ship":"ssh vps"}}' }));
test("neutral operational shell script is sensitive", () => fails({ status: "A", oldPath: "scripts/sync.sh", newPath: "scripts/sync.sh", newContent: "rsync dist host:x" }));
test("documentation-only change passes", () => assert.deepEqual(evaluateChanges([{ status: "M", oldPath: "docs/guide.md", newPath: "docs/guide.md", newContent: "spelling only" }]), []));
test("marker words and comments do not satisfy the release workflow contract", () => {
  assert.notEqual(validateReleaseWorkflow(`# workflow_dispatch permissions digest staging production rollback\nname: fake\non: push\njobs: {}`).length, 0);
});
test("structured immutable-artifact release sequence passes", () => {
  const source = `
on:
  workflow_dispatch:
    inputs:
      workflow_run_id: { required: true }
      commit_sha: { required: true }
      artifact_name: { required: true }
      artifact_digest: { required: true }
permissions: { contents: read, actions: read }
jobs:
  select-artifact:
    steps:
      - run: echo "\${{ inputs.workflow_run_id }} \${{ inputs.commit_sha }} \${{ inputs.artifact_name }} \${{ inputs.artifact_digest }}"
  verify-artifact:
    needs: select-artifact
    steps:
      - run: echo "\${{ inputs.artifact_digest }}" | sha256sum --check
      - run: tar xf "\${{ inputs.artifact_name }}"
  deploy-staging:
    needs: verify-artifact
    steps:
      - run: stage "\${{ inputs.artifact_name }}"
  validate-staging:
    needs: deploy-staging
    steps:
      - run: validate staging
  promote-production:
    needs: validate-staging
    steps:
      - run: activate "\${{ inputs.artifact_name }}"
  rollback:
    needs: promote-production
    steps:
      - run: rollback previous versioned release_id
`;
  assert.deepEqual(validateReleaseWorkflow(source), []);
});
test("mutable latest artifact selection and rebuilds fail", () => {
  assert.match(validateReleaseWorkflow(`on: { workflow_dispatch: { inputs: {} } }\npermissions: {}\njobs: { x: { steps: [{ run: "download latest successful; yarn build" }] } }`).join("\n"), /Mutable|rebuild/);
});
