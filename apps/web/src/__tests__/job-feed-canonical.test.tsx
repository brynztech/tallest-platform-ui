/**
 * Candidate feed against the canonical job contract.
 *
 * The behaviours guarded here each fix a specific defect:
 *  - pay is rendered from the backend's currency-qualified label, because the
 *    card used to hardcode "$" and would have shown ₹20L as $2M;
 *  - skills render from `skills_display` ("C++"), not the matchable slugs
 *    ("cplusplus");
 *  - match badges come with reasons, so they read as evidence not marketing;
 *  - the empty state distinguishes "your filters matched nothing" from "nothing
 *    is published", because a mis-set admin rule otherwise looks like a bug.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('Job card — canonical fields', () => {
  const src = readFile('jobs/_components/job-card.tsx')

  it('renders the backend compensation label instead of formatting currency itself', () => {
    expect(src).toContain('job.compensation_label')
    // The old hardcoded dollar formatter must be gone: it mislabelled every
    // non-USD salary.
    expect(src).not.toContain('`$${(n / 1000)')
    expect(src).not.toMatch(/const fmt = \(n: number\)/)
  })

  it('shows match reasons alongside the match badge', () => {
    expect(src).toContain('match_reasons')
    expect(src).toContain("match_strength === 'strong'")
    expect(src).toContain("match_strength === 'partial'")
  })

  it('surfaces collapsed duplicate postings as an openings count', () => {
    expect(src).toContain('job.openings > 1')
    expect(src).toContain('openings')
  })

  it('labels every employment type, including the new ones', () => {
    for (const key of ['full_time', 'part_time', 'contract', 'internship', 'temporary']) {
      expect(src).toContain(`${key}:`)
    }
  })

  it('renders hybrid as its own workplace mode', () => {
    // A boolean `remote` flag cannot express hybrid, which is why remote_mode exists.
    expect(src).toContain('remote_mode')
    expect(src).toContain('hybrid')
  })

  it('keeps match badges behind the logged-in check', () => {
    expect(src).toContain('isLoggedIn && job.match_strength')
  })
})

describe('Jobs feed page — personalization and filters', () => {
  const src = readFile('jobs/page.tsx')

  it('sends the session token so the feed can rank against the profile', () => {
    expect(src).toContain('Authorization')
    expect(src).toContain('Bearer')
  })

  it('passes every new filter through to the API', () => {
    for (const param of [
      'country',
      'remote_mode',
      'posted_within_days',
      'has_compensation',
      'match_only',
      'employment_type',
      'seniority',
      'skills',
    ]) {
      expect(src).toContain(param)
    }
  })

  it('still supports the legacy remote boolean as a fallback', () => {
    expect(src).toContain("params.set('remote', 'true')")
  })

  it('distinguishes "no matches for your filters" from "nothing published"', () => {
    expect(src).toContain('hasAnyFilter')
    expect(src).toContain('No roles match your filters')
    expect(src).toContain('No roles are open right now')
  })

  it('reports the total result count to the candidate', () => {
    expect(src).toContain('total')
    expect(src).toContain('aria-live')
  })

  it('marks a truncated total so it does not read as exact', () => {
    expect(src).toContain('truncated')
  })

  it('keeps the anonymous preview gate', () => {
    expect(src).toContain('VISIBLE_LIMIT')
    expect(src).toContain('LockedJobsOverlay')
  })

  it('re-queries when auth state changes so badges appear after sign-in', () => {
    // [\s\S] instead of the /s dotAll flag: this package's tsconfig target
    // predates es2018, where /s is unavailable.
    expect(src).toMatch(/queryKey: \['public-jobs'[\s\S]*isLoggedIn\]/)
  })
})

describe('Filter bar — new controls', () => {
  const src = readFile('jobs/_components/filter-bar.tsx')

  it('exposes country, work setup, date posted and pay filters', () => {
    expect(src).toContain('Country')
    expect(src).toContain('Work setup')
    expect(src).toContain('Date posted')
    expect(src).toContain('Pay listed')
  })

  it('offers hybrid as a work setup', () => {
    expect(src).toContain("value: 'hybrid'")
  })

  it('shows the profile-match toggle only when there is a profile', () => {
    expect(src).toContain('isPersonalized')
    expect(src).toContain('Match my profile')
  })

  it('exports an EMPTY_FILTERS baseline so callers agree on "no filters"', () => {
    expect(src).toContain('export const EMPTY_FILTERS')
  })

  it('marks toggle buttons with aria-pressed', () => {
    expect(src).toContain('aria-pressed')
  })

  it('labels every select for screen readers', () => {
    const selectTriggers = src.split('<SelectTrigger').slice(1)
    expect(selectTriggers.length).toBeGreaterThan(3)
    for (const fragment of selectTriggers) {
      expect(fragment.slice(0, fragment.indexOf('>'))).toContain('aria-label')
    }
  })
})

describe('Job detail page — canonical contract', () => {
  // The server page, its client UI, and the structured data it emits.
  const src = ['jobs/[id]/page.tsx', 'jobs/[id]/_components/job-detail.tsx', '_lib/job-posting.ts']
    .map(readFile)
    .join('\n')

  it('never publishes a hardcoded currency in structured data', () => {
    // Previously emitted currency: 'USD' unconditionally, which would state an
    // INR salary to Google as dollars.
    expect(src).not.toContain("currency: 'USD'")
    expect(src).toContain('job.compensation_currency')
  })

  it('only emits baseSalary when currency and period are known', () => {
    expect(src).toContain('job.compensation_currency && job.compensation_period')
  })

  it('prefers display labels over raw skill slugs (skills live on the detail page, the card carries no tags)', () => {
    expect(src).toContain('skills_display')
    expect(readFile('jobs/_components/job-card.tsx')).not.toContain('skills_display')
  })

  it('offers a Save button next to the apply action', () => {
    expect(src).toContain('SaveJobButton')
  })

  it('sends scraped applicants to the employer and says tracking is not possible', () => {
    expect(src).toContain("job.job_kind === 'scraped'")
    expect(src).toContain('source_url')
    expect(src).toContain("can&apos;t track this application")
  })

  it('routes our own requisitions through the internal apply flow', () => {
    expect(src).toContain('<ApplySection')
  })

  it('keeps the javascript:/data: protocol guard on outbound links', () => {
    // T-05-04 must still cover the new external apply link.
    expect(src).toContain('safeHref(job.source_url)')
  })

  it('uses rel=noopener on the external apply link', () => {
    expect(src).toContain('noopener noreferrer')
  })
})
