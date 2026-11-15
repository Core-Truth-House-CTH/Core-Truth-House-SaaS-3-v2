# Inner pages inventory (read-only)

Generated 2026-11-15 from git objects, with no checkout, branch or edit. This file is the only thing written.

## 0. Read this first (scope and caveats)

| Item | Finding |
|---|---|
| Source branch | `release/journey1-live` @ `375c939` (tag `journey1-20261026t2144z`). The VPS working copy is on `staging-guard-20261112`, so every file was read with `git show release/journey1-live:<path>`, not from disk. |
| Is that what is live? | Live frontend is `a492877` (release `credits1-20261112t1838z`, a byte copy of `diagcta1`). It is 12 files ahead of `375c939`, **all public diagnostic / cohort-waitlist files**. None of `appRoutes.js`, `pageRegistry.jsx`, `Layout.jsx`, `AuthShell.jsx`, `CommandCenterNext.jsx` or `BrandFoundation.jsx` changed, so everything in sections 1, 2, 4 and 3A is also what production shows. |
| **Foundation V03 is NOT on `release/journey1-live`** | No `FoundationHome`, section pages, status card or review queue exists there. V03 lives only on `staging-foundation-v03-20261112` @ `4daca5e` (descends from `375c939`) and `feat/foundation-v03`. The live backend has **no** `/api/foundation/*` routes (grepped `credits1-…/app`). So section 3A documents what is live and 3B documents V03 from the staging branch. |
| Command Center backend | Live backend serves `GET /api/command-center/overview` (`routes/command_center.py:878`), so production uses the "overview" data path. The "legacy fallback" path only runs if that call fails. |
| Method note | The Command Center, V03 pages, router, registry and sidebar were read in full. The legacy `/brand-foundation` page (1,584 lines, mostly inline style) was inventoried from its field config, handlers and extracted visible text and test-ids, not line by line. |

---

## 1. Authenticated routes (`src/config/appRoutes.js`, 55 entries)

How a route is served: `AppRouter` → `ProtectedRoute` → `BillingWall` → `PlanGate(route.path)` → page. `requiredPlan` in this file is the real gate (`PlanGate` → `canAccess` → `routeConfig.isGated`).
Plan order: `free < audit < foundation < structure < house < estate < legacy`. `gateType` is `page` (whole page locked), `partial` (preview allowed) or none.
**Sidebar section** is where the item appears in `Layout.jsx`, which is hardcoded and differs from the `group` field in `appRoutes.js`. Config group is shown for reference.
"hidden" means `hidden: true` in config (no nav entry from the config). "SA-only" means `superAdminOnly`.

