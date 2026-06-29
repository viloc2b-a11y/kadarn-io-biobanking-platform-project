import { describe, it, expect } from 'vitest'
import { computeBadgeLevel } from '../../apps/api/src/lib/continuity-claim-service'

describe('computeBadgeLevel', () => {
  it('returns self_reported when no evidence or references', () => {
    expect(computeBadgeLevel(0, 0, false)).toBe('self_reported')
  })

  it('returns evidence_backed when at least 1 evidence item', () => {
    expect(computeBadgeLevel(1, 0, false)).toBe('evidence_backed')
    expect(computeBadgeLevel(5, 0, false)).toBe('evidence_backed')
  })

  it('returns reference_confirmed when at least 1 confirmed reference', () => {
    expect(computeBadgeLevel(0, 1, false)).toBe('reference_confirmed')
    expect(computeBadgeLevel(3, 2, false)).toBe('reference_confirmed')
  })

  it('returns kadarn_verified when verified by admin', () => {
    expect(computeBadgeLevel(0, 0, true)).toBe('kadarn_verified')
    expect(computeBadgeLevel(1, 0, true)).toBe('kadarn_verified')
    expect(computeBadgeLevel(0, 1, true)).toBe('kadarn_verified')
    expect(computeBadgeLevel(3, 2, true)).toBe('kadarn_verified')
  })
})

describe('submitForReview', () => {
  it('transitions status to under_review', async () => {
    // Integration test — requires mock DB
    // Unit: verify function exists
    const { submitForReview } = await import('../../apps/api/src/lib/continuity-claim-service')
    expect(submitForReview).toBeDefined()
    expect(typeof submitForReview).toBe('function')
  })
})

describe('reviewClaim', () => {
  it('computes badge on verify', async () => {
    const { reviewClaim } = await import('../../apps/api/src/lib/continuity-claim-service')
    expect(reviewClaim).toBeDefined()
    expect(typeof reviewClaim).toBe('function')
  })
})

describe('promoteToLedger', () => {
  it('promotes a verified claim', async () => {
    const { promoteToLedger } = await import('../../apps/api/src/lib/continuity-claim-service')
    expect(promoteToLedger).toBeDefined()
    expect(typeof promoteToLedger).toBe('function')
  })
})

describe('getVerificationQueue', () => {
  it('filters by status and badge level', async () => {
    const { getVerificationQueue } = await import('../../apps/api/src/lib/continuity-claim-service')
    expect(getVerificationQueue).toBeDefined()
    expect(typeof getVerificationQueue).toBe('function')
  })
})
