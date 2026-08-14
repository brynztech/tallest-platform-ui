import { describe, expect, it } from 'vitest'
import type { User } from '@brynzit/identity'
import { assignableRecruiters } from '../../app/(shell)/_lib/assignments'

const users: User[] = [
  { id: 'usr_recruiter', name: 'Priya Recruiter', email: 'p@x.com', role: 'recruiter', title: 'Recruiter' },
  { id: 'usr_recruiter_2', name: 'Ravi Recruiter', email: 'r@x.com', role: 'recruiter', title: 'Recruiter' },
  { id: 'usr_account_manager', name: 'Sam Account', email: 's@x.com', role: 'account_manager', title: 'AM' },
  { id: 'usr_admin', name: 'Admin', email: 'a@x.com', role: 'admin', title: 'Admin' },
]

describe('assignableRecruiters', () => {
  it('offers only recruiter-role users', () => {
    const result = assignableRecruiters(users, [])
    expect(result.map((u) => u.id)).toEqual(['usr_recruiter', 'usr_recruiter_2'])
  })

  it('excludes recruiters already assigned', () => {
    const result = assignableRecruiters(users, ['usr_recruiter'])
    expect(result.map((u) => u.id)).toEqual(['usr_recruiter_2'])
  })

  it('is empty when every recruiter is assigned', () => {
    expect(assignableRecruiters(users, ['usr_recruiter', 'usr_recruiter_2'])).toEqual([])
  })
})
