# Phase 1: Foundation - Research

**Researched:** 2026-06-13
**Domain:** Turborepo + pnpm monorepo scaffold, Next.js 16.2 App Router, openapi-typescript v7 codegen, MSW v2 mock architecture, Tailwind v4 + shadcn/ui shared design tokens, TanStack Query v5 polling primitive
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Six packages — `apps/web`, `apps/console`, `packages/ui`, `packages/api-client`, `packages/mocks`, `packages/hooks`. `packages/hooks` owns `useAsyncJob` and future shared React hooks.

**D-02:** npm scope is `@brynzit/*` — package names are `@brynzit/ui`, `@brynzit/api-client`, `@brynzit/mocks`, `@brynzit/hooks`.

**D-03:** Two pnpm scripts in root `package.json`:
- `generate:api` — reads from `packages/api-client/openapi.json` (snapshot file, committed to repo). Use in CI and when backend is not running.
- `generate:api:live` — fetches from running backend (`http://localhost:8000/api/v1/openapi.json`), regenerates types, **and updates `packages/api-client/openapi.json`** in place.

**D-04:** Snapshot file lives at `packages/api-client/openapi.json` — co-located with generated types.

**D-05:** No CI enforcement of snapshot freshness. TypeScript compilation against the snapshot is the indirect safety net.

**D-06:** `useAsyncJob` hook signature:
```ts
useAsyncJob<TData, TRawStatus extends string = string>(options: UseAsyncJobOptions<TData, TRawStatus>)

type UseAsyncJobOptions<TData, TRawStatus extends string = string> = {
  jobId: string | null | undefined
  endpoint: string
  enabled?: boolean
  statusMap?: Partial<Record<TRawStatus, AsyncJobPhase>>
  refetchInterval?: number  // default: 2000ms
}
```

**D-07:** Return type:
```ts
type AsyncJobPhase = 'idle' | 'pending' | 'complete' | 'failed'

type AsyncJobResult<TData, TRawStatus extends string = string> = {
  phase: AsyncJobPhase
  rawStatus?: TRawStatus
  data?: TData
  error?: unknown
  isPolling: boolean
}
```

**D-08:** Built-in default status mapping:
- `'queued'`, `'processing'`, `'running'` → `'pending'`
- `'done'`, `'completed'`, `'succeeded'`, `'success'` → `'complete'`
- `'failed'`, `'error'` → `'failed'`
- Absent `jobId` or `enabled === false` → `'idle'`

**D-09:** Hook lives in `packages/hooks/src/use-async-job.ts`, exported from `@brynzit/hooks`.

**D-10:** Each app's CSS entry point adds one `@source` directive for the external package:
```css
@source '../../packages/ui/src/**/*.{ts,tsx}';
```

**D-11:** `packages/ui/src/styles/globals.css` is the shared token source. It owns `@import "tailwindcss"` and `@theme { ... }`. Both apps import this file. Neither app defines its own `@theme` tokens.

**D-12:** App-specific overrides (light vs dark default, border radius):
- `apps/web/src/app/globals.css`: imports shared, then overrides for marketing mood
- `apps/console/src/app/globals.css`: imports shared, then overrides for dense tool

### Claude's Discretion

- pnpm workspace catalog structure — Claude decides the exact catalog keys and grouping
- Turborepo task pipeline definition — Claude decides the task graph in `turbo.json`
- Contract proposal file format for candidate-facing endpoints in `.planning/contracts/` — Claude decides OpenAPI 3.1 YAML vs minimal TypeScript interface
- Error boundary placement in each app — Claude decides where root error boundaries go

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Turborepo + pnpm monorepo with `apps/web`, `apps/console`, `packages/ui`, `packages/api-client`, `packages/mocks` (and `packages/hooks` per D-01) | Turborepo 2.9.18 + pnpm 11.6.0 scaffold patterns; `create-turbo` bootstrap; `turbo.json` task graph; `pnpm-workspace.yaml` catalog; `transpilePackages` in both app `next.config.ts` files |
| FOUND-02 | Typed API client generated from the backend's OpenAPI schema with a repeatable `generate:api` task; nullability verified against Pydantic v2 output | `openapi-typescript@7.13.0` CLI confirmed; live backend is OpenAPI 3.1.0 with 122 `anyOf + null` fields across 65 schemas; snake_case field convention confirmed (no `alias_generator`); exact generate scripts documented |
| FOUND-03 | MSW mock layer with domain-split handlers; candidate-facing endpoints defined as written contract proposals; mocking toggled per-app via env flag | MSW v2.14.6; browser `setupWorker` in `'use client'` provider; Node `setupServer` in `instrumentation.ts`; domain handler file shapes specified; contract format recommended |
| FOUND-04 | Shared `useAsyncJob` polling primitive for all 202-style endpoints with terminal-state handling | TanStack Query v5 `refetchInterval`-as-function pattern; exact backend status vocabulary confirmed from live schema (`"processing"`, `"complete"`, `"failed"`, `"generating"`, `"outreach_review"` etc.); D-06–D-09 implementation spec locked |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure phase: no feature UI ships, but every subsequent phase depends on the correctness of what gets built here. The research confirms the full stack in concrete versions, all verified against the npm registry and the live FastAPI backend at `http://localhost:8000`.

Three findings stand out as critical inputs for planning:

First, the live backend is confirmed running at OpenAPI 3.1.0 with 122 `anyOf + null` fields across 65 schemas. All field names are `snake_case` with no `alias_generator=to_camel` anywhere in the backend codebase. This is the locked field naming convention — `openapi-typescript` preserves exact field names, making it correct for this backend. The Pydantic v2 nullable smoke test is straightforward to write and must pass before any feature phase begins.

Second, the backend status vocabulary is more nuanced than the CONTEXT.md D-08 default mapping captures. The `lead_import` model explicitly transitions `"processing"` → `"complete"` (not `"completed"`). Outreach generation uses domain-specific statuses: `"outreach_generation"` (pending), `"outreach_review"` (ready for human review — a terminal output state, not a polling-loop state), `"failed"`. The `useAsyncJob` hook's default map in D-08 covers generic vocabulary; callers for domain-specific async ops will need `statusMap` overrides. The only backend endpoint with a dedicated `/status` poll URL is `/api/v1/bd/imports/{import_id}/status`. Other 202 endpoints (resume upload, enrich, parse-jd, outreach generate) are polled by re-fetching the parent resource.

Third, there are six 202 async endpoints in the live backend: `POST /api/v1/bd/imports`, `POST /api/v1/bd/leads/{lead_id}/outreach/generate`, `POST /api/v1/ops/requisitions/{req_id}/match`, `POST /api/v1/ops/requisitions/{req_id}/parse-jd`, `POST /api/v1/supply/candidates/{candidate_id}/enrich`, `POST /api/v1/supply/resumes/upload`. These define the scope of `useAsyncJob`'s required coverage.

