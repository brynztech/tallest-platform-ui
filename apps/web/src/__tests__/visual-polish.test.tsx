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
