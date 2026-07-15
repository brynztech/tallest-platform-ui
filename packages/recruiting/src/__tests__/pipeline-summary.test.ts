import { describe, expect, it } from 'vitest'
import { summarizePipeline } from '../pipeline-summary'

describe('summarizePipeline', () => {
  it('counts each submission status into the right bucket', () => {
    const summary = summarizePipeline([
      'shortlisted',
      'shortlisted',
      'approved',
      'rejected',
      'hold',
      'removed', // ignored bucket, still counts toward total
    ])
    expect(summary).toEqual({
      total: 6,
      awaitingInternalReview: 2,
      approvedToClient: 1,
      rejected: 1,
      onHold: 1,
    })
  })

  it('handles an empty pipeline', () => {
    expect(summarizePipeline([])).toEqual({
      total: 0,
      awaitingInternalReview: 0,
      approvedToClient: 0,
      rejected: 0,
      onHold: 0,
    })
  })
})
