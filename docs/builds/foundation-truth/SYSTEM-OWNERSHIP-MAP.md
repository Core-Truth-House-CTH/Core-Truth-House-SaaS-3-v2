# Core Truth House System Ownership Map

This map prevents duplicate products, duplicate data, and unclear handoffs.

| Responsibility | Canonical owner | Foundation relationship |
|---|---|---|
| Authentication and user identity | Shared Clerk and Auth shell | Consume only |
| Active workspace and tenant identity | Shared workspace context | Every read and write uses it |
| Plan entitlements | Shared entitlement service and backend authorization | Consume only |
| Global navigation and shell | Command Workspace shell | Render inside it |
| Search, notifications, Ask the House, account controls | Command Workspace shell | Reuse without replacement |
| Brand diagnostic execution | Brand Audit | Reference completed evidence |
| Canonical brand truth | Foundation | Own one versioned workspace record |
| Audience truth | Foundation | Authoritative after integration |
| Positioning | Foundation | Authoritative after integration |
| Messaging | Foundation | Authoritative after integration |
| Voice and approved expression rules | Foundation | Authoritative rules and references |
| Visual asset management | Identity Studio and Media systems | Foundation stores approved references |
| Strategic conversion of truth into operating strategy | Structure and Strategic OS | Consume locked Foundation values |
| Offer design | Offer Builder | Consume locked Foundation values |
| Content generation and media workflows | Content Studio | Consume locked Foundation values |
| Buyer evidence and signal comparison | Signal OS | Compare against locked Foundation values |
| Reporting | Reports | Store Foundation version context |
| Daily next-best-move summary | Command Center | Consume Foundation readiness and gaps |
| API transport | Shared Axios API client | Reuse with workspace headers |
| Alerts and notifications | Shared notification service | Emit events through shared service |
| Deployment | GitHub Actions release workflow | Receive only tested immutable artifacts |
| Production activation and rollback | VPS release manager | Atomic symlink or equivalent activation |

## Boundary rules

### Foundation may summarize another product

A Foundation page may display Brand Audit findings, Identity Studio references, or downstream activation status when the data comes from a documented shared contract.

### Foundation may not recreate another product

Foundation does not execute audits, manage the media library, run campaigns, generate content, manage offers, or replace Reports.

### Downstream products may consume Foundation

They may read the locked version and retain its version identifier for traceability.

### Downstream products may not overwrite Foundation

Any proposed change to approved truth must create a Foundation draft revision or an explicit change request. It cannot silently mutate the locked record.

## Conflict rule

When two existing fields claim to be authoritative for the same concept, the integration audit must:

1. identify both sources
2. record which pages and APIs use them
3. select the canonical Foundation field
4. create a migration and compatibility plan
5. preserve rollback evidence
6. remove the competing source only in an approved cleanup phase