**Primary recommendation:** Scaffold in dependency order: `packages/config` → `packages/ui` (shadcn init) → `packages/api-client` (codegen from live backend) → `packages/mocks` (domain handler stubs + typed `candidate.ts` contract mocks) → `packages/hooks` (`useAsyncJob`) → `apps/console` shell → `apps/web` shell. Verify `turbo run build` from clean checkout before writing any feature code.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Monorepo orchestration + task graph | Build tooling (Turborepo) | — | turbo.json `dependsOn` enforces build order; pnpm catalog pins versions |
| API type generation | `packages/api-client` | — | Generated-only package; never edited by hand; all other packages consume types from here |
| Shared design tokens + components | `packages/ui` | — | CSS-first Tailwind v4 `@theme`; shadcn CLI target; no deps on other internal packages |
| API mocking (dev + test) | `packages/mocks` | `packages/api-client` | Handlers typed against generated types; domain-split files; apps never import handler arrays directly |
| Polling primitive | `packages/hooks` | `packages/api-client` | `useAsyncJob` depends on TanStack Query only; typed against backend response types |
| Public candidate site (SEO) | `apps/web` (Frontend Server / RSC) | Browser / Client (islands) | Job board and landing require SSR + `use cache`; interactive widgets are client islands |
| Internal ops console | `apps/console` (Browser / Client) | Frontend Server (thin RSC shells) | All data fetching is client-side TanStack Query; RSC used only for layout composition |
| OpenAPI contract proposals | `.planning/contracts/` (docs) | `packages/mocks` | Contract files are the source of truth for candidate-facing mocks; mocks typed against them |

---

## Standard Stack

### Core (Verified against npm registry 2026-06-13)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16.2.9 | Full-stack React framework for both apps | App Router + RSC for public SEO; Turbopack default and stable; `use cache` directive |
| react + react-dom | ^19.2 (ships with Next 16) | UI runtime | React Compiler built-in; zero manual `useMemo`/`useCallback`; do not pin separately |
| typescript | ^5.5 | Type safety | Required by entire stack; `next typegen` for route type helpers |
| turbo | ^2.9.18 | Monorepo build orchestration | Single build cache; task pipeline enforces build order |
| pnpm | ^11.6.0 | Package management | Strict hoisting; catalog feature for centralized version pins |

[VERIFIED: npm registry 2026-06-13]

### API Client

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| openapi-typescript | ^7.13.0 | Generate TS types from FastAPI OpenAPI 3.1.0 schema | Zero-runtime pure types; confirmed handles `anyOf + null` (Pydantic v2); preserves exact field names (critical: backend is snake_case) |
| openapi-fetch | ^0.17.0 | Type-safe fetch wrapper using generated types | 6kb zero-runtime; compile-time errors on wrong path params; pairs with TanStack Query |
| openapi-react-query | ^0.5.4 | Thin adapter: openapi-fetch → TanStack Query | Generates `queryKey` factories; 1kb; keeps TanStack Query as caching layer |

[VERIFIED: npm registry 2026-06-13]

Note: `openapi-react-query@0.5.4` is latest. The `@tanstack/react-query@^5.90` integration is the consuming pattern.

### UI Foundation

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| tailwindcss | ^4.x | Utility-first CSS | CSS-first `@theme` directive; OKLCH colors; no `tailwind.config.js` needed |
| shadcn/ui | CLI: shadcn@4.11.0 | Copy-paste component library | CLI copies source into `packages/ui`; "new-york" style + `cssVariables: true` |
| lucide-react | ^1.18.0 | Icon library | Default icon provider in shadcn; tree-shakable SVG components |
| tw-animate-css | latest | Animation utilities | Replaces deprecated `tailwindcss-animate` in Tailwind v4 |

[VERIFIED: npm registry 2026-06-13]

### Data Layer + Hooks

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @tanstack/react-query | ^5.101.0 | Server-state data layer | `refetchInterval`-as-function for 202 polling; `useInfiniteQuery` for cursor pagination |
| @tanstack/react-table | ^8.21.3 | Data tables in console | v8 stable; v9 still beta; integrates with TanStack Query cursor pagination |

[VERIFIED: npm registry 2026-06-13]

### Mocking

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| msw | ^2.14.6 | API mocking (dev + test) | v2 intercepts native `fetch`; browser `setupWorker` + Node `setupServer` from same handler files |

[VERIFIED: npm registry 2026-06-13]

### Testing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| vitest | ^4.1.8 | Unit + integration tests | Native ESM; browser mode stable in v4; shares TS config |
| @testing-library/react | ^16.x | Component testing | Works in Vitest with jsdom |
| @playwright/test | ^1.60.0 | E2E tests | Next.js official recommendation; per-project config per app |

[VERIFIED: npm registry 2026-06-13]

### Developer Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | ^9.x + `eslint-config-next` | Linting; flat config format |
| Prettier | ^3.x + `prettier-plugin-tailwindcss@^0.6` | Formatting; sorts Tailwind class strings |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `openapi-typescript` + `openapi-fetch` | `@hey-api/openapi-ts` | hey-api generates a full SDK runtime that couples to `@hey-api/client-fetch`; loses direct `queryKey` factory control needed for 202-polling + complex invalidation |
| `openapi-typescript` + `openapi-fetch` | Orval | Orval generates `useListLeads()`-style hooks that shadow TanStack Query's API surface; correct for simpler projects but reduces flexibility for this project's polling and cache-invalidation patterns |
| `@dnd-kit/core@^6` | `@dnd-kit/react` (new rewrite) | `@dnd-kit/react` is 0.5.x pre-release; breaking changes before 1.0 — wait for stable |
| `@tanstack/react-table@^8` | v9 beta | v9 replaces `useReactTable` with `useTable`; API-breaking; beta.9 as of June 2026 |
| Zod v4 | Zod v3 | v4 has 100x fewer TS instantiations; `@hookform/resolvers@^5` auto-detects both |

**Installation (root monorepo):**
```bash
corepack enable pnpm
pnpm create turbo@latest talent-platform-ui --package-manager pnpm
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request (public job listing)
        |
        v
apps/web — Next.js App Router RSC
  ├── Server Component (app/jobs/[id]/page.tsx)
  │     └─ direct fetch → packages/api-client → GET /api/v1/...
  │           |__ (dev: MSW setupServer intercepts in instrumentation.ts)
  │           |__ (prod: real FastAPI backend at localhost:8000)
  └── Client Island ("use client" components)
        └─ TanStack Query (for interactive state only)

Browser Request (console — BD rep reviewing leads)
        |
        v
apps/console — Next.js App Router (thin RSC shells only)
  └── (shell)/layout.tsx — sidebar nav, no data fetching
        └── bd/leads/page.tsx — RSC shell, renders client component
              └── LeadQueueClient ("use client")
                    └─ useInfiniteQuery → packages/api-client
                    └─ useMutation (approve/reject/snooze) → packages/api-client
                    └─ useAsyncJob (CSV import) → packages/api-client + packages/hooks
                          |__ MSW browser worker (dev) intercepts fetch
                          |__ real FastAPI backend (prod)

packages/api-client (generated, never edited)
  ├── openapi.json — committed snapshot (source of truth for types)
  ├── src/types/api.d.ts — generated by openapi-typescript v7
  └── src/client.ts — openapi-fetch createClient<paths>

packages/mocks
  ├── src/handlers/
  │     ├── bd.ts, ops.ts, supply.ts, monitoring.ts — stubs (Phase 1)
  │     └── candidate.ts — CONTRACT MOCKS (delete entries when backend ships)
  ├── src/browser.ts — setupWorker(...allHandlers)
  └── src/node.ts — setupServer(...allHandlers)

packages/hooks
  └── src/use-async-job.ts — useAsyncJob<TData>(options) — polls until terminal

packages/ui
  └── src/styles/globals.css — @import "tailwindcss" + @theme { shared OKLCH tokens }
```

