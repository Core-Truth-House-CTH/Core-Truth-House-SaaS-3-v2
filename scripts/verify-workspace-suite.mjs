import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const requiredFiles = [
  "src/pages/WorkspacePage.jsx",
  "src/pages/workspace/WorkspacePage.jsx",
  "src/pages/workspace/WorkspaceControlsPage.jsx",
  "src/pages/workspace/WorkspaceShell.jsx",
  "src/pages/workspace/WorkspaceLibraryView.jsx",
  "src/pages/workspace/WorkspaceActiveWorkView.jsx",
  "src/pages/workspace/WorkspaceDecisionsView.jsx",
  "src/pages/workspace/WorkspaceActivityView.jsx",
  "src/pages/workspace/WorkspacePrivacyControl.jsx",
  "src/pages/workspace/WorkspaceAccessControls.jsx",
  "src/pages/workspace/WorkspaceSettingsControls.jsx",
  "src/pages/workspace/WorkspacePlanControls.jsx",
  "src/pages/workspace/workspaceApi.js",
  "src/pages/workspace/workspaceData.js",
  "src/pages/workspace/workspaceRoutes.js",
  "src/styles/workspace-suite.css",
  "src/styles/workspace-portal.css",
];

for (const file of requiredFiles) {
  expect(exists(file), `Missing Workspace file: ${file}`);
}

const routeSource = read("src/pages/workspace/workspaceRoutes.js");
const expectedRoutes = [
  "/workspace",
  "/workspace/library",
  "/workspace/active-work",
  "/workspace/decisions",
  "/workspace/members",
  "/workspace/activity",
  "/workspace/storage",
  "/workspace/controls/general",
  "/workspace/controls/members",
  "/workspace/controls/client-workspaces",
  "/workspace/controls/roles-permissions",
  "/workspace/controls/approvals",
  "/workspace/controls/notifications",
  "/workspace/controls/integrations",
  "/workspace/controls/data-privacy",
  "/workspace/controls/plan-billing",
  "/workspace/controls/activity-log",
  "/workspace/controls/danger-zone",
];

for (const route of expectedRoutes) {
  expect(routeSource.includes(`"${route}"`), `Workspace route is not registered: ${route}`);
}

const routerSource = read("src/navigation/AppRouter.jsx");
expect(
  routerSource.includes('path="/workspace/*"'),
  "AppRouter must protect the Workspace wildcard route."
);

const redirectSource = read("src/config/redirectRoutes.js");
expect(
  redirectSource.includes('path: "/workspace-library"') &&
    redirectSource.includes('redirectTo: "/workspace/library"'),
  "Legacy /workspace-library redirect is missing."
);

const shellSource = read("src/components/AuthShell.jsx");
expect(
  shellSource.includes('key: "workspace"') && shellSource.includes('path: "/workspace"'),
  "Workspace is missing from the shared authenticated navigation."
);

const workspacePageSource = read("src/pages/workspace/WorkspacePage.jsx");
expect(
  workspacePageSource.includes('legacyView === "work"') &&
    workspacePageSource.includes('legacyView === "decisions"'),
  "Command Center Workspace query links are not resolved."
);

const apiSource = read("src/pages/workspace/workspaceApi.js");
const requiredApiContracts = [
  ['settings: "/api/settings"', "Workspace settings"],
  ['tenantExport: "/api/tenant-data/full-export"', "Tenant export"],
  ['controls: "/api/workspace-controls"', "Workspace controls"],
  ['workbench: "/api/workspace-controls/workbench"', "Shared workbench"],
  ['decisions: "/api/workspace-controls/decisions"', "Decision queue"],
  ['activity: "/api/workspace-controls/activity"', "Workspace activity"],
  ['supportConsent: "/api/workspace-controls/support-consent"', "Support consent"],
  ['clientWorkspaces: "/api/workspace-controls/client-workspaces"', "Client Workspace provisioning"],
  ['deletionRequests: "/api/workspace-controls/deletion-requests"', "Deletion request"],
  ['openai: "/api/integrations/openai"', "OpenAI integration"],
  ['fal: "/api/integrations/fal"', "fal.ai integration"],
  ['higgsfield: "/api/integrations/higgsfield"', "Higgsfield integration"],
];

for (const [contract, label] of requiredApiContracts) {
  expect(apiSource.includes(contract), `${label} contract is missing.`);
}

const workspaceFiles = fs
  .readdirSync(path.join(root, "src/pages/workspace"))
  .filter((name) => /\.(js|jsx)$/.test(name))
  .map((name) => read(`src/pages/workspace/${name}`))
  .join("\n");

const forbiddenContracts = [
  "/api/workspace/${encode(workspaceId)}/settings",
  "/api/workspaces/${encodeURIComponent(data.activeWorkspaceId)}/exports",
  'navigate("/integrations")',
  'apiClient.post("/api/workspaces"',
  "db.workspaces.delete",
];

for (const contract of forbiddenContracts) {
  expect(!workspaceFiles.includes(contract), `Unsupported Workspace contract detected: ${contract}`);
}

