# Foundation Route Matrix

## Target routes

All canonical Foundation routes require `requiredPlan: "foundation"` and `gateType: "page"`.

| Route | Screen | Canonical responsibility | Required shell | Planned component | Status |
|---|---|---|---|---|---|
| `/foundation` | Foundation Home | Readiness, version, conflicts, next move, section progress | Command Workspace | `FoundationHomePage` | Planned |
| `/foundation/diagnostic` | Diagnostic Insight | Reference completed audit evidence and recommended starting point | Command Workspace | `DiagnosticInsightPage` | Planned |
| `/foundation/core-truth` | Core Truth | Purpose, mission, vision, values, beliefs, proof | Command Workspace | `CoreTruthPage` | Planned |
| `/foundation/audience` | Audience Truth | Canonical audience profile and language | Command Workspace | `AudienceTruthPage` | Planned |
| `/foundation/positioning` | Positioning | Category, differentiation, transformation, market position | Command Workspace | `FoundationPositioningPage` | Planned |
| `/foundation/messaging` | Messaging | Promise, primary message, voice rules, vocabulary, calls to action | Command Workspace | `FoundationMessagingPage` | Planned |
| `/foundation/expression` | Brand Expression | Approved voice and Identity Studio references | Command Workspace | `BrandExpressionPage` | Planned |
| `/foundation/review` | Review and Lock | Conflict resolution, approval, lock, revision creation | Command Workspace | `FoundationReviewPage` | Planned |

## Legacy compatibility

| Existing route | Existing responsibility | Required transition |
|---|---|---|
| `/brand-foundation` | Current Brand Foundation page | Redirect to `/foundation` after canonical record integration |
| `/brand-audit` | Brand Audit execution | Keep active. Completed audit links to `/foundation/diagnostic` |
| `/audience` | Current audience workflow | Redirect to `/foundation/audience` after migration |
| `/brand-positioning` | Current positioning workflow | Redirect to `/foundation/positioning` after migration |
| `/messaging-structure` | Current messaging workflow | Redirect to `/foundation/messaging` after migration |
| `/identity-studio` | Full identity and media management | Keep active. Link approved references into `/foundation/expression` |
| `/brand-memory` | Existing route currently mapped to `BrandFoundation` in `pageRegistry.jsx` | Audit before changing. Do not silently repurpose or remove |

## Registration rules

Every target Foundation route must:

1. appear in `src/config/appRoutes.js`
2. appear in `src/navigation/pageRegistry.jsx`
3. resolve inside the existing authenticated shell
4. declare the Foundation plan and page gate metadata
5. have loading, empty, error, unauthorized, and workspace-switch behavior
6. preserve legacy navigation until migration is complete

## Routing hazards to block

- duplicate ownership of the same URL
- wildcard route capturing a defined Foundation child route
- legacy route deletion before link migration
- legacy route resolving to an unapproved component
- target route linked from navigation before its page is registered
- target page registered without the Foundation plan and page gate metadata
- route rendering outside the shared Command Workspace shell
- redirect loops
- `/brand-memory` behavior changing without an approved product decision
