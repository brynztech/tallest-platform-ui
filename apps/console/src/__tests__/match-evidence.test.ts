import { describe, expect, it } from 'vitest'
import {
  companyStatLine,
  judgmentStatusLabel,
  parseMatchEvidence,
} from '../../app/(shell)/_components/match-evidence-data'

const FULL_RATIONALE: Record<string, unknown> = {
  rationale: 'Strong founding-engineer fit.',
  flag_verdicts: [
    {
      flag: 'startup experience',
      kind: 'green',
      verdict: 'met',
      quote: 'Founding Engineer, RAMAIN, YC W26',
    },
    { flag: 'needs structure', kind: 'red', verdict: 'not_met', quote: '' },
    { flag: 'researched us', kind: 'green', verdict: 'not_assessable', quote: '' },
    { flag: 'SF onsite', kind: 'hard', verdict: 'unknown', quote: '' },
    { flag: 'malformed', kind: 'nope', verdict: 'met', quote: '' }, // dropped
  ],
  judgment_score: 66.7,
  judgment_status: 'ok',
  matched_role: {
    title: 'Founding Engineer',
    company: 'RAMAIN',
    duration: '2024–now',
    bullets: ['built the deployment pipeline end to end'],
  },
  career: [
    {
      title: 'Founding Engineer',
      company: 'RAMAIN',
      duration: '2024–now',
      years: 1.5,
      company_info: {
        name: 'RamAIn',
        status: 'found',
        source: 'yc',
        data: { yc_batch: 'W26', team_size: 4 },
      },
    },
    { title: 'Eng', company: 'Eventtow', duration: '1y', years: 1, company_info: null },
  ],
}

describe('parseMatchEvidence', () => {
  it('parses the full backend card contract', () => {
    const evidence = parseMatchEvidence(FULL_RATIONALE)
    expect(evidence).not.toBeNull()
    expect(evidence!.verdicts).toHaveLength(4) // malformed kind dropped
    expect(evidence!.verdicts[0].quote).toBe('Founding Engineer, RAMAIN, YC W26')
    expect(evidence!.matchedRole?.company).toBe('RAMAIN')
    expect(evidence!.career).toHaveLength(2)
    expect(evidence!.career[1].company_info).toBeNull()
    expect(evidence!.judgmentScore).toBe(66.7)
  })

  it('returns null for pre-change entries so old cards render unchanged', () => {
    expect(parseMatchEvidence(null)).toBeNull()
    expect(
      parseMatchEvidence({ rationale: 'old entry', top_matching_skills: ['python'] }),
    ).toBeNull()
  })
})

describe('companyStatLine', () => {
  it('prefers YC batch, then funding stage, and shows unknown honestly', () => {
    expect(
      companyStatLine({ name: 'RamAIn', status: 'found', source: 'yc', data: { yc_batch: 'W26', team_size: 4 } }),
    ).toBe('YC W26 · 4 ppl')
    expect(
      companyStatLine({
        name: 'Ola',
        status: 'found',
        source: 'apollo',
        data: {
          latest_funding_stage: 'Debt Financing',
          estimated_num_employees: 30000,
          annual_revenue_printed: '137M',
        },
      }),
    ).toBe('Debt Financing · 30k ppl · rev 137M')
    expect(
      companyStatLine({ name: 'Tiny', status: 'unknown', source: null, data: {} }),
    ).toBe('unknown company')
    expect(companyStatLine(null)).toBeNull()
  })
})

describe('judgmentStatusLabel', () => {
  it('explains degraded statuses and stays quiet for ok/no_flags', () => {
    expect(judgmentStatusLabel('no_facts')).toMatch(/re-parsing/)
    expect(judgmentStatusLabel('skipped_budget')).toMatch(/budget/)
    expect(judgmentStatusLabel('ok')).toBeNull()
    expect(judgmentStatusLabel('no_flags')).toBeNull()
  })
})
