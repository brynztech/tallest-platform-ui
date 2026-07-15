import { describe, expect, it } from 'vitest'
import {
  MATCH_ADVANCE_THRESHOLD,
  matchStrength,
  rankSuggestions,
  recommendationFromScore,
} from '../matchmaker'

describe('recommendationFromScore', () => {
  it('advises advance at or above the threshold', () => {
    expect(recommendationFromScore(MATCH_ADVANCE_THRESHOLD)).toBe('advance')
    expect(recommendationFromScore(88)).toBe('advance')
  })
  it('advises reject below the threshold', () => {
    expect(recommendationFromScore(MATCH_ADVANCE_THRESHOLD - 1)).toBe('reject')
    expect(recommendationFromScore(10)).toBe('reject')
  })
  it('is unknown when unscored', () => {
    expect(recommendationFromScore(null)).toBe('unknown')
  })
})

describe('matchStrength', () => {
  it('classifies strong / partial / weak', () => {
    expect(matchStrength(90)).toBe('strong')
    expect(matchStrength(75)).toBe('strong')
    expect(matchStrength(60)).toBe('partial')
    expect(matchStrength(74)).toBe('partial')
    expect(matchStrength(59)).toBe('weak')
    expect(matchStrength(null)).toBe('weak')
  })
})

describe('rankSuggestions', () => {
  it('orders best-first and puts unscored last without mutating input', () => {
    const input = [
      { candidateId: 'a', score: 62 },
      { candidateId: 'b', score: null },
      { candidateId: 'c', score: 91 },
      { candidateId: 'd', score: 78 },
    ]
    const ranked = rankSuggestions(input)
    expect(ranked.map((s) => s.candidateId)).toEqual(['c', 'd', 'a', 'b'])
    // input untouched
    expect(input.map((s) => s.candidateId)).toEqual(['a', 'b', 'c', 'd'])
  })
})