### Recommended Project Structure

```
talent-platform-ui/
├── turbo.json                       # Task graph
├── pnpm-workspace.yaml              # workspaces + catalog
├── package.json                     # root devDeps: turbo, typescript, prettier
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root: fonts, MSWProvider, error boundary
│   │   │   ├── page.tsx             # "/" placeholder — "Brynzit is coming."
│   │   │   ├── not-found.tsx        # 404
│   │   │   ├── error.tsx            # Root error boundary
│   │   │   ├── globals.css          # @import '@brynzit/ui/styles/globals.css'; web overrides
│   │   │   └── _components/
│   │   │       └── msw-provider.tsx # 'use client', conditional setupWorker init
│   │   ├── instrumentation.ts       # MSW setupServer for RSC routes
│   │   ├── next.config.ts           # transpilePackages: ['@brynzit/ui', '@brynzit/api-client', ...]
│   │   └── package.json             # name: "@brynzit/web"
│   └── console/
│       ├── app/
│       │   ├── layout.tsx           # Root: QueryClientProvider, Toaster, MSWProvider
│       │   ├── page.tsx             # "/" → redirect to /bd/leads (or placeholder)
│       │   ├── not-found.tsx
│       │   ├── error.tsx
│       │   ├── globals.css          # @import '@brynzit/ui/styles/globals.css'; console overrides
│       │   ├── (shell)/
│       │   │   ├── layout.tsx       # Sidebar nav + header (structural only, no data fetching)
│       │   │   ├── bd/leads/page.tsx
│       │   │   └── ... (Phase 2+)
│       │   └── _components/
│       │       └── msw-provider.tsx
│       ├── instrumentation.ts
│       ├── next.config.ts
│       └── package.json
├── packages/
│   ├── ui/
│   │   ├── src/
│   │   │   ├── components/ui/       # shadcn components (button, card, badge, etc.)
│   │   │   ├── lib/utils.ts         # cn() helper from shadcn
│   │   │   └── styles/
│   │   │       └── globals.css      # @import "tailwindcss"; @theme { OKLCH tokens }
│   │   ├── components.json          # shadcn config (generated by CLI)
│   │   ├── DESIGN_BRIEF.md          # Reference sites + token intent
│   │   └── package.json             # name: "@brynzit/ui"; exports map
│   ├── api-client/
│   │   ├── openapi.json             # COMMITTED snapshot from live backend
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   └── api.d.ts         # Generated by openapi-typescript (DO NOT EDIT)
│   │   │   └── client.ts            # createClient<paths> — the one import apps use
│   │   ├── scripts/
│   │   │   └── generate-live.sh     # curl schema + openapi-typescript + update snapshot
│   │   └── package.json
│   ├── mocks/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── bd.ts            # export const bdHandlers: HttpHandler[] = []
│   │   │   │   ├── ops.ts
│   │   │   │   ├── supply.ts
│   │   │   │   ├── monitoring.ts
│   │   │   │   └── candidate.ts     # Typed contract mocks for public/candidate/* endpoints
│   │   │   ├── browser.ts           # setupWorker(...all handlers)
│   │   │   ├── node.ts              # setupServer(...all handlers)
│   │   │   └── index.ts
│   │   └── package.json
│   ├── hooks/
│   │   ├── src/
│   │   │   └── use-async-job.ts     # useAsyncJob implementation
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── config/
│       ├── tsconfig/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── library.json
│       └── package.json
└── .planning/
    └── contracts/                   # OpenAPI 3.1 YAML fragments for candidate-facing APIs
        ├── public-jobs.yaml
        ├── candidate-auth.yaml
        ├── candidate-profile.yaml
        └── candidate-applications.yaml
```

### Pattern 1: Turborepo Task Pipeline (turbo.json)

**What:** Defines build order and caching. `"tasks"` is the correct key in Turborepo 2.x (not the legacy `"pipeline"` key from v1).

