---
phase: 01-foundation
plan: "03"
subsystem: app-shells
tags:
  - next.js
  - app-router
  - tailwind-v4
  - msw
  - tanstack-query
  - turborepo

dependency_graph:
  requires:
    - 01-01  # packages/ui, packages/api-client, packages/mocks, packages/hooks
  provides:
    - apps/web Next.js 16 shell (walking skeleton surface for public candidate site)
    - apps/console Next.js 16 shell (walking skeleton surface for internal ops tool)
  affects:
    - 01-04  # BD walking skeleton — depends on apps/console shell

tech_stack:
  added:
    - "Next.js 16 App Router (apps/web + apps/console)"
    - "Geist font via next/font/google (RSC-compatible in server layout)"
    - "@tanstack/react-query QueryClientProvider (console root)"
    - "MSW v2 browser worker + Node server (both apps, env-gated)"
  patterns:
    - "Server layout loads font, delegates to ConsoleProviders client component (avoids RSC font warning)"
    - "MSWProvider useEffect init gated by NEXT_PUBLIC_API_MOCKING === 'enabled'"
    - "apps import CSS tokens via @import, never redefine @theme"
    - "@source directive for Tailwind scanning across package boundary"
    - "Dark-mode-first CSS: console :root = dark values, .light = overrides"
    - "Light-mode-first CSS: web :root inherits light @theme, .dark = overrides"

key_files:
  created:
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/next.config.ts
    - apps/web/app/globals.css
    - apps/web/app/layout.tsx
    - apps/web/app/page.tsx
    - apps/web/app/error.tsx
    - apps/web/app/not-found.tsx
    - apps/web/app/_components/msw-provider.tsx
    - apps/web/instrumentation.ts
    - apps/console/package.json
    - apps/console/tsconfig.json
    - apps/console/next.config.ts
    - apps/console/app/globals.css
    - apps/console/app/layout.tsx
    - apps/console/app/page.tsx
    - apps/console/app/error.tsx
    - apps/console/app/not-found.tsx
    - apps/console/app/_components/msw-provider.tsx
    - apps/console/app/_components/console-providers.tsx
    - apps/console/app/(shell)/layout.tsx
    - apps/console/instrumentation.ts
  modified: []

decisions:
  - "Server layout + ConsoleProviders pattern: apps/console layout.tsx is a server component that loads Geist via next/font/google (RSC-compatible); a separate ConsoleProviders client component owns QueryClientProvider + MSWProvider — avoids font optimization warnings from mixing next/font with use client"
  - "apps/console page.tsx redirects unconditionally to /bd/leads — Phase 1 walking skeleton; Phase 2 will have the BD leads route to land on"
  - "QueryClient created outside ConsoleProviders component to avoid re-creation on re-renders (singleton pattern)"
  - "Both apps use catalog: version references in package.json — no version strings, all pinned in pnpm-workspace.yaml"

metrics:
  duration: "3 minutes"
  completed: "2026-06-13T09:45:06Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 22
  files_modified: 0
---

# Phase 1 Plan 03: Both Next.js 16 App Shells Summary

**One-liner:** Both Next.js 16 app shells scaffolded with App Router, Tailwind v4 token import chain, env-gated MSW, and dark-mode-first console CSS.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | apps/web — Next.js 16 shell with App Router, MSW provider, light-mode-first | 995349c | apps/web/next.config.ts, app/globals.css, app/layout.tsx, app/_components/msw-provider.tsx, instrumentation.ts |
| 2 | apps/console — Next.js 16 shell with QueryClientProvider, dark-mode-first, (shell) route group | 90dd792 | apps/console/next.config.ts, app/globals.css, app/layout.tsx, app/_components/console-providers.tsx, app/(shell)/layout.tsx |

## What Was Built

