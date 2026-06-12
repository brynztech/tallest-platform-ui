# Project Research Summary

**Project:** Brynzit — Talent Platform UI
**Domain:** Dual-face recruitment platform — public candidate job board (Next.js SSR/SEO) + internal recruiting-ops console (SPA-style, data-heavy)
**Researched:** 2026-06-12
**Confidence:** HIGH

## Executive Summary

Brynzit is a two-application frontend monorepo: a public candidate site that must clear the SEO and polish bar set by Wellfound/contrario.ai, and an internal ops console that lets a 2-4 person team run AI-assisted recruiting pipelines at speed. The research confirms that the architectural split — Next.js App Router with RSC and `use cache` on the public side, fully client-rendered TanStack Query on the console side — is the correct model. Both apps share a Turborepo + pnpm workspace containing a generated typed API client, a shadcn/ui design system package, and centralized MSW mock handlers. The core challenge is not framework choice but discipline: two distinct polish bars (editorial public site vs. dense internal tool), a mock-first development cycle for candidate-facing endpoints that do not yet exist, and a pattern of async 202-polling operations that must be implemented once and reused everywhere.

The highest-leverage investment is the foundation phase: monorepo scaffold with correct pnpm strict hoisting, Turborepo task graph, API client generation against the FastAPI OpenAPI schema, MSW handler architecture, and design token structure. Every subsequent phase depends on these being correct. Cutting corners here — hand-written mock handlers without contract files, design tokens defined per-app rather than centrally, phantom dependencies in shared packages — creates compounding technical debt that research estimates at 1-2 weeks of retrofit per pitfall discovered late.

The critical risk is mock drift: the candidate-facing API endpoints (job board, apply flow, candidate dashboard) do not yet exist in the backend. MSW contract mocks will be written against proposed contracts. If those mocks are not generated from or validated against a written OpenAPI contract fragment, the frontend will pass all tests and then break on real-backend integration. The resolution is to write OpenAPI contract proposal files for every unbuilt endpoint in `.planning/contracts/` before writing the first mock handler, and to validate mock response shapes using generated types rather than hand-written object literals.

---

## Key Findings

### Recommended Stack

The stack is high-confidence with all versions verified against current releases. Next.js 16.2.x (with React 19.2 and Turbopack stable) is the correct framework choice for both apps; the `use cache` directive replaces implicit caching and should be adopted from day one. TanStack Query v5 (`^5.90`) is the data layer for all console fetching; its `refetchInterval`-as-function signature maps directly to the project's 202-polling pattern. Turborepo 2.x + pnpm 11.x with the catalog feature centralizes version pins across the monorepo.

For the UI layer: Tailwind CSS v4 with shadcn/ui (CLI-based, "new-york" style, `cssVariables: true`) is the correct foundation, with shared design tokens defined as CSS variables in `packages/ui` and consumed by both apps. Key interaction libraries are `@tanstack/react-table` v8 (v9 is still beta), `@dnd-kit/core` v6 (the new `@dnd-kit/react` rewrite is 0.5.x pre-release), and `react-hook-form` v7 with Zod v4 resolvers.

**Core technologies:**
- **Next.js 16.2 + React 19.2**: Full-stack framework for both apps; RSC + `use cache` for public SEO, thin RSC shells + client components for console
- **TanStack Query v5**: Server-state data layer; `refetchInterval`-as-function for 202 polling, `useInfiniteQuery` for cursor pagination
- **Turborepo 2.x + pnpm 11.x**: Monorepo orchestration with task pipeline and pnpm catalog for centralized version pins
- **openapi-typescript + openapi-fetch + openapi-react-query**: Types-only codegen from FastAPI OpenAPI schema (see codegen decision below)
- **MSW v2**: API mocking with dual initialization — browser Service Worker + Node `setupServer` in `instrumentation.ts` for RSC routes
- **Tailwind v4 + shadcn/ui**: Design system; shared tokens in `packages/ui`, app-specific density overrides per app
- **Zod v4 + react-hook-form v7**: Forms and validation; 100x better TS performance than Zod v3
- **Vitest v4 + Playwright v1.58**: Testing; Vitest shares Vite config, Playwright for E2E per app

