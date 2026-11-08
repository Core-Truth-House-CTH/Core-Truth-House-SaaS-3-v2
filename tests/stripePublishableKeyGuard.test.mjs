import test from "node:test";
import assert from "node:assert/strict";
import { validateStripePublishableKey } from "../scripts/stripe-publishable-key-guard.mjs";

test("production Stripe publishable key must be present", () => {
  assert.throws(() => validateStripePublishableKey({}), /VITE_STRIPE_PUBLISHABLE_KEY is required/);
});

test("production Stripe key must use a publishable-key prefix", () => {
  assert.throws(
    () => validateStripePublishableKey({ VITE_STRIPE_PUBLISHABLE_KEY: "sk_live_synthetic" }),
    /must start with pk_/,
  );
});

test("Stripe and Clerk publishable keys must differ", () => {
  const shared = "pk_live_synthetic_shared";
  assert.throws(
    () => validateStripePublishableKey({
      VITE_STRIPE_PUBLISHABLE_KEY: shared,
      VITE_CLERK_PUBLISHABLE_KEY: shared,
    }),
    /must differ from VITE_CLERK_PUBLISHABLE_KEY/,
  );
});

test("a distinct Stripe publishable key is accepted", () => {
  assert.equal(validateStripePublishableKey({
    VITE_STRIPE_PUBLISHABLE_KEY: "pk_live_synthetic_stripe",
    VITE_CLERK_PUBLISHABLE_KEY: "pk_live_synthetic_clerk",
  }), true);
});
