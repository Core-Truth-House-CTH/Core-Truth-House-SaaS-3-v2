# Core Truth House — Claude Code Context

## What This Is
Core Truth House is a brand strategy SaaS for serious founders. It helps users build a brand operating system: foundation, identity, content, offers, systems, and execution — all in one platform.

- Live site: https://coretruthhouse.com
- Backend API: https://api.coretruthhouse.com
- VPS: Hostinger srv1487625 (187.124.155.147)
- Repo: github.com/Sha1427/Core-Truth-House-SaaS-3-v2

## Tech Stack
- Frontend: React (Vite), React Router, Tailwind CSS, shadcn/ui components
- Auth: Clerk (@clerk/react) — publishable keys in .env files (not committed)
- Backend: FastAPI at api.coretruthhouse.com (separate service, same VPS)
- Build: npm run build generates dist/ with static route HTML injection
- Deploy: dist/ served by Nginx from /var/www/coretruthhouse-clean/

## Directory Structure
- src/App.jsx — public route shell
- src/ProtectedApp.jsx — auth shell with Clerk provider
- src/navigation/AppRouter.jsx — config-driven route registry
- src/navigation/pageRegistry.jsx — maps route paths to page components
- src/config/appRoutes.js — protected route definitions
- src/config/planAccess.js — tier/plan feature gating config
- src/components/Layout.jsx — sidebar + DashboardLayout shared across all pages
- src/components/Auth.jsx — SignInPage, SignUpPage, ProtectedRoute
- src/components/PlanGate.jsx — tier-gating wrapper
- src/components/auth/CoreLoginForm.jsx — Clerk useSignIn login form
- src/lib/apiClient.js — axios instance with Clerk auth token injection
- src/lib/apiPaths.js — named API endpoint paths
- src/pages/ — 50+ page components (public + authenticated)
- src/context/ — ThemeContext, WorkspaceContext, PlanContext, DemoModeContext
- src/styles/ — CSS design tokens and component styles
- public/sw.js — service worker kill-switch (clears cache, unregisters itself)
- public/methodology-assets/ — methodology page images
- public/tiers-assets/ — tiers page images and comparison icons
- public/command-center-assets/ — command center hero image

## Design System

### Colors
- Deep purple #33033C — sidebar, hero panels, dark CTAs
- Crimson #AF0024 — accent buttons, numbered circles, icons
- Gold #C4A95B — eyebrow pills, icon accents, CTA buttons, status indicators
- Ivory #fbf7f1 — page background
- Card bg #fcf8f4 — card background
- Card border rgba(216,197,195,0.6)

### Typography
- Headlines: Playfair Display (serif) — all H1, H2, large numbers, score displays
- Body: DM Sans — all body text, labels, navigation
- NEVER use Inter, Georgia, or system-ui for headlines

### Layout
- Sidebar: 68px collapsed / 240px expanded, hover-expand (200ms enter / 150ms leave)
- Section padding: 88-104px on public pages
- Card radius: 4-6px (NOT 12px+ generic SaaS)
- Max content width: ~1240px

### Component Patterns
- Gold as accents, not large fills
- Dark CTA pattern: gold button on deep purple background
- Eyebrow pills: gold border, uppercase, letterspaced
- Score numbers: Playfair Display oversized
- Cards: cream background, subtle border, minimal shadow

### Rules — Never Violate
- No Inter font anywhere
- No pure black (#000000) — use deep purple instead
- No neon glow effects
- No generic shadcn default styling — override to match CTH design
- No 3-column generic feature rows
- No oversized screaming H1s on public pages
- No em-dashes in copy (UI glyphs in comparison tables are OK)
- No bold/heading color using var(--cth-white)fff or other broken token concatenation

## Visual Reference
Command Center (/command-center) is the design reference for the entire authenticated app. Every page should feel like it belongs in the same house. When in doubt, match Command Center.

## Authentication Flow
1. User visits /sign-in — CoreLoginForm uses Clerk useSignIn hook
2. On success — redirect to /command-center or redirect_url param
3. All protected pages wrapped in ProtectedRoute + PlanGate
4. PlanGate checks usePlan() canAccess(route) — renders page or upgrade prompt
5. Clerk keys: pk_live_* for production, pk_test_* for local dev

## Tier Structure
- Foundation $47/mo — entry level brand building
- Structure $97/mo — featured/recommended tier
- House $197/mo — team and automation features
- Estate $397/mo — white-label, client vaults, full platform

## API Pattern
All backend calls go through apiClient (src/lib/apiClient.js).
Never use raw fetch() for internal API calls. Always use apiClient with API_PATHS.

Example:
  import apiClient from '../lib/apiClient';
  import { API_PATHS } from '../lib/apiPaths';
  apiClient.get(API_PATHS.onboarding.progress, { params: { workspace_id } });

## Build and Deploy
  cd /var/www/coretruthhouse-clean
  npm run build
  git add -A
  git commit -m "description"
  git push origin main

Build output goes to dist/. Nginx serves dist/ as the live site.
All 50 protected pages bundle into a single AppRouter-{hash}.js (~1.8MB).
Static route HTML injection runs post-build via scripts/inject-static-route-metadata.mjs.

## Known Architecture Notes
- Two TenantDataDashboard versions exist (V1 + V2) — do not delete either until confirmed
- vite.config.ts is the active config (has API proxy for local dev)
- vite.config.js is excluded from git (duplicate, no proxy config)
- public/sw.js is an intentional cache kill-switch — do not modify
- Rollback comes from git — NEVER write per-edit `.bak`/`.bak.<timestamp>` siblings beside source files (they accumulate as stale clutter; 160 were swept from the backend tree on 2026-06-17). If a pre-edit local copy is truly needed mid-session, write it to /tmp, not into the source tree. Existing `./backups/` dirs are historical — leave them, don't add to them.
- Any remaining .bak files are stale — safe to ignore, do not edit
- Sidebar hover-expand is implemented in Layout.jsx — test after any Layout changes

## How to Work With Sha (Owner) — Teaching Mode

Sha is a founder, not a developer. Follows plain English well; does not know developer terms. These rules apply to EVERY session in this repo:

### Explain As You Build
- Before every command, say in one sentence what it does and why (plain English).
- When creating or changing a file, say what the file is for in plain English.
- When using an agent or tool, say what job it is doing.
- Define any technical term the first time it appears, then just use it.
- Keep explanations short and practical — teach the 20% Sha will actually reuse, skip the rest.
- The goal is for Sha to learn while Claude builds. Explanations are part of the deliverable, not a courtesy.

### Safety Rails
- Code changes on a branch are safe to make freely.
- ALWAYS stop and ask before: anything touching the live site (coretruthhouse.com), deleting anything, or anything that costs money.
- Warn before any action that is hard to undo.

### Before Building Anything Nontrivial
- Restate the task in your own words.
- Give the plan in 3-5 plain-English steps.
- Flag anything unclear or any decision Sha needs to make — then build.
