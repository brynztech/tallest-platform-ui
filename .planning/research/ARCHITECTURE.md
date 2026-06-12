# Architecture Research

**Domain:** Turborepo frontend monorepo — public Next.js candidate site + internal Next.js ops console
**Researched:** 2026-06-12
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Turborepo Monorepo                            │
│  pnpm workspaces · turbo.json task graph · remote cache              │
├───────────────────────────┬─────────────────────────────────────────┤
│       apps/web            │              apps/console                │
│  (public candidate site)  │          (internal ops tool)             │
│                           │                                          │
│  Next.js App Router       │  Next.js App Router                      │
│  SEO-first RSC            │  Client-heavy, keyboard-dense            │
│  Static + SSG pages       │  TanStack Query data layer               │
│  Candidate auth (mocked)  │  No auth in v1                           │
│                           │                                          │
│  ┌─────────┐ ┌─────────┐  │  ┌────────┐ ┌───────┐ ┌──────┐ ┌────┐  │
│  │ Landing │ │Job Board│  │  │  BD    │ │  Ops  │ │Supply│ │Adm│  │
│  │  /      │ │ /jobs   │  │  │ (bd)   │ │ (ops) │ │(sup) │ │(ad│  │
│  └─────────┘ └─────────┘  │  └────────┘ └───────┘ └──────┘ └────┘  │
│  ┌─────────┐ ┌─────────┐  │              Route Groups                │
│  │Onboarding│ │Dashboard│  │  ┌──────────────────────────────────┐   │
│  │ /signup │ │/me/...  │  │  │     Shared Console Shell Layout  │   │
│  └─────────┘ └─────────┘  │  └──────────────────────────────────┘   │
├───────────────────────────┴─────────────────────────────────────────┤
│                       Shared Packages Layer                          │
│                                                                      │
│  packages/ui          packages/api-client      packages/config       │
│  ┌───────────┐        ┌───────────────────┐   ┌────────────────┐     │
│  │ shadcn/ui │        │ Generated from    │   │ tsconfig/      │     │
│  │ tokens    │        │ FastAPI OpenAPI   │   │ eslint-config/ │     │
│  │ tailwind  │        │ schema via        │   │ tailwind-      │     │
│  │ preset    │        │ @hey-api/openapi-ts│   │ preset         │     │
│  └───────────┘        └──────────┬────────┘   └────────────────┘     │
│                                  │                                    │
│  packages/mocks                  │                                    │
│  ┌───────────────────────────────┘                                   │
│  │ MSW handlers for all endpoints (real + candidate-facing mocks)    │
│  │ Shared between apps/web, apps/console, and Jest/Playwright tests  │
│  └───────────────────────────────────────────────────────────────────┘
├─────────────────────────────────────────────────────────────────────┤
│                       External Boundary                              │
│  FastAPI backend  ../talent-platform  →  /api/v1 over HTTP           │
│  OpenAPI schema at /openapi.json  →  source of truth for api-client  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `apps/web` | Public Brynzit site: landing, job board, candidate signup, candidate dashboard | `packages/ui`, `packages/api-client`, `packages/mocks`, `packages/config` |
| `apps/console` | Internal ops tool: BD/Ops/Supply/Admin sections | `packages/ui`, `packages/api-client`, `packages/mocks`, `packages/config` |
| `packages/ui` | Design system: shared components, Tailwind preset, design tokens | No internal deps; consumed by both apps |
| `packages/api-client` | Generated TypeScript SDK + TanStack Query `queryOptions`/`mutationOptions` from FastAPI OpenAPI schema | External FastAPI backend |
| `packages/mocks` | MSW handlers: real-endpoint mocks for dev + candidate-facing contract mocks | `packages/api-client` types |
| `packages/config` | Shared `tsconfig`, `eslint-config`, `tailwind` base preset | Consumed by all packages |

---

## Recommended Project Structure

```
talent-platform-ui/
├── turbo.json                    # Task graph: build → apps depend on packages
├── pnpm-workspace.yaml           # workspaces: apps/*, packages/*
├── package.json                  # root devDeps: turbo, typescript, prettier
│
├── apps/
│   ├── web/                      # Public candidate site (Next.js App Router)
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout — fonts, providers, analytics
│   │   │   ├── (marketing)/      # Route group: landing, about, pricing
│   │   │   │   ├── page.tsx      # / — landing page
│   │   │   │   └── layout.tsx    # Minimal shell, no nav chrome
│   │   │   ├── jobs/             # /jobs — SSG job board (public, SEO)
│   │   │   │   ├── page.tsx      # Server component — fetch + render list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Server component — generateStaticParams
│   │   │   ├── (auth)/           # Route group: auth-gated candidate flows
│   │   │   │   ├── layout.tsx    # Candidate auth guard (middleware or layout)
│   │   │   │   ├── signup/
│   │   │   │   ├── onboarding/
│   │   │   │   └── me/           # Candidate dashboard
│   │   │   └── api/              # Next.js Route Handlers (proxy to backend)
│   │   ├── components/           # web-only components
│   │   ├── lib/                  # queryClient singleton, msw init, utils
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── console/                  # Internal ops tool (Next.js App Router)
│       ├── app/
│       │   ├── layout.tsx        # Root: QueryClientProvider, Toaster
│       │   ├── (shell)/          # Route group: all console sections share nav
│       │   │   ├── layout.tsx    # Sidebar nav, header, keyboard shortcuts
│       │   │   ├── bd/           # /bd — BD section
│       │   │   │   ├── leads/
│       │   │   │   ├── outreach/
│       │   │   │   ├── pipeline/
│       │   │   │   └── imports/
│       │   │   ├── ops/          # /ops — Ops section
│       │   │   │   ├── clients/
│       │   │   │   ├── requisitions/
│       │   │   │   ├── interviews/
│       │   │   │   └── placements/
│       │   │   ├── supply/       # /supply — Supply section
│       │   │   │   ├── candidates/
│       │   │   │   ├── shortlists/
│       │   │   │   └── engagement/
│       │   │   └── admin/        # /admin — Admin section
│       │   │       ├── costs/
│       │   │       ├── logs/
│       │   │       └── prompts/
│       │   └── api/              # Route Handlers if needed
│       ├── components/           # console-only: queue cards, kanban, etc.
│       ├── lib/                  # queryClient, polling helpers, key factories
│       ├── next.config.ts
│       └── package.json
│
└── packages/
    ├── ui/                       # Shared design system
    │   ├── src/
    │   │   ├── components/       # Button, Card, Table, Badge, etc.
    │   │   ├── tokens/           # color, spacing, typography constants
    │   │   └── index.ts          # barrel
    │   ├── tailwind.config.ts    # Base Tailwind preset
    │   └── package.json          # exports: { "./button": "./src/components/button.tsx" }
    │
    ├── api-client/               # Generated SDK — DO NOT EDIT BY HAND
    │   ├── src/
    │   │   ├── schemas.gen.ts    # Zod schemas (if configured)
    │   │   ├── types.gen.ts      # TypeScript types
    │   │   ├── sdk.gen.ts        # Typed request functions
    │   │   └── query-options.gen.ts  # TanStack Query queryOptions/mutationOptions
    │   ├── openapi-ts.config.ts  # Codegen configuration
    │   ├── scripts/
    │   │   └── generate.sh       # fetch schema from backend, run openapi-ts
    │   └── package.json          # scripts: { "generate": "openapi-ts" }
    │
    ├── mocks/                    # MSW handler library
    │   ├── src/
    │   │   ├── handlers/
    │   │   │   ├── bd.ts         # /bd/* handlers
    │   │   │   ├── ops.ts        # /ops/* handlers
    │   │   │   ├── supply.ts     # /supply/* handlers
    │   │   │   ├── monitoring.ts # /monitoring/* handlers
    │   │   │   └── candidate.ts  # Contract mocks for unbuilt endpoints
    │   │   ├── browser.ts        # setupWorker(...handlers)
    │   │   ├── node.ts           # setupServer(...handlers)
    │   │   └── index.ts          # re-exports
    │   └── package.json
    │
    └── config/
        ├── tsconfig/
        │   ├── base.json         # shared strictness settings
        │   ├── nextjs.json       # extends base + Next.js plugin paths
        │   └── library.json      # for packages/ui and packages/api-client
        ├── eslint-config/
        │   ├── base.js
        │   └── next.js           # extends Next.js ESLint rules
        └── package.json
```

### Structure Rationale

- **`(shell)` route group in console:** All BD/Ops/Supply/Admin routes share the sidebar+header layout. Route groups let a single `(shell)/layout.tsx` wrap them all without the group name appearing in URLs.
- **`(marketing)` and `(auth)` route groups in web:** Different layouts for public marketing pages (no nav chrome) vs. auth-gated candidate dashboard (top nav, auth check).
- **`packages/mocks` as standalone package:** MSW handlers live outside both apps so they can be imported by apps for development and by tests (Jest/Playwright) without duplication.
- **`packages/api-client` as generated-only:** Kept separate and never edited by hand. The `generate` script is the single entrypoint. Apps consume via `workspace:*` dep.
- **`packages/config` for tsconfig/eslint/tailwind:** Follows official Turborepo pattern — each package exports named configs, consuming packages extend them via `@repo/config/tsconfig/nextjs.json`.

---

## Architectural Patterns

### Pattern 1: Server Components for Public SEO Pages (apps/web)

**What:** `app/jobs/page.tsx` and `app/jobs/[id]/page.tsx` are async Server Components that call the API client directly on the server. No TanStack Query provider needed. Metadata is exported from the same file.

**When to use:** Any page in `apps/web` that is publicly crawlable and where content does not change per-user interaction. Landing page, job board listing, individual job detail.

**Trade-offs:** Server-only means no interactivity without client islands. Keep static shells as RSCs; extract interactive widgets (apply button, search filter) as `"use client"` leaf components.

**Example:**
```typescript
// apps/web/app/jobs/[id]/page.tsx
import { getJobById } from '@repo/api-client'
import { ApplyButton } from '../_components/apply-button' // 'use client'

export async function generateMetadata({ params }) {
  const job = await getJobById({ path: { id: params.id } })
  return { title: `${job.title} at ${job.company} — Brynzit` }
}

export default async function JobPage({ params }) {
  const job = await getJobById({ path: { id: params.id } })
  return (
    <article>
      <h1>{job.title}</h1>
      {/* ...server-rendered content */}
      <ApplyButton jobId={job.id} />  {/* client island */}
    </article>
  )
}
```

---

### Pattern 2: TanStack Query for All Console Data (apps/console)

**What:** Every console screen is a Client Component subtree under a `QueryClientProvider`. Server Components render the shell; `"use client"` leaves own all data fetching via `useQuery`/`useMutation` hooks built on the generated `queryOptions`/`mutationOptions` from `packages/api-client`.

**When to use:** Any console screen. The console's data is per-session and frequently mutated — RSC caching is wrong here.

**Trade-offs:** Full client-side bundle for console, but this is fine: it is a trusted-network internal tool with 2-4 users, not a public SEO page.

**Example:**
```typescript
// apps/console/app/(shell)/bd/leads/page.tsx
import { LeadQueueClient } from './_components/lead-queue-client'

// Thin RSC shell for layout
export default function LeadQueuePage() {
  return <LeadQueueClient />
}

// apps/console/app/(shell)/bd/leads/_components/lead-queue-client.tsx
'use client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { listLeadsQueryOptions } from '@repo/api-client'

export function LeadQueueClient() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    ...listLeadsQueryOptions(),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
  // ...
}
```

---

### Pattern 3: 202 Async Job Polling

**What:** Operations that return HTTP 202 (imports, outreach generation, resume parse, enrichment) follow a two-step pattern: a mutation fires the job and stores the returned `jobId`; a query polls the status endpoint with `refetchInterval` that returns `false` once the terminal state is reached.

**When to use:** Any endpoint that returns 202 + a status URL: `/bd/imports`, `/supply/candidates/ingest`, outreach generation, resume parse.

**Trade-offs:** Polling adds network chatter; acceptable for a 2-4 person internal tool. Use `refetchIntervalInBackground: false` (default) to avoid polling hidden tabs.

**Example:**
```typescript
// lib/use-async-job.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { startImport, getImportStatus } from '@repo/api-client'

type TerminalStatus = 'completed' | 'failed'
const TERMINAL: TerminalStatus[] = ['completed', 'failed']

export function useImportJob() {
  const [jobId, setJobId] = useState<string | null>(null)

  const trigger = useMutation({
    mutationFn: startImport,
    onSuccess: (res) => setJobId(res.jobId),
  })

  const status = useQuery({
    queryKey: ['import', jobId],
    queryFn: () => getImportStatus({ path: { jobId: jobId! } }),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s && TERMINAL.includes(s as TerminalStatus) ? false : 2_000
    },
  })

  return { trigger, status }
}
```

---

### Pattern 4: Cursor Pagination for Lead Queue

**What:** `useInfiniteQuery` with `getNextPageParam` reading `lastPage.nextCursor`. The cursor is passed as a query param on each subsequent fetch.

**When to use:** Lead queue (`/bd/leads`), any list that uses cursor-based pagination from the backend.

**Trade-offs:** `useInfiniteQuery` accumulates all pages in memory. For queues that can be 1000s of items, prefer virtualized rendering (TanStack Virtual or similar) over rendering all `data.pages` directly.

**Example:**
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['leads', filters],
  queryFn: ({ pageParam }) => listLeads({ params: { cursor: pageParam, ...filters } }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})