### OpenAPI Codegen Decision: openapi-typescript + openapi-fetch (not @hey-api/openapi-ts, not Orval)

The three research files disagree on this choice and the conflict is resolved explicitly here.

**ARCHITECTURE.md** recommends `@hey-api/openapi-ts` with `queryOptions` generation. **PITFALLS.md** recommends Orval for paired client + MSW handler generation to prevent mock drift. **STACK.md** recommends `openapi-typescript` + `openapi-fetch` + `openapi-react-query` for minimal footprint and transparent cache control.

**Recommendation: openapi-typescript + openapi-fetch + openapi-react-query.**

The decisive factor is the 202-polling pattern and complex cache invalidation this project requires across BD/Ops/Supply sections. Both Orval and `@hey-api/openapi-ts` generate hook or option wrappers that obscure the underlying `queryKey` factories: Orval generates custom `useListPets()`-style hooks that shadow TanStack Query's API surface, and `@hey-api/openapi-ts` couples the client to the `@hey-api/client-fetch` runtime. For this project's patterns (`refetchInterval` functions, `queryClient.invalidateQueries`, `useInfiniteQuery` with custom `getNextPageParam`), direct TanStack Query control is required.

The mock-drift risk that Orval addresses is real but is addressed differently: write OpenAPI contract proposal files in `.planning/contracts/` for every candidate-facing endpoint that does not yet exist, generate MSW handlers using typed response shapes from `openapi-typescript` output, and add a CI step that regenerates types from the live backend and fails on type drift. This achieves contract enforcement without surrendering cache-control transparency.

**Tradeoff accepted:** Mock handlers in `packages/mocks` are hand-authored against generated types rather than auto-generated with Faker. This requires more upfront writing effort but produces intentional, readable contract mocks that are easier to diff against eventual real backend response shapes.

Note: ARCHITECTURE.md's file tree references `@hey-api/openapi-ts` in the `packages/api-client` code examples. Treat these as illustrative of the package structure pattern, not as final tool choices. The actual implementation uses `openapi-typescript` + `openapi-fetch`.

### Expected Features

The feature set is well-defined and split cleanly between two launch surfaces. The console is the higher-priority app because all backend endpoints for it already exist — it can be built and used immediately. The public candidate site is mock-first, meaning no features can be shipped to real users until the backend candidate API ships, but the UI can be built and validated in parallel.

**Must have for v1 — Console:**
- BD LeadQueue: fat cards, approve/reject/snooze, rejection reason enum, bulk actions — under-30-second review loop
- Outreach sequence preview, edit (PATCH steps), approve/reject
- BD Pipeline kanban (read-only, status counts from `/bd/pipeline`)
- CSV import with async 202 status tracking; Reply/task triage surface
- Ops: Clients CRM, Requisitions with async JD parse, Match trigger + shortlist review, Interviews + Placements CRUD
- Supply: Talent pool search (hard filters + semantic), Candidate profile (enriched + trigger enrichment), LinkedIn/CSV ingestion, Shortlist review, Engagement sequence review/approve
- Admin: Cost dashboard, Agent event log, Quota monitor, Workflow monitor, Prompt editor

**Must have for v1 — Public site (mock-first):**
- Landing page at contrario.ai polish level
- Candidate signup/login (mocked auth)
- Onboarding: resume upload + async parse + prefill + profile form + completeness indicator
- Job board with search and filter panel (instant-update, active filter pills)
- Job detail pages with `JobPosting` JSON-LD for Google for Jobs
- Apply flow (1-click if profile complete; short override form otherwise)
- Candidate dashboard with application status tracker (specific substep microcopy)

**Should have — v1.x, post-launch:**
- Keyboard shortcuts on review queues (J/K navigate, A/R/S approve/reject/snooze)
- Command palette (Cmd+K) once all entities and actions are defined
- Per-action undo toast after core mutations are stable
- Side-panel slide-over for lead and candidate detail

**Defer to v2+:**
- Candidate-to-recruiter in-app messaging (requires real-time infra)
- Job alerts / saved search emails (requires background scheduler)
- Google Calendar integration for interview scheduling
- Mobile-optimized console

