import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('ResumeDropzone crafted states (POL-04)', () => {
  const src = readFile('onboarding/_components/resume-dropzone.tsx')
  it('wires HTML5 drag handlers', () => {
    expect(src).toContain('onDragEnter')
    expect(src).toContain('onDragLeave')
    expect(src).toContain('onDrop')
  })
  it('calls preventDefault to allow drop', () => {
    expect(src.match(/preventDefault\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })
  it('has a distinct failed state (the field turns red)', () => {
    expect(src).toContain("status === 'failed' ? ' invalid' : ''")
  })
  it('has a drag-over state from the shared .file-drop.over class', () => {
    expect(src).toContain("isDragOver ? ' over' : ''")
    expect(readFile('globals.css')).toContain('.file-drop.over')
  })
  it('does not use the invalid transition-shadow utility', () => {
    expect(src).not.toContain('transition-shadow')
  })
})

describe('Onboarding step 1 consumes ResumeDropzone (POL-04)', () => {
  const src = readFile('onboarding/1/page.tsx')
  it('renders the ResumeDropzone component', () => {
    expect(src).toContain('ResumeDropzone')
  })
  it('no longer has the inline dashed label', () => {
    expect(src).not.toContain('min-h-[180px]')
  })
})

describe('Auth form polish (POL-03)', () => {
  const login = readFile('login/page.tsx')
  const signup = readFile('signup/page.tsx')
  it('login and signup use the narrow page frame with a serif page heading', () => {
    for (const src of [login, signup]) {
      expect(src).toContain('wrap page narrow')
      expect(src).toContain('className="d2"')
      expect(src).not.toContain('font-light')
    }
  })
})

describe('Onboarding step 2 normalization (POL-03, POL-06)', () => {
  const src = readFile('onboarding/2/page.tsx')
  it('uses the narrow page frame and the step bar', () => {
    expect(src).toContain('wrap page narrow')
    expect(src).toContain('className="steps"')
  })
  it('renders skills as removable chips with a labelled × button', () => {
    expect(src).toContain('RemovableChip')
    expect(readFile('_components/removable-chip.tsx')).toContain('aria-label={removeLabel}')
  })
})

describe('Account pages stay flat and say Brynz', () => {
  const PAGES = [
    'dashboard/page.tsx',
    'login/page.tsx',
    'signup/page.tsx',
    'onboarding/1/page.tsx',
    'onboarding/2/page.tsx',
    'onboarding/3/page.tsx',
    'profile/edit/page.tsx',
    'login/_components/clerk-sign-in.tsx',
    'signup/_components/clerk-sign-up.tsx',
    'sso-callback/page.tsx',
  ]
  for (const file of PAGES) {
    it(`${file}: no glass, heavy shadow, rem-radius panel or font-light`, () => {
      const src = readFile(file)
      for (const banned of ['backdrop-blur', 'shadow-2xl', 'shadow-xl', '1.75rem', 'font-light']) {
        expect(src).not.toContain(banned)
      }
    })
    it(`${file}: visible copy says Brynz, not Brynzit`, () => {
      // Capital-B "Brynzit" only ever appears in copy. Package names, the demo email
      // and localStorage keys are lower-case identifiers and stay.
      expect(readFile(file)).not.toContain('Brynzit')
    })
  }
})
