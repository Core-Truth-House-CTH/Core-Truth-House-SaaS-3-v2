# Core Truth House Engineering Contract

This repository is a connected Brand Operating System. Treat every change as part of one ecosystem, not as an isolated page build.

## Required reading

Before changing Foundation, Structure, House, Command Center, Workspace, Reports, Signal OS, Content Studio, CRM, authentication, entitlements, routing, or deployment behavior, read:

- `docs/builds/foundation-truth/MASTER-BUILD-SPEC.md`
- `docs/builds/foundation-truth/SYSTEM-OWNERSHIP-MAP.md`
- `docs/builds/foundation-truth/ROUTE-MATRIX.md`
- `docs/builds/foundation-truth/ACCEPTANCE-CRITERIA.md`
- `docs/builds/foundation-truth/UI-CONTRACT.md`

## Shared infrastructure

Reuse the existing shared implementation for:

- authenticated Command Workspace shell
- Clerk authentication and user identity
- active workspace and tenant context
- plan entitlements and route gating
- Axios API client and workspace headers
- notifications and account controls
- Core Truth House design tokens
- navigation and route resolution

Do not create a competing shell, sidebar, authentication provider, workspace provider, entitlement service, API client, notification system, theme, or route registry.

## Foundation product boundary

Foundation owns one canonical workspace-level brand foundation record with versioning, review, approval, locking, and revision behavior.

Foundation owns:

- diagnostic insight references
- core truth
- audience truth
- positioning
- messaging
- approved brand expression references
- completion state
- conflict state
- approval and lock metadata

Foundation does not recreate:

- Brand Audit execution
- Identity Studio asset management
- Strategic OS
- Content Studio
- Offer Builder
- Signal OS
- Reports
- Command Center

Those products consume approved Foundation values through documented contracts.

## Source of truth

Positioning, Messaging, Audience, and Identity must not maintain competing authoritative copies after integration.

Use one workspace identifier and one canonical Foundation record. A locked version is immutable. Editing a locked Foundation creates a draft revision.

## Route requirements

The canonical Foundation route family is:

- `/foundation`
- `/foundation/diagnostic`
- `/foundation/core-truth`
- `/foundation/audience`
- `/foundation/positioning`
- `/foundation/messaging`
- `/foundation/expression`
- `/foundation/review`

Legacy routes must remain functional through explicit redirects or approved compatibility handling until all internal links are migrated. Do not silently delete or repurpose existing routes.

Every active route must be registered in `src/config/appRoutes.js` and `src/navigation/pageRegistry.jsx` where required.

## UI contract

- Use the existing authenticated Command Workspace shell.
- Do not add a global or inner-page sidebar.
- Use a horizontal Foundation stepper as local workflow navigation.
- Use the existing Core Truth House palette and typography tokens.
- Reuse the shared top navigation, search, notifications, Ask the House, account controls, and workspace context.
- Preserve the full-width ivory content frame and responsive gutters.
- Do not recreate Command Center, Workspace, Reports, Signal OS, or Knowledge Base inside Foundation.

## Change control

- Work only on a feature or governance branch.
- Open a Draft pull request first.
- Do not push directly to `main`, integration, release, or production branches.
- Do not deploy to the VPS from a feature branch.
- Do not install dependencies or run builds on the production VPS.
- Do not alter dependencies or `yarn.lock` without documenting the reason and receiving explicit approval.
- Do not mix feature implementation, deployment changes, database migration, or cleanup in one pull request.
- Preserve unrelated routes, files, data, and legacy behavior unless removal is explicitly authorized.

## Required validation

Before a pull request can move out of Draft:

1. locked dependency install
2. lint
3. automated tests
4. route contract verification
5. architecture boundary verification
6. production build
7. review of unresolved pull request threads
8. staging smoke test when the change affects runtime behavior
9. visual comparison when an approved reference exists

A build passing static checks is not proof of product completion.

## Review rules

Flag the change when it:

- duplicates shared infrastructure
- creates a second source of truth
- bypasses workspace isolation
- relies on frontend plan checks for security
- introduces a sidebar into Foundation
- breaks or silently replaces an existing route
- makes Command Center, Structure, House, or another product read draft data as approved truth
- permits edits to a locked version in place
- deploys source code instead of an immutable tested artifact
- mixes cleanup with release work
- places production secrets in code, logs, artifacts, or pull request text
