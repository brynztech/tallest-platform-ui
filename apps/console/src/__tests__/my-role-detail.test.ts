import { describe, expect, it } from 'vitest'
import {
  getSnoozePresetDate,
  isFutureSnoozeDate,
  snoozePresetLabel,
} from '../../app/(shell)/my-roles/[id]/_lib/snooze-presets'
import {
  isTerminalStatus,
  scoreColor,
  statusBadgeClass,
  statusLabel,
} from '../../app/(shell)/my-roles/[id]/_lib/status'
import {
  canSubmitApplications,
  type ShortlistSubmission,
} from '../../app/(shell)/my-roles/[id]/_lib/shortlist'

describe('getSnoozePresetDate', () => {
  it('adds 3 months for the 3-month preset', () => {
    const now = new Date()
    const result = new Date(getSnoozePresetDate(3))
    const expected = new Date(now)
    expected.setMonth(expected.getMonth() + 3)
    expect(result.getUTCFullYear()).toBe(expected.getUTCFullYear())
    expect(result.getUTCMonth()).toBe(expected.getUTCMonth())
  })

  it('adds 6 and 9 months for the other presets', () => {
    const base = new Date(getSnoozePresetDate(3))
    const six = new Date(getSnoozePresetDate(6))
    const nine = new Date(getSnoozePresetDate(9))
    expect(six.getTime()).toBeGreaterThan(base.getTime())
    expect(nine.getTime()).toBeGreaterThan(six.getTime())
  })
})

describe('snoozePresetLabel', () => {
  it('labels each preset in months', () => {
    expect(snoozePresetLabel(3)).toBe('3 months')
    expect(snoozePresetLabel(6)).toBe('6 months')
    expect(snoozePresetLabel(9)).toBe('9 months')
  })
})

describe('isFutureSnoozeDate', () => {
  const now = new Date('2026-08-15T00:00:00.000Z')

  it('rejects empty input', () => {
    expect(isFutureSnoozeDate('', now)).toBe(false)
  })

  it('rejects an unparseable date', () => {
    expect(isFutureSnoozeDate('not-a-date', now)).toBe(false)
  })

  it('rejects a past date', () => {
    expect(isFutureSnoozeDate('2020-01-01', now)).toBe(false)
  })

  it('accepts a future date', () => {
    expect(isFutureSnoozeDate('2030-01-01', now)).toBe(true)
  })
})

describe('isTerminalStatus', () => {
  it('treats approved and rejected as terminal', () => {
    expect(isTerminalStatus('approved')).toBe(true)
    expect(isTerminalStatus('rejected')).toBe(true)
  })

  it('treats every intermediate status as non-terminal', () => {
    for (const status of ['shortlisted', 'interested', 'not_interested', 'no_response', 'snoozed']) {
      expect(isTerminalStatus(status)).toBe(false)
    }
  })
})

describe('statusLabel', () => {
  it('maps every known status to a human label', () => {
    expect(statusLabel('shortlisted')).toBe('Not yet screened')
    expect(statusLabel('interested')).toBe('Interested')
    expect(statusLabel('not_interested')).toBe('Not Interested')
    expect(statusLabel('no_response')).toBe('No Response')
    expect(statusLabel('snoozed')).toBe('Snoozed')
    expect(statusLabel('approved')).toBe('Approved')
    expect(statusLabel('rejected')).toBe('Rejected')
  })

  it('falls back to the raw value for an unknown status', () => {
    expect(statusLabel('mystery')).toBe('mystery')
  })
})

describe('statusBadgeClass', () => {
  it('gives interested and approved the same success-green treatment', () => {
    expect(statusBadgeClass('interested')).toContain('oklch(0.45 0.15 145)')
    expect(statusBadgeClass('approved')).toContain('oklch(0.45 0.15 145)')
  })

  it('gives snoozed the warning-amber treatment', () => {
    expect(statusBadgeClass('snoozed')).toContain('oklch(0.65 0.16 70)')
  })

  it('gives not_interested and rejected the error-red treatment', () => {
    expect(statusBadgeClass('not_interested')).toContain('oklch(0.58 0.2 25)')
    expect(statusBadgeClass('rejected')).toContain('oklch(0.58 0.2 25)')
  })

  it('gives an unstyled status no extra class', () => {
    expect(statusBadgeClass('shortlisted')).toBe('')
    expect(statusBadgeClass('no_response')).toBe('')
  })
})

describe('scoreColor', () => {
  it('matches the shortlist-table.tsx score gradient thresholds', () => {
    expect(scoreColor(90)).toBe('oklch(0.45 0.15 145)')
    expect(scoreColor(75)).toBe('oklch(0.45 0.15 145)')
    expect(scoreColor(60)).toBe('oklch(0.65 0.16 70)')
    expect(scoreColor(50)).toBe('oklch(0.65 0.16 70)')
    expect(scoreColor(30)).toBe('oklch(0.58 0.2 25)')
  })
})

function fixtureSubmission(overrides: Partial<ShortlistSubmission>): ShortlistSubmission {
  return {
    id: 'sub-1',
    requisition_id: 'req-1',
    candidate_id: 'cand-1',
    match_score: 80,
    match_rationale: null,
    status: 'interested',
    supply_notes: null,
    snoozed_until: null,
    submitted_at: null,
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    candidate_name: 'Test Candidate',
    candidate_email: null,
    candidate_title: null,
    candidate_skills: null,
    ...overrides,
  }
}

describe('canSubmitApplications', () => {
  it('is false with no submissions at all', () => {
    expect(canSubmitApplications([])).toBe(false)
  })

  it('is false when nothing is interested yet', () => {
    const submissions = [fixtureSubmission({ status: 'no_response' })]
    expect(canSubmitApplications(submissions)).toBe(false)
  })

  it('is true when at least one candidate is interested and nothing is unscreened', () => {
    const submissions = [
      fixtureSubmission({ id: 'a', status: 'interested' }),
      fixtureSubmission({ id: 'b', status: 'rejected' }),
    ]
    expect(canSubmitApplications(submissions)).toBe(true)
  })

  it('is false while any submission is still raw "shortlisted" (unscreened), even with an interested candidate present', () => {
    const submissions = [
      fixtureSubmission({ id: 'a', status: 'interested' }),
      fixtureSubmission({ id: 'b', status: 'shortlisted' }),
    ]
    expect(canSubmitApplications(submissions)).toBe(false)
  })
})
