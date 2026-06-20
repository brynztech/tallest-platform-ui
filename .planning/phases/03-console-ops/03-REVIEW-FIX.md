---
phase: 03-console-ops
fixed_at: 2026-06-14T00:00:00Z
review_path: .planning/phases/03-console-ops/03-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-06-14T00:00:00Z
**Source review:** .planning/phases/03-console-ops/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10 (3 Critical + 7 Warning)
- Fixed: 10
- Skipped: 0

---

## Fixed Issues

### CR-01: CandidateDetailPanel fires shortlist PATCH with wrong ID type

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx`, `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx`, `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`
**Commit:** 6c0c7a6
**Applied fix:** Added `submissionId: string | null` prop to `CandidateDetailPanel`. Updated `actionMutation` to use `submissionId` (not `candidateId`) as the `submission_id` path param. Updated `ShortlistTable.onCandidateSelect` signature to `(candidateId: string, submissionId: string) => void` and updated the button click handler to pass both. Added `selectedSubmissionId` state to `RequisitionDetailPage` and threaded it through to `CandidateDetailPanel`.

---

### CR-02: ShortlistTable "Undo" window is 300ms — toast shows 5000ms

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx`
**Commit:** eed88dd
**Applied fix:** Changed the `setTimeout` delay from `300` to `5000` ms, aligning the mutation commit time with the 5-second undo window advertised in the toast. The comment was updated to explain why.

---

### CR-03: ops-shortlist test asserts badge class that diverges from production

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx`, `apps/console/src/__tests__/ops-shortlist.test.tsx`
**Commit:** 04d0847
**Applied fix:** Added `export` to `shortlistStatusBadgeClass` in `shortlist-table.tsx`. Replaced the test's local inline function (with different Tailwind class strings) with an import of the real exported function. New assertions check for `'oklch'` and the specific hue values that the production function actually returns.

---

### WR-01: pendingTimeouts Map leaks active timers on component unmount

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx`
**Commit:** aa907c1
**Applied fix:** Added `useEffect` with a cleanup function that calls `clearTimeout` on every pending entry and clears the Map. Added `useEffect` to the import. This prevents stale-closure mutations from firing after the user navigates away during an undo window.

---

### WR-02: Parsed requisition fields use `defaultValue` — values silently discarded

**Files modified:** `apps/console/app/(shell)/ops/requisitions/page.tsx`
**Commit:** 1ab966b
**Applied fix:** Converted all four parsed-field inputs from uncontrolled `defaultValue` to controlled `readOnly` inputs with `value=` and `className="bg-muted/50"`. Added a helper paragraph clarifying these are display-only fields and editable from the requisition detail page. This approach matches the actual UX intent (verify before navigating) without requiring a new PATCH mutation in this dialog.

---

### WR-03: ClientNotes addNoteMutation does not check the error field

**Files modified:** `apps/console/app/(shell)/ops/clients/[id]/_components/client-notes.tsx`
**Commit:** d4f81e7
**Applied fix:** Changed `mutationFn` from a one-liner returning the `apiClient.POST` promise to an async function that destructures `{ data, error }`, checks `if (error) throw error`, and returns `data`. Consistent with the pattern used by every other mutation in the codebase.

---

### WR-04: PlacementPanel force-casts form values with `as` to CreatePlacementRequest

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx`
**Commit:** deef8fd
**Applied fix:** Replaced `values as components['schemas']['CreatePlacementRequest']` with an explicit typed `body` constant. Each field is mapped individually. `confirmed_at` uses `|| null` to coerce an empty string to null (backend expects ISO datetime or null, not empty string).

---

### WR-05: InterviewsSection "Schedule Interview" creates interview with no scheduled_at

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx`
**Commit:** 16395d2
**Applied fix:** Added `useState('')` for `scheduledDate`. Replaced the standalone "Schedule Interview" button with a row that includes a date `<Input type="date" />` and the button. The button is disabled until a date is entered. On click, the date string is converted to ISO datetime via `new Date(scheduledDate).toISOString()` and passed as `scheduled_at`. The date input resets on success.

---

### WR-06: RequisitionDetailPage shows `req.client_id` UUID as client link text

**Files modified:** `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx`
**Commit:** e73f735
**Applied fix:** Added a lightweight `useQuery` that fetches `GET /api/v1/ops/clients` (with `staleTime: 60s`) when `req.client_id` is available. The Link text now uses `clientsData?.find(c => c.id === req.client_id)?.name ?? req.client_id` — showing the human-readable client name with the UUID as a fallback.

---

### WR-07: InterviewsPage renders duplicate status (Select + Badge per row)

**Files modified:** `apps/console/app/(shell)/ops/interviews/page.tsx`
**Commit:** 9c9b1e1
**Applied fix:** Removed the `<Badge variant="secondary">` block that rendered `interview.status` as a second control alongside the `<Select>` trigger. Also removed the `Badge` import which became unused after the removal.

---

_Fixed: 2026-06-14T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
