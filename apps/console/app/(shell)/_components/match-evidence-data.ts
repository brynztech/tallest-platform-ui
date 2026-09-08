/**
 * Match evidence sections for a shortlisted candidate — the card contract
 * from the backend's facts/judgment work (talent-platform API_CHANGES.md
 * 2026-09-01). Three sections, each rendered only when its data exists:
 *
 * 1. Why they surfaced — the role whose vector won, with its proof bullet.
 * 2. Career — every role with company-store stats; "unknown company" is a
 *    first-class display value, never hidden.
 * 3. Flags — per-JD-flag verdicts with the verbatim resume quote behind
 *    each ✓; not-assessable flags become recruiter screen questions.
 *
 * Data arrives inside `match_rationale` (free-form JSONB) on both the
 * supply submission and the ops shortlist entry, so `parseMatchEvidence`
 * validates defensively and returns null when none of the new fields are
 * present (entries from before the backend change).
 */

// Pure data layer for the match-evidence card (types + parsing + display
// strings). Kept JSX-free in its own .ts module because this app's vitest
// cannot transform .tsx imports (console CLAUDE.md gotcha #3) — logic
// tests import from here.

export interface FlagVerdict {
  flag: string
  kind: 'green' | 'red' | 'hard'
  verdict: 'met' | 'not_met' | 'unknown' | 'not_assessable'
  quote: string
}

export interface MatchedRole {
  title: string | null
  company: string | null
  duration: string | null
  bullets: string[]
}

export interface CareerCompanyInfo {
  name: string
  status: 'found' | 'unknown' | 'lookup_failed'
  source: string | null
  data: Record<string, unknown>
}

export interface CareerRole {
  title: string | null
  company: string
  duration: string | null
  years: number | null
  company_info: CareerCompanyInfo | null
}

export interface MatchEvidence {
  matchedRole: MatchedRole | null
  career: CareerRole[]
  verdicts: FlagVerdict[]
  judgmentScore: number | null
  judgmentStatus: string
}

const VERDICTS = new Set(['met', 'not_met', 'unknown', 'not_assessable'])
const KINDS = new Set(['green', 'red', 'hard'])

export function parseMatchEvidence(
  rationale: Record<string, unknown> | null | undefined,
): MatchEvidence | null {
  if (!rationale) return null

  const verdicts: FlagVerdict[] = Array.isArray(rationale['flag_verdicts'])
    ? rationale['flag_verdicts'].flatMap((v): FlagVerdict[] => {
        if (typeof v !== 'object' || v === null) return []
        const r = v as Record<string, unknown>
        if (
          typeof r['flag'] !== 'string' ||
          !KINDS.has(String(r['kind'])) ||
          !VERDICTS.has(String(r['verdict']))
        )
          return []
        return [
          {
            flag: r['flag'],
            kind: r['kind'] as FlagVerdict['kind'],
            verdict: r['verdict'] as FlagVerdict['verdict'],
            quote: typeof r['quote'] === 'string' ? r['quote'] : '',
          },
        ]
      })
    : []

  const rawRole = rationale['matched_role']
  const matchedRole: MatchedRole | null =
    typeof rawRole === 'object' && rawRole !== null
      ? {
          title: strOrNull((rawRole as Record<string, unknown>)['title']),
          company: strOrNull((rawRole as Record<string, unknown>)['company']),
          duration: strOrNull((rawRole as Record<string, unknown>)['duration']),
          bullets: Array.isArray((rawRole as Record<string, unknown>)['bullets'])
            ? ((rawRole as Record<string, unknown>)['bullets'] as unknown[]).filter(
                (b): b is string => typeof b === 'string',
              )
            : [],
        }
      : null

  const career: CareerRole[] = Array.isArray(rationale['career'])
    ? rationale['career'].flatMap((c): CareerRole[] => {
        if (typeof c !== 'object' || c === null) return []
        const r = c as Record<string, unknown>
        const info = r['company_info']
        return [
          {
            title: strOrNull(r['title']),
            company: strOrNull(r['company']) ?? '',
            duration: strOrNull(r['duration']),
            years: typeof r['years'] === 'number' ? r['years'] : null,
            company_info:
              typeof info === 'object' && info !== null
                ? {
                    name: strOrNull((info as Record<string, unknown>)['name']) ?? '',
                    status: (['found', 'unknown', 'lookup_failed'].includes(
                      String((info as Record<string, unknown>)['status']),
                    )
                      ? (info as Record<string, unknown>)['status']
                      : 'unknown') as CareerCompanyInfo['status'],
                    source: strOrNull((info as Record<string, unknown>)['source']),
                    data:
                      typeof (info as Record<string, unknown>)['data'] === 'object' &&
                      (info as Record<string, unknown>)['data'] !== null
                        ? ((info as Record<string, unknown>)['data'] as Record<string, unknown>)
                        : {},
                  }
                : null,
          },
        ]
      })
    : []

  const judgmentScore =
    typeof rationale['judgment_score'] === 'number' ? rationale['judgment_score'] : null
  const judgmentStatus =
    typeof rationale['judgment_status'] === 'string' ? rationale['judgment_status'] : ''

  if (!matchedRole && career.length === 0 && verdicts.length === 0 && !judgmentStatus) {
    return null // pre-change entry: render nothing new
  }
  return { matchedRole, career, verdicts, judgmentScore, judgmentStatus }
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

/** One-line company stat: "YC W26 · 4 ppl" / "Series B · 300 ppl · rev $12M". */
export function companyStatLine(info: CareerCompanyInfo | null): string | null {
  if (!info) return null
  if (info.status !== 'found') return 'unknown company'
  const d = info.data
  const parts: string[] = []
  if (typeof d['yc_batch'] === 'string' && d['yc_batch']) parts.push(`YC ${d['yc_batch']}`)
  else if (typeof d['latest_funding_stage'] === 'string' && d['latest_funding_stage'])
    parts.push(String(d['latest_funding_stage']))
  const size = d['team_size'] ?? d['estimated_num_employees']
  if (typeof size === 'number') parts.push(`${formatCount(size)} ppl`)
  if (typeof d['annual_revenue_printed'] === 'string' && d['annual_revenue_printed'])
    parts.push(`rev ${d['annual_revenue_printed']}`)
  return parts.length > 0 ? parts.join(' · ') : 'verified'
}

function formatCount(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}

export function judgmentStatusLabel(status: string): string | null {
  switch (status) {
    case 'no_facts':
      return 'No extracted facts yet — resume needs re-parsing'
    case 'failed':
      return 'Judgment unavailable for this run'
    case 'skipped_budget':
      return 'Not judged this run (budget cap)'
    case 'no_flags':
      return null // JD defines no flags: nothing to say
    default:
      return null
  }
}

/** A verdict counts in the candidate's favor — green flags met, red flags
 * NOT met (the concern didn't materialize). Shared by match-evidence.tsx's
 * flag icon and candidate-shortlist-card.tsx's signals-met/not-evidenced split. */
export function isFavorableVerdict(verdict: FlagVerdict): boolean {
  return (
    (verdict.kind === 'red' && verdict.verdict === 'not_met') ||
    (verdict.kind !== 'red' && verdict.verdict === 'met')
  )
}

export function companyDescription(info: CareerCompanyInfo | null): string | null {
  if (!info || info.status !== 'found') return null
  const d = info.data
  const description = d['short_description'] ?? d['one_liner']
  return typeof description === 'string' && description ? description : null
}