| # | Path | Config label | Page component (`src/pages/…`) | Sidebar section (as shown) | Config group | requiredPlan | gateType | Flags |
|--:|---|---|---|---|---|---|---|---|
| 1 | `/onboarding` | Onboarding | `OnboardingWorkflow.jsx` | — not in sidebar | workspaceCore | — | — | hidden |
| 2 | `/command-center` | Command Center | `CommandCenterNext.jsx` | DASHBOARD | workspaceCore | foundation | page | — |
| 3 | `/command-center-next` | Command Center (New) | `CommandCenterNext.jsx` | — not in sidebar | workspaceCore | foundation | page | hidden |
| 4 | `/brand-house` | Your Brand House | `BrandHouse.jsx` | — not in sidebar | workspaceCore | foundation | page | hidden |
| 5 | `/workspace` | Workspace | `WorkspacePage.jsx` | — not in sidebar | workspaceCore | foundation | page | hidden |
| 6 | `/brand-audit` | Brand Audit | `BrandAudit.jsx` | FOUNDATION | brandFoundation | — | — | — |
| 7 | `/brand-foundation` | Foundation | `BrandFoundation.jsx` | FOUNDATION | brandFoundation | — | — | — |
| 8 | `/brand-positioning` | Brand Positioning | `BrandPositioning.jsx` | FOUNDATION | brandFoundation | foundation | — | — |
| 9 | `/messaging-structure` | Messaging Structure | `MessagingStructure.jsx` | FOUNDATION | brandFoundation | foundation | — | — |
| 10 | `/audience` | Audience | `Audience.jsx` | FOUNDATION | brandFoundation | — | — | — |
| 11 | `/audience/avatars/new` | Audience | `AvatarEditor.jsx` | — not in sidebar | brandFoundation | — | — | hidden |
| 12 | `/audience/avatars/:id` | Audience | `AvatarEditor.jsx` | — not in sidebar | brandFoundation | — | — | hidden |
| 13 | `/identity-studio` | Identity Studio | `IdentityStudio.jsx` | FOUNDATION | brandFoundation | — | — | — |
| 14 | `/strategic-os` | Strategic OS | `StrategicOS.jsx` | FOUNDATION | brandFoundation | foundation | partial | — |
| 15 | `/brand-memory` | Brand Memory | `BrandFoundation.jsx` | — not in sidebar | brandFoundation | structure | page | hidden |
| 16 | `/brand-intelligence` | Brand Intelligence | `BrandIntelligencePage.jsx` | — not in sidebar | brandFoundation | — | — | hidden |
| 17 | `/brand-health` | Brand Health | `BrandHealthDashboard.jsx` | — not in sidebar | brandFoundation | foundation | page | hidden |
| 18 | `/systems-builder` | Structure | `SystemsBuilder.jsx` | STRUCTURE | structure | structure | page | — |
| 19 | `/signal-inbox` | Signal Inbox | `SignalInbox.jsx` | INTELLIGENCE | systems | structure | page | — |
| 20 | `/customer-journey` | Customer Journey | `CustomerJourney.jsx` | STRUCTURE | structure | structure | page | — |
| 21 | `/offer-builder` | Offers | `OfferBuilder.jsx` | STRUCTURE | structure | structure | page | — |
| 22 | `/campaign-builder` | Campaign Builder | `CampaignBuilder.jsx` | STRUCTURE | execution | foundation | page | — |
| 23 | `/campaign-setup` | Campaign Setup | `CampaignSetup.jsx` | — not in sidebar | execution | structure | page | hidden |
| 24 | `/community` | Cohort Community | `CommunityPage.jsx` | ESTATE | execution | estate | page | — |
| 25 | `/cohort-manager` | Cohort Manager | `CohortManager.jsx` | ADMIN (super admin only) | execution | — | — | SA-only |
| 26 | `/content-studio` | Content Studio | `ContentStudio.jsx` | STRUCTURE | execution | — | — | — |
| 27 | `/studios` | Studios | `Studios.jsx` | HOUSE | execution | — | — | — |
| 28 | `/studios/visual` | Visual Studio | `StudiosVisual.jsx` | — not in sidebar | execution | — | — | — |
| 29 | `/studios/video` | Video Studio | `StudiosVideo.jsx` | — not in sidebar | execution | — | — | — |
| 30 | `/studios/voice` | Voice Studio | `StudiosVoice.jsx` | — not in sidebar | execution | foundation | page | — |
| 31 | `/studios/bio` | Bio Generator | `StudiosBio.jsx` | — not in sidebar | execution | — | — | — |
| 32 | `/launch-planner` | Launch Planner | `LaunchPlanner.jsx` | — not in sidebar | execution | house | page | hidden |
| 33 | `/first-campaign` | First Campaign | `CampaignBuilder.jsx` (as `FirstCampaign`) | — not in sidebar | execution | foundation | page | hidden |
| 34 | `/calendar` | Calendar | `Calendar.jsx` | ESTATE | execution | estate | page | — |
| 35 | `/social-media-manager` | Social Planner | `SocialMediaManager.jsx` | ESTATE | insightsOps | estate | page | — |
| 36 | `/content-queue` | Content Queue | `ContentQueue.jsx` | ESTATE | execution | estate | page | — |
| 37 | `/crm` | CRM | `CRMSuite.jsx` | HOUSE | insightsOps | house | page | — |
| 38 | `/crm/contacts/:id` | CRM | `crm/ContactRecordPage.jsx` (as `ContactRecordPage`) | — not in sidebar | insightsOps | house | page | hidden |
| 39 | `/email-settings` | Email | `EmailSettings.jsx` | HOUSE | insightsOps | house | page | — |
| 40 | `/mail` | Mail | `MailSuite.jsx` | ADMIN (super admin only) | platformAdmin | — | — | SA-only |
| 41 | `/analytics` | Analytics | `ReportsShell.jsx` | INTELLIGENCE | insightsOps | structure | page | — |
| 42 | `/workspace-library` | Workspace Library | `TenantDataDashboardV2.jsx` | WORKSPACE | library | — | — | — |
| 43 | `/tutorials` | Tutorials | `VideoTutorialsPage.jsx` | SUPPORT | help | — | — | — |
| 44 | `/billing` | Billing | `Billing.jsx` | — not in sidebar | account | free | — | — |
| 45 | `/settings` | Settings | `Settings.jsx` | WORKSPACE | account | — | — | — |
| 46 | `/alerts` | Alerts | `Alerts.jsx` | WORKSPACE | account | — | — | — |
| 47 | `/automations` | Automations | `Automations.jsx` | ADMIN (super admin only) | placeholder | structure | — | — |
| 48 | `/documents` | Documents | `TenantDataDashboardV2.jsx` | — not in sidebar | placeholder | foundation | — | — |
| 49 | `/join` | Join Workspace | `JoinWorkspace.jsx` | — not in sidebar | placeholder | — | — | — |
| 50 | `/members` | Members | `Members.jsx` | WORKSPACE | placeholder | structure | — | — |
| 51 | `/help-desk` | Help Desk | `PlaceholderPage` ("Help Desk") | SUPPORT | placeholder | — | — | — |
| 52 | `/knowledge-base` | Knowledge Base | `KnowledgeBasePage.jsx` | SUPPORT | placeholder | — | — | — |
| 53 | `/release-notes` | Release Notes | `PlaceholderPage` ("Release Notes") | SUPPORT | placeholder | — | — | — |
| 54 | `/ai-keys` | AI API Keys | `PlaceholderPage` ("AI API Keys") | ADMIN (super admin only) | placeholder | — | — | SA-only |
| 55 | `/platform-store` | Store | `PlaceholderPage` ("Store") | ADMIN (super admin only) | placeholder | — | — | SA-only |

### 1.1 Route notes

- **`gateType` is informational.** `isGated` only reads `requiredPlan`. `/brand-positioning` and `/messaging-structure` have `requiredPlan: foundation` with `gateType: null` and are still locked below Foundation. `/billing` has `requiredPlan: free`, which is always allowed.
- **Aliases / shared pages:** `/command-center` and `/command-center-next` both render `CommandCenterNext`. `/first-campaign` renders `CampaignBuilder`. `/brand-memory` renders `BrandFoundation`. `/documents` and `/workspace-library` both render `TenantDataDashboardV2`. Registry aliases: `/`, `/home` → `/command-center`; `/brand` → `/brand-foundation`.
- **`/command-center?cohort_token=…`** renders `CohortClaimEntry` instead of the Command Center (`PaidPage` in `AppRouter.jsx`).
- **Placeholder pages** (`PlaceholderPage`): `/help-desk`, `/release-notes`, `/ai-keys`, `/platform-store`. `/workspace` renders `WorkspacePage`, which is a placeholder body ("built in a later section").
- **Registry entry with no route:** `/my-data` is in `pageRegistry` but not in `APP_ROUTES`, so it is unreachable.
- **Unknown registered path** falls back to `CommandCenterNext`; a route with no component redirects to `/command-center`.
- **Other routes in `AppRouter` outside `APP_ROUTES`:** `/cohort/claim`, `/studio/:token`, `/help` (`TrainingVideos`), `/admin/*` (`AdminRouter`), redirects `/dashboard` → `/command-center` and `/audit` → `/brand-diagnostic/`. `ADMIN_ROUTES` is an empty array.
- **Dead code:** `src/pages/CommandCenter.jsx` (1,059 lines, legacy) is imported nowhere. `SIDEBAR_GROUPS` / `getRoutesByGroup` in `routeConfig.jsx` have no consumers, so the real sidebar is the hardcoded one in section 4.
- **Config vs sidebar mismatches to be aware of:** `/systems-builder` is labelled "Structure" in config but "Brand Playbooks" in the sidebar. Campaign Builder and Content Studio are config group `execution` but sit under sidebar STRUCTURE. Social Planner is config group `insightsOps` but sits under ESTATE. Signal Inbox is config group `systems` but sits under INTELLIGENCE.
- **Which shell each page wears:**
  - `AuthShell` top bar and **no sidebar:** `/command-center`, `/command-center-next`, `/brand-house`, `/workspace`.
  - `AuthShell` top bar plus the legacy sidebar layout nested inside: `/analytics` (`ReportsShell` wraps `Analytics`, which embeds `DashboardLayout`). This comes from the code and was not visually confirmed.
  - `DashboardLayout` (sidebar, no top bar): every other page.
  - In V03 (staging only), the Foundation pages move to `AuthShell`, so they lose the sidebar (see 3B).

