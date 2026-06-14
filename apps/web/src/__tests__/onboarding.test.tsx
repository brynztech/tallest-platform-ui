import { describe, it } from 'vitest'

describe('Resume upload step (PUB-03)', () => {
  it.todo('renders dropzone accepting PDF DOC DOCX')
  it.todo('calls POST /candidate/profile/resume with FormData on file drop')
  it.todo('useAsyncJob polling shows Parsing your resume label while processing')
  it.todo('auto-advances to step 2 after parse completes')
  it.todo('shows error toast and advances to step 2 when parse fails')
})

describe('Profile confirm step (PUB-04)', () => {
  it.todo('pre-populates fields from profile query data')
  it.todo('shows skeleton while profile is loading')
  it.todo('saves profile and advances to step 3 on Save continue')
})

describe('Completeness meter (PUB-05)', () => {
  it.todo('renders Progress bar with value from completeness_score API field')
  it.todo('shows Reach 70% to unlock 1-click apply when score < 70')
  it.todo('does NOT show gate label when score >= 70')
})
