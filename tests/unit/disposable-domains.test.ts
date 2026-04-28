import { describe, it, expect } from 'vitest'
import { isDisposableDomain } from '@/lib/disposable-domains'

describe('isDisposableDomain (SPAM-04)', () => {
  it('returns true for mailinator.com', () => {
    expect(isDisposableDomain('user@mailinator.com')).toBe(true)
  })
  it('returns true for 10minutemail.com (digit-leading domain edge case)', () => {
    expect(isDisposableDomain('user@10minutemail.com')).toBe(true)
  })
  it('returns false for gmail.com', () => {
    expect(isDisposableDomain('user@gmail.com')).toBe(false)
  })
  it('returns false for useQuibly.com', () => {
    expect(isDisposableDomain('founder@useQuibly.com')).toBe(false)
  })
  it('is case-insensitive on the domain', () => {
    expect(isDisposableDomain('USER@MAILINATOR.COM')).toBe(true)
  })
  it('returns false for malformed input without @', () => {
    expect(isDisposableDomain('not-an-email')).toBe(false)
  })
  it('returns false for empty string', () => {
    expect(isDisposableDomain('')).toBe(false)
  })
  it('returns true for the guerrillamail.com family', () => {
    expect(isDisposableDomain('user@guerrillamail.com')).toBe(true)
    expect(isDisposableDomain('user@guerrillamail.info')).toBe(true)
    expect(isDisposableDomain('user@grr.la')).toBe(true)
  })
})
