---
phase: 03-console-ops
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - apps/console/app/(shell)/_components/sidebar-nav.tsx
  - apps/console/app/(shell)/ops/clients/[id]/_components/client-fields.tsx
  - apps/console/app/(shell)/ops/clients/[id]/_components/client-notes.tsx
  - apps/console/app/(shell)/ops/clients/[id]/_components/client-requisitions.tsx
  - apps/console/app/(shell)/ops/clients/[id]/page.tsx
  - apps/console/app/(shell)/ops/clients/page.tsx
  - apps/console/app/(shell)/ops/interviews/page.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/placements-section.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/requisition-fields.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx
  - apps/console/app/(shell)/ops/requisitions/[id]/page.tsx
  - apps/console/app/(shell)/ops/requisitions/page.tsx
  - apps/console/src/__tests__/ops-clients.test.tsx
  - apps/console/src/__tests__/ops-interviews.test.tsx
  - apps/console/src/__tests__/ops-jd-parse.test.tsx
  - apps/console/src/__tests__/ops-placements.test.tsx
  - apps/console/src/__tests__/ops-shortlist.test.tsx
  - packages/mocks/src/handlers/ops.ts
  - packages/ui/src/components/ui/textarea.tsx
findings:
  critical: 3
  warning: 7
  info: 4
  total: 14
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Phase 3 implements the Console Ops lifecycle: clients, requisitions (with JD parse), shortlist review, interviews, and placements. The overall structure follows established Phase 2 patterns and the code is generally well-organized. However, three blockers were found:

1. `CandidateDetailPanel` performs a shortlist PATCH using `candidateId` where a `submission_id` is required — the comment in the code explicitly acknowledges the mismatch and calls it a "contextual hint", but the API call will 404 on real data.
2. The "Undo" path in `ShortlistTable` silently does nothing when a user clicks Undo after the 300ms timeout fires (the mutation has already committed).
3. The `shortlist-table.tsx` test asserts a badge class string that does not match what the production component generates, meaning the test will always pass against a broken implementation.

Warnings cover: a stale-closure leak in `pendingTimeouts` that prevents cleanup on unmount; uncontrolled parsed-field inputs in the requisition dialog that silently discard values on navigation; a `clientId` prop that is forwarded to the placement API but never validated as a UUID; and several other quality issues detailed below.

---

## Critical Issues

### CR-01: CandidateDetailPanel fires shortlist PATCH with wrong ID type

**File:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/candidate-detail-panel.tsx:51-59`

**Issue:** The `actionMutation` passes `candidateId` as `submission_id` to `PATCH /api/v1/supply/shortlists/{submission_id}`. The code's own comment acknowledges this: _"The actual submission_id is resolved in the parent via the shortlist table."_ A `candidate_id` is a different UUID namespace from a `submission_id`. When the backend receives an unknown `submission_id` it will return 404 or update the wrong record. The "Approve Candidate", "Hold Candidate", and "Pass on Candidate" buttons in the panel are functionally broken.

The panel already receives enough context to fix this: the parent (`RequisitionDetailPage`) knows which row was selected. The `submission_id` must be threaded down alongside `candidateId`.

**Fix:**
```tsx
// In CandidateDetailPanel, add submissionId to props:
interface CandidateDetailPanelProps {
  candidateId: string | null
  submissionId: string | null   // <-- add
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApprove?: () => void
}

// In actionMutation:
params: { path: { submission_id: submissionId! } },  // use submissionId, not candidateId

// In RequisitionDetailPage, track both:
const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
// ShortlistTable onCandidateSelect passes both:
onCandidateSelect={(candidateId, submissionId) => {
  setSelectedCandidateId(candidateId)
  setSelectedSubmissionId(submissionId)
  setIsCandidatePanelOpen(true)
}}
```

---

### CR-02: ShortlistTable "Undo" window is 300ms — toast shows 5000ms with a non-functional Undo button

**File:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx:123-145`

