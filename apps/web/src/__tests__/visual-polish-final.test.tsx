import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('Profile edit + site nav polish (POL-06)', () => {
  const profile = readFile('profile/edit/page.tsx')
  const nav = readFile('_components/site-nav.tsx')
  it('profile skills are chips with a labelled star (top skill) and remove button', () => {
    expect(profile).toContain('aria-label={`Remove ${skill}`}')
    expect(profile).toContain('aria-pressed={top}')
  })
  it('site nav marks the current page for screen readers', () => {
    expect(nav).toContain("aria-current={isActive(item.href) ? 'page' : undefined}")
  })
})

describe('Phase-wide guards (POL-06, POL-07)', () => {
  it('no transition-all anywhere in apps/web app source', () => {
    // Walk all .tsx files in APP_DIR recursively and assert none contain 'transition-all'
    const filesWithTransitionAll: string[] = []
    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          if (content.includes('transition-all')) {
            filesWithTransitionAll.push(fullPath)
          }
        }
      }
    }
    walk(APP_DIR)
    expect(filesWithTransitionAll).toEqual([])
  })
  it('no .dark block leaked into globals.css', () => {
    expect(readFile('globals.css')).not.toContain('.dark')
  })
})
