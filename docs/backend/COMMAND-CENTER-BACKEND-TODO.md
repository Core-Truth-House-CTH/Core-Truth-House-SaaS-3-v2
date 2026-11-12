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

## `GET /api/command-center/overview` — DEPLOYED

**This endpoint is live in the production runtime. It is no longer outstanding
work.** Earlier revisions of this file listed it as unimplemented; that was stale
and caused an automated review to conclude the frontend should treat a generic
`404` as route absence. It must not.

Verified read-only on the VPS on 2026-07-26:

- [x] Route implemented — `/var/www/coretruthhouse-backend/app/backend/routes/command_center.py`,
      `router = APIRouter(prefix="/api/command-center")` with
      `@router.get("/overview", response_model=CommandCenterOverviewResponse)`.
- [x] Router registered — listed as `"backend.routes.command_center"` in
      `/var/www/coretruthhouse-backend/app/app/routers/api.py`.
- [x] Backend test present — `/var/www/coretruthhouse-backend/app/tests/test_command_center_overview.py`
      asserts `any(route.path == "/api/command-center/overview" ...)`.
- [x] Live route registered — unauthenticated
      `https://api.coretruthhouse.com/api/command-center/overview` returns `401`;
      an unregistered FastAPI route would return `404`.
- [x] Authenticated response — the reconcile session received `200` with a
      workspace-scoped payload for the active workspace.
- [x] `https://api.coretruthhouse.com/health` returns `200`.

**Not claimed:** no backend Git commit, branch or source-repository state is
asserted here. Only the deployed runtime state listed above was verified, and it
was verified read-only — no backend file was modified and the service was not
restarted. The backend source repository `Sha1427/Core-Truth-House-Backend-`
remains outside this session's access.

### Status-code contract (see `command-center-overview.md`)

- `404` — the validated workspace does not exist. A **real error**; it must reach
  the page.
- `501` — the endpoint is not implemented in this deployment. The **only** signal
  that permits frontend legacy fallback.

`src/lib/commandCenterOverview.js` falls back on `error?.status === 501` alone and
rethrows everything else. The legacy fallback is defensive compatibility for a
pre-endpoint deployment, not the normal production path.

## Still outstanding for this endpoint

- [ ] Verify the endpoint against two different tenant workspaces (only one
      authorized workspace exists in the current environment, so cross-tenant
      isolation remains unverified here).
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
