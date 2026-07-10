export function createClientId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