**Anti-features to avoid:**
- Cover letter requirement (45% abandonment — use optional 200-char note instead)
- Salary filter as a hard gate (hides 80%+ of jobs if most roles do not post comp)
- Real-time websockets everywhere (polling sufficient for 2-4 person internal tool)
- Client portal for external client access (explicitly out of scope)

### Architecture Approach

The architecture is a five-package Turborepo monorepo with two Next.js apps and three shared packages. The public site uses RSC-first rendering with client islands for interactivity. The console is a thin RSC shell over fully client-rendered TanStack Query subtrees — RSC is used only for route-level layout composition, never for data fetching in the console. MSW handlers live in `packages/mocks` (not inside either app) so they are shared between development and the test suite. The `packages/api-client` package is generated-only and never edited by hand.

**Major components:**
1. `apps/web` — Public candidate site: SSR/SSG job board, mock-first candidate auth and dashboard, editorial design
2. `apps/console` — Internal ops tool: BD/Ops/Supply/Admin route groups under a shared `(shell)` layout, fully client-rendered, TanStack Query data layer
3. `packages/ui` — Shared shadcn/ui design system with CSS variable tokens; source of truth for all color, spacing, and typography primitives
4. `packages/api-client` — Generated TypeScript types and typed fetch client from FastAPI `/openapi.json`; regenerated by `pnpm generate:api`
5. `packages/mocks` — MSW handlers split by domain (`bd.ts`, `ops.ts`, `supply.ts`, `monitoring.ts`, `candidate.ts`); `candidate.ts` is the contract-mock file for unbuilt endpoints

**Build order:** `packages/config` -> `packages/ui` -> `packages/api-client` -> `packages/mocks` -> `apps/console` and `apps/web` in parallel.

**Key patterns:**
- 202 async polling: `useQuery` with `refetchInterval` as a function; build `useAsyncJobStatus(jobId)` as a shared hook before the first async feature
- Cursor pagination: `useInfiniteQuery` with `getNextPageParam` reading `nextCursor`; bulk actions use pending-overlay pattern (not optimistic removal) to avoid cursor cache corruption
- MSW swap strategy: when backend ships a real endpoint, delete the corresponding handler from `packages/mocks/src/handlers/candidate.ts` — no app code changes needed
- `use cache` on public RSCs for job listings (`revalidate: 300`); no cache directives anywhere in the console

### Critical Pitfalls

1. **MSW mock drift** — Mocks for candidate-facing endpoints silently diverge from the real backend contract. Prevent by: writing OpenAPI contract proposal files in `.planning/contracts/` before the first handler, typing all mock responses using `openapi-typescript` generated types (TypeScript breaks if the type changes), and running `openapi-typescript` against the live backend in CI. Address in the foundation phase — retrofitting after 20 handlers exist is a multi-week task.

2. **Pydantic v2 `anyOf`/nullable type generation** — FastAPI with Pydantic v2 emits optional fields as `anyOf: [{type}, {type: "null"}]`. Some codegen tools mishandle this, producing `T` instead of `T | null | undefined`. Use `openapi-typescript` (handles Pydantic v2 correctly); write a smoke test asserting 5 representative nullable fields are typed correctly before building any query hooks.

3. **snake_case / camelCase mismatch** — Some codegen tools silently camelCase field names even when the API response is snake_case, causing every field access to return `undefined` at runtime while TypeScript reports no errors. Verify the backend's Pydantic model config; use `openapi-typescript` which preserves exact field names; write a runtime integration test asserting a snake_case field is not `undefined`.

4. **Turborepo phantom dependencies + missing `transpilePackages`** — Shared packages that work locally under pnpm's hoisting fail in CI/Docker. Both `next.config.ts` files must include `transpilePackages`. Tailwind v4 content scanning stops at package boundaries — consuming apps must explicitly add `content: ['../../packages/ui/src/**/*.{ts,tsx}']`. Verify with a clean build before writing any shared components.

5. **Cursor pagination + bulk action cache corruption** — Optimistic removal on `useInfiniteQuery` during bulk actions causes cursor chain corruption on partial failure and jarring scroll resets. Use the pending-overlay pattern: items show a processing state and remain in the list; invalidate the infinite query on settlement; preserve scroll position manually.

