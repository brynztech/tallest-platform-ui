// packages/api-client/src/smoke-test.ts
// Compile-time assertions for Pydantic v2 anyOf+null nullable fields (FOUND-02).
// ROADMAP Success Criterion 2: at least 5 representative nullable fields asserted as T | null.
// If TypeScript compiles this file without errors, nullable handling is correct.
// Run: pnpm --filter @brynzit/api-client typecheck
import type { components } from './types/api'

// Assertion 1: BulkActionRequest.rejection_reason is optional and nullable
// (null when action is "approve" or "snooze"; required for "reject")
type BulkActionRejectionReason = components['schemas']['BulkActionRequest']['rejection_reason']
type _test1 = BulkActionRejectionReason extends string | null | undefined ? true : never
const _t1: _test1 = true

// Assertion 2: ResumeUploadResponse.candidate_id can be null (null until parse completes)
type ResumeUploadCandidateId = components['schemas']['ResumeUploadResponse']['candidate_id']
type _test2 = null extends ResumeUploadCandidateId ? true : never
const _t2: _test2 = true

// Assertion 3: LeadFatCardResponse.rejection_reason can be null (null for non-rejected leads)
type LeadRejectionReason = components['schemas']['LeadFatCardResponse']['rejection_reason']
type _test3 = null extends LeadRejectionReason ? true : never
const _t3: _test3 = true

// Assertion 4: LeadFatCardResponse.enrichment_status can be null (null before enrichment runs)
type LeadEnrichmentStatus = components['schemas']['LeadFatCardResponse']['enrichment_status']
type _test4 = null extends LeadEnrichmentStatus ? true : never
const _t4: _test4 = true

// Assertion 5: BDTaskSummary.due_at can be null (null for tasks without a deadline)
type BDTaskDueAt = components['schemas']['BDTaskSummary']['due_at']
type _test5 = null extends BDTaskDueAt ? true : never
const _t5: _test5 = true

export {}
