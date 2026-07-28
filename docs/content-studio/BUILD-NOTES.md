# Content Studio Approval Build

## Scope

This branch replaces the existing Content Studio page with the approved full-width Content Studio module using the shared authenticated `AuthShell` from PR #8.

## Included surfaces

- Content Studio home
- AI Content Composer
- Image Generator
- Media Library
- Large Image Review modal
- Image Edit Request
- Storyboard Builder
- Upload Media
- Core Truth House official Agents
- Agent Detail
- Estate-only Custom Agent Builder
- Automations dashboard
- Estate-only Automation Builder
- Seven-day Agents and Automations trial state

## Navigation decision

The current application registry exposes `/content-studio` as one protected route. Inner Content Studio surfaces use the `view` query parameter so this branch does not alter the central route registry during the visual approval stage.

Examples:

- `/content-studio?view=composer`
- `/content-studio?view=images`
- `/content-studio?view=agents`
- `/content-studio?view=automations`

## Current limitations

This is a frontend approval build. Composer generation, image generation, uploads, agent execution, automation execution, persistence, billing entitlement, and trial enforcement still require backend services.

Estate and add-on access must be enforced on the server before production release. Frontend gates alone are not sufficient.
