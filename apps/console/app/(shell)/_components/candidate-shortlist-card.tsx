'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@brynzit/ui/components/ui/avatar'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Button } from '@brynzit/ui/components/ui/button'
import { Input } from '@brynzit/ui/components/ui/input'
import { Label } from '@brynzit/ui/components/ui/label'
import { CheckCircle2, ChevronDown, ChevronRight, Flag, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { matchScoreToneClass, statusToneClass } from '../_lib/status-tone'
import { parseComp } from './compensation-parse'
import { companyStatLine, isFavorableVerdict, type MatchEvidence } from './match-evidence-data'

/**
 * The shortlist card shared by the recruiter's shortlist (my-roles/[id]) and
 * the AM/admin review screen (ops/requisitions/[id]) — same identity/score/
 * judgment/compensation shell either place, per the Brynz DS shortlist
 * mockup; only the bottom action row differs per screen, so it's a slot
 * (`actions`) rather than a second card component. Mirrors the existing
 * PipelineCardHead split (shared head, screen-owns-the-footer).
 */
export interface CandidateShortlistCardProps {
  name: string | null
  title: string | null
  yearsExperience: number | null
  skills: string[]
  matchScore: number | null
  evidence: MatchEvidence | null
  status: string
  statusLabel: string
  ctc?: number | null
  ectc?: number | null
  /** Omit for a read-only compensation display (no save affordance). */
  onSaveCompensation?: (ctc: number | null, ectc: number | null) => void
  /** Plain-text rationale fallback for entries with no `evidence` (e.g.
   * manually-added candidates never get flag_verdicts/matched_role) — the
   * judgment panel above has nothing to show them otherwise. */
  fallbackNote?: string | null
  /** Third field alongside Current/Expected CTC (the recruiter screen's
   * per-candidate note). Omitted on screens with no such field. */
  compensationExtraField?: ReactNode
  onViewProfile: () => void
  actions: ReactNode
}

export function CandidateShortlistCard({
  name,
  title,
  yearsExperience,
  skills,
  matchScore,
  evidence,
  status,
  statusLabel,
  ctc = null,
  ectc = null,
  onSaveCompensation,
  fallbackNote,
  compensationExtraField,
  onViewProfile,
  actions,
}: CandidateShortlistCardProps) {
  const [open, setOpen] = useState(false)

  const judged = evidence?.verdicts.filter((v) => v.verdict !== 'not_assessable') ?? []
  const positives = judged.filter(isFavorableVerdict)
  const negatives = judged.filter((v) => !isFavorableVerdict(v))
  const questions = evidence?.verdicts.filter((v) => v.verdict === 'not_assessable') ?? []
  const hasJudgment = positives.length > 0 || negatives.length > 0 || questions.length > 0

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(22,18,12,0.04)]">
      <div className="flex flex-wrap items-start gap-4 p-4">
        <Avatar className="size-10">
          <AvatarFallback className="bg-[#E5E3DC] text-[13px] font-medium text-muted-foreground">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onViewProfile}
              className="text-left text-[15px] leading-tight font-semibold hover:underline"
            >
              {name ?? 'Unknown candidate'}
            </button>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] leading-none font-medium whitespace-nowrap',
                statusToneClass(status),
              )}
            >
              <span className="size-[5px] rounded-full bg-current" />
              {statusLabel}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {title ?? 'Candidate'}
            {yearsExperience != null ? ` · ${yearsExperience} yrs experience` : ''}
          </p>
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.slice(0, 6).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[12px] font-normal text-[#3A3B3B]">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {matchScore != null && (
          <div className="flex shrink-0 items-start gap-6">
            <ScoreStat label="Match" value={`${matchScore}%`} toneClass={matchScoreToneClass(matchScore)} />
            {evidence?.judgmentScore != null && (
              <ScoreStat
                label="Judgment"
                value={Math.round(evidence.judgmentScore)}
                toneClass={matchScoreToneClass(evidence.judgmentScore)}
              />
            )}
          </div>
        )}
      </div>

      {fallbackNote && (
        <p className="border-t border-[#ECEAE4] px-4 pt-3 text-[13px] text-[#3A3B3B]">
          {fallbackNote}
        </p>
      )}

      {hasJudgment && (
        <>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#ECEAE4] bg-[#F8F7F3] px-4 py-3">
            {positives.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#3A3B3B]">
                <span className="size-1.5 rounded-full bg-[#317A4F]" />
                {positives.length} signals met
              </span>
            )}
            {negatives.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#3A3B3B]">
                <span className="size-1.5 rounded-full bg-[#BA4642]" />
                {negatives.length} not evidenced
              </span>
            )}
            {questions.length > 0 && (
              <span className="text-[13px] text-muted-foreground">{questions.length} to ask in screen</span>
            )}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="gap-1 text-[13px]" onClick={() => setOpen((v) => !v)}>
              {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {open ? 'Hide judgment' : 'Match judgment'}
            </Button>
          </div>

          {open && (
            <div className="grid gap-6 border-t border-[#ECEAE4] p-4 sm:grid-cols-2">
              <div className="flex flex-col gap-6">
                {evidence?.matchedRole && (
                  <section>
                    <Eyebrow>Why they surfaced</Eyebrow>
                    <div className="rounded-[10px] border border-[#D3E2D7] bg-[#EFF4EF] p-3.5">
                      <p className="text-[15px] font-semibold">
                        {evidence.matchedRole.title ?? 'Role'}
                        {evidence.matchedRole.company ? ` @ ${evidence.matchedRole.company}` : ''}
                      </p>
                      {evidence.matchedRole.duration && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{evidence.matchedRole.duration}</p>
                      )}
                      {evidence.matchedRole.bullets[0] && (
                        <p className="mt-2 text-[13px] text-[#3A3B3B]">“{evidence.matchedRole.bullets[0]}”</p>
                      )}
                    </div>
                  </section>
                )}

                {evidence && evidence.career.length > 0 && (
                  <section>
                    <Eyebrow>Career</Eyebrow>
                    <div className="flex flex-col">
                      {evidence.career.map((role, index) => {
                        const isCurrent = index === 0
                        const stat = companyStatLine(role.company_info)
                        return (
                          <div
                            key={`${role.company}-${index}`}
                            className="flex gap-2.5 border-b border-[#ECEAE4] py-3 last:border-b-0"
                          >
                            <span
                              className={cn(
                                'mt-1.5 size-1.5 shrink-0 rounded-full',
                                isCurrent ? 'bg-foreground' : 'bg-[#C9C7C1]',
                              )}
                            />
                            <div className="min-w-0">
                              <p className={cn('text-sm', isCurrent ? 'font-semibold' : 'font-normal')}>
                                {role.title ?? 'Role'} @ {role.company || '—'}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {role.duration}
                                {stat ? ` · ${stat}` : ''}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {questions.length > 0 && (
                  <section>
                    <Eyebrow>Ask in screen</Eyebrow>
                    <div className="flex flex-col gap-2 rounded-[10px] border border-[#E8CEAE] bg-[#F4E8DA] p-3.5">
                      {questions.map((q) => (
                        <div key={q.flag} className="flex gap-2">
                          <Flag className="mt-0.5 size-3.5 shrink-0 text-[#905300]" />
                          <span className="text-[13px] text-[#5C3A06]">{q.flag}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="flex flex-col gap-6">
                {positives.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-baseline gap-2">
                      <Eyebrow>Signals met</Eyebrow>
                      <span className="text-xs text-[#908E8B]">{positives.length} of {judged.length} verdicts</span>
                    </div>
                    <div className="overflow-hidden rounded-[10px] border border-[#D3E2D7]">
                      {positives.map((v, i) => (
                        <div
                          key={v.flag}
                          className={cn('flex gap-2.5 bg-card p-3.5', i > 0 && 'border-t border-[#E2ECE5]')}
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#317A4F]" />
                          <div className="min-w-0">
                            <p className="text-[13px]">{v.flag}</p>
                            {v.quote && <p className="mt-1 text-xs text-[#317A4F]">{v.quote}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {negatives.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-baseline gap-2">
                      <Eyebrow>Not evidenced</Eyebrow>
                      <span className="text-xs text-[#908E8B]">{negatives.length} of {judged.length} verdicts</span>
                    </div>
                    <div className="overflow-hidden rounded-[10px] border border-[#F0D9D6]">
                      {negatives.map((v, i) => (
                        <div
                          key={v.flag}
                          className={cn('flex gap-2.5 bg-card p-3.5', i > 0 && 'border-t border-[#F5E4E2]')}
                        >
                          <XCircle className="mt-0.5 size-4 shrink-0 text-[#BA4642]" />
                          <div className="min-w-0">
                            <p className="text-[13px]">{v.flag}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {v.quote || 'No evidence found in the profile.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Dashed rule — the one dashed divider in the system, reserved
                  for "content above, footer-ish controls below" (see the
                  standard card anatomy in app/CLAUDE.md §2). */}
              <div className="sm:col-span-2">
                <div className="border-t border-dashed border-border pt-4">
                  <CompensationRow
                    ctc={ctc}
                    ectc={ectc}
                    onSave={onSaveCompensation}
                    extraField={compensationExtraField}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* No judgment data at all (manual-add, pre-facts) means no expand
          toggle exists to hold this — fall back to always-visible so
          compensation stays reachable rather than disappearing outright. */}
      {!hasJudgment && (
        <div className="border-t border-[#ECEAE4] px-4 py-3">
          <CompensationRow
            ctc={ctc}
            ectc={ectc}
            onSave={onSaveCompensation}
            extraField={compensationExtraField}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-[#ECEAE4] p-4">{actions}</div>
    </article>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{children}</p>
  )
}

function ScoreStat({ label, value, toneClass }: { label: string; value: string | number; toneClass: string }) {
  return (
    <div className="text-right">
      <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{label}</div>
      <div className="mt-1.5 flex items-center justify-end gap-1.5">
        <span className={cn('size-1.5 rounded-full bg-current', toneClass)} />
        <span className={cn('text-xl font-semibold', toneClass)}>{value}</span>
      </div>
    </div>
  )
}

function initials(name: string | null | undefined): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function draftOf(value: number | null): string {
  return value != null ? String(value) : ''
}

/** Always-editable — matches the reference design (three inputs in a row,
 * no separate view/edit toggle). onSave omitted = read-only (ops review
 * screen, which has no compensation-edit endpoint of its own). */
function CompensationRow({
  ctc,
  ectc,
  onSave,
  extraField,
}: {
  ctc: number | null
  ectc: number | null
  onSave?: (ctc: number | null, ectc: number | null) => void
  extraField?: ReactNode
}) {
  const [ctcDraft, setCtcDraft] = useState(draftOf(ctc))
  const [ectcDraft, setEctcDraft] = useState(draftOf(ectc))
  const [inputError, setInputError] = useState(false)

  // Resync when the saved value changes underneath us (e.g. a refetch after save).
  useEffect(() => setCtcDraft(draftOf(ctc)), [ctc])
  useEffect(() => setEctcDraft(draftOf(ectc)), [ectc])

  function handleSave() {
    const nextCtc = parseComp(ctcDraft)
    const nextEctc = parseComp(ectcDraft)
    if (nextCtc === 'invalid' || nextEctc === 'invalid') {
      setInputError(true)
      return
    }
    setInputError(false)
    // Blurring an untouched (or re-blanked-then-refocused) field is not an
    // edit — only call onSave when something actually changed, so tabbing
    // through the row doesn't fire a save + "Compensation updated." toast
    // per field.
    if (nextCtc === ctc && nextEctc === ectc) return
    onSave?.(nextCtc, nextEctc)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="current-ctc">Current CTC</Label>
          <Input
            id="current-ctc"
            className="mt-1.5 h-9"
            value={ctcDraft}
            onChange={(e) => setCtcDraft(e.target.value)}
            onBlur={handleSave}
            placeholder="₹48L"
            inputMode="numeric"
            disabled={!onSave}
            aria-invalid={inputError || undefined}
          />
        </div>
        <div>
          <Label htmlFor="expected-ctc">Expected CTC</Label>
          <Input
            id="expected-ctc"
            className="mt-1.5 h-9"
            value={ectcDraft}
            onChange={(e) => setEctcDraft(e.target.value)}
            onBlur={handleSave}
            placeholder="₹70L"
            inputMode="numeric"
            disabled={!onSave}
            aria-invalid={inputError || undefined}
          />
        </div>
        {extraField}
      </div>
      {inputError && (
        <p className="text-xs text-destructive">
          Enter numbers only (e.g. 1200000), or leave blank to clear.
        </p>
      )}
    </div>
  )
}
