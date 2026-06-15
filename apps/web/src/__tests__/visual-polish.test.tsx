import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('globals.css token foundation (POL-06, POL-07)', () => {
  const css = readFile('globals.css')

  it('sets warm amber/terracotta accent as primary (POL-01 palette)', () => {
    expect(css).toContain('--color-primary: oklch(0.55 0.15 35)')
  })

  it('focus ring tracks the accent colour (POL-06)', () => {
    expect(css).toContain('--color-ring: oklch(0.55 0.15 35)')
  })

  it('sets a warm near-white background (POL-01)', () => {
    expect(css).toContain('--color-background: oklch(0.99 0.003 30)')
  })

  it('overrides background in :root not body (Pitfall 2 — gradient match)', () => {
    // background-color must NOT be set on a body {} rule
    expect(css).not.toMatch(/body\s*\{[^}]*background-color/)
  })

  it('bumps radius to 0.625rem', () => {
    expect(css).toContain('--radius: 0.625rem')
  })

  it('removes the .dark block entirely (POL-07 — no dark leakage)', () => {
    expect(css).not.toContain('.dark')
  })

  it('no longer references the old blue-violet primary', () => {
    expect(css).not.toContain('oklch(0.546 0.215 261.3)')
  })

  it('preserves the Tailwind and shared theme imports', () => {
    expect(css).toContain('@import "tailwindcss"')
    expect(css).toContain('@brynzit/ui/styles/theme.css')
  })
})

describe('Landing hero polish (POL-01)', () => {
  const src = readFile('_components/hero-section.tsx')
  it('replaces inline paddingTop with Tailwind padding', () => {
    expect(src).not.toContain('paddingTop')
    expect(src).toContain('pt-28')
  })
  it('has no gradient background', () => {
    expect(src).not.toContain('bg-gradient')
  })
  it('keeps font-light exactly once (editorial headline)', () => {
    expect(src.match(/font-light/g)?.length).toBe(1)
  })
})

describe('Job card hover polish (POL-02, POL-06)', () => {
  const src = readFile('jobs/_components/job-card.tsx')
  it('uses a hover lift (translate)', () => {
    expect(src).toContain('hover:-translate-y-px')
  })
  it('uses the valid bracketed multi-property transition, not transition-shadow', () => {
    expect(src).toContain('transition-[color,box-shadow,transform]')
    expect(src).not.toContain('transition-shadow')
  })
  it('has a keyboard group focus ring', () => {
    expect(src).toContain('group-focus-visible:ring-2')
  })
})

describe('Filter bar focus rings (POL-06)', () => {
  const src = readFile('jobs/_components/filter-bar.tsx')
  it('adds an accent focus ring to all 6 raw buttons', () => {
    expect(src.match(/focus-visible:ring-ring/g)?.length).toBe(6)
  })
})

describe('Locked-jobs overlay redesign (POL-05)', () => {
  const src = readFile('jobs/_components/locked-jobs-overlay.tsx')
  it('uses a bottom-anchored gradient fade', () => {
    expect(src).toContain('bg-gradient-to-t')
    expect(src).toContain('from-background')
    expect(src).toContain('bottom-0')
  })
  it('removes the hard shadowed box', () => {
    expect(src).not.toContain('shadow-lg')
    expect(src).not.toContain('top-1/4')
    expect(src).not.toContain('border border-border')
  })
})
