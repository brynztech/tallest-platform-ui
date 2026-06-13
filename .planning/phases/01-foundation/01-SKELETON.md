---
phase: 01-foundation
type: walking-skeleton
status: draft
created: 2026-06-13
---

# Walking Skeleton — Brynzit Talent Platform UI

> The thinnest possible end-to-end slice that proves the entire infrastructure is wired correctly before any feature code is written.

---

## What the Walking Skeleton Proves

1. Turborepo monorepo builds cleanly — `turbo run build` exits 0 across all packages and both apps
2. pnpm workspace catalog pins all versions correctly — `pnpm install` resolves without conflicts
3. The typed API client generates from the live backend OpenAPI 3.1.0 schema with Pydantic v2 nullable fields typed as `T | null`
4. MSW v2 intercepts a real fetch call in the browser, activated by env flag only
5. TanStack Query v5 + openapi-fetch + MSW all wire together in a single React component
6. `useAsyncJob` hook works correctly in a real component context with all 6 unit tests passing
7. Tailwind v4 CSS tokens propagate from `packages/ui` shared @theme through app-level globals.css to rendered components

**Walking Skeleton endpoint:** `GET /api/v1/bd/rejection-reasons`
A real, fast, non-paginated backend endpoint returning a simple string array. The console's `/bd/leads` page fetches it, proving the complete data path.

---

## Architectural Decisions (Locked for All Subsequent Phases)

### Framework

| Decision | Value | Rationale |
|----------|-------|-----------|
| Framework | Next.js 16.2.9 App Router | RSC for public SEO pages; Turbopack for dev speed |
| React | 19.2 (ships with Next 16) | React Compiler eliminates manual memoization |
| TypeScript | ^5.5.0, strict mode | Full type safety; required by all stack libraries |

### Monorepo

| Decision | Value | Rationale |
|----------|-------|-----------|
| Build orchestration | Turborepo 2.9.18, `"tasks"` key | `"pipeline"` key is v1 legacy — do not use |
| Package manager | pnpm 11.6.0 with workspace catalog | Catalog feature centralizes all version pins in pnpm-workspace.yaml |
| Package scope | `@brynzit/*` | Brand-aligned; consistent across all 4 shared packages |
| Package structure | 6 packages: apps/web, apps/console, packages/ui, packages/api-client, packages/mocks, packages/hooks | ui = design system; api-client = types only; mocks = MSW handlers; hooks = polling primitives |

### API Client

| Decision | Value | Rationale |
|----------|-------|-----------|
| Code generation | openapi-typescript 7.13.0 | Zero-runtime pure types; handles Pydantic v2 anyOf+null correctly |
| HTTP client | openapi-fetch 0.17.0 | 6kb zero-runtime; compile-time errors on wrong paths |
| TanStack Query bridge | openapi-react-query 0.5.4 | Generates queryKey factories; 1kb |
| Schema snapshot | packages/api-client/openapi.json committed | CI-safe; snapshot updated via `pnpm generate:api:live` when backend changes |
| Field naming | snake_case throughout | Backend confirmed: no alias_generator in any Pydantic model |

### Design System

| Decision | Value | Rationale |
|----------|-------|-----------|
| CSS framework | Tailwind v4, CSS-first @theme directive | No tailwind.config.js; OKLCH colors; shadcn v4 support |
| Component library | shadcn/ui CLI (shadcn@4.11.0), new-york style | CLI copies source into packages/ui; full component control |
| Token ownership | @theme block lives ONLY in packages/ui/src/styles/globals.css | App-level CSS only overrides CSS variables |
| Cross-package scanning | @source directive in each app's globals.css | Required for Tailwind to scan packages/ui across package boundary |
| Web theme | Light-mode default (:root = light, .dark = dark override) | Editorial, approachable |
| Console theme | Dark-mode default (:root = dark, .light = light override) | Dense screens, extended use |

### Mock Architecture

