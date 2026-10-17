import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Fixes from the 2026-10 talent-app QA sheet (docs/web-public-site.md, Behaviour).
const APP_DIR = path.resolve(__dirname, '../../app')
const read = (rel: string) => fs.readFileSync(path.join(APP_DIR, rel), 'utf-8')

describe('Talent app QA fixes', () => {
  it('sign out also ends the Clerk session', () => {
    expect(read('_components/candidate-auth-context.tsx')).toContain('void endClerkSession()')
  })

  it('saving while logged out sends the visitor to sign up', () => {
    expect(read('_lib/saved-jobs.ts')).toContain('router.push(`/signup?redirect=${encodeURIComponent(pathname)}`)')
  })

  it('anonymous visitors get one page of previews', () => {
    const page = read('jobs/page.tsx')
    expect(page).toContain('isLoggedIn && hasNextPage && !isFetchingNextPage')
    expect(page).toContain('{isLoggedIn && hasNextPage && (')
  })

  it('the job page shows the full description, falling back to the trimmed summary', () => {
    const detail = read('jobs/[id]/_components/job-detail.tsx')
    expect(detail).toContain('<JobDescription text={job.description} />')
    expect(detail).toContain('endAtSentence(job.description_summary')
    expect(read('jobs/[id]/_components/job-description.tsx')).not.toContain('dangerouslySetInnerHTML')
  })

  it('both apply buttons record the click', () => {
    expect(read('jobs/[id]/_components/job-detail.tsx')).toContain('onClick={() => recordApplyClick(job.id)}')
    expect(read('jobs/[id]/_components/apply-section.tsx')).toContain('recordApplyClick(jobId)')
  })

  it('the dashboard lists saved jobs', () => {
    const dashboard = read('dashboard/page.tsx')
    expect(dashboard).toContain('readSavedJobs()')
    expect(dashboard).toContain('Saved jobs')
  })

  it('the profile page can replace the resume through the shared upload hook', () => {
    expect(read('profile/edit/page.tsx')).toContain('useResumeUpload(onResumeParsed)')
    expect(read('onboarding/1/page.tsx')).toContain('useResumeUpload(onParsed)')
  })
})
