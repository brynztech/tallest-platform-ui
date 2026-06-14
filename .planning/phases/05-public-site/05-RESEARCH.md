# Phase 5: Public Site — Research

**Researched:** 2026-06-14
**Domain:** Next.js 16 App Router public site — landing, job board, auth, onboarding, profile edit, apply flow, MSW contract mocks
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Landing Page (D-01–D-04)**
- D-01: Light mode only. `apps/web` is light-mode-first. No dark-mode toggle in Phase 5.
- D-02: Above-the-fold hero only. Single headline, 1-2 lines subtext, one CTA. No features grid, social proof, or footer.
- D-03: Large + light weight typography. 120px+ headline, `font-weight` 300–400, wide `letter-spacing`. Geist at light weight.
- D-04: Reference site: contrario.ai only. Editorial white background, large light type, minimal CTA, generous negative space.

**Job Board as Acquisition Funnel (D-05–D-08)**
- D-05: Job board is open to all visitors (no auth required to search/browse).
- D-06: Logged-out visitor sees 3-5 job cards fully; remaining cards blurred/locked. Signup gate overlay.
- D-07: Horizontal filter bar above results. Role type, location, remote toggle, seniority, skills as inline chips/selects. Removable filter pills.
- D-08: Text search debounced ~350ms. Filter dropdown changes trigger immediate query. All active params sent together in single `useInfiniteQuery` call. No explicit Submit button.

**Job Cards + Detail (D-09–D-10)**
- D-09: Job card fields: title, company name, location, compensation range (if available), top 3 skills, employment type badge, match strength badge (logged-in only).
- D-10: Job detail page `/jobs/[id]`: full JD, company context, compensation, all skills, seniority, employment type, `JobPosting` JSON-LD, canonical URL, Apply button (1-click if score >= 70, completion prompt if below). Optional note field <= 200 chars.

**Candidate Auth (D-11–D-13)**
- D-11: Mock auth via localStorage. Store `access_token`. `CandidateAuthContext` provides `isLoggedIn`, `candidate`, `signIn`, `signOut`. Reads localStorage on mount.
- D-12: Redirect flow: visitor clicks Apply → `/signup?redirect=/jobs/[id]` → after signup + onboarding → returned to job page.
- D-13: No email verification. Signup form: email + password + first/last name.

**Top Nav (D-14)**
- D-14: Sparse contrario.ai-style nav. Logged-out: Logo, "Jobs" link, "Sign in" ghost + "Join free" filled. Logged-in: Logo, "Jobs" link, "Dashboard" placeholder link, avatar dropdown ("My Profile", "Sign out").

**Onboarding Flow (D-15–D-18)**
- D-15: Resume upload is step 1. Async parse prefills subsequent steps. `useAsyncJob` polling pattern.
- D-16: 3-step onboarding: (1) resume upload + async parse, (2) confirm/edit prefilled profile fields, (3) preferences.
- D-17: Linear step indicator (Step N of 3). "Continue" / "Save & continue" button each step. "Skip for now" on step 3.
- D-18: Completeness meter driven by `completeness_score` from API (0–100). Score >= 70 gates 1-click apply. UI does NOT compute score independently.

**Profile Edit (D-19)**
- D-19: `/profile/edit` single-page form. Same fields as onboarding steps 2+3. `PUT /candidate/profile` MSW handler.

### Claude's Discretion

None — all decisions were locked in the discussion session.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUB-01 | Contrario-grade landing page driving signup | D-01–D-04 locked; `apps/web/app/page.tsx` placeholder confirmed; hero component pattern clear |
| PUB-02 | Candidate signup and login (mocked auth, swappable) | `CandidateAuthContext` localStorage pattern; contracts verified in `candidate-auth.yaml`; MSW stubs exist in `candidate.ts` |
| PUB-03 | Resume upload with async parsing prefilling profile | `useAsyncJob` from `packages/hooks` reusable; supply ingest `ResumeForm` is the reference pattern; new MSW handler + contract gap documented |
| PUB-04 | Stepped onboarding with progress indication | 3-step flow at `/onboarding/[step]`; react-hook-form + zod v4; form/command/scroll-area shadcn components needed |
| PUB-05 | Profile completeness meter gating 1-click apply | `completeness_score` field in `CandidateProfile` contract; `progress` shadcn component already installed |
| PUB-06 | Profile edit after onboarding | `/profile/edit` page; `PUT /candidate/profile` handler; same form structure as onboarding steps 2+3 |
| JOB-01 | Job board with instant-update search and filters | `useInfiniteQuery` cursor pattern (verified from BD leads page); `public-jobs.yaml` contract confirmed |
| JOB-02 | Job detail page with full JD and company context | `/jobs/[id]` route; `PublicJobItem` schema; single-column 720px layout |
| JOB-03 | `JobPosting` JSON-LD + canonical URLs | Next.js `generateMetadata` pattern; employment type mapping documented |
| JOB-04 | 1-click apply for complete profiles, completion prompt for incomplete | Apply POST contract gap identified; MSW handler needed; `completeness_score` gate |
| JOB-05 | Match-strength badges for logged-in candidates | `match_strength` field in `PublicJobItem` (strong/partial/none); badge component installed |
| JOB-06 | Anonymous public job search with limited preview | Logged-out gating: first 4 cards visible, rest blurred; `LockedJobsOverlay` pattern |
</phase_requirements>

---

## Summary

Phase 5 builds `apps/web` — the public candidate site. All infrastructure is already in place: the app shell exists with Geist font, MSW provider, QueryClientProvider, and `@source` CSS directives correctly wired. The phase's primary tasks are (a) filling in feature routes and components against the existing MSW contract stubs, and (b) expanding those stubs with realistic mock data.

