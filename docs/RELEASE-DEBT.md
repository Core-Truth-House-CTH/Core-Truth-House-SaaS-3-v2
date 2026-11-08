# Release Debt

Work that was deliberately deferred out of a shipped release, with the reason it
was deferred and the condition that clears it. An entry stays here until the
work is built and the entry is removed in the same change.

## Workspace views and the shared-shell Workspace tab

Status: deferred
Opened: 2026-07-26
Release: Stage 3C production reconcile (PR #10)
Raised by: Codex review of `7892d0129245efbf05f23ce8e641299388b8959d`
Cleared by: `c20123f8a2e06bf7df63db32414f01ba6eef2211` (tab hidden, not built)

### What was deferred

The Workspace surface itself. `src/pages/WorkspacePage.jsx` renders only a
static placeholder ("The Workspace content is built in a later section"). It has
no `useSearchParams` handling, so it ignores the three views the Command Center
already links to:

```text
/workspace?view=decisions
/workspace?view=work
/workspace?view=activity
```

`src/pages/CommandCenterNext.jsx` emits all three links today (Open Decisions,
Active Work, Recent Progress, Active Workbench). They resolve to the placeholder.

### Why it was deferred rather than built

Building the Workspace views was outside the authorized scope of the Stage 3C
reconcile. The reconcile is a merge of existing work with the production release
line, not a feature stage.

### What shipped instead

`src/components/AuthShell.jsx` no longer lists Workspace in `NAV_ITEMS`. Once
`/analytics` began mounting `AuthShell`, the shared shell was promoting the
unfinished route as a primary tab to every Reports user. Removing the tab
removes that promotion.

Deliberately left untouched:

- the `/workspace` route registration in `src/navigation/pageRegistry.jsx`
- the route's existing plan gating
- the Command Center's `?view=` links

Anyone holding a `/workspace` link still reaches the placeholder. Nothing was
broken or rerouted; the route simply stopped being advertised.

### Condition that clears this entry

Build the decisions, work and activity views, have `WorkspacePage` read the
`view` search param, then restore the `NAV_ITEMS` entry:

```js
{ key: "workspace", label: "Workspace", icon: LayoutGrid, path: "/workspace" },
```

`LayoutGrid` must be re-added to the `lucide-react` import in `AuthShell.jsx`.
Remove this section when that lands.