6. **Over-server-componenting the console** — Awaiting multiple fetches at layout level blocks streaming and produces 1-2s blank screens. Polling state cannot live in Server Components. Establish the pattern on the first console screen: layouts are structural only, all data fetching is in `"use client"` components with `useQuery`.

7. **AI-generated UI slop across two different polish bars** — Without an explicit design brief, AI-generated components apply identical visual treatment to both the editorial public site and the dense console. Write `packages/ui/DESIGN_BRIEF.md` before any component generation. Define all tokens as CSS variables in `packages/ui/src/styles/tokens.css`; neither app defines its own color tokens.

---

## Implications for Roadmap

Based on combined research, a 6-phase structure is recommended. The console is built before the public site because all console backend endpoints already exist, making it immediately usable and testable. The public site's mock-first nature means it can be built in parallel with later console phases but requires the foundation to include MSW contract architecture.

### Phase 1: Foundation — Monorepo, Design System, API Client
**Rationale:** Every subsequent phase depends on a correct monorepo scaffold, working Turborepo task graph, shared design tokens, and a generated typed API client. Pitfalls 2, 3, 4, and 7 all manifest if this phase is done incorrectly. Build and verify the full pipeline (`turbo run build`) before writing any feature code.
**Delivers:** Working monorepo with two Next.js shells, `packages/ui` with design tokens and base components, `packages/api-client` with generated types from the FastAPI schema (Pydantic v2 nullable smoke test passing), `packages/mocks` with domain-split handler files, design brief written, OpenAPI contract proposal files for all candidate-facing endpoints.
**Addresses pitfalls:** Phantom dependencies, transpilePackages, Pydantic v2 nullables smoke test, snake_case convention documented, design token architecture, mock drift prevention architecture.
**Research flag:** The Tailwind v4 + Turborepo content scanning setup has documented gotchas requiring careful configuration — needs attention during planning.

### Phase 2: Console — BD Section
**Rationale:** BD contains the most reusable primitives for the entire project: cursor pagination with `useInfiniteQuery`, the 202 async polling pattern (CSV import), and bulk actions against a cursor-paginated list. Build the shared `useAsyncJobStatus` hook here — it will be reused in every subsequent phase. The under-30-second review loop is also the highest-stakes UX requirement.
**Delivers:** LeadQueue with fat cards, approve/reject/snooze with rejection reason enum, bulk actions with pending-overlay pattern; Outreach sequence preview/edit/approve; BD Pipeline kanban; CSV import with async status; Reply/task triage surface.
**Establishes:** `useAsyncJobStatus` shared hook; pending-overlay bulk action pattern; streaming/Suspense pattern for all console screens.
**Avoids:** Polling anti-patterns (no `setInterval` in `useEffect`), cursor pagination cache corruption on bulk actions, over-server-componenting.
**Research flag:** The cursor pagination + bulk action cache invalidation interaction is the most complex data pattern in the project — design the pending-overlay implementation before coding.

### Phase 3: Console — Ops Section
**Rationale:** Ops is the CRM backbone (clients -> requisitions -> interviews -> placements). It uses the JD parse async pattern (reusing `useAsyncJobStatus`) and CRUD state machines. Lower interaction complexity than BD; all async primitives are already established.
**Delivers:** Clients CRM (list + detail + notes), Requisitions with async JD parse, Match trigger + shortlist review, Interviews CRUD with status machine, Placements CRUD with retention flag.
**Reuses:** `useAsyncJobStatus` for JD parse; shared console layout patterns from Phase 2.
**Research flag:** Standard CRUD + async patterns; no novel interaction challenges beyond what Phase 2 establishes.

### Phase 4: Console — Supply + Admin Sections
**Rationale:** Supply section uses the semantic search endpoint (the most complex query type) and re-uses the async ingestion and enrichment patterns. Admin section is read-heavy monitoring with no novel patterns. Both can be built in parallel within the phase.
**Delivers:** Talent pool search (hard filters + semantic), Candidate profile (enriched view + trigger enrichment), LinkedIn/CSV ingestion, Shortlist review per requisition, Engagement sequence review/approve; Admin: cost dashboard (time-series chart), agent event log, quota monitor, workflow monitor, prompt editor.
**Reuses:** `useAsyncJobStatus` for enrichment and ingestion; cursor pagination for talent pool and agent log.
**Research flag:** Semantic search response contract — confirm the `/supply/candidates/search` response shape (semantic score format, pagination model) against the actual FastAPI implementation before building the results UI.

