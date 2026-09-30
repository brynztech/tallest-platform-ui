/**
 * The JobPosting structured data Google reads on /jobs/[id]. Google drops a
 * posting from job search when a required field is malformed, silently.
 */
import { describe, it, expect } from 'vitest'
import { jobPostingJsonLd } from '../../app/_lib/job-posting'
import type { PublicJobItem } from '../../app/_lib/candidate-types'

const JOB: PublicJobItem = {
  id: '6ed76ce8-4156-4b60-b120-403538bd66cd',
  title: 'Senior Backend Engineer',
  company_name: 'Acme',
  employment_type: 'full_time',
  location: 'Remote - US',
  remote: true,
  seniority: 'senior',
  skills: [],
  date_posted: '2026-09-29',
  description_summary: 'Build the platform.',
  compensation_min: 180000,
  compensation_max: 240000,
  match_strength: null,
  job_kind: 'scraped',
  source: 'lever',
  source_url: 'https://jobs.lever.co/acme/1',
  country: 'US',
  city: null,
  remote_mode: 'remote',
  role_family: null,
  compensation_currency: 'USD',
  compensation_period: 'year',
  match_reasons: [],
  skills_display: [],
  compensation_label: 'USD 180k–240k/yr',
  openings: 1,
  company_logo_url: 'https://cdn.example/acme.png',
  applicants_count: null,
  alternate_postings: [],
}

// What Google receives: undefined fields vanish in JSON.
const render = (job: PublicJobItem) => JSON.parse(JSON.stringify(jobPostingJsonLd(job)))

describe('jobPostingJsonLd', () => {
  it('marks a remote role as telecommute with the country applicants must live in', () => {
    const ld = render(JOB)
    expect(ld.jobLocationType).toBe('TELECOMMUTE')
    expect(ld.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'USA' })
    expect(ld.jobLocation.address).toEqual({ '@type': 'PostalAddress', addressCountry: 'US' })
    expect(ld.directApply).toBe(false)
    expect(ld.hiringOrganization).toEqual({
      '@type': 'Organization',
      name: 'Acme',
      logo: 'https://cdn.example/acme.png',
    })
    expect(ld.baseSalary.value).toMatchObject({ minValue: 180000, maxValue: 240000, unitText: 'YEAR' })
  })

  it('gives an office role a structured address and no remote fields', () => {
    const ld = render({ ...JOB, remote_mode: 'onsite', remote: false, city: 'Bengaluru', country: 'IN' })
    expect(ld.jobLocation.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Bengaluru',
      addressCountry: 'IN',
    })
    expect(ld.jobLocationType).toBeUndefined()
    expect(ld.applicantLocationRequirements).toBeUndefined()
  })

  it('leaves out what it does not know instead of guessing', () => {
    const ld = render({ ...JOB, date_posted: '', compensation_currency: null, company_logo_url: null })
    expect(ld).not.toHaveProperty('datePosted')
    expect(ld).not.toHaveProperty('baseSalary')
    expect(ld.hiringOrganization).not.toHaveProperty('logo')
  })

  it('lets our own requisitions be applied for on Brynz', () => {
    expect(render({ ...JOB, job_kind: 'client_requisition' }).directApply).toBe(true)
  })
})