```

---

### Pattern 5: MSW Layering — Dev Mocks vs. Real Endpoints

**What:** All MSW handlers live in `packages/mocks`. Handlers are split by domain. Each app initializes MSW conditionally via `NEXT_PUBLIC_API_MOCKING=enabled`. In the browser, `setupWorker` intercepts fetch. For Next.js server components during development, `setupServer` is initialized in `instrumentation.ts`.

**Swap strategy for candidate-facing endpoints:** The `candidate.ts` handler file encodes the proposed contract. When the backend ships an endpoint, its handler is deleted from `packages/mocks` — the real backend takes over automatically (no app code changes needed).

**Example layout:**
```typescript
// packages/mocks/src/handlers/candidate.ts
// CONTRACT MOCK — delete when backend ships
import { http, HttpResponse } from 'msw'

export const candidateHandlers = [
  http.get('/api/v1/public/jobs', () =>
    HttpResponse.json({ items: mockJobs, nextCursor: null })
  ),
  http.post('/api/v1/candidate/auth/register', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ candidateId: 'mock-123', ...body }, { status: 201 })
  }),
]
```

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
  ...candidateHandlers,  // <-- remove entries as backend ships them
)
```

```typescript
// apps/console/instrumentation.ts  (Next.js server-side MSW)
export async function register() {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    const { server } = await import('@repo/mocks/node')
    server.listen({ onUnhandledRequest: 'bypass' })
  }
}
```

