/**
 * Folder upload in Supply ingest: `webkitdirectory` returns every file under
 * the folder, so the filter is what keeps unsupported files out of the parse
 * queue.
 */
import { describe, it, expect } from 'vitest'
import {
  isSupportedResume,
  selectResumesFromFolder,
} from '../../app/(shell)/supply/ingest/_lib/resume-files'

function file(name: string): File {
  return new File(['x'], name)
}

describe('isSupportedResume', () => {
  it('accepts the parser-supported extensions, case-insensitively', () => {
    expect(isSupportedResume(file('cv.pdf'))).toBe(true)
    expect(isSupportedResume(file('cv.docx'))).toBe(true)
    expect(isSupportedResume(file('cv.doc'))).toBe(true)
    expect(isSupportedResume(file('CV.PDF'))).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isSupportedResume(file('notes.txt'))).toBe(false)
    expect(isSupportedResume(file('photo.png'))).toBe(false)
    expect(isSupportedResume(file('sheet.xlsx'))).toBe(false)
    // Not a suffix match on a lookalike name.
    expect(isSupportedResume(file('resume.pdf.zip'))).toBe(false)
  })
})

describe('selectResumesFromFolder', () => {
  it('keeps resumes, counts everything else as skipped, and sorts by name', () => {
    const result = selectResumesFromFolder([
      file('zoe.pdf'),
      file('notes.txt'),
      file('adam.docx'),
      file('team-photo.png'),
    ])
    expect(result.accepted.map((f) => f.name)).toEqual(['adam.docx', 'zoe.pdf'])
    expect(result.skippedCount).toBe(2)
  })

  it('drops macOS metadata files rather than counting them as resumes', () => {
    const result = selectResumesFromFolder([file('.DS_Store'), file('cv.pdf')])
    expect(result.accepted.map((f) => f.name)).toEqual(['cv.pdf'])
    expect(result.skippedCount).toBe(1)
  })

  it('reports an empty selection for a folder with nothing parseable', () => {
    const result = selectResumesFromFolder([file('a.txt'), file('b.png')])
    expect(result.accepted).toEqual([])
    expect(result.skippedCount).toBe(2)
  })

  it('handles an empty folder', () => {
    expect(selectResumesFromFolder([])).toEqual({ accepted: [], skippedCount: 0 })
  })
})
