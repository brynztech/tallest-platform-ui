# Console Component Conventions

Extracted from `packages/ui/src/components/ui/*` (shared shadcn "new-york" primitives)
and how `apps/console` actually composes them. Pair with `tokens.json` for the
literal color/spacing/radius values referenced below.

## Primitives available (packages/ui/src/components/ui)

`avatar, badge, button, card, checkbox, command, dialog, dropdown-menu, form,
input, label, popover, progress, scroll-area, select, separator, sheet,
skeleton, sonner (toast), table, tabs, textarea`

Console screens should reach for these first; only build a local component
when a workflow needs console-specific behavior (per `DESIGN_SYSTEM.md`).

## Button

`buttonVariants` (cva): `variant` = default | destructive | outline | secondary
| ghost | link. `size` = default | xs | sm | lg | icon | icon-xs | icon-sm |
icon-lg. Console convention: `default` for the one clear next action per
screen, `outline`/`ghost` for secondary actions, `sm` size in dense
toolbars/cards, `xs`/`icon-xs` in compact table rows.

## Badge

`badgeVariants` (cva): `variant` = default | secondary | destructive | outline
| ghost | link. Always `rounded-full`, `text-xs`. Console overwhelmingly uses
`secondary` for neutral status pills and `outline` for de-emphasized/rejected
states, with a one-off `className` for anything needing a specific status
color (see "Status colors" below) since there is no dedicated
success/warning badge variant yet.

## Card

Base: `rounded-xl border bg-card py-6 shadow-sm` with `CardHeader` /
`CardTitle` / `CardDescription` / `CardAction` / `CardContent` / `CardFooter`
sub-slots, each just padding/grid conventions (`px-6`). Console also uses
`bg-card/55` (translucent) for less prominent detail-view cards per
`DESIGN_SYSTEM.md`.

## Table

Composed from `Table / TableHeader / TableBody / TableRow / TableHead /
TableCell / TableFooter / TableCaption` — thin styled wrappers around native
`<table>` elements (`TableRow` adds `hover:bg-muted/50` and a
`data-[state=selected]:bg-muted` selected style; `TableHead`/`TableCell`
handle checkbox-column alignment). Every real table in the console
(`shortlist-table.tsx`, `admin-events-tab.tsx`) is driven by
**TanStack Table v8** on top of these primitives, not raw JSX loops.

**Known pitfall (already bit the Events tab in production — see
`docs/console-admin-and-rbac.md` §3.2):** `useReactTable`'s `data` prop MUST
be a stable reference across renders. A `useQuery` fallback of `data = []` or
an inline `.filter()` reallocates a new array every render and can freeze the
entire tab (infinite re-render loop starving the event loop). Always use a
module-level constant empty array as the query fallback, and wrap any
filtered/derived array in `useMemo`.

## Sheet

Radix `Dialog` under the hood, used as the console's slide-over pattern for
detail views that need context without full navigation (lead detail,
candidate profile, placement form). Console convention: `side="right"`,
explicit width (`w-[560px] max-w-[90vw]`), sticky header with a close button,
and always render a real `SheetTitle` even in a loading state — a missing
`DialogTitle` is a real Radix accessibility warning that has shipped to
production here before.

## Status colors (de facto, not tokenized — see `tokens.json`'s `status_colors`)

There is no `--color-success` / `--color-warning` token today. Every
success/warning/error status color in the console is a literal inline
`oklch(...)` value, duplicated across ~12 files:

- Success/green `oklch(0.45 0.15 145)` — placed, verified, high match score
  (≥75), "clear" relationship guard
- Warning/amber `oklch(0.65 0.16 70)` (or Tailwind `amber-500`/`amber-600`) —
  mid match score (50–74), interview-scheduled, "warn" relationship guard
- Error/red `oklch(0.58 0.2 25)` — low match score (<50); note this is a
  *different* red from `--color-destructive`
  (`oklch(0.577 0.245 27.325)`) despite the visual similarity

**Before adding new status colors for the candidate-categorization feature
(Interested / Not Interested / Rejected / No Response / Snoozed), reuse these
three exact values** rather than inventing new ones, and consider promoting
them to real `@theme` tokens in `packages/ui/src/styles/theme.css` at that
point so future status UI has one source instead of a 13th copy-paste.

## Existing approve/reject/snooze action pattern (direct precedent)

BD lead review (`app/(shell)/bd/leads/`) already implements almost exactly
the categorization + snooze shape being planned for candidate shortlists:

- A lead has an `action` of `approve | reject | snooze | move_to_review`,
  handled through one `handleAction()` mutation (`page.tsx`).
- **Snooze** opens a `SnoozePopover` (`_components/snooze-popover.tsx`) with
  three presets — **week / month / quarter** — each computing a `due_at` ISO
  timestamp client-side, plus a custom-date fallback input. The chosen
  `due_at` is sent as `{ due_at: dueAt }` on the mutation body.
- Bulk variants of the same actions exist via `bulk-toolbar.tsx`.
- Keyboard shortcuts: `J/K` navigate, `A` approve, `R` reject, `S` opens
  snooze, `?` shows the shortcut overlay — disabled whenever a
  Sheet/Dialog/Popover is open.

This is the pattern to extend (preset durations → 3/6/9 months instead of
week/month/quarter; add Interested/Not Interested/No-Response as additional
`action` values) rather than building a parallel status system for the
supply-side candidate shortlist.

## Labels in fixed-width surfaces (docked panel, sidebar, narrow cards)

One line, always. These surfaces have a known width, so a wrapped label is a
label written too long rather than a layout problem to solve.

- Budget at `text-sm`: **~18 characters** for a card in the 400px docked
  assistant panel laid out two across (~156px of text per card).
- Authored labels: shorten the label, not the layout. Keep the long form in
  whatever the label triggers — `_lib/starters.ts` splits exactly this way,
  with a short `title` shown on the card and a full `prompt` that gets sent.
- Data-supplied labels (chat titles, candidate names, client names): apply
  `truncate`. Clipping is predictable; reflow moves everything under it.
- Watch out: inside a Radix `ScrollArea`, `truncate` silently does nothing —
  the viewport wraps children in a `display: table` div that sizes to content.
  Force it back with `[&_[data-slot=scroll-area-viewport]>div]:!block`.

Enforced for the assistant's starter cards by
`src/__tests__/assistant.test.ts`, so an over-long label fails the suite rather
than quietly wrapping in one surface.
