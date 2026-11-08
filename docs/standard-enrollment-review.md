# Standard enrollment pause — frontend companion

- Branch: `fix/standard-cohort-enrollment`.
- Worktree: `/root/cth-standard-frontend`.
- Baseline: `cdd2b63448f90b8dc495c7911b200a38928aac35`.
- Existing live frontend changes remain untouched on their original branch. The tracked diff/status/baseline were separately recorded under `/root/cth-standard-frontend-preservation`; unrelated uncommitted work was not copied into this checkout.

The public application page shows Standard as unavailable rather than advertising its $997 enrollment. Explicit Standard selections in seat_type/cohort_tier/seat/tier/plan URL parameters (including repeated/conflicting values) block submission; they are never rewritten to Founding. The helper validates again before making a request and posts an explicit Founding tier only for an available/default Founding selection. Backend errors are surfaced without fallback purchases.

The existing admin page only displays records and offers rejection, so no new approval control was added. Standard record labels and existing invite redemption are preserved. Existing live-session/onboarding copy remains out of scope.

Validation:

```sh
env -i PATH=/usr/bin:/bin /usr/bin/node tests/cohortEnrollment.test.mjs
git diff --check
```

20 tests pass using mocked fetch; no network is used. The modified JSX parses with the already installed Babel parser, read without changing live dependencies. Full browser/build integration is not verified. This is an uncommitted companion patch, not a deployed website change. The backend enforcement is authoritative.
