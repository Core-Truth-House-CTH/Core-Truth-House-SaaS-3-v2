# Command Center Overview API Contract

## Status

Frontend contract: implemented in Section 3.

Backend implementation: required in the separately deployed Core Truth House API service. This frontend repository does not contain that service's source code.

## Endpoint

```http
GET /api/command-center/overview
Authorization: Bearer <session token>
X-Workspace-ID: <active workspace id>
Accept: application/json
```

The backend must treat `X-Workspace-ID` as a requested workspace, not proof of access. It must authenticate the user, resolve membership, enforce the plan and role, and scope every query to the validated workspace.

## Response

```json
{
  "workspace_id": "workspace-id",
  "generated_at": "2026-07-23T12:00:00Z",
  "brand_health": {
    "score": 82,
    "status": "Structure is taking hold",
    "change": 4
  },
  "buyer_signals": {
    "confirmed": 12,
    "unconfirmed": 3,
    "recent": [
      {
        "id": "signal-id",
        "level": 4,
        "title": "Asked about the cohort",
        "source": "facebook",
        "created_at": "2026-07-22T16:00:00Z",
        "route": "/signal-inbox"
      }
    ]
  },
  "open_decisions": {
    "count": 4,
    "items": []
  },
  "active_work": {
    "count": 6,
    "campaign_count": 2,
    "items": [
      {
        "id": "campaign-id",
        "type": "campaign",
        "title": "Brand OS Campaign",
        "status": "in_progress",
        "progress": 65,
        "updated_at": "2026-07-22T14:00:00Z",
        "route": "/campaign-builder"
      }
    ]
  },
  "system_alerts": {
    "count": 1,
    "items": []
  },
  "brand_house": {
    "foundation": 88,
    "structure": 74,
    "house": 61,
    "estate": 49
  },
  "next_move": {
    "eyebrow": "NEXT BEST MOVE",
    "title": "Clarify the offer architecture",
    "body": "Define the outcome, packaging, and pricing logic.",
    "action": "Open Offer Builder",
    "route": "/offer-builder",
    "evidence_ids": []
  },
  "daily_intelligence": [],
  "recent_progress": []
}
```

## Required behavior

1. Return only information from the validated active workspace.
2. Never aggregate another tenant's content, signals, contacts, files, campaigns, or AI conversations.
3. Do not grant super administrators automatic tenant-content access.
4. Support access must require an active tenant-approved support grant and must be audited.
5. Return `403` when the authenticated user is not a member of the requested workspace.
6. Return `404` only when the validated workspace does not exist.
7. Return `200` with zero values and empty arrays for a valid empty workspace.
8. Do not silently substitute unrelated fields for missing metrics.
9. Include `generated_at` so the frontend can identify stale responses.
10. Prevent cross-workspace cache reuse. Any cache key must include the validated workspace id and permission context.

## Metric definitions

### Brand Health

Use the existing Brand Health service's official overall score. Do not substitute Brand Memory usage, launch progress, or content counts.

### Buyer Signals

`confirmed` counts signals with a confirmed Signal OS level. `unconfirmed` counts signals awaiting tenant review.

### Open Decisions

Count unresolved decision records only. Do not count every incomplete task or module as a decision.

### Active Work

Count active campaigns, content batches, offers, systems, and other workbench records that are not complete, archived, cancelled, or deleted.

### System Alerts

Count current tenant-facing operational alerts such as publishing failures, disconnected integrations, expiring authorizations, failed workspace jobs, approval deadline warnings, and usage limits.

### Brand House

Each percentage must be calculated from documented completion checkpoints for Foundation, Structure, House, and Estate. The server response is authoritative.

### Next Move

Return an action derived from current workspace evidence. Include supporting record ids in `evidence_ids` when available.

## Error response

```json
{
  "detail": "You do not have access to this workspace.",
  "code": "workspace_access_denied"
}
```

Raw stack traces, database details, tokens, and internal identifiers must not be returned.

## Backend acceptance tests

- Member of Workspace A receives Workspace A data.
- Member of Workspace A cannot request Workspace B.
- Switching workspaces changes every response section.
- Empty workspace receives valid zero and empty-array values.
- A super admin without a tenant support grant receives no tenant content.
- An expired support grant cannot access the endpoint.
- Cache entries never cross workspace boundaries.
- Missing optional data does not create fabricated metrics.