**Issue:** The mutation fires after `300ms` (line 124: `setTimeout(..., 300)`), but the toast advertises a 5-second undo window (`duration: 5000`). After 300ms the mutation has already committed; the Undo handler at lines 136-143 clears the timeout that has already fired and then calls `invalidateQueries` — which simply re-fetches the committed state, making undo a no-op that refetches without reversing anything. This is misleading UX: the user believes they have 5 seconds to undo but actually have under 300ms. In fast-click scenarios the toast fires, the user reads "Approved", clicks "Undo" within the 5-second window, nothing reverses.

Either remove the undo action from the toast, or delay the mutation to the full 5000ms to honor the displayed window.

**Fix:**
```tsx
// Option A — delay mutation to match toast duration:
const timeoutId = setTimeout(() => {
  pendingTimeouts.delete(entry.submission_id)
  actionMutation.mutate({ submissionId: entry.submission_id, status: newStatus })
  if (newStatus === 'approved') onApprove(entry.candidate_id)
}, 5000)   // was 300ms

// Option B — remove the misleading undo action:
toast(toastMsg, { duration: 3000 })   // no action: key
```

---

### CR-03: ops-shortlist test asserts badge class that diverges from production implementation

**File:** `apps/console/src/__tests__/ops-shortlist.test.tsx:9-20`

**Issue:** The test defines its own local `shortlistStatusBadgeClass` function with different return values (`'bg-green-500/20 text-green-700 border-green-500/40'`, `'bg-amber-500/20 text-amber-700 border-amber-500/40'`) from the production function in `shortlist-table.tsx` which returns OKLCH strings (`'bg-[oklch(0.45_0.15_145)/20]...'`, `'border-[oklch(0.769_0.188_85.87)]...'`). The test is asserting a locally-defined function, not the exported production function. The test will pass even when the production badge class is completely wrong, providing zero regression coverage for the actual behavior it claims to test.

**Fix:** Export `shortlistStatusBadgeClass` from `shortlist-table.tsx` and import it in the test, or co-locate it in a separate util file:
```tsx
// shortlist-table.tsx — export the function
export function shortlistStatusBadgeClass(status: string): string { ... }

// ops-shortlist.test.tsx
import { shortlistStatusBadgeClass } from '../../../app/(shell)/ops/requisitions/[id]/_components/shortlist-table'

it('approved status maps to green badge class', () => {
  expect(shortlistStatusBadgeClass('approved')).toContain('oklch')
})
```

---

## Warnings

### WR-01: pendingTimeouts Map leaks active timers on component unmount

**File:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/shortlist-table.tsx:66`

**Issue:** `pendingTimeouts` is held in `useState` (never changes identity). If the component unmounts while any timeout is pending — e.g. user navigates away mid-undo-window — the `setTimeout` callbacks will fire after unmount, calling `actionMutation.mutate(...)` on a stale closure and potentially calling `queryClient.invalidateQueries` on a component that no longer exists. There is no cleanup effect.

**Fix:**
```tsx
useEffect(() => {
  return () => {
    // Clear all pending timeouts on unmount
    pendingTimeouts.forEach((id) => clearTimeout(id))
    pendingTimeouts.clear()
  }
}, [pendingTimeouts])
```

---

### WR-02: Parsed requisition fields in RequisitionsPage use `defaultValue` — values are silently discarded

**File:** `apps/console/app/(shell)/ops/requisitions/page.tsx:374-435`

**Issue:** The "Phase 3" parsed fields (`parsed_seniority`, `parsed_skills`, `parsed_comp`, `parsed_start_date`) are rendered as uncontrolled inputs using `defaultValue`. These inputs are inside the form but are **not registered** with `react-hook-form` via `{...form.register(...)}`. When the user clicks "Go to Requisition" (line 465-470), they navigate away and the values are lost. If the intention is to let users verify/edit parsed values before navigating, those inputs must be registered and submitted via a mutation, or the UX must make clear the values are display-only.

**Fix:**
```tsx
// Register the parsed fields with RHF and submit them on "Go to Requisition":
<Input
  id="parsed_seniority"
  {...form.register('seniority')}   // extend createReqSchema with these fields
  defaultValue={polledReq?.seniority ?? ''}
