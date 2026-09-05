import { describe, expect, it } from 'vitest'
import type { AssignableRecruiter } from '../../app/_lib/staff-auth'
import { assignableRecruiters } from '../../app/(shell)/_lib/assignments'

// Role/active filtering happens server-side (GET /auth/users/recruiters) —
// every row here is already a recruiter; this helper only excludes assigned ones.
const recruiters: AssignableRecruiter[] = [
  { id: 'usr_recruiter', username: 'priya' },
  { id: 'usr_recruiter_2', username: 'ravi' },
]

describe('assignableRecruiters', () => {
  it('offers everyone when none are assigned', () => {
    const result = assignableRecruiters(recruiters, [])
    expect(result.map((u) => u.id)).toEqual(['usr_recruiter', 'usr_recruiter_2'])
  })

  it('excludes recruiters already assigned', () => {
    const result = assignableRecruiters(recruiters, ['usr_recruiter'])
    expect(result.map((u) => u.id)).toEqual(['usr_recruiter_2'])
  })

  it('is empty when every recruiter is assigned', () => {
    expect(assignableRecruiters(recruiters, ['usr_recruiter', 'usr_recruiter_2'])).toEqual([])
  })
})
