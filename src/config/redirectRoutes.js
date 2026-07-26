export const REDIRECT_ROUTES = [
  {
    path: "/dashboard",
    redirectTo: "/command-center",
    tooltip: "Redirects to Command Center.",
  },
  {
    path: "/audit",
    redirectTo: "/brand-diagnostic/",
    tooltip: "Redirects to Brand Audit.",
  },
  {
    path: "/workspace-library",
    redirectTo: "/workspace/library",
    tooltip: "Redirects the legacy Workspace Library route to the Workspace suite.",
  },
];

export function getRedirectRoute(path) {
  return REDIRECT_ROUTES.find((route) => route.path === path) || null;
}
