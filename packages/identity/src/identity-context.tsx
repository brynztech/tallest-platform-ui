'use client'

import { createContext, useContext, useMemo } from 'react'
import { hasCapability } from './capabilities'
import { DEFAULT_WORKSPACE } from './seed'
import type { Capability, User, Workspace } from './types'

interface IdentityContextValue {
  workspace: Workspace
  actingUser: User
  can: (capability: Capability) => boolean
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export interface IdentityProviderProps {
  children: React.ReactNode
  /**
   * The real signed-in user, supplied by the host app's own auth layer. This
   * package is intentionally headless (see index.ts) — it has no opinion on
   * how you authenticate or where `actingUser` comes from, only on what a
   * role can do once you tell it who is acting. There is no switcher and no
   * stored preference here anymore: `actingUser` IS who is signed in.
   */
  actingUser: User
  /** Workspace scope (defaults to the single Brynzit workspace). */
  workspace?: Workspace
}

export function IdentityProvider({
  children,
  actingUser,
  workspace = DEFAULT_WORKSPACE,
}: IdentityProviderProps) {
  const value = useMemo<IdentityContextValue>(
    () => ({
      workspace,
      actingUser,
      can: (capability: Capability) => hasCapability(actingUser.role, capability),
    }),
    [workspace, actingUser],
  )

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
}

function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext)
  if (ctx === null) {
    throw new Error('useIdentity must be used within an <IdentityProvider>')
  }
  return ctx
}

/** The currently signed-in user. */
export function useActingUser(): User {
  return useIdentity().actingUser
}

/**
 * Returns a `can(capability)` checker bound to the acting user's role. Use for
 * nav visibility, button enable/disable, and route guards.
 */
export function useCan(): (capability: Capability) => boolean {
  return useIdentity().can
}
