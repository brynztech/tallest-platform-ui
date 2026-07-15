import { REJECTED_STATUSES, TERMINAL_STATUSES, type SubmissionStatus } from './submission'

/**
 * Candidate relationship memory (spec D5): where a candidate has been submitted,
 * rejected, shortlisted, or paused — across every role and client. Rejection is
 * never a delete; it becomes history that informs future submissions.
 */

/** A single prior submission for a candidate, as remembered. */
export interface SubmissionRecord {
  requisitionId: string
  clientId: string
  clientName?: string
  roleTitle?: string
  status: SubmissionStatus
  /** ISO-8601 timestamp of the last update. */
  updatedAt: string
}

export interface ClientMemory {
  clientId: string
  clientName?: string
  records: SubmissionRecord[]
}

export interface CandidateMemory {
  total: number
  active: number
  rejected: number
  placed: number
  byClient: ClientMemory[]
}

function isActive(status: SubmissionStatus): boolean {
  return !TERMINAL_STATUSES.includes(status)
}

/** Summarize a candidate's history across all their submissions. */
export function summarizeCandidateMemory(records: SubmissionRecord[]): CandidateMemory {
  const byClientMap = new Map<string, ClientMemory>()

  for (const record of records) {
    const existing = byClientMap.get(record.clientId)
    if (existing) {
      existing.records.push(record)
      if (record.clientName && !existing.clientName) existing.clientName = record.clientName
    } else {
      byClientMap.set(record.clientId, {
        clientId: record.clientId,
        ...(record.clientName ? { clientName: record.clientName } : {}),
        records: [record],
      })
    }
  }

  return {
    total: records.length,
    active: records.filter((r) => isActive(r.status)).length,
    rejected: records.filter((r) => REJECTED_STATUSES.includes(r.status)).length,
    placed: records.filter((r) => r.status === 'placed').length,
    byClient: [...byClientMap.values()],
  }
}

/** Prior rejections for a candidate at a specific client. */
export function priorRejectionsAtClient(
  records: SubmissionRecord[],
  clientId: string,
): SubmissionRecord[] {
  return records.filter(
    (r) => r.clientId === clientId && REJECTED_STATUSES.includes(r.status),
  )
}

export type ResubmissionLevel = 'ok' | 'warn' | 'blocked'

export interface ResubmissionCheck {
  level: ResubmissionLevel
  reasons: string[]
}

export interface ResubmissionOptions {
  clientId: string
  /** Clients where a manager has set an explicit hard block for this candidate. */
  hardBlockedClientIds?: string[]
}

/**
 * Guard against blind re-submission (spec: "Do not resubmit candidates blindly
 * to the same company").
 *
 * - `blocked`: a manager hard-blocked this candidate at the client.
 * - `warn`: the candidate was previously rejected at this client — allowed, but
 *   surfaced with prior context so the recruiter decides deliberately.
 * - `ok`: no prior rejection or block at this client.
 */
export function checkResubmission(
  records: SubmissionRecord[],
  { clientId, hardBlockedClientIds = [] }: ResubmissionOptions,
): ResubmissionCheck {
  if (hardBlockedClientIds.includes(clientId)) {
    return {
      level: 'blocked',
      reasons: ['A manager has hard-blocked this candidate for this client.'],
    }
  }

  const rejections = priorRejectionsAtClient(records, clientId)
  if (rejections.length > 0) {
    return {
      level: 'warn',
      reasons: rejections.map((r) => {
        const role = r.roleTitle ?? r.requisitionId
        const where = r.status === 'internal_rejected' ? 'internally' : 'by the client'
        return `Previously rejected ${where} for "${role}".`
      }),
    }
  }

  return { level: 'ok', reasons: [] }
}
