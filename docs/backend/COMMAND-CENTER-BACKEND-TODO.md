# Command Center Backend To-Do

## Backend source and production runtime

Backend source of truth:

```text
Sha1427/Core-Truth-House-Backend-
```

Production working tree:

```text
/var/www/coretruthhouse-backend/app
```

Runtime:

```text
gunicorn app.main:app
systemd unit: coretruthhouse-backend.service
```

Health check:

```text
https://api.coretruthhouse.com/health
```

Expected status: `200`.

The VPS tree has drifted from GitHub in the past. Reconcile with `git fetch`, never `git pull` or rebase directly in the production working tree. Capture the pre-merge production `main` SHA before any change.

## Required now

- [ ] Grant the connected GitHub installation access to `Sha1427/Core-Truth-House-Backend-`, or run the backend section through Claude Code on the VPS.
- [ ] Inspect backend `main`, current production VPS SHA, and working-tree drift before editing.
- [ ] Create a backend feature branch from the reconciled source.
- [ ] Implement `GET /api/command-center/overview` in the backend source repository.
- [ ] Register the router in `app.main:app` using the backend's existing router conventions.
- [ ] Enforce authenticated workspace membership server-side.
- [ ] Enforce role and plan access server-side.
- [ ] Add response-schema validation.
- [ ] Add tests for two isolated tenant workspaces.
- [ ] Add tests confirming super administrators cannot read tenant content by default.
- [ ] Add workspace-aware cache keys.
- [ ] Run backend tests before production reconciliation.
- [ ] Merge the approved backend branch into the VPS local `main` without pulling or rebasing the production tree.
- [ ] Restart with `sudo systemctl restart coretruthhouse-backend.service`.
- [ ] Confirm `https://api.coretruthhouse.com/health` returns `200`.
- [ ] Verify the endpoint with two different tenant workspaces.
- [ ] Preserve the captured pre-merge SHA for one-step rollback.

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
