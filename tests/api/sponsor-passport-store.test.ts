/**
 * RC-11.1 / RC-11.3 — PassportStore factory and Evidence Core store tests.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  createPassportStore,
  getPassportStore,
  resetPassportStoreCache,
  resolveSponsorPassportDataSource,
} from '../../apps/api/src/lib/sponsor-passport/factory'
import {
  EVIDENCE_CORE_PORTFOLIO_NOT_IMPLEMENTED,
  EVIDENCE_CORE_PROVENANCE_NOT_IMPLEMENTED,
  EvidenceCorePassportStore,
} from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { MockPassportStore } from '../../apps/api/src/lib/sponsor-passport/mock-passport-store'

const ENV_KEY = 'SPONSOR_PASSPORT_DATA_SOURCE'

describe('PassportStore factory (RC-11.1)', () => {
  const originalEnv = process.env[ENV_KEY]

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_KEY]
    } else {
      process.env[ENV_KEY] = originalEnv
    }
    resetPassportStoreCache()
  })

  it('defaults to mock when env is unset', () => {
    delete process.env[ENV_KEY]
    expect(resolveSponsorPassportDataSource()).toBe('mock')
    expect(createPassportStore()).toBeInstanceOf(MockPassportStore)
  })

  it('returns MockPassportStore when SPONSOR_PASSPORT_DATA_SOURCE=mock', () => {
    process.env[ENV_KEY] = 'mock'
    resetPassportStoreCache()
    expect(getPassportStore()).toBeInstanceOf(MockPassportStore)
  })

  it('returns EvidenceCorePassportStore when SPONSOR_PASSPORT_DATA_SOURCE=evidence-core', () => {
    process.env[ENV_KEY] = 'evidence-core'
    resetPassportStoreCache()
    expect(getPassportStore()).toBeInstanceOf(EvidenceCorePassportStore)
  })

  it('EvidenceCorePassportStore defers portfolio and provenance methods (RC-11.4/11.5)', async () => {
    const store = new EvidenceCorePassportStore(async () => {
      throw new Error('db should not be called')
    })
    const sponsorOrgId = 'org-test'
    const institutionId = 'inst-st-marys'
    const claimId = 'claim-pbmc-001'

    await expect(store.getPortfolioIndex(sponsorOrgId)).rejects.toThrow(
      EVIDENCE_CORE_PORTFOLIO_NOT_IMPLEMENTED,
    )
    await expect(
      store.getClaimProvenanceDetail(sponsorOrgId, institutionId, claimId),
    ).rejects.toThrow(EVIDENCE_CORE_PROVENANCE_NOT_IMPLEMENTED)
    await expect(store.isInstitutionInPortfolio(sponsorOrgId, institutionId)).rejects.toThrow(
      EVIDENCE_CORE_PORTFOLIO_NOT_IMPLEMENTED,
    )
  })

  it('EvidenceCorePassportStore returns undefined for institution with no claims', async () => {
    const store = new EvidenceCorePassportStore(async () => {
      const tables: Record<string, Record<string, Record<string, unknown>>> = {}
      return {
        from(table: string) {
          if (!tables[table]) tables[table] = {}
          return {
            async insert() {
              return { data: null, error: null }
            },
            select() {
              return {
                async eq() {
                  return { data: [], error: null }
                },
              }
            },
          }
        },
        async rpc() {
          return { data: null, error: null }
        },
      }
    })

    await expect(store.getInstitutionalPassport('org-sponsor', 'org-empty')).resolves.toBeUndefined()
  })
})