/>
// Then submit a PATCH to update the requisition before navigating.
```

---

### WR-03: ClientNotes addNoteMutation does not check the returned error from apiClient.POST

**File:** `apps/console/app/(shell)/ops/clients/[id]/_components/client-notes.tsx:35-47`

**Issue:** `addNoteMutation.mutationFn` calls `apiClient.POST(...)` but never destructures `error` from the result. If the API returns an error response, the mutation will resolve `onSuccess` with the raw `{ data, error }` object and call `queryClient.invalidateQueries` + `setNoteText('')`, making it appear the note was saved when it was not. Other mutations in this codebase correctly check `if (error) throw error`.

**Fix:**
```tsx
mutationFn: async (text: string) => {
  const { data, error } = await apiClient.POST('/api/v1/ops/clients/{client_id}/notes', {
    params: { path: { client_id: clientId } },
    body: { text, channel: 'other' },
  })
  if (error) throw error
  return data
},
```

---

### WR-04: PlacementPanel passes form values with unsafe cast, bypassing type validation at API boundary

**File:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/placement-panel.tsx:75`

**Issue:** `submitMutation.mutate(values as components['schemas']['CreatePlacementRequest'])` force-casts the Zod-inferred form values to the API type. The `clientId` that the parent thread-downs (line 36, 103) is never included in the submission — the schema does not contain it, and if the backend `CreatePlacementRequest` requires a `client_id` field, the request will fail silently with a validation error. Additionally `confirmed_at` in the schema is `z.string().nullable().optional()` but the API may expect an ISO datetime; an empty string would pass Zod but fail the backend.

**Fix:** Verify `CreatePlacementRequest` schema fields match `placementSchema` exactly and remove the cast, or add explicit mapping:
```tsx
const onSubmit = form.handleSubmit((values) => {
  const body: components['schemas']['CreatePlacementRequest'] = {
    requisition_id: values.requisition_id,
    candidate_id: values.candidate_id ?? null,
    fee_usd: values.fee_usd ?? null,
    billing_status: values.billing_status,
    retention_flag_90d: values.retention_flag_90d,
    notes: values.notes ?? null,
    confirmed_at: values.confirmed_at || null,
  }
  submitMutation.mutate(body)
})
```

---

### WR-05: InterviewsSection createMutation omits scheduled_at — interview is always created without a date

**File:** `apps/console/app/(shell)/ops/requisitions/[id]/_components/interviews-section.tsx:130-137`

**Issue:** The "Schedule Interview" button calls `createMutation.mutate({ requisition_id: reqId, candidate_id: approvedCandidateId })` without a `scheduled_at` field. The `CreateInterviewRequest` schema may have `scheduled_at` as optional, but the resulting interview record will always have `scheduled_at: null`. The UI later displays `scheduled_at` as the date, showing nothing for these interviews. There is no date-picker in the UI to supply a value.

**Fix:** Either add a `scheduled_at` date input (even a simple `<Input type="date" />` inline or in a small dialog), or remove the date column from the interviews display until scheduling is supported. Silently creating date-less interviews degrades the record quality.

---

### WR-06: RequisitionDetailPage shows `req.client_id` UUID as the client link text

**File:** `apps/console/app/(shell)/ops/requisitions/[id]/page.tsx:66-68`

**Issue:** The header links to the client detail page using `req.client_id` as both the href parameter and the visible link text:
```tsx
<Link href={`/ops/clients/${req.client_id}`} className="text-sm text-primary">
  {req.client_id}
</Link>
```
Users see a raw UUID like `00000000-0000-0000-0000-client000001` instead of "Acme Corp". The `ClientsPage` already has the client name in its list query, and the detail page for clients stores the name. This is a data display regression: operators cannot easily identify which client a requisition belongs to from this view.

**Fix:** Either pass the client name via props/context, fetch it with a lightweight query, or display the client name from the `ops-clients` list query cache:
```tsx
const { data: clientsData } = useQuery({ queryKey: ['ops-clients'], ... })
const clientName = clientsData?.find(c => c.id === req.client_id)?.name ?? req.client_id
// ...
<Link href={`/ops/clients/${req.client_id}`}>{clientName}</Link>
```

---

### WR-07: InterviewsPage renders duplicate status: both a Select and a Badge show the same value per row

