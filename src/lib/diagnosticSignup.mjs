// Keep both diagnostic entry paths equivalent through Clerk sign-up sub-routes.
export function getDiagnosticSignupState(params) {
  const source = params.get("source");
  const diagnostic = source === "diagnostic" || source === "diagnostic_return";
  const tier = params.get("tier") || "";
  return {
    diagnosticContext: diagnostic ? {
      tier,
      score: params.get("score") || "",
      challenge: params.get("challenge") || "",
      first_name: params.get("first_name") || "",
      source,
    } : null,
    persistedContext: diagnostic ? Object.fromEntries(params.entries()) : null,
    redirectUrl: params.get("redirect_url") || (
      diagnostic
        ? (tier
            ? "/billing?welcome=diagnostic&tier=" + encodeURIComponent(tier)
            : "/billing?welcome=diagnostic")
        : "/command-center"
    ),
  };
}
