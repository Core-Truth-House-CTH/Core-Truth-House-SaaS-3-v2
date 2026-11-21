// Billing page credits (Agent Tasks 21): balances come from the usage summary, split monthly / purchased / total.
import test from "node:test";
import assert from "node:assert/strict";
import { LIFETIME_PLAN_LABEL, creditsView, refillLabel, formatCredits } from "../src/lib/billingCredits.mjs";

const FOUNDER = { allowance_remaining: 900, purchased_credit_balance: 500, credit_balance: 1400, refill_on: "2026-12-13", unlimited: false };

test("the lifetime plan label is the approved wording", () => {
  assert.equal(LIFETIME_PLAN_LABEL, "Founding Cohort · Estate, lifetime access");
});

test("monthly and purchased credits are shown separately, then the total, with the refill date", () => {
  assert.deepEqual(creditsView(FOUNDER), { unlimited: false, monthly: 900, purchased: 500, total: 1400, refill: "December 13" });
});

test("a real balance is never read as 0: the old billing-summary fields are ignored", () => {
  const view = creditsView({ ...FOUNDER, credits: { available: 0 }, available_credits: 0 });
  assert.equal(view.total, 1400);
});

test("no refill date when nothing refills", () => {
  assert.equal(creditsView({ ...FOUNDER, refill_on: null }).refill, null);
  assert.equal(refillLabel("not a date"), null);
});

test("the refill day does not shift with the viewer's time zone", () => {
  assert.equal(refillLabel("2027-01-01"), "January 1");
  assert.equal(refillLabel("2027-02-28"), "February 28");
});

test("the exempt workspace shows Unlimited", () => {
  assert.deepEqual(creditsView({ unlimited: true }), { unlimited: true });
});

test("a missing or broken usage answer shows nothing rather than a made-up 0", () => {
  for (const bad of [null, undefined, {}, { ...FOUNDER, credit_balance: undefined }, { ...FOUNDER, purchased_credit_balance: -1 }, { ...FOUNDER, allowance_remaining: "900" }]) {
    assert.equal(creditsView(bad), null);
  }
});

test("large balances read with a thousands separator", () => {
  assert.equal(formatCredits(2400), "2,400");
});