**apps/web** — public candidate site shell:
- `next.config.ts` with `transpilePackages` for all `@brynzit/*` packages
- `app/globals.css` imports shared tokens from `@brynzit/ui/styles/globals.css`, adds `@source` directive for Tailwind cross-package scanning, light-mode-first `:root` inheriting shared `@theme` tokens, `.dark` override block — no `@theme {}` block defined here
- `app/layout.tsx` — RSC server component loading Geist font via `next/font/google`, wraps `MSWProvider`
- `app/_components/msw-provider.tsx` — browser MSW worker init gated by `NEXT_PUBLIC_API_MOCKING === 'enabled'`
- `instrumentation.ts` — server-side MSW gated by `NEXT_RUNTIME === 'nodejs'` AND `NEXT_PUBLIC_API_MOCKING === 'enabled'`
- `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx` — placeholder + error boundaries with Brynzit copy

**apps/console** — internal ops tool shell:
- `next.config.ts` with same `transpilePackages` list
- `app/globals.css` dark-mode-first — `:root` contains dark values (`--background: oklch(0.145 0 0)`), `--radius: 0.375rem`, `--sidebar: oklch(0.185 0 0)`, `.light` override block — no `@theme {}` block
- `app/layout.tsx` — RSC server component (no `'use client'`), loads Geist via `next/font/google`, exports `metadata`, `<html>` has `class="dark ..."`, delegates to `ConsoleProviders`
- `app/_components/console-providers.tsx` — client component owning `QueryClientProvider` (singleton `QueryClient`) + `MSWProvider`
- `app/_components/msw-provider.tsx` — identical env-gated pattern
- `app/(shell)/layout.tsx` — structural route group placeholder with comment marking Phase 2 sidebar addition; no data fetching
- `app/page.tsx` — redirects to `/bd/leads` (Phase 1 walking skeleton target)
- `app/error.tsx`, `app/not-found.tsx` — error boundaries with Brynzit copy
- `instrumentation.ts` — identical double-guarded MSW server init

## Deviations from Plan

None — plan executed exactly as written.

The ConsoleProviders pattern was explicitly specified in Task 2 (server layout + client providers split) and was implemented exactly as designed. No deviations required.

## Security Posture (Threat Model Compliance)

All T-03-01 mitigations implemented: `NEXT_PUBLIC_API_MOCKING === 'enabled'` guards are in all 4 files (`apps/web/app/_components/msw-provider.tsx`, `apps/console/app/_components/msw-provider.tsx`, `apps/web/instrumentation.ts`, `apps/console/instrumentation.ts`).

T-03-02 (console accessibility): No auth added — v1 trusted-network assumption accepted per plan.

## Known Stubs

- `apps/console/app/page.tsx` redirects to `/bd/leads` — this route does not exist yet (will be built in Plan 04). Until Plan 04 ships, navigating to the console root will produce a 404. This is intentional and documented in the plan.
- `apps/web/app/page.tsx` shows "Brynzit is coming." placeholder — full landing page is a later phase deliverable.
- `apps/console/app/(shell)/layout.tsx` has no sidebar nav — Phase 2 (CUX-01..03) will add it.

## Self-Check: PASSED

All 22 files created and verified:

```
apps/web/package.json                          FOUND
apps/web/tsconfig.json                         FOUND
apps/web/next.config.ts                        FOUND
apps/web/app/globals.css                       FOUND
apps/web/app/layout.tsx                        FOUND
apps/web/app/page.tsx                          FOUND
apps/web/app/error.tsx                         FOUND
apps/web/app/not-found.tsx                     FOUND
apps/web/app/_components/msw-provider.tsx      FOUND
apps/web/instrumentation.ts                    FOUND
apps/console/package.json                      FOUND
apps/console/tsconfig.json                     FOUND
apps/console/next.config.ts                    FOUND
apps/console/app/globals.css                   FOUND
apps/console/app/layout.tsx                    FOUND
apps/console/app/page.tsx                      FOUND
apps/console/app/error.tsx                     FOUND
apps/console/app/not-found.tsx                 FOUND
apps/console/app/_components/msw-provider.tsx  FOUND
apps/console/app/_components/console-providers.tsx  FOUND
apps/console/app/(shell)/layout.tsx            FOUND
apps/console/instrumentation.ts                FOUND
```

Commits verified: `995349c` (Task 1), `90dd792` (Task 2).
