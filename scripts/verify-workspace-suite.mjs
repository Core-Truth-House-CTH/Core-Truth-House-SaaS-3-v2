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
expect(apiSource.includes('settings: "/api/settings"'), "Workspace settings must use /api/settings.");
expect(apiSource.includes('tenantExport: "/api/tenant-data/full-export"'), "Tenant export contract is missing.");
expect(apiSource.includes('openai: "/api/integrations/openai"'), "OpenAI integration contract is missing.");
expect(apiSource.includes('fal: "/api/integrations/fal"'), "fal.ai integration contract is missing.");
expect(apiSource.includes('higgsfield: "/api/integrations/higgsfield"'), "Higgsfield integration contract is missing.");

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
];

for (const contract of forbiddenContracts) {
  expect(!workspaceFiles.includes(contract), `Unsupported Workspace contract detected: ${contract}`);
}

const accessSource = read("src/pages/workspace/WorkspaceAccessControls.jsx");
expect(
  accessSource.includes("apiClient.put(API_PATHS.teams.memberRole"),
  "Member roles must use the backend PUT contract."
);

const packageJson = JSON.parse(read("package.json"));
const dependencies = packageJson.dependencies || {};
const requiredDependencies = [
  "react",
  "react-router-dom",
  "@clerk/react",
  "axios",
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

console.log(`Workspace suite verification passed: ${expectedRoutes.length} routes and ${requiredFiles.length} required files checked.`);
