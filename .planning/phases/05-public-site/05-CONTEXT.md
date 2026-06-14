# Phase 5: Public Site - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `apps/web` — the public-facing Brynzit site. A visitor can discover Brynzit on a contrario-grade landing page, search open roles on a job board that gates deeper access behind signup, sign up as a candidate (mocked auth), upload a resume that async-parses into their profile, complete a 3-step onboarding flow, browse and filter jobs with debounced live search, view job detail pages with JobPosting JSON-LD, and apply in one click when their profile completeness score is ≥ 70 — all against MSW contract mocks.

The phase covers PUB-01 through PUB-06 and JOB-01 through JOB-05 (PUB-07, DASH-01, DASH-02 are Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Landing Page (D-01–D-04)
- **D-01:** **Light mode only.** `apps/web` is light-mode-first. No dark-mode toggle in Phase 5. The existing `theme.css` light-mode `:root` tokens are the right foundation.
- **D-02:** **Above-the-fold hero only.** Single strong headline explaining Brynzit's value, 1-2 lines of subtext, one CTA button ("Join the talent pool" or equivalent). No scrolling required to convert. No features grid, social proof, or footer in Phase 5. Contrario.ai-style single-purpose page.
- **D-03:** **Large + light weight typography.** 120px+ headline at `font-weight` 300–400, wide `letter-spacing`. Geist (already configured) at light weight. Contrario.ai / Vercel / linear.app style — confident minimalism.
- **D-04:** **Reference site: contrario.ai only.** Editorial white background, large light type, minimal CTA, generous negative space.

### Job Board as Acquisition Funnel (D-05–D-08)
- **D-05:** **Job board is open to all visitors** (no auth required to search and view limited results). This is the primary acquisition surface — not just the landing page CTA.
- **D-06:** **Logged-out visitor sees limited results: 3-5 job cards with blurred/locked details.** To "See all matches," save jobs, apply, or get AI-matched roles, visitor is prompted to sign up. This creates a natural progression from discovery → signup → onboarding.
- **D-07:** **Horizontal filter bar above results.** Role type, location, remote toggle, seniority, skills as inline filter chips / select dropdowns. Removable filter pills appear below when active. Not a sidebar — this is a public site, not a console.
- **D-08:** **Debounced server-side query (~350ms).** Text input debounced ~350ms; filter dropdown changes trigger an immediate API call. All active params sent together. Filter pills update live. No explicit Submit button for search (contradicts "instant-update" requirement).

### Job Cards + Detail (D-09–D-10)
- **D-09:** **Job card fields:** title, company name, location, compensation range (if available), top 3 skills, employment type badge, match strength badge ("Strong match" / "Partial match" — logged-in candidates only). No description summary on the card — save for detail page.
- **D-10:** **Job detail page** (`/jobs/[id]`): full JD, company context, compensation, all skills, seniority, employment type, `JobPosting` JSON-LD structured data, canonical URL, Apply button (1-click if profile ≥ 70, short completion prompt if below). Optional note field ≤200 chars (no cover letter).

### Candidate Auth (D-11–D-13)
- **D-11:** **Mock auth via localStorage.** Store `access_token` from `/candidate/auth/login` or `/candidate/auth/signup` in localStorage. React context (`CandidateAuthContext`) provides `isLoggedIn`, `candidate` (id, email), `signIn`, `signOut`. Context reads localStorage on mount to hydrate. Interface designed for easy swap when real backend ships.
- **D-12:** **Redirect flow for logged-out apply:** Visitor clicks Apply → redirected to `/signup?redirect=/jobs/[id]` → after signup + onboarding → returned to job page → apply is now 1-click available.
- **D-13:** No email verification in Phase 5 (mock auth — signup succeeds immediately). Signup form: email + password + first/last name (matches contract schema).

### Top Nav (D-14)
- **D-14:** **Minimal top nav with auth state:**
  - Logged-out: Logo (left), "Jobs" link (center-ish), "Sign in" + "Join" buttons (right)
  - Logged-in: Logo (left), "Jobs" link, then right side: profile avatar dropdown (with "My Profile" and "Sign out"), "Dashboard" link (Phase 6 placeholder — visible but routes to a "Coming soon" or placeholder in Phase 5)
  - Sparse, contrario.ai-style. No marketing links (How it works, About, etc.).

### Onboarding Flow (D-15–D-18)
- **D-15:** **Resume upload is step 1.** Async parse prefills subsequent steps. Same `useAsyncJob` polling pattern as supply enrichment in Phase 4.
- **D-16:** **3-step onboarding:**
  1. Resume upload + async parse (react-dropzone, `useAsyncJob`, progress indicator while parsing)
  2. Confirm/edit prefilled profile fields: name, headline, current title/company, experience summary, skills (up to 10)
  3. Preferences: location, remote preference (remote_only / hybrid / onsite / flexible), seniority, GitHub URL, LinkedIn URL
- **D-17:** **Progress indication:** linear step indicator (Step 1 of 3 / 2 of 3 / 3 of 3). Each step has a "Continue" / "Save & continue" button. "Skip for now" option on step 3 (preferences are optional).
- **D-18:** **Completeness meter:** Backend's `completeness_score` field (0–100) drives the meter. Score ≥ 70 gates 1-click apply. Below threshold: "Complete your profile to apply in one click" message with a link to the profile edit page.

### Profile Edit (D-19)
- **D-19:** Candidate can edit their profile at `/profile/edit` without re-running the onboarding wizard. Same fields as onboarding steps 2 and 3. Single-page form with save (no stepped flow). `PUT /candidate/profile` MSW handler.

### Carried Forward (unchanged from prior phases)
- **`useAsyncJob`** from `packages/hooks`: resume parse polling (same terminal states — complete / failed — as supply enrichment)
- **Sheet / slide-over pattern**: not primary UX on the public site, but available for modal-style details if needed
- **Zod v4 + react-hook-form**: for signup form, profile edit form, apply note field
- **TanStack Query**: for job list (useInfiniteQuery with cursor pagination per contracts), profile fetch, applications
- **MSW contract architecture**: all candidate endpoints are mock-first; delete handler to swap to real

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — PUB-01 through PUB-06, JOB-01 through JOB-05 requirement definitions
- `.planning/ROADMAP.md` §Phase 5 — Goal, success criteria (6 items)

### API Contracts (all mock-first — MSW only)
- `.planning/contracts/candidate-auth.yaml` — POST `/candidate/auth/signup`, POST `/candidate/auth/login` contracts
- `.planning/contracts/candidate-profile.yaml` — GET/PUT `/candidate/profile`, `CandidateProfile` schema (includes `completeness_score`, `enrichment_status`, `github_signals`)
- `.planning/contracts/public-jobs.yaml` — GET `/public/jobs` cursor-paginated with all filter params, `PublicJobItem` schema (title, company, location, remote, seniority, skills, comp range, `match_strength`)
- `.planning/contracts/candidate-applications.yaml` — GET `/candidate/applications` cursor-paginated, `CandidateApplication` schema with status enum + `substep_label`

### Existing MSW Stubs (expand, don't replace)
- `packages/mocks/src/handlers/candidate.ts` — Current stub handlers: public/jobs (empty array), signup, login, GET/PUT profile, GET applications. Phase 5 fills these with realistic mock data.

### Existing Infrastructure (reuse, don't rebuild)
- `packages/hooks/src/use-async-job.ts` — Resume parse polling (same pattern as supply enrichment; endpoint: poll `/supply/resumes/upload` or a new `/candidate/profile/resume/status` — confirm with API contract)
- `packages/ui/src/components/ui/` — Available: button, badge, card, checkbox, dialog, input, label, popover, progress, select, separator, sheet, skeleton, sonner, table, tabs, textarea. Still needed: form (RHF integration), scroll-area, command (for skills multi-select?), separator
- `packages/ui/src/styles/theme.css` — Light-mode tokens at `:root`. `apps/web` uses these directly. Do NOT add dark-mode overrides in Phase 5.
- `apps/web/app/layout.tsx` — Root layout: Geist font, WebProviders (QueryClient + MSW). Phase 5 adds the top nav here.
- `apps/web/app/_components/web-providers.tsx` — Add `CandidateAuthContext` provider here (alongside QueryClientProvider + MSWProvider)

### Phase History (patterns to carry forward)
- `.planning/phases/04-console-supply-admin/04-CONTEXT.md` — `useAsyncJob` enrichment pattern (D-06), ingest async pattern (D-08–D-11), `CandidateProfileSheet` shared component — Phase 5 builds the public profile edit page (different surface, same API contract)
- `.planning/phases/02-console-bd/02-CONTEXT.md` — `useInfiniteQuery` cursor pagination pattern for job board (mirrors lead queue)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAsyncJob` (`packages/hooks`): resume upload/parse polling — same 202 pattern as supply enrichment; reuse with endpoint pointing to resume parse status
- `progress` shadcn component: already installed — use for onboarding step indicator and completeness meter
- `react-dropzone`: in `apps/console/package.json` — need to add to `apps/web/package.json` for resume upload
- `react-hook-form` + `zod@^4`: for signup form (email/password/name validation), profile edit form, apply note field (≤200 char limit)
- `sonner` toast: for async parse completion ("Profile updated from resume"), apply success, auth errors
- `skeleton` component: for job cards loading state and profile fields while async parse is running
- `badge` component: for match strength badges, employment type, skills, seniority

### Established Patterns
- **MSW handler pattern:** `${API_BASE}/api/v1/...` prefix on all handlers (from `../base-url`)
- **Cursor pagination with `useInfiniteQuery`:** mirrors BD lead queue (`apps/console/app/(shell)/bd/leads/`) — Phase 5 applies same pattern to `/public/jobs`
- **`useAsyncJob` for resume parse:** same flow as supply enrichment — POST to trigger, poll GET until complete/failed, refetch profile on completion
- **Auth context pattern:** localStorage token → React context → `isLoggedIn` + candidate data — designed for mock-first, swappable
- **Redirect-after-auth:** `/signup?redirect=/jobs/[id]` → after onboarding → push to redirect param

### Integration Points
- `apps/web/app/layout.tsx`: Add `<SiteNav />` component wrapping all pages
- `apps/web/app/_components/web-providers.tsx`: Add `CandidateAuthProvider` wrapping children
- `packages/mocks/src/handlers/candidate.ts`: Replace stub handlers with realistic mock data (multiple jobs, full profile shape, applications list)
- `apps/web/app/page.tsx`: Replace "Brynzit is coming." placeholder with the real landing page
- Route structure needed: `/`, `/jobs`, `/jobs/[id]`, `/signup`, `/login`, `/onboarding/[step]`, `/profile/edit`

</code_context>

<specifics>
## Specific Ideas

- **Job board as funnel:** The job board (not just the landing CTA) is the primary acquisition surface. Logged-out visitors search freely but see limited (3-5 blurred/locked) results. This creates a natural discovery → interest → signup → onboarding progression. Signup is contextual (triggered from wanting to apply or see more), not arbitrary.
- **Contrario.ai reference:** Large light-weight Geist headline (120px+, weight 300–400, wide tracking), white background, generous negative space, one CTA. No decorative elements, no feature grids in Phase 5. The headline should communicate the value proposition in ≤8 words.
- **Resume-first onboarding:** Step 1 is upload + async parse. Steps 2 and 3 confirm/edit what was parsed — candidate corrects rather than types. Reduces friction to completion.
- **Completeness meter at 70:** Show as a progress bar in the profile and on the job detail apply section. Below 70: "Complete your profile" with direct link to `/profile/edit`. The `completeness_score` comes from the API — the UI doesn't compute it independently.
- **Match badges visible only to logged-in candidates:** Logged-out users see job cards without match strength. Logged-in users see "Strong match" / "Partial match" badges. This is a quiet incentive to sign in.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Public Site*
*Context gathered: 2026-06-14*