---

## 2. Command Center (`/command-center` → `src/pages/CommandCenterNext.jsx`, 1,206 lines)

Plan gate: `foundation`, `gateType: page`. Wrapped in `AuthShell activeNav="command-center"`.

### 2.1 Shell (top bar, `AuthShell.jsx`; there is no sidebar on this page)

| Element | Detail | Data source / target |
|---|---|---|
| Brand button | logo seal + "CORE TRUTH HOUSE" / "COMMAND CENTER" | → `/command-center-next` |
| Nav buttons | Command Center · Reports · Signal OS · Knowledge Base (active one highlighted) | → `/command-center-next`, `/analytics`, `/signal-inbox`, `/knowledge-base`. A Workspace tab is deliberately omitted (placeholder page). |
| Search box | placeholder "Search the House…" | submit → `/knowledge-base?q=…` |
| Notification bell | `NotificationBell` | notifications socket / alerts |
| Profile button | avatar or initial, first name, "{Plan} Plan" | Clerk user (`useUser`), `usePlan().plan` (Legacy shows "Legacy Plan") |
| Profile menu | head (name + plan) · Account settings → `/settings` · Plan & billing → `/billing` · Sign out (→ `/sign-in`) | |

### 2.2 Page states (`dataSource`)

| State | When | What renders |
|---|---|---|
| `pending` / loading | first mount and every Refresh | heading, Quick Actions, Consult card, footer "Updating workspace intelligence…". **All data cards withheld** (`derived === null`). Refresh button disabled with spinner. |
| `empty` | no active workspace | same as pending, no footer |
| `overview` | `/api/command-center/overview` answered (production path) | all cards, Brand Signals shows a **LIVE** badge |
| `legacy-fallback` | overview unavailable, so 7 older endpoints are called | cards built from them; any card whose source failed is blanked (dash or "…unavailable"); admins only see the banner "The consolidated Command Center backend is pending…" |
| `error` | load threw | red alert with the message; data cards withheld |
| partial failure | some legacy sources rejected | alert "N verified workspace data source(s) … temporarily unavailable." |

### 2.3 Heading row and banners

| Element | Detail | Data source |
|---|---|---|
| H1 | "{Good Morning / Good Afternoon / Good Evening}, {firstName}." + sparkle. Before 12:00 Morning, 12–16 Afternoon, 17+ Evening. | browser clock; name = Clerk first name → full name's first word → workspace name → "Founder" |
| Subtitle | "The House has organized what needs your attention inside {workspace name or "this workspace"}." | `useWorkspace().activeWorkspace.name` |
| Date + time stamp | e.g. "November 15, 2026 · 9:41 AM" (ticks every 60 s, no request) | browser clock |
| Refresh button | re-runs the load | |
| Diagnostic welcome banner | title "Welcome to Core Truth House, {first}." · "Your brand diagnostic score was {score}/60. You are starting in the {tier} tier." · tier line · "Let's go →" · dismiss ✕. Shown once per session until `shown: true`. | `sessionStorage["cth_diagnostic_context"]` (`tier`, `score`, `first_name`). Tier → destination: Foundation `/brand-foundation`, Structure `/brand-positioning`, House `/identity-studio`, Estate `/signal-inbox`. |
| Admin-only data-source banner | shown only in `legacy-fallback` and only to admins | |
| Error alert | | |

### 2.4 Left column

| Card | Fields / buttons | States | Data source |
|---|---|---|---|
| **Brand Health Score** (only when `derived`) | score button (big number, status line) → `/brand-health`; up to 3 rows, each with ✓ (≥70) or ⚠ (<70): "Brand Foundation", "Positioning & Messaging", "Content Consistency", each "{n}% complete"; link "View Full Report →" | score `—` when unknown; rows with 0% are dropped; if no rows, the status line is shown as a note. Status copy: ≥85 "Authority is building", ≥70 "Structure is taking hold", ≥50 "Core systems need alignment", >0 "The foundation needs attention", 0 "Complete the diagnostic". | overview: `brandHealth.score/status`. Fallback: `BrandHealthContext.healthData.overall_score`, else latest audit score. Rows: `healthData.modules.{brand_foundation, strategic_os, content_studio}` |
| **Your Next Move** | eyebrow "YOUR NEXT MOVE", title, body, gold button `{action}` → `nextMove.route`, ghost button "Ask Zuri Why" (opens Ask the House) | has next move / **default** "Start here: Brand Foundation" with only "Open Brand Foundation" (no Zuri button) | overview `next_move`. Fallback: computed from the latest audit and workspace stats (no audit → "Complete your Brand Diagnostic" → `/brand-audit`; else the weakest of Foundation / Offer / Systems / Content; score ≥85 with campaigns → "Optimize one conversion path" → `/analytics`) |
| **Daily Intelligence** (subtitle "Evidence worth acting on today") | up to 3 clickable cards: icon, label, sentence | empty: "Complete the diagnostic, confirm signals, or create a campaign to begin the daily intelligence feed." | overview `dailyIntelligence`. Fallback: built from confirmed signals, brand score, active campaigns |
| **Quick Actions** (always rendered, even with no data) | 7 buttons (label · helper → route): Run Brand Diagnostic · Find the structural gap → `/brand-audit`; Generate Content · Create from Brand Memory → `/content-studio`; Create Campaign · Connect message to movement → `/campaign-builder`; Build Offer · Shape the transformation → `/offer-builder`; Audit Website · Review clarity and conversion → `/brand-intelligence`; Analyze Competitor · Map market positioning → `/brand-positioning`; Record Pitch · Practice expert articulation → `/studios/voice` | static | hardcoded `QUICK_ACTIONS` |

