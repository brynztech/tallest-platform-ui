---
phase: 01-foundation
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 46
files_reviewed_list:
  - apps/console/app/(shell)/bd/leads/page.tsx
  - apps/console/app/(shell)/layout.tsx
  - apps/console/app/_components/console-providers.tsx
  - apps/console/app/_components/msw-provider.tsx
  - apps/console/app/error.tsx
  - apps/console/app/globals.css
  - apps/console/app/layout.tsx
  - apps/console/app/not-found.tsx
  - apps/console/app/page.tsx
  - apps/console/instrumentation.ts
  - apps/console/next.config.ts
  - apps/web/app/_components/msw-provider.tsx
  - apps/web/app/error.tsx
  - apps/web/app/globals.css
  - apps/web/app/layout.tsx
  - apps/web/app/not-found.tsx
  - apps/web/app/page.tsx
  - apps/web/instrumentation.ts
  - apps/web/next.config.ts
  - packages/api-client/src/client.ts
  - packages/api-client/src/smoke-test.ts
  - packages/api-client/src/__tests__/smoke-domains.test.ts
  - packages/api-client/vitest.config.ts
  - packages/hooks/src/use-async-job.ts
  - packages/hooks/src/__tests__/use-async-job.test.ts
  - packages/hooks/vitest.config.ts
  - packages/mocks/src/browser.ts
  - packages/mocks/src/node.ts
  - packages/mocks/src/index.ts
  - packages/mocks/src/handlers/bd.ts
  - packages/mocks/src/handlers/candidate.ts
  - packages/mocks/src/handlers/monitoring.ts
  - packages/mocks/src/handlers/ops.ts
  - packages/mocks/src/handlers/supply.ts
  - packages/ui/src/styles/globals.css
  - packages/ui/src/lib/utils.ts
  - packages/ui/src/components/ui/avatar.tsx
  - packages/ui/src/components/ui/badge.tsx
  - packages/ui/src/components/ui/button.tsx
  - packages/ui/src/components/ui/card.tsx
  - packages/ui/src/components/ui/input.tsx
  - packages/ui/src/components/ui/label.tsx
  - packages/ui/src/components/ui/separator.tsx
  - packages/ui/src/components/ui/skeleton.tsx
  - packages/ui/src/components/ui/sonner.tsx
  - turbo.json
  - packages/config/tsconfig/base.json
  - packages/config/tsconfig/nextjs.json
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 46
**Status:** issues_found

## Summary

Phase 1 foundation delivers a clean walking skeleton: two Next.js 16 App Router apps sharing workspace packages, a typed openapi-fetch client, MSW mocking split across browser and node, a polling `useAsyncJob` hook, and a shadcn/ui component library. The architecture decisions are sound and match the CLAUDE.md stack constraints.

Three issues require attention before later phases build on this foundation. One is a definite TypeScript compile error (`skeleton.tsx` missing React import). Four warnings cover a blank-flash UX regression in `apps/web`, an incorrectly-resolved `@source` Tailwind directive in both apps, a missing `QueryClientProvider` in `apps/web`, and an unhandled MSW worker init failure. Three info items cover test coverage gaps, debug `console.error` calls in the public app, and `console.info` in a test file.

---

## Critical Issues

### CR-01: `skeleton.tsx` missing React import causes TypeScript compile error