---

### Pattern 6: API Client Generation and Regeneration

**What:** `packages/api-client` is the single source of truth for types and request functions. It is generated from the FastAPI OpenAPI schema using `@hey-api/openapi-ts`. The `generate` script fetches the live schema from the running backend (or a committed `openapi.json` snapshot) and regenerates all `.gen.ts` files.

**Why `@hey-api/openapi-ts` over Orval:**
- Generates framework-agnostic `queryOptions`/`mutationOptions` (not hooks), which compose cleanly across React and any future framework change
- MSW handlers are owned by `packages/mocks` (authored by hand for contract clarity), not auto-generated with Faker — contract mocks need intentional data
- Orval auto-generated MSW would conflict with hand-authored contract mocks for candidate-facing endpoints

**Regeneration workflow:**
```bash
# In packages/api-client/scripts/generate.sh
# Option A: pull from live backend
curl http://localhost:8000/openapi.json > openapi.json
npx openapi-ts

# Option B: pull from known schema URL (CI)
OPENAPI_URL=${BACKEND_URL}/openapi.json npx openapi-ts
```

Turborepo task graph ensures `api-client#generate` runs before `web#build` and `console#build`.

**`openapi-ts.config.ts` shape:**
```typescript
import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  client: '@hey-api/client-fetch',
  input: './openapi.json',         // committed snapshot updated by generate.sh
  output: './src',
  plugins: [
    '@hey-api/typescript',         // types.gen.ts
    '@hey-api/sdk',                // sdk.gen.ts
    {
      name: '@tanstack/react-query',
      output: 'query-options.gen', // queryOptions + mutationOptions
    },
  ],
})
```

