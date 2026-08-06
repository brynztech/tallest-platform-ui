# Brynzit Console Design System

This file is the design contract for `apps/console` only. Shared primitives still live in
`packages/ui`, but console screens should use the density, layout, and interaction rules below
instead of borrowing from the public candidate site.

## Product Surface

The console is an internal operations workspace for recruiters and Brynzit operators. Its UI should
feel calm, fast, and information-dense: closer to Linear or Attio than a marketing dashboard.

Current architecture:

- Shell layout: `apps/console/app/(shell)/layout.tsx`
- Navigation chrome: `apps/console/app/(shell)/_components/top-nav.tsx` and
  `apps/console/app/(shell)/_components/sidebar-nav.tsx`
- Console theme overrides: `apps/console/app/globals.css`
- Shared component primitives and base tokens: `packages/ui/src/components/ui` and
  `packages/ui/src/styles/theme.css`

## Theme

The console currently forces a light theme in `apps/console/app/layout.tsx`. Use the console token
overrides in `apps/console/app/globals.css` as the source of truth.

- Background: soft blue-gray using `--color-background`, often paired with subtle radial or linear
  gradients for operational workspaces.
- Surface: `--color-card` for cards, lists, panels, sheets, and queue items.
- Border: `--color-border` with opacity modifiers such as `border-border/70` for quiet separation.
- Primary: `--color-primary` for CTAs, active navigation, selected tabs, focus emphasis, and live
  status pills.
- Muted text: `--color-muted-foreground` for descriptions, timestamps, metadata, and secondary nav.
- Radius: use rounded-xl to rounded-[1.5rem] for large cards; use rounded-lg or rounded-xl for nav
  and control affordances.

Avoid introducing console-only hex values. Prefer semantic Tailwind tokens such as `bg-card`,
`text-muted-foreground`, `border-border`, `text-primary`, and `bg-primary/10`.

## Layout

The console shell must be viewport-owned:

- The root shell frame uses `h-screen overflow-hidden`.
- The region below the top nav uses `min-h-0 flex-1 overflow-hidden`.
- The left sidebar uses `h-full overflow-y-auto`.
- Page content scrolls in `main`, not by growing the shell or sidebar.

This prevents long Internal Ops pages from stretching the shell and pushing the bottom sidebar group
down the page.

Page templates:

- Queue pages: sticky toolbar at the top of `main`, then a constrained list column.
- Detail pages: two-column or sheet-based layouts with the primary record visible first.
- Admin pages: tabbed panels with clear empty, loading, and error states.

## Navigation

Top nav is global context. Sidebar is the operational map.

- Keep the sidebar width fixed at `w-56`.
- Use active state `bg-primary/10 text-primary font-medium`.
- Keep sidebar links a stable height so active states never move neighboring items.
- Internal Ops is a docked group at the bottom of the sidebar when there is spare vertical room.
- If the sidebar content exceeds the viewport, the sidebar scrolls internally.

Do not make the whole document scroll just to expose sidebar items.

## Typography

Use Geist through `--font-sans`.

- Page titles: `text-2xl font-semibold tracking-[-0.045em]`
- Section titles: `text-lg` or `text-xl` with `font-semibold`
- Body: `text-sm leading-6`
- Metadata: `text-xs` or `text-sm text-muted-foreground`
- Navigation labels: `text-sm`; compact Internal Ops links may use `text-xs`

Use tight tracking for dashboard and queue headings, but keep record metadata plain and readable.

## Components

Use `@brynzit/ui` primitives first. Compose locally only when a workflow needs console-specific
behavior.

- Buttons: primary for one clear next action, outline or ghost styles for secondary actions.
- Cards: use `bg-card` or translucent `bg-card/55`, `border-border/60`, and subtle shadows.
- Pills and badges: use rounded-full with tokenized backgrounds, usually `bg-primary/10`.
- Forms: `react-hook-form` plus Zod for validation; keep labels explicit and errors close to fields.
- Tables and queues: prioritize scannability, keyboard focus, and stable row/card heights.
- Sheets/dialogs: for review workflows that need context without page navigation.

## Interaction

Console workflows should optimize for fast human gates:

- Support keyboard-first queues where practical.
- Keep sticky toolbars inside scrollable `main` regions.
- Show optimistic progress for approve/reject/snooze style actions.
- Avoid layout shift on selection, active nav, hover, loading, and empty states.
- Prefer polling/status patterns for async backend work instead of blocking spinners.

## Visual QA Checklist

Before shipping console UI changes, check:

- Selecting any sidebar item does not move the sidebar groups.
- Long pages scroll in `main` while the top nav and sidebar remain stable.
- Active, hover, focus, and disabled states are visibly distinct.
- The page still reads well at the current desktop viewport width used by the internal team.
- Public-site styling has not leaked into console screens.
