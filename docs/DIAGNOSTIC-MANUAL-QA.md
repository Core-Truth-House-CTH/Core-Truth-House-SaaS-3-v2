# Brand Diagnostic Candidate Manual QA

Date: 2026-10-19  
Environment: local candidate frontend and sandbox backend  
Evidence type: user-observed manual QA; not automated and not production

The checks under “Passed observations” and “Start New Diagnostic check” were
completed before the latest UX changes. Post-fix checks are recorded separately
below. All evidence is local manual QA, not automated or production validation.

## Passed observations

- A new Clerk Development secret was created by the user after the original could not be copied. The user entered it through the launcher's hidden prompt and restarted the local backend; authentication then proceeded. No secret value is recorded here.
- **Continue to saved results** opens the full saved report for an unpaid account. Reloading the report works without plan selection.
- In a fresh Incognito session, opening a private report URL requests sign-in. After signing in, the browser returns to the full report without a billing interruption.
- In fresh signed-out Incognito, the quiz is public. After answering questions, it offers Create Account / Sign In. Signing in with the existing test account opens the new report, **CTH Test October 19**, without repeating the quiz or selecting a plan.
- Refresh and saved history show the new report once alongside the earlier report.

## Start New Diagnostic check

- Passed at 18:31 UTC per user confirmation: **Start New Diagnostic** clears the previous answers. This was manually confirmed before the latest UX changes.

## UX issues addressed; reverify before release

- History could display **No saved diagnostics yet** when workspace initialization prevented a history request or when the history request failed. The candidate now distinguishes workspace unavailable, loading, error, successful-empty, and results states. Error/retry was manually verified below; the successful-empty branch is covered by a focused state-selection unit test.
- For an unpaid account, Login from the diagnostic page previously defaulted into the app and reached billing. The candidate now returns that Login flow to the diagnostic URL; top Login and quiz draft restoration passed below. The saved report also returned after sign-in. Other public-page Login defaults were not separately re-tested, though their shared-header default remains `/sign-in`.

## Post-fix manual verification

- Passed at 19:03 UTC per user confirmation: from a fresh Incognito visit to the local diagnostic page, the top-right Login link followed by sign-in returned to the diagnostic page instead of **Choose Your Plan**.
- Passed at 19:06 UTC per user confirmation: the saved full report still loads after sign-in.
- Passed at 19:08 UTC per user confirmation: in fresh Incognito, the first quiz answer was retained after top-right Login and sign-in.
- Passed at 19:58–19:59 UTC per user confirmation: blocking the diagnostic history request from its Network row produced a fetch error with **Retry saved diagnostics** instead of a false empty state. After disabling request blocking, Retry restored the saved history. The initially typed blocking pattern matched no requests; the effective check used **Block request URL** on the actual request row. Request blocking was disabled after recovery.
- The successful-empty branch is covered by `diagnosticHistoryState.test.mjs`: an initialized, active workspace with a completed, error-free zero-result response resolves to `empty`. A separate manual 200-empty response was not exercised.
- Passed at 20:07 UTC per user visual review: the increased space between the diagnostic action buttons and the Free 15-question assessment notice is clear and feels better. This is a local candidate visual check, not production validation.

## Release-readiness recommendation

No known functional blocker remains in the diagnostic-only candidate. Focused tests, lint, build, and the user-observed local error/recovery and auth-return flows pass. A manual successful-empty API response and a non-diagnostic public-page Login smoke check were not separately run; the empty-state selection is covered at unit level and the shared Login default is unchanged. These results do not establish production behavior.
