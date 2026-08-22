import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NOT_SPECIFIED,
  factValue,
  fetchJd,
  generateJd,
  jdDownloadUrl,
  paragraphs,
  quickFactRows,
  titleSubtitle,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/jd'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('quickFactRows', () => {
  it('keeps the template\'s fixed 3x3 order', () => {
    const labels = quickFactRows({}).map((row) => row.map((cell) => cell.label))
    expect(labels).toEqual([
      ['LOCATION', 'EMPLOYMENT', 'EXPERIENCE'],
      ['SALARY', 'WORK TYPE', 'COMPANY'],
      ['STAGE', 'TEAM SIZE', 'EQUITY'],
    ])
  })

  it('never renders a blank cell', () => {
    const rows = quickFactRows({ location: 'Remote', salary: '   ' })
    expect(rows[0][0].value).toBe('Remote')
    expect(rows[0][1].value).toBe(NOT_SPECIFIED)
    expect(rows[1][0].value).toBe(NOT_SPECIFIED)
  })

  it('survives a missing quick_facts object', () => {
    expect(quickFactRows(null).flat()).toHaveLength(9)
  })
})

describe('factValue', () => {
  it('trims and falls back', () => {
    expect(factValue('  Full-Time ')).toBe('Full-Time')
    expect(factValue(null)).toBe(NOT_SPECIFIED)
  })
})

describe('titleSubtitle', () => {
  it('joins company, work type, location and stage', () => {
    expect(
      titleSubtitle({
        company: 'Specific Labs',
        work_type: 'Remote',
        location: 'India / LATAM',
        stage: 'YC Seed',
      }),
    ).toBe('Specific Labs  ·  Remote  ·  India / LATAM  ·  YC Seed')
  })

  it('skips unset parts rather than emitting empty separators', () => {
    expect(titleSubtitle({ company: 'Acme', stage: '' })).toBe('Acme')
  })
})

describe('paragraphs', () => {
  it('splits on newlines and drops blanks', () => {
    expect(paragraphs('One.\n\n  Two.  \n')).toEqual(['One.', 'Two.'])
    expect(paragraphs(null)).toEqual([])
  })
})

describe('jdDownloadUrl', () => {
  it('points at the backend download endpoint', () => {
    expect(jdDownloadUrl('abc-123')).toContain('/api/v1/ops/requisitions/abc-123/jd/download')
  })
})

describe('fetchJd', () => {
  it('returns null when no JD has been generated yet', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, ok: false }))
    await expect(fetchJd('req-1')).resolves.toBeNull()
  })

  it('throws on unexpected failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 500, ok: false }))
    await expect(fetchJd('req-1')).rejects.toThrow('GET jd failed: 500')
  })
})

describe('generateJd', () => {
  it('surfaces the backend reason so the operator sees why it refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: 'A company website is required: pass website_url or website_content.',
        }),
      }),
    )
    await expect(
      generateJd('req-1', { requirement_text: 'A requirement long enough to pass.' }),
    ).rejects.toThrow(/company website is required/)
  })
})
