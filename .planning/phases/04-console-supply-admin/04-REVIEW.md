---
phase: 04-console-supply-admin
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - apps/console/app/(shell)/_components/candidate-profile-sheet.tsx
  - apps/console/app/(shell)/_components/sidebar-nav.tsx
  - apps/console/app/(shell)/admin/_components/admin-content.tsx
  - apps/console/app/(shell)/admin/_components/admin-costs-tab.tsx
  - apps/console/app/(shell)/admin/_components/admin-events-tab.tsx
  - apps/console/app/(shell)/admin/_components/admin-overview-tab.tsx
  - apps/console/app/(shell)/admin/_components/admin-pipeline-tab.tsx
  - apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx
  - apps/console/app/(shell)/admin/_components/admin-quotas-tab.tsx
  - apps/console/app/(shell)/admin/page.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
  - apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx
  - apps/console/app/(shell)/supply/engagements/page.tsx
  - apps/console/app/(shell)/supply/ingest/_components/csv-form.tsx
  - apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx
  - apps/console/app/(shell)/supply/ingest/_components/linkedin-form.tsx
  - apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx
  - apps/console/app/(shell)/supply/ingest/page.tsx
  - apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx
  - apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx
  - apps/console/app/(shell)/supply/search/page.tsx
  - packages/mocks/src/handlers/monitoring.ts
  - packages/mocks/src/handlers/supply.ts
  - packages/ui/src/components/ui/progress.tsx
  - packages/ui/src/components/ui/tabs.tsx
findings:
  critical: 4
  warning: 9
  info: 5
  total: 18
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This phase delivers the Supply and Admin sections of the internal console: candidate search, three ingest flows (LinkedIn, CSV, resume), engagement sequence review, and the full Admin monitoring suite (costs, events, quotas, pipeline, prompts). The overall structure is sound and follows established patterns from prior phases. However, several correctness bugs were found that affect real user workflows — a race condition in the enrichment polling loop, a seniority filter value that silently passes the wrong value to the API, wrong display math in the events pagination footer, and a gap in the prompt editor's unsaved-change guard that allows silent data loss. There are also security-adjacent concerns around unvalidated URL rendering and unvalidated `resumeFilePath` used as an `href`.

---

## Critical Issues

### CR-01: Enrichment polling reads stale cache, not freshly fetched data

**File:** `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx:82-89`

**Issue:** Inside the `setInterval` callback, the code calls `queryClient.invalidateQueries(...)` and then immediately reads the cached value back with `queryClient.getQueryData(...)`. `invalidateQueries` marks the query stale and schedules a background refetch — it does not await the refetch. The `getQueryData` call that follows therefore always reads the **old** cached data, so the `if (tp?.email_verified !== null || tp?.github_public_repos !== null)` check never becomes true from newly fetched data, and `setIsEnriching(false)` is never called via this path. The enrichment spinner runs until the 30-second hard timeout fires — and at that point `setEnrichError(true)` is set even when enrichment actually succeeded. The user sees a false failure.

**Fix:** Either subscribe to the query with `useQuery` (which rerenders on fresh data) and move the completion check into a `useEffect` that watches the query data, or use `queryClient.fetchQuery` (which returns a promise for the fresh result) instead of `invalidateQueries` + `getQueryData`:

```ts
// Inside the interval callback:
try {
  const fresh = await queryClient.fetchQuery({
    queryKey: ['supply-candidate', candidateId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/supply/candidates/{candidate_id}',
        { params: { path: { candidate_id: candidateId! } } },
      )
      if (error) throw error
      return data
    },
  })
  const tp = fresh?.talent_pool
  if (tp?.email_verified !== null || tp?.github_public_repos !== null) {
    setIsEnriching(false)
    toast.success('Candidate enriched.')
  }
} catch {
  // non-fatal, keep polling
}
```

---

### CR-02: Seniority filter sends `__any__` sentinel to the API

