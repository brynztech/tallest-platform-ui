import { describe, expect, it } from 'vitest'
import {
  canTriggerCandidateMatch,
  isRequisitionTerminal,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/match-status'

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
