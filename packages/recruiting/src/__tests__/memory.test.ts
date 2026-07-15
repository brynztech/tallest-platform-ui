import { describe, expect, it } from 'vitest'
import {
  checkResubmission,
  priorRejectionsAtClient,
  summarizeCandidateMemory,
  type SubmissionRecord,
} from '../memory'

const records: SubmissionRecord[] = [
  {
    requisitionId: 'req_a',
    clientId: 'client_1',
    clientName: 'Acme',
    roleTitle: 'Backend Engineer',
    status: 'client_rejected',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    requisitionId: 'req_b',
    clientId: 'client_1',
    clientName: 'Acme',
    roleTitle: 'Platform Engineer',
    status: 'client_interviewing',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    requisitionId: 'req_c',
    clientId: 'client_2',
    clientName: 'Globex',
    roleTitle: 'SRE',
    status: 'placed',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
]

describe('summarizeCandidateMemory', () => {
  it('counts totals, active, rejected, and placed', () => {
    const memory = summarizeCandidateMemory(records)
    expect(memory.total).toBe(3)
    expect(memory.rejected).toBe(1)
    expect(memory.placed).toBe(1)
    // client_interviewing is active; client_rejected and placed are terminal
    expect(memory.active).toBe(1)
  })

  it('groups records by client', () => {
    const memory = summarizeCandidateMemory(records)
    const acme = memory.byClient.find((c) => c.clientId === 'client_1')
    expect(acme?.clientName).toBe('Acme')
    expect(acme?.records).toHaveLength(2)
  })

  it('handles an empty history', () => {
    expect(summarizeCandidateMemory([])).toEqual({
      total: 0,
      active: 0,
      rejected: 0,
      placed: 0,
      byClient: [],
    })
  })
})

describe('priorRejectionsAtClient', () => {
  it('returns only rejections at the given client', () => {
    const rejections = priorRejectionsAtClient(records, 'client_1')
    expect(rejections).toHaveLength(1)
    expect(rejections[0].requisitionId).toBe('req_a')
  })
})

describe('checkResubmission', () => {
  it('warns when the candidate was previously rejected at the client', () => {
    const result = checkResubmission(records, { clientId: 'client_1' })
    expect(result.level).toBe('warn')
    expect(result.reasons).toHaveLength(1)
    expect(result.reasons[0]).toContain('Backend Engineer')
  })

  it('is ok when there is no prior rejection at the client', () => {
    const result = checkResubmission(records, { clientId: 'client_2' })
    expect(result.level).toBe('ok')
    expect(result.reasons).toEqual([])
  })

  it('blocks when the client is hard-blocked, overriding a mere warning', () => {
    const result = checkResubmission(records, {
      clientId: 'client_1',
      hardBlockedClientIds: ['client_1'],
    })
    expect(result.level).toBe('blocked')
  })

  it('describes whether the prior rejection was internal or client-side', () => {
    const internal: SubmissionRecord[] = [
      {
        requisitionId: 'req_x',
        clientId: 'client_9',
        roleTitle: 'Data Scientist',
        status: 'internal_rejected',
        updatedAt: '2026-06-15T00:00:00.000Z',
      },
    ]
    const result = checkResubmission(internal, { clientId: 'client_9' })
    expect(result.reasons[0]).toContain('internally')
  })
})
