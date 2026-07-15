import { describe, expect, it } from 'vitest'
import { isAssigned, visibleByAssignment } from '../assignments'

const roles = [{ id: 'req_a' }, { id: 'req_b' }, { id: 'req_c' }]

describe('isAssigned', () => {
  it('checks membership', () => {
    expect(isAssigned(['req_a'], 'req_a')).toBe(true)
    expect(isAssigned(['req_a'], 'req_b')).toBe(false)
  })
})

describe('visibleByAssignment', () => {
  it('returns everything when the user can view all', () => {
    expect(visibleByAssignment(roles, { assignedIds: [], canViewAll: true })).toEqual(roles)
  })

  it('returns only assigned items otherwise', () => {
    const result = visibleByAssignment(roles, { assignedIds: ['req_b'], canViewAll: false })
    expect(result.map((r) => r.id)).toEqual(['req_b'])
  })

  it('returns nothing when a non-privileged user has no assignments', () => {
    expect(visibleByAssignment(roles, { assignedIds: [], canViewAll: false })).toEqual([])
  })
})
