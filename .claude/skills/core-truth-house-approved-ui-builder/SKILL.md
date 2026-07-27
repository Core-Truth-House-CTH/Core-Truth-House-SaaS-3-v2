# Core Truth House Approved UI Fidelity Skill

## Skill name

`core-truth-house-approved-ui-builder`

## Purpose

Build Core Truth House dashboards and inner pages from approved visual references with zero creative deviation.

The approved screenshot, mockup, production page, or Figma frame is the single source of visual truth. It is not inspiration. It is a locked implementation specification.

---

# MASTER INSTRUCTION

You are the implementation engineer for the Core Truth House SaaS.

Build the approved dashboard or inner page exactly as shown in the provided reference.

You must reproduce:

- Layout and page frame
- Information hierarchy
- Card positions and proportions
- Section order
- Alignment and spacing
- Typography
- Colors
- Borders, shadows, and radii
- Icon choice and placement
- Button styling
- Form styling
- Navigation behavior
- Responsive behavior
- Loading, empty, error, denied, and unavailable states

Do not redesign, reinterpret, modernize, simplify, or substitute the approved page.

Do not add elements that are not shown.

Do not remove elements that are shown.

Do not add a sidebar unless the approved reference contains one.

Do not apply a dark theme unless the approved reference contains one.

Do not use a generic admin template.

Do not reuse another Core Truth House dashboard layout unless it is the approved parent shell for the current page.

---

# REQUIRED INPUTS

Before editing, identify:

1. Approved page name
2. Approved route
3. Approved desktop reference
4. Approved mobile reference, when available
5. Approved parent dashboard or shell
6. Existing repository
7. Existing branch and base SHA
8. Existing route registry
9. Existing authenticated shell
10. Existing API contracts
11. Required plan tier
12. Required role
13. Tenant scope
14. Approved assets and file paths
15. Existing reusable components

Use this declaration:

```text
APPROVED PAGE:
[PAGE NAME]

APPROVED ROUTE:
[ROUTE]

APPROVED VISUAL SOURCE:
[IMAGE, FILE PATH, FIGMA FRAME, OR PRODUCTION URL]

APPROVED PARENT SHELL:
[COMMAND CENTER, WORKSPACE CONTROLS, CRM, CONTENT STUDIO, ETC.]

APPROVED BASE SHA:
[SHA]

REQUIRED PLAN:
[FREE, FOUNDATION, STRUCTURE, HOUSE, ESTATE]

REQUIRED ROLE:
[MEMBER, EDITOR, ADMIN, OWNER, SUPER ADMIN]

TENANT SCOPE:
[ACTIVE WORKSPACE]
```

When the approved visual source is missing, cropped, ambiguous, or contradictory, stop and request the exact approved reference. Do not invent the missing design.

---

# CORE TRUTH HOUSE BRAND LOCK

## Colors

- Crimson: `#AF0024`
- Deep Royal Purple: `#33033C`
- Deep Purple-Black: `#0D0010`
- Rich Gold: `#C4A95B`
- Cinnabar: `#E04E35`
- Ivory: `#F8F1EC`
- Blush: `#EFE3DF`
- Panel: `#FFFAF5`
- Ink: `#33033C`
- Ruby: `#763B5B`
- Tuscany: `#C7A09D`
- Dark Purple: `#260128`
- Night: `#0D0010`

## Typography

- Display headings: `Cormorant Garamond`, then `Georgia`, then serif
- Interface and body: `DM Sans`, then system sans-serif

Do not substitute approximate colors.

Do not introduce blue, cyan, neon purple, generic charcoal-gray admin styling, or unapproved gradients.

---

# APPROVED SHELL RULES

Use the exact approved shell shown in the reference.

For the approved Workspace Controls shell:

- Full-width page
- No sidebar
- Warm ivory background
- Large editorial heading
- Top-right workspace selector
- Plan indicator
- Notification control
- Owner profile
- Primary action buttons
- Four summary cards
- Large content panels
- Bottom Workspace Controls Center cards
- Thin borders
- Soft warm shadows
- Crimson and gold accents
- Green success states
- Visual continuity with the approved Command Center

Do not replace this with a sidebar layout.

Do not replace this with a dark dashboard.

---

# PAGE-SPECIFIC DESIGN LOCK

Every page must have its own approved visual reference.

For each page:

1. Record the screenshot dimensions.
2. Identify the page frame.
3. Identify the content grid.
4. Measure relative panel widths.
5. Count every card, field, control, and status.
6. Match the exact section sequence.
7. Match the visual density.
8. Match the amount of whitespace.
9. Match the desktop composition.
10. Preserve the same visual system on mobile.

The page-specific reference overrides generic component assumptions.

Inner pages must look like they belong to the same approved parent dashboard.

---

# COMPONENT FIDELITY RULES

## Cards

Match exactly:

- Count
- Width
- Height
- Grid position
- Padding
- Border
- Radius
- Shadow
- Icon location
- Text alignment
- CTA location
- Status indicator

## Buttons

Preserve the approved hierarchy:

- Primary: deep crimson
- Secondary: ivory or white with crimson border
- Destructive: red warning treatment
- Text CTA: crimson with arrow when shown

Do not rewrite button labels without product approval.

## Forms

Match:

- Label placement
- Input height and width
- Border and radius
- Background
- Dropdown styling
- Textarea size
- Save and Cancel placement

## Icons

Use the same icon category and placement as the approved reference.

Prefer the existing repository icon library.

Do not use emoji.

## Shadows

Use restrained warm shadows.

Do not use heavy black shadows, glassmorphism, neon glows, or frosted panels unless shown in the approved reference.

---

# RESPONSIVE RULES

Validate at:

- 1440px
- 1280px
- 1024px
- 768px
- 390px

Responsive implementation must preserve the approved design rather than redesign it.

Required behavior:

- Preserve section order
- Preserve hierarchy
- Preserve action priority
- Prevent horizontal overflow
- Stack only when necessary
- Keep fields readable
- Keep buttons reachable
- Keep tables usable
- Keep navigation linked
- Do not hide critical controls
- Do not create a mobile sidebar unless approved
- Do not replace cards with unrelated accordions

When no approved mobile reference exists, reflow the desktop design without changing its visual language.

---

# REQUIRED TECH STACK

Build inside the existing Core Truth House application using:

- Vite
- React 19
- React Router
- Tailwind CSS
- Radix UI
- Clerk
- Axios
- TipTap
- Drag-and-drop tooling
- Zod

Use existing dependencies before adding new ones.

Do not change `package.json` or the lockfile without a verified need.

---

# ROUTING REQUIREMENTS

Every page must have a registered, protected, working route.

For each route:

- Register it in the existing router
- Link it from the approved parent dashboard
- Support direct load
- Support refresh
- Support browser Back and Forward
- Preserve query parameters
- Preserve Clerk authentication
- Preserve active workspace context
- Preserve plan gates
- Preserve role gates
- Preserve SPA fallback behavior

No card or button may point to:

- `#`
- `javascript:void(0)`
- An unregistered path
- A placeholder path
- A dead route
- A URL that bypasses React Router unnecessarily

Create and validate this table:

| Page | Route | Parent Link | Direct Load | Refresh | Back/Forward | Auth | Plan Gate |
|---|---|---|---|---|---|---|---|

All rows must pass.

---

# AUTHENTICATION AND ACCESS

Use the existing Clerk flow.

Do not create another authentication provider.

Every protected page must:

- Use the existing `ProtectedRoute`
- Use the existing authenticated shell
- Preserve the current Clerk session
- Redirect signed-out users correctly
- Preserve `redirect_url`
- Prevent protected-content flash
- Prevent redirect loops
- Clear authenticated state on sign-out

Do not inspect, export, copy, or bypass Clerk tokens.

---

# PLAN GATING

Canonical plan order:

1. Free
2. Foundation
3. Structure
4. House
5. Estate

Every page must declare its minimum plan.

Do not expose Estate controls to lower tiers.

Do not hide Plan and Billing behind a paid tier.

Show an approved upgrade state instead of a blank page.

---

# TENANT AND WORKSPACE SAFETY

Every tenant-owned request must be scoped to the active workspace.

Use the existing Workspace Context and API client.

Required:

- Read the active workspace from the authenticated provider
- Use the existing workspace scope mechanism
- Never trust a user-entered workspace ID
- Never expose another tenant's records
- Never merge platform audit data with tenant audit data
- Never grant automatic platform-support access to tenant content
- Require explicit owner-approved support access
- Keep client workspaces isolated
- Keep client members isolated
- Keep client integrations isolated
- Keep client Brand Memory isolated
- Keep client audit history isolated

No fake tenant data.

No hard-coded tenant IDs.

No example production records.

---

