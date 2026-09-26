/**
 * The console is for laptops only. Below the lg breakpoint (1024px) the root layout shows a
 * notice and hides the app. Static wiring only (new .tsx tests do not transform under this
 * app's Vitest, see the notes in route-capabilities.test.ts); the rendered result is checked
 * in a real browser at phone and laptop widths.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')
const read = (rel: string) => fs.readFileSync(path.join(APP_DIR, rel), 'utf-8')

describe('desktop-only gate', () => {
  it('the root layout hides the app below lg and shows the notice there', () => {
    const layout = read('layout.tsx')
    expect(layout).toContain('<DesktopOnlyNotice />')
    // `contents` on lg keeps the desktop layout exactly as it was, `hidden` removes the app below it.
    expect(layout).toMatch(/className="hidden lg:contents">\{children\}<\/div>/)
  })

  it('the notice only shows below lg and says laptops only', () => {
    const notice = read('_components/desktop-only-notice.tsx')
    expect(notice).toContain('lg:hidden')
    expect(notice).toMatch(/only available on laptop devices/i)
  })
})