---

## Data Flow

### Public Job Board (apps/web) — SSR/SSG Path

```
Browser Request → Next.js Edge/Node
    ↓
RSC Server Component (app/jobs/page.tsx)
    ↓ direct async call (no TanStack Query, no hydration)
packages/api-client  →  GET /api/v1/public/jobs
    ↓ (dev: intercepted by MSW setupServer in instrumentation.ts)
    ↓ (prod: real FastAPI backend)
JSON response
    ↓
generateMetadata() + page() render HTML
    ↓
Client receives fully-rendered HTML (SEO-complete)
    ↓ interactive islands hydrate
Client Components (ApplyButton, SearchFilter) mount
    ↓
TanStack Query provider active for client-side interactions
```

---

### Console Async Job Flow (e.g., CSV Lead Import)

```
User uploads CSV
    ↓
useMutation → POST /api/v1/bd/imports  → 202 { jobId }
    ↓
setJobId(jobId) — enables polling query
    ↓
useQuery (enabled: !!jobId)
    refetchInterval: query => terminal? false : 2000
    ↓ polls every 2s
GET /api/v1/bd/imports/{jobId}/status
    ↓ { status: "processing", progress: 45 }
    ↓ (continue polling)
    ...
    ↓ { status: "completed", importedCount: 312 }
    ↓ refetchInterval returns false → polling stops
UI shows success toast + invalidates lead queue cache
    ↓
queryClient.invalidateQueries(['leads']) → re-fetches lead list
```

