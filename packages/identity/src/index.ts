export type { Capability, Role, User, Workspace } from './types'
export {
  ALL_CAPABILITIES,
  ROLE_CAPABILITIES,
  ROLE_LABELS,
  hasCapability,
} from './capabilities'
export { DEFAULT_WORKSPACE } from './seed'
export { IdentityProvider, useActingUser, useCan } from './identity-context'
export type { IdentityProviderProps } from './identity-context'
