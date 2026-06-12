# Pitfalls Research

**Domain:** Two-app frontend (public Next.js job-board + internal recruiting ops console) in Turborepo monorepo over FastAPI backend, with mock-first development (MSW)
**Researched:** 2026-06-12
**Confidence:** HIGH (most pitfalls verified across multiple official/community sources)

---

## Critical Pitfalls

### Pitfall 1: MSW Mock Drift — Mocks Diverge Silently from the Real API Contract

**What goes wrong:**
MSW handlers for the candidate-facing endpoints (job board, apply flow, candidate dashboard) are written once, the UI passes all tests, and then months later the backend ships the real endpoints with different field names, different status codes, or different pagination envelope shapes. The UI breaks immediately in production but never failed in CI. With 5+ candidate-facing endpoints all mocked, the drift compounds: each mock captures a different developer's assumption of what the API should return.

**Why it happens:**
Mocks live in frontend code and evolve with the frontend; real API design lives in a different repo (or a different person's head). There is no automated enforcement that a mock matches the OpenAPI schema it claims to represent. Developers update mock behavior to fix a UI bug without checking whether the underlying contract also changed.

**How to avoid:**
- Generate MSW handlers directly from the OpenAPI spec using Orval (`orval.config.ts` with `mock: true` and `client: 'react-query'`). When the backend ships a new schema, re-running the generator produces updated handlers automatically.
- For endpoints that do not exist yet (candidate-facing), write an OpenAPI YAML/JSON fragment in `.planning/contracts/` that defines the proposed contract. Generate MSW handlers from that fragment. When the backend implements the endpoint, diff the real schema against the proposal file — the diff is the integration risk surface.
- Store mock response fixtures as typed objects, not raw JSON strings, so TypeScript will fail at the point of the fixture if the type definition changes.
- Add a CI step: `npx openapi-typescript /api/v1/openapi.json -o src/types/api.d.ts` on every build against the live backend. If the generated types change, the build will surface type errors in the codegen'd client.

**Warning signs:**
- MSW handlers reference fields by string (`"lead_id"`) rather than generated types.
- Mock handlers are not in the same directory as the generated API client.
- No contract file exists for candidate-facing endpoints — just ad-hoc `res(ctx.json({...}))` calls scattered around tests.
- The backend and frontend repos have never compared OpenAPI schema versions.

**Phase to address:** Foundation phase (monorepo scaffold + API client setup). The contract fragments and Orval config must exist before the first candidate-facing mock is written. Retrofitting this after 20 mock handlers exist is painful.

---

### Pitfall 2: FastAPI + Pydantic v2 `anyOf`/Nullable Type Generation Breaking the TypeScript Client

**What goes wrong:**
FastAPI with Pydantic v2 emits optional fields as `anyOf: [{type: "integer"}, {type: "null"}]` instead of the v1 pattern of marking the field absent from the `required` array. Many codegen tools mishandle this: they generate `integer | null` correctly but also mark the field as always-present (required in the TypeScript interface), causing runtime `undefined` where the code expects `null`, or vice versa. Enum fields with blank/null options can silently become `never` in some generators (confirmed Kubb issue).

**Why it happens:**
Pydantic v2 changed its OpenAPI serialization to be closer to JSON Schema draft 2020-12. Codegen tools designed against OpenAPI 3.0 (nullable: true) did not anticipate the `anyOf + null` pattern. Tools like `openapi-typescript-codegen` (now unmaintained) and early versions of `openapi-generator` produce incorrect nullability semantics for Pydantic v2 schemas.

**How to avoid:**
- Use `openapi-typescript` (the types-only generator, `npx openapi-typescript`) or Orval (which wraps `openapi-typescript` for React Query integration) — both handle Pydantic v2 `anyOf` correctly as of 2025.
- Do not use the legacy `openapi-typescript-codegen` package (last meaningful release 2022, known issues with Pydantic v2 nullables).
- After generating types, write a smoke-test: import 5 representative schema types and assert their nullable fields are typed `T | null | undefined` — not just `T`.
- Verify the FastAPI backend's OpenAPI output at `/api/v1/openapi.json` before writing any client code. Check whether `alias_generator = to_camel` is set on Pydantic models — if it is, the JSON responses will be camelCase and the generated types will be camelCase, but if it is not set, responses will be snake_case while some generators silently rename fields to camelCase in types only, causing runtime `undefined` on every field access.

**Warning signs:**
- Fields that are `Optional[str]` in Python are typed as `string` (not `string | null`) in the generated TypeScript.
- Runtime `undefined` appears in console for fields that exist in the API response — a codegen naming mismatch.
- Rejection reason enum from `/bd/rejection-reasons` generates as `string` rather than the 7-value literal union.

**Phase to address:** Foundation phase — before any component consumes the API client. Run codegen against the live backend schema on day one and write the smoke test before building the first query hook.

---

### Pitfall 3: snake_case / camelCase Mismatch Between FastAPI Responses and TypeScript Client

**What goes wrong:**
FastAPI Python models use `snake_case` (e.g., `icp_score`, `lead_id`, `created_at`). If the backend does not use `alias_generator` to emit camelCase JSON, but the codegen tool silently renames fields to camelCase in the generated TypeScript types (a known default in `openapi-generator`), then `lead.icpScore` is typed but the actual object at runtime has `lead.icp_score`. Every field access returns `undefined`. The bug is invisible until runtime because TypeScript says it is fine.

**Why it happens:**
Some codegen tools apply their own naming convention transforms as a "convenience" independently of what the actual HTTP response contains. The OpenAPI spec says the field is `icp_score`; the tool generates a TypeScript property `icpScore` without any runtime transformation layer.

**How to avoid:**
- Check the backend's Pydantic models for `model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)`. If present, JSON is camelCase and types should be camelCase — consistent.
- If absent, JSON is snake_case. Use `openapi-typescript` which preserves the exact field names from the spec without renaming. Do not use a generator that silently camelCases.
- Write a runtime validation integration test: fetch one real endpoint (or the existing `/bd/leads` endpoint), pick a snake_case field, assert `response.data.icp_score !== undefined`.
- Pick one convention (snake_case throughout OR camelCase throughout) and enforce it in the Orval/openapi-typescript config. Do not mix.

**Warning signs:**
- A field like `created_at` or `icp_score` is present in the OpenAPI spec but accessed as `createdAt` in component code without any transform middleware.
- Network tab shows `icp_score: 7.2` in the response but `console.log(lead.icpScore)` prints `undefined`.

**Phase to address:** Foundation phase — codegen setup. Document the chosen convention in `packages/api-client/README.md` before any feature work.

---

### Pitfall 4: Turborepo + pnpm Phantom Dependency Pitfalls and Shared Package Resolution

**What goes wrong:**
Two patterns break simultaneously. First: a package in `packages/ui` imports `react` or `tailwind-merge` without declaring it in its own `package.json` — it works locally because pnpm hoists it, but fails in CI or Docker builds where the symlink structure differs. Second: `transpilePackages` is missing or incomplete in `apps/web/next.config.ts` and `apps/console/next.config.ts`, causing "Cannot find module '@brynzit/ui'" errors at build time, or worse, the package resolves but JSX/TSX is not transpiled, producing cryptic webpack/Turbopack errors.

**Why it happens:**
Developers add a component to `packages/ui`, import it in an app, and it just works in the dev server because of how pnpm's node_modules resolution works. The phantom dependency only surfaces under strict module resolution (CI, Docker standalone output, Vercel deploy). The `transpilePackages` omission is a documented gotcha for Next.js monorepos — the default Next.js config does not know to transpile workspace packages.

**How to avoid:**
- Every `packages/*` package must declare all its own dependencies in its `package.json`, including `react`, `react-dom`, and any utility libraries it imports.
- `apps/web/next.config.ts` and `apps/console/next.config.ts` must both include `transpilePackages: ['@brynzit/ui', '@brynzit/api-client']` (and any other workspace packages).
- Add `"node-linker": "hoisted"` or `"shamefully-hoist": true` only as a last resort — it masks phantom dependency bugs. Keep pnpm's strict mode and fix the root cause.
- For Tailwind v4 in a monorepo: Tailwind's automatic content scanning stops at the package boundary. The consuming app's Tailwind config must explicitly add `content: ['../../packages/ui/src/**/*.{ts,tsx}']`. Alternatively, use a CSS `@import` to consume a pre-built stylesheet from `packages/ui/dist`.
- Design tokens (CSS variables, color palette) must live in `packages/ui/src/styles/tokens.css` and be `@import`ed by both apps — not redefined in each app's tailwind config independently.

**Warning signs:**
- `pnpm install` succeeds but `pnpm run build` fails in `apps/web` with "cannot resolve '@brynzit/ui'".
- A component renders correctly in `apps/web` but has no styling — Tailwind purged the classes because it could not see the shared package source.
- Different color values appear for the same semantic token in the two apps.

**Phase to address:** Foundation phase — monorepo scaffold. Verify the full build pipeline (`turbo run build`) succeeds before writing any shared components.

---

### Pitfall 5: Over-Server-Componenting the Console — Blocking Streaming and Breaking Interactivity

**What goes wrong:**
The console has data-dense review screens (LeadQueue, ShortlistReview) where a developer correctly reaches for Server Components to fetch data close to the server. But they `await` multiple independent fetches at the layout level rather than inside per-widget Suspense boundaries. Result: the page is a blank screen until all fetches complete in series. The 202-status polling screens (CSV import progress, outreach generation status) are incorrectly implemented as Server Components, which cannot hold polling state — they silently refetch on every navigation rather than maintaining live polling.

**Why it happens:**
App Router defaults everything to Server Components. The instinct to "fetch data at the top" is correct in Pages Router but incorrect in App Router — it defeats streaming. Developers who have not internalized the "push fetches down into leaf Server Components wrapped in Suspense" pattern build waterfall layouts.

**How to avoid:**
- Treat layouts as structural scaffolding — no `await` in layout files. If `app/console/layout.tsx` awaits anything, it blocks the entire subtree.
- Any data fetch that is independent of another should be in its own leaf Server Component wrapped in `<Suspense fallback={<Skeleton/>}>`.
- Everything that polls (import status, outreach generation, enrichment) is a Client Component using `useQuery` with `refetchInterval`. Do not attempt to poll from a Server Component.
- Everything that holds ephemeral UI state (selected rows for bulk action, expanded cards, filter state) is a Client Component. The rule: if it changes without a full navigation, it is a Client Component.
- Use `Promise.all` for concurrent independent fetches within a single Server Component rather than sequential awaits.

**Warning signs:**
- `app/console/(bd)/layout.tsx` contains `const data = await fetch(...)` calls.
- A polling status indicator is implemented as a `page.tsx` with `revalidate: 5` instead of a Client Component with `useQuery({ refetchInterval: 2000 })`.
- Time-to-first-byte for the LeadQueue page is > 1s because all three data fetches run in series.

**Phase to address:** Console BD phase (first interactive review screen). Establish the streaming/Suspense pattern on the first screen before it becomes institutional habit.

---

### Pitfall 6: Next.js 15 Caching Surprises — Stale Data in the Console, Overcached Public Pages

**What goes wrong:**
Two opposing failure modes. In the console: a developer adds `cache: 'force-cache'` to an internal API fetch (or migrates from a Next.js 14 codebase where this was the default) and operations reps see stale lead queues that do not reflect actions taken 30 seconds ago. On the public site: a developer uses `fetch` without any cache directive for job listing pages, expecting them to be cached for SEO performance, but Next.js 15's new default is `no-store` — every request hits the backend, destroying edge cache benefits for the job board.

**Why it happens:**
Next.js 15 reversed the caching default: fetch requests are now `no-store` by default (previously `force-cache`). Teams migrating docs or patterns from Next.js 14 tutorials will apply wrong defaults. The two apps in this project have opposite caching needs — the console needs fresh data always, the public site needs aggressive caching for SEO performance.

**How to avoid:**
- Console fetches: no cache directive needed (Next.js 15 default `no-store` is correct). Do not add `cache: 'force-cache'` to any console fetch. All live data goes through TanStack Query on the client, not through Next.js server-side fetch caching.
- Public site job listing page: explicitly set `next: { revalidate: 300 }` on the fetch for job listings (5-minute ISR), or use `generateStaticParams` for known role slugs. Do not leave job detail pages uncached.
- Add a lint rule or code review checklist: any `fetch()` in `apps/console/` that has `cache: 'force-cache'` is a bug.
- Document the caching strategy per-app in `apps/web/CACHING.md` and `apps/console/CACHING.md`.

**Warning signs:**
- Console operations reps report "I approved a lead but it still shows in the queue" — stale server-side cache.
- Job listing pages show Time-to-First-Byte > 500ms on every request — missing ISR.
- A `layout.tsx` in the console app has `export const revalidate = 60` — this will serve stale layouts.

**Phase to address:** Foundation phase for the console (establish "no server-side caching in console" rule), public site phase for job board (set explicit ISR values).

---

### Pitfall 7: Hydration Mismatches from Browser-Only APIs and Unstable Values in Server-Rendered UI

**What goes wrong:**
Components that render relative times ("2 hours ago"), user-specific greetings, or feature flags based on `localStorage` produce different output on server and client, triggering React hydration errors. In the console this manifests as flickering timestamps. On the public site it crashes the entire page tree if the hydration error happens outside a Suspense boundary (Next.js 15 behavior: unrecoverable hydration errors outside Suspense boundaries force full client re-render).

**Why it happens:**
Server renders at a fixed timestamp; client renders at the moment of hydration — always slightly different. `localStorage`, `window`, `navigator` do not exist on the server. Developers writing components for the browser forget the component will also run on the server.

**How to avoid:**
- Timestamps that should be relative: render as absolute on the server, hydrate to relative on the client using `suppressHydrationWarning` only on that specific element, or use a client-only `<RelativeTime>` wrapper component.
- Any component that reads `localStorage` or `window`: either mark the entire component `'use client'` and wrap with `dynamic(() => import(...), { ssr: false })`, or read the value in `useEffect` with an initial `null` state.
- `useId()` for stable IDs across server/client instead of `Math.random()`.
- Candidate dashboard (mock-first, behind auth): the entire authenticated shell can be `'use client'` to avoid SSR auth state mismatches.

**Warning signs:**
- Console shows "Text content does not match server-rendered HTML" in development.
- A timestamp shows "NaN seconds ago" on initial render.
- The page goes blank on first load and then re-renders — client re-render fallback triggered by unrecoverable hydration mismatch.

**Phase to address:** Per feature as built. The foundation phase should establish the `dynamic(ssr: false)` pattern as the go-to wrapper for browser-API components.

---

### Pitfall 8: Polling Anti-Patterns for 202 Async Operations (Imports, Outreach Gen, Enrichment)

**What goes wrong:**
Polling is implemented naively: a `setInterval` in a `useEffect` that fires every 2 seconds unconditionally, regardless of whether the tab is in the background, whether the operation is already complete, or whether the user has navigated away. Multiple concurrent CSV imports each start their own `setInterval`, producing N simultaneous polling loops. When the network is slow, each poll fires before the previous response arrives, creating overlapping requests and confusing state. Polling stops when the component unmounts but the operation is still in progress — the user sees no result when they return to the page.

**Why it happens:**
Polling feels simple to implement with `setInterval`. The edge cases (visibility, completion, error, concurrent operations, persistence across navigation) only become apparent after the first real use.

**How to avoid:**
- Use TanStack Query `useQuery` with `refetchInterval: 2000` and `enabled: status === 'processing'` — this handles cleanup on unmount automatically and respects the `refetchIntervalInBackground` option (set to `false` for console operations, `true` for import progress that should finish even if the user navigates away).
- Set `refetchInterval: false` once `status === 'completed' || status === 'failed'` to stop polling.
- Implement exponential backoff for failed polls: start at 2s, double up to 30s max.
- For operations the user initiates and navigates away from (CSV import): persist the `job_id` in `localStorage` or a Zustand store so the status can be polled when the user returns to the imports page.
- Show explicit terminal states: a completed import that the user missed should show "Completed at 14:32" not just disappear from the queue.
- The `/bd/imports/{id}/status` and equivalent endpoints: implement a React Query custom hook `useAsyncJobStatus(jobId)` shared across all 202-pattern operations (imports, outreach gen, resume parse, enrichment) so the polling logic is written once.

**Warning signs:**
- `useEffect(() => { const id = setInterval(...); return () => clearInterval(id); }, [])` appears more than once in the codebase.
- The network tab shows 3+ simultaneous polling requests for different operations.
- "undefined is not an object" errors on the status field after component remount — the poll fired after the component unmounted and set state on an unmounted component.

**Phase to address:** Console BD phase (CSV import is the first 202-pattern feature). Build `useAsyncJobStatus` as a shared hook before implementing any async operation feature.

---

### Pitfall 9: Cursor Pagination + Optimistic Bulk Actions Breaking Cache Consistency

**What goes wrong:**
The LeadQueue uses cursor pagination. A user selects 20 leads across 3 cursor pages and hits "Bulk Approve." Optimistically, all 20 are removed from the UI. The mutation fails for 3 of them. The rollback attempts to restore the previous cache state, but TanStack Query's infinite query cache represents all pages as one entry — rolling back page 2 after page 3 has already been navigated to produces a duplicate or missing cursor. On success, invalidating the infinite query refetches all pages from page 1, causing a jarring scroll reset and potentially re-showing leads the user already actioned if the backend has not yet processed all approvals.

**Why it happens:**
`useInfiniteQuery` stores all pages in a single cache entry. Optimistic updates on infinite queries are documented as complex in TanStack Query. Cursor-based pagination means page N+1 depends on the cursor returned by page N — you cannot independently refetch page 2 without refetching page 1 first.

**How to avoid:**
- For bulk approve/reject: do not use optimistic updates on the infinite query cache directly. Instead, maintain a local `pendingActionIds: Set<string>` state. Items in this set are rendered with a visual "processing" state (dimmed, with spinner) but remain in the list. On success, invalidate the infinite query (which refetches from page 1). On failure, clear the pending set and show an error toast per failed item.
- This "pending overlay" pattern trades optimistic removal for honest pending state — acceptable for a back-office tool where correctness matters more than instant feedback.
- When invalidating after a bulk action, use `queryClient.invalidateQueries({ queryKey: ['leads'] })` — TanStack Query v5 will refetch all pages sequentially from cursor 0, which is correct.
- Preserve scroll position: use `scrollRestoration: 'manual'` on the queue container and save the scroll position before mutation, restore after refetch settles.
- For single-item approve/reject (the common case), optimistic removal is fine: use `onMutate` to remove from cache, `onError` to restore, `onSettled` to invalidate.

**Warning signs:**
- After a bulk rejection, some leads reappear in the queue 2 seconds later.
- After a bulk action, the user is scrolled to the top of the queue unexpectedly.
- Network tab shows 5 sequential requests to the leads endpoint after a single bulk action — the infinite query is refetching all 5 pages sequentially (expected behavior, but confirm it's not in an infinite loop).

**Phase to address:** Console BD phase — LeadQueue bulk actions. Design the pending overlay pattern before implementing bulk actions.

---

### Pitfall 10: Job Board SEO Failures — Missing Structured Data and Unindexable Dynamic Routes

**What goes wrong:**
Job listing pages at `/jobs/[slug]` are deployed with client-side rendering only (because a developer wrapped the page in `'use client'` to use a filter state hook), making them unindexable by Googlebot. Even when SSR is correct, no `JobPosting` schema.org JSON-LD is included, so the listings never appear in Google for Jobs. Faceted filter URLs (`/jobs?location=london&type=full-time`) generate hundreds of near-duplicate pages without canonical tags, triggering duplicate content penalties.

**Why it happens:**
SEO concerns are easy to defer ("we'll add that later") and invisible until Google indexes. The `JobPosting` schema is a non-trivial implementation. Canonical URL logic for faceted navigation requires upfront architectural decision.

**How to avoid:**
- Job detail pages (`/jobs/[slug]`) must be Server Components. Move any client interactivity (apply button state, save-to-favorites) to isolated Client Component islands within the page, not the page itself.
- Include `JobPosting` JSON-LD in every job detail page using Next.js `generateMetadata` and a `<script type="application/ld+json">` tag in the page component. Required fields: `title`, `description`, `datePosted`, `validThrough`, `employmentType`, `hiringOrganization`, `jobLocation`.
- For faceted filter pages: set `<link rel="canonical" href="/jobs" />` on all filtered views, or use `generateStaticParams` for popular combinations. Never let filter parameter combinations be indexed independently.
- Use descriptive slugs (`senior-full-stack-engineer-london`) not numeric IDs (`/jobs/42`) — slugs are keyword-rich and stable.
- Submit an XML sitemap that includes only canonical job listing URLs.

**Warning signs:**
- Google Search Console shows 0 impressions for job-related queries after 4 weeks.
- Lighthouse SEO score < 90 on the job detail page.
- Google for Jobs widget does not appear for branded job searches.
- `<meta name="robots" content="noindex">` accidentally present on job pages (can happen if the wrong layout wraps the jobs section).

**Phase to address:** Public site phase — job board. SEO setup (JSON-LD, canonical, sitemap) must be part of the initial job board build, not a retrofit.

---

### Pitfall 11: Resume Upload UX Failures — Silent Failures and Dead End States

**What goes wrong:**
The resume upload on both the public candidate onboarding and the console Supply ingestion screen dispatches a file, receives a 202, and then the UI shows nothing. The async parse takes 15-30 seconds. Users assume the upload failed and re-upload, producing duplicate candidate records. When the parse genuinely fails (corrupt PDF, unsupported format, file too large), the error is swallowed because the status endpoint returns `{status: "failed"}` but the UI never polls for failure — it only polls until success or times out silently.

**Why it happens:**
The 202 pattern requires a second round-trip (poll for status), which developers often skip initially. Error states in async flows require explicitly handling the terminal failure case — developers build the happy path and defer error handling.

**How to avoid:**
- After receiving 202 from the resume upload endpoint, immediately start the `useAsyncJobStatus` polling hook on the returned job ID.
- Show three distinct visual states: "Uploading" (progress bar during the PUT/POST), "Parsing resume..." (spinner with estimated time "usually under 30 seconds"), "Parse complete" (fields populated), "Parse failed" (explicit error with retry button and fallback to manual entry).
- Validate client-side before upload: file type (PDF, DOCX only), file size (< 10MB), and display an error immediately — do not send the request and let the backend reject it after a 202.
- On the public onboarding: if parse fails, offer "Enter details manually" as a fallback path. Never leave the user on a dead-end screen.
- Implement a maximum poll timeout (90 seconds) after which show "This is taking longer than expected. We'll notify you when it's ready." — do not poll indefinitely.
- The upload button must be disabled after first click to prevent duplicate submissions. Re-enable only on failure.

**Warning signs:**
- Network tab: 202 received from resume upload but no subsequent GET requests to the status endpoint.
- Duplicate candidate records appearing in the TalentPool after user uploads resume twice.
- The upload button is not disabled after click — observable by clicking rapidly in dev tools.

**Phase to address:** Console Supply ingestion phase and Public site onboarding phase — both must use the shared `useAsyncJobStatus` hook with all terminal states handled.

---

### Pitfall 12: AI-Generated UI Slop — Generic Components Across Two Different Polish Bars

**What goes wrong:**
The Taste Skill generates components that look like generic shadcn dashboards — correct structure, wrong aesthetic. The public site ends up resembling the console (dense, utilitarian) because both use the same generated component starting points without post-generation customization. More specifically: spacing scale, font weight, border radius, and color choices are identical across both apps; the public site needs softer, more editorial treatment while the console needs higher information density. Design tokens are defined independently in each app's Tailwind config rather than in `packages/ui`, causing gradual divergence as each app's developers tweak their local tokens.

**Why it happens:**
AI code generation optimizes for "working and correct" over "aesthetically coherent with stated references." Without explicit design token constraints enforced at build time, individual developers make micro-decisions that accumulate into visual incoherence. The Taste Skill requires a brief (reference sites, brand intent, interaction model) to avoid generic output — omitting the brief produces generic output every time.

**How to avoid:**
- Before any Taste Skill invocation: write a brief in `packages/ui/DESIGN_BRIEF.md` covering (1) public site reference (contrario.ai: editorial, whitespace-heavy, strong typography hierarchy), (2) console reference (Linear/Attio: dense, keyboard-first, information-forward), (3) shared tokens (brand color, font family, border radius system), (4) divergence points (console uses tighter line-height and smaller base font than public site).
- Define all shared design tokens as CSS variables in `packages/ui/src/styles/tokens.css`. Both apps import this file. Neither app defines its own color tokens or spacing scale — they consume the shared tokens and use Tailwind theme extension to alias them.
- App-specific overrides (console's tighter density, public site's editorial spacing) live in `apps/console/styles/overrides.css` and `apps/web/styles/overrides.css`, each importing the shared tokens and overriding only the variables that differ.
- After each significant Taste Skill generation session: manually review generated components against the reference sites. Specifically check: font size, line height, card border radius, button style, color saturation. These are the dimensions where generated output diverges most from crafted design.
- Do not use the shadcn default gray palette — it reads as generic. Define a custom neutral scale in the shared tokens that matches the Brynzit brand.

**Warning signs:**
- The public site job board looks like a B2B SaaS admin panel.
- Both apps have identical card border-radius and button styling.
- `apps/web/tailwind.config.ts` and `apps/console/tailwind.config.ts` both define a `colors.brand` key with slightly different hex values.
- Components in `packages/ui` have hardcoded Tailwind color classes (`bg-slate-900`) instead of semantic token references (`bg-[var(--color-surface)]`).

**Phase to address:** Foundation phase — design token architecture must exist before first component is generated. Public site phase — the design brief must be written and Taste Skill prompted with references before any public-facing component is created.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hand-write MSW handlers without codegen | Faster initial setup | Handlers drift from real API, false confidence in tests | Never — set up Orval from day one |
| Skip `useAsyncJobStatus` shared hook, inline polling per feature | Feature shipped faster | 6+ places with subtly different polling logic, bugs compound | Never — shared hook before first async feature |
| Define design tokens in each app's tailwind config | No shared package setup needed | Token drift, visual inconsistency between apps | Never if both apps are in the same monorepo |
| Use `console` layout Server Component to fetch nav/user data | Clean data flow | Blocks entire console render until layout fetch resolves | Acceptable only if using Suspense wrapping |
| Skip `JobPosting` JSON-LD on initial job board ship | Faster MVP | Job listings never appear in Google for Jobs, hard to retrofit | Acceptable for week 1 private beta only |
| Skip contract proposal files for mock-first endpoints | Less upfront work | Backend implements different shape, full UI rewrite | Never — 1-hour investment prevents days of retrofit |
| Optimistic remove for bulk actions on infinite query | Snappy UX | Cache corruption on partial failure, scroll position loss | Never on cursor-paginated lists; use pending overlay |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| FastAPI OpenAPI → TypeScript types | Using `openapi-typescript-codegen` (unmaintained, broken Pydantic v2 nullables) | Use `openapi-typescript` or Orval; verify nullability on first generate |
| MSW in Next.js App Router (server-side) | Initializing MSW in a component; `async` Client Component for initialization | Use Next.js `instrumentation.ts` for server-side MSW; standard `beforeAll(server.listen())` in Vitest |
| MSW + RSC | Assuming MSW intercepts server-fetch calls — it only intercepts client-side fetch | Server-side mocking requires `msw/node` via `instrumentation.ts`; HMR does not propagate handler updates to the server runtime |
| TanStack Query + Next.js App Router | Hydrating QueryClient on server and sending to client with mismatched cache keys | Use `<HydrationBoundary>` with `dehydrate(queryClient)` in Server Components; ensure query keys are deterministic |
| Tailwind v4 + shared `packages/ui` | Relying on Tailwind's auto-scan to find components in workspace packages | Explicitly set `content` to include `../../packages/ui/src/**/*.{ts,tsx}` in each app's CSS entry point |
| pnpm + Next.js standalone output | Workspace packages not copied into `.next/standalone` | Verify `outputFileTracingIncludes` in `next.config.ts`; test standalone build before first deploy |
| Orval + TanStack Query v5 | Using Orval's React Query plugin without verifying v5 compatibility (breaking changes from v4) | Pin Orval version that explicitly supports TanStack Query v5; check generated hook signatures |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Layout-level data fetching blocking streaming | Console pages have 1-2s blank screen before any content | Fetch in leaf Server Components inside Suspense | Day one if pattern not established |
| Unconstrained polling (no visibility check, no completion stop) | CPU/network spike in background tabs; server 429s | `refetchIntervalInBackground: false`; disable interval when job complete | With 3+ concurrent async operations open |
| Infinite query refetch-all-pages after bulk mutation | Network bursts; scroll position reset; brief UI flash of old data | `pending overlay` pattern; `queryClient.cancelQueries` before mutation | When lead queue exceeds 3 cursor pages |
| No-store on public job listing pages | Every user request hits origin; no CDN benefit for high-traffic job pages | `next: { revalidate: 300 }` on job listing fetches | First time a job goes viral or is shared |
| Missing `generateStaticParams` for job slugs | Each job detail page SSR on first request; cold-start latency | Generate static params for all active roles at build time | At scale, or during traffic spike to popular listing |
| TanStack Query `staleTime: 0` default on console data | Every component mount triggers a refetch; excessive API calls | Set `staleTime: 30_000` globally for console, override to 0 only where live data is critical | With 20+ concurrent users of the console |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Console accessible without auth "just for now" with no plan | If console is accidentally exposed beyond trusted network, full recruiting pipeline is readable/writable | Document the trusted-network assumption explicitly; add HTTP basic auth or IP allowlist at the reverse proxy level even in v1 |
| MSW enabled in production build | API mocks intercept real API calls; private candidate data never reaches the backend | Use `NEXT_PUBLIC_API_MOCKING=enabled` env flag; MSW initialization wrapped in `if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled')` |
| Candidate resume files served without signed URLs | Resumes are PII; direct S3 URLs are permanent and shareable | All resume file access through the backend with short-lived signed URLs; never store a direct S3 URL in the frontend state |
| OpenAPI spec exposed publicly in production | Enumerates all backend endpoints for attackers | Disable `/api/v1/openapi.json` and `/docs` in production FastAPI config; frontend codegen runs against the dev/staging spec only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Async operation (import, outreach gen) shows no status after 202 | User re-submits, duplicate records; user leaves page assuming it failed | Immediate "Processing..." state, then live status from polling hook |
| Bulk approve/reject with no undo | Ops rep accidentally approves wrong leads; no recovery | 5-second "Undo" toast window; soft-delete pattern on the backend (leads transition to pending state, not immediately actioned) |
| Lead queue has no keyboard shortcuts | BD rep reviews 50+ leads/day; mouse-only is 3x slower | `j/k` for next/prev, `a/r/s` for approve/reject/snooze; focus management between cards |
| Resume parse failure shows raw error code | Candidate on onboarding sees "Error 422 Unprocessable Entity"; abandons | User-facing error: "We couldn't read your resume. Please try a PDF or DOCX file under 10MB, or enter your details manually." |
| Filter state not preserved in URL | User filters TalentPool by skills, opens a candidate profile, returns to pool — all filters lost | All filter state in URL search params; `useSearchParams` + `router.push` pattern |
| Public job board has no "Apply" CTA visible without scrolling | Qualified candidates miss the apply action | Sticky "Apply Now" button on job detail page; visible above the fold on mobile |
| Candidate dashboard shows empty state with no explanation when application is in early pipeline stage | Candidate thinks their application was lost | Explicit status stages with explanations: "Under Review", "Shortlisted", "Interview Scheduled" — not just empty |

---

## "Looks Done But Isn't" Checklist

- [ ] **MSW mocks:** Each mock handler types its response using the generated OpenAPI type, not a hand-written object literal — verify by removing the type and confirming TypeScript complains.
- [ ] **Async operations:** Every 202-pattern endpoint (imports, outreach gen, resume parse, enrichment) has all three terminal states handled in the UI: processing, completed, failed — not just the happy path.
- [ ] **Bulk actions:** Bulk approve/reject shows per-item failure states when a subset of items fail, not a single "something went wrong" toast.
- [ ] **Job board SEO:** Lighthouse SEO score >= 90, JSON-LD validates in Google's Rich Results Test, canonical URL is set on all filter pages.
- [ ] **Resume upload:** Disabled after first click, re-enabled on failure. File type and size validated before upload. Parse failure offers manual entry fallback.
- [ ] **Design tokens:** Running `grep -r "bg-slate\|text-slate\|bg-gray\|text-gray" apps/` returns zero results — all color usage goes through semantic tokens.
- [ ] **Polling:** Running the console with DevTools Network tab open shows polling requests stop when the operation completes, not when the component unmounts.
- [ ] **transpilePackages:** `apps/web/next.config.ts` and `apps/console/next.config.ts` both include `transpilePackages` for all workspace packages — verified by deleting `node_modules/.cache` and running a clean build.
- [ ] **Cursor pagination:** Invalidating the lead query after a bulk action produces the correct next page (not a page that skips or duplicates items) — manual test with 3+ pages loaded.
- [ ] **Console caching:** No `cache: 'force-cache'` or `revalidate` directives anywhere in `apps/console/` — grep confirms.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| MSW mock drift discovered late | HIGH | Diff MSW handler response shapes against live OpenAPI spec field-by-field; generate contract test suite; fix divergent fields; re-run against real API endpoint; expect 1-2 weeks of UI bug fixing |
| snake_case/camelCase mismatch discovered after 50+ components | HIGH | Add a runtime transform layer (interceptor in the API client that maps snake_case to camelCase); update all component prop access; 3-5 days work |
| Phantom dependencies break production deploy | MEDIUM | Add all missing deps to the offending package's `package.json`; clear `.turbo` cache; redeploy; 4-8 hours |
| Layout-level fetching causing blank screens | MEDIUM | Identify all `await` calls in layout files; move each fetch into a child Server Component with Suspense; 1-2 days refactor |
| Job board SEO not set up — noticed after indexing | MEDIUM | Add JSON-LD and canonical tags; resubmit sitemap; Google re-crawl takes 2-4 weeks; ranking loss during that window |
| Design token divergence between apps | LOW-MEDIUM | Consolidate tokens into shared CSS file; replace hardcoded color classes in both apps; 1-3 days |
| Hydration mismatches in production | LOW-MEDIUM | Identify affected components; wrap browser-API usage in `useEffect` or `dynamic(ssr: false)`; typically 1 day per component |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| MSW mock drift | Foundation (monorepo scaffold + API client) | Orval config generates both client and MSW handlers from the same spec; contract files exist for all mock-first endpoints |
| Pydantic v2 anyOf nullables | Foundation (API client setup) | Smoke test: 5 nullable fields typed `T \| null`, not `T` |
| snake_case/camelCase mismatch | Foundation (API client setup) | Integration test against live endpoint confirms field names at runtime |
| Turborepo phantom dependencies + transpilePackages | Foundation (monorepo scaffold) | Clean build (`rm -rf .next .turbo`) passes in both apps |
| Tailwind shared config and token divergence | Foundation (design system setup) | `grep -r "bg-slate\|bg-gray" apps/` returns zero; both apps import from `packages/ui/styles/tokens.css` |
| Over-server-componenting | Console BD phase (first review screen) | LeadQueue renders first content < 200ms (streaming); no `await` in layout files |
| Next.js 15 caching surprises | Foundation (Next.js 15 setup) | Documented caching strategy per app; console has no `force-cache`; job pages have explicit `revalidate` |
| Hydration mismatches | Per feature as encountered | No hydration errors in development console after each feature build |
| Polling anti-patterns | Console BD phase (CSV import — first 202 operation) | `useAsyncJobStatus` shared hook exists; no `setInterval` in `useEffect` in codebase |
| Cursor pagination + bulk action cache | Console BD phase (LeadQueue bulk actions) | Pending overlay pattern in place; no optimistic infinite query mutation; post-bulk invalidation tested with 3+ pages |
| Job board SEO failures | Public site phase (job board) | Lighthouse SEO >= 90; Rich Results Test passes for JobPosting schema |
| Resume upload UX failures | Console Supply phase + Public site onboarding | All terminal states rendered; button disabled on submit; parse failure shows manual entry fallback |
| AI-generated UI slop | Foundation (design brief + tokens) + Public site phase | Design brief written before first Taste Skill invocation; public site screenshotted against contrario.ai reference |

---

## Sources

- FastAPI/Pydantic v2 OpenAPI anyOf discussion: https://github.com/fastapi/fastapi/discussions/9900
- OpenAPI codegen tool comparison (2026): https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p
- Orval official site: https://orval.dev/
- Next.js App Router caching changes (v15): https://nextjs.org/blog/next-15
- Next.js fetch caching default change: https://realcoding.blog/en/2026/03/07/nextjs-15-fetch-cache-default-change/
- Next.js hydration error docs: https://nextjs.org/docs/messages/react-hydration-error
- React Server Components performance pitfalls: https://blog.logrocket.com/react-server-components-performance-mistakes
- TanStack Query optimistic updates: https://tanstack.com/query/v5/docs/framework/angular/guides/optimistic-updates
- TanStack infinite query invalidation discussion: https://github.com/TanStack/query/discussions/7569
- TanStack Query optimistic rollback discussion: https://github.com/TanStack/query/discussions/2734
- MSW + Next.js App Router integration: https://github.com/laststance/next-msw-integration
- MSW server-side limitations (Artem Zakharchenko): https://x.com/kettanaito/status/1749496339556094316
- Turborepo + Tailwind v4 setup: https://medium.com/@philippbtrentmann/setting-up-tailwind-css-v4-in-a-turbo-monorepo-7688f3193039
- pnpm workspaces strict dependency enforcement: https://nhost.io/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo
- Job board SEO best practices: https://cavuno.com/blog/job-board-seo
- JobPosting JSON-LD in Next.js: https://dev.to/ikoichi/how-to-add-schemaorg-to-a-nextjs-13-website-1cm6
- File upload UX best practices: https://uploadcare.com/blog/file-uploader-ux-best-practices/
- shadcn/ui AI-generated UI pitfalls: https://blog.codedthemes.com/shadcn-ui-mistakes/
- Design systems in the vibe-coding era: https://www.designsystemscollective.com/design-systems-for-the-vibe-coding-era-42282e1affef
- Async request-reply pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply
- API drift detection: https://www.wiz.io/academy/api-security/api-drift

---
*Pitfalls research for: Brynzit talent platform UI — Turborepo monorepo, two Next.js apps, FastAPI backend, mock-first development*
*Researched: 2026-06-12*
