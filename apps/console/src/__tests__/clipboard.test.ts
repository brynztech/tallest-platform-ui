import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from '../../app/(shell)/_lib/clipboard'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copyText', () => {
  it('writes trimmed text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(copyText('  Keywords: react, node  ')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('Keywords: react, node')
  })

  it('does not copy blank text', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(copyText('   ')).resolves.toBe(false)
    expect(writeText).not.toHaveBeenCalled()
  })
})
