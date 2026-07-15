'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Sparkles } from 'lucide-react'
import {
  matchStrength,
  rankSuggestions,
  recommendationFromScore,
  type MatchStrength,
} from '@brynzit/recruiting'
import { useCan } from '@brynzit/identity'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { normalizeShortlistSubmission } from './shortlist-utils'

interface MatchmakerPanelProps {
  reqId: string
  onCandidateSelect: (candidateId: string, submissionId: string | null) => void
}

const STRENGTH_LABEL: Record<MatchStrength, string> = {
  strong: 'Strong',
  partial: 'Partial',
  weak: 'Weak',
}

/**
 * AI Matchmaker summary for a requisition. A read-only lens over the same
 * shortlist the recruiter acts on below — it ranks candidates by AI match score
 * and surfaces the AI's recommendation. Humans always decide in the shortlist
 * table (spec D4): this panel never advances anyone.
 */
export function MatchmakerPanel({ reqId, onCandidateSelect }: MatchmakerPanelProps) {
  const can = useCan()
  const canShortlist = can('candidate.shortlist')

  const { data: submissions = [] } = useQuery({
    queryKey: ['supply-shortlist', reqId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/supply/shortlists/{requisition_id}', {
        params: { path: { requisition_id: reqId } },
      })
      if (error) throw error
      return data.submissions
    },
    staleTime: 30 * 1000,
  })

  const ranked = useMemo(() => {
    const suggestions = submissions.map(normalizeShortlistSubmission).map((entry) => ({
      candidateId: entry.candidate_id,
      candidateName: entry.candidate_name,
      currentTitle: entry.current_title,
      submissionId: entry.submission_id,
      rationale: entry.rationale,
      score: entry.fit_score,
    }))
    return rankSuggestions(suggestions)
  }, [submissions])

  const counts = useMemo(() => {
    const tally: Record<MatchStrength, number> = { strong: 0, partial: 0, weak: 0 }
    for (const suggestion of ranked) tally[matchStrength(suggestion.score)] += 1
    return tally
  }, [ranked])

  // Nothing to suggest, or the acting user cannot shortlist — render nothing.
  if (!canShortlist || ranked.length === 0) return null

  const top = ranked.slice(0, 3)

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-base font-semibold">AI Matchmaker</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Suggested fits for this role, ranked by AI match score. You decide in the shortlist
            below — the AI never advances a candidate on its own.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {counts.strong > 0 && (
            <Badge className="bg-[oklch(0.45_0.15_145)] text-white">{counts.strong} strong</Badge>
          )}
          {counts.partial > 0 && <Badge variant="secondary">{counts.partial} partial</Badge>}
          {counts.weak > 0 && <Badge variant="outline">{counts.weak} weak</Badge>}
        </div>
      </div>

      <ol className="flex flex-col gap-1.5">
        {top.map((suggestion, index) => {
          const strength = matchStrength(suggestion.score)
          const recommendation = recommendationFromScore(suggestion.score)
          return (
            <li key={suggestion.candidateId}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/50"
                onClick={() => onCandidateSelect(suggestion.candidateId, suggestion.submissionId)}
              >
                <span className="text-muted-foreground w-4 text-xs">{index + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {suggestion.candidateName ?? shortId(suggestion.candidateId)}
                  </span>
                  {suggestion.currentTitle && (
                    <span className="text-muted-foreground truncate text-xs">
                      {suggestion.currentTitle}
                    </span>
                  )}
                </span>
                <Badge
                  variant={strength === 'strong' ? 'default' : strength === 'partial' ? 'secondary' : 'outline'}
                  className="shrink-0"
                >
                  {STRENGTH_LABEL[strength]}
                  {suggestion.score != null ? ` · ${suggestion.score}` : ''}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    recommendation === 'advance'
                      ? 'shrink-0 border-[oklch(0.45_0.15_145)]/40 text-[oklch(0.45_0.15_145)]'
                      : recommendation === 'reject'
                        ? 'shrink-0 border-destructive/40 text-destructive'
                        : 'shrink-0'
                  }
                >
                  AI: {recommendation}
                </Badge>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function shortId(id: string) {
  if (!id) return '—'
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}