**File:** `apps/console/app/(shell)/ops/interviews/page.tsx:128-149`

**Issue:** Each interview row in `InterviewsPage` renders `interview.status` twice: once inside the `<Select>` trigger (line 136) and again as a standalone `<Badge>` (lines 147-149). This is visual duplication — the same status string appears side-by-side in two controls. The `InterviewsSection` component (per-requisition view) does not repeat this mistake; it shows the badge and the select but uses an `InterviewStatusBadge` helper. The global interviews page is inconsistent and wastes column space.

**Fix:** Remove the redundant `<Badge>` from `InterviewsPage` lines 147-149, as the `<Select>` already displays the current status.

---

## Info

### IN-01: ops-clients.test.tsx XSS "security" test only tests a local helper function

**File:** `apps/console/src/__tests__/ops-clients.test.tsx:31-39`

**Issue:** The "note text is NOT rendered via dangerouslySetInnerHTML" test defines and calls a local `renderNote` helper that manually escapes HTML — it does not render the actual `ClientNotes` component and does not assert that React's JSX rendering escapes the string. The test provides a false sense of XSS coverage. React's JSX text nodes do escape by default, but this test does not verify that `ClientNotes` actually uses a text node rather than `dangerouslySetInnerHTML`.

**Fix:** Replace with a proper component render test using `@testing-library/react`:
```tsx
import { render, screen } from '@testing-library/react'
it('note text is not rendered via dangerouslySetInnerHTML', () => {
  render(<NoteItem note={{ text: '<script>alert(1)</script>', ... }} />)
  expect(document.querySelector('script')).toBeNull()
  expect(screen.getByText(/<script>/)).toBeInTheDocument()
})
```

---

### IN-02: ops.ts MSW handler #10 uses IIFE for stateful poll counter that is module-scoped

**File:** `packages/mocks/src/handlers/ops.ts:213-236`

**Issue:** The `parsePollCounts` counter inside the IIFE is module-scoped (created once at import time). In test environments that run multiple tests using the same module instance, poll counts will accumulate across tests, meaning a requisition fetched in test N will behave as if it has already been polled `N-1` times from prior tests. This causes non-deterministic behavior in integration tests that rely on the "first fetch = parsing, second fetch = open" behavior.

**Fix:** Reset the counter in an `afterEach` hook, or restructure to use per-handler state that can be reset via an exported function. Alternatively, use MSW's `once()` pattern for stateful multi-response sequences.

---

### IN-03: Textarea component uses `@/lib/utils` path alias instead of package-relative import

**File:** `packages/ui/src/components/ui/textarea.tsx:2`

**Issue:** The import is `import { cn } from '@/lib/utils'`, using the Next.js `@/` alias. This works inside `apps/console` because Next.js resolves `@/` to the app root, but `packages/ui` is a shared package — if consumed outside of a Next.js context (e.g., Storybook, standalone Vitest run, or `apps/web`), this alias will fail to resolve. Every other shadcn component generated into `packages/ui` should use a relative or package-scoped import instead.

**Fix:**
```tsx
import { cn } from '../../lib/utils'  // relative path within the package
// or configure tsconfig paths in packages/ui/tsconfig.json to define @/
```

---

### IN-04: CreateClientRequest body construction is duplicated identically in two files

**File:** `apps/console/app/(shell)/ops/clients/page.tsx:67-73` and `apps/console/app/(shell)/ops/clients/[id]/_components/client-fields.tsx:59-64`

**Issue:** The logic for mapping form values to the `CreateClientRequest`/`PatchClientRequest` body — including the `primary_contact_email === '' ? null : ...` coercion — is copy-pasted verbatim between the create page and the edit dialog. If the API contract changes (e.g., adding a new field), both locations must be updated independently.

**Fix:** Extract a shared helper:
```tsx
// In a shared util or the api-client package:
function toClientRequestBody(values: ClientFormValues): PatchClientRequest {
  return {
    name: values.name,
    primary_contact_name: values.primary_contact_name ?? null,
    primary_contact_email: values.primary_contact_email === '' ? null : (values.primary_contact_email ?? null),
  }
}
```

---

_Reviewed: 2026-06-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
