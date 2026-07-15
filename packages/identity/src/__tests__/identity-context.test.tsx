import { afterEach, describe, expect, it } from 'vitest'
import { act, render, renderHook, screen } from '@testing-library/react'
import { IdentityProvider, useCan, useActingUser, useSetActingUser } from '../identity-context'
import { SEED_USERS } from '../seed'

afterEach(() => {
  window.localStorage.clear()
})

function wrapper({ children }: { children: React.ReactNode }) {
  return <IdentityProvider>{children}</IdentityProvider>
}

describe('IdentityProvider', () => {
  it('defaults to the first seed user (recruiter)', () => {
    const { result } = renderHook(() => useActingUser(), { wrapper })
    expect(result.current.id).toBe(SEED_USERS[0].id)
    expect(result.current.role).toBe('recruiter')
  })

  it('capabilities follow the acting user after switching', () => {
    const { result } = renderHook(
      () => ({ can: useCan(), setUser: useSetActingUser(), user: useActingUser() }),
      { wrapper },
    )

    expect(result.current.can('admin.view')).toBe(false)

    act(() => result.current.setUser('usr_admin'))

    expect(result.current.user.role).toBe('admin')
    expect(result.current.can('admin.view')).toBe(true)
  })

  it('persists the switched user to localStorage', () => {
    const { result } = renderHook(() => useSetActingUser(), { wrapper })
    act(() => result.current('usr_quality_manager'))
    expect(window.localStorage.getItem('brynzit.identity.actingUserId')).toBe(
      'usr_quality_manager',
    )
  })

  it('ignores an unknown user id', () => {
    const { result } = renderHook(
      () => ({ setUser: useSetActingUser(), user: useActingUser() }),
      { wrapper },
    )
    act(() => result.current.setUser('usr_does_not_exist'))
    expect(result.current.user.id).toBe(SEED_USERS[0].id)
  })

  it('throws a clear error when hooks are used outside the provider', () => {
    expect(() => renderHook(() => useActingUser())).toThrow(/IdentityProvider/)
  })

  it('renders children', () => {
    render(
      <IdentityProvider>
        <span>child</span>
      </IdentityProvider>,
    )
    expect(screen.getByText('child')).toBeDefined()
  })
})
