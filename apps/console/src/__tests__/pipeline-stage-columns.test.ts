import { describe, expect, it } from 'vitest'
import { definePipeline } from '@brynzit/pipeline'
import {
  hiringStageKindToPipelineStageType,
  nextPipelineStage,
  toPipelineDefinition,
} from '../../app/(shell)/pipeline/_lib/pipeline-bridge'
import {
  AWAITING_REVIEW_STAGE_ID,
  groupSubmissionsByPipelineStage,
} from '../../app/(shell)/pipeline/_lib/group-submissions'
import type { HiringStage } from '../../app/(shell)/ops/requisitions/[id]/_lib/hiring-process'
import type { PipelineSubmission } from '../../app/(shell)/_lib/recruiter-data'

const STAGES: HiringStage[] = [
  { id: 'recruiter-review', name: 'Recruiter Review', kind: 'internal_review', order: 1 },
  { id: 'client-screen', name: 'Client Screen', kind: 'client_screen', order: 2 },
  { id: 'technical-interview', name: 'Technical Interview', kind: 'technical', order: 3 },
  { id: 'offer', name: 'Offer', kind: 'offer', order: 4 },
]

function submission(overrides: Partial<PipelineSubmission> & Pick<PipelineSubmission, 'id' | 'status'>) {
  return {
    requisition_id: 'req_1',
    candidate_id: null,
    match_score: null,
    match_rationale: null,
    supply_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    candidate_name: null,
    candidate_email: null,
    candidate_title: null,
    candidate_skills: null,
    requisition: { id: 'req_1', title: 'Backend Engineer', client: null } as PipelineSubmission['requisition'],
    ...overrides,
  } as PipelineSubmission
}

describe('hiringStageKindToPipelineStageType', () => {
  it('maps internal_review to the internal gate type', () => {
    expect(hiringStageKindToPipelineStageType('internal_review')).toBe('internal_gate')
  })

  it('maps every other kind to a client stage', () => {
    for (const kind of ['client_screen', 'technical', 'final', 'offer'] as const) {
      expect(hiringStageKindToPipelineStageType(kind)).toBe('client_stage')
    }
  })
})

describe('toPipelineDefinition', () => {
  it('builds a definition preserving stage order and mapping kinds', () => {
    const definition = toPipelineDefinition('req_1', STAGES)
    expect(definition.id).toBe('req_1')
    expect(definition.stages.map((s) => s.id)).toEqual([
      'recruiter-review',
      'client-screen',
      'technical-interview',
      'offer',
    ])
    expect(definition.stages.map((s) => s.type)).toEqual([
      'internal_gate',
      'client_stage',
      'client_stage',
      'client_stage',
    ])
    expect(definition.transitionPolicy).toBe('forward_only')
  })
})

describe('nextPipelineStage', () => {
  const pipeline = definePipeline(toPipelineDefinition('req_1', STAGES))

  it('advances a null current_stage_id (not yet entered) to the first stage', () => {
    expect(nextPipelineStage(pipeline, null)?.id).toBe('recruiter-review')
  })

  it('advances a mid-pipeline stage to the next one', () => {
    expect(nextPipelineStage(pipeline, 'client-screen')?.id).toBe('technical-interview')
  })

  it('returns null at the final stage', () => {
    expect(nextPipelineStage(pipeline, 'offer')).toBeNull()
  })

  it('returns null for a stale/unconfigured current_stage_id', () => {
    expect(nextPipelineStage(pipeline, 'deleted-stage')).toBeNull()
  })
})

describe('groupSubmissionsByPipelineStage', () => {
  it('buckets interested submissions into the Awaiting Review column', () => {
    const grouped = groupSubmissionsByPipelineStage(
      [submission({ id: 's1', status: 'interested' })],
      STAGES,
    )
    expect(grouped[AWAITING_REVIEW_STAGE_ID]).toHaveLength(1)
  })

  it('buckets an approved submission by its current_stage_id', () => {
    const grouped = groupSubmissionsByPipelineStage(
      [submission({ id: 's2', status: 'approved', current_stage_id: 'technical-interview' })],
      STAGES,
    )
    expect(grouped['technical-interview']).toHaveLength(1)
    expect(grouped['client-screen']).toHaveLength(0)
  })

  it('defaults an approved submission with no current_stage_id to the first stage', () => {
    const grouped = groupSubmissionsByPipelineStage(
      [submission({ id: 's3', status: 'approved', current_stage_id: null })],
      STAGES,
    )
    expect(grouped['recruiter-review']).toHaveLength(1)
  })

  it('falls back to the first stage for a stale current_stage_id', () => {
    const grouped = groupSubmissionsByPipelineStage(
      [submission({ id: 's4', status: 'approved', current_stage_id: 'deleted-stage' })],
      STAGES,
    )
    expect(grouped['recruiter-review']).toHaveLength(1)
  })

  it('excludes rejected submissions — the separate ?stage=rejected view handles those', () => {
    const grouped = groupSubmissionsByPipelineStage(
      [submission({ id: 's5', status: 'rejected' })],
      STAGES,
    )
    expect(Object.values(grouped).flat()).toHaveLength(0)
  })
})
