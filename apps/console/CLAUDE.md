# Brynzit Console — Claude Guide

Scoped to `apps/console` only. The root `../../CLAUDE.md` (prompt contract,
docs-maintenance rule, ponytail) still applies everywhere in this repo,
including here — this file adds console-specific facts on top, it doesn't
replace anything above it.

## What this app is

The internal ops tool for a 2-4 person recruiting team. One Next.js app, one
route group `(shell)`, four operational sections (BD, Ops, Supply, Admin) plus
a recruiter-portal surface (submit, pipeline, my-roles, matchmaker, etc.).

Real staff auth now exists (`/signin`, `/admin/signin`, admin-managed
username/password, real session gate on every `(shell)` route) — see
`docs/console-staff-auth.md`. It runs *alongside*, not instead of, the
identity switcher (top-right; `@brynzit/identity`'s `SEED_USERS`,
`localStorage`-persisted): the switcher still drives every existing
capability gate (nav visibility, `/admin`), independent of who is really
signed in. See `docs/console-admin-and-rbac.md` §6 for the current split.

Design direction: dense, keyboard-friendly queues for review screens
(Linear/Attio feel), richer card layouts for detail views. Light theme only —
`app/layout.tsx` forces `forcedTheme="light"`; do not add `dark:` variants
here.

## Before touching UI here

Read `design-system/tokens.json`, `design-system/components.md`, and
`design-system/routes.md` first — they're the extracted-from-code reference
for colors, component conventions, and the full route/capability inventory.
Also read `DESIGN_SYSTEM.md` (layout/nav/typography contract) and
`docs/console-admin-and-rbac.md` (RBAC mechanics + two prior production
incidents worth not repeating).

**Status colors are not tokenized yet** — three literal `oklch()` values
(green/amber/red) are copy-pasted across ~12 files. Reuse the exact values in
`tokens.json`'s `status_colors` for any new status/category badge; don't
invent a fourth color for the same meaning.

**The approve/reject/snooze pattern already exists** (BD lead review) and is
the direct precedent for any new candidate-categorization or snooze-duration
feature — see `design-system/components.md`'s last section before designing
a new one from scratch.

## Hard-won gotchas (do not rediscover by bisection)

1. **TanStack Table `data` must be a stable reference.** An unstable fallback
   (`data = []` inline, or a `.filter()` recomputed every render) causes an
   infinite re-render loop that has frozen the entire browser tab in
   production (Events tab, `docs/console-admin-and-rbac.md` §3.2). Use a
   module-level empty-array constant + `useMemo` for derived arrays.
2. **`router.push` with only a query-string change can be elided as a no-op**
   on a statically prerendered route, so `useSearchParams()` never updates
   after a hard refresh (Admin tabs, same doc, §3.1). Use local `useState`
   synced from the URL via effect, update the URL with
   `window.history.pushState`, not `router.push`, when this pattern applies.
3. **New `.tsx` test files with JSX fail to transform under this app's
   Vitest** (tsconfig `jsx: "preserve"` interaction, still unresolved — see
   §5 of the same doc). Workaround: write pure-logic tests as `.ts` with
   `React.createElement`, or use Playwright for anything that must render.
4. **RBAC:** `app/(shell)/_lib/route-capabilities.ts` is the *only* place a
   route's required capability should be declared — both the sidebar and
   every gated section's `layout.tsx` read it. Never hardcode a capability
   check anywhere else; that's exactly the drift that let `/admin` be
   reachable by direct URL despite being hidden from nav, before this file
   existed.
5. **CSV/resume multipart uploads use native `fetch`, never `apiClient.POST`**
   — the browser needs to set its own multipart boundary.
6. **Cross-domain reads are one-way**: `ops/` may import from `supply/`
   (matching reads `TalentPool`), `supply/` never imports from `ops/`.

## Testing

`vitest` for unit/logic tests (`src/__tests__/`), Playwright for anything
needing a real render or multi-page flow (`e2e/`). Run the console app's
suite with `pnpm --filter @brynzit/console exec vitest run` and typecheck
with `pnpm --filter @brynzit/console exec tsc --noEmit` before considering
any console change done — both are fast (seconds) and this repo's CLAUDE.md
docs-maintenance rule expects them clean.
