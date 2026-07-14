import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HIRING_STAGES,
  buildIntakeDetailsWithHiringProcess,
  getHiringProcess,
  normalizeEditableStages,
  stageForSubmissionStatus,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/hiring-process'

describe('Per-requisition hiring process', () => {
  it('falls back to a sensible default process when no intake details exist', () => {
    expect(getHiringProcess({ intake_details: null }).stages).toEqual(DEFAULT_HIRING_STAGES)
  })

  it('reads ordered custom stages from requisition intake_details', () => {
    const process = getHiringProcess({
      intake_details: {
        hiring_process: {
          stages: [
            { id: 'final', name: 'Final Round', kind: 'final', order: 3 },
            { id: 'review', name: 'Recruiter Review', kind: 'internal_review', order: 1 },
            { id: 'screen', name: 'Founder Screen', kind: 'client_screen', order: 2 },
          ],
        },
      },
    })

    expect(process.stages.map((stage) => stage.name)).toEqual([
      'Recruiter Review',
      'Founder Screen',
      'Final Round',
    ])
  })

  it('preserves existing intake details when writing hiring process stages', () => {
    const intakeDetails = buildIntakeDetailsWithHiringProcess(
      { source: 'jd_parse', notes: 'Prefers onsite final.' },
      [
        { name: 'Recruiter Review', kind: 'internal_review' },
        { name: 'Client Interview', kind: 'client_screen' },
      ],
    )

    expect(intakeDetails).toMatchObject({
      source: 'jd_parse',
      notes: 'Prefers onsite final.',
      hiring_process: {
        stages: [
          { name: 'Recruiter Review', kind: 'internal_review', order: 1 },
          { name: 'Client Interview', kind: 'client_screen', order: 2 },
        ],
      },
    })
  })

  it('normalizes empty stage edits back to the default stages', () => {
    expect(normalizeEditableStages([{ name: '   ', kind: 'client_screen' }])).toEqual(
      DEFAULT_HIRING_STAGES,
    )
  })

  it('maps existing shortlist statuses onto configured pipeline stages', () => {
    const stages = normalizeEditableStages([
      { name: 'Recruiter Review', kind: 'internal_review' },
      { name: 'Founder Screen', kind: 'client_screen' },
      { name: 'Technical Interview', kind: 'technical' },
    ])

    expect(stageForSubmissionStatus(stages, 'shortlisted')).toBe(stages[0].id)
    expect(stageForSubmissionStatus(stages, 'approved')).toBe(stages[1].id)
    expect(stageForSubmissionStatus(stages, 'rejected')).toBe('rejected')
  })
})
