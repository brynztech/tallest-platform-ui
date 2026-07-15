import { describe, expect, it } from 'vitest'
import { definePipeline } from '@brynzit/pipeline'
import {
  applyInternalDecision,
  initialStatusOnSubmit,
  isAiOverride,
  requiresInternalApproval,
} from '../submission'

const mediated = definePipeline({
  id: 'r',
  name: 'r',
  stages: [
    { id: 'gate', label: 'BrynzIT Review', type: 'internal_gate' },
    { id: 'screen', label: 'Founder Screen', type: 'client_stage' },
  ],
})

const direct = definePipeline({
  id: 'r2',
  name: 'r2',
  stages: [{ id: 'screen', label: 'Founder Screen', type: 'client_stage' }],
})

describe('requiresInternalApproval', () => {
  it('is true for a mediated pipeline and false for a direct one', () => {
    expect(requiresInternalApproval(mediated)).toBe(true)
    expect(requiresInternalApproval(direct)).toBe(false)
  })
})

describe('initialStatusOnSubmit', () => {
  it('routes mediated submissions to internal review', () => {
    expect(initialStatusOnSubmit(true)).toBe('in_internal_review')
  })
  it('routes direct submissions straight to the client', () => {
    expect(initialStatusOnSubmit(false)).toBe('submitted_to_client')
  })
})

describe('isAiOverride', () => {
  it('approve overrides an AI reject', () => {
    expect(isAiOverride('reject', 'approve')).toBe(true)
  })
  it('reject overrides an AI advance', () => {
    expect(isAiOverride('advance', 'reject')).toBe(true)
  })
  it('agreeing with the AI is not an override', () => {
    expect(isAiOverride('advance', 'approve')).toBe(false)
    expect(isAiOverride('reject', 'reject')).toBe(false)
  })
  it('hold and unknown are never overrides', () => {
    expect(isAiOverride('reject', 'hold')).toBe(false)
    expect(isAiOverride('unknown', 'approve')).toBe(false)
    expect(isAiOverride('unknown', 'reject')).toBe(false)
  })
})

describe('applyInternalDecision', () => {
  it('approve advances to the client and flags an override of an AI reject', () => {
    const decision = applyInternalDecision({
      action: 'approve',
      actorId: 'usr_quality_manager',
      aiRecommendation: 'reject',
      at: '2026-07-15T00:00:00.000Z',
      reason: 'Strong referral',
    })
    expect(decision).toEqual({
      action: 'approve',
      actorId: 'usr_quality_manager',
      at: '2026-07-15T00:00:00.000Z',
      reason: 'Strong referral',
      overrodeAi: true,
      nextStatus: 'submitted_to_client',
    })
  })

  it('reject moves to internal_rejected', () => {
    const decision = applyInternalDecision({
      action: 'reject',
      actorId: 'usr_quality_manager',
      aiRecommendation: 'reject',
    })
    expect(decision.nextStatus).toBe('internal_rejected')
    expect(decision.overrodeAi).toBe(false)
  })

  it('hold pauses the submission', () => {
    const decision = applyInternalDecision({
      action: 'hold',
      actorId: 'usr_quality_manager',
      aiRecommendation: 'advance',
    })
    expect(decision.nextStatus).toBe('paused')
  })

  it('defaults the timestamp when omitted', () => {
    const decision = applyInternalDecision({
      action: 'approve',
      actorId: 'u',
      aiRecommendation: 'advance',
    })
    expect(Number.isNaN(Date.parse(decision.at))).toBe(false)
  })
})
