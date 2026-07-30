# Foundation Acceptance Criteria

A screen is not complete because it renders. Completion requires verified product behavior, system integration, and evidence.

## System integrity

- One canonical Foundation record exists per workspace.
- Workspace A can never read or mutate Workspace B data.
- Locked versions cannot be edited in place.
- Editing a locked version creates a new draft revision.
- Downstream products identify which locked Foundation version they consumed.
- Legacy fields are mapped before any duplicate source is removed.
- Backend authorization enforces write, review, approve, and lock permissions.

## Route integrity

- The machine-readable Foundation phase is changed only with the complete
  canonical route family.
- Contract-only governance contains no Foundation product route or product import.

- All eight `/foundation` routes are registered in both route systems where required.
- Defined child routes resolve before any Foundation wildcard.
- Legacy routes remain functional through explicit compatibility handling.
- `/brand-audit` remains the audit product.
- `/identity-studio` remains the identity and media product.
- `/brand-memory` is not changed until its existing dual-purpose behavior is resolved.

## Shared shell integrity

- Every Foundation page uses the existing authenticated Command Workspace shell.
- No global or inner-page sidebar is introduced.
- The Foundation stepper is horizontal and scrollable on small screens.
- Search, notifications, Ask the House, account controls, and workspace switching use shared controls.
- A workspace switch cancels or invalidates stale requests before they can overwrite the new workspace state.

## Screen behavior

Every screen has verified:

- loading state
- empty state
- error state
- unauthorized state
- validation state
- dirty-state protection
- save success and failure behavior
- keyboard navigation
- mobile layout
- no horizontal overflow at supported widths

## Foundation Home

- Shows readiness score and status from the canonical record.
- Shows current version and lock state.
- Shows unresolved conflict count.
- Shows primary audience and brand promise from the same version.
- Shows the weakest incomplete section.
- Shows a next best move that links to a valid route.
- Section completion matches backend completion rules.

## Diagnostic Insight

- References a completed Brand Audit without recreating the audit.
- Shows audit date, score, structural gaps, recommendations, and evidence links.
- Handles a missing or incomplete audit without fabricating results.

## Core Truth

- Persists purpose, mission, vision, values, beliefs, and proof to the canonical record.
- Applies schema validation and completion rules.
- Supports ordering where the approved design requires it.

## Audience Truth

- Persists one canonical primary audience definition.
- Existing audience records are mapped or referenced through an approved migration contract.
- Positioning and messaging read the same audience identifier.

## Positioning

- Uses the canonical audience.
- Persists category, differentiation, transformation, and market position.
- Does not maintain a competing positioning record.

## Messaging

- Uses approved audience and positioning context.
- Persists promise, primary message, voice rules, vocabulary, and calls to action.
- Content Studio reads the locked messaging version.

## Brand Expression

- References Identity Studio assets and approved identity decisions.
- Does not copy or recreate the media library.
- Separates verbal rules from visual asset references.

## Review and Lock

- Calculates readiness from documented rules.
- Lists unresolved conflicts with evidence and severity.
- Prevents locking while blocking conflicts remain.
- Records reviewer, approver, locker, and timestamps.
- Produces an immutable locked version.
- Offers revision creation instead of direct editing.

## Downstream activation

- Command Center reflects Foundation readiness, conflict count, version, and next move.
- Structure reads locked positioning and messaging.
- Content Studio reads locked audience, promise, voice, proof, and vocabulary.
- Offer Builder reads locked transformation, objections, promise, and positioning.
- Signal OS compares evidence against the locked audience profile.
- Reports retain Foundation version context.

## Release evidence

Before production promotion, the pull request or release record contains:

- exact source commit SHA
- exact artifact identifier
- successful required checks
- unresolved blocking threads count of zero
- staging smoke results
- responsive and accessibility results
- visual comparison evidence
- rollback artifact or commit
- owner approval reference
