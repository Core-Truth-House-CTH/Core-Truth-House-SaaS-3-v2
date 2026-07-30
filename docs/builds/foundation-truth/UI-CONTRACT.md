# Foundation UI Contract

## Shell

Foundation renders inside the existing authenticated Command Workspace shell.

Required shared elements:

- sticky dark top bar
- Core Truth House seal and wordmark
- Command Center, Workspace, Reports, Signal OS, and Knowledge Base navigation
- search
- notifications
- Ask the House
- account controls
- active workspace context
- full-width ivory content frame with responsive gutters

## Navigation

- No global sidebar.
- No inner-page sidebar.
- Use a horizontal Foundation stepper for the eight Foundation routes.
- The stepper scrolls horizontally on small screens.
- Global navigation remains owned by the Command Workspace shell.
- Foundation local navigation must not recreate global destinations.

## Visual language

Use the existing Core Truth House system:

- Crimson `#AF0024`
- Deep Royal Purple `#33033C`
- Deep Purple-Black `#0D0010`
- Rich Gold `#C4A95B`
- Cinnabar `#E04E35`
- Ivory `#F8F1EC`
- Blush `#EFE3DF`
- Panel `#FFFAF5`
- Cormorant Garamond or approved display serif
- DM Sans or approved system sans for body text

Use shared tokens and primitives. Do not create page-local substitutes for existing colors, typography, spacing, buttons, inputs, dialogs, alerts, or cards.

## Foundation Home hierarchy

The approved experience includes:

1. title and clear purpose
2. Foundation readiness and status
3. current version and approval state
4. primary audience and brand promise
5. conflicts, incomplete sections, and next best move
6. seven local workflow sections after Foundation Home
7. Foundation blueprint preview
8. approval and lock context

## Inner pages

Each inner page uses:

- breadcrumb or route context inside the content frame
- horizontal stepper
- section title and purpose
- clear completion state
- shared save behavior
- validation and conflict feedback
- last-updated and version context where relevant
- responsive card layout

## Product separation

- Diagnostic Insight links to Brand Audit evidence. It does not run a second audit.
- Brand Expression links to Identity Studio. It does not recreate asset management.
- Foundation may show activation status for downstream products. It does not embed their full interfaces.

## Responsive behavior

Verify at minimum:

- 1440 px desktop
- 1024 px tablet landscape
- 768 px tablet portrait
- 390 px mobile

No supported width may introduce a global sidebar, hidden critical action, clipped dialog, inaccessible step, or horizontal page overflow.

## Approved-reference rule

When an approved image differs from an implementation preference, preserve the approved information hierarchy and system flow first. Decorative interpretation may change only when it does not alter product meaning, navigation, ownership, or state behavior.
