export const REDIRECT_ROUTES = [
  // Retired screen: old bookmarks use the normal authenticated destination.
  { path: "/lock-screen", redirectTo: "/command-center" },
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
];

export function getRedirectRoute(path) {
  return REDIRECT_ROUTES.find((route) => route.path === path) || null;
}
