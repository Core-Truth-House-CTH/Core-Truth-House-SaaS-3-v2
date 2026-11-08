import test from "node:test";
import assert from "node:assert/strict";
import { cohortEnrollment, submitCohortApplication, STANDARD_UNAVAILABLE } from "../src/lib/cohortEnrollment.mjs";

const input = { name: " Synthetic ", email: " synthetic@example.invalid ", answers: {} };
for (const key of ["seat_type", "cohort_tier", "seat", "tier", "plan"]) {
  for (const value of ["standard", " Standard "]) {
    test(`Standard ${key}=${value} cannot submit or become Founding`, async () => {
      const search = `?${key}=${encodeURIComponent(value)}`;
      assert.deepEqual(cohortEnrollment(search), { available: false, seatType: "standard", message: STANDARD_UNAVAILABLE });
      let requests = 0;
      await assert.rejects(() => submitCohortApplication({ ...input, search }, async () => { requests++; }), { message: STANDARD_UNAVAILABLE });
      assert.equal(requests, 0);
    });
  }
}
for (const search of ["?tier=founding&tier=standard", "?seat_type=founding&plan=standard", "?tier=standard&tier=founding"]) {
  test(`Conflicting selection ${search} stays blocked`, async () => {
    assert.equal(cohortEnrollment(search).available, false);
    await assert.rejects(() => submitCohortApplication({ ...input, search }, () => assert.fail("No request allowed")), { message: STANDARD_UNAVAILABLE });
  });
}
for (const search of ["?tier=unknown", "?seat_type="]) {
  test(`Unknown explicit selection ${search} is not converted`, async () => {
    assert.equal(cohortEnrollment(search).available, false);
    await assert.rejects(() => submitCohortApplication({ ...input, search }, () => assert.fail("No request allowed")));
  });
}
for (const search of ["", "?tier=founding", "?seat_type= Founding ", "?utm_source=synthetic"]) {
  test(`Founding selection ${search} submits an explicit Founding application`, async () => {
    let requests = 0;
    await submitCohortApplication({ ...input, search }, async (url, options) => {
      requests++;
      assert.equal(url, "/api/cohort/apply");
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(options.body), { name: "Synthetic", email: "synthetic@example.invalid", answers: {}, seat_type: "founding" });
      return { ok: true };
    });
    assert.equal(requests, 1);
  });
}
test("Backend availability response is shown rather than retried as Founding", async () => {
  let requests = 0;
  await assert.rejects(() => submitCohortApplication(input, async () => {
    requests++;
    return { ok: false, json: async () => ({ detail: STANDARD_UNAVAILABLE }) };
  }), { message: STANDARD_UNAVAILABLE });
  assert.equal(requests, 1);
});