### 2.5 Center column (only when `derived`)

| Card | Fields / buttons | States | Data source |
|---|---|---|---|
| **4 metric cards** (each is a button) | **Buyer Signals** (gold): confirmed count, note "{n} awaiting confirmation" → `/signal-inbox`. **Open Decisions** (purple): count, note "Unresolved strategic decisions" → `/workspace?view=decisions`. **Active Work** (green): count, note "{n} active campaigns" → `/workspace?view=work`. **System Alerts** (orange): count, note "Review workspace health" or "All systems normal" → `/alerts` | value `—` when the source is unavailable; notes become "Signal source unavailable", "Decision endpoint pending", "Campaign source unavailable", "Alert source unavailable" / "Alert endpoint pending". In fallback, Open Decisions is always `—`. | overview: `buyerSignals.confirmed/unconfirmed`, `openDecisions.count`, `activeWork.count/campaignCount`, `systemAlerts.count`. Fallback: buyer-signals list, campaigns list, workspace stats |
| **Your Brand House** (only if house levels exist) | left rail of 4 buttons top-down: ESTATE "Legacy & Scale", HOUSE "Systems & Offers", STRUCTURE "Messaging & Positioning", FOUNDATION "Identity & Clarity" (name and descriptor only; percentages are not shown, only read out by screen readers on the hotspots); house image `/command-center-assets/brand-house.png` with 4 clickable hotspots; footer "Select a level to open that room." and "Explore the House →" `/brand-house` | | overview `brand_house.{foundation,structure,house,estate}`. Level routes: Foundation `/brand-foundation`, Structure `/strategic-os`, House `/campaign-builder`, Estate `/workspace`. Fallback computed from stats and health modules; withheld if stats failed |
| **Recent Progress** (subtitle "Movement recorded in this workspace"; header link "View activity" → `/workspace?view=activity`) | up to 4 clickable items: icon + date/status + title | empty: "Workspace milestones will appear here as the tenant completes real work." Panel withheld if a feeding source failed. | overview `recentProgress`. Fallback items: "Brand Diagnostic recorded", "Brand Memory connected", active campaign, "Buyer signal confirmed" |
| **Active Workbench** (subtitle "What is currently being built"; header link "Open workspace" → `/workspace?view=work`) | up to 3 cards: type, title, status dot + status | empty: "Start a campaign, build an offer, or generate content to place work on the bench." Withheld if campaigns failed. | overview `activeWork.items`. Fallback: active campaigns, else Content Library / Offer Architecture counts from stats |

### 2.6 Right column

| Card | Fields / buttons | States | Data source |
|---|---|---|---|
| **Brand Signals** (subtitle "What the market is showing you"; only when signals are available) | **LIVE** badge (overview source only); up to 4 rows: level chip 1–5, title, "{Level label} · {source}", date. Level labels: 1 Recognition, 2 Problem Ownership, 3 Solution Curiosity, 4 Offer Curiosity, 5 Purchase Movement. Link "View All Signals →" `/signal-inbox` | empty: "Confirmed buyer signals will appear here after the tenant reviews them." | overview `buyerSignals.recent`; fallback `buyerSignals.list` sorted by `created_at` |
| **Consult the House** (always rendered; subtitle "AI Brand Architect") | seal image, "I'm your AI Brand Architect." / "I help you make high-impact moves that build a brand that lasts."; 4 prompt buttons: "Why aren't people buying?", "Rewrite my homepage.", "Build my launch strategy.", "Analyze my positioning."; text input "Ask a strategic question…" + send arrow | empty or whitespace input does nothing | opens the `AskTheHouseDrawer` (surface `command_center`) with the text prefilled; nothing is sent until the user presses the drawer's own Send |

### 2.7 Data sources summary

- **Primary (live):** `GET /api/command-center/overview` (normalised in `src/lib/commandCenterOverview.js`) plus `BrandHealthContext`.
- **Fallback (7 parallel calls):** `/api/onboarding/progress`, `/api/audit/latest`, `/api/workspace/{id}/stats`, buyer-signals list, campaigns list, `/api/crm/dashboard/summary`, `/api/analytics/overview`.
- **Browser only:** `sessionStorage` (diagnostic context), clock.
- The Command Center has no draft / submitted / locked states. Those belong to Foundation V03.


---

## 3. Foundation

### 3A. What is live today (`release/journey1-live` = production): one page, no "home", no sections, no review states

`/brand-foundation` (and `/brand-memory`) → `src/pages/BrandFoundation.jsx`, wrapped in `DashboardLayout` (sidebar). Plan gate: none. Sidebar label "Foundation", config label "Foundation". Route `/foundation` does **not** exist here.

**Data:** `GET` / `POST /api/persist/brand-foundation` (saves automatically 700 ms after typing stops), `POST /api/persist/brand-foundation/ai-assist` (Zuri suggestion), `getNextStep("/brand-foundation", plan)` from `config/brandCoreNextStep.js` for the continue button, `BrandHealthContext.refresh()` after every save. A workspace is required ("No active workspace found.").

**Header:** H1 "Brand Foundation", subtitle "Define the core truth your brand is built on so every strategy, offer, and content decision pulls from the same source of truth.", "{n} of 8 complete" with a 120 px progress bar.

**Eight fields** (one is shown at a time, picked from pill chips, with a ✓ when complete, and from the 148 px "Sections" rail):

| id | Label | Subtitle | Complete at (min chars) | Max chars | Saved as |
|---|---|---|--:|--:|---|
| mission | Mission Statement | Why your brand exists | 20 | 300 | `mission` |
| vision | Vision Statement | Where your brand is going | 30 | 500 | `vision` |
| coreValues | Core Values | What your brand stands for | 30 | 600 | `values` (one per line → array) |
| tagline | Tagline | Your memorable phrase | 5 | 100 | `tagline` |
| positioning | Positioning Statement | Your unique place in the market | 50 | 600 | `positioning` |
| brandStory | Brand Story | Your origin narrative | 100 | 2000 | `story` |
| toneOfVoice | Tone of Voice | How your brand speaks | 30 | 600 | `tone_of_voice` (+ `brand_voice`) |
| brandPillars | Brand Pillars | The 3 to 5 content territories your brand owns | 30 | 800 | `brand_pillars` |