# API CONTRACT RULES

Inspect the real backend before wiring a control.

Every control must be one of:

1. Connected to a verified backend endpoint
2. Explicitly read-only
3. Explicitly marked unavailable until its backend contract exists

Do not create false save behavior.

Do not show “Saved” when no enforceable write occurred.

Do not call invented endpoints.

Do not use local storage for shared team data unless it is clearly labeled device-only.

Document every mutation:

```text
CONTROL:
[NAME]

METHOD:
[GET, POST, PATCH, PUT, DELETE]

ENDPOINT:
[PATH]

AUTH:
[REQUIREMENT]

TENANT SCOPE:
[ENFORCEMENT]

ROLE:
[MINIMUM ROLE]

SUCCESS STATE:
[VISIBLE RESULT]

FAILURE STATE:
[VISIBLE ERROR]

ROLLBACK:
[ROLLBACK METHOD]
```

---

# CONTENT RULES

Use the exact approved copy shown in the reference or approved product specification.

Do not rewrite headings.

Do not shorten labels.

Do not invent metrics, dates, users, storage totals, system status, or client records.

Use only:

- Real API values
- Approved static copy
- Honest empty states
- Honest unavailable states

---

# BUILD SEQUENCE

## Phase 1: Inspect

1. Inspect the approved reference.
2. Inspect the current route.
3. Inspect the approved parent shell.
4. Inspect reusable components.
5. Inspect current APIs.
6. Inspect Clerk and plan gates.
7. Inspect workspace context.
8. Inspect responsive styles.
9. Inspect existing tests.
10. Record the plan.

Do not edit during inspection.

## Phase 2: Isolate

1. Create a feature branch from the approved base.
2. Confirm the base SHA.
3. Confirm the worktree is clean.
4. Do not work directly on production, release, or main.
5. Preserve approved files and assets.

## Phase 3: Build the Shell

1. Build the exact page frame.
2. Match the background.
3. Match the heading area.
4. Match top controls.
5. Match summary cards.
6. Match the main grid.
7. Match the control-center cards.
8. Verify desktop composition before adding logic.

## Phase 4: Build Inner Pages

For every inner page:

1. Register the route.
2. Match its approved reference.
3. Reuse the approved shell.
4. Connect the correct API.
5. Add plan and role gates.
6. Add loading, empty, error, denied, and unavailable states.
7. Link back to the parent page.
8. Validate direct load and refresh.

## Phase 5: Validate

Run:

```bash
git diff --check
yarn lint
yarn build
```

Also validate:

- Route registry
- Parent links
- Inner-page links
- Auth redirects
- Plan gates
- Role gates
- Tenant-scoped requests
- Responsive widths
- Console errors
- Network errors
- Missing chunks
- Missing assets
- Dead links
- Duplicate shells
- Duplicate notification owners
- Request loops
- Workspace initialization loops

## Phase 6: Visual Review

For every page:

1. Capture the implementation at the same dimensions as the approved reference.
2. Place the reference and implementation side by side.
3. Compare page margins, widths, card dimensions, card order, typography, fields, buttons, icons, colors, borders, shadows, and whitespace.
4. Correct every visible deviation.
5. Repeat until the page matches.

Do not approve based only on code review.

---

# VISUAL FIDELITY SCORECARD

Score each category from 0 to 2.

- 0 = incorrect
- 1 = close but visibly different
- 2 = matches the approved reference

| Category | Score |
|---|---:|
| Page frame | /2 |
| Header and controls | /2 |
| Grid proportions | /2 |
| Card positions | /2 |
| Typography | /2 |
| Colors | /2 |
| Borders | /2 |
| Shadows | /2 |
| Icons | /2 |
| Buttons | /2 |
| Forms | /2 |
| Status states | /2 |
| Spacing | /2 |
| Responsive behavior | /2 |
| Inner-page continuity | /2 |

Required score: `30 / 30`

Anything below 30 is not approved.

---

# AUTOMATIC REJECTION CONDITIONS

Reject the implementation when any of these occur:

- Sidebar added to a no-sidebar reference
- Dark theme applied to an ivory reference
- Generic template substituted
- Card positions changed
- Section order changed
- Brand colors changed
- Fonts changed
- Unapproved gradients added
- Buttons restyled
- Inner pages use a different shell
- Dead route
- Direct loading fails
- Refresh fails
- Clerk redirect fails
- Plan gate fails
- Role gate fails
- Tenant scope is missing
- Data is fabricated
- A control pretends to save
- Duplicate providers or notification subscriptions mount
- React errors appear
- API request loops appear
- Workspace initialization loops appear
- Page overflows at 390px
- Approved asset is replaced
- Existing approved page is visually altered

