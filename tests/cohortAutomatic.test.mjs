import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { submitCohortApplication } from "../src/lib/cohortEnrollment.mjs";

test("Authenticated application transports token, no client account identity", async () => {
  await submitCohortApplication({ name: " Synthetic ", email: " synthetic@example.invalid ", answers: {referral_comfort:"No"}, authToken:"synthetic_auth", account_id:"forged" }, async (url,opts) => {
    assert.equal(url,"/api/cohort/apply");assert.equal(opts.headers.Authorization,"Bearer synthetic_auth");
    assert.equal(JSON.parse(opts.body).account_id,undefined);assert.equal(JSON.parse(opts.body).answers.referral_comfort,"No");
    return {ok:true};
  });
});
test("Application and metadata contain automatic approved offer without review/referral obligation", () => {
  for (const path of ["src/pages/CohortApplyPage.jsx","scripts/inject-static-route-metadata.mjs"]) {
    const source=fs.readFileSync(path,"utf8");
    assert.doesNotMatch(source,/reviewed by hand|review every application|hear.*within 48 hours|admit 8 founders|Eight founders|In exchange/i);
    assert.match(source,/12/);assert.match(source,/3/);assert.match(source,/automatic/i);
  }
});
test("Reservation uses Stripe client collection, server-only confirmation, and no URL payment proof",()=>{
  const source=fs.readFileSync("src/pages/CohortReservationPage.jsx","utf8");
  assert.match(source,/createConfirmationToken/);assert.match(source,/handleNextAction/);
  assert.doesNotMatch(source,/confirmPayment\(|card_number|\.get\("paid"\)/);
  assert.match(source,/verification_deadline/);assert.match(source,/Timing verification pending/);
  assert.match(source,/isSignedIn/);assert.match(source,/UTC/);
});