**Per-field states:** `empty` (nothing), `draft` (below the minimum, counts 0.5), `complete` (at or above the minimum, counts 1). Score = average × 100.

**Active-field panel:** title and subtitle · status pill · "Why this matters" box · tips list · "Current answer" label and textarea with placeholder plus "Example: …" · **Clear field** · save indicator ("Saving…" / "Saved") · red save or load error · **Zuri · suggestion** block (button generates; "Zuri is drafting from your foundation…" while loading; **Use this** accepts into the field and saves, **Dismiss** discards) · previous / next field buttons (label of the neighbour field; on the last field the next-step CTA, e.g. "Save & continue" or the `brandCoreNextStep` label, which may route to `/billing` when the next step needs an upgrade) · "Ask the House" link.
**Overlays:** "Unsaved AI Draft" modal ("You have an AI-generated draft that has not been accepted. Leaving this field will discard it." → **Stay and Review** / **Discard and Continue**); **View All** button opens the "Foundation Elements" drawer listing all 8 values ("Not started yet" when empty) with **Keep Building** and the next-step CTA; close ✕.
**Test ids:** `brand-foundation-page`, `field-nav-{id}`, `view-all-foundation-btn`, `input-{id}`, `zuri-inline`, `generated-preview`, `accept-generated-btn`, `generate-ai-btn`, `prev-field-btn`, `next-field-btn`, `stay-and-review-btn`, `discard-and-continue-btn`.

---

### 3B. Foundation V03 (**staging only**: branch `staging-foundation-v03-20261112` @ `4daca5e`, not in production)

Per the approved V03 rules: required fields = the approved list only; a section scores 100 only when **locked**; Review & Lock = locked / 6; reviewer set by `CTH_FOUNDATION_REVIEWER_USER_IDS`.

#### 3B.1 Routes and shell added by V03

| Route | Component | Sidebar | Notes |
|---|---|---|---|
| `/foundation` | `FoundationHome.jsx` | not in sidebar | new, `hidden`, no plan gate |
| `/foundation/review-lock` | `FoundationPages.ReviewLockPage` | not in sidebar | new, `hidden` |
| `/brand-audit` | `FoundationPages.BrandAuditPage` | FOUNDATION → "Brand Audit" | replaces `BrandAudit` (still reachable at `?classic=1`) |
| `/brand-foundation` | `BrandFoundation.jsx` (rewritten to 57 lines, "Core Truth") | FOUNDATION → "Foundation" | replaces the legacy page in 3A |
| `/audience` | `AudiencePage` | FOUNDATION → "Audience" | `?classic=1` opens legacy `Audience` |
| `/brand-positioning` | `PositioningPage` | FOUNDATION → "Brand Positioning" | `?classic=1` opens legacy |
| `/messaging-structure` | `MessagingPage` | FOUNDATION → "Messaging Structure" | `?classic=1` opens legacy |
| `/identity-studio` | `ExpressionPage` ("Brand Expression") | FOUNDATION → "Identity Studio" | `?classic=1` opens legacy |

- **Shell change:** Foundation pages use `AuthShell activeNav="foundation"`, i.e. the **top bar with no sidebar**. A **"Build" dropdown** appears next to Command Center with 8 items: Foundation Home `/foundation`, Brand Audit, Core Truth `/brand-foundation`, Audience Truth `/audience`, Positioning, Messaging, Brand Expression `/identity-studio`, Review and Lock.
- **Naming drift to decide:** the sidebar still says "Foundation", "Audience", "Identity Studio", but V03 page titles and tabs say "Core Truth", "Audience Truth", "Brand Expression". The Command Center quick action and next-move copy change from "Brand Diagnostic" to "Brand Audit" on that branch.
- **Section ids (server):** `brand_audit`, `core_truth`, `audience`, `positioning`, `messaging`, `expression` (6 reviewable sections) plus `review_lock` (the seventh tab, not reviewable). Statuses: **draft → submitted → in_review → locked**.

#### 3B.2 Shared page frame (`FoundationSectionLayout.jsx`)

- **Header:** H1 + subtitle.
- **Toolbar on section pages** (not on home): disabled "Draft ⌄" and "Approval ⌄" controls (tooltips point to the status card), a "Section N of 7" dropdown (Review and Lock option disabled), **Save Draft**, **Save and Continue →**. On Review and Lock these are replaced by a disabled **Export Blueprint**.
- **Toolbar on Home:** "Version unavailable" text, disabled "Approval ⌄", "All Sections ⌄" (anchor to `#foundation-sections`), disabled **Export Blueprint**, disabled **Review and Lock 🔒**.
- **Tab bar (8):** Foundation Home · Brand Audit · Core Truth · Audience Truth · Positioning · Messaging · Brand Expression · Review and Lock (Brand Audit page swaps this for its own tabs).
- **Body:** main column (with `SectionStatusCard` first, on the 6 reviewable section pages, never on Home or Review and Lock) plus an optional right rail. Optional footer row: Back · Save Draft · Save and Continue →.

#### 3B.3 `SectionStatusCard` (the draft / submitted / locked UI), shown at the top of each section page

Data: `GET /api/foundation/sections` (status, version, review note, unlock info, `required_complete`, `missing_items`) and `GET /api/foundation/readiness` (score line). Actions: `POST /api/foundation/sections/{id}/submit | withdraw | request-unlock`.

| State | Badge | Help text | Visible controls |
|---|---|---|---|
| loading | — | "Loading section status…" | — |
| load error | — | error text | Retry |
| **draft**, required fields incomplete | Draft | "You can keep editing. Submit this section when the required fields are complete." + "To submit, still needed: {missing items}." | **Submit for review** (disabled) |
| **draft**, ready | Draft | same | **Submit for review** (enabled; "Submitting…" while busy) |
| **draft after "Request changes"** | Draft | + **"Changes requested"** note block with the reviewer's text; also "This section was unlocked for editing." if it came from an unlock | as above |
| **submitted** | Submitted for review | "Waiting for a Core Truth House reviewer. You can withdraw it to keep editing." + "Submitted. Your score stays at most 90% until a reviewer locks it." | **Withdraw to keep editing** |
| **in_review** | In review | "A reviewer is looking at this section now." | none |
| **locked** | Locked (dark purple) | "Approved and locked. Ask for it to be unlocked if something has to change." + "Locked: counts as 100%." | **Request unlock** → required note ("Why does this section need to change?", max 2000) → **Send request** / **Cancel** |
| **locked, unlock requested** | Locked | + "Unlock requested. A reviewer will respond." | none |