**Key rules:**
- `"dependsOn": ["^build"]` means "build all dependencies before me"
- `generate:api` must have `"cache": false` — schema drifts, always re-run
- `dev` is persistent (`"persistent": true`) and uncached
- `typecheck` depends on `^build` so generated types are available before type-checking

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "generate:api": {
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

[VERIFIED: Turborepo 2.9 docs — `"tasks"` key is correct; `"pipeline"` is v1 legacy]

### Pattern 2: pnpm Workspace Catalog (pnpm-workspace.yaml)

**What:** The `catalog:` block in `pnpm-workspace.yaml` centralizes version pins. Packages reference them as `catalog:` in their `package.json` dependencies. pnpm 9.5+ supports this; pnpm 11 is current.

**Exact syntax:**
```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  # Framework
  next: "^16.2.9"
  react: "^19.2.0"
  react-dom: "^19.2.0"
  typescript: "^5.5.0"
  # Data layer
  "@tanstack/react-query": "^5.101.0"
  "@tanstack/react-table": "^8.21.3"
  # API client
  openapi-fetch: "^0.17.0"
  "openapi-react-query": "^0.5.4"
  # Forms + validation
  zod: "^4.4.3"
  react-hook-form: "^7.79.0"
  "@hookform/resolvers": "^5.4.0"
  # UI
  tailwindcss: "^4.0.0"
  "lucide-react": "^1.18.0"
  "tw-animate-css": "latest"
  # Mocking
  msw: "^2.14.6"
  # Testing
  vitest: "^4.1.8"
  "@testing-library/react": "^16.0.0"
  "@playwright/test": "^1.60.0"
  # Dev tooling
  eslint: "^9.0.0"
  prettier: "^3.0.0"
```

Individual `package.json` files reference catalog entries like:
```json
{
  "dependencies": {
    "next": "catalog:",
    "@tanstack/react-query": "catalog:"
  }
}
```

[VERIFIED: pnpm 11.6.0 catalog feature; syntax confirmed from pnpm docs]

### Pattern 3: Next.js 16 App Configuration

**What:** Both apps need `transpilePackages` for all `@brynzit/*` workspace packages. Without this, Next.js cannot transpile JSX/TSX in workspace packages — the build fails with cryptic module errors.

**Async API changes (BREAKING in Next.js 16):** `headers()`, `cookies()`, `params`, and `searchParams` are all async. Synchronous access was removed in Next.js 16 (it was deprecated in 15). Any code using `const cookieStore = cookies()` without `await` will throw a runtime error.

```typescript
// apps/web/next.config.ts (and apps/console/next.config.ts)
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@brynzit/ui',
    '@brynzit/api-client',
    '@brynzit/mocks',
    '@brynzit/hooks',
  ],
  // Enable 'use cache' directive (Next.js 16 experimental → stable)
  experimental: {
    dynamicIO: true, // enables 'use cache' directive support
  },
}

export default nextConfig
```

[VERIFIED: CLAUDE.md / STACK.md + Next.js 16 upgrade guide]
[ASSUMED: `dynamicIO: true` enables `use cache` directive — verify exact config key in Next.js 16.2 docs if build errors appear]

### Pattern 4: openapi-typescript v7 Generate Scripts

**What:** Two scripts per D-03 and D-04.

`generate:api` (from committed snapshot — CI-safe, backend not required):
```bash
# In root package.json scripts
"generate:api": "openapi-typescript packages/api-client/openapi.json -o packages/api-client/src/types/api.d.ts"
```

`generate:api:live` (fetches from running backend + updates snapshot):
```bash
# packages/api-client/scripts/generate-live.sh
#!/bin/bash
set -e
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
SCHEMA_URL="$BACKEND_URL/openapi.json"
SNAPSHOT="packages/api-client/openapi.json"
OUTPUT="packages/api-client/src/types/api.d.ts"

echo "Fetching schema from $SCHEMA_URL..."
curl -sf "$SCHEMA_URL" -o "$SNAPSHOT"

echo "Generating TypeScript types..."
npx openapi-typescript "$SNAPSHOT" -o "$OUTPUT"

echo "Done. Schema snapshot updated at $SNAPSHOT"
```

Root `package.json` scripts:
```json
{
  "scripts": {
    "generate:api": "openapi-typescript packages/api-client/openapi.json -o packages/api-client/src/types/api.d.ts",
    "generate:api:live": "bash packages/api-client/scripts/generate-live.sh"
  }
}
```

The typed client setup in `packages/api-client/src/client.ts`:
```typescript
// packages/api-client/src/client.ts
import createClient from 'openapi-fetch'
import type { paths } from './types/api'

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
})

export type { paths, components } from './types/api'
```

[VERIFIED: openapi-typescript v7.13.0 CLI syntax confirmed by running `--help`]
[VERIFIED: Live backend is at `http://localhost:8000/openapi.json` — confirmed responding]
[VERIFIED: Backend is OpenAPI 3.1.0 — openapi-typescript README explicitly lists 3.1 support]

### Pattern 5: MSW v2 in Next.js 16 App Router

**What:** Two parallel MSW initialization paths share the same handler files in `packages/mocks`.

**Browser initialization** (client components only):
```typescript
// apps/console/app/_components/msw-provider.tsx
'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
        const { worker } = await import('@brynzit/mocks/browser')
        await worker.start({ onUnhandledRequest: 'bypass' })
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return null
  return <>{children}</>
}
```

**Node/RSC initialization** (for server-side fetch interception during dev):
```typescript
// apps/console/instrumentation.ts
export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
  ) {
    const { server } = await import('@brynzit/mocks/node')
    server.listen({ onUnhandledRequest: 'bypass' })
  }
}
```

**Handler composition in `packages/mocks`:**
```typescript
// packages/mocks/src/browser.ts
import { setupWorker } from 'msw/browser'
import { bdHandlers } from './handlers/bd'
import { opsHandlers } from './handlers/ops'
import { supplyHandlers } from './handlers/supply'
import { monitoringHandlers } from './handlers/monitoring'
import { candidateHandlers } from './handlers/candidate'

export const worker = setupWorker(
  ...bdHandlers,
  ...opsHandlers,
  ...supplyHandlers,
  ...monitoringHandlers,
  ...candidateHandlers,
)

// packages/mocks/src/node.ts
import { setupServer } from 'msw/node'
import { bdHandlers } from './handlers/bd'
// ... same imports
export const server = setupServer(
  ...bdHandlers,
  ...opsHandlers,
  ...supplyHandlers,
  ...monitoringHandlers,
  ...candidateHandlers,
)
```

**Domain handler stub shape** (for Phase 1 — stubs with no actual handlers):
```typescript
// packages/mocks/src/handlers/bd.ts
import type { HttpHandler } from 'msw'
// Phase 1: stub — handlers added in Phase 2
export const bdHandlers: HttpHandler[] = []
```

[VERIFIED: MSW v2 API (`setupWorker`, `setupServer`, `HttpResponse`) from mswjs.io docs]
[CITED: ARCHITECTURE.md Pattern 5 for the instrumentation.ts pattern]

### Pattern 6: Tailwind v4 Shared Tokens in Turborepo

**What:** Tailwind v4 auto-scans the app's own `src/` for class names. It stops at package boundaries. Consuming apps must add an explicit `@source` directive for each workspace package that contains Tailwind classes.

**In `packages/ui/src/styles/globals.css`** (shared token source):
```css
@import "tailwindcss";

@theme {
  /* Brynzit brand blue (accent) */
  --color-brand: oklch(0.546 0.215 261.3);

  /* shadcn new-york semantic tokens (shared between apps) */
  --background: oklch(1 0 0);          /* light default — app overrides this */
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.961 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --primary: oklch(0.546 0.215 261.3);  /* Brynzit blue override */
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --ring: oklch(0.708 0 0);

  /* Font */
  --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* Spacing scale */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}
```

**In `apps/web/src/app/globals.css`** (light-mode default):
```css
@import '@brynzit/ui/styles/globals.css';
@source '../../packages/ui/src/**/*.{ts,tsx}';

/* web-specific: light mode default, editorial spacing */
:root {
  --radius: 0.5rem;
  /* background is already white from shared tokens */
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark overrides */
}
```

**In `apps/console/src/app/globals.css`** (dark-mode default):
```css
@import '@brynzit/ui/styles/globals.css';
@source '../../packages/ui/src/**/*.{ts,tsx}';

/* console-specific: dark mode default, compact density */
:root {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --border: oklch(0.269 0 0);
  --radius: 0.375rem;
}
.light {
  --background: oklch(1 0 0);
  /* ... light overrides */
}
```

[VERIFIED: Tailwind v4 `@source` directive pattern — confirmed from PITFALLS.md Pitfall 4]
[CITED: CONTEXT.md D-10, D-11, D-12 for exact directive and override approach]

### Pattern 7: useAsyncJob Implementation

**What:** TanStack Query v5 `useQuery` with `refetchInterval` as a function. Polls until status maps to a terminal `AsyncJobPhase`.

**Critical backend finding:** The import model transitions `"processing"` → `"complete"` (not `"completed"`). The D-08 default map includes `"done"` and `"completed"` but NOT `"complete"`. Callers using `useAsyncJob` for import status polling MUST pass `statusMap: { complete: 'complete' }` as an override. This is a confirmed mismatch between the D-08 defaults and the live backend.

```typescript
// packages/hooks/src/use-async-job.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'

export type AsyncJobPhase = 'idle' | 'pending' | 'complete' | 'failed'

export type UseAsyncJobOptions<TData, TRawStatus extends string = string> = {
  jobId: string | null | undefined
  endpoint: string
  enabled?: boolean
  statusMap?: Partial<Record<TRawStatus, AsyncJobPhase>>
  refetchInterval?: number
}

export type AsyncJobResult<TData, TRawStatus extends string = string> = {
  phase: AsyncJobPhase
  rawStatus?: TRawStatus
  data?: TData
  error?: unknown
  isPolling: boolean
}

const DEFAULT_STATUS_MAP: Record<string, AsyncJobPhase> = {
  queued: 'pending',
  processing: 'pending',
  running: 'pending',
  generating: 'pending',
  done: 'complete',
  completed: 'complete',
  succeeded: 'complete',
  success: 'complete',
  // NOTE: "complete" (backend import model) is NOT in defaults — callers must add via statusMap
  failed: 'failed',
  error: 'failed',
}

const TERMINAL_PHASES: AsyncJobPhase[] = ['complete', 'failed']

export function useAsyncJob<TData, TRawStatus extends string = string>(
  options: UseAsyncJobOptions<TData, TRawStatus>,
): AsyncJobResult<TData, TRawStatus> {
  const {
    jobId,
    endpoint,
    enabled = true,
    statusMap = {},
    refetchInterval: intervalOverride = 2000,
  } = options

  const mergedMap = { ...DEFAULT_STATUS_MAP, ...statusMap }
  const isEnabled = !!jobId && enabled

  const url = endpoint.includes('{id}')
    ? endpoint.replace('{id}', jobId ?? '')
    : jobId
    ? `${endpoint}/${jobId}`
    : endpoint

  const query = useQuery<TData>({
    queryKey: ['async-job', url, jobId],
    queryFn: async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Poll failed: ${res.status}`)
      return res.json()
    },
    enabled: isEnabled,
    refetchInterval: (q) => {
      const data = q.state.data as any
      const rawStatus = data?.status as string | undefined
      if (!rawStatus) return intervalOverride
      const phase = mergedMap[rawStatus] ?? 'pending'
      return TERMINAL_PHASES.includes(phase) ? false : intervalOverride
    },
    refetchIntervalInBackground: false,
  })

  if (!isEnabled) {
    return { phase: 'idle', isPolling: false }
  }

  const data = query.data as any
  const rawStatus = data?.status as TRawStatus | undefined
  const phase: AsyncJobPhase = rawStatus
    ? (mergedMap[rawStatus] as AsyncJobPhase) ?? 'pending'
    : query.isError
    ? 'failed'
    : 'pending'

  return {
    phase,
    rawStatus,
    data: query.data,
    error: query.error ?? undefined,
    isPolling: query.isFetching && !TERMINAL_PHASES.includes(phase),
  }
}
```

[VERIFIED: TanStack Query v5 `refetchInterval`-as-function signature from STACK.md + ARCHITECTURE.md]
[VERIFIED: Backend status vocabulary from live `openapi.json` + source code inspection]

### Pattern 8: Contract Proposal File Format for Candidate-Facing Endpoints

**Recommendation:** Use minimal OpenAPI 3.1 YAML fragments in `.planning/contracts/`. Full YAML is preferred over TypeScript interfaces because:
1. The MSW handler types can be generated from the types file using `openapi-typescript` when the backend eventually implements the endpoints
2. YAML is diffable against the real backend's eventual OpenAPI schema — making integration risk surface explicit
3. The backend team can review the proposal files as API design input

**File format:**
```yaml
# .planning/contracts/public-jobs.yaml
openapi: "3.1.0"
info:
  title: "Public Jobs Contract Proposal"
  description: "Proposed API contract for public job board endpoints. Not yet implemented in backend."
  version: "0.1.0"
