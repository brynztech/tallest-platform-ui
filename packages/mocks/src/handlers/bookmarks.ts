import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import { API_BASE } from '../base-url'

// MSW-only contract proposal — recruiter bookmarks, scoped per acting user.
// Not yet implemented in the backend. DELETE when the real endpoint ships.

export type BookmarkItem = {
  candidate_id: string
  candidate_name: string | null
  note: string | null
  created_by: string
  created_at: string
}

// Store keyed by user id. In the browser it is persisted to localStorage so
// bookmarks survive reloads/navigations (behaving like a real backend for dev);
// in Node/tests it falls back to an in-memory map.
const STORAGE_KEY = 'brynzit.mock.bookmarks'
const memory = new Map<string, BookmarkItem[]>()

function readAll(): Record<string, BookmarkItem[]> {
  if (typeof localStorage === 'undefined') {
    return Object.fromEntries(memory.entries())
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, BookmarkItem[]>
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, BookmarkItem[]>): void {
  if (typeof localStorage === 'undefined') {
    memory.clear()
    for (const [key, value] of Object.entries(all)) memory.set(key, value)
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort
  }
}

function list(userId: string): BookmarkItem[] {
  return readAll()[userId] ?? []
}

function save(userId: string, items: BookmarkItem[]): void {
  const all = readAll()
  all[userId] = items
  writeAll(all)
}

export const bookmarkHandlers: HttpHandler[] = [
  http.get(`${API_BASE}/api/v1/supply/bookmarks`, ({ request }) => {
    const userId = new URL(request.url).searchParams.get('user_id') ?? 'anonymous'
    return HttpResponse.json({ items: list(userId) })
  }),

  http.post(`${API_BASE}/api/v1/supply/bookmarks`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      user_id?: string
      candidate_id?: string
      candidate_name?: string | null
      note?: string | null
    }
    const userId = body.user_id ?? 'anonymous'
    if (!body.candidate_id) {
      return HttpResponse.json({ error: 'candidate_id is required' }, { status: 400 })
    }
    const item: BookmarkItem = {
      candidate_id: body.candidate_id,
      candidate_name: body.candidate_name ?? null,
      note: body.note ?? null,
      created_by: userId,
      created_at: new Date().toISOString(),
    }
    const next = [item, ...list(userId).filter((b) => b.candidate_id !== item.candidate_id)]
    save(userId, next)
    return HttpResponse.json(item, { status: 201 })
  }),

  http.delete(`${API_BASE}/api/v1/supply/bookmarks/:candidate_id`, ({ params, request }) => {
    const userId = new URL(request.url).searchParams.get('user_id') ?? 'anonymous'
    const candidateId = params.candidate_id as string
    save(
      userId,
      list(userId).filter((b) => b.candidate_id !== candidateId),
    )
    return HttpResponse.json({ candidate_id: candidateId, removed: true })
  }),
]
