/**
 * SSR-safe persistence for the acting user id.
 *
 * All access is guarded: on the server (no `window`) and when storage is
 * unavailable or throws (private mode, quota, disabled cookies), these become
 * no-ops rather than crashing render. The acting-user id is a non-sensitive
 * UI preference, so localStorage is appropriate.
 */
const STORAGE_KEY = 'brynzit.identity.actingUserId'

export function readStoredUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredUserId(userId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, userId)
  } catch {
    // Ignore — persistence is best-effort; in-memory state still updates.
  }
}
