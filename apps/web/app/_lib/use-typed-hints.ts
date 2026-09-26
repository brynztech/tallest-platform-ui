'use client'
import { useEffect, useState, type RefObject } from 'react'

const TYPE_MS = 70
const ERASE_MS = 35
const HOLD_MS = 1500
const GAP_MS = 300

/**
 * The hero search's "Frontend, then Backend..." effect: shows the first hint, then erases it and
 * types the next, one after another. Returns null whenever it is not animating (reduced motion,
 * `enabled` false, no hints), so the caller falls back to its static text. It stops while the
 * element is off screen or the tab is hidden. `hints` must be a stable reference.
 */
export function useTypedHints(
  hints: readonly string[] | undefined,
  enabled: boolean,
  target: RefObject<Element | null>,
): string | null {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    const el = target.current
    if (!enabled || !hints?.length || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let hint = 0
    let chars = hints[0].length
    let erasing = true
    let wait = HOLD_MS
    let timer = 0
    let onScreen = false

    setText(hints[0])

    const tick = () => {
      const word = hints[hint]
      chars += erasing ? -1 : 1
      setText(word.slice(0, chars))
      if (!erasing && chars === word.length) {
        erasing = true
        wait = HOLD_MS
      } else if (erasing && chars === 0) {
        erasing = false
        hint = (hint + 1) % hints.length
        wait = GAP_MS
      } else {
        wait = erasing ? ERASE_MS : TYPE_MS
      }
      timer = window.setTimeout(tick, wait)
    }

    const sync = () => {
      window.clearTimeout(timer)
      if (onScreen && !document.hidden) timer = window.setTimeout(tick, wait)
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    observer.observe(el)
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      setText(null)
    }
  }, [enabled, hints, target])

  return text
}