| Decision | Value | Rationale |
|----------|-------|-----------|
| Mock framework | MSW v2.14.6 | Intercepts native fetch; shared between browser and Node |
| MSW activation | `NEXT_PUBLIC_API_MOCKING=enabled` env var only | Never enabled in production |
| Handler structure | Domain-split: bd.ts, ops.ts, supply.ts, monitoring.ts, candidate.ts | One file per API domain; candidate.ts = contract mocks |
| Contract mocks | OpenAPI 3.1 YAML proposals in .planning/contracts/ | Candidate-facing endpoints not yet in backend; MSW mocks typed against them |
| Mock-swap procedure | Delete handler from candidate.ts when real endpoint ships | No app code changes needed |

### Data Layer

| Decision | Value | Rationale |
|----------|-------|-----------|
| Server state | TanStack Query 5.101.0 | refetchInterval-as-function for 202 polling |
| 202 polling | useAsyncJob hook in packages/hooks | Shared across all 6 async operations in the backend |
| Default status map | Includes "complete" (not just "completed") | Live backend uses "complete" as lead import terminal state — confirmed from source |
| Console data fetching | Client-side TanStack Query only | All console data is user-specific; no benefit to SSR |
| Public site data fetching | RSC + `use cache` for public pages | SEO benefit for job board; client islands for interactive state |

### Security Posture (Phase 1)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Console auth | None in v1 | Trusted-network assumption; Okta integration is a future phase |
| MSW production guard | Env var gated, never in production .env | Confirmed by ASVS L1 T-01-01 mitigation |
| OpenAPI spec | Disable /openapi.json and /docs in production FastAPI config | Backend team responsibility; documented as deployment requirement |

---

## Directory Layout

```
talent-platform-ui/                    # Turborepo monorepo root
├── turbo.json                          # Task graph — uses "tasks" key (v2)
├── pnpm-workspace.yaml                 # Workspace roots + catalog version pins
├── package.json                        # Root scripts: build, dev, generate:api, generate:api:live
│
├── packages/
│   ├── config/                         # @brynzit/config
│   │   └── tsconfig/                   # base.json, nextjs.json, library.json
│   │
│   ├── ui/                             # @brynzit/ui — design system
│   │   ├── src/
│   │   │   ├── components/ui/          # shadcn components (button, badge, card, etc.)
│   │   │   ├── lib/utils.ts            # cn() utility
│   │   │   └── styles/globals.css      # ONLY place @theme is defined
│   │   ├── components.json             # shadcn CLI config
│   │   └── DESIGN_BRIEF.md             # Reference sites + token intent
│   │
│   ├── api-client/                     # @brynzit/api-client — generated types + client
│   │   ├── openapi.json                # COMMITTED snapshot from backend
│   │   ├── src/
│   │   │   ├── types/api.d.ts          # Generated — DO NOT EDIT
│   │   │   ├── client.ts               # createClient<paths> — the one import
│   │   │   └── smoke-test.ts           # Compile-time nullable assertions
│   │   └── scripts/generate-live.sh   # Fetch + generate + update snapshot
│   │
│   ├── mocks/                          # @brynzit/mocks — MSW architecture
│   │   └── src/
│   │       ├── handlers/
│   │       │   ├── bd.ts               # Phase 1: rejection-reasons handler; Phase 2+: full BD
│   │       │   ├── ops.ts              # Phase 3 stub
│   │       │   ├── supply.ts           # Phase 4 stub
│   │       │   ├── monitoring.ts       # Phase 4 stub
│   │       │   └── candidate.ts        # CONTRACT MOCKS — delete when backend ships
│   │       ├── browser.ts              # setupWorker(allHandlers)
│   │       └── node.ts                 # setupServer(allHandlers)
│   │
│   └── hooks/                          # @brynzit/hooks — shared React hooks
│       └── src/
│           ├── use-async-job.ts        # useAsyncJob — 202-polling primitive
│           └── __tests__/              # Vitest unit tests
│
├── apps/
│   ├── web/                            # @brynzit/web — public candidate site
│   │   └── app/
│   │       ├── layout.tsx              # Geist font + MSWProvider
│   │       ├── page.tsx                # "Brynzit is coming." placeholder
│   │       ├── globals.css             # @import shared tokens; light-mode :root
│   │       └── _components/msw-provider.tsx
│   │
│   └── console/                        # @brynzit/console — internal ops tool
│       └── app/
│           ├── layout.tsx              # 'use client' + QueryClientProvider + MSWProvider
│           ├── globals.css             # @import shared tokens; dark-mode :root
│           ├── _components/msw-provider.tsx
│           └── (shell)/
│               ├── layout.tsx          # Structural placeholder — sidebar in Phase 2
│               └── bd/leads/page.tsx   # Walking skeleton — rejection reasons list
│
└── .planning/
    └── contracts/                      # OpenAPI 3.1 proposals for candidate-facing APIs
        ├── public-jobs.yaml
        ├── candidate-auth.yaml
        ├── candidate-profile.yaml
        └── candidate-applications.yaml
```

