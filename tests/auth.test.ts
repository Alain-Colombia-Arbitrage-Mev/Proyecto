import { describe, it, expect } from 'vitest'
import { isPlatformAdmin } from '../server/utils/auth'

describe('isPlatformAdmin', () => {
  it('returns true for known admin email', () => {
    expect(isPlatformAdmin('guardcolombia@gmail.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isPlatformAdmin('GuardColombia@Gmail.com')).toBe(true)
  })

  it('returns false for unknown email', () => {
    expect(isPlatformAdmin('random@example.com')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isPlatformAdmin(undefined)).toBe(false)
  })
})