### Phase 5: Public Site — Job Board + Onboarding
**Rationale:** The public site is mock-first against contract proposal files from Phase 1. By Phase 5, the MSW handler architecture is proven, the design system is established, and the console has validated the async patterns. The public site has distinct requirements: SSR/RSC-first, SEO with `JobPosting` JSON-LD, `use cache` directives for job listings, and the resume upload -> async parse -> prefill onboarding flow.
**Delivers:** Landing page (contrario.ai reference), candidate signup/login (mocked auth), onboarding flow (resume upload -> parse -> prefill -> profile form -> completeness indicator), job board (SSG with search/filter, filter state in URL params), job detail pages with JSON-LD, apply flow (1-click and short-form paths).
**Key requirements:** `JobPosting` JSON-LD must be built into the initial job board — not retrofitted. Resume parse failure must show manual entry fallback. Job pages use `generateStaticParams` + `revalidate: 300`.
**Avoids:** SEO failures (JSON-LD, canonical tags, no `"use client"` on job detail pages), resume upload UX failures (all terminal states, disabled button on submit, client-side file validation).
**Research flag:** `JobPosting` JSON-LD required fields, Google for Jobs validation, and canonical URL strategy for faceted filter parameter combinations all need concrete implementation plans.

### Phase 6: Candidate Dashboard + Mock-to-Real Swap Readiness
**Rationale:** The candidate dashboard requires mocked auth and mock-first backend endpoints. This phase completes the public site user journey and prepares the mock-swap architecture for when the backend ships candidate-facing APIs.
**Delivers:** Candidate dashboard with application status tracker (specific substep microcopy), "you're being considered" signal, GitHub/LinkedIn enrichment display in profile, profile edit after submission.
**Prepares:** Document and test the mock-swap procedure: when backend ships an endpoint, deletion of its handler from `packages/mocks/src/handlers/candidate.ts` is the only required change. Verify this works for at least one endpoint before the phase closes.
**Research flag:** Mock-to-real swap validation — test the swap procedure with a real endpoint before the full candidate-facing backend ships.

### Phase Ordering Rationale

- Console before public site: all console backend endpoints exist; the console can be used and tested against real data immediately. The public site cannot serve real users until backend candidate APIs ship.
- BD before Ops before Supply: BD contains the most reusable primitives (async polling hook, cursor pagination, bulk action pattern); Ops extends those patterns; Supply adds semantic search complexity.
- Foundation must include MSW contract architecture: the public site's mock-first development depends on having the contract proposal files and typed handler pattern from day one, even though the public site is built in Phase 5.
- SEO setup in Phase 5, not retrofitted: `JobPosting` JSON-LD, canonical tags, and `generateStaticParams` cannot be cleanly added after the fact.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 1 (Foundation):** Tailwind v4 content scanning across Turborepo package boundaries — the `@import` vs `content` config approach has gotchas; verify the exact configuration before scaffolding.
- **Phase 2 (BD):** Cursor pagination + bulk action cache invalidation — TanStack Query v5 infinite query invalidation behavior when multiple pages are loaded; the pending-overlay pattern needs a concrete implementation design before coding.
- **Phase 4 (Supply):** Semantic search response contract — confirm the `/supply/candidates/search` endpoint response shape against the actual FastAPI implementation.
- **Phase 5 (Public site):** `JobPosting` JSON-LD required fields and Google for Jobs validation; canonical URL strategy for filter parameter combinations.

**Phases with standard, well-documented patterns (skip deep research):**
- **Phase 3 (Ops):** Standard CRUD + async parse patterns; all primitives established in Phase 2.
- **Phase 6 (Dashboard):** Standard TanStack Query data display; main task is mock data quality and swap procedure verification.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against current releases and official changelogs as of 2026-06-12. Version compatibility matrix explicitly checked. |
| Features | HIGH (core) / MEDIUM (differentiators) | Core table-stakes features grounded in competitor analysis (Wellfound, Greenhouse, Ashby). Differentiator prioritization is informed judgment — validate with reps after 2 weeks of console usage. |
| Architecture | HIGH | Patterns (RSC shells, TanStack Query console, MSW layering, cursor pagination, 202 polling) confirmed against Next.js 16 + TanStack Query v5 docs. |
| Pitfalls | HIGH | Most pitfalls verified against multiple official/community sources; Pydantic v2 nullables and Tailwind v4 monorepo content scanning are confirmed real issues with known solutions. |

