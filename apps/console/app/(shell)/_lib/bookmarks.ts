import type { Bookmark } from '@brynzit/recruiting'

/** Wire shape returned by the bookmarks mock endpoint. */
type BookmarkResponseItem = {
  candidate_id: string
  candidate_name: string | null
  note: string | null
  created_by: string
  created_at: string
}

export const bookmarkQueryKeys = {
  list: (userId: string) => ['bookmarks', userId] as const,
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

function toBookmark(item: BookmarkResponseItem): Bookmark {
  return {
    candidateId: item.candidate_id,
    ...(item.candidate_name ? { candidateName: item.candidate_name } : {}),
    ...(item.note ? { note: item.note } : {}),
    createdBy: item.created_by,
    createdAt: item.created_at,
  }
}

export async function fetchBookmarks(userId: string): Promise<Bookmark[]> {
  const response = await fetch(
    `${apiBase()}/api/v1/supply/bookmarks?user_id=${encodeURIComponent(userId)}`,
  )
  if (!response.ok) throw new Error(`Failed to load bookmarks: ${response.status}`)
  const data = (await response.json()) as { items: BookmarkResponseItem[] }
  return data.items.map(toBookmark)
}

export async function addBookmark(input: {
  userId: string
  candidateId: string
  candidateName?: string
  note?: string
}): Promise<void> {
  const response = await fetch(`${apiBase()}/api/v1/supply/bookmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: input.userId,
      candidate_id: input.candidateId,
      candidate_name: input.candidateName ?? null,
      note: input.note ?? null,
    }),
  })
  if (!response.ok) throw new Error(`Failed to add bookmark: ${response.status}`)
}

export async function deleteBookmark(input: {
  userId: string
  candidateId: string
}): Promise<void> {
  const response = await fetch(
    `${apiBase()}/api/v1/supply/bookmarks/${input.candidateId}?user_id=${encodeURIComponent(input.userId)}`,
    { method: 'DELETE' },
  )
  if (!response.ok) throw new Error(`Failed to remove bookmark: ${response.status}`)
}
