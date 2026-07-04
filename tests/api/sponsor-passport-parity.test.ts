/**
 * RC-10.5 — Sponsor passport fixture parity between API and web mock modules.
 */

import { createHash } from 'node:crypto'
import { describe, it, expect } from 'vitest'
import {
  getPortfolioInstitutions as getApiPortfolio,
  getPassportByInstitutionId as getApiPassport,
} from '../../apps/api/src/lib/sponsor-passport/mock-data'
import {
  getPortfolioInstitutions as getWebPortfolio,
  getPassportByInstitutionId as getWebPassport,
} from '../../apps/web/src/components/sponsor/passport/passport-mock-data'

const INSTITUTION_IDS = [
  'inst-st-marys',
  'inst-barcelona-oncology',
  'inst-nordic-biobank',
] as const

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function hashPayload(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

describe('Sponsor passport fixture parity (RC-10.5)', () => {
  it('portfolio index matches between API and web mock modules', () => {
    const apiItems = getApiPortfolio()
    const webItems = getWebPortfolio()

    expect(webItems).toEqual(apiItems)
    expect(hashPayload(webItems)).toBe(hashPayload(apiItems))
  })

  it('full passport detail matches for each institution', () => {
    for (const institutionId of INSTITUTION_IDS) {
      const apiPassport = getApiPassport(institutionId)
      const webPassport = getWebPassport(institutionId)

      expect(webPassport).toEqual(apiPassport)
      expect(hashPayload(webPassport)).toBe(hashPayload(apiPassport))
    }
  })

  it('claim inventories match per institution', () => {
    for (const institutionId of INSTITUTION_IDS) {
      const apiClaims = getApiPassport(institutionId)!.claims.map((c) => c.id).sort()
      const webClaims = getWebPassport(institutionId)!.claims.map((c) => c.id).sort()
      expect(webClaims).toEqual(apiClaims)
    }
  })
})
