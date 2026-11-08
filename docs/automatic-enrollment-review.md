**Current price — $495 USD one-time for both batches.** Updated price checks/build/browser evidence and old497compatibility limits: `/root/cth-cohort-fulfillment/docs/price-change-review.md`. Earlier test counts below are historical.

# Automatic enrollment frontend review — 2026-10-22

Implemented in isolated `fix/standard-cohort-enrollment` only. New minimal Clerk enrollment shell (no paid/workspace gate), authenticated reservation page, deferred Stripe Payment Element/ConfirmationToken collection and server-only admitted payment/continuation calls. No raw card details enter application requests. Server evidence controls deadlines/status; forged success parameters grant nothing. Copy now states automatic account-based enrollment,12 initial plus exactly3 after12 verified initial payments, optional referrals, $495 USD once/lifetime Estate/self-paced AI guidance. Public phase has no invented remaining count. Standard pause/lifetime claims preserved.

New pages `src/pages/CohortEnrollmentShell.jsx`, `src/pages/CohortReservationPage.jsx`; affected App/apply/landing/helper/metadata and tests. Exact combined file list, commands, backend verification, independent review, remaining provider/auth limits and unauthorized rollout/rollback plan: `/root/cth-cohort-fulfillment/docs/automatic-enrollment-implementation-review.md`.

Final frontend suites20/14/27/10/3 separately passing; mounted Chromium33 existing plus9 automatic passing; nonproduction production build including ESLint/postbuild passing. Independent reviewer reran all listed frontend suites/browser cases. Actual Clerk, Stripe.js and bank challenge screens remain untested; mounted providers are mocks. No env files/provider accounts/real cards/emails/payments/production/commits/deployment used. Stop for review.