The most important insight from investigating the codebase is that **all candidate endpoints are MSW-only** — they do not exist in the generated `packages/api-client/src/types/api.d.ts` because the backend has not shipped candidate-facing APIs yet. This means Phase 5 must use native `fetch()` with manually-typed response shapes for all candidate API calls, not `apiClient.GET/POST`. This is the same pattern already used for the supply resume upload in Phase 4.

Three integration challenges stand out. First, `apps/web/package.json` is missing several packages that the console has: `react-hook-form`, `@hookform/resolvers`, `zod`, `react-dropzone`, `sonner`, `lucide-react`, `next-themes`, `@tailwindcss/postcss` — all need to be added as Wave 0 tasks. Second, three shadcn components need to be added to `packages/ui` that do not exist yet: `form`, `command`, and `scroll-area`. Third, there is no `POST /candidate/applications` endpoint defined in the existing contracts or MSW handlers — the apply action needs a new contract stub and MSW handler.

**Primary recommendation:** Plan Wave 0 as dependency setup (package.json additions, shadcn component additions, postcss.config.mjs for apps/web, new MSW handlers), then Wave 1 as the static/nav layer (landing page, SiteNav, CandidateAuthContext), then Wave 2 as auth + onboarding flows, then Wave 3 as job board + detail + apply.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Landing page (SEO-critical) | Frontend Server (RSC) | Browser / Client (CTA button island) | Static hero content is RSC; CTA button needs router.push — extract as `'use client'` leaf |
| Job board list | Browser / Client | — | `useInfiniteQuery` + filter state management requires client interactivity; no SSR benefit given MSW-only mock data |
| Job detail page | Frontend Server (RSC) | Browser / Client (apply section island) | Page content (JD, company, JSON-LD) is RSC; apply button state + form is `'use client'` island |
| CandidateAuthContext | Browser / Client | — | localStorage reads require client; context provided in `_components/web-providers.tsx` |
| MSW initialization | Browser / Client | Node (instrumentation.ts) | Pattern already established in apps/web; `MSWProvider` + `instrumentation.ts` both wired |
| Forms (signup, onboarding, profile edit) | Browser / Client | — | All react-hook-form usage is `'use client'`; uncontrolled inputs |
| JSON-LD structured data | Frontend Server (RSC) | — | Next.js `generateMetadata` in RSC page files; zero client JS |
| Resume parse polling | Browser / Client | — | `useAsyncJob` is a React hook; lives in `'use client'` component |
| Candidate API calls | Browser / Client | — | All candidate endpoints are MSW-only mock endpoints; native fetch with manual types |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16.2.9 (catalog) | App Router, RSC, `generateMetadata` for JSON-LD | Already pinned in workspace catalog [VERIFIED: pnpm-workspace.yaml] |
| react | ^19.2.0 (catalog) | UI runtime; React Compiler | Pinned with Next.js 16 [VERIFIED: pnpm-workspace.yaml] |
| @tanstack/react-query | ^5.101.0 (catalog) | `useInfiniteQuery` for job board, `useQuery` for profile | Already in `apps/web/package.json` [VERIFIED: package.json] |
| zod | ^4.4.3 (catalog) | Form schemas for signup, profile, apply note | In catalog; already used in console [VERIFIED: pnpm-workspace.yaml] |
| react-hook-form | ^7.79.0 (catalog) | Forms with uncontrolled inputs | In catalog; used extensively in console [VERIFIED: pnpm-workspace.yaml] |
| @hookform/resolvers | ^5.4.0 (catalog) | Zod v4 adapter for react-hook-form | In catalog [VERIFIED: pnpm-workspace.yaml] |
| react-dropzone | ^15.0.0 (not in catalog — use console's version) | Resume file upload dropzone | Already in console package.json [VERIFIED: apps/console/package.json] |

### UI Foundation
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @brynzit/ui | workspace:* | All shadcn components, theme tokens | All UI components |
| lucide-react | ^1.18.0 (catalog) | Icons (MapPin, Upload, etc.) | All icon usage; tree-shakable |
| sonner | ^2.0.7 (pinned in packages/ui) | Toast notifications | All async feedback |
| next-themes | ^0.4.6 (in packages/ui deps) | Required by `sonner.tsx` component | Needed because `@brynzit/ui/components/ui/sonner.tsx` calls `useTheme()` |

### Missing from apps/web/package.json — Must Add
| Package | Source | Why Needed |
|---------|--------|------------|
| `react-hook-form` | catalog: | Signup, onboarding, profile edit forms |
| `@hookform/resolvers` | catalog: | Zod adapter for RHF |
| `zod` | catalog: | Form validation schemas |
| `react-dropzone` | ^15.0.0 (match console) | Resume upload in onboarding step 1 |
| `sonner` | ^2.0.7 (match console/ui) | Toast notifications |
| `lucide-react` | catalog: | Navigation icons, upload icon, MapPin etc. |
| `next-themes` | ^0.4.6 | Required by `@brynzit/ui/components/ui/sonner.tsx` (uses `useTheme`) |
| `@tailwindcss/postcss` | ^4.3.1 (match console devDep) | Tailwind v4 PostCSS plugin for production builds |

**Installation command for apps/web:**
```bash
pnpm --filter @brynzit/web add react-hook-form "@hookform/resolvers" zod react-dropzone@^15.0.0 sonner lucide-react next-themes
pnpm --filter @brynzit/web add -D @tailwindcss/postcss
```

**Also needed:** `apps/web/postcss.config.mjs` — the console has one but apps/web does not. [VERIFIED: file not found in apps/web; confirmed in console]

```js
// apps/web/postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

### shadcn Components to Add
Three components are NOT in `packages/ui/src/components/ui/` but are required: [VERIFIED: directory listing]

| Component | Command | Used For |
|-----------|---------|----------|
| `form` | `npx shadcn@latest add form --cwd=packages/ui` | react-hook-form integration (Field, FormItem, FormLabel, FormMessage) |
| `command` | `npx shadcn@latest add command --cwd=packages/ui` | Skills multi-select in onboarding step 2 + profile edit |
| `scroll-area` | `npx shadcn@latest add scroll-area --cwd=packages/ui` | Job board results viewport, command dropdown scroll |

**shadcn config location:** `packages/ui/components.json` — style: new-york, cssVariables: true, baseColor: neutral [VERIFIED: components.json]

---

## Architecture Patterns

### System Architecture Diagram

```
Visitor/Candidate Browser
        │
        ▼
apps/web Next.js 16 App Router
├── RSC Pages: /, /jobs, /jobs/[id]  ──────────────────────────────────────────────────┐
│   └── generateMetadata (JSON-LD, canonical)                                           │
│       ↓ suspense boundary                                                              │
│   Client Islands: <FilterBar/>, <ApplySection/>, <SiteNav/>                           │
│        │                                                                               │
│        ▼ useInfiniteQuery / useQuery / useMutation                                     │
│   TanStack Query (QueryClientProvider in web-providers.tsx)                           │
│        │                                                                               │
│        ▼ native fetch() — candidate endpoints (MSW-only)                              │
│   MSWProvider (service worker)                                                        │
│        │                    │                                                          │
│        ▼ intercepts         ▼ passes through (if not mocked)                          │
│   packages/mocks/candidate.ts handlers      real backend (localhost:8000)             │
│                                                                                        │
├── Client Pages: /signup, /login, /onboarding/[step], /profile/edit                   │
│   └── CandidateAuthContext (localStorage token)                                       │
│        │                                                                               │
│        ▼ form submit / profile PUT                                                     │
│   react-hook-form + zod v4 → native fetch() → MSW handler                            │
│                                                                                        │
└── packages/hooks/useAsyncJob ──── polls candidate resume parse status ────────────────┘
                                    (MSW handler for parse status endpoint)
```

### Route Structure
```
apps/web/app/
├── layout.tsx              # Root: Geist font, WebProviders (MSW + QueryClient)
├── globals.css             # Tailwind v4 @import, @source, theme.css import
├── page.tsx                # / — landing hero (RSC)
├── _components/
│   ├── web-providers.tsx   # QueryClientProvider + MSWProvider + CandidateAuthProvider
│   ├── msw-provider.tsx    # (already exists — don't modify)
│   └── site-nav.tsx        # <SiteNav /> — reads auth context
├── jobs/
│   ├── page.tsx            # /jobs — job board (client component)
│   └── [id]/
│       └── page.tsx        # /jobs/[id] — job detail (RSC + client island)
├── signup/
│   └── page.tsx            # /signup — auth card + form
├── login/
│   └── page.tsx            # /login — auth card + form
├── onboarding/
│   └── [step]/
│       └── page.tsx        # /onboarding/[step] — stepped flow
└── profile/
    └── edit/
        └── page.tsx        # /profile/edit — single-page profile form
```

### Pattern 1: cursor-paginated `useInfiniteQuery` for Job Board

The BD leads page (`apps/console/app/(shell)/bd/leads/page.tsx`) is the canonical reference. The job board mirrors this pattern with candidate-typed payloads via native fetch (not `apiClient`).

```typescript
// Source: verified from apps/console/app/(shell)/bd/leads/page.tsx
// Adapted for public/jobs MSW-only endpoint (no apiClient)

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
  queryKey: ['public-jobs', filters],
  queryFn: async ({ pageParam }) => {
    const params = new URLSearchParams()
    if (pageParam) params.set('cursor', pageParam)
    if (filters.q) params.set('q', filters.q)
    if (filters.role_type) params.set('role_type', filters.role_type)
    if (filters.location) params.set('location', filters.location)
    if (filters.remote) params.set('remote', 'true')
    if (filters.seniority) params.set('seniority', filters.seniority)
    filters.skills?.forEach(s => params.append('skills', s))
    params.set('limit', '20')

    const res = await fetch(`${API_BASE}/api/v1/public/jobs?${params}`)
    if (!res.ok) throw new Error(`Jobs fetch failed: ${res.status}`)
    return res.json() as Promise<PublicJobsResponse>
  },
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
})

