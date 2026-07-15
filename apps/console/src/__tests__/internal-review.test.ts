import { describe, expect, it } from 'vitest'
import { describeDecision } from '../../app/(shell)/ops/quality-review/_lib/internal-review'

describe('describeDecision', () => {
  it('flags approving an AI-rejected candidate as an override advancing to the client', () => {
    const decision = describeDecision('approve', 'reject', 'usr_quality_manager')
    expect(decision.overrodeAi).toBe(true)
    expect(decision.nextStatus).toBe('submitted_to_client')
  })

  it('does not flag an override when the human agrees with the AI', () => {
    const decision = describeDecision('approve', 'advance', 'usr_quality_manager')
    expect(decision.overrodeAi).toBe(false)
    expect(decision.nextStatus).toBe('submitted_to_client')
  })

  it('rejecting sends the submission to internal_rejected', () => {
    const decision = describeDecision('reject', 'advance', 'usr_quality_manager')
    expect(decision.nextStatus).toBe('internal_rejected')
    expect(decision.overrodeAi).toBe(true)
  })

  it('holding pauses the submission and is never an override', () => {
    const decision = describeDecision('hold', 'reject', 'usr_quality_manager')
    expect(decision.nextStatus).toBe('paused')
    expect(decision.overrodeAi).toBe(false)
  })
})
