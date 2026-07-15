import { describe, expect, it } from 'vitest'
import { hasInternalGate } from '@brynzit/pipeline'
import {
  getRequisitionPipeline,
  hiringKindToStageType,
  pipelineIsMediated,
  withMediationGate,
  type EditableStage,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/requisition-pipeline'

function reqWith(stages: Array<{ id: string; name: string; kind: string; order: number }>) {
  return {
    id: 'req_1',
    title: 'Backend Engineer',
    intake_details: { hiring_process: { stages } },
  }
}

describe('hiringKindToStageType', () => {
  it('maps internal_review to the internal gate type', () => {
    expect(hiringKindToStageType('internal_review')).toBe('internal_gate')
  })

  it('maps every other kind to a client stage', () => {
    for (const kind of ['client_screen', 'technical', 'final', 'offer'] as const) {
      expect(hiringKindToStageType(kind)).toBe('client_stage')
    }
  })
})

describe('getRequisitionPipeline', () => {
  it('builds a validated, ordered generic pipeline from intake_details', () => {
    const pipeline = getRequisitionPipeline(
      reqWith([
        { id: 'review', name: 'BrynzIT Review', kind: 'internal_review', order: 1 },
        { id: 'screen', name: 'Founder Screen', kind: 'client_screen', order: 2 },
        { id: 'offer', name: 'Offer', kind: 'offer', order: 3 },
      ]),
    )
    expect(pipeline.stages.map((s) => s.id)).toEqual(['review', 'screen', 'offer'])
    expect(pipeline.stages.map((s) => s.type)).toEqual([
      'internal_gate',
      'client_stage',
      'client_stage',
    ])
    expect(pipeline.transitionPolicy).toBe('forward_only')
  })

  it('falls back to the default process when none is configured', () => {
    const pipeline = getRequisitionPipeline({ id: 'r', title: 'X', intake_details: null })
    expect(pipeline.stages.length).toBeGreaterThan(0)
    expect(hasInternalGate(pipeline)).toBe(true)
  })
})

describe('pipelineIsMediated', () => {
  it('is true when an internal gate is present', () => {
    expect(
      pipelineIsMediated(
        reqWith([
          { id: 'review', name: 'BrynzIT Review', kind: 'internal_review', order: 1 },
          { id: 'offer', name: 'Offer', kind: 'offer', order: 2 },
        ]),
      ),
    ).toBe(true)
  })

  it('is false for a direct pipeline', () => {
    expect(
      pipelineIsMediated(
        reqWith([
          { id: 'screen', name: 'Founder Screen', kind: 'client_screen', order: 1 },
          { id: 'offer', name: 'Offer', kind: 'offer', order: 2 },
        ]),
      ),
    ).toBe(false)
  })
})

describe('withMediationGate', () => {
  const clientStages: EditableStage[] = [
    { name: 'Founder Screen', kind: 'client_screen' },
    { name: 'Offer', kind: 'offer' },
  ]

  it('prepends the default gate when enabling on a direct pipeline', () => {
    const result = withMediationGate(clientStages, true)
    expect(result[0]).toEqual({ name: 'BrynzIT Review', kind: 'internal_review' })
    expect(result).toHaveLength(3)
  })

  it('strips internal gates when disabling', () => {
    const mediated: EditableStage[] = [
      { name: 'BrynzIT Review', kind: 'internal_review' },
      ...clientStages,
    ]
    const result = withMediationGate(mediated, false)
    expect(result.every((s) => s.kind !== 'internal_review')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('preserves an existing gate rather than duplicating it', () => {
    const mediated: EditableStage[] = [
      { name: 'Custom Screen', kind: 'internal_review' },
      ...clientStages,
    ]
    const result = withMediationGate(mediated, true)
    expect(result.filter((s) => s.kind === 'internal_review')).toHaveLength(1)
    expect(result[0]).toEqual({ name: 'Custom Screen', kind: 'internal_review' })
  })

  it('keeps client stages in their relative order', () => {
    const result = withMediationGate(clientStages, true)
    expect(result.slice(1).map((s) => s.name)).toEqual(['Founder Screen', 'Offer'])
  })
})
