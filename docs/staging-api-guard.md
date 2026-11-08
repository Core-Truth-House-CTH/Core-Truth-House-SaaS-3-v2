# Staging API boundary (review required)

The real staging API hostname has not been verified. `config/staging-api.json` is deliberately `origin: null, reviewed: false`. Both Vite config entry points and `npm run build:staging` fail closed until a reviewer establishes the real staging service and changes this repository-owned policy. Do not substitute the production host or invent a staging hostname. Environment variables and command arguments cannot supply the reviewed pin.

## Later authorized build

1. Review the staging API deployment, TLS origin and isolation from production. Pin its canonical HTTPS origin without a trailing slash, credentials, path or explicit port, and mark the policy reviewed.
2. Set all three `VITE_API_BASE_URL`, `VITE_BACKEND_URL`, and `VITE_API_URL` to that exact literal origin in the staging inputs. API alias expansion is deliberately not supported. Clear legacy API overrides and conflicting generic/local files or shell values.
3. After build authorization, run `npm run build:staging`. It performs preflight, ESLint, the explicit active `vite.config.js` staging build, both existing route postprocessors and a final recursive output scan. Direct Vite staging builds through either checked-in config use the same guard and postprocessing.
4. Output is a fresh directory under `.artifacts/staging/`. It is not deployed. A final `staging-manifest.json` records mode, API origin, source HEAD and per-file SHA-256 hashes. Source HEAD identifies the base commit; uncommitted integration changes are reflected in output hashes, not a claim of a clean tree.
5. Verify that exact directory with `npm run verify:staging -- <directory>` before any later authorized deployment. No deployment integration was changed by this patch. An external deployment that ignores the verifier is not secured by this local guard.

`npm run build` retains the production lint/Stripe validation/postprocessor lifecycle and no longer accepts mode/config arguments; use the dedicated staging command instead. Both checked-in Vite configs now share one implementation. The alternate .ts config retains its existing non-staging dev host/proxy; staging never enables that proxy.

## Coverage

- All three effective Vite API aliases must match the independently reviewed pin. Vite's own loader supplies environment precedence and expansion semantics.
- All four staging-consumed raw dotenv files are scanned, including shadowed entries; API literals are checked individually. Matching shell variables, legacy overrides, resolved Vite defines, proxy/output/env-directory overrides and source/public files are checked without logging values.
- Browser API configuration is shared. Staging ignores no legacy escape hatch: runtime `window.__API_BASE_URL__` is rejected, the client cannot configure a foreign base or request an absolute foreign API URL, and all internal Fetch/Axios requests disable redirects in staging. Non-staging legacy/runtime behavior and compatibility fallback remain covered by tests.
- Literal production fallbacks are no longer in browser source. The non-staging compatibility fallback is supplied only by the Vite configuration.
- Final emitted files are scanned after route postprocessing, including gzip and Brotli. Common JSON/JS, percent, HTML-entity, Unicode/IDNA and string-concatenation spellings of the production hostname are normalized. Missing, empty, unpinned, secret-like or symlinked output fails. File mutations invalidate the manifest.

This is a build/configuration guard, not a network firewall, proof against arbitrarily obfuscated malicious code, or a guarantee about server-returned external media URLs or browser navigation code. The two explicit uncredentialed external-media download paths retain their existing behavior. Staging backend infrastructure, Clerk/Stripe configuration, browser end-to-end behavior, and deployment wiring need separate review. No actual build, deployment, production HTTP request or browser rehearsal was performed for this patch.

## Offline checks

`node --test tests/stagingApiGuard.test.mjs tests/stagingApiRuntime.test.mjs tests/stripePublishableKeyGuard.test.mjs`

Tests use reserved `.invalid` hostnames and temporary fixtures inside the private checkout. They call Vite configuration loading/resolution only, never Vite build. Synthetic HTML/JS fixtures exercise the existing postprocessors and final scanner. No real dotenv or secret values are copied into reports.
