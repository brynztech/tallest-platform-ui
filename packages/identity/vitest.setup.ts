/**
 * Deterministic in-memory `localStorage` for tests.
 *
 * The jsdom build under Vitest does not always expose a functional Web Storage
 * implementation, so we install a minimal, spec-shaped polyfill. This keeps the
 * storage-backed identity tests independent of the environment.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
})
