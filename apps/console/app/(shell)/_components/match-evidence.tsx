'use client'

/**
 * Match evidence sections for a shortlisted candidate — the card contract
 * from the backend's facts/judgment work (talent-platform API_CHANGES.md
 * 2026-09-01). Three sections, each rendered only when its data exists:
 * why-they-surfaced (matched role + proof bullet), career (roles with
 * company-store stats, "unknown company" first-class), and flags (verdicts
 * with verbatim quotes; not-assessable flags become screen questions).
 *
 * Types + parsing live in match-evidence-data.ts (JSX-free for vitest —
 * console CLAUDE.md gotcha #3).
 */

import { Badge } from '@brynzit/ui/components/ui/badge'
import { CheckCircle2, CircleHelp, Flag, XCircle } from 'lucide-react'
import {
  companyDescription,
  companyStatLine,
  judgmentStatusLabel,
  type FlagVerdict,
  type MatchEvidence,
} from './match-evidence-data'

// tokens.json status_colors — reuse the de facto palette, don't invent.
const GREEN = 'oklch(0.45 0.15 145)'
const AMBER = 'oklch(0.65 0.16 70)'

const VERDICT_ORDER: Record<FlagVerdict['verdict'], number> = {
  met: 0,
  not_met: 1,
  unknown: 2,
  not_assessable: 3,
}

export function MatchEvidenceSections({
  evidence,
  /** Suppress the career list when the surrounding screen already renders the
   *  same roles (the candidate panel puts them in its Experience section). */
  hideCareer = false,
}: {
  evidence: MatchEvidence
  hideCareer?: boolean
}) {
  const { matchedRole, career, verdicts, judgmentScore, judgmentStatus } = evidence
  const screenQuestions = verdicts.filter((v) => v.verdict === 'not_assessable')
  const judged = verdicts
    .filter((v) => v.verdict !== 'not_assessable')
    .sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict])
  const statusNote = judgmentStatusLabel(judgmentStatus)

  return (
    <div className="flex flex-col gap-3 text-sm">
      {judgmentScore != null && (
        <p className="text-xs text-muted-foreground">
          Judgment{' '}
          <span className="font-semibold text-foreground">{Math.round(judgmentScore)}</span> · from{' '}
          {judged.filter((v) => v.verdict !== 'unknown').length} determined flag verdicts
        </p>
      )}
      {statusNote && <p className="text-xs italic text-muted-foreground">{statusNote}</p>}

      {matchedRole && (
        <div className="border-l-2 pl-3" style={{ borderColor: GREEN }}>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Why they surfaced
          </p>
          <p className="font-medium">
            {matchedRole.title ?? 'Role'}
            {matchedRole.company ? ` @ ${matchedRole.company}` : ''}
            {matchedRole.duration && (
              <span className="ml-1 font-normal text-muted-foreground">
                · {matchedRole.duration}
              </span>
            )}
          </p>
          {matchedRole.bullets[0] && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              matched on: “{matchedRole.bullets[0]}”
            </p>
          )}
        </div>
      )}

      {!hideCareer && career.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Career</p>
          <ul className="flex flex-col gap-1">
            {career.map((role, index) => {
              const isMatched =
                matchedRole != null &&
                role.title === matchedRole.title &&
                role.company === matchedRole.company
              const stat = companyStatLine(role.company_info)
              const description = companyDescription(role.company_info)
              return (
                <li key={`${role.company}-${index}`} className="text-xs">
                  <span className={isMatched ? 'font-semibold' : undefined}>
                    {isMatched ? '● ' : '○ '}
                    {role.title ?? 'Role'} @ {role.company || '—'}
                  </span>
                  {role.duration && (
                    <span className="text-muted-foreground"> · {role.duration}</span>
                  )}
                  {stat && (
                    <span
                      className={
                        stat === 'unknown company'
                          ? 'ml-1 italic text-muted-foreground'
                          : 'ml-1 text-muted-foreground'
                      }
                    >
                      [{stat}]
                    </span>
                  )}
                  {description && (
                    // Native disclosure — no Collapsible primitive in this kit.
                    <details className="ml-4">
                      <summary className="cursor-pointer text-[11px] text-primary">
                        about {role.company_info?.name ?? role.company}
                      </summary>
                      <p className="text-[11px] text-muted-foreground">{description}</p>
                    </details>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {judged.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Flags</p>
          <ul className="flex flex-col gap-1.5">
            {judged.map((verdict) => (
              <li key={`${verdict.kind}:${verdict.flag}`} className="flex items-start gap-1.5">
                <VerdictIcon verdict={verdict} />
                <div className="min-w-0">
                  <p className="text-xs leading-snug">
                    {verdict.flag}
                    {verdict.kind === 'hard' && (
                      <Badge variant="outline" className="ml-1.5 align-middle text-[10px]">
                        requirement
                      </Badge>
                    )}
                  </p>
                  {verdict.quote ? (
                    <p className="text-[11px] italic text-muted-foreground">“{verdict.quote}”</p>
                  ) : verdict.verdict === 'not_met' ? (
                    <p className="text-[11px] text-muted-foreground">no evidence found</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {screenQuestions.length > 0 && (
        <div className="rounded-md border border-dashed border-border px-3 py-2">
          <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Flag className="size-3" style={{ color: AMBER }} />
            Ask in screen
          </p>
          <ul className="list-inside list-disc text-xs text-muted-foreground">
            {screenQuestions.map((verdict) => (
              <li key={`${verdict.kind}:${verdict.flag}`}>{verdict.flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function VerdictIcon({ verdict }: { verdict: FlagVerdict }) {
  // For red flags the favorable outcome is not_met (the concern is clear),
  // so color tracks favorability, not the literal verdict.
  const favorable =
    (verdict.kind === 'red' && verdict.verdict === 'not_met') ||
    (verdict.kind !== 'red' && verdict.verdict === 'met')
  if (verdict.verdict === 'unknown') {
    return <CircleHelp className="mt-0.5 size-3.5 shrink-0" style={{ color: AMBER }} />
  }
  return favorable ? (
    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" style={{ color: GREEN }} />
  ) : (
    <XCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
  )
}
