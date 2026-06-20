import { describe, expect, it } from 'vitest'
import { isResumeParsingComplete } from '../../app/(shell)/supply/ingest/_lib/resume-status'

describe('Supply — Ingest (SUP-03)', () => {
  it.todo('LinkedIn ingest: shows done job card immediately after 201 response')
  it.todo('CSV ingest: shows done job card with imported count after 200 response')
  it.todo('Resume ingest: shows processing job card after 202 response')
  it('Resume ingest: waits for parsed resume fields before marking done', () => {
    expect(
      isResumeParsingComplete({
        id: '00000000-0000-0000-0000-cand000001',
        name: 'Parsing resume',
        source: 'resume_upload',
        status: 'processing',
        talent_pool: {
          availability_status: 'available',
          extraction_method: null,
          resume_file_path: null,
        },
      }),
    ).toBe(false)

    expect(
      isResumeParsingComplete({
        id: '00000000-0000-0000-0000-cand000001',
        name: 'Alice Chen',
        source: 'resume_upload',
        status: 'active',
        talent_pool: {
          availability_status: 'available',
          extraction_method: 'groq_llama4_scout',
          resume_file_path: 'resume.pdf',
        },
      }),
    ).toBe(true)
  })
  it.todo('Zod validates linkedin_url format before submit')
})
