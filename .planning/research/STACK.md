# Stack Research

**Domain:** Recruitment platform — public job board (Next.js SSR/SEO) + dense internal ops console (SPA-style, data-heavy)
**Researched:** 2026-06-12
**Confidence:** HIGH (all versions verified against current releases and official docs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.x (current stable) | Full-stack React framework for both apps | App Router gives RSC for public SEO pages; Turbopack now default and stable; `use cache` directive replaces implicit caching — align with current mental model from day 1 rather than inheriting v15 patterns |
| React | 19.2 (ships with Next.js 16) | UI runtime | Ships inside Next.js 16; React Compiler built-in means zero manual `useMemo`/`useCallback` in most components |
| TypeScript | ^5.5 | Type safety | Required by every library in this stack; Next.js 16 ships `npx next typegen` for auto-generating `PageProps`/`LayoutProps` helpers |
| @tanstack/react-query | ^5.90 (v5 latest) | Server-state data layer | v5 is stable; polling via `refetchInterval` as a function (receives `query.state.data`) is the idiomatic pattern for the 202-poll-until-done async endpoints (imports, outreach generation, resume parse, enrichment); cursor pagination (`useInfiniteQuery`) maps directly to the lead queue's cursor API |
| Turborepo | ^2.9 (current stable) | Monorepo build orchestration | Single build cache across `apps/web`, `apps/console`, `packages/*`; task pipeline ensures `packages/ui` and `packages/api-client` build before apps; remote cache reduces CI times 40-90% |
| pnpm | ^11.x (current stable) | Package management | Fastest installs, strictest hoisting rules, catalogs feature for centralising version pins across the monorepo; pnpm 11 is current major |

### API Client

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| openapi-typescript | ^7.13 | Generate TS types from FastAPI's `/openapi.json` | Zero-runtime, pure types — 6 kb output vs full SDK; generates `readOnly`/`writeOnly` markers; uses TypeScript AST for correctness |
| openapi-fetch | ^0.17 | Type-safe fetch client wrapping those generated types | 6 kb, zero-runtime, compile-time errors on wrong path params/request bodies; pairs with TanStack Query via `openapi-react-query` |
| openapi-react-query | latest | Thin 1 kb adapter between openapi-fetch and TanStack Query | Generates `queryKey` and query functions from the typed client; keeps TanStack Query as the caching layer |

**Why not hey-api / @hey-api/openapi-ts:** hey-api generates full SDK class files with an entire client runtime — good if you want per-endpoint hooks auto-generated, but it adds significant generated-code surface area and couples the client to a specific HTTP adapter. The `openapi-typescript` + `openapi-fetch` + `openapi-react-query` trio is smaller, more transparent, and easier to manually supplement for mock-first endpoints that don't exist in the schema yet.

**Why not orval:** Orval is compelling for its MSW mock auto-generation from Faker, but it generates custom `useListPets()` hook wrappers that shadow TanStack Query's own API — you lose direct access to `queryKey` factories, `invalidateQueries`, and granular cache control. For this project's 202-polling patterns and complex invalidation across BD/Ops/Supply sections, direct TanStack Query control is required.

### UI Foundation

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Tailwind CSS | ^4.x (v4 stable) | Utility-first CSS | v4 ships as a PostCSS/Vite plugin (no `tailwind.config.js` needed); CSS-first config via `@theme` directive; OKLCH colors; shadcn/ui fully supports v4 since February 2025 |
| shadcn/ui | latest CLI (shadcn@3.x) | Copy-paste component library on top of Radix + Tailwind | Not an npm package — CLI copies source into `packages/ui`, giving the Taste Skill agent full access to component internals for customisation; "new-york" style + `cssVariables: true` is the v4 convention |
| Radix UI Primitives | per-component (e.g. `@radix-ui/react-dialog` ^3.x) | Accessible, unstyled behavioural components | Foundation layer under shadcn; handles focus traps, ARIA attributes, keyboard navigation for Dialog, Popover, DropdownMenu, Select, Tooltip, etc.; 3.5M weekly downloads, 60K GitHub stars — default choice for non-contractual WCAG compliance needs |
| lucide-react | latest | Icon library | Default icon provider in shadcn/ui; tree-shakable SVG components; 1,655+ icons covers all recruitment UI needs |
| tw-animate-css | latest | Animation utilities | Replaces `tailwindcss-animate` (deprecated in Tailwind v4); default in new shadcn/ui v4 projects |

### Dense Console — Data & Interaction Libraries

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @tanstack/react-table | ^8.21 (v8 stable) | Paginated lead queue, shortlist tables, cost dashboard, agent log feed | v8 is production-stable; v9 is still in beta (v9.0.0-beta.9 as of June 2026) with breaking API changes — do not use v9 yet; v8 provides sorting, filtering, virtual pagination, column resizing; integrates directly with TanStack Query cursor pagination |
| @dnd-kit/core + @dnd-kit/sortable | ^6.3 (v6 stable) | Kanban pipeline board (BD lead statuses, potentially Ops) | `@dnd-kit/react` (the new rewrite) is 0.5.x pre-release — use the stable `@dnd-kit/core@^6` + `@dnd-kit/sortable@^7`; well-documented for kanban patterns; accessibility-first (keyboard + pointer + screen reader); zero external dep beyond React |
| react-hook-form | ^7.66 | All forms in both apps | Uncontrolled inputs = no re-renders on keypress; `Controller` component for Radix/shadcn primitives; works with `@hookform/resolvers@^5` |
| @hookform/resolvers | ^5.2 | Zod/Valibot schema adapters for RHF | v5.1+ supports both Zod v3 and v4 schemas with auto-detection |
| zod | ^4.0 | Schema validation + inference | v4 is stable (`npm install zod@^4.0.0`); 100x fewer TypeScript instantiations vs v3; `ZodMini` for smaller bundles; use as both RHF validator and for OpenAPI request/response guard types |
| react-dropzone | ^14.x | File drag-and-drop for resume uploads | Headless; ~5M weekly downloads; handles drag zones, validation, preview; integrate with RHF via `Controller` for the supply ingest and public candidate onboarding flows |
| cmdk | ^1.x | Command palette / searchable dropdowns | Ships inside shadcn/ui `Command` component; keyboard-first UX for the console's talent search and filter inputs |

### Mocking

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| msw | ^2.x | API mocking for mock-first public endpoints and dev workflow | v2 is the stable line; works as a Service Worker in the browser and via `setupServer` (msw/node) on the server; for Next.js 16 App Router, initialise browser worker in a `'use client'` provider component and the node server in `instrumentation.ts` (the `register()` export); handlers are shared between browser and Vitest tests |

**MSW + Next.js 16 pattern:**
```
instrumentation.ts          → register() calls setupServer(handlers) for RSC/route handlers (NODE_ENV=development only)
app/_mocks/MSWProvider.tsx  → 'use client' component that calls setupWorker(handlers).start() in browser
app/layout.tsx              → wraps children with <MSWProvider> when NEXT_PUBLIC_API_MOCKING=enabled
handlers/                   → shared handler files, consumed by both instrumentation.ts and vitest setup
```

### Testing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| vitest | ^4.1 | Unit + integration tests | v4 is current stable (4.1.8 as of June 1 2026); native ESM, Vite-aligned config, browser mode now stable; shares the same TS config as the app — no separate jest config needed |
| @testing-library/react | ^16.x | Component testing | Works inside vitest with `@testing-library/user-event`; jsdom environment |
| @playwright/test | ^1.58 (current stable) | E2E tests | Official Next.js testing guide recommends Playwright; auto-waits, web-first assertions; per-project config for `apps/web` and `apps/console`; combine with MSW `setupServer` for seeded API state in E2E runs |

### Developer Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | ^5.5 | Strict mode; `next typegen` for route type helpers |
| ESLint | ^9.x + `eslint-config-next` | Linting; flat config format (ESLint 9 default) |
| Prettier | ^3.x | Formatting; minimal config, Tailwind plugin for class sorting |
| `prettier-plugin-tailwindcss` | ^0.6 | Sorts Tailwind class strings; required for readable diffs in AI-generated UI |
| `@types/node`, `@types/react`, `@types/react-dom` | current | Node + React type stubs |

---

## Monorepo Layout (Turborepo + pnpm)

```
talent-platform-ui/
├── apps/
│   ├── web/                     # Next.js 16 — public Brynzit site
│   └── console/                 # Next.js 16 — internal ops console
├── packages/
│   ├── ui/                      # shadcn/ui components + design tokens (packages/ui)
│   │                            # shadcn CLI target: --cwd=packages/ui
│   ├── api-client/              # Generated openapi-typescript types + openapi-fetch client
│   │                            # Run: openapi-typescript http://localhost:8000/openapi.json -o src/schema.d.ts
│   ├── tsconfig/                # Shared tsconfig bases (base.json, nextjs.json, react-library.json)
│   └── eslint-config/           # Shared ESLint flat config
├── pnpm-workspace.yaml          # packages: ["apps/*", "packages/*"] + catalog
├── turbo.json                   # Pipeline: build depends on ^build; lint, typecheck, test
├── package.json                 # Root devDeps: turbo, typescript, eslint, prettier
└── pnpm-lock.yaml
```

**pnpm-workspace.yaml catalog pattern (pnpm 9.5+ / 11.x):**
Centralise shared dependency versions in the catalog block so every app and package stays in sync without manual cross-package updates:
```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  next: ^16.2.7
  react: ^19.2.0
  react-dom: ^19.2.0
  typescript: ^5.5.0
  "@tanstack/react-query": ^5.90.0
  "@tanstack/react-table": ^8.21.0
  zod: ^4.0.0
  react-hook-form: ^7.66.0
  "@hookform/resolvers": ^5.2.0
  tailwindcss: ^4.0.0
  msw: ^2.0.0
```

**turbo.json pipeline minimum:**
```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "generate:api": { "cache": false }
  }
}
```

---

## Installation

```bash
# Root monorepo setup
pnpm create turbo@latest --package-manager pnpm

# Core framework (per app)
pnpm add next react react-dom --filter apps/web
pnpm add next react react-dom --filter apps/console

# Data layer
pnpm add @tanstack/react-query @tanstack/react-table --filter apps/console
pnpm add @tanstack/react-query --filter apps/web

# API client (in packages/api-client)
pnpm add openapi-fetch openapi-react-query --filter packages/api-client
pnpm add -D openapi-typescript --filter packages/api-client

# UI foundation (packages/ui)
pnpm add tailwindcss @tailwindcss/vite lucide-react tw-animate-css --filter packages/ui
# Then: npx shadcn@latest init --cwd=packages/ui (interactive, choose Next.js + Tailwind v4)

# Forms + validation
pnpm add react-hook-form @hookform/resolvers zod react-dropzone

# Drag and drop (console only)
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --filter apps/console

# Mocking
pnpm add -D msw

# Testing
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom
pnpm add -D @playwright/test
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `openapi-typescript` + `openapi-fetch` | `hey-api/openapi-ts` with TanStack Query plugin | hey-api generates full SDK runtime with per-endpoint hook wrappers; reduces flexibility for mock-first endpoints; extra generated-code surface; harder to selectively override individual queries |
| `openapi-typescript` + `openapi-fetch` | Orval | Auto-generates custom hooks that shadow TanStack Query's API surface; loses direct `queryKey` factory control needed for complex invalidation across BD/Ops/Supply; mock generation via Faker is nice but MSW is already in the stack |
| `@dnd-kit/core` v6 (stable) | `@dnd-kit/react` (new rewrite) | `@dnd-kit/react` is 0.5.x pre-release as of June 2026; breaking changes expected before 1.0 |
| `@tanstack/react-table` v8 | v9 (beta) | v9 is beta.9 as of June 2026; API changes are significant (`useTable` replaces `useReactTable`, explicit feature registration); wait for stable |
| Zod v4 | Zod v3 | v4 is stable since 2025; `@hookform/resolvers` v5 auto-detects both; 100x fewer TS instantiations makes compile times better in a monorepo |
| Tailwind v4 + shadcn | Tailwind v3 + shadcn | v4 is fully supported by shadcn since Feb 2025; CSS-first config reduces tooling; OKLCH colors; no reason to start a greenfield on v3 |
| React Dropzone | UploadThing | UploadThing is a full-stack upload service (S3 + CDN); resumes here go to the FastAPI backend's `/supply/resume-upload` — direct multipart POST, no need for a separate upload service; react-dropzone is the headless UI layer |
| Vitest | Jest | Vitest shares the Vite config; faster ESM handling; browser mode graduated to stable in v4; no separate Babel pipeline needed |
| pnpm 11 | Bun workspaces | Bun workspaces are maturing but Turborepo's official support and the wider ecosystem's pnpm tooling (e.g. pnpm catalogs, lockfile) is better established for a team-shared monorepo |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `pages/` router in new Next.js 16 files | App Router is the current and future model; `pages/` is legacy maintenance mode; no RSC, no `use cache`, inferior DX | App Router (`app/`) exclusively |
| `next/headers` / `next/cookies` synchronous access | Fully removed in Next.js 16 — causes runtime errors, not just warnings | `await cookies()`, `await headers()`, `await params` everywhere |
| TanStack Table v9 (beta) | Still beta as of June 2026 with API-breaking changes from v8 | `@tanstack/react-table@^8.21` |
| `@dnd-kit/react` (new rewrite) | Pre-release (0.5.x), unstable API | `@dnd-kit/core@^6` + `@dnd-kit/sortable@^7` |
| `react-beautiful-dnd` | Unmaintained since 2022; Atlassian archived it | `@dnd-kit/core` |
| Zod v3 in new code | v4 has 100x better TS performance; `@hookform/resolvers` v5 supports both | Zod v4 (`zod@^4.0.0`) |
| `tailwindcss-animate` | Deprecated in Tailwind v4 ecosystem | `tw-animate-css` |
| MSW v1 | v1 uses deprecated `rest` namespace and lacks v2's `HttpResponse` API | MSW v2 (`msw@^2`) |
| Zod + openapi-typescript for server-side response validation | openapi-typescript generates types only — no runtime parse needed in the client when the backend is trusted; Zod in the client should be for forms only | Typed client types for API; Zod only for form schemas |
| Storybook | Heavy tooling for a 2–4 person team with Taste Skill doing generation; MSW already in the stack for isolated component mocking | Vitest + `@testing-library/react` for unit testing; Playwright for visual/E2E |
| Redux / Zustand | No global client state needed; all server state in TanStack Query; local UI state in React `useState`/`useReducer`; the console's section-local state (selected rows, open panels) is component-local | TanStack Query for server state; React built-ins for UI state |

---

## Key Patterns for This Project

**Pattern: 202 async polling (imports, outreach generation, resume parse, enrichment)**

TanStack Query `refetchInterval` with a function:
```ts
useQuery({
  queryKey: ['import-status', importId],
  queryFn: () => apiClient.GET('/bd/imports/{id}', { params: { path: { id: importId } } }),
  refetchInterval: (query) => {
    const status = query.state.data?.data?.status
    return status === 'complete' || status === 'failed' ? false : 2000
  },
})
```
Poll every 2 s; stop when terminal status reached. `refetchIntervalInBackground: true` keeps ops reps' import status fresh even if they switch tabs.

**Pattern: Cursor pagination (lead queue)**

`useInfiniteQuery` with `getNextPageParam` reading the `next_cursor` field from the FastAPI response. TanStack Table's `useReactTable` receives flattened `data.pages.flatMap(p => p.items)`.

**Pattern: Typed API client (packages/api-client)**

```ts
// packages/api-client/src/client.ts
import createClient from 'openapi-fetch'
import type { paths } from './schema'          // generated by openapi-typescript

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
})
```

Regenerate after backend changes: `pnpm run generate:api` (runs `openapi-typescript` against live or downloaded schema). Both apps import from `@brynzit/api-client`.

**Pattern: `use cache` in Next.js 16 public site**

Enable in `next.config.ts`: `cacheComponents: true`. Use `'use cache'` + `cacheTag` on public-facing RSC fetches (job listings, company page). Candidate dashboard and authenticated routes stay dynamic — never add `'use cache'` to components that read `cookies()` or `headers()` directly.

**Pattern: MSW in Next.js 16 App Router**

Two parallel initialisation paths — browser worker for client components, Node server for RSC route handlers — both sharing the same `handlers/` files. Guard both with `process.env.NODE_ENV === 'development'` and `NEXT_PUBLIC_API_MOCKING`.

---

## Version Compatibility Matrix

| Package A | Version | Compatible With | Notes |
|-----------|---------|-----------------|-------|
| next | ^16.2 | react@^19.2 | Ships together; do not pin react separately |
| @tanstack/react-query | ^5.90 | react@^18 / ^19 | v5 supports both; no peer-dep issues |
| @tanstack/react-table | ^8.21 | react@^16-19 | v8 broad compat; v9 requires explicit feature registration |
| zod | ^4.0 | @hookform/resolvers@^5 | resolvers v5 auto-detects v3 vs v4 |
| msw | ^2.x | next@^16, vitest@^4, playwright@^1.58 | MSW 2 intercepts native `fetch` correctly |
| tailwindcss | ^4.x | shadcn CLI 3.x | shadcn 3.x is the v4-compatible CLI version |
| openapi-typescript | ^7.x | openapi-fetch@^0.17 | Keep in sync; both from `openapi-ts/openapi-typescript` monorepo |
| vitest | ^4.1 | @testing-library/react@^16 | No additional adapters needed; configure `environment: 'jsdom'` |

---

## Sources

- Next.js official blog post — https://nextjs.org/blog/next-16 (v16.2.7 as current stable)
- Next.js upgrade guide — https://nextjs.org/docs/app/guides/upgrading/version-16 (async API breaking changes)
- TanStack Query polling docs — https://tanstack.com/query/latest/docs/framework/react/guides/polling (refetchInterval function signature)
- openapi-ts.dev — https://openapi-ts.dev/openapi-fetch/ (openapi-typescript v7 + openapi-fetch v0.17)
- openapi-react-query — https://openapi-ts.dev/openapi-react-query/ (TanStack Query wrapper pattern)
- shadcn/ui Tailwind v4 changelog — https://ui.shadcn.com/docs/changelog/2025-02-tailwind-v4 (v4 support confirmed)
- TanStack Table v9 blog — https://tanstack.com/blog/tanstack-table-v9-taking-form (v9 still beta as of June 2026)
- Turborepo 2.9 blog — https://turborepo.dev/blog/2-9 (v2.9.17 current stable)
- pnpm 11.0 blog — https://pnpm.io/blog/releases/11.0 (pnpm 11 current major)
- Zod v4 docs — https://zod.dev/v4 (v4 stable, `npm install zod@^4.0.0`)
- Vitest 4.0 — https://vitest.dev/blog/vitest-4 (browser mode stable, v4.1.8 latest)
- @dnd-kit/core npm — https://www.npmjs.com/package/@dnd-kit/core (v6.3.1 stable; @dnd-kit/react 0.5.x pre-release)
- MSW mswjs.io docs — https://mswjs.io/docs/api/setup-server (v2 Node setup pattern)
- DEV comparison article — https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p (codegen comparison)

---
*Stack research for: Brynzit Talent Platform UI (apps/web + apps/console monorepo)*
*Researched: 2026-06-12*
