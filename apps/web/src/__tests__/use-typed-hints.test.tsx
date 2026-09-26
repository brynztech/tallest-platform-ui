import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTypedHints } from '../../app/_lib/use-typed-hints'

// The hero search's "Frontend, then Backend" typing effect, run on fake timers.
// jsdom has no IntersectionObserver or matchMedia, so both are stubbed.
const HINTS = ['Frontend', 'Backend']

let onScreen = true
let reducedMotion = false

class FakeObserver {
  constructor(private cb: (entries: Array<{ isIntersecting: boolean }>) => void) {}
  observe() {
    this.cb([{ isIntersecting: onScreen }])
  }
  disconnect() {}
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

function run(enabled = true) {
  const target = { current: document.createElement('div') }
  return renderHook(({ on }) => useTypedHints(HINTS, on, target), { initialProps: { on: enabled } })
}

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

beforeEach(() => {
  onScreen = true
  reducedMotion = false
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: reducedMotion }),
  })
  setHidden(false)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useTypedHints', () => {
  it('starts on the first hint, erases it, then types the next one letter by letter', () => {
    const { result } = run()
    expect(result.current).toBe('Frontend')

    advance(1500) // hold, then the first letter goes
    expect(result.current).toBe('Fronten')
    advance(35 * 7) // the rest of the word
    expect(result.current).toBe('')

    advance(300) // pause, then the next hint starts
    expect(result.current).toBe('B')
    advance(70 * 6)
    expect(result.current).toBe('Backend')
  })

  it('wraps around to the first hint after the last', () => {
    const { result } = run()
    const seen: string[] = [result.current as string]
    for (let i = 0; i < 60; i++) {
      act(() => void vi.advanceTimersToNextTimer())
      seen.push(result.current as string)
    }
    const backend = seen.indexOf('Backend')
    expect(backend).toBeGreaterThan(-1)
    expect(seen.slice(backend)).toContain('F') // back to the first hint after the last
  })

  it('returns null when it is not enabled, so the static placeholder shows', () => {
    const { result } = run(false)
    expect(result.current).toBeNull()
    advance(5000)
    expect(result.current).toBeNull()
  })

  it('returns null and never animates for visitors who prefer reduced motion', () => {
    reducedMotion = true
    const { result } = run()
    expect(result.current).toBeNull()
    advance(5000)
    expect(result.current).toBeNull()
  })

  it('stops while the search is off screen', () => {
    onScreen = false
    const { result } = run()
    advance(10000)
    expect(result.current).toBe('Frontend')
  })

  it('stops while the tab is hidden and carries on when it is back', () => {
    const { result } = run()
    setHidden(true)
    advance(10000)
    expect(result.current).toBe('Frontend')

    setHidden(false)
    advance(1500)
    expect(result.current).toBe('Fronten')
  })

  it('goes back to null the moment it is disabled (focus)', () => {
    const { result, rerender } = run()
    advance(1500)
    expect(result.current).toBe('Fronten')
    rerender({ on: false })
    expect(result.current).toBeNull()
  })
})
