// Founding Cohort waitlist helpers. Values must match the backend
// (backend/routes/cohort_waitlist.py), which rejects anything else.

export const WAITLIST_YEARS = [
  "Not launched yet",
  "Less than 1 year",
  "1 to 2 years",
  "3 to 5 years",
  "6 to 10 years",
  "More than 10 years",
];

export const WAITLIST_TIERS = ["Foundation", "Structure", "House", "Estate"];

export const WAITLIST_SOURCES = ["cohort_apply", "cohort_page", "brand_diagnostic", "diagnostic_return", "direct"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function waitlistHref({ source = "direct", tier = null } = {}) {
  const query = new URLSearchParams();
  if (WAITLIST_SOURCES.includes(source)) query.set("source", source);
  if (WAITLIST_TIERS.includes(tier)) query.set("tier", tier);
  const text = query.toString();
  return `/cohort/waitlist${text ? `?${text}` : ""}`;
}

export function parseWaitlistQuery(search = "") {
  const query = new URLSearchParams(search);
  const source = query.get("source");
  const tier = query.get("tier");
  return {
    source: WAITLIST_SOURCES.includes(source) ? source : "direct",
    tier: WAITLIST_TIERS.includes(tier) ? tier : null,
  };
}

export function waitlistPayload(form, { source = "direct", recommendedTier = null } = {}) {
  const name = String(form.name || "").trim();
  const email = String(form.email || "").trim();
  const businessName = String(form.businessName || "").trim();
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!EMAIL.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!businessName) return { ok: false, error: "Please enter your business name." };
  if (!WAITLIST_YEARS.includes(form.yearsInBusiness)) return { ok: false, error: "Please choose how long you have been in business." };
  if (form.usResident !== "yes" && form.usResident !== "no") return { ok: false, error: "Please tell us whether you are a US resident." };
  const body = {
    name,
    email,
    business_name: businessName,
    years_in_business: form.yearsInBusiness,
    us_resident: form.usResident === "yes",
    source: WAITLIST_SOURCES.includes(source) ? source : "direct",
  };
  if (WAITLIST_TIERS.includes(recommendedTier)) body.recommended_tier = recommendedTier;
  // Honeypot: people never see this field. The backend quietly discards any
  // submission that fills it, so a bot gets a normal-looking answer.
  const honeypot = String(form.hp || "").trim();
  if (honeypot) body.cth_hp_field = honeypot.slice(0, 500);
  return { ok: true, body };
}
