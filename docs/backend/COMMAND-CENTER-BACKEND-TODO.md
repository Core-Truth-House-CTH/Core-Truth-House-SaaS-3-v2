# Command Center Backend To-Do

This list tracks backend work that is intentionally not being bundled into the Section 3 Command Center overview contract.

## Required now

- [ ] Implement `GET /api/command-center/overview` in the separately deployed backend service.
- [ ] Enforce authenticated workspace membership server-side.
- [ ] Enforce role and plan access server-side.
- [ ] Add response-schema validation.
- [ ] Add tests for two isolated tenant workspaces.
- [ ] Add tests confirming super administrators cannot read tenant content by default.
- [ ] Add workspace-aware cache keys.

## Later routes

### Decisions

- [ ] `GET /api/workspace/decisions?status=open`
- [ ] `POST /api/workspace/decisions`
- [ ] `PATCH /api/workspace/decisions/:id`
- [ ] `POST /api/workspace/decisions/:id/resolve`

Minimum fields:

```text
id
workspace_id
title
decision_type
source_module
status
priority
assigned_to
due_at
route
created_at
resolved_at
```

### System alerts

- [ ] `GET /api/workspace/system-alerts`
- [ ] `POST /api/workspace/system-alerts/:id/acknowledge`
- [ ] `POST /api/workspace/system-alerts/:id/resolve`

Alert sources should include publishing, integrations, authorization expiry, background jobs, approvals, storage, and usage limits.

### Workspace activity

- [ ] `GET /api/workspace/activity?limit=10`
- [ ] Add cursor pagination.
- [ ] Add event-type filtering.
- [ ] Add actor filtering.

Events should include diagnostic completion, campaign creation, signal confirmation, offer updates, content publishing, Brand Memory changes, system completion, member changes, exports, and support access.

### Active workbench

- [ ] `GET /api/workspace/workbench?status=active`
- [ ] Normalize campaigns, content batches, offers, systems, and documents into one work-item schema.
- [ ] Add filtering by type, owner, status, and due date.

### Support access

- [ ] `POST /api/workspaces/:id/support-grants`
- [ ] `GET /api/workspaces/:id/support-grants`
- [ ] `DELETE /api/workspaces/:id/support-grants/:grantId`
- [ ] Enforce automatic expiry.
- [ ] Record every support action in the tenant audit log.

## Non-negotiable tenant rules

- Every record is scoped by the validated workspace.
- A client-provided workspace id never grants access by itself.
- Estate client workspaces remain isolated.
- Super administrators receive platform metadata only unless a tenant grants temporary support access.
- Tenant content is never copied into platform-wide analytics.