const jobs: PublicJobItem[] = data?.pages.flatMap(page => page.items) ?? []
```

Key diff from leads: candidate endpoints use `native fetch()` not `apiClient.GET()` because candidate paths are not in the generated `api.d.ts`. [VERIFIED: grep confirmed no `/api/v1/candidate` paths in packages/api-client/src/types/api.d.ts]

### Pattern 2: Debounced search with immediate filter trigger

```typescript
// Source: UI-SPEC.md D-08 — 350ms debounce for text, immediate for dropdowns
import { useState, useEffect, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce' // OR manual setTimeout

// Manual debounce (no extra dependency):
const [searchText, setSearchText] = useState('')
const [debouncedText, setDebouncedText] = useState('')
const [filters, setFilters] = useState<JobFilters>({})

useEffect(() => {
  const timer = setTimeout(() => setDebouncedText(searchText), 350)
  return () => clearTimeout(timer)
}, [searchText])

// queryKey includes both debouncedText and immediate filters
// useInfiniteQuery resets when queryKey changes
```

Note: The above manual debounce avoids adding `use-debounce` as a dependency — preferred pattern since the console does the same.

### Pattern 3: CandidateAuthContext (localStorage mock auth)

```typescript
// Source: CONTEXT.md D-11 — design for easy swap when real auth ships
'use client'

type CandidateAuth = {
  isLoggedIn: boolean
  candidate: { id: string; email: string } | null
  signIn: (token: string, candidate: { id: string; email: string }) => void
  signOut: () => void
}

const CandidateAuthContext = createContext<CandidateAuth>(null!)

export function CandidateAuthProvider({ children }: { children: React.ReactNode }) {
  const [candidate, setCandidate] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    // Hydrate from localStorage on mount
    const token = localStorage.getItem('candidate_access_token')
    const stored = localStorage.getItem('candidate_data')
    if (token && stored) {
      try { setCandidate(JSON.parse(stored)) } catch { /* corrupt — ignore */ }
    }
  }, [])

  function signIn(token: string, data: { id: string; email: string }) {
    localStorage.setItem('candidate_access_token', token)
    localStorage.setItem('candidate_data', JSON.stringify(data))
    setCandidate(data)
  }

  function signOut() {
    localStorage.removeItem('candidate_access_token')
    localStorage.removeItem('candidate_data')
    setCandidate(null)
  }

  return (
    <CandidateAuthContext.Provider value={{ isLoggedIn: !!candidate, candidate, signIn, signOut }}>
      {children}
    </CandidateAuthContext.Provider>
  )
}
```

This context is added to `apps/web/app/_components/web-providers.tsx` alongside existing providers. [VERIFIED: web-providers.tsx structure]

### Pattern 4: react-hook-form + zod v4 (console reference)

The console uses bare `useForm` + `register` (no shadcn `form` component). Phase 5 upgrades to the shadcn `Form` wrapper which provides `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` — this must be added via `npx shadcn@latest add form`.

```typescript
// Source: verified from apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx
// Pattern: zod schema → zodResolver → useForm → handleSubmit
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const signupSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type SignupValues = z.infer<typeof signupSchema>

