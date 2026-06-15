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
  it('has a distinct failed state', () => {
    expect(src).toContain('border-destructive/50')
  })
  it('has a drag-over ring state', () => {
    expect(src).toContain('ring-2 ring-primary/30')
  })
  it('uses an UploadCloud icon', () => {
    expect(src).toContain('UploadCloud')
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
  it('login uses space-y-5 and editorial heading', () => {
    expect(login).toContain('space-y-5')
    expect(login).toContain('text-3xl font-light tracking-tight')
  })
  it('signup uses space-y-5 and editorial heading', () => {
    expect(signup).toContain('space-y-5')
    expect(signup).toContain('text-3xl font-light tracking-tight')
  })
  it('signup keeps its wider max-w-[420px] (2-col name grid)', () => {
    expect(signup).toContain('max-w-[420px]')
  })
})

describe('Onboarding step 2 normalization (POL-03, POL-06)', () => {
  const src = readFile('onboarding/2/page.tsx')
  it('normalizes width to max-w-[560px]', () => {
    expect(src).toContain('max-w-[560px]')
    expect(src).not.toContain('max-w-[640px]')
  })
  it('skill remove button has a focus ring', () => {
    expect(src).toContain('focus-visible:ring-ring')
  })
})