**File:** `apps/console/app/(shell)/supply/search/_components/filter-sidebar.tsx:165`

**Issue:** The `SelectItem` for "Any seniority" uses `value="__any__"` as a workaround for Radix UI's restriction on empty-string values. However, in `search/page.tsx` line 34, `seniority` from `submittedFilters` is sent directly to the API (`seniority: submittedFilters?.seniority || undefined`). The `|| undefined` guard correctly short-circuits for an empty string but **not** for the `__any__` literal — `'__any__'` is truthy, so `seniority: '__any__'` is passed to the backend. The backend will likely reject the request or return zero results when the user intends "no seniority filter".

The chip-removal path in `removeChip` (search/page.tsx line 126) resets the field to `''`, which is correct but inconsistent with what the Select itself produces.

**Fix:** Strip the sentinel before submitting:

```ts
// In search/page.tsx handleSubmit, or in FilterSidebar.handleSubmit:
const seniorityValue =
  filters.seniority === '__any__' || filters.seniority === '' ? undefined : filters.seniority

// pass seniorityValue to the API instead of filters.seniority
```

Alternatively, store `''` internally and map to `__any__` only for the Select `value` prop display.

---

### CR-03: Prompt editor unsaved-change guard fails when switching away via browser navigation

**File:** `apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx:65-81`

**Issue:** `handleSelectPrompt` guards against switching prompts **within the list** when `isDirty` is true. But switching tabs via the URL (e.g. clicking a different Admin tab, or pressing Back) bypasses the guard entirely — `isDirty` is local component state that is lost on unmount and there is no `beforeunload` handler. A user who edits a prompt and navigates away (tab change triggers `router.push` in `admin-content.tsx`) loses their edits silently, and the toast with "Discard" is never shown.

More critically, the "Discard" action in the toast at line 70-75 reads:
```ts
onClick: () => {
  setEditedContent(promptData?.content ?? '')
  setSelectedPromptName(name)
},
```
This discards the edit and switches to the new prompt — but `setEditedContent(promptData?.content ?? '')` sets content from `promptData` which is the **current** prompt's data (not yet switched). When the query for `name` loads and `useEffect` at line 44 fires, it will overwrite `editedContent` again, so the behaviour is coincidentally correct. But the prompt being discarded is logged nowhere.

**Fix:** Add a `beforeunload` warning or, more pragmatically, gate the tab triggers in `AdminContent` so that `handleTabChange` invokes a `isDirty` callback from the prompts tab before navigating. The simplest safe fix is a `window.addEventListener('beforeunload', ...)` inside the prompts component when `isDirty` is true:

```ts
useEffect(() => {
  if (!isDirty) return
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [isDirty])
```

---

### CR-04: `resume_file_path` rendered as `href` without validation — path traversal / open redirect risk

**File:** `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx:493-500`

**Issue:** `talentPool.resume_file_path` is rendered directly as an anchor `href` without any validation:

```tsx
<a
  href={talentPool.resume_file_path}
  target="_blank"
  rel="noopener noreferrer"
>
  Download Resume
</a>
```

The value comes from the API response. If a malicious or malformed backend value contains `javascript:` or a `data:` URI, clicking "Download Resume" executes arbitrary JavaScript in the user's browser. Even for the internal console, if the backend is ever misconfigured or compromised this is a stored XSS vector. The mock shows a plain path (`/resumes/david-park-2026.pdf`) but the type is `string` with no constraint.

**Fix:** Validate the URL scheme before rendering:

```ts
function isSafeHref(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// In render:
{talentPool.resume_file_path && isSafeHref(talentPool.resume_file_path) && (
  <a href={talentPool.resume_file_path} target="_blank" rel="noopener noreferrer">
    Download Resume
  </a>
)}
```

The same concern applies to `talentPool.github_url` (line 424-432) and `candidate.linkedin_url` (line 467-475), though those are rendered as links too.

---

## Warnings