// With shadcn Form component (once added):
const form = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })
// form.handleSubmit(async (values) => { /* POST to MSW handler */ })
```

### Pattern 5: useAsyncJob for resume parse

The resume parse flow for the public site differs from the supply ingest pattern. Supply ingest posts to `/supply/resumes/upload` and polls `/supply/candidates/{id}`. The public site needs a new candidate-facing endpoint.

**Contract gap identified:** There is no `POST /candidate/profile/resume` endpoint in `.planning/contracts/`. A new MSW handler must be defined in this phase: `POST /api/v1/candidate/profile/resume` → 202 with `{ parse_id: string }` → `GET /api/v1/candidate/profile/resume/status/{parse_id}` → returns `{ status: "processing"|"complete"|"failed", profile_snapshot?: Partial<CandidateProfile> }`.

```typescript
// Source: CONTEXT.md D-15 + packages/hooks/src/use-async-job.ts (verified)

const [parseId, setParseId] = useState<string | null>(null)

const { phase, data } = useAsyncJob<ResumeParseStatus>({
  jobId: parseId,
  endpoint: '/api/v1/candidate/profile/resume/status/{id}',
  statusMap: { processing: 'pending', complete: 'complete', failed: 'failed' },
  refetchInterval: 2000,
})

// On phase === 'complete': auto-advance to step 2 after 800ms
// On phase === 'failed': show error toast, advance to step 2 with empty fields
```

`useAsyncJob` already handles the `{id}` interpolation in the `endpoint` string. [VERIFIED: use-async-job.ts lines 101-105]

### Pattern 6: JobPosting JSON-LD in Next.js 16

```typescript
// Source: REQUIREMENTS.md JOB-03 + UI-SPEC.md SEO Contract
// In /jobs/[id]/page.tsx — RSC with generateMetadata

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // fetch job from MSW handler (server-side, instrumentation.ts MSW server intercepts)
  return {
    alternates: {
      canonical: `https://brynzit.com/jobs/${params.id}`,
    },
  }
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await fetchJob(params.id) // native fetch — MSW server intercepts via instrumentation.ts

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description_summary ?? job.title,
    datePosted: job.date_posted,
    employmentType: { full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACTOR' }[job.employment_type],
    hiringOrganization: { '@type': 'Organization', name: job.company_name ?? 'Brynzit Client' },
    jobLocation: { '@type': 'Place', address: job.location ?? 'Remote' },
    ...(job.compensation_min ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: { '@type': 'QuantitativeValue', minValue: job.compensation_min, maxValue: job.compensation_max ?? job.compensation_min, unitText: 'YEAR' }
      }
    } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* page content */}
    </>
  )
}
```

**IMPORTANT:** `await params` is required in Next.js 16 — params is async. [VERIFIED: CLAUDE.md, next upgrade guide reference]

### Anti-Patterns to Avoid

- **`apiClient.GET/POST` for candidate endpoints:** These paths are not in the generated `api.d.ts`. Use native `fetch()` with locally-declared types. [VERIFIED: confirmed absence in api.d.ts]
- **Synchronous `params` access:** In Next.js 16, `params` must be `await`-ed in page components. Synchronous access causes a runtime error. [VERIFIED: CLAUDE.md warning]
- **`pages/` router:** App Router only. No `pages/` directory. [VERIFIED: CLAUDE.md]
- **Tailwind dark-mode overrides:** The `.dark` class block in `apps/web/app/globals.css` already exists but Phase 5 must not trigger it — no `<ThemeProvider>` dark mode, no `.dark` class on `<html>`. Light mode only. [VERIFIED: globals.css has .dark block but no ThemeProvider needed]
- **Computing `completeness_score` in the UI:** Score comes from the API response only. Never calculate client-side. [VERIFIED: CONTEXT.md D-18]
- **Zod v3 imports:** All new code uses `import { z } from 'zod'` — catalog pins zod@^4.4.3. [VERIFIED: pnpm-workspace.yaml]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation + error display | Custom validation + state | react-hook-form + zod v4 | Already in catalog; uncontrolled = no re-renders; shadcn Form component provides accessible error association |
| File drag-and-drop | `onDrop` + `onDragOver` handlers | react-dropzone v15 | Already in console; handles MIME type filtering, multi-file rejection, keyboard access |
| Async parse polling | `setInterval` + manual state | `useAsyncJob` from `packages/hooks` | Already built and tested; handles terminal states, `{id}` URL interpolation, stale check |
| Toast notifications | Custom toast state | `sonner` via `packages/ui/components/ui/sonner.tsx` | Already installed in packages/ui; consistent visual with console |
| Skills multi-select | Custom dropdown with search | shadcn `command` + `popover` | `command` provides searchable list with keyboard navigation; Radix handles focus traps |
| Cursor pagination | Custom page state | `useInfiniteQuery` with `getNextPageParam` | Pattern established in BD leads page; handles page flattening, `hasNextPage`, `isFetchingNextPage` |
| Scroll tracking for load-more | Scroll event listener | `IntersectionObserver` | Pattern from BD leads page (loadMoreRef); no scroll event overhead |
| JSON-LD structured data | Custom `<head>` management | Next.js `generateMetadata` + inline `<script>` | Next.js deduplicates and places correctly; `dangerouslySetInnerHTML` is the established RSC pattern for JSON-LD |

**Key insight:** The console phases already solved the hard infrastructure problems — cursor pagination, async polling, dropzone, form patterns. Phase 5 applies these to new routes, not new patterns.

---

## Common Pitfalls

### Pitfall 1: MSW Node Server Not Intercepting RSC Fetch

**What goes wrong:** Job detail page uses RSC `fetch()` for JSON-LD generation. MSW service worker runs in the browser only. The Node server-side MSW setup (`instrumentation.ts`) must intercept the server-side fetch.

**Why it happens:** `instrumentation.ts` is already set up to start the MSW node server [VERIFIED: apps/web/instrumentation.ts]. But it only runs when `NEXT_PUBLIC_API_MOCKING=enabled`. RSC pages that call `fetch()` server-side will get 404 from the real backend (or error) if the env var is not set.

**How to avoid:** For job detail RSC page: either make it a client component, or ensure the fetch has fallback mock data for development, or document that `NEXT_PUBLIC_API_MOCKING=enabled` must be set. Given the job board is also client-rendered via `useInfiniteQuery`, keeping `/jobs/[id]` as a client component (or adding a suspense boundary) is the simpler approach.

**Warning signs:** `fetch` returns 404 for `/api/v1/public/jobs/{id}` when rendering the job detail page server-side.

### Pitfall 2: `params` Async in Next.js 16

**What goes wrong:** `export default async function JobDetailPage({ params }: { params: { id: string } })` — accessing `params.id` synchronously in Next.js 16 causes a runtime error. Params must be awaited.

**Why it happens:** Next.js 16 made `params` fully async. [VERIFIED: CLAUDE.md]

**How to avoid:** Always use `const { id } = await params` in page components.

### Pitfall 3: Sonner Toaster Requires next-themes

**What goes wrong:** Adding `<Toaster />` from `@brynzit/ui/components/ui/sonner` without `next-themes` installed in `apps/web` causes a module resolution error because `sonner.tsx` imports `useTheme` from `next-themes`.

**Why it happens:** `packages/ui` has `next-themes` as a direct dependency, but `apps/web` doesn't have it and `transpilePackages` doesn't auto-resolve peer deps. [VERIFIED: packages/ui/package.json has next-themes; apps/web/package.json does not]

**How to avoid:** Add `next-themes` to `apps/web/package.json`. No ThemeProvider needed — just having it installed resolves the import. For apps/web, pass `theme="light"` to `<Toaster>` directly to avoid `useTheme` needing a provider.

**Alternative:** Wrap `<Toaster>` in `WebProviders` with a minimal `ThemeProvider` forced to `light`.

### Pitfall 4: apply POST Endpoint Not in Contracts

**What goes wrong:** The phase requires a "1-click apply" action (JOB-04). The existing `candidate-applications.yaml` contract only defines `GET /candidate/applications`. There is no `POST` endpoint. Building apply without a defined MSW handler will result in a 404 during testing.

**Why it happens:** The apply endpoint was not defined in Phase 1 contracts. [VERIFIED: candidate-applications.yaml has GET only; no POST handler in candidate.ts]

**How to avoid:** Wave 0 must define the contract and add an MSW handler:
- Contract: `POST /api/v1/candidate/applications` with body `{ job_id: string, note?: string }` → 201 with `CandidateApplication`
- MSW handler in `packages/mocks/src/handlers/candidate.ts`

### Pitfall 5: Dark Mode CSS Block in globals.css

**What goes wrong:** `apps/web/app/globals.css` already contains a `.dark {}` block with dark-mode token overrides. If any component adds a `dark` class to `<html>` or a parent element (e.g., accidentally installing `next-themes` with `defaultTheme="system"`), the site will render in dark mode.

**Why it happens:** The `.dark` block was added to the app shell in Phase 1 as a scaffold but Phase 5 is light-mode-only.

**How to avoid:** Do not add `ThemeProvider` with dark mode; if `ThemeProvider` is added for Sonner's `useTheme`, force `theme="light"` and `forcedTheme="light"`. [VERIFIED: globals.css has .dark block; CONTEXT.md D-01 is light-mode-only]

### Pitfall 6: Skills multi-select with Command + Popover

**What goes wrong:** shadcn `command` component needs to be added to `packages/ui` before building the skills multi-select. Running `shadcn add command` against the wrong working directory (an app directory instead of `packages/ui`) copies the file to the wrong location.

**How to avoid:** Always run `npx shadcn@latest add [component] --cwd=packages/ui` — the `--cwd` flag targets the package with `components.json`. [VERIFIED: components.json is in packages/ui]

---

## Code Examples

### Candidate Type Definitions (local, not from api.d.ts)

Since candidate API paths are absent from generated types, Phase 5 must declare local types. Best practice: co-locate with the module that uses them.

```typescript
// apps/web/app/_lib/candidate-types.ts
// Types derived from .planning/contracts/*.yaml — delete and import from api.d.ts when backend ships

