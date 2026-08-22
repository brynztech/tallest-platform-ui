import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NOT_SPECIFIED,
  factValue,
  fetchJd,
  generateJd,
  isFactPresent,
  jdDownloadUrl,
  paragraphs,
  quickFactRows,
  titlesDiffer,
  titleSubtitle,
} from '../../app/(shell)/ops/requisitions/[id]/_lib/jd'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('quickFactRows', () => {
  it('keeps the template field order and omits unset cells', () => {
    const rows = quickFactRows({
      location: 'Remote',
      employment: 'Full-Time',
      experience: '5 Years',
      salary: '   ',
      team_size: NOT_SPECIFIED,
    })
    expect(rows.flat().map((cell) => cell.label)).toEqual([
      'LOCATION',
      'EMPLOYMENT',
      'EXPERIENCE',
    ])
    expect(rows.flat().map((cell) => cell.value)).toEqual(['Remote', 'Full-Time', '5 Years'])
  })

  it('chunks more than three facts into multiple rows', () => {
    const rows = quickFactRows({
      location: 'Remote',
      employment: 'Full-Time',
      experience: '5 Years',
      salary: '$100k',
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(3)
    expect(rows[1]).toHaveLength(1)
  })

  it('returns no rows when every fact is absent', () => {
    expect(quickFactRows(null)).toEqual([])
  })
})

describe('factValue', () => {
  it('trims stated values and drops absent ones', () => {
    expect(factValue('  Full-Time ')).toBe('Full-Time')
    expect(factValue(null)).toBe('')
    expect(factValue(NOT_SPECIFIED)).toBe('')
  })
})

describe('isFactPresent', () => {
  it('treats blank and legacy "Not specified" as absent', () => {
    expect(isFactPresent('Remote')).toBe(true)
    expect(isFactPresent('')).toBe(false)
    expect(isFactPresent(NOT_SPECIFIED)).toBe(false)
  })
})

describe('titlesDiffer', () => {
  it('is false when the generated title matches what the AM typed', () => {
    expect(titlesDiffer('Backend Engineer', 'Backend Engineer')).toBe(false)
    expect(titlesDiffer('  Senior FE  ', 'senior fe')).toBe(false)
  })

  it('is true when the generated title is a different role name', () => {
    expect(titlesDiffer('Backend Engineer', 'Senior Backend Engineer')).toBe(true)
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
    expect(titleSubtitle({ company: NOT_SPECIFIED, work_type: 'Remote' })).toBe('Remote')
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
