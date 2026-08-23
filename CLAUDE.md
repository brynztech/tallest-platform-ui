<!-- GSD:project-start source:PROJECT.md -->
## Project

**Brynzit — Talent Platform UI**

The frontend for the Talent Platform backend (`../talent-platform`), shipped as two faces of one product under the **Brynzit** brand:

1. **Public candidate site** (`apps/web`) — a polished, contrario.ai/workatastartup-style site where candidates discover Brynzit, onboard (profile + resume), browse open roles, apply, and track their applications in a dashboard. This is how Brynzit onboards more job-seeking candidates into the supply pool.
2. **Internal console** (`apps/console`) — the ops tool where the internal team (2–4 people) runs the AI-automated recruiting pipelines: BD reps review leads and approve outreach, Ops reps manage clients → requisitions → interviews → placements, Supply reps source/search/shortlist/engage candidates, and Admin monitors agent costs, quotas, and prompts.

**Core Value:** Every human gate in the recruiting pipeline — lead review, outreach approval, shortlist review, engagement approval — is a fast, obvious screen in the console; and candidates get a public experience polished enough that they want to join the pool.

### Constraints

- **Tech stack**: TypeScript, Next.js (App Router), TanStack Query, Turborepo + pnpm workspaces — matches what the backend repo's planning anticipated
- **API boundary**: Backend repo is independent; the OpenAPI schema at `/api/v1` is the contract. No backend code changes from this repo — gaps are mocked and contract proposals documented
- **Async UX**: 202-style endpoints (imports, outreach generation, resume parse, enrichment) require polling/status patterns in the UI
- **No auth in v1 console**: trusted-network internal tool; structure should not make adding Okta later painful
- **Design**: Taste Skill governs generation; public site must reach contrario-level polish — a generic dashboard look is a failure condition for the public face
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Monorepo Layout (Turborepo + pnpm)
## Installation
# Root monorepo setup
# Core framework (per app)
# Data layer
# API client (in packages/api-client)
# UI foundation (packages/ui)
# Then: npx shadcn@latest init --cwd=packages/ui (interactive, choose Next.js + Tailwind v4)
# Forms + validation
# Drag and drop (console only)
# Mocking
# Testing
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
## Key Patterns for This Project
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## Recruiter-Module Feature Set (cross-repo tracking docs)

The 2026-08 recruiter-module work (JD upload intake, submit state, CTC/ECTC, notifications
passthrough, pipeline scoping) is documented across both repos. The backend repo is the source
of truth for behavior and API contracts:

- Spec: `../talent-platform/FEATURE_SPEC.md` · API: `../talent-platform/API_CHANGES.md` ·
  Events: `../talent-platform/NOTIFICATION_EVENTS.md`
- This repo: [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) (UI/state patterns found before
  building), [TEST_PLAN.md](TEST_PLAN.md), [AGENT_SETUP_NOTES.md](AGENT_SETUP_NOTES.md),
  [docs/recruiter-module-features.md](docs/recruiter-module-features.md)

## Prompt Contract

Before executing any substantive task, decide these five from my prompt and state them back to me:

1. **Goal** — what do I want?
2. **Context** — why / where?
3. **Constraints** — what should/shouldn't happen?
4. **Scope** — how far should it go?
5. **Done condition** — how do we know it's finished?

If all five are clear, state them and proceed. If a missing one could materially change the result, ask before editing files or causing side effects. Answer simple factual questions and status checks directly — no contract needed. This replaces the CPECD format from global preferences for this project.

## Docs Maintenance

Every feature or test change ships with a docs update in the same pass — features and tests are documented as they land, not later:

- **Frontend** work → `docs/` in this repo (`talent-platform-ui`)
- **Backend** work → `../talent-platform/docs/`

Update the existing doc covering the area; create a new one only when none exists. Test docs live alongside the feature doc they verify.

## Ponytail

Ponytail (full intensity) applies to all code changes in this repo — laziest working solution, ladder-first, shortest diff.
