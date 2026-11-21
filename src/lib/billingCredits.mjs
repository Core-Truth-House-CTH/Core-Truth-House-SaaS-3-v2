// Billing page credits (Agent Tasks 21). Balances come from GET /api/usage/summary, the same buckets the
// server spends from: monthly allowance first, purchased credits last. The billing summary carries no balance.

export const LIFETIME_PLAN_LABEL = "Founding Cohort · Estate, lifetime access";

const count = (value) => (Number.isInteger(value) && value >= 0 ? value : null);

// "2026-12-13" -> "December 13" (the server sends a UTC date; read it as UTC so no time zone moves the day).
export function refillLabel(isoDate) {
  if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const day = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return null;
  return day.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}

// null when the usage summary did not load or is not a usable credit account.
export function creditsView(usage) {
  if (!usage || typeof usage !== "object") return null;
  if (usage.unlimited === true) return { unlimited: true };
  const monthly = count(usage.allowance_remaining);
  const purchased = count(usage.purchased_credit_balance);
  const total = count(usage.credit_balance);
  if (monthly === null || purchased === null || total === null) return null;
  return { unlimited: false, monthly, purchased, total, refill: refillLabel(usage.refill_on) };
}

export const formatCredits = (n) => n.toLocaleString("en-US");