Also: "Version {n}" when present; success line (e.g. "Submitted for review." / "Withdrawn. You can edit again." / "Unlock requested."); error line (the server's plain message). Badge colours: gold tint for submitted and in review, purple fill for locked.
**Gap for mockups:** the UI never disables or greys the fields on a locked section. `memberActions().editable` is computed but unused. Locking is enforced only by the server (HTTP 423 `section_locked`, message shown inline), so a locked section currently looks editable until a save is refused.

#### 3B.4 Foundation Home (`/foundation`, `FoundationHome.jsx`)

Title "Foundation", subtitle "Build the truth the rest of your brand will stand on." No right rail. Data: `GET /api/foundation/readiness` (blocks the page; error + Retry); side data from `API_PATHS.audience.avatars` (primary avatar) and `GET /api/persist/messaging-structure` (brand promise). A side-data failure only fills small "unavailable" messages.

| Card | Fields / buttons | Empty / state handling | Data |
|---|---|---|---|
| Foundation readiness | donut with overall %, "Foundation readiness", "Draft progress from saved workspace fields.", link "How this is calculated" | | `readiness.overall` |
| Last approved | "LAST APPROVED" · **"Not tracked"** · "Approval history is unavailable in this release." | hard-coded, **stale** (locking now exists) | — |
| Current version | "CURRENT VERSION" · **"Not tracked"** · "Version history is unavailable in this release." | hard-coded, **stale** | — |
| Primary audience | name · stage | "Not available" / "No saved audience profile is available." / side error | avatars API (primary, else first) |
| Your Foundation sections (pill = `scoring_model_version`) | numbered list of the sections the server returns (up to 7): name link, status word (Not started / In progress / Complete), meter, "{score}%", open arrow → Brand Audit, Core Truth, Audience Truth, Positioning, Messaging, Brand Expression, Review and Lock | status is by score only (0 / 1–99 / 100) and **ignores draft / submitted / locked** | `readiness.sections[]` |
| Ask the House | "YOUR NEXT STEP" · "Continue {next section}" or "Review your saved foundation" · first missing item · **Work on this with the House →** · Guide me · Draft from my answers · Refine this · Check alignment · footnote "Suggestions are generated only when requested and are not saved until you apply them." · "?" | next = first section that is not Audit or Review and Lock and scores under 100 | readiness + `AskTheHouse.open(sectionId)` |
| Foundation review (right aside) | "Approval status" **Unavailable** ("Approval workflow is not implemented.") · "Lock status" **Unavailable** ("Lock state is not tracked.") + lock medallion · "Review actions are unavailable" · disabled **Review Conflicts →** | hard-coded, **stale and contradicts 3B.3** | — |
| Your path to 100% | up to 3 rows (sections under 100, Audit excluded): icon, "{Section} – {score}%", first missing item, "Overall: {projected}%" (or "Unavailable" / "Overall: unavailable"), button **Continue with AI →** (Review and Lock row: "View status"); hint about projected overall | "All tracked sections are complete." | `overall_raw`, `score_raw` |
| Brand promise | text or "No brand promise saved" · note · link "Open Messaging →" | | messaging API |
| Blueprint | "Not available" · "Blueprint versioning is not implemented." · disabled **Export Blueprint** · Approval **Unavailable** · Lock **Unavailable** | hard-coded | — |

#### 3B.5 Section pages

All six share: toolbar + tab bar + `SectionStatusCard` + **Back / Save Draft / Save and Continue →** footer (Audience and Audit differ, see below). "Ask the House" modes everywhere: **Guide me**, **Draft from my answers**, **Refine this**, **Check alignment**; AI drafts show "AI DRAFT · NOT APPLIED" with **Apply** and **Request changes** and are never saved until applied. Rails read `GET /api/foundation/readiness` (overall %, this-section %, missing items, "Your path to 100%").

**1. Brand Audit (`/brand-audit`)** · title "Brand Audit", "See where your brand stands and what to strengthen next." · no toolbar, custom tabs. Data: `GET /api/audit/latest`; `GET /api/foundation/diagnostic-insight`.
- Header actions: disabled "Latest audit ⌄" · module filter (All + 6 modules) · Refresh · Export Audit (`AuditExportButton`, disabled when no audit id) · Retake Audit (`?classic=1`).
- Tabs: Audit Overview · Your Brand · Your Offer · Your Presence · Your Goals · Audit History · link "← Back to Foundation".
- **Diagnostic Insight card:** no result → "No Brand Diagnostic has been completed…" (or "…earlier Brand Audit, but no Brand Diagnostic result yet.") + **Start the Brand Diagnostic**; with result → "Taken by you / a teammate", score "/ 60" + range, recommended tier, "Biggest gaps" list, "First actions" (up to 3), scope note.
- 4 KPI cards: Overall audit score (/100), Strongest module, Priority gap, Last audit.
- "Your audit breakdown" ("{n} of 6 modules assessed"): Brand Foundation, Visual Identity, Offer Suite, Systems & SOPs, Content Library, Launch Readiness, each with score / meter / "Open →" (to `/brand-foundation`, `/identity-studio`, `/offer-builder`, `/systems-builder`, `/content-studio`, `/strategic-os`); empty "Not available".
- "Action checklist" (up to 6 saved recommendations, no progress tracked) · "Review audit answers".
- Right: Ask the House card (summary text, next saved recommendation, 4 modes, **disabled** question box "This page cannot forward typed prompts…", readiness contribution, Open Ask the House) and "Your audit inputs" (grouped answers by tab; Audit History tab shows latest date / score / previous score / "History beyond the latest saved record is unavailable").
- Plus the status card (this page has no right rail).

**2. Core Truth (`/brand-foundation`)** · "Build the statements and convictions that guide every decision your brand makes." Data: `GET`/`POST /api/persist/brand-foundation`, `…/ai-assist`, `GET /api/foundation/readiness`.
- Cards (each has icon, hint, **Help me answer** and **Refine**): Purpose · Mission · Vision (textareas with "{n}/300 characters", existing text preserved over 300) · **Beliefs** (ordered list: edit, ↑ ↓ ×, "Add belief") · **Core Values** (chips with ×, "Add value") · Founder Insight.
- "Also saved in your Foundation" collapsible: Tagline, Positioning Statement, Brand Story, Tone of Voice, Brand Pillars (each labelled with its future section).
- Right rail: **Ask the House** (Guide me, Draft from my answers, Refine this, Check alignment, field picker, current-content box, draft block); **Core Truth completion** ("This section: {n}% complete", "{x} of {y} tracked fields complete"); **Foundation readiness** donut with three rows "Draft / version tracking", "Approval workflow", "Lock status", each hard-coded **Unavailable** (stale); **Your path to 100%** table (Section / Readiness / Still missing, next 3 sections).
- States: loading ("Loading Core Truth…"), load failure with Retry, error banner with Retry.

**3. Audience Truth (`/audience`)** · "Understand the people your brand is here to serve." Data: audience avatars API (`GET`, `PATCH` by id), readiness. No right rail.
- Hero: "PRIMARY AUDIENCE" · "Primary profile" / "Saved profile"; Audience name; Audience stage ("Saved audience-stage value; this does not represent business stage."); button **Edit Audience** / **Cancel edit** / **Create Audience** (opens the classic editor).
- View mode: 8 insight cards (Problem awareness, Core fear, Core desire, Immediate problem, Failed alternatives, Emotional trigger, Objections, Desired transformation), each with a **Help me answer** button; empty "No saved response".
- Edit mode: 9 text fields (Problem awareness, Core fear, Core desire, Immediate problem, Emotional trigger, Surface symptoms, Where they are, Objections, Desired transformation) + **Save Audience** + "Manage all audience profiles".
- Empty state (no avatar): "No audience avatar has been saved in this workspace." + "Open audience manager".
- Bottom: Channels & notes (preferred channels chips, notes, "Other saved context"), Ask the House (4 modes, disabled question box), Audience readiness donut + "YOUR PATH" (Positioning %, Messaging %).
- Footer: Back · Save Draft (enabled only when editing) · Save and Continue / Edit Audience.

**4. Positioning (`/brand-positioning`)** · "Define the place your brand earns in the market." Data: `GET`/`POST /api/persist/brand-positioning`, `…/ai-assist`, avatars API.
- 8 field cards: Market category (editable), Target audience (editable), Problem owned, Current alternative, Unique mechanism, Differentiator (editable), Competitor white space, Positioning statement. **Read-only fields** show "Not available in the current saved-positioning record…" when empty.
- Readiness strip (positioning % and foundation %). "About saved positioning fields" collapsible. Save errors / "Positioning saved." Link "Open the full Positioning editor".
- Rail: Ask the House (4 modes, **Audience comparison** panel, "Choose a field to draft", current content, draft block, readiness checklist) + this-section %, overall donut, path to 100%.

**5. Messaging (`/messaging-structure`)** · "Give your brand a clear message people can act on." Data: `GET`/`POST /api/persist/messaging-structure`, `…/ai-assist`; Tagline is saved to the foundation record.
- Cards: Brand promise, One-liner, Elevator pitch, Core message, Tagline, **Proof points** (numbered rows with input, "Unavailable" evidence tag, Remove; **Add proof point**, disabled **Attach evidence**), "Primary CTA / combined CTA copy", and a disabled "Secondary CTA" ("The saved record has one combined calls_to_action field…").
- Readiness strip, "About saved messaging fields", saved / error messages, link "Open the full Messaging editor". Rail: Ask the House (4 modes, "Evidence context", field picker, draft block, checklist) + this section, overall, path (Expression, Review and Lock).

**6. Brand Expression (`/identity-studio`)** · "Make your brand recognizable in how it sounds and looks." Data: `GET /api/identity`, `GET /api/persist/brand-foundation`, `GET /api/media-upload/assets`; saves `POST /api/identity/save` and tone to the foundation record.
- **Verbal identity:** Voice traits (chips or "No separate voice-trait values are saved."), Tone by situation (4 fixed rows: Educational, Inspirational, Sales, Support, each "Not separately editable"), **Tone of voice** (the only editable field), Sentence style, Words we use, Words to avoid, Voice preview.
- **Visual identity:** Primary colors (6 swatch slots), Heading typeface, Body typeface, Logo suite (3 slots, "No confirmed logo asset in this slot"), Photography style; "Help me answer" buttons; link "Open full Identity Studio asset tools".
- Ask the House card with "{n} voice traits · {n} colors · {n} typefaces · {n} confirmed assets", section readiness, foundation readiness.
- Footer: Back · Save Draft · Save and Continue → `/foundation/review-lock`.

**7. Review and Lock (`/foundation/review-lock`)** · "Submit each section for review. Only a locked section counts as 100%." Data: readiness, `GET /api/foundation/sections`, `GET /api/foundation/review/queue` (reviewers only).
- **Section status table** ("{n} of 6 locked"): Section · Status badge · Readiness % · Next step ("Approved", "A reviewer is looking at it", "Waiting for review", "Changes requested: …", "Ready to submit", "Needs: …", "Keep editing").
- **Review queue** (reviewers only; hidden on 403): "{n} waiting"; empty "Nothing is waiting for review."; each row shows section label, status badge, "Workspace {id} · version {n}", and an "Unlock requested" note block for locked rows. Buttons: **Start review** (submitted), **Approve and lock** (submitted / in review), **Request changes** (→ required note "What needs to change?" → **Send back to draft**), **Unlock** (locked → required note "Reason for unlocking" → **Unlock section**), Cancel.
- 4 KPI cards: Foundation readiness donut, **Version "Not tracked"**, **Last approved "Unavailable"**, **Approval status "Unavailable"** (these three are hard-coded and stale).
- "Foundation review" list (7 rows with number, status dot, link, %, meter, missing items) · "Conflict review" ("Conflict detection is not implemented; no conflicts have been assessed.") · Ask the House.
- "Your path to 100%" (up to 3 sections under 100 with **Open section**, current readiness bar, "Scoring model: {version}. No projected score is shown.") · **Approval and lock** dark panel: Sections locked "{n} of 6", Waiting for review, Last approved (date or "Nothing locked yet"), Foundation status (Draft / In review / Locked), reason text, disabled **Export Blueprint**, **Back**.


---

## 4. Sidebar, exactly as shown (`src/components/Layout.jsx`, `Sidebar`)

Applies to every `DashboardLayout` page. It is **not** shown on the Command Center, Brand House or Workspace (they use the `AuthShell` top bar; see 1.1). V03 does not change this file.

**Header:** logo (`/cth-logo.png`) · "Core Truth House" · "BRAND OS" · collapse button (`PanelLeftClose`). Collapsed width 68 px (icons only, hover expands after 200 ms), expanded 240 px. Under 768 px it collapses automatically and opens as an overlay via the menu button.
**Groups** are uppercase labels with a chevron and can be collapsed individually.

| Group label | Items (label → path) |
|---|---|
| **DASHBOARD** | Command Center → `/command-center` |
| **FOUNDATION** | Brand Audit → `/brand-audit` · Foundation → `/brand-foundation` · Brand Positioning → `/brand-positioning` · Messaging Structure → `/messaging-structure` · Audience → `/audience` · Identity Studio → `/identity-studio` · Strategic OS → `/strategic-os` |
| **STRUCTURE** | Brand Playbooks → `/systems-builder` · Customer Journey → `/customer-journey` · Offers → `/offer-builder` · Campaign Builder → `/campaign-builder` · Content Studio → `/content-studio` |
| **HOUSE** | Studios → `/studios` · Email → `/email-settings` · CRM → `/crm` |
| **ESTATE** | Calendar → `/calendar` · Social Planner → `/social-media-manager` · Cohort Community → `/community` · Content Queue → `/content-queue` |
| **INTELLIGENCE** | Signal Inbox → `/signal-inbox` · Analytics → `/analytics` |
| **WORKSPACE** | Workspace Library → `/workspace-library` · Members → `/members` · Settings → `/settings` · Alerts → `/alerts` |
| **SUPPORT** | Tutorials → `/tutorials` · Help Desk → `/help-desk` · Knowledge Base → `/knowledge-base` · Release Notes → `/release-notes` |
| **ADMIN** (only when `isSuperAdmin === true`) | Mail → `/mail` · Cohort Manager → `/cohort-manager` · Automations → `/automations` · Store → `/platform-store` · AI API Keys → `/ai-keys` |

**Item behaviour**
- Active item: panel background, crimson 3 px left border.
- **Locked** (the plan cannot access the path): dimmed to 45%, lock icon on the right; click still navigates (to the upgrade page from `PlanGate`). Hover shows a tooltip from the route's `lockedTooltip`.
- **Social Planner** expands three child links when it is the active page: Publish Calendar (`?surface=publish`), Create (`?surface=create`), Grid (`?surface=grid`).
- Optional `badge` pill is supported but no item sets one.

**Footer (below the list):**
- "AI Credits" meter (bolt icon, "{used}/{limit or ∞}", progress bar, turns red at 90%+) → `/billing`. Hidden when there is no usage data. Data: `GET /api/usage/summary?workspace_id=…`.
- **Sign Out** (redirects to `/`).
- **Switch to Admin** (only for SUPER_ADMIN / OPS_ADMIN roles or `isSuperAdmin`) → `/admin/dashboard`.

**Not in the sidebar at all (but routable):** Brand House, Workspace, Onboarding, Brand Health, Brand Intelligence, Brand Memory, Audience avatar editor, Studios sub-pages (Visual, Video, Voice, Bio), Launch Planner, First Campaign, Campaign Setup, CRM contact record, Billing, Documents, Join Workspace. Billing has no sidebar item; the sidebar links to it from the AI Credits meter, and the top-bar profile menu and upgrade prompts also link to it.

**Top-bar nav on `AuthShell` pages** (Command Center, Workspace, Brand House, Analytics, and Foundation in V03): Command Center · Reports · Signal OS · Knowledge Base, plus the V03-only "Build ▾" menu on Foundation pages (section 2.1 and 3B.1).

---

## 5. Mockup-relevant gaps and inconsistencies (facts only, no recommendations)

1. **Two navigation systems.** Sidebar pages and top-bar pages are different chrome. V03 moves the Foundation set to the top bar, while the sidebar still lists those items under FOUNDATION.
2. **V03 names differ from sidebar names** (Core Truth / Audience Truth / Brand Expression vs Foundation / Audience / Identity Studio).
3. **Stale "unavailable / not implemented" copy in V03:** Foundation Home (Last approved, Current version, Foundation review aside, Blueprint), the Core Truth rail rows, Review and Lock KPI cards, and the toolbar's disabled "Draft ⌄ / Approval ⌄" all still say approval, lock and version are not implemented. Per-section status, submit, review queue and lock enforcement are built (staging).
4. **Home section list ignores workflow state:** it shows Not started / In progress / Complete by score only. It has no Draft / Submitted / In review / Locked badge, although the status table on Review and Lock does.
5. **Locked sections are not visually locked in the form** (fields remain editable; only a server 423 refusal on save reveals it).
6. **No "Review and Lock" action on Home is enabled** (disabled button), and **Export Blueprint is disabled everywhere**.
7. **The legacy live Foundation page** has none of: home, sections, readiness, submit, review or lock. It uses its own 8-field model (mission, vision, core values, tagline, positioning, brand story, tone of voice, brand pillars) with 3-state completeness (empty / draft / complete).
8. **The Command Center's Brand House card hides the percentages** (only descriptors are shown; completion lives on `/brand-house`).
9. **Config labels vs sidebar labels** differ for `/systems-builder` ("Structure" vs "Brand Playbooks"); some config groups differ from sidebar sections (see 1.1).
10. **`/workspace`**, which the Command Center links to heavily (`?view=decisions|work|activity`), is a placeholder page that ignores those view parameters.