---

## Walking Skeleton Execution Path

```
User visits http://localhost:3001/bd/leads
         |
         v
apps/console — Next.js 16 App Router
  └── (shell)/layout.tsx — structural layout (no data fetch)
        └── bd/leads/page.tsx ('use client')
              └── useQuery({
                    queryKey: ['rejection-reasons'],
                    queryFn: async () => apiClient.GET('/api/v1/bd/rejection-reasons')
                  })
                  |
                  v
              fetch('/api/v1/bd/rejection-reasons')
                  |
                  v (NEXT_PUBLIC_API_MOCKING=enabled)
              MSW browser worker (from packages/mocks/src/browser.ts)
                  └── bdHandlers[0]: http.get('/api/v1/bd/rejection-reasons', ...)
                        └── HttpResponse.json(['not_icp', 'no_open_roles', ...])
                  |
                  v (NEXT_PUBLIC_API_MOCKING not set)
              Real FastAPI backend at http://localhost:8000
                  └── GET /api/v1/bd/rejection-reasons → actual enum values
```

---

## Decisions That Future Phases MUST NOT Revisit

These are locked by the Walking Skeleton. Future phases build on them:

1. **`@brynzit/*` package scope** — all internal packages use this scope
2. **`catalog:` version references** — never specify version strings in individual package.json files
3. **`packages/ui` owns `@theme`** — no app defines `@theme` blocks
4. **`NEXT_PUBLIC_API_MOCKING === 'enabled'` guard** — MSW never initializes without this env var
5. **MSW handlers live in `packages/mocks` only** — apps never define handlers inline
6. **`"tasks"` key in turbo.json** — never `"pipeline"` (v1 legacy)
7. **`"complete"` in DEFAULT_STATUS_MAP** — the lead import terminal state is "complete" not "completed"
8. **snake_case field names** — backend has no alias_generator; all field names are snake_case in API responses and generated types

---

## Phase 2+ Entry Points

| Phase | Starts From | First New File |
|-------|-------------|----------------|
| 2 (Console BD) | apps/console/app/(shell)/bd/leads/ | Replace walking skeleton page with real LeadQueueClient component |
| 3 (Console Ops) | apps/console/app/(shell)/ops/ | New route group, same shell layout |
| 4 (Console Supply + Admin) | apps/console/app/(shell)/supply/ | New route group |
| 5 (Public Site) | apps/web/app/ | Replace "Brynzit is coming." placeholder with real landing page |
| 6 (Candidate Dashboard) | apps/web/app/dashboard/ | New authenticated route group |

---

## Mock-Swap Procedure (Preview for Phase 6)

When a candidate-facing backend endpoint ships:
1. Delete the handler from `packages/mocks/src/handlers/candidate.ts`
2. Run `pnpm generate:api:live` to update types with the real schema
3. Verify the app still works — MSW will bypass to the real endpoint
4. No app code changes required (the apiClient call is the same)

Full procedure documented in `.planning/contracts/SWAP_PROCEDURE.md` (created in Phase 6).
