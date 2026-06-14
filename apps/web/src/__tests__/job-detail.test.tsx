import { describe, it } from 'vitest'

describe('Job detail page (JOB-02)', () => {
  it.todo('renders job title, company, location, full JD from useQuery')
  it.todo('renders compensation range when compensation_min is present')
  it.todo('renders skills as outline badges')
  it.todo('JD body rendered with whitespace-pre-wrap class, not dangerouslySetInnerHTML')
})

describe('JSON-LD (JOB-03)', () => {
  it.todo('script tag with type application/ld+json injected into head via useEffect')
  it.todo('JSON-LD contains @type: JobPosting with title, hiringOrganization, datePosted')
  it.todo('employmentType mapped: full_time -> FULL_TIME, contract -> CONTRACTOR')
})

describe('Apply flow (JOB-04)', () => {
  it.todo('Sign up to apply button shown for logged-out visitor')
  it.todo('Apply now button shown for logged-in candidate with completeness_score >= 70')
  it.todo('Complete your profile button shown for score < 70')
  it.todo('optional note textarea with 200 char limit and counter shown when apply is available')
  it.todo('POST /candidate/applications called on Apply now click')
  it.todo('Application submitted toast shown on success')
})