paths:
  /api/v1/public/jobs:
    get:
      summary: List open job roles
      parameters:
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
        - name: cursor
          in: query
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PublicJobsResponse"
components:
  schemas:
    PublicJobsResponse:
      type: object
      required: [items, next_cursor]
      properties:
        items:
          type: array
          items: { $ref: "#/components/schemas/PublicJobItem" }
        next_cursor:
          anyOf: [{ type: string }, { type: "null" }]
    PublicJobItem:
      type: object
      required: [id, title, company, employment_type, date_posted]
      properties:
        id: { type: string, format: uuid }
        title: { type: string }
        # ... additional fields
```

Contract files required for Phase 1 (FOUND-03):
- `.planning/contracts/public-jobs.yaml` — `GET /api/v1/public/jobs`
- `.planning/contracts/candidate-auth.yaml` — `POST /api/v1/candidate/auth/signup`, `POST /api/v1/candidate/auth/login`
- `.planning/contracts/candidate-profile.yaml` — `GET /api/v1/candidate/profile`, `PUT /api/v1/candidate/profile`
- `.planning/contracts/candidate-applications.yaml` — `GET /api/v1/candidate/applications`

[ASSUMED: OpenAPI YAML format is preferred over TypeScript interfaces — no official requirement; rationale is diffability against real backend schema]

### Anti-Patterns to Avoid

- **Fetching data in console layout RSCs:** Any `await fetch()` in `apps/console/app/(shell)/layout.tsx` blocks the entire console render. Layouts are structural only.
- **Editing generated files in `packages/api-client/src/types/api.d.ts`:** Next `generate:api` run overwrites all changes. Add helpers in `packages/api-client/src/lib/` instead.
- **Defining color tokens in app-level CSS:** The `@theme` block MUST live only in `packages/ui/src/styles/globals.css`. App-level `globals.css` only overrides CSS variables, never redefines `@theme` tokens.
- **Synchronous `params`, `headers()`, `cookies()` in Next.js 16:** All are async. Removed in Next.js 16. Must `await params`, `await headers()`, `await cookies()`.
- **MSW handlers defined inside app code:** All handlers must live in `packages/mocks`. Apps and tests import from `@brynzit/mocks/browser` or `@brynzit/mocks/node`.
- **Using `tailwindcss-animate`:** Deprecated in Tailwind v4. Use `tw-animate-css` instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API type generation | Manual TypeScript interfaces for 65+ backend schemas | `openapi-typescript@7.13.0` | Live backend has 65 schemas, 47 paths, 122 nullable fields — hand-writing would drift immediately |
| Polling loop for 202 endpoints | `setInterval` in `useEffect` | `useQuery` with `refetchInterval` as function | `setInterval` does not handle cleanup, visibility changes, concurrent operations, or duplicate request prevention |
| API mock server | Custom Express mock server | MSW v2 | MSW intercepts at the `fetch` level — works for both browser and Node; shared between apps and tests with zero duplication |
| Tailwind class sorting | Manual ordering / alphabetical | `prettier-plugin-tailwindcss` | AI-generated components produce unreadable class strings; diff quality is directly tied to consistent ordering |
| Form validation schemas for API responses | Zod + fetch for response validation | `openapi-typescript` types (compile-time only) | openapi-typescript generates types, not Zod schemas; the backend is trusted — no runtime parse needed; Zod in client is for forms only |
| CSS cascade for dark/light mode | Per-component `dark:` variant repetition | CSS variable semantic tokens + `:root` / `.dark` class | Semantic tokens let you flip the entire theme with one CSS variable reassignment; component classes stay clean |

**Key insight:** Every item in the "Don't Build" column looks simpler at first glance and is 5-10x more work to maintain correctly at scale. The investment in the right tools in Phase 1 eliminates entire categories of bugs in every subsequent phase.

---

## Common Pitfalls

### Pitfall 1: Backend Status Vocabulary Mismatch in useAsyncJob

**What goes wrong:** The D-08 default status map uses `'completed'` as a terminal mapping, but the backend lead import model explicitly transitions to `"complete"` (not `"completed"`). Callers of `useAsyncJob` for import polling who rely only on the defaults will poll forever — the `phase` will never reach `'complete'`.

**Why it happens:** The CONTEXT.md D-08 defaults were designed generically. The live backend was verified during this research phase and uses `"complete"` for lead imports specifically.

**How to avoid:** The `useAsyncJob` hook MUST have this gap documented in its JSDoc. Callers for import status must pass:
```ts
useAsyncJob({ ..., statusMap: { complete: 'complete' } })
```
Alternatively, add `"complete"` to the D-08 default map and confirm with the backend that no existing status clashes with it. Recommend adding `"complete": 'complete'` to the default map (it fills a gap; `"complete"` as a status name is unambiguous).

**Warning signs:** Console import page shows perpetual "Processing..." state after a successful import.

### Pitfall 2: No Dedicated Status Poll for Most 202 Endpoints

**What goes wrong:** Only `POST /api/v1/bd/imports` has a dedicated `/status` endpoint (`GET /api/v1/bd/imports/{import_id}/status`). The other five 202 endpoints — outreach generate, match, parse-jd, enrich, resume upload — do NOT have a `/status` polling endpoint. Polling for them requires re-fetching the parent resource (the outreach sequence, the requisition, the candidate profile) and checking its `status` field.

**Why it happens:** The backend was designed with domain-specific status tracking rather than a generic job queue pattern.

**How to avoid:** The `useAsyncJob` hook's `endpoint` option must point to the correct poll URL per use case:
- Import: `endpoint: '/api/v1/bd/imports/{id}/status'` (dedicated status endpoint)
- Outreach generation: `endpoint: '/api/v1/bd/outreach/{id}'` (poll the sequence resource; stop when `status === 'outreach_review'` or `'failed'`)
- Requisition parse-jd: `endpoint: '/api/v1/ops/requisitions/{id}'` (poll the requisition; stop when structured fields populated)
- Enrich: `endpoint: '/api/v1/supply/candidates/{id}'` (poll the candidate profile)
- Resume upload: no poll endpoint exists — `task_id` in the response has no status check URL

**Warning signs:** A 404 when trying to poll `/api/v1/bd/outreach/generate/{id}/status` — this endpoint does not exist.

### Pitfall 3: Turborepo Phantom Dependencies

**What goes wrong:** A package in `packages/ui` imports `react` without declaring it as a peer dependency — works locally because pnpm hoists it, fails in CI where the symlink structure differs.

**How to avoid:** Every `packages/*` package declares ALL its own deps in `package.json`:
- `packages/ui`: peer deps `react`, `react-dom`; deps: `tailwindcss`, `lucide-react`, `tw-animate-css`
- `packages/hooks`: peer deps `react`, `@tanstack/react-query`; no other runtime deps
- `packages/mocks`: dep `msw`; dev dep `@brynzit/api-client` (for types only)
- `packages/api-client`: dep `openapi-fetch`; dev dep `openapi-typescript`

Verify with a clean build (`rm -rf node_modules .turbo && pnpm install && turbo run build`) before Phase 2.

### Pitfall 4: Missing transpilePackages in Next.js Config

**What goes wrong:** Without `transpilePackages: ['@brynzit/ui', ...]` in `next.config.ts`, Next.js cannot transpile JSX/TSX in workspace packages. The error is either "Cannot find module '@brynzit/ui'" or cryptic Turbopack/webpack errors about JSX syntax.

**How to avoid:** Both `apps/web/next.config.ts` and `apps/console/next.config.ts` must include the full list of `@brynzit/*` packages in `transpilePackages`.

### Pitfall 5: Tailwind v4 Scanning Stops at Package Boundaries

**What goes wrong:** shadcn components installed into `packages/ui` use Tailwind classes. The app's Tailwind auto-scanner doesn't cross the package boundary — class names are purged from the production build, components render unstyled.

**How to avoid:** The `@source '../../packages/ui/src/**/*.{ts,tsx}'` directive in each app's `globals.css` (per D-10) prevents this. The planner must verify this directive is present before declaring the scaffold complete.