**File:** `packages/ui/src/components/ui/skeleton.tsx:3`
**Issue:** `React.ComponentProps<"div">` references the `React` namespace, but the file has no `import * as React from "react"`. The library tsconfig uses `"jsx": "react-jsx"`, which auto-imports the JSX runtime for JSX syntax but does NOT put the `React` namespace into scope for type references. Every other component in the same directory (`avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `separator.tsx`) correctly imports React. This will produce `Cannot find name 'React'` at `tsc --noEmit` time and will fail `turbo run typecheck`.

**Fix:**
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
```

---

## Warnings

### WR-01: MSWProvider blocks all rendering even when mocking is disabled

**File:** `apps/web/app/_components/msw-provider.tsx:19` (same pattern in `apps/console/app/_components/msw-provider.tsx:19`)
**Issue:** `MSWProvider` returns `null` until its `useEffect` fires and sets `ready = true`. Because `useEffect` does not run during SSR and does not run synchronously on first client paint, `apps/web`'s entire layout tree (wrapped in `<MSWProvider>`) renders as blank HTML on the initial client paint — even in production where `NEXT_PUBLIC_API_MOCKING` is never `'enabled'`. For `apps/web` (the public candidate site), this is a visible blank flash on every page load. For `apps/console` this matters less, but the same code is used.

The guard should only gate rendering when mocking is actually being initialised; when `NEXT_PUBLIC_API_MOCKING !== 'enabled'` the children can be rendered immediately.

**Fix:**
```tsx
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled', // immediately ready when not mocking
  )

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
      import('@brynzit/mocks/browser').then(({ worker }) =>
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => setReady(true)),
      )
    }
  }, [])

  if (!ready) return null
  return <>{children}</>
}
```

---

### WR-02: `@source` path in both apps resolves to a non-existent directory

**File:** `apps/console/app/globals.css:2` (same in `apps/web/app/globals.css:2`)
**Issue:** In Tailwind v4 the `@source` directive resolves globs **relative to the CSS file**. The CSS file lives at `apps/console/app/globals.css`; the path `../../packages/ui/src/**/*.{ts,tsx}` therefore resolves to `apps/packages/ui/src/` — which does not exist. The correct relative path from that CSS file up to the monorepo root requires three `../` steps:

```
apps/console/app/ → apps/console/ → apps/ → <monorepo root> → packages/
```

Tailwind v4's automatic content detection may still scan workspace packages through its own project-root heuristics, so the bug may be invisible during `dev`. However the explicit `@source` hint is currently a dead no-op, and if Tailwind's auto-detection ever misses the transpiled packages directory the entire shadcn/ui component class set will be pruned silently from production bundles.

**Fix (both files):**
```css
/* apps/console/app/globals.css */
@source '../../../packages/ui/src/**/*.{ts,tsx}';

/* apps/web/app/globals.css */
@source '../../../packages/ui/src/**/*.{ts,tsx}';
```

---

### WR-03: `apps/web` has no `QueryClientProvider` — `useQuery` will throw if ever called

**File:** `apps/web/app/layout.tsx:21`
**Issue:** `apps/web` wraps its layout tree only in `<MSWProvider>`. There is no `QueryClientProvider`. Any component in `apps/web` that calls `useQuery`, `useMutation`, or any TanStack Query hook will throw `"No QueryClient set, use QueryClientProvider to set one"` at runtime. Phase 1's web page does not use queries, but the web app is the candidate-facing public site and will need TanStack Query from Phase 2 onward. Omitting the provider now means this failure will surface at the worst time — mid-feature.

`apps/console` has the correct pattern in `ConsoleProviders`: `QueryClientProvider` wraps children alongside `MSWProvider`.

**Fix:** Add a web-specific providers component analogous to `ConsoleProviders`:
```tsx
// apps/web/app/_components/web-providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MSWProvider } from './msw-provider'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30 * 1000, retry: 1 } },
})

export function WebProviders({ children }: { children: React.ReactNode }) {
  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MSWProvider>
  )
}
```
Then in `apps/web/app/layout.tsx` replace `<MSWProvider>` with `<WebProviders>`.

---

### WR-04: MSW worker init errors are silently swallowed — app hangs at blank screen

**File:** `apps/console/app/_components/msw-provider.tsx:8-17` (same in `apps/web/app/_components/msw-provider.tsx:8-17`)
**Issue:** The `init()` async function inside `useEffect` has no `try/catch`. If `worker.start()` rejects (e.g. Service Worker registration fails, CSP blocks it, HTTPS mismatch), the promise rejection is unhandled, `setReady(true)` is never called, and the entire app remains permanently blank with no user-visible error and no developer console message beyond the unhandled rejection. This is a silent hang that is hard to diagnose in staging.

**Fix:**
```tsx
useEffect(() => {
  async function init() {
    try {
      if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
        const { worker } = await import('@brynzit/mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' })
      }
    } catch (err) {
      console.error('[MSWProvider] Failed to start mock service worker:', err)
    } finally {
      setReady(true)
    }
  }
  init()
}, [])
```

---

## Info

### IN-01: `useAsyncJob` uses bare `fetch()` bypassing the typed `apiClient`

**File:** `packages/hooks/src/use-async-job.ts:97-99`
**Issue:** The polling `queryFn` calls `fetch(url)` directly rather than going through `apiClient` from `@brynzit/api-client`. The response is cast with `res.json() as Promise<TData>` — an unsafe cast that will not throw if the actual response shape diverges from `TData`. This also means poll requests bypass any future middleware, request interceptors, or auth headers that might be added to `apiClient`. The `TData` generic provides compile-time type annotation but zero runtime validation.

This is acceptable for Phase 1 given the "no auth in v1 console" constraint and the mock-first approach, but should be tracked as a known gap before any production polling is wired to real authenticated endpoints.

**Suggested future fix:** Accept a `queryFn` override in `UseAsyncJobOptions` so callers can pass a typed `apiClient.GET(...)` call, keeping the polling interval logic in the hook while the caller owns the fetch.

---

### IN-02: Smoke test global `testTimeout: 10000` conflicts with per-test 30s override documentation

**File:** `packages/api-client/vitest.config.ts:7` and `packages/api-client/src/__tests__/smoke-domains.test.ts:61`
**Issue:** The vitest config sets `testTimeout: 10000` (10 s). The Supply domain test explicitly passes `30000` as the third argument to `it()` specifically because Qdrant semantic search can take up to 15 s. Vitest's per-test timeout argument does override the global `testTimeout`, so this works today. However, the config comment says `"10s per test — live network calls"` without acknowledging the one test that overrides it, which is misleading for future maintainers who might reduce the global timeout expecting it to apply uniformly.

**Fix:** Either increase the global timeout to match the documented ceiling or add a comment in the config:
```ts
testTimeout: 10000, // default; Supply search test overrides to 30s (see smoke-domains.test.ts)
```

---

### IN-03: `console.error` in public-facing `error.tsx` and `console.info` in smoke test `beforeAll`

**File:** `apps/web/app/error.tsx:13`, `apps/console/app/error.tsx:13`, `packages/api-client/src/__tests__/smoke-domains.test.ts:30-31`
**Issue:** Both `error.tsx` files call `console.error(error)` in a `useEffect`. For `apps/console` (internal tool) this is intentional. For `apps/web` (public candidate site) it logs potentially internal error details (stack traces, digests) to the browser console where any user can inspect them. The `smoke-domains.test.ts` `console.info` calls are fine for a deliberately run integration test suite but will clutter CI output if the test file is ever included in default test runs.

**Fix for `apps/web/app/error.tsx`:** Log only non-sensitive fields (e.g. `error.digest`) rather than the full `Error` object, or gate behind `process.env.NODE_ENV !== 'production'`. For the smoke test, the `console.info` calls are acceptable given the file explicitly documents it must be run manually with `BACKEND_URL` set.

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
