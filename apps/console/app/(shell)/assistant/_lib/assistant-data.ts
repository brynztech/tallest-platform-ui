/**
 * Console Assistant API client. Hand-wired fetch, same convention as
 * ../../_lib/assignments.ts — no generated client exists for this router yet.
 */

export type AssistantEventKind = 'user_message' | 'assistant_message' | 'tool_call' | 'tool_result' | 'error'
export type AssistantTurnStatus = 'pending' | 'running' | 'done' | 'error' | 'cancelled'

export type AssistantEvent = {
  id: string
  turn_id: string
  seq: number
  kind: AssistantEventKind
  payload: Record<string, unknown>
  created_at: string
}

export type AssistantConversation = {
  id: string
  acting_user_id: string
  view_all: boolean
  created_at: string
}

export type AssistantEventsPage = {
  events: AssistantEvent[]
  turn_status: AssistantTurnStatus | null
  /**
   * In-flight response text for a live turn — display-only scratch state, not
   * an event (the backend suppresses it the moment the turn goes terminal, so
   * the committed assistant_message never renders twice). Always the full text
   * so far, never a fragment to append.
   */
  partial: string | null
}

export type AssistantConversationSummary = {
  id: string
  created_at: string
  preview: string | null
  message_count: number
}

export const assistantQueryKeys = {
  // acting user id included per this repo's persona-switch-cache-leak rule
  // (apps/console/CLAUDE.md) even though a persona switch also creates a new
  // conversation id — belt and suspenders against a stale cache entry.
  events: (actingUserId: string, conversationId: string) =>
    ['assistant', 'events', actingUserId, conversationId] as const,
  history: (actingUserId: string, search = '') =>
    ['assistant', 'history', actingUserId, search] as const,
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export async function createConversation(
  actingUserId: string,
  viewAll: boolean,
): Promise<AssistantConversation> {
  const response = await fetch(`${apiBase()}/api/v1/assistant/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acting_user_id: actingUserId, view_all: viewAll }),
  })
  if (!response.ok) throw new Error(`Failed to start conversation: ${response.status}`)
  return response.json()
}

/** Past chats for this acting user, newest first. Empty ones are omitted server-side.
 *  `search` matches any message in a conversation, not just its opening line. */
export async function fetchConversations(
  actingUserId: string,
  search = '',
): Promise<AssistantConversationSummary[]> {
  const params = new URLSearchParams({ acting_user_id: actingUserId })
  if (search.trim()) params.set('q', search.trim())
  const response = await fetch(`${apiBase()}/api/v1/assistant/conversations?${params}`)
  if (!response.ok) throw new Error(`Failed to load history: ${response.status}`)
  const data = (await response.json()) as { conversations: AssistantConversationSummary[] }
  return data.conversations
}

export async function postMessage(
  conversationId: string,
  body: string,
): Promise<{ id: string; status: AssistantTurnStatus }> {
  const response = await fetch(`${apiBase()}/api/v1/assistant/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  if (!response.ok) throw new Error(`Failed to send message: ${response.status}`)
  return response.json()
}

export async function fetchEvents(conversationId: string): Promise<AssistantEventsPage> {
  const response = await fetch(`${apiBase()}/api/v1/assistant/conversations/${conversationId}/events?after_seq=0`)
  if (!response.ok) throw new Error(`Failed to load conversation: ${response.status}`)
  return response.json()
}

export async function cancelTurn(conversationId: string, turnId: string): Promise<void> {
  const response = await fetch(
    `${apiBase()}/api/v1/assistant/conversations/${conversationId}/turns/${turnId}/cancel`,
    { method: 'POST' },
  )
  if (!response.ok) throw new Error(`Failed to stop: ${response.status}`)
}

/** pending|running lock the composer and drive polling; everything else is terminal (§3). */
export function isTurnLive(status: AssistantTurnStatus | null | undefined): boolean {
  return status === 'pending' || status === 'running'
}
