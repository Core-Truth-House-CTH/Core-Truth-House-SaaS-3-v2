# Foundation Truth Master Build Specification

## Purpose

Foundation is the canonical workspace where a brand's approved truth is assembled, reviewed, versioned, and locked before downstream Core Truth House products use it.

The experience must feel like one room inside the existing Command Workspace. It must not behave like a separate application or duplicate products already present in the House.

## Product outcome

A workspace can move from diagnostic evidence to one approved Foundation version that downstream systems can trust.

The completed flow is:

1. review diagnostic insight
2. establish core truth
3. approve audience truth
4. define positioning
5. define messaging
6. reference approved brand expression
7. resolve conflicts
8. approve and lock the Foundation
9. activate downstream products from the locked version

## Canonical route family

- `/foundation`
- `/foundation/diagnostic`
- `/foundation/core-truth`
- `/foundation/audience`
- `/foundation/positioning`
- `/foundation/messaging`
- `/foundation/expression`
- `/foundation/review`

## Canonical data model

One workspace-level record:

```text
brand_foundation
  workspace_id
  version
  status
  completion
  diagnostic
  core_truth
  audience
  positioning
  messaging
  expression
  conflicts
  created_by
  updated_by
  approved_by
  locked_by
  created_at
  updated_at
  approved_at
  locked_at
```

### State rules

- Draft data may be edited by authorized workspace members.
- Review state prevents silent structural changes while approval is pending.
- Approved and locked versions are immutable.
- Editing a locked Foundation creates a new draft revision.
- Downstream products use the locked version unless an explicit preview contract permits draft data.
- Every read and write is scoped to the active workspace.

## Existing product handoffs

### Brand Audit

Brand Audit remains the diagnostic tool. Foundation Diagnostic Insight receives the completed audit summary, structural gaps, recommendations, and evidence references.

### Identity Studio

Identity Studio remains the asset and visual identity manager. Foundation Brand Expression stores approved references, voice rules, selected identity decisions, and version context without copying the media library.

### Command Center

Command Center consumes:

- Foundation readiness score and state
- current locked version
- unresolved conflict count
- primary audience
- brand promise
- weakest incomplete section
- recommended next move

### Structure and Strategic OS

Structure consumes locked positioning and messaging. It must not establish a second authoritative copy.

### Content Studio

Content Studio consumes the locked audience, promise, voice, vocabulary, proof, and positioning context.

### Offer Builder

Offer Builder consumes the locked transformation, objections, promise, audience, and positioning context.

### Signal OS

Signal OS compares market evidence against the locked audience and positioning profile.

### Reports

Reports retain the Foundation version identifier used when a report was generated.

## Build order

## Machine-readable implementation phase

The authoritative phase is `implementationPhase` in
`FOUNDATION-DATA-CONTRACT.json`. It is `contract-only` during governance and
must change to `implementation-active` in the same reviewed change that adds
all eight canonical routes and their complete Foundation import graph. Route
presence must never be used to infer this phase.

### Phase 0: Governance and CI

- repository instructions
- ownership map
- route contract
- architecture checks
- CI gate
- pull request evidence template

### Phase 1: Current-state audit

- map existing Foundation-related frontend fields
- map backend persistence endpoints and collections
- identify duplicate sources of truth
- identify legacy route consumers
- identify auth, workspace, entitlement, and shell dependencies

No migration or deletion occurs in this phase.

### Phase 2: Backend contract

- canonical schema
- workspace isolation
- read, save, review, approve, lock, and revise endpoints
- conflict representation
- version history
- authorization rules
- migration plan with rollback

### Phase 3: Shared frontend foundation

- route registration
- existing Command Workspace shell
- horizontal Foundation stepper
- shared API client
- workspace and entitlement context
- loading, empty, error, and unauthorized states

### Phase 4: Foundation screens

Build the eight routes in route order. Each screen must be usable, responsive, connected to the canonical record, and covered by tests before the next screen is considered complete.

### Phase 5: Downstream activation

Connect Command Center, Structure, Content Studio, Offer Builder, Signal OS, and Reports only after the locked-version contract is stable.

### Phase 6: Staging validation

- authenticated smoke matrix
- workspace-switch testing
- role and entitlement testing
- responsive testing
- accessibility testing
- console and network review
- visual comparison to approved references

### Phase 7: Production promotion

- merge approved release commit
- build once in GitHub Actions
- deploy immutable artifact to a new VPS release directory
- run production smoke checks
- activate atomically
- retain the displaced live artifact for three months

## Prohibited shortcuts

- local storage as production persistence
- demo fallback in production
- a new sidebar or separate application shell
- direct imports into another product's private implementation
- duplicate Foundation records per page
- destructive migration without a verified rollback
- source builds on the production VPS
- direct feature-branch deployment
- cleanup during the initial release