### Pitfall 6: MSW Enabled in Production

**What goes wrong:** If `NEXT_PUBLIC_API_MOCKING=enabled` is set in a production environment, all API calls are intercepted by MSW handlers and never reach the real backend. Candidate data never persists.

**How to avoid:** MSW initialization must be guarded by `process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'`. This env var must NOT be set in production `.env` files. The `instrumentation.ts` guard should additionally check `process.env.NODE_ENV === 'development'`.

### Pitfall 7: "complete" vs "completed" in Default Status Map (revisit of Pitfall 1)

**What goes wrong:** See Pitfall 1. The recommendation is to add `"complete": 'complete'` to the D-08 default map before shipping `useAsyncJob`. This is a safe addition — no backend status vocabulary ambiguity with `"complete"` as a key.

**Warning signs:** Import status polling loop runs forever after import completes.

---

## Runtime State Inventory

This is a greenfield phase — no existing runtime state to migrate. Not applicable.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Turborepo, Next.js, openapi-typescript | ✓ | v25.9.0 | — |
| npm | Package registry queries | ✓ | 11.12.1 | — |
| pnpm | Monorepo package management | ✓ (via npx) | 11.6.0 | `npm install -g pnpm@11` |
| turbo | Build orchestration | ✗ (globally) | via `npx turbo` | `npm install -g turbo` or `npx turbo` |
| FastAPI backend | `generate:api:live`, live smoke tests | ✓ | Running at localhost:8000 | Use committed `openapi.json` snapshot |
| git | Commits | ✓ | — | — |

**Missing dependencies with no fallback:**
- None — all blocking dependencies are available or have viable fallbacks.

**Missing dependencies with fallback:**
- `pnpm`: available via `npx pnpm@11.6.0` if not installed globally. First step in scaffold should install it globally via `corepack enable pnpm`.
- `turbo`: not installed globally — use `npx turbo` or install globally after scaffold.

**Important version note:** Node.js v25.9.0 is confirmed installed. Next.js 16 requires Node.js 18.x+, so v25.9.0 is fully compatible.

---

## Code Examples

### Live Backend Schema Fields Confirmation

The backend is confirmed running at `http://localhost:8000/openapi.json`. Key findings for planning:

- **OpenAPI version:** 3.1.0 [VERIFIED: curl output]
- **Field naming:** snake_case throughout (e.g., `icp_score`, `next_cursor`, `canonical_domain`, `review_queue`) — no `alias_generator` in any Pydantic model [VERIFIED: grep on backend source]
- **Nullable pattern:** 122 `anyOf + null` fields across 65 schemas — Pydantic v2 pattern [VERIFIED: live schema parse]
- **Total paths:** 47 across `/api/v1/bd`, `/api/v1/ops`, `/api/v1/supply`, `/api/v1/monitoring` [VERIFIED: live schema parse]
- **Candidate-facing paths:** NONE — no `/api/v1/public/jobs`, `/api/v1/candidate/*` paths exist [VERIFIED: live schema parse]

