import { describe, expect, it } from 'vitest'
import {
  isLiveRequisitionStatus,
  requisitionStatusLabel,
} from '../../app/(shell)/_lib/requisition-status'
import {
  canTriggerCandidateMatch,
  isRequisitionTerminal,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/match-status'

describe('requisitionStatusLabel', () => {
  it('hides matching_complete behind Open', () => {
    expect(requisitionStatusLabel('open')).toBe('Open')
    expect(requisitionStatusLabel('matching_complete')).toBe('Open')
    expect(requisitionStatusLabel('closed')).toBe('Closed')
    expect(requisitionStatusLabel('filled')).toBe('Filled')
    expect(requisitionStatusLabel('draft')).toBe('Draft')
  })

  it('treats matching_complete as a live role for counts', () => {
    expect(isLiveRequisitionStatus('open')).toBe(true)
    expect(isLiveRequisitionStatus('matching_complete')).toBe(true)
    expect(isLiveRequisitionStatus('closed')).toBe(false)
    expect(isLiveRequisitionStatus('draft')).toBe(false)
  })
})

describe('isRequisitionTerminal', () => {
  it('treats closed and filled as terminal', () => {
    expect(isRequisitionTerminal('closed')).toBe(true)
    expect(isRequisitionTerminal('filled')).toBe(true)
  })

  it('treats open and matching_complete as non-terminal', () => {
    expect(isRequisitionTerminal('open')).toBe(false)
    expect(isRequisitionTerminal('matching_complete')).toBe(false)
  })

  it('is the exact complement of canTriggerCandidateMatch for every known status', () => {
    for (const status of ['open', 'matching_complete', 'closed', 'filled']) {
      expect(isRequisitionTerminal(status)).toBe(!canTriggerCandidateMatch(status))
    }
  })
})
