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
    expect(detail).toContain('<JobMarkdown markdown={job.description} />')
    expect(detail).toContain('endAtSentence(job.description_summary')
    expect(read('jobs/[id]/_components/job-description.tsx')).not.toContain('dangerouslySetInnerHTML')
  })

  it('both apply buttons record the click', () => {
    expect(read('jobs/[id]/_components/job-detail.tsx')).toContain('onClick={() => recordApplyClick(job.id)}')
    expect(read('jobs/[id]/_components/apply-section.tsx')).toContain('recordApplyClick(jobId)')
  })

  it('the dashboard lists saved jobs', () => {
    const dashboard = read('dashboard/page.tsx')
    expect(dashboard).toContain('useSavedJobs()')
    expect(dashboard).toContain('Saved jobs')
  })

  it('the profile page can replace the resume through the shared upload hook', () => {
    expect(read('profile/edit/page.tsx')).toContain('useResumeUpload(onResumeParsed)')
    expect(read('onboarding/1/page.tsx')).toContain('useResumeUpload(onParsed)')
  })
})

describe('Talent app QA fixes, round 2', () => {
  it('protected pages wait for the auth state before redirecting (refresh stays signed in)', () => {
    expect(read('_components/candidate-auth-context.tsx')).toContain('isReady: storageRead && (!!candidate || clerkLoaded)')
    for (const page of ['dashboard/page.tsx', 'profile/edit/page.tsx', 'onboarding/1/page.tsx', 'onboarding/2/page.tsx', 'onboarding/3/page.tsx']) {
      expect(read(page)).toContain('if (isReady && !isLoggedIn) router.replace(')
    }
  })

  it('a signed-in candidate sees only candidate navigation and a slim footer', () => {
    const nav = read('_components/site-nav.tsx')
    expect(nav).toContain('const navItems = isLoggedIn ? CANDIDATE_NAV_ITEMS : NAV_ITEMS')
    expect(nav).toContain('{!isLoggedIn && (')
    expect(read('_components/site-footer.tsx')).toContain('if (isLoggedIn) {')
  })

  it('the signed-in jobs page has For you and All jobs, and drops the marketing sections', () => {
    const page = read('jobs/page.tsx')
    expect(page).toContain("setView('for-you')")
    expect(page).toContain("params.set('sort', 'recent')")
    expect(page).toContain('{!isLoggedIn && <TalentSections />}')
  })

  it('location is chosen from the list, never typed', () => {
    const field = read('_components/location-field.tsx')
    expect(field).toContain('/api/v1/public/locations')
    expect(read('onboarding/3/page.tsx')).toContain('<LocationField')
    expect(read('profile/edit/page.tsx')).toContain('<LocationField')
  })

  it('the dashboard shows roles opened to apply', () => {
    expect(read('dashboard/page.tsx')).toContain('/api/v1/candidate/apply-clicks')
  })
})

describe('Talent app QA fixes, round 4 (2026-10-30)', () => {
  it('the experience summary is loaded, sent and allowed up to 2,000 characters', () => {
    const page = read('profile/edit/page.tsx')
    expect(page).toContain("experience_summary: profile.experience_summary ?? ''")
    expect(page).toContain("experience_summary: values.experience_summary ?? ''")
    expect(page).toContain('.max(2000')
    expect(page).toContain('errors.experience_summary')
  })

  it('skills are unlimited, with up to 10 starred as top skills', () => {
    const page = read('profile/edit/page.tsx')
    expect(page).not.toContain('prev.length >= 10')
    expect(page).toContain('topSkills.length < 10')
    expect(page).toContain('top_skills: topSkills')
  })

  it('the profile shows the resume on file with an icon and a View link', () => {
    const page = read('profile/edit/page.tsx')
    expect(page).toContain('className="resume-card"')
    expect(page).toContain('/api/v1/candidate/profile/resume/file')
    expect(read('onboarding/_components/resume-dropzone.tsx')).toContain('up to 5 MB')
  })

  it('cleaned descriptions render as Markdown, the original as text', () => {
    expect(read('jobs/[id]/_components/job-detail.tsx')).toContain('<JobMarkdown markdown={job.description} />')
  })
})
