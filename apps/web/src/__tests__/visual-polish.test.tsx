import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('globals.css token foundation (POL-06, POL-07)', () => {
  const css = readFile('globals.css')

  it('maps DS ink onto primary (the only accent fill)', () => {
    expect(css).toContain('--color-primary: #000000')
    expect(css).toContain('--color-primary-foreground: #ffffff')
  })

  it('focus ring is the DS link blue (POL-06)', () => {
    expect(css).toContain('--color-ring: #3860bc')
  })

  it('sets the DS canvas as the page background (never pure white)', () => {
    expect(css).toContain('--color-background: #f7f3f0')
  })

  it('keeps brand navy identity-only: registered, never mapped onto primary', () => {
    expect(css).toContain('--color-brand: #080e5a')
    expect(css).not.toMatch(/--color-primary:\s*#080e5a/)
  })

  it('registers the DS-only tokens for utilities', () => {
    for (const token of ['--color-link', '--color-divider', '--color-border-control', '--color-border-input', '--shadow-raised', '--shadow-badge']) {
      expect(css).toContain(token)
    }
  })

  it('registers no custom --text-* size tokens', () => {
    // A named size like `text-nav` shares the `text-*` namespace with colours, and
    // tailwind-merge (inside cn()) cannot tell them apart: it silently dropped
    // `text-primary-foreground` from the Sign up button, leaving black on black.
    // Use arbitrary values (text-[18px]) instead.
    expect(css).not.toMatch(/--text-[a-z0-9-]+\s*:/)
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
    expect(readFile('page.tsx')).toContain('pt-12')
  })
  it('has no gradient background', () => {
    expect(src).not.toContain('bg-gradient')
  })
  it('has no font-light (DS weights are 400-700)', () => {
    expect(src).not.toContain('font-light')
  })
})

describe('Job card hover polish (POL-02, POL-06)', () => {
  const src = readFile('jobs/_components/job-card.tsx')
  it('hovers flat: surface-muted fill and the raised shadow, no lift', () => {
    expect(src).toContain('hover:bg-muted')
    expect(src).toContain('hover:shadow-raised')
    expect(src).not.toContain('translate')
  })
  it('uses the valid bracketed multi-property transition, not transition-shadow', () => {
    expect(src).toContain('transition-[background-color,box-shadow]')
    expect(src).not.toContain('transition-shadow')
  })
  it('has a keyboard focus outline in link blue on the stretched link', () => {
    expect(src).toContain('focus-visible:outline-link')
  })
})

describe('Raw button focus outlines (POL-06)', () => {
  // Asserts the guarantee rather than an occurrence count: the chip buttons are
  // rendered from a map, so a fixed count breaks on any refactor while saying
  // nothing about whether the outlines are actually there.
  for (const file of ['jobs/_components/filter-bar.tsx', '_components/search-field.tsx', 'jobs/_components/job-card.tsx', '_components/removable-chip.tsx']) {
    it(`gives every raw button in ${file} the 2px link-blue focus outline`, () => {
      const rawButtons = readFile(file).split('<button').slice(1)
      expect(rawButtons.length).toBeGreaterThan(0)
      for (const fragment of rawButtons) {
        const openingTag = fragment.slice(0, fragment.indexOf('>'))
        const attrs = openingTag.includes('className')
          ? openingTag
          : fragment.slice(0, fragment.indexOf('</button>'))
        expect(attrs).toContain('focus-visible:outline-link')
      }
    })
  }
})

describe('Locked-jobs overlay redesign (POL-05)', () => {
  const src = readFile('jobs/_components/locked-jobs-overlay.tsx')
  it('is anchored to the bottom of the grid', () => {
    expect(src).toContain('absolute')
    expect(src).toContain('bottom-0')
  })
  it('is flat: no gradient fade and no backdrop blur (DS)', () => {
    expect(src).not.toContain('bg-gradient')
    expect(src).not.toContain('backdrop-blur')
  })
  it('is a compact card: 20px radius and the raised shadow, no heavy shadow', () => {
    expect(src).toContain('rounded-[20px]')
    expect(src).toContain('shadow-raised')
    expect(src).not.toContain('shadow-2xl')
    expect(src).not.toContain('shadow-lg')
    expect(src).not.toContain('top-1/4')
  })
})