### WR-01: Events pagination "Showing X–Y" is wrong when results page is empty

**File:** `apps/console/app/(shell)/admin/_components/admin-events-tab.tsx:300`

**Issue:** The pagination footer reads:
```tsx
Showing {offset + 1}–{offset + displayedEvents.length}
```
When the last page contains fewer than `LIMIT` items the math is correct, but when the page is **empty** (e.g. filters match nothing) it displays "Showing 1–0" which is confusing. Also, when `offset > 0` and no results exist, it shows "Showing 26–25" (or similar nonsense).

**Fix:**
```tsx
{displayedEvents.length > 0
  ? `Showing ${offset + 1}–${offset + displayedEvents.length}`
  : 'No results'}
```

---

### WR-02: `columns` typed as `any[]` bypasses all type safety in the events table

**File:** `apps/console/app/(shell)/admin/_components/admin-events-tab.tsx:47`

**Issue:** `const columns: any[]` is declared with an explicit `// eslint-disable-next-line @typescript-eslint/no-explicit-any` suppression. The column definitions include `info.getValue() as number` and `info.getValue() as string` casts that paper over the type loss. If `AgentEventOut` fields change (e.g. `cost_usd` becomes nullable), there is no compile-time protection — the cast will hide the breakage and `(undefined).toFixed(4)` will crash at runtime.

**Fix:** Type the columns correctly using the column helper:
```ts
const columns: ColumnDef<AgentEventOut>[] = [...]
// ColumnDef is exported from @tanstack/react-table
```
Then remove the manual casts on `getValue()` — the types flow through automatically.

---

### WR-03: Resume polling interval is never cleared if the component unmounts mid-poll

**File:** `apps/console/app/(shell)/supply/ingest/_components/resume-form.tsx:108-151`

**Issue:** `startPolling` creates a `setInterval` assigned to `intervalId` (a local variable inside the closure). If the user navigates away from the Ingest page while a poll is running, the interval keeps firing — making API calls and calling `onJobUpdated` / `toast.success` on unmounted component state. There is no cleanup mechanism (no `useRef` to hold the interval, no `useEffect` return).

**Fix:** Store the interval ID in a `useRef` and clear it on unmount:

```ts
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

// in startPolling:
intervalRef.current = setInterval(async () => { ... }, POLL_INTERVAL_MS)

// in component:
useEffect(() => {
  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }
}, [])
```

---

### WR-04: `handleShortlistAction` timeout reference is held in a `useState` Map — ref is the correct primitive

**File:** `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx:120`

**Issue:** `pendingTimeouts` is created with `useState(() => new Map(...))`. Using `useState` for a mutable `Map` that never triggers a re-render is semantically wrong — mutations to the Map (`set`, `delete`) do not call the state setter, so React is unaware of them. This works coincidentally because nothing reads the Map for rendering, but it is fragile: if React ever clones or restores state snapshots (Concurrent Mode, StrictMode double-invoke) the Map could be re-instantiated, silently losing pending timeout IDs and making Undo non-functional.

**Fix:** Use `useRef` for the mutable Map:
```ts
const pendingTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
// then use pendingTimeoutsRef.current.set(...), .get(...), .delete(...)
```

---

### WR-05: `handleSelectPrompt` guard is bypassed when the same prompt is clicked twice with unsaved changes

**File:** `apps/console/app/(shell)/admin/_components/admin-prompts-tab.tsx:65-79`

**Issue:** `handleSelectPrompt` checks `if (isDirty) { ... return }` but does NOT check whether `name === selectedPromptName`. If a user edits a prompt, then clicks the **same** prompt in the list again, `isDirty` is true so the toast fires. The "Discard" action sets `editedContent` back to `promptData?.content` and calls `setSelectedPromptName(name)` — but `name` is the same as `selectedPromptName`, so `selectedPromptName` does not change, and the `useEffect` at line 44 (which watches `promptData?.content`) fires only if the query result changes. In practice clicking the same item when dirty shows a confusing "Unsaved changes — save or discard" toast that says "switch" but does not switch.