**Overall confidence:** HIGH

### Gaps to Address

- **Candidate-facing API contracts:** The backend has not yet defined `/public/jobs`, `/candidate/auth/*`, `/candidate/profile`, or `/candidate/applications` endpoints. OpenAPI contract proposal files in `.planning/contracts/` must be written in Phase 1 before any candidate-facing mock handlers are created.
- **snake_case vs camelCase on the live backend:** The Pydantic model config for the existing backend endpoints needs to be checked against `alias_generator = to_camel` before codegen runs for the first time. This is a global decision that affects every component.
- **`staleTime` global default for the console:** Research recommends `staleTime: 30_000` globally for the console to prevent excessive refetches; at 2-4 users this may be too aggressive. Set to `0` initially and tune upward if the network tab shows excessive polling.
- **Side-panel vs full-page navigation decision:** This is a P2 feature (post-launch) but the layout structure decision must be made in Phase 2 when the console shell layout is first built — adding portal-based panels to a full-page navigation layout later requires refactoring.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16 blog + upgrade guide — https://nextjs.org/blog/next-16 / https://nextjs.org/docs/app/guides/upgrading/version-16
- TanStack Query v5 polling docs — https://tanstack.com/query/latest/docs/framework/react/guides/polling
- openapi-ts.dev — https://openapi-ts.dev/openapi-fetch/ + https://openapi-ts.dev/openapi-react-query/
- Zod v4 docs — https://zod.dev/v4
- Vitest 4.0 blog — https://vitest.dev/blog/vitest-4
- TanStack Table v9 blog (still beta confirmed) — https://tanstack.com/blog/tanstack-table-v9-taking-form
- FastAPI/Pydantic v2 OpenAPI anyOf — https://github.com/fastapi/fastapi/discussions/9900
- Next.js App Router caching changes (v15/v16) — https://nextjs.org/blog/next-15
- TanStack Query infinite query invalidation — https://github.com/TanStack/query/discussions/7569
- MSW mswjs.io docs — https://mswjs.io/docs/api/setup-server
- Turborepo 2.9 blog — https://turborepo.dev/blog/2-9
- pnpm 11.0 blog — https://pnpm.io/blog/releases/11.0
- shadcn/ui Tailwind v4 changelog — https://ui.shadcn.com/docs/changelog/2025-02-tailwind-v4

### Secondary (MEDIUM confidence)
- OpenAPI codegen comparison (2026) — https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p
- Wellfound candidate UX patterns — https://www.remotejobassistant.com/blog/wellfound-review
- Async UI patterns — https://blog.logrocket.com/ux-design/ui-patterns-for-async-workflows-background-jobs-and-data-pipelines/
- Turborepo + Tailwind v4 setup — https://medium.com/@philippbtrentmann/setting-up-tailwind-css-v4-in-a-turbo-monorepo-7688f3193039
- pnpm workspaces strict enforcement — https://nhost.io/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo
- Job board SEO best practices — https://cavuno.com/blog/job-board-seo
- JobPosting JSON-LD in Next.js — https://dev.to/ikoichi/how-to-add-schemaorg-to-a-nextjs-13-website-1cm6
- Application abandonment rates — https://www.jobboardly.com/blog/ultimate-guide-to-job-board-conversion-metrics
- Design systems in the vibe-coding era — https://www.designsystemscollective.com/design-systems-for-the-vibe-coding-era-42282e1affef

### Tertiary (LOW confidence — validate during implementation)
- Orval + TanStack Query v5 compatibility — https://orval.dev/ (version-specific; verify before using Orval for any supplementary codegen)
- pnpm + Next.js standalone output file tracing — https://nextjs.org/docs/app/api-reference/next-config-js/outputFileTracingIncludes (confirm behavior with workspace packages in standalone output)

---
*Research completed: 2026-06-12*
*Ready for roadmap: yes*
