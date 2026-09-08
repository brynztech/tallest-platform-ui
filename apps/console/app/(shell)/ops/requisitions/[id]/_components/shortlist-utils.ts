import type { components } from '@brynzit/api-client'
import {
  parseMatchEvidence,
  type MatchEvidence,
} from '../../../../_components/match-evidence-data'

type SubmissionResponse = components['schemas']['SubmissionResponse']

// The four live scoring components (backend API_CHANGES.md 2026-09-01):
// signal_composite moved to per-JD judgment, domain_match was removed as a
// never-computed constant. Keys here drive the score-edit dialog directly.
export const SHORTLIST_SCORE_KEYS = [
  'semantic_similarity',
  'skill_exact',
  'skill_cluster',
  'seniority_fit',
] as const

export type ShortlistScoreKey = (typeof SHORTLIST_SCORE_KEYS)[number]
export type ShortlistScoreOverrides = Record<ShortlistScoreKey, number>

export const DEFAULT_SHORTLIST_SCORE_OVERRIDES = shortlistScoreOverridesFromTotal(70)

export type ShortlistEntry = {
  submission_id: string | null
  candidate_id: string
  candidate_name: string | null
  current_title: string | null
  fit_score: number | null
  rank: number
  status: string
  rationale: string | null
  top_matching_skills: string[]
  gaps: string[]
  score_breakdown: Record<string, number>
  missing_must_have: string[]
  /** Judgment verdicts + matched role + career, when the backend sent them. */
  evidence: MatchEvidence | null
  years_experience: number | null
  candidate_ctc: number | null
  candidate_ectc: number | null
}

export function shortlistStatusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-[oklch(0.45_0.15_145)/20] text-[oklch(0.45_0.15_145)] border-[oklch(0.45_0.15_145)/40]'
    case 'rejected':
      return 'text-muted-foreground border-border'
    default:
      return ''
  }
}

export function normalizeShortlistSubmission(
  submission: SubmissionResponse,
  index: number,
): ShortlistEntry {
  const rationale = submission.match_rationale ?? {}
  const summary = rationale['summary'] ?? rationale['rationale']

  return {
    submission_id: submission.id,
    candidate_id: submission.candidate_id ?? '',
    evidence: parseMatchEvidence(
      (submission.match_rationale ?? null) as Record<string, unknown> | null,
    ),
    candidate_name: submission.candidate_name ?? null,
    current_title: submission.candidate_title ?? null,
    fit_score: submission.match_score ?? null,
    rank: index + 1,
    status: submission.status ?? 'shortlisted',
    rationale: typeof summary === 'string' ? summary : null,
    top_matching_skills: Array.isArray(rationale['top_matching_skills'])
      ? rationale['top_matching_skills'].filter(
          (skill): skill is string => typeof skill === 'string',
        )
      : submission.candidate_skills ?? [],
    gaps: Array.isArray(rationale['gaps'])
      ? rationale['gaps'].filter((gap): gap is string => typeof gap === 'string')
      : [],
    score_breakdown: isNumberRecord(rationale['score_breakdown'])
      ? rationale['score_breakdown']
      : {},
    missing_must_have: Array.isArray(rationale['missing_must_have'])
      ? rationale['missing_must_have'].filter(
          (skill): skill is string => typeof skill === 'string',
        )
      : [],
    years_experience: submission.total_years_experience ?? null,
    candidate_ctc: submission.candidate_ctc ?? null,
    candidate_ectc: submission.candidate_ectc ?? null,
  }
}

export function shortlistScoreOverridesFromBreakdown(
  breakdown: Record<string, number>,
): ShortlistScoreOverrides {
  return SHORTLIST_SCORE_KEYS.reduce<ShortlistScoreOverrides>(
    (overrides, key) => ({
      ...overrides,
      [key]: roundScore(breakdown[key] ?? 0),
    }),
    shortlistScoreOverridesFromTotal(0),
  )
}

export function shortlistScoreOverridesFromTotal(total: number): ShortlistScoreOverrides {
  const clampedTotal = clampScore(total)
  const base = Math.floor((clampedTotal / SHORTLIST_SCORE_KEYS.length) * 100) / 100
  const overrides = SHORTLIST_SCORE_KEYS.reduce<ShortlistScoreOverrides>(
    (current, key) => ({ ...current, [key]: base }),
    {} as ShortlistScoreOverrides,
  )
  const lastKey = SHORTLIST_SCORE_KEYS[SHORTLIST_SCORE_KEYS.length - 1]
  overrides[lastKey] = roundScore(
    clampedTotal - base * (SHORTLIST_SCORE_KEYS.length - 1),
  )
  return overrides
}

export function shortlistScoreTotal(overrides: ShortlistScoreOverrides): number {
  return roundScore(
    SHORTLIST_SCORE_KEYS.reduce((total, key) => total + (overrides[key] ?? 0), 0),
  )
}

export function clampScore(value: number): number {
  return roundScore(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)))
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    value != null &&
    typeof value === 'object' &&
    Object.values(value).every((entry) => typeof entry === 'number')
  )
}