### Backend Status Vocabulary (confirmed from source code)

The following status strings appear in the live backend and map to `AsyncJobPhase`:

| Backend Status | Context | Maps to AsyncJobPhase |
|---------------|---------|----------------------|
| `"processing"` | Lead imports (`LeadImport.status`) | `pending` |
| `"complete"` | Lead imports terminal state | `complete` — NOT in D-08 defaults; must add |
| `"generating"` | Outreach sequence while being generated | `pending` |
| `"outreach_review"` | Outreach generation complete — ready for human review | `complete` (for the generate job) |
| `"failed"` | Outreach sequence / lead status after error | `failed` |
| `"processing"` | Resume upload initial status | `pending` |
| `"new"` | Candidate record after failed resume parse | special — treat as `failed` |
| `"enrichment_scheduled"` | Enrich endpoint 202 response | `pending` |

[VERIFIED: demand/models/lead_import.py, demand/services/outreach.py, supply/router.py]

### Nullable Field Smoke Test Template

```typescript
// packages/api-client/src/smoke-test.ts (run after generate:api)
import type { components } from './types/api'

// These assertions are compile-time only — if they fail, the types are wrong
type BulkActionRejectionReason = components['schemas']['BulkActionRequest']['rejection_reason']
// Should be: string | null | undefined (not just string)
type _test1 = BulkActionRejectionReason extends (string | null | undefined) ? true : never
const _t1: _test1 = true

type ResumeUploadCandidateId = components['schemas']['ResumeUploadResponse']['candidate_id']
// Should include null
type _test2 = null extends ResumeUploadCandidateId ? true : never
const _t2: _test2 = true

// Add 3 more nullable field assertions from the schema
```

[VERIFIED: Confirmed `BulkActionRequest.rejection_reason` and `ResumeUploadResponse.candidate_id` are `anyOf + null` in live schema]

### shadcn Init (Phase 1 Executor Task)

```bash
# From repo root — initializes shadcn into packages/ui
npx shadcn@latest init --cwd=packages/ui

# Interactive prompt answers:
# Framework: Next.js
# Style: New York
# Base color: Neutral (override accent to blue-600 after init)
# CSS variables: Yes
# Tailwind: (handled by v4 — no config.js generated)
# Import alias for components: @/components
# Import alias for utils: @/lib/utils

# Add Phase 1 components:
npx shadcn@latest add button input label badge separator skeleton sonner card avatar --cwd=packages/ui
```

After init, executor must:
1. Verify `packages/ui/components.json` exists
2. Override `--primary` to `oklch(0.546 0.215 261.3)` in shared globals.css
3. Set console globals.css to dark-first (`:root` = dark values; `.light` = light override)
4. Set web globals.css to light-first (`:root` = light values; `.dark` = dark override)
5. Declare `--font-sans` CSS variable for Geist

[CITED: 01-UI-SPEC.md — shadcn Init Instructions section]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `turbo.json` `"pipeline"` key | `"tasks"` key | Turborepo 2.0 | Old key is deprecated; new key required for v2 features |
| `next/headers` sync access | `await headers()`, `await cookies()`, `await params` | Next.js 16 (removed) | Sync access throws runtime error; not just a warning |
| `fetch()` default `force-cache` | `fetch()` default `no-store` | Next.js 15 | Console needs no-store (correct default); public site needs explicit `revalidate` |
| `tailwindcss-animate` | `tw-animate-css` | Tailwind v4 | `tailwindcss-animate` is deprecated in v4 ecosystem |
| `tailwind.config.js` with `content` array | CSS `@source` directive in globals.css | Tailwind v4 | CSS-first config; no JS config file needed |
| MSW `rest.get(...)` (v1) | `http.get(...)` + `HttpResponse.json(...)` (v2) | MSW 2.0 | v1 `rest` namespace removed; v2 uses `http` namespace |
| Zod v3 | Zod v4 (`zod@^4.0.0`) | Zod 4.0 stable (2025) | 100x fewer TypeScript instantiations; `@hookform/resolvers@^5` auto-detects both |

**Deprecated/outdated:**
- `openapi-typescript-codegen`: unmaintained, known Pydantic v2 null issues — never use
- `react-beautiful-dnd`: archived by Atlassian — use `@dnd-kit/core`
- `@dnd-kit/react` (new rewrite): 0.5.x pre-release — use stable `@dnd-kit/core@^6`
- TanStack Table v9: beta.9 as of June 2026 — use `@tanstack/react-table@^8`

---

## Walking Skeleton

The Walking Skeleton for Phase 1 is the thinnest vertical slice that proves monorepo + typed API client + MSW all work end-to-end before any feature code is written. It is NOT a feature — it is a proof that the infrastructure is wired correctly.

### What the Walking Skeleton Demonstrates

1. `turbo run build` completes across all packages and both apps from a clean checkout
2. `pnpm generate:api` regenerates types from the live backend; 5 nullable fields are typed as `T | null`
3. `apps/console` shell (placeholder page) loads in dev mode with MSW browser worker registered
4. `apps/web` shell (placeholder page) loads in dev mode
5. `useAsyncJob` unit test passes with mock query data

### Thinnest Possible Vertical Slice

The minimal slice that proves everything:
- `apps/console/app/page.tsx` — `'use client'`, uses `useQuery` from `@tanstack/react-query` to fetch `GET /api/v1/bd/rejection-reasons` (a real, simple, non-paginated endpoint)
- The request is intercepted by MSW in dev mode (returns typed mock data)
- The page renders the list of rejection reason strings
- TypeScript compiles without errors — proving the generated types, openapi-fetch client, and TanStack Query are all wired together

This one screen exercises: Turborepo build pipeline → `packages/ui` → `packages/api-client` (generated types + client) → `packages/mocks` (MSW handler for the endpoint) → `apps/console` (TanStack Query + Next.js 16 App Router).

### Walking Skeleton Success Criteria

