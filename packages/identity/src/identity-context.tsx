'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { hasCapability } from './capabilities'
import { DEFAULT_USER_ID, DEFAULT_WORKSPACE, SEED_USERS } from './seed'
import { readStoredUserId, writeStoredUserId } from './storage'
import type { Capability, User, Workspace } from './types'

interface IdentityContextValue {
  workspace: Workspace
  users: readonly User[]
  actingUser: User
  setActingUser: (userId: string) => void
  can: (capability: Capability) => boolean
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export interface IdentityProviderProps {
  children: React.ReactNode
  /** Override the available users (defaults to the seed users). */
  users?: readonly User[]
  /** Workspace scope (defaults to the single Brynzit workspace). */
  workspace?: Workspace
  /** Acting user id used for the first render before storage is read. */
  defaultUserId?: string
}

export function IdentityProvider({
  children,
  users = SEED_USERS,
  workspace = DEFAULT_WORKSPACE,
  defaultUserId = DEFAULT_USER_ID,
}: IdentityProviderProps) {
  // Deterministic on both server and first client render → no hydration
  // mismatch. The stored preference is applied after mount below.
  const initialUserId = users.some((u) => u.id === defaultUserId)
    ? defaultUserId
    : users[0].id
  const [actingUserId, setActingUserId] = useState<string>(initialUserId)

  useEffect(() => {
    const stored = readStoredUserId()
    if (stored && users.some((u) => u.id === stored)) {
      setActingUserId(stored)
    }
  }, [users])

  const setActingUser = useCallback(
    (userId: string) => {
      setActingUserId((prev) => (users.some((u) => u.id === userId) ? userId : prev))
      writeStoredUserId(userId)
    },
    [users],
  )

  const actingUser = useMemo(
    () => users.find((u) => u.id === actingUserId) ?? users[0],
    [users, actingUserId],
  )

  const value = useMemo<IdentityContextValue>(
    () => ({
      workspace,
      users,
      actingUser,
      setActingUser,
      can: (capability: Capability) => hasCapability(actingUser.role, capability),
    }),
    [workspace, users, actingUser, setActingUser],
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

/** The full identity context (workspace, users, acting user, switcher, can). */
export function useIdentityContext(): IdentityContextValue {
  return useIdentity()
}

/** The currently acting user. */
export function useActingUser(): User {
  return useIdentity().actingUser
}

/** Switch the acting user by id (persists the preference). */
export function useSetActingUser(): (userId: string) => void {
  return useIdentity().setActingUser
}

/**
 * Returns a `can(capability)` checker bound to the acting user's role. Use for
 * nav visibility, button enable/disable, and route guards.
 */
export function useCan(): (capability: Capability) => boolean {
  return useIdentity().can
}
