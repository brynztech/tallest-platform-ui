import { describe, it } from 'vitest'

describe('Signup (PUB-02)', () => {
  it.todo('renders signup form with first name, last name, email, password fields')
  it.todo('shows zod error when email is invalid')
  it.todo('shows zod error when password is shorter than 8 chars')
  it.todo('calls POST /candidate/auth/signup and stores token in localStorage on success')
  it.todo('shows 409 conflict toast when email already registered')
})

describe('Login (PUB-02)', () => {
  it.todo('calls POST /candidate/auth/login and stores token on success')
  it.todo('shows 401 toast on wrong password')
  it.todo('redirects to redirect param if present after successful login')
})

describe('CandidateAuthContext (PUB-02)', () => {
  it.todo('isLoggedIn is false initially when localStorage is empty')
  it.todo('isLoggedIn is true after signIn called')
  it.todo('isLoggedIn is false after signOut called')
  it.todo('JSON.parse error in localStorage hydration is caught silently')
})
