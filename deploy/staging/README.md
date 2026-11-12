# Staging frontend safeguards

1. **Build**: `yarn build:staging` (no arguments). Needs `VITE_API_BASE_URL=https://staging-api.coretruthhouse.com`
   plus `pk_test_` values for `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_CLERK_PUBLISHABLE_KEY`, from `.env.staging`
   or the environment. It refuses anything else, builds into a new `.artifacts/staging/<time>` folder with no
   production default API address, then runs step 2.
2. **Scan**: `yarn scan:staging <folder>` fails if the folder contains `api.coretruthhouse.com`,
   `clerk.coretruthhouse.com`, or any `pk_/sk_/rk_live_` key, or lacks the staging API address.
   Run it on any folder before it is copied to staging.
3. **Browser limit**: `cth-staging-csp.conf` is a Content-Security-Policy `connect-src` that only allows
   the staging API, Clerk test, and Stripe. Install on the staging server only (needs root), add
   `include snippets/cth-staging-csp.conf;` after the existing `include snippets/cth-staging-common.conf;`
   in the `staging.coretruthhouse.com` server block, run `nginx -t`, reload, and confirm with
   `curl -I` (basic auth) that the header is present and that sign-in still works.

None of this runs in a production build, and `yarn build` is unchanged.
