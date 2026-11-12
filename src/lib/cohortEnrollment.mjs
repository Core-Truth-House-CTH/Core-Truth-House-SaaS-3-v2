export const STANDARD_UNAVAILABLE = "Standard enrollment is not currently available";

export function cohortEnrollment(search = "") {
  const params = new URLSearchParams(search);
  const selections = ["seat_type", "cohort_tier", "seat", "tier", "plan"]
    .flatMap((key) => params.getAll(key))
    .map((value) => value.trim().toLowerCase());
  if (selections.includes("standard")) {
    return { available: false, seatType: "standard", message: STANDARD_UNAVAILABLE };
  }
  if (selections.some((value) => value !== "founding")) {
    return { available: false, seatType: null, message: "This enrollment selection is not available" };
  }
  return { available: true, seatType: "founding", message: "" };
}

export async function submitCohortApplication({ search, name, email, answers, authToken }, fetchImpl = globalThis.fetch) {
  const enrollment = cohortEnrollment(search);
  if (!enrollment.available) throw new Error(enrollment.message);
  const res = await fetchImpl("/api/cohort/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: JSON.stringify({ name: name.trim(), email: email.trim(), answers, seat_type: enrollment.seatType }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || payload.message || "Something went wrong.");
  }
}