---

### Console Cursor-Paginated Lead Queue

```
User opens /bd/leads
    ↓
useInfiniteQuery(['leads', filters])
    queryFn: ({ pageParam }) => listLeads({ cursor: pageParam })
    initialPageParam: undefined
    ↓
GET /api/v1/bd/leads?limit=25  → { items: [...], nextCursor: "cursor_abc" }
    ↓
data.pages[0] renders 25 fat cards
    ↓
User scrolls to bottom / clicks "Load More"
    ↓
fetchNextPage() → GET /api/v1/bd/leads?cursor=cursor_abc&limit=25
    ↓
data.pages[1] appended → renders next 25 cards
```

---

### MSW Dev Mock Swap

```
Dev environment (NEXT_PUBLIC_API_MOCKING=enabled)
    ↓
packages/mocks/browser.ts → setupWorker registered
packages/mocks/node.ts   → setupServer via instrumentation.ts
    ↓
All fetch/XHR intercepted at network level
    ↓
handlers/bd.ts        → /api/v1/bd/* (mocks existing real endpoints)
handlers/candidate.ts → /api/v1/public/jobs, /api/v1/candidate/* (contract mocks)
    ↓
Backend ships /api/v1/public/jobs
    ↓
Delete handler from handlers/candidate.ts
    ↓
Real backend takes over — no app code changes
```

---

## Build Order

This is the dependency graph that must be respected. Turborepo enforces it via `turbo.json` `dependsOn`.

```
1. packages/config          (no deps — tsconfig, eslint, tailwind preset)
        ↓
2. packages/ui              (depends on: config)
        ↓
3. packages/api-client      (depends on: config; generation requires live backend or schema snapshot)
        ↓
4. packages/mocks           (depends on: api-client types for typed handlers)
        ↓
5a. apps/web                (depends on: ui, api-client, mocks, config)
5b. apps/console            (depends on: ui, api-client, mocks, config — parallel with web)
```

**Initial build sequence for a fresh repo:**

1. Scaffold `packages/config` — tsconfig, eslint config, tailwind preset
2. Scaffold `packages/ui` — install shadcn/ui, establish design tokens, export preset
3. Scaffold `packages/api-client` — write `openapi-ts.config.ts`, run first generation from live backend, commit `openapi.json` snapshot
4. Scaffold `packages/mocks` — write MSW handlers using generated types as contracts
5. Build `apps/console` first — all backend endpoints exist, no mocking complexity; validates the full stack end-to-end
6. Build `apps/web` — job board and candidate-facing flows mock-first, swapping handlers as backend ships them

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| FastAPI backend (`../talent-platform`) | HTTP REST via generated `@hey-api/client-fetch` SDK in `packages/api-client` | Schema committed as `openapi.json` snapshot; regenerate on backend changes |
| OpenAPI schema endpoint (`/openapi.json`) | `generate.sh` fetches directly from running backend | CI can pull from deployed staging URL |

### Internal Package Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `apps/*` → `packages/ui` | Import via `@repo/ui/button` style named exports | `package.json` exports map prevents barrel-import sprawl |
| `apps/*` → `packages/api-client` | Import `queryOptions`, `mutationOptions`, typed SDK functions | Never import raw `fetch` — always go through generated client |
| `apps/*` → `packages/mocks` | Import `worker` (browser) or `server` (node) for MSW init only | Apps never import handler arrays directly; mocks package owns composition |
| `packages/mocks` → `packages/api-client` | Import response types for typed mock payloads | One-directional; api-client never imports from mocks |
| `packages/ui` → `packages/config` | Extends `@repo/config/tsconfig/library.json` and Tailwind preset | Config is the only zero-dep root |

---

## Anti-Patterns

### Anti-Pattern 1: Fetching in Server Components Inside the Console

**What people do:** Use async Server Components for console data pages to avoid hydration overhead.

**Why it's wrong:** Console data is session-specific and invalidated by mutations. RSC caching assumptions break the optimistic update / cache invalidation model that TanStack Query provides. Also prevents keyboard-shortcut-driven refetch.