---

# STOP CONDITIONS

Stop immediately when:

- The approved image is missing
- Two approved references conflict
- A route belongs to another approved module
- An endpoint does not exist
- Tenant scoping cannot be verified
- A mutation lacks rollback
- A required role cannot be enforced
- A plan rule is unclear
- A required asset is unavailable
- The change would modify production directly
- The work requires rewriting an approved shell
- The implementation would knowingly deviate from the reference

Report the blocker instead of improvising.

---

# GITHUB SAFETY

1. Create a feature branch from the approved base.
2. Make focused commits.
3. Do not force-push.
4. Do not rewrite approved history.
5. Open a Draft PR.
6. Keep production and release branches untouched.
7. Run CI.
8. Run authenticated preview validation.
9. Resolve review findings only after validation.
10. Mark Ready only after explicit approval.
11. Merge only with the approved merge method.
12. Deploy only under separate deployment approval.

Build approval, merge approval, and deployment approval are separate gates.

---

# REQUIRED FINAL REPORT

```text
RESULT:
[PASS / NOT READY]

PAGE:
[PAGE NAME]

ROUTE:
[ROUTE]

APPROVED REFERENCE:
[REFERENCE]

BRANCH:
[BRANCH]

HEAD SHA:
[SHA]

FILES CHANGED:
[COUNT AND LIST]

ROUTES VERIFIED:
[LIST]

AUTH VERIFIED:
[YES / NO]

PLAN GATES VERIFIED:
[YES / NO]

ROLE GATES VERIFIED:
[YES / NO]

TENANT SCOPE VERIFIED:
[YES / NO]

LINT:
[PASS / FAIL]

BUILD:
[PASS / FAIL]

VISUAL FIDELITY SCORE:
[30 / 30 REQUIRED]

RESPONSIVE:
[1440 / 1280 / 1024 / 768 / 390]

CONSOLE:
[CLEAN / BLOCKER]

NETWORK:
[CLEAN / BLOCKER]

KNOWN LIMITATIONS:
[LIST]

PRODUCTION CHANGED:
NO

MERGED:
NO

DEPLOYED:
NO
```

---

# REUSABLE EXECUTION PROMPT

```text
Build the approved Core Truth House page exactly as shown in the provided visual reference.

Use the `core-truth-house-approved-ui-builder` skill.

The visual reference is a locked specification, not inspiration.

APPROVED PAGE:
[PAGE NAME]

APPROVED ROUTE:
[ROUTE]

APPROVED REFERENCE:
[ATTACH IMAGE OR PROVIDE PATH]

APPROVED PARENT SHELL:
[PARENT DASHBOARD]

APPROVED BASE SHA:
[SHA]

REQUIRED PLAN:
[PLAN]

REQUIRED ROLE:
[ROLE]

Requirements:

- Reproduce the approved page exactly.
- No visual redesign.
- No layout substitution.
- No sidebar unless shown.
- No dark theme unless shown.
- Use the canonical Core Truth House colors and fonts.
- Preserve exact card placement, hierarchy, spacing, typography, buttons, fields, borders, shadows, and icons.
- Build every approved inner page in the same visual system.
- Register every route correctly.
- Link every card and control to a real route.
- Preserve Clerk authentication.
- Preserve plan and role gates.
- Preserve active workspace and tenant isolation.
- Use verified backend APIs only.
- Do not fabricate data.
- Do not create false save states.
- Show honest loading, empty, error, unavailable, and denied states.
- Validate direct load, refresh, Back, Forward, query parameters, and mobile behavior.
- Run lint and production build.
- Capture implementation screenshots at the approved reference dimensions.
- Compare side by side.
- Do not declare completion until the visual fidelity score is 30/30.
- Keep the work on an isolated feature branch.
- Open a Draft PR.
- Do not merge or deploy without separate approval.

Before editing, inspect the reference, repository, routes, shell, APIs, plan gates, role gates, tenant context, and approved assets.

Stop rather than improvising when the approved design or backend contract is unclear.
```

---

# CORE PRINCIPLE

**Approved means locked.**

The implementation must conform to the approved Core Truth House page.

The approved page must never be altered to conform to the implementation.
