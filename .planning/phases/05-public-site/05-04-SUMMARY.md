---
phase: 05-public-site
plan: "04"
subsystem: ui
tags: [nextjs, react, tanstack-query, zod, react-hook-form, msw, json-ld, shadcn]

# Dependency graph
requires:
  - phase: 05-01
    provides: CandidateProfile, PublicJobItem types in apps/web/app/_lib/candidate-types.ts
  - phase: 05-02
    provides: CandidateAuthContext + useCandidateAuth hook, SiteNav, WebProviders
  - phase: 05-03
    provides: onboarding flow, signup/login pages, MSW candidate handlers with realistic mock data

provides:
  - "Job detail page /jobs/[id] with JobPosting JSON-LD, safe JD rendering, apply section"
  - "Apply section with 3 states: not-logged-in (Sign up to apply), score<70 (Complete your profile), score>=70 (Apply now)"
  - "Profile edit page /profile/edit with completeness meter, all 4 sections, PUT mutation"
  - "Complete candidate journey: landing → job search → sign up → onboard → view job detail → apply"

affects:
  - 05-public-site
  - phase-6 (candidate dashboard — profile completeness links here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JSON-LD structured data injection via useEffect (client-side per T-05-05)"
    - "safeHref() protocol validator rejecting javascript: and data: URLs (T-05-04)"
    - "completeness_score gate: score >= 70 unlocks 1-click apply (never computed client-side)"
    - "Protected route: useEffect redirect + early null return prevents flash of protected content"
    - "PUT mutation pattern: fetch + form.reset on profile load + invalidateQueries on success"

key-files:
  created:
    - apps/web/app/jobs/[id]/page.tsx
    - apps/web/app/jobs/[id]/_components/apply-section.tsx
    - apps/web/app/profile/edit/page.tsx
  modified: []

key-decisions:
  - "JSON-LD injected client-side via useEffect (not RSC) to avoid server-side MSW complexity — T-05-05 documents fallback if Googlebot fails to execute JS"
  - "safeHref() defined locally in both job detail page and profile edit page (copy pattern) — not shared utility, consistent with how console candidate-profile-sheet.tsx handles it"
  - "completeness_score gate at 70 — reads from API response, never computed in UI (D-18)"

patterns-established:
  - "Pattern: JSON-LD useEffect with data-job-id attribute for idempotent cleanup on unmount"
  - "Pattern: canonical URL injected via useEffect with data-canonical-job-id for cleanup"
  - "Pattern: safeHref(url) — validates protocol before rendering any user-supplied URL as href"
  - "Pattern: Protected route = useEffect redirect + early null render guard"

requirements-completed:
  - PUB-05
  - PUB-06
  - JOB-02
  - JOB-03
  - JOB-04

# Metrics
duration: 6min
completed: 2026-06-14
---

# Phase 5 Plan 04: Job Detail + Profile Edit Summary

**Job detail page with JobPosting JSON-LD + 3-state apply section (not-logged-in/incomplete/ready), profile edit with completeness meter gating 1-click apply at score >= 70**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-14T19:30:44Z
- **Completed:** 2026-06-14T19:36:16Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- `/jobs/[id]` page renders full job detail: title, company, location, compensation, all skills badges, employment type + seniority badges, match strength (logged-in only)
- JobPosting JSON-LD injected via `useEffect` with cleanup on unmount; `employmentType` correctly mapped to FULL_TIME/PART_TIME/CONTRACTOR
- JD text rendered as `<p className="whitespace-pre-wrap">` — no innerHTML (T-05-02 compliance)
- Apply section shows 3 correct states: "Sign up to apply" (not logged in), "Complete your profile" + Progress bar (score < 70), "Apply now" + optional 200-char note (score >= 70)
- `/profile/edit` page: all 4 sections (Personal, Skills, Preferences, Links), completeness meter from API, PUT saves with toast, `safeHref()` protects URL display (T-05-04)
- Protected route pattern: `useEffect` redirect + `if (!isLoggedIn) return null` prevents content flash

## Task Commits

1. **Task 1: Job detail page with JSON-LD, safe JD rendering, and apply section** - `9f01d46` (feat)
2. **Task 2: Profile edit page — completeness meter, all fields, PUT mutation** - `c2eee27` (feat)

## Files Created/Modified

- `apps/web/app/jobs/[id]/page.tsx` — client component; `use(params)` for Next.js 16 async params; useQuery for job; JSON-LD + canonical useEffect; safeHref(); whitespace-pre-wrap JD; ApplySection integration
- `apps/web/app/jobs/[id]/_components/apply-section.tsx` — 3-state apply UI; useMutation POST /candidate/applications; 200-char note textarea; Progress bar for incomplete state
- `apps/web/app/profile/edit/page.tsx` — single-page edit form; protected route; completeness Progress meter; RHF + zod v4 url() validation; Command+Popover skills picker; PUT /candidate/profile

## Decisions Made

- JSON-LD injected client-side via `useEffect` (not RSC generateMetadata + dangerouslySetInnerHTML) to avoid server-side MSW complexity. T-05-05 acceptance condition: if Google Rich Results Test fails after deploy, migrate to RSC approach.
- `safeHref()` duplicated in both files rather than shared utility — consistent with console pattern (candidate-profile-sheet.tsx does same), keeps file self-contained.
- `completeness_score` read from `['candidate-profile']` query cache (same queryKey as onboarding step 2) — no prop drilling, no duplicate fetch.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing typecheck/build failure in `packages/ui` components using `@/lib/utils` path alias — this failure exists before this plan's changes (verified by reverting to base commit). Logged as deferred issue. Does not affect the correctness of files created in this plan.

## Known Stubs

None — all data flows from live MSW handlers that return realistic mock data.

## Threat Flags

No new security surfaces introduced beyond those documented in the plan's threat model. All T-05-01 through T-05-05 mitigations applied as specified:

- T-05-02: `dangerouslySetInnerHTML` absent from job detail page (grep-verified 0 occurrences)
- T-05-04: `safeHref()` in both job detail page and profile edit page
- T-05-05: T-05-05 conditional acceptance documented in page.tsx comment

## Next Phase Readiness

- Complete candidate journey is shippable: landing → job search → sign up → onboard → view job detail → apply (or complete profile)
- Phase 6 (DASH-01, DASH-02) can build candidate dashboard using same `['candidate-applications']` query key
- Profile edit page at `/profile/edit` is ready as the link target from apply section "Complete your profile" button

## Self-Check: PASSED

| Item | Status |
|------|--------|
| apps/web/app/jobs/[id]/page.tsx | FOUND |
| apps/web/app/jobs/[id]/_components/apply-section.tsx | FOUND |
| apps/web/app/profile/edit/page.tsx | FOUND |
| .planning/phases/05-public-site/05-04-SUMMARY.md | FOUND |
| Commit 9f01d46 (Task 1) | FOUND |
| Commit c2eee27 (Task 2) | FOUND |

---
*Phase: 05-public-site*
*Completed: 2026-06-14*
