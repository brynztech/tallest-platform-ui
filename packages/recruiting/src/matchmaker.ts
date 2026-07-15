import type { AiRecommendation } from './submission'

/**
 * AI Matchmaker — per-role candidate suggestions. Advisory only: the ranking and
 * recommendation come from AI match scoring, but a human always decides (spec
 * D4). These helpers annotate and order suggestions for review; they never
 * auto-advance anyone.
 */

/**
 * Score at/above which the AI recommends advancing a candidate. Mirrors the
 * backend `ADVANCE_THRESHOLD` used by the internal-review queue so the console
 * and API agree on what "advance" means.
 */
export const MATCH_ADVANCE_THRESHOLD = 60

/** Score at/above which a match is considered strong (vs merely partial). */
export const MATCH_STRONG_THRESHOLD = 75

export type MatchStrength = 'strong' | 'partial' | 'weak'

export interface MatchSuggestion {
  candidateId: string
  candidateName?: string
  /** AI match score 0–100, or null when not yet scored. */
  score: number | null
  rationale?: string
}

/** The AI's advance/reject recommendation derived from a match score. */
export function recommendationFromScore(score: number | null): AiRecommendation {
  if (score === null) return 'unknown'
  return score >= MATCH_ADVANCE_THRESHOLD ? 'advance' : 'reject'
}

/** Coarse strength bucket for badge display. */
export function matchStrength(score: number | null): MatchStrength {
  if (score === null || score < MATCH_ADVANCE_THRESHOLD) return 'weak'
  return score >= MATCH_STRONG_THRESHOLD ? 'strong' : 'partial'
}

/**
 * Rank suggestions best-first by score. Unscored suggestions (null) sort last.
 * Returns a new array; the input is not mutated.
 */
export function rankSuggestions<T extends { score: number | null }>(suggestions: T[]): T[] {
  return [...suggestions].sort((a, b) => {
    if (a.score === null && b.score === null) return 0
    if (a.score === null) return 1
    if (b.score === null) return -1
    return b.score - a.score
  })
}
