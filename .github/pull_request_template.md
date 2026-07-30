## Build identity

- Build or work package:
- Base branch:
- Starting SHA:
- Ending SHA:
- Related approved specification:
- Owner approval reference, when required:

## Product responsibility

Describe what this pull request owns and what it deliberately leaves with other Core Truth House products.

## Shared infrastructure reused

- [ ] Command Workspace shell
- [ ] Clerk and Auth shell
- [ ] active workspace context
- [ ] entitlement service
- [ ] shared API client
- [ ] shared navigation and route registry
- [ ] shared notifications and account controls
- [ ] Core Truth House design tokens

Explain any unchecked item.

## Routes

### Added

- None

### Changed

- None

### Preserved legacy routes

- None

## Data ownership

- Canonical record or collection changed:
- Workspace isolation method:
- Versioning or lock behavior:
- Existing duplicate fields discovered:
- Migration required:
- Rollback path:

## Scope evidence

- Files added:
- Files modified:
- Files deleted:
- Dependency changes:
- `yarn.lock` changed: Yes / No
- Unrelated files intentionally untouched:

## Validation

- [ ] locked dependency install
- [ ] lockfile stability check
- [ ] lint
- [ ] automated tests
- [ ] route contract
- [ ] architecture contract
- [ ] production build
- [ ] responsive check
- [ ] accessibility check
- [ ] authenticated staging smoke test, when applicable
- [ ] visual comparison to approved reference, when applicable

List exact commands and results:

```text

```

## Product-flow verification

- Upstream source:
- Downstream consumers:
- Empty state:
- Loading state:
- Error state:
- Unauthorized state:
- Workspace-switch behavior:
- Stale-request protection:

## Security review

- [ ] backend authorization protects privileged actions
- [ ] no production secret is present in code or logs
- [ ] no cross-workspace access path was introduced
- [ ] no direct production VPS mutation is included
- [ ] no destructive migration runs automatically

## Known limitations

List every placeholder, mock, deferred endpoint, owner decision, and unverified assumption.

## Release posture

- [ ] Draft only
- [ ] Ready for review
- [ ] Staging candidate
- [ ] Production candidate

Production promotion requires a separately approved release workflow and immutable artifact.
