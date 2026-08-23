import { describe, expect, it } from 'vitest'
import {
  ALL_CAPABILITIES,
  ROLE_CAPABILITIES,
  hasCapability,
} from '../capabilities'
import type { Role } from '../types'

describe('capability matrix', () => {
  it('admin holds every capability', () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(hasCapability('admin', capability)).toBe(true)
    }
  })

  it('recruiter can submit and override AI but cannot approve the internal gate', () => {
    expect(hasCapability('recruiter', 'candidate.submit')).toBe(true)
    expect(hasCapability('recruiter', 'submission.override_ai')).toBe(true)
    expect(hasCapability('recruiter', 'submission.approve_gate')).toBe(false)
  })

  it('only quality manager and admin can approve the internal gate', () => {
    expect(hasCapability('quality_manager', 'submission.approve_gate')).toBe(true)
    expect(hasCapability('admin', 'submission.approve_gate')).toBe(true)
    expect(hasCapability('account_manager', 'submission.approve_gate')).toBe(false)
    expect(hasCapability('recruiter', 'submission.approve_gate')).toBe(false)
  })

  it('only account manager and admin can manage clients', () => {
    expect(hasCapability('account_manager', 'client.manage')).toBe(true)
    expect(hasCapability('admin', 'client.manage')).toBe(true)
    expect(hasCapability('recruiter', 'client.manage')).toBe(false)
    expect(hasCapability('quality_manager', 'client.manage')).toBe(false)
  })

  it('every human role can override an AI decision', () => {
    const roles: Role[] = ['recruiter', 'account_manager', 'quality_manager', 'admin']
    for (const role of roles) {
      expect(hasCapability(role, 'submission.override_ai')).toBe(true)
    }
  })

  it('only admin sees the admin surface', () => {
    expect(hasCapability('admin', 'admin.view')).toBe(true)
    expect(hasCapability('account_manager', 'admin.view')).toBe(false)
    expect(hasCapability('quality_manager', 'admin.view')).toBe(false)
    expect(hasCapability('recruiter', 'admin.view')).toBe(false)
  })

  it('recruiter does not see internal ops; managers and admin do', () => {
    expect(hasCapability('recruiter', 'internal_ops.view')).toBe(false)
    expect(hasCapability('account_manager', 'internal_ops.view')).toBe(true)
    expect(hasCapability('quality_manager', 'internal_ops.view')).toBe(true)
    expect(hasCapability('admin', 'internal_ops.view')).toBe(true)
  })

  it('recruiter cannot advance the pipeline; managers and admin can', () => {
    // The /pipeline board renders read-only without this capability — the
    // recruiter watches their submitted candidates move and is notified on
    // every change instead of driving the stages themselves.
    expect(hasCapability('recruiter', 'pipeline.advance')).toBe(false)
    expect(hasCapability('account_manager', 'pipeline.advance')).toBe(true)
    expect(hasCapability('quality_manager', 'pipeline.advance')).toBe(true)
    expect(hasCapability('admin', 'pipeline.advance')).toBe(true)
  })

  it('capability lists contain no duplicates', () => {
    for (const capabilities of Object.values(ROLE_CAPABILITIES)) {
      expect(new Set(capabilities).size).toBe(capabilities.length)
    }
  })
})