- [ ] `pnpm install` from repo root succeeds (catalog pins)
- [ ] `turbo run build` from clean checkout produces no errors
- [ ] Dev server starts for both apps (`turbo run dev`)
- [ ] Console page at `/` renders without console errors; rejection reasons list appears
- [ ] MSW worker registered message appears in browser console when `NEXT_PUBLIC_API_MOCKING=enabled`
- [ ] `pnpm generate:api` runs successfully from committed snapshot
- [ ] TypeScript compilation passes for all packages

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `packages/hooks/vitest.config.ts` (Wave 0 — create during scaffold) |
| Quick run command | `pnpm --filter @brynzit/hooks test -- --run` |
| Full suite command | `turbo run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-02 | Nullable fields (`BulkActionRequest.rejection_reason`, `ResumeUploadResponse.candidate_id`, etc.) are typed as `T \| null`, not just `T` | unit (compile-time type assertion) | `pnpm --filter @brynzit/api-client typecheck` | ❌ Wave 0 |
| FOUND-03 | `packages/mocks/src/handlers/` contains 5 domain files; `candidate.ts` has typed handlers | file existence check (part of build) | `turbo run build --filter @brynzit/mocks` | ❌ Wave 0 |
| FOUND-04 | `useAsyncJob` with `jobId=null` returns `phase='idle'`; with terminal status returns correct phase and stops polling | unit | `pnpm --filter @brynzit/hooks test -- --run` | ❌ Wave 0 |
| FOUND-04 | `useAsyncJob` with `statusMap: { complete: 'complete' }` maps backend `"complete"` status to `AsyncJobPhase='complete'` | unit | `pnpm --filter @brynzit/hooks test -- --run` | ❌ Wave 0 |
| FOUND-01 | Both apps build without errors from clean checkout | integration (build gate) | `turbo run build` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter @brynzit/hooks test -- --run` (fast, covers FOUND-04)
- **Per wave merge:** `turbo run build && turbo run typecheck`
- **Phase gate:** `turbo run build` green + all unit tests green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/hooks/vitest.config.ts` — Vitest config for hooks package
- [ ] `packages/hooks/src/__tests__/use-async-job.test.ts` — unit tests for FOUND-04
- [ ] `packages/api-client/src/smoke-test.ts` — compile-time nullable assertions for FOUND-02
- [ ] `packages/config/tsconfig/base.json`, `nextjs.json`, `library.json` — shared TS configs

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` from config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No — console has no auth in v1; public site auth is mocked | MSW mock auth contract; no real auth in Phase 1 |
| V3 Session Management | No | Deferred to Phase 5/6 when real candidate auth ships |
| V4 Access Control | Partial — console is trusted-network only | Document the trusted-network assumption; no IP allowlist yet in Phase 1 scaffold |
| V5 Input Validation | Yes — forms use Zod v4 schemas | `zod@^4.4.3` + `@hookform/resolvers@^5` for all form inputs in Phase 1+ |
| V6 Cryptography | No — Phase 1 has no credentials or secrets | N/A |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| MSW enabled in production | Tampering | Guard all MSW init with `process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'`; never set in production `.env` |
| OpenAPI spec exposure | Information Disclosure | `/openapi.json` and `/docs` are exposed in dev only; codegen runs against dev/staging schema — document disabling in prod FastAPI config |
| Console accessible from public internet | Elevation of Privilege | Trusted-network assumption must be documented explicitly; add HTTP basic auth or IP allowlist at reverse proxy in v1 even without Okta |
| Candidate resume PII in client state | Information Disclosure | All resume file access through backend with short-lived signed URLs; never store direct S3 URLs in frontend state (Phase 3+) |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `experimental: { dynamicIO: true }` is the correct `next.config.ts` key to enable `use cache` directive in Next.js 16.2 | Pattern 3: Next.js 16 App Configuration | Build errors if key is wrong or renamed; check Next.js 16.2 official docs before using `use cache` in Phase 5 |
| A2 | Adding `"complete": 'complete'` to the D-08 default status map is safe — no other backend status vocabulary clashes | Pattern 7: useAsyncJob + Pitfall 1 | If another backend domain uses `"complete"` with a different semantic meaning, the default map would mis-classify it; confirm with backend team |
| A3 | `@source` CSS directive path `'../../packages/ui/src/**/*.{ts,tsx}'` is correct relative to `apps/web/src/app/globals.css` | Pattern 6: Tailwind v4 | Tailwind classes in `packages/ui` would be purged in production builds if path is wrong; test with a clean build |

---

## Open Questions

1. **`use cache` directive exact config key for Next.js 16.2**
   - What we know: Next.js 16 introduces the `use cache` directive as a stable feature
   - What's unclear: The exact `next.config.ts` key to enable it — `experimental.dynamicIO`, `cacheComponents`, or default-enabled
   - Recommendation: Executor should check Next.js 16.2 release notes before adding any `use cache` annotations; `use cache` is not used in Phase 1 (Phase 5 needs it for job board pages) so this can be deferred

2. **Resume upload status polling mechanism**
   - What we know: `POST /api/v1/supply/resumes/upload` returns 202 with `task_id` and `status: "processing"`. There is no `/resumes/upload/status` endpoint.
   - What's unclear: How should the UI poll for resume parse completion? The candidate profile endpoint `GET /api/v1/supply/candidates/{id}` may be the correct poll target once a candidate record exists, but `candidate_id` in the 202 response is nullable.
   - Recommendation: Document this as a known gap in Phase 3/4 planning. For Phase 1 `useAsyncJob`, this endpoint shape is documented in the hook's JSDoc without building a specific handler.

3. **`packages/config` vs separate `packages/tsconfig` naming**
   - What we know: Turborepo examples use `packages/config` with subdirectories; some projects use `packages/tsconfig` directly
   - What's unclear: User preference for naming convention
   - Recommendation: Use `packages/config` with `tsconfig/`, `eslint-config/` subdirectories as the Turborepo canonical pattern

---

## Sources

### Primary (HIGH confidence)

- npm registry (2026-06-13) — turbo@2.9.18, next@16.2.9, msw@2.14.6, openapi-typescript@7.13.0, openapi-fetch@0.17.0, openapi-react-query@0.5.4, vitest@4.1.8, zod@4.4.3, pnpm@11.6.0, shadcn@4.11.0 [VERIFIED]
- Live FastAPI backend at `http://localhost:8000/openapi.json` — OpenAPI 3.1.0; 65 schemas; 47 paths; 122 anyOf+null fields; snake_case throughout [VERIFIED]
- Backend source code at `../talent-platform` — status vocabulary: `"processing"`, `"complete"`, `"generating"`, `"outreach_review"`, `"failed"` confirmed in `demand/models/lead_import.py`, `demand/services/outreach.py`, `supply/router.py` [VERIFIED]
- `openapi-typescript` v7.13.0 CLI — `--help` output confirmed CLI syntax and OpenAPI 3.1 support [VERIFIED]
- Phase context files — `.planning/phases/01-foundation/01-CONTEXT.md`, `01-UI-SPEC.md` [VERIFIED]
- Project research files — `.planning/research/SUMMARY.md`, `PITFALLS.md`, `STACK.md`, `ARCHITECTURE.md` [VERIFIED]

### Secondary (MEDIUM confidence)

- CLAUDE.md — full stack specification including version compatibility matrix, alternatives considered [CITED]
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-04 requirements [CITED]
- `.planning/ROADMAP.md` — Phase 1 success criteria [CITED]
- MSW mswjs.io docs (from STACK.md source list) — v2 Node setup pattern, `instrumentation.ts` integration [CITED: mswjs.io/docs/api/setup-server]

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry on 2026-06-13
- Architecture: HIGH — patterns verified against live backend schema and prior research
- Pitfalls: HIGH — most confirmed from live backend source code inspection
- Backend status vocabulary: HIGH — verified directly from Python source and running server

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (30 days for this stack; backend schema changes would require `generate:api:live` re-run)

**Live backend confirmed:** `http://localhost:8000/openapi.json` responded with OpenAPI 3.1.0 schema during research. Backend at `../talent-platform` is available for `generate:api:live` and live smoke tests.