**Fix:** Add an early return when selecting the already-active prompt:
```ts
function handleSelectPrompt(name: string) {
  if (name === selectedPromptName) return // no-op
  if (isDirty) { ... }
  setSelectedPromptName(name)
}
```

---

### WR-06: `adminContent.tsx` — arbitrary `tab` query-string value accepted without validation

**File:** `apps/console/app/(shell)/admin/_components/admin-content.tsx:16`

**Issue:** `const activeTab = searchParams.get('tab') ?? 'overview'`. If someone navigates to `/admin?tab=<script>alert(1)</script>`, the value is passed directly as the Radix Tabs `value` prop. Radix will not render a matching `TabsContent` (no XSS in the DOM itself), but the value is still passed into `handleTabChange` as a string and pushed into the URL via `router.push`. If any future code renders `activeTab` as text it becomes a reflected XSS vector. Additionally, invalid tab values leave the user on a blank screen with no error state.

**Fix:** Whitelist the allowed tab values:
```ts
const VALID_TABS = ['overview', 'costs', 'events', 'quotas', 'pipeline', 'prompts'] as const
type AdminTab = typeof VALID_TABS[number]

function isValidTab(v: string | null): v is AdminTab {
  return VALID_TABS.includes(v as AdminTab)
}

const activeTab: AdminTab = isValidTab(searchParams.get('tab'))
  ? (searchParams.get('tab') as AdminTab)
  : 'overview'
```

---

### WR-07: `EngagementSequenceSheet` — reject timeout is cleared on unmount but `onOpenChange(false)` is called from the timeout after the component may be gone

**File:** `apps/console/app/(shell)/supply/engagements/_components/engagement-sequence-sheet.tsx:171-186`

**Issue:** The reject flow defers the actual API call 5 seconds via `rejectTimeoutRef`. The cleanup `useEffect` at line 112 clears the timeout on unmount. However, `onOpenChange` is called from inside the `setTimeout` callback at line 181. If the parent unmounts `EngagementSequenceSheet` for reasons other than the sheet being closed (e.g., the parent re-renders and stops passing `isOpen`), the cleanup fires and `clearTimeout` prevents the API call — but if the parent does NOT unmount (the sheet just stays closed), then `onOpenChange(false)` is called from an old closure when the parent may have already changed the selected sequence. The result is that approving a new sequence while a previous reject is pending will close the sheet prematurely when the old reject timeout fires.

**Fix:** After clearing the timeout reference in cleanup, also capture a mounted flag or use an AbortController pattern. At minimum, guard the timeout callback:

```ts
rejectTimeoutRef.current = setTimeout(async () => {
  if (!rejectTimeoutRef.current) return // was cleared (undo)
  ...
  onOpenChange(false)
  rejectTimeoutRef.current = null
}, 5000)
```
This is partially mitigated by the existing cleanup, but the interaction with rapid sequence switching is still fragile.

---

### WR-08: `useQuery` in `EngagementsPage` uses raw `fetch` instead of `apiClient`

**File:** `apps/console/app/(shell)/supply/engagements/page.tsx:34-40`

**Issue:** This is the only query in the Supply/Admin surface that bypasses the typed `apiClient` in favour of a raw `fetch` call. The `res.json() as Promise<{ sequences: EngagementSequenceResponse[] }>` cast is unchecked — if the API shape diverges, the error surfaces at runtime rather than at compile time. This is acknowledged in the comment ("MSW-only — no live backend endpoint"), but the inconsistency means the typed API client provides zero protection here.

Additionally, `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}` hard-codes a fallback to localhost — consistent with other raw-fetch usages in the codebase, but if `NEXT_PUBLIC_API_URL` is undefined in production this silently fails against localhost.

**Fix:** When the endpoint is added to the OpenAPI spec, migrate to `apiClient.GET`. Until then, at least add a runtime shape check or document the deviation in a comment explaining why it diverges.

