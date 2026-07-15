import { describe, expect, it } from 'vitest'
import { isBookmarked, removeBookmark, upsertBookmark, type Bookmark } from '../bookmarks'

const bm = (candidateId: string, createdBy = 'usr_recruiter'): Bookmark => ({
  candidateId,
  createdBy,
  createdAt: '2026-07-15T00:00:00.000Z',
})

describe('isBookmarked', () => {
  it('detects a bookmarked candidate', () => {
    expect(isBookmarked([bm('c1')], 'c1')).toBe(true)
    expect(isBookmarked([bm('c1')], 'c2')).toBe(false)
  })
})

describe('upsertBookmark', () => {
  it('prepends a new bookmark (most recent first)', () => {
    const result = upsertBookmark([bm('c1')], bm('c2'))
    expect(result.map((b) => b.candidateId)).toEqual(['c2', 'c1'])
  })

  it('replaces an existing bookmark without duplicating', () => {
    const updated: Bookmark = { ...bm('c1'), note: 'Great culture fit' }
    const result = upsertBookmark([bm('c1'), bm('c2')], updated)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(updated)
  })
})

describe('removeBookmark', () => {
  it('removes the matching candidate', () => {
    const result = removeBookmark([bm('c1'), bm('c2')], 'c1')
    expect(result.map((b) => b.candidateId)).toEqual(['c2'])
  })

  it('is a no-op when the candidate is not bookmarked', () => {
    expect(removeBookmark([bm('c1')], 'c9')).toHaveLength(1)
  })
})
