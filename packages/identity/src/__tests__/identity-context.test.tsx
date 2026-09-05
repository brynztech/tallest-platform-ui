import { describe, expect, it } from 'vitest'
import { render, renderHook, screen } from '@testing-library/react'
import { IdentityProvider, useCan, useActingUser } from '../identity-context'
import type { User } from '../types'

const RECRUITER: User = {
  id: 'usr_1',
  name: 'Priya Recruiter',
  email: 'priya@brynzit.com',
  role: 'recruiter',
}

const ADMIN: User = {
  id: 'usr_2',
  name: 'Admin',
  email: 'admin@brynzit.com',
  role: 'admin',
}

function wrapperFor(actingUser: User) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <IdentityProvider actingUser={actingUser}>{children}</IdentityProvider>
  }
}

describe('IdentityProvider', () => {
  it('exposes exactly the actingUser it was given', () => {
    const { result } = renderHook(() => useActingUser(), { wrapper: wrapperFor(RECRUITER) })
    expect(result.current).toEqual(RECRUITER)
  })

  it('capabilities follow whichever actingUser is passed in', () => {
    const { result: recruiterResult } = renderHook(() => useCan(), {
      wrapper: wrapperFor(RECRUITER),
    })
    expect(recruiterResult.current('admin.view')).toBe(false)

    const { result: adminResult } = renderHook(() => useCan(), { wrapper: wrapperFor(ADMIN) })
    expect(adminResult.current('admin.view')).toBe(true)
  })

  it('throws a clear error when hooks are used outside the provider', () => {
    expect(() => renderHook(() => useActingUser())).toThrow(/IdentityProvider/)
  })

  it('renders children', () => {
    render(
      <IdentityProvider actingUser={RECRUITER}>
        <span>child</span>
      </IdentityProvider>,
    )
    expect(screen.getByText('child')).toBeDefined()
  })
})