---

### WR-09: `Progress` component — `value` passed to `style.transform` without clamping

**File:** `packages/ui/src/components/ui/progress.tsx:25`

**Issue:** `style={{ transform: `translateX(-${100 - (value || 0)}%)` }}` does not clamp `value` to `[0, 100]`. If a caller passes `value={110}` (e.g. quota overrun at 110%), the transform becomes `translateX(-(-10)%) = translateX(10%)` — the indicator shifts **right** of the track, producing a broken visual. In `admin-overview-tab.tsx` line 64, `quotaPercent = quotaData?.percent ?? 0` is used without clamping before being passed.

**Fix:** Clamp in the Progress component:
```ts
const safeValue = Math.min(100, Math.max(0, value || 0))
style={{ transform: `translateX(-${100 - safeValue}%)` }}
```

---

## Info

### IN-01: Duplicate `availabilityBadgeClass` / `availabilityBadgeVariant` / `availabilityLabel` functions

**Files:** `apps/console/app/(shell)/_components/candidate-profile-sheet.tsx:30-48` and `apps/console/app/(shell)/supply/search/_components/candidate-result-card.tsx:17-38`

**Issue:** The three availability helper functions are copy-pasted verbatim between the two files. Any change to availability status display logic must be made in two places.

**Fix:** Extract to a shared utility, e.g. `apps/console/lib/candidate-display.ts`, and import from both files.

---

### IN-02: Magic number `5000` used repeatedly for undo timeout duration

**Files:** `candidate-profile-sheet.tsx:155`, `engagement-sequence-sheet.tsx:171`, `admin-prompts-tab.tsx:67`

**Issue:** The 5-second undo window is hardcoded as `5000` in multiple places (and must match `toast` duration which is also `5000`). If the undo window needs changing it must be updated in several files.

**Fix:** Define a shared constant:
```ts
// lib/constants.ts
export const UNDO_TIMEOUT_MS = 5_000
```

---

### IN-03: `admin-events-tab.tsx` — columns typed as `any[]` with eslint suppression comment

**File:** `apps/console/app/(shell)/admin/_components/admin-events-tab.tsx:46-47`

**Issue:** The `// eslint-disable-next-line @typescript-eslint/no-explicit-any` suppression comment indicates the developer acknowledged but bypassed the type error rather than fixing it. This is already captured as WR-02 from a correctness angle; noting here as a code-quality smell.

---

### IN-04: `monitoring.ts` mock — `period === 'day'` branch never reachable

**File:** `packages/mocks/src/handlers/monitoring.ts:15-19`

**Issue:** The cost handler matches `period === 'day'` but the UI only sends `today`, `week`, or `month` (admin-costs-tab.tsx line 24). The `'day'` branch in the mock is dead code and represents a mismatch between mock and client expectations. If the UI is changed to send `'day'`, the mock would work; if the intention is `'today'`, the mock condition should be `period === 'today'`.

**Fix:** Align mock with UI values:
```ts
const start = period === 'today'
  ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  : period === 'week'
    ? ...
    : ...
```

---

### IN-05: `ingest-job-card.tsx` — inline `style` with OKLCH color for "Done" badge

**File:** `apps/console/app/(shell)/supply/ingest/_components/ingest-job-card.tsx:55-58`

**Issue:** The "Done" badge uses `style={{ backgroundColor: 'oklch(0.45 0.15 145)' }}` with `className="text-xs text-white"`. The other files use Tailwind arbitrary-value syntax (`bg-[oklch(0.45_0.15_145)]`). The inconsistency makes it harder to globally update the green accent color; an inline style also defeats Tailwind's purge/extraction and cannot be overridden by utility classes.

**Fix:** Use the Tailwind arbitrary-value class:
```tsx
<Badge className="text-xs bg-[oklch(0.45_0.15_145)] text-white">Done</Badge>
```

---

_Reviewed: 2026-06-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