const accessSource = read("src/pages/workspace/WorkspaceAccessControls.jsx");
expect(
  accessSource.includes("apiClient.put(API_PATHS.teams.memberRole"),
  "Member roles must use the backend PUT contract."
);
expect(
  accessSource.includes("createClientWorkspace"),
  "Estate client Workspace provisioning is not connected."
);

const activeWorkSource = read("src/pages/workspace/WorkspaceActiveWorkView.jsx");
expect(
  activeWorkSource.includes("patchWorkspaceWorkbench") && activeWorkSource.includes("DOMPurify.sanitize"),
  "Shared workbench persistence must sanitize notes before storage."
);

const privacySource = read("src/pages/workspace/WorkspacePrivacyControl.jsx");
expect(
  privacySource.includes("updateSupportConsent"),
  "Owner-authorized support consent is not connected."
);

const dangerSource = read("src/pages/workspace/WorkspacePlanControls.jsx");
expect(
  dangerSource.includes("requestWorkspaceDeletion") && dangerSource.includes("export_confirmed: true"),
  "Retention-aware Workspace deletion requests are not connected."
);

/*
 * Regression guards for the four blocking defects found in the post-visual
 * audit of the Workspace shell. Each asserts the property that was broken, not
 * a particular way of spelling the fix.
 */

// P1-1 - an Invalid Date passed straight to Intl.DateTimeFormat throws a
// RangeError, and this app mounts no ErrorBoundary, so it unmounted the tree.
const controlsPageSource = read("src/pages/workspace/WorkspaceControlsPage.jsx");
expect(
  !/\.format\(\s*new Date\(/.test(controlsPageSource),
  "Workspace controls must not pass a raw new Date(...) straight into Intl format; use the guarded renewal formatter."
);
expect(
  /Number\.isNaN\(\s*\w+\.getTime\(\)\s*\)/.test(controlsPageSource) &&
    controlsPageSource.includes("Renewal date unavailable"),
  "The renewal formatter must reject invalid dates and fall back to a fixed label."
);

// P1-2 - stale tenant payloads must never be presented or written through.
const dataSource = read("src/pages/workspace/workspaceData.js");
expect(
  dataSource.includes("useRef") && /fetchSequenceRef/.test(dataSource),
  "Workspace loading must use a monotonic stale-request guard."
);
expect(
  dataSource.includes("loadedWorkspaceId"),
  "Workspace state must record which workspace the committed payload belongs to."
);
expect(
  /if \(!isCurrent\(\)\) return;/.test(dataSource),
  "A superseded Workspace load must return before committing state."
);
expect(
  dataSource.includes("EMPTY_TENANT_SLICES") &&
    /trackedWorkspaceId !== activeWorkspaceId/.test(dataSource),
  "Tenant-derived slices must be cleared as soon as the active workspace changes."
);
expect(
  dataSource.includes("dataReadyForActiveWorkspace"),
  "Workspace data must expose whether the committed payload belongs to the active workspace."
);

// P1-2 (write side) and P2-1 - writes gated on ownership, edits kept on refresh.
const generalSource = read("src/pages/workspace/WorkspaceGeneralControls.jsx");
expect(
  generalSource.includes("dataReadyForActiveWorkspace") && generalSource.includes("canSave"),
  "Workspace settings writes must be gated on data belonging to the active workspace."
);
expect(
  /if \(!canSave\)/.test(generalSource),
  "save() must refuse to PATCH before the active workspace's data is committed."
);
expect(
  /disabled=\{saving \|\| !forms\.canSave \|\| !forms\.identityDirty\}/.test(generalSource) &&
    /disabled=\{saving \|\| !forms\.canSave \|\| !forms\.regionalDirty\}/.test(generalSource),
  "Both settings panels must disable Save while loading, cross-tenant, or unchanged."
);
expect(
  generalSource.includes("seededWorkspaceId") && generalSource.includes("identityDirtyRef"),
  "Settings forms must distinguish a tenant change from a same-tenant refresh so edits survive a reload."
);

// P2-2 - the approved five-column Controls Center must survive 1366px.
const workspaceCss = read("src/styles/workspace-suite.css");
const centreFourColumnBreakpoints = [
  ...workspaceCss.matchAll(/@media \(max-width:\s*(\d+)px\)\s*\{[^}]*\.ws-center-grid[^}]*repeat\(4/g),
].map((match) => Number(match[1]));
for (const width of centreFourColumnBreakpoints) {
  expect(
    width < 1360,
    `Controls Center drops to four columns at ${width}px; the approved layout is five columns down to 1360px.`
  );
}

const packageJson = JSON.parse(read("package.json"));
const dependencies = packageJson.dependencies || {};
const requiredDependencies = [
  "react",
  "react-router-dom",
  "@clerk/react",
  "axios",
  "dompurify",
  "zod",
  "@tiptap/react",
  "@dnd-kit/core",
  "@radix-ui/react-dialog",
  "@radix-ui/react-select",
  "@radix-ui/react-switch",
];

for (const dependency of requiredDependencies) {
  expect(Boolean(dependencies[dependency]), `Required Workspace dependency is missing: ${dependency}`);
}

if (failures.length) {
  console.error("Workspace suite verification failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Workspace suite verification passed: ${expectedRoutes.length} routes, ${requiredFiles.length} files, and ${requiredApiContracts.length} API contracts checked.`);
