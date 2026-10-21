import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}
function appFiles(dir = APP_DIR): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return appFiles(full)
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : []
  })
}

// Brynz design system v3 (docs/web-public-site.md). globals.css is the only home of its
// tokens and classes.
describe('globals.css: Brynz v3 tokens', () => {
  const css = readFile('globals.css')

  it('defines the midnight navy brand, beige page and line colours', () => {
    expect(css).toContain('--brand: #141A4D')
    expect(css).toContain('--bg: #F3F2EE')
    expect(css).toContain('--line: #E1DFD8')
  })

  it('maps the shared shadcn names onto Brynz so primitives match', () => {
    expect(css).toContain('--color-background: #F3F2EE')
    expect(css).toContain('--color-primary: #141A4D')
    expect(css).toContain('--color-ring: #2F44C9')
  })

  it('keeps the Brynz classes in the components layer so Tailwind utilities still win', () => {
    expect(css).toContain('@layer components {')
    expect(css.indexOf('@layer components {')).toBeLessThan(css.indexOf('.btn {'))
  })

  it('ships one light palette: no dark mode, no palette picker', () => {
    expect(css).not.toContain('prefers-color-scheme: dark')
    expect(css).not.toContain('data-palette')
    expect(css).not.toContain('.palette')
    expect(css).not.toContain('.dark')
  })

  it('has no class that collides with a Tailwind utility (.ring became .odo-ring)', () => {
    expect(css).not.toMatch(/\.ring[\s{.]/)
    expect(css).toContain('.odo-ring')
  })

  it('registers no custom --text-* size tokens', () => {
    // A named size like `text-nav` shares the `text-*` namespace with colours, and
    // tailwind-merge (inside cn()) cannot tell them apart.
    expect(css).not.toMatch(/--text-[a-z]/)
  })

  it('preserves the Tailwind and shared theme imports', () => {
    expect(css).toContain('@import "tailwindcss"')
    expect(css).toContain('@import "@brynzit/ui/styles/theme.css"')
  })
})

describe('layout: fonts and shell', () => {
  const layout = readFile('layout.tsx')

  it('loads Figtree for UI text and Newsreader for display', () => {
    expect(layout).toContain('Figtree')
    expect(layout).toContain('Newsreader')
  })

  it('renders the header, footer and motion runner on every page', () => {
    expect(layout).toContain('<SiteNav />')
    expect(layout).toContain('<SiteFooter />')
    expect(layout).toContain('<SiteMotion />')
  })
})

describe('Standardisation guards', () => {
  const files = appFiles()

  it('no page uses the removed ui-classes strings', () => {
    expect(files.filter(f => fs.readFileSync(f, 'utf-8').includes('ui-classes'))).toEqual([])
  })

  it('no page puts Brynz classes on shadcn Button or Input (their utilities would override them)', () => {
    const offenders = files.filter(f =>
      /@brynzit\/ui\/components\/ui\/(button|input|textarea|label)'/.test(fs.readFileSync(f, 'utf-8')),
    )
    expect(offenders).toEqual([])
  })

  it.each(['page.tsx', 'startups/page.tsx', 'enterprises/page.tsx', 'frontier-ai/page.tsx', 'iit-talent/page.tsx', 'contact/page.tsx', 'jobs/page.tsx'])(
    '%s has exactly one display headline',
    file => {
      const src = readFile(file)
      // /jobs has one headline per state: visitor hero (d1) and the signed-in view (d2).
      expect(src.match(/<h1/g)?.length).toBe(file === 'jobs/page.tsx' ? 2 : 1)
      expect(src).toContain('className="d1')
    },
  )
})

describe('Locked-jobs overlay', () => {
  const src = readFile('jobs/_components/locked-jobs-overlay.tsx')

  it('sits over the bottom of the grid as a Brynz panel', () => {
    expect(src).toContain('locked-overlay')
    expect(src).toContain('note-form')
    expect(readFile('globals.css')).toMatch(/\.locked-overlay \{ position: absolute;/)
  })
})
