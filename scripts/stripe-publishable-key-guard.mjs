export function validateStripePublishableKey(env = {}) {
  const stripeKey = typeof env.VITE_STRIPE_PUBLISHABLE_KEY === "string"
    ? env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : "";
  const clerkKey = typeof env.VITE_CLERK_PUBLISHABLE_KEY === "string"
    ? env.VITE_CLERK_PUBLISHABLE_KEY.trim()
    : "";

  if (!stripeKey) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is required for production builds.");
  }
  if (!stripeKey.startsWith("pk_")) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY must start with pk_.");
  }
  if (clerkKey && stripeKey === clerkKey) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY must differ from VITE_CLERK_PUBLISHABLE_KEY.");
  }
  return true;
}
