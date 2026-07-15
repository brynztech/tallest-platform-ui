import { describe, expect, it } from 'vitest'
import {
  allowedTransitions,
  canTransition,
  definePipeline,
  firstStage,
  getStage,
  hasInternalGate,
  lastStage,
  stageAfter,
  stageBefore,
  transition,
} from '../engine'
import type { PipelineDefinition } from '../types'

/** A recruiting-shaped mediated pipeline used as a fixture (domain data). */
const mediatedDefinition: PipelineDefinition = {
  id: 'req_mediated',
  name: 'Backend Engineer (mediated)',
  stages: [
    { id: 'brynzit_review', label: 'BrynzIT Review', type: 'internal_gate' },
    { id: 'pending_approval', label: 'Pending Approval', type: 'internal_gate' },
    { id: 'founder_screen', label: 'Founder Screen', type: 'client_stage' },
    { id: 'take_home', label: 'Take Home', type: 'client_stage' },
    { id: 'final_round', label: 'Final Round', type: 'client_stage' },
    { id: 'offer', label: 'Offer', type: 'client_stage' },
  ],
  transitionPolicy: 'forward_only',
}

/** A direct pipeline: no internal gate, recruiter submits straight to client. */
const directDefinition: PipelineDefinition = {
  id: 'req_direct',
  name: 'Designer (direct)',
  stages: [
    { id: 'founder_screen', label: 'Founder Screen', type: 'client_stage' },
    { id: 'offer', label: 'Offer', type: 'client_stage' },
  ],
}

describe('definePipeline', () => {
  it('assigns order by array position and defaults policy to flexible', () => {
    const pipeline = definePipeline(directDefinition)
    expect(pipeline.stages.map((s) => s.order)).toEqual([0, 1])
    expect(pipeline.transitionPolicy).toBe('flexible')
  })

  it('throws on empty stages', () => {
    expect(() => definePipeline({ id: 'x', name: 'x', stages: [] })).toThrow(/at least one stage/)
  })

  it('throws on duplicate stage ids', () => {
    expect(() =>
      definePipeline({
        id: 'x',
        name: 'x',
        stages: [
          { id: 'dup', label: 'A', type: 'client_stage' },
          { id: 'dup', label: 'B', type: 'client_stage' },
        ],
      }),
    ).toThrow(/duplicate stage id/)
  })
})

describe('stage navigation', () => {
  const pipeline = definePipeline(mediatedDefinition)

  it('exposes first and last stages', () => {
    expect(firstStage(pipeline).id).toBe('brynzit_review')
    expect(lastStage(pipeline).id).toBe('offer')
  })

  it('walks forwards and backwards', () => {
    expect(stageAfter(pipeline, 'founder_screen')?.id).toBe('take_home')
    expect(stageBefore(pipeline, 'founder_screen')?.id).toBe('pending_approval')
    expect(stageAfter(pipeline, 'offer')).toBeNull()
    expect(stageBefore(pipeline, 'brynzit_review')).toBeNull()
  })

  it('returns undefined for unknown stage lookups', () => {
    expect(getStage(pipeline, 'nope')).toBeUndefined()
  })
})

describe('hasInternalGate (mediated vs direct)', () => {
  it('is true when an internal gate exists', () => {
    expect(hasInternalGate(definePipeline(mediatedDefinition))).toBe(true)
  })

  it('is false for a direct pipeline', () => {
    expect(hasInternalGate(definePipeline(directDefinition))).toBe(false)
  })
})

describe('allowedTransitions', () => {
  it('forward_only allows only later stages', () => {
    const pipeline = definePipeline(mediatedDefinition)
    const ids = allowedTransitions(pipeline, 'founder_screen').map((s) => s.id)
    expect(ids).toEqual(['take_home', 'final_round', 'offer'])
  })

  it('forward_only entry is the first stage only', () => {
    const pipeline = definePipeline(mediatedDefinition)
    expect(allowedTransitions(pipeline, null).map((s) => s.id)).toEqual(['brynzit_review'])
  })

  it('flexible allows any other stage, including backwards', () => {
    const pipeline = definePipeline({ ...directDefinition, transitionPolicy: 'flexible' })
    const ids = allowedTransitions(pipeline, 'offer').map((s) => s.id)
    expect(ids).toEqual(['founder_screen'])
  })

  it('returns empty for an unknown source stage', () => {
    const pipeline = definePipeline(mediatedDefinition)
    expect(allowedTransitions(pipeline, 'nope')).toEqual([])
  })
})

describe('canTransition', () => {
  const pipeline = definePipeline(mediatedDefinition)

  it('permits a forward move', () => {
    expect(canTransition(pipeline, 'brynzit_review', 'founder_screen')).toBe(true)
  })

  it('rejects a backward move under forward_only', () => {
    expect(canTransition(pipeline, 'offer', 'founder_screen')).toBe(false)
  })
})

describe('transition', () => {
  const pipeline = definePipeline(mediatedDefinition)

  it('produces a stage event on a valid move', () => {
    const result = transition(pipeline, {
      fromStageId: 'brynzit_review',
      toStageId: 'pending_approval',
      actorId: 'usr_quality_manager',
      at: '2026-07-15T00:00:00.000Z',
      id: 'evt_1',
      note: 'Looks strong',
    })
    expect(result).toEqual({
      ok: true,
      event: {
        id: 'evt_1',
        pipelineId: 'req_mediated',
        fromStageId: 'brynzit_review',
        toStageId: 'pending_approval',
        actorId: 'usr_quality_manager',
        at: '2026-07-15T00:00:00.000Z',
        note: 'Looks strong',
      },
    })
  })

  it('generates an id and timestamp when omitted', () => {
    const result = transition(pipeline, {
      fromStageId: null,
      toStageId: 'brynzit_review',
      actorId: 'usr_recruiter',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.event.id).toMatch(/[0-9a-f-]{36}/)
      expect(Number.isNaN(Date.parse(result.event.at))).toBe(false)
    }
  })

  it('rejects an unknown target stage', () => {
    const result = transition(pipeline, {
      fromStageId: 'brynzit_review',
      toStageId: 'nope',
      actorId: 'usr_admin',
    })
    expect(result).toEqual({ ok: false, error: 'Unknown target stage "nope"' })
  })

  it('rejects a disallowed transition', () => {
    const result = transition(pipeline, {
      fromStageId: 'offer',
      toStageId: 'brynzit_review',
      actorId: 'usr_admin',
    })
    expect(result.ok).toBe(false)
  })
})