**Do this instead:** Console RSCs are thin layout shells. All data fetching is client-side via `useQuery`/`useMutation`. The only RSC logic in console is route-level layout composition.

---

### Anti-Pattern 2: Editing Generated Files in `packages/api-client`

**What people do:** Patch a type mismatch or add a helper directly in `.gen.ts` files.

**Why it's wrong:** The next `pnpm generate` overwrites all changes. The contract diverges from the actual backend schema.

**Do this instead:** Add a `lib/` folder inside `packages/api-client` for non-generated helpers (e.g., query key factories, typed wrappers). Keep all `.gen.ts` files untouched and gitignore-exempt (committed to track drift).

---

### Anti-Pattern 3: Putting MSW Handlers Inside App Code

**What people do:** Define handlers in `apps/web/src/mocks/` or `apps/console/src/mocks/`.

**Why it's wrong:** Handlers must be shared between both apps and the test suite (Jest, Playwright). Duplicated handlers drift; test data stops matching development data.

**Do this instead:** All handlers live in `packages/mocks`. Apps and tests import from `@repo/mocks/browser` or `@repo/mocks/node`.

---

### Anti-Pattern 4: Global `"use client"` Layout in apps/web

**What people do:** Wrap `apps/web`'s root layout in `"use client"` to use a context provider (e.g., auth state).

**Why it's wrong:** Marks every page in the app as a client component, destroying SSG/RSC benefits for the SEO-critical job board and landing pages.

**Do this instead:** Use the `(auth)` route group with its own `layout.tsx` for the candidate dashboard. Only the auth-gated subtree is client-heavy. Marketing and job board pages stay pure RSC.

---

### Anti-Pattern 5: One Giant Handler File in packages/mocks

**What people do:** Put all MSW handlers in a single `handlers.ts` because it's simpler at first.

**Why it's wrong:** When swapping a real endpoint for its mock, you have to diff a large file. Candidate-facing contract mocks need to be clearly separated from real-endpoint dev mocks.

**Do this instead:** One file per backend domain (`bd.ts`, `ops.ts`, `supply.ts`, `monitoring.ts`, `candidate.ts`). `candidate.ts` is the contract-mock file — its entire existence signals "backend not shipped yet."

---

## Scaling Considerations

This is a 2–4 person internal tool plus a public candidate site. Scaling considerations are practical, not theoretical.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Now (small team, v1) | Single deploy per app. No edge caching needed. Console is trusted-network only. MSW mocks cover unbuilt endpoints. |
| Growth (candidate auth ships) | Replace MSW `candidateHandlers` with real backend calls. Add `next-auth` or equivalent to `apps/web`. No monorepo restructuring needed. |
| Okta for console | Add auth middleware to `apps/console` without touching the route structure — the `(shell)` layout becomes the enforcement point. |
| Public site traffic grows | Add ISR (`revalidate`) to job board pages. Extract a dedicated `packages/data` layer with `React.cache`-wrapped server-side fetchers. |
| API client versioning | If backend introduces breaking API versions, the `packages/api-client` package gets a `v2/` subfolder with a parallel generation config. Apps opt in explicitly. |

---

## Sources

- Turborepo package structure docs: https://github.com/vercel/turborepo/blob/main/skills/turborepo/references/best-practices/packages.md
- Turborepo internal packages: https://github.com/vercel/turborepo/blob/main/apps/docs/content/docs/core-concepts/internal-packages.mdx
- Next.js App Router route groups: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Next.js generateMetadata: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/generate-metadata.mdx
- TanStack Query polling guide: https://tanstack.com/query/latest/docs/framework/react/guides/polling
- TanStack Query infinite queries: https://github.com/tanstack/query/blob/main/docs/framework/react/guides/infinite-queries.md
- MSW browser integration: https://mswjs.io/docs/integrations/browser/
- MSW Node.js integration: https://mswjs.io/docs/api/setup-server
- @hey-api/openapi-ts with Next.js + FastAPI: https://www.vintasoftware.com/blog/nextjs-fastapi-monorepo
- Full-stack type safety FastAPI + Next.js: https://abhayramesh.com/blog/type-safe-fullstack
- API codegen landscape 2026: https://www.saschb2b.com/blog/typesafe-api-codegen-2026
- Next.js + MSW App Router integration: https://gimbap.dev/blog/setting-msw-in-next

---

*Architecture research for: Brynzit talent-platform-ui (Turborepo frontend monorepo)*
*Researched: 2026-06-12*