export type PublicJobItem = {
  id: string
  title: string
  company_name: string | null
  employment_type: 'full_time' | 'part_time' | 'contract'
  location: string | null
  remote: boolean
  seniority: string | null
  skills: string[]
  date_posted: string
  description_summary: string | null
  compensation_min: number | null
  compensation_max: number | null
  match_strength: 'strong' | 'partial' | 'none' | null
}

export type PublicJobsResponse = {
  items: PublicJobItem[]
  next_cursor: string | null
}

export type CandidateProfile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  headline: string | null
  location: string | null
  remote_preference: 'remote_only' | 'hybrid' | 'onsite' | 'flexible' | null
  seniority: 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | null
  skills: string[]
  github_url: string | null
  linkedin_url: string | null
  resume_url: string | null
  completeness_score: number | null
  enrichment_status: 'pending' | 'enriched' | 'failed' | null
}

export type CandidateProfileUpdate = Partial<Omit<CandidateProfile, 'id' | 'email' | 'enrichment_status' | 'github_signals'>>
```

### Expanded MSW Handler: public/jobs with realistic data

```typescript
// packages/mocks/src/handlers/candidate.ts — replace stub with realistic data
http.get(`${API_BASE}/api/v1/public/jobs`, ({ request }) => {
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const q = url.searchParams.get('q')?.toLowerCase()

  // 12 mock jobs; return first 6, then next 6 on cursor
  const allJobs: PublicJobItem[] = MOCK_JOBS
  const filtered = q ? allJobs.filter(j => j.title.toLowerCase().includes(q)) : allJobs
  const offset = cursor ? 6 : 0
  const page = filtered.slice(offset, offset + 6)

  return HttpResponse.json({
    items: page,
    next_cursor: page.length === 6 && offset === 0 ? 'cursor-page-2' : null,
  })
}),
```

### Logged-out gating pattern for job board

```typescript
// Source: UI-SPEC.md — "blur everything beyond index 4"
function JobGrid({ jobs, isLoggedIn }: { jobs: PublicJobItem[]; isLoggedIn: boolean }) {
  const VISIBLE_LIMIT = 4 // show 4 fully, blur the rest

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {jobs.map((job, idx) => {
        const isLocked = !isLoggedIn && idx >= VISIBLE_LIMIT
        return (
          <div key={job.id} className="relative">
            <div
              aria-hidden={isLocked}
              className={isLocked ? 'blur-[4px] pointer-events-none select-none' : undefined}
            >
              <JobCard job={job} isLoggedIn={isLoggedIn} />
            </div>
          </div>
        )
      })}
      {!isLoggedIn && jobs.length > VISIBLE_LIMIT && (
        <LockedJobsOverlay />  // absolute centered overlay
      )}
    </div>
  )
}
```

---

## MSW Handler Gaps for Phase 5

All candidate handlers exist as stubs. Phase 5 must:

| Handler | Current State | Required State |
|---------|--------------|----------------|
| `GET /public/jobs` | Returns `{ items: [], next_cursor: null }` | Returns 12 realistic jobs with all `PublicJobItem` fields populated |
| `POST /candidate/auth/signup` | Returns minimal `{ id, email }` | Returns correct 201; adds mock `access_token` behavior to login |
| `POST /candidate/auth/login` | Returns `{ access_token: 'mock-token' }` | Returns token + `expires_in` for realistic behavior; 401 for wrong password |
| `GET /candidate/profile` | Returns minimal `{ id, first_name, last_name }` | Returns full `CandidateProfile` shape with all nullable fields |
| `PUT /candidate/profile` | Returns minimal profile | Returns updated profile with recalculated `completeness_score` |
| `GET /candidate/applications` | Returns `{ items: [], next_cursor: null }` | Returns 2-3 applications with realistic `status` + `substep_label` |
| `POST /candidate/applications` | **MISSING** | New handler: `{ job_id, note? }` → 201 with `CandidateApplication` |
| `POST /candidate/profile/resume` | **MISSING** | New handler: multipart or JSON → 202 with `{ parse_id: string }` |
| `GET /candidate/profile/resume/status/{id}` | **MISSING** | New handler: returns `{ status: "processing"\|"complete"\|"failed" }` |
| `GET /public/jobs/{id}` | **MISSING** | New handler: returns single `PublicJobItem` for detail page |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwindcss-animate` | `tw-animate-css` | Tailwind v4 release | Avoid the old package — `tw-animate-css` already in packages/ui catalog |
| `next/headers` / `next/cookies` sync | `await cookies()`, `await headers()`, `await params` | Next.js 16 | Runtime error if synchronous access is used |
| `pages/` router | `app/` App Router only | Next.js 13+ | `pages/` is legacy maintenance mode in Next.js 16 |
| Zod v3 | Zod v4 (`zod@^4.4.3`) | 2025 | 100x fewer TS instantiations; catalog already pins v4 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GET /public/jobs/{id}` is the correct path for fetching a single job on the detail page | MSW Handler Gaps | The contract only defines list endpoint; if the shape/path differs, MSW handler and type definitions need updating |
| A2 | Resume parse for candidates should use `POST /candidate/profile/resume` and poll `GET /candidate/profile/resume/status/{id}` | Pattern 5 | This contract gap is being filled in Phase 5; if the eventual backend uses a different shape, the MSW mock must be updated |
| A3 | `apply POST` endpoint is `POST /candidate/applications` with body `{ job_id, note? }` | MSW Handler Gaps | Contract undefined — pattern is reasonable but user should confirm before backend ships |
| A4 | `apps/web` does not need a `ThemeProvider` for Sonner — `theme="light"` prop on `<Toaster>` is sufficient | Pitfall 3 | If Sonner's `useTheme` is called at module level (not in a hook), it would throw without a provider |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **Resume parse endpoint for candidates**
   - What we know: Supply ingest uses `POST /supply/resumes/upload`. Candidate-facing resume parse is a new mock-only endpoint.
   - What's unclear: Whether the final backend will use a different polling mechanism (e.g., poll the candidate profile's `completeness_score` changing rather than a dedicated status endpoint).
   - Recommendation: Define `POST /candidate/profile/resume` + status endpoint in Phase 5 MSW as a reasonable contract. Document the endpoint in a contract YAML file for swap-readiness.

2. **Job detail page: RSC vs client component**
   - What we know: JSON-LD is best generated server-side. But all data is MSW-only, and MSW server requires `NEXT_PUBLIC_API_MOCKING=enabled`.
   - What's unclear: Whether the planner prefers a pure RSC job detail page (requires server-side MSW) or a client-rendered page (uses browser service worker).
   - Recommendation: Make `/jobs/[id]` a client component (`'use client'`) for consistency with the job board. JSON-LD can be injected via `useEffect` or by a minimal RSC wrapper that passes static metadata. This avoids the server-side MSW complexity.

3. **Signup response and token storage**
   - What we know: Signup returns `{ id, email }` (no token). Login returns `{ access_token }`.
   - What's unclear: Whether the signup flow should auto-login (call login internally after signup) or redirect to login for a separate login step.
   - Recommendation: Auto-login after signup (store mock token immediately from signup response — enhance the MSW handler to also return `access_token` on 201). This matches D-12 which describes post-signup flow going directly to onboarding without a separate login step.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, pnpm, Next.js | ✓ | v25.9.0 | — |
| pnpm | Workspace dependency management | ✓ | 11.6.0 | — |
| shadcn CLI (npx) | Adding form/command/scroll-area components | ✓ | via npx | — |
| @tailwindcss/postcss | Tailwind v4 production builds for apps/web | ✗ (not in apps/web devDeps) | — | Add to apps/web package.json in Wave 0 |
| react-hook-form | Signup/onboarding/profile forms | ✗ (not in apps/web deps) | — | Add to apps/web package.json in Wave 0 |
| react-dropzone | Resume upload dropzone | ✗ (not in apps/web deps) | — | Add to apps/web package.json in Wave 0 |

**Missing dependencies with no fallback:**
- None — all missing items have clear install paths as Wave 0 tasks

**Missing dependencies with Wave 0 install:**
- `react-hook-form`, `@hookform/resolvers`, `zod`, `react-dropzone`, `sonner`, `lucide-react`, `next-themes` — add to `apps/web/package.json`
- `@tailwindcss/postcss` — add to `apps/web` devDependencies
- `apps/web/postcss.config.mjs` — create (matches console)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.1.8 |
| Config file | `apps/web/vitest.config.ts` — Wave 0 gap |
| Quick run command | `pnpm --filter @brynzit/web test` |
| Full suite command | `pnpm --filter @brynzit/web test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUB-01 | Landing page renders hero with contrario-grade layout | smoke/visual | Playwright: `expect(page.locator('h1')).toBeVisible()` | ❌ Wave 0 |
| PUB-02 | Signup form validates and stores token in localStorage | unit | `vitest: renders SignupForm, submits, checks localStorage` | ❌ Wave 0 |
| PUB-02 | Login form 401 shows toast | unit | `vitest: MSW handler returns 401, toast appears` | ❌ Wave 0 |
| PUB-03 | Resume upload triggers useAsyncJob polling | unit | `vitest: ResumeUploadForm, MSW handler, phase transitions` | ❌ Wave 0 |
| PUB-04 | Onboarding step 2 pre-populates from parse | unit | `vitest: step 2 fields populated from profile query` | ❌ Wave 0 |
| PUB-05 | Completeness meter shows score and gate label when <70 | unit | `vitest: renders CompletenessMeter with score=50, checks label` | ❌ Wave 0 |
| PUB-06 | Profile edit PUT updates and shows toast | unit | `vitest: ProfileEditForm submit, MSW PUT, toast success` | ❌ Wave 0 |
| JOB-01 | Job board renders cards from useInfiniteQuery | unit | `vitest: renders JobBoard with MSW handler returning 6 jobs` | ❌ Wave 0 |
| JOB-01 | Filter changes trigger query reset | unit | `vitest: change role_type filter, queryKey updates` | ❌ Wave 0 |
| JOB-03 | JSON-LD script tag rendered with correct @type | unit | `vitest: job detail page has script[type=application/ld+json]` | ❌ Wave 0 |
| JOB-04 | Apply button disabled and shows prompt when score <70 | unit | `vitest: ApplySection with completeness_score=60, checks state` | ❌ Wave 0 |
| JOB-05 | Match badge not rendered for logged-out visitors | unit | `vitest: JobCard logged-out, no match badge rendered` | ❌ Wave 0 |
| JOB-06 | Cards beyond index 4 are blurred when logged out | unit | `vitest: JobGrid logged-out, 8 cards, cards[4+] have blur class` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter @brynzit/web test --run`
- **Per wave merge:** `pnpm turbo test` (full monorepo)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` — vitest setup for jsdom environment
- [ ] `apps/web/src/__tests__/landing.test.tsx` — covers PUB-01
- [ ] `apps/web/src/__tests__/auth.test.tsx` — covers PUB-02
- [ ] `apps/web/src/__tests__/onboarding.test.tsx` — covers PUB-03, PUB-04, PUB-05
- [ ] `apps/web/src/__tests__/profile.test.tsx` — covers PUB-06
- [ ] `apps/web/src/__tests__/job-board.test.tsx` — covers JOB-01, JOB-05, JOB-06
- [ ] `apps/web/src/__tests__/job-detail.test.tsx` — covers JOB-02, JOB-03, JOB-04

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` [VERIFIED: .planning/config.json]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (mocked) | localStorage token with clear signOut path; no real session — Phase 5 mock only; real auth in v2 |
| V3 Session Management | yes (partial) | localStorage token cleared on signOut; no expiry enforcement in mock — acceptable for mock-first auth |
| V4 Access Control | yes | Routes `/onboarding/[step]`, `/profile/edit` require `isLoggedIn` check with redirect to `/login`; apply action requires auth |
| V5 Input Validation | yes | zod v4 for all forms (signup: email format + min-length password; profile: URL format for github/linkedin; apply note: maxLength 200) |
| V6 Cryptography | no | No cryptographic operations in Phase 5 — localStorage token is a mock opaque string |

### Known Threat Patterns for Phase 5 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via `?redirect=` param | Tampering | Validate redirect param: only allow relative paths starting with `/`; reject external URLs |
| XSS via job description content | Tampering | Render JD text as `whitespace-pre-wrap` plain text, NOT `dangerouslySetInnerHTML`; JSON-LD is the only `dangerouslySetInnerHTML` usage and it's constructed from typed data |
| Prototype pollution via localStorage parse | Tampering | `try/catch` on `JSON.parse(localStorage.getItem('candidate_data'))` — already shown in CandidateAuthContext pattern |
| URL injection in job links (github_url, linkedin_url) | Tampering | `safeHref()` pattern already established in `CandidateProfileSheet` (Phase 4) — reuse; reject `javascript:` and `data:` protocols |

**Open redirect mitigation (critical for D-12 redirect flow):**
```typescript
// Validate redirect param before use
function safeRedirect(param: string | null): string {
  if (!param) return '/jobs'
  // Only allow relative paths
  if (param.startsWith('/') && !param.startsWith('//')) return param
  return '/jobs'
}
```

---

## Sources

### Primary (HIGH confidence)
- `packages/mocks/src/handlers/candidate.ts` — current MSW stub state [VERIFIED: read directly]
- `packages/hooks/src/use-async-job.ts` — useAsyncJob API signature [VERIFIED: read directly]
- `apps/web/app/layout.tsx`, `_components/web-providers.tsx`, `_components/msw-provider.tsx` — app shell state [VERIFIED: read directly]
- `apps/web/app/globals.css` — Tailwind config, dark mode block [VERIFIED: read directly]
- `apps/web/package.json` — missing packages confirmed [VERIFIED: read directly]
- `packages/ui/src/components/ui/` directory listing — installed shadcn components [VERIFIED: ls command]
- `packages/ui/components.json` — shadcn config (style: new-york, neutral, cssVariables) [VERIFIED: read directly]
- `.planning/contracts/public-jobs.yaml`, `candidate-auth.yaml`, `candidate-profile.yaml`, `candidate-applications.yaml` — API contract schemas [VERIFIED: read directly]
- `pnpm-workspace.yaml` — catalog version pins [VERIFIED: read directly]
- `apps/console/app/(shell)/bd/leads/page.tsx` — cursor pagination pattern [VERIFIED: read directly]
- `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx` — resume upload + polling pattern [VERIFIED: read directly]
- `apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx` — RHF + zod v4 pattern [VERIFIED: read directly]
- `packages/api-client/src/types/api.d.ts` — confirmed absence of candidate endpoints [VERIFIED: grep]
- `.planning/config.json` — security_enforcement true, nyquist_validation true [VERIFIED: read directly]

### Secondary (MEDIUM confidence)
- `apps/console/app/layout.tsx` — Toaster placement pattern (add to apps/web layout) [VERIFIED: read directly]
- `.planning/STATE.md` — open redirect validation note, snake_case constraint [VERIFIED: read directly]
- `packages/api-client/src/types/extensions.ts` — LeadQueueItemExtended pattern for MSW-only type extensions [VERIFIED: read directly]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from workspace catalog and package.json files
- Architecture: HIGH — full app shell read directly; all existing patterns confirmed from console source
- Pitfalls: HIGH — identified from direct file inspection (dark mode block, missing packages, absent contracts)
- MSW handler gaps: HIGH — confirmed by reading every handler in candidate.ts

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable libraries; re-verify if shadcn or Next.js releases minor updates)
