import { describe, it, expect } from 'vitest'
import { parseComp } from '../../app/(shell)/_components/compensation-parse'

describe('parseComp', () => {
  it('blank clears the value', () => {
    expect(parseComp('')).toBeNull()
    expect(parseComp('   ')).toBeNull()
  })

  it('parses a plain rupee figure', () => {
    expect(parseComp('4800000')).toBe(4800000)
    expect(parseComp('48,00,000')).toBe(4800000)
  })

  it('parses lakhs shorthand, case-insensitive', () => {
    expect(parseComp('48L')).toBe(4800000)
    expect(parseComp('48l')).toBe(4800000)
    expect(parseComp('48 L')).toBe(4800000)
    expect(parseComp('1.5L')).toBe(150000)
  })

  it('rejects anything else instead of silently coercing', () => {
    expect(parseComp('abc')).toBe('invalid')
    expect(parseComp('-5')).toBe('invalid')
    expect(parseComp('48LPA')).toBe('invalid')
    expect(parseComp('48 lakh')).toBe('invalid')
  })
})
