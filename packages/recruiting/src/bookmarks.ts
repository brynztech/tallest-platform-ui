/**
 * Recruiter bookmarks — saved/highlighted candidates for later. Bookmarks are
 * attributed to the recruiter who created them (spec: "Bookmark profiles").
 * Pure helpers; persistence lives in the app layer.
 */

export interface Bookmark {
  candidateId: string
  candidateName?: string
  note?: string
  /** Acting user id that created the bookmark. */
  createdBy: string
  /** ISO-8601 timestamp. */
  createdAt: string
}

/** Whether a candidate is bookmarked in the given list. */
export function isBookmarked(bookmarks: Bookmark[], candidateId: string): boolean {
  return bookmarks.some((bookmark) => bookmark.candidateId === candidateId)
}

/**
 * Insert or update a bookmark. If the candidate is already bookmarked, the
 * existing entry is replaced (keeping the list free of duplicates); otherwise
 * the new bookmark is prepended (most-recent first).
 */
export function upsertBookmark(bookmarks: Bookmark[], bookmark: Bookmark): Bookmark[] {
  const without = bookmarks.filter((b) => b.candidateId !== bookmark.candidateId)
  return [bookmark, ...without]
}

/** Remove a candidate's bookmark, if present. */
export function removeBookmark(bookmarks: Bookmark[], candidateId: string): Bookmark[] {
  return bookmarks.filter((bookmark) => bookmark.candidateId !== candidateId)
}
