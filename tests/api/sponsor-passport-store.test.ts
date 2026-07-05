/**
 * RC-11.1+ — PassportStore factory and Evidence Core store tests.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  createPassportStore,
  getPassportStore,
  resetPassportStoreCache,
  resolveSponsorPassportDataSource,
} from '../../apps/api/src/lib/sponsor-passport/factory'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { setPortfolioAllowlistForTests } from '../../apps/api/src/lib/sponsor-passport/adapter/portfolio-allowlist'
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
    setPortfolioAllowlistForTests(null)
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

  it('EvidenceCorePassportStore returns undefined when institution is not in portfolio', async () => {
    setPortfolioAllowlistForTests({
      'org-sponsor': [{ institutionId: 'org-in-portfolio' }],
    })

    const store = new EvidenceCorePassportStore(async () => {
      throw new Error('db should not be called')
    })

    await expect(store.getInstitutionalPassport('org-sponsor', 'org-outside')).resolves.toBeUndefined()
    await expect(store.isInstitutionInPortfolio('org-sponsor', 'org-outside')).resolves.toBe(false)
  })

  it('EvidenceCorePassportStore returns undefined for allowlisted institution with no claims', async () => {
    setPortfolioAllowlistForTests({
      'org-sponsor': [{ institutionId: 'org-empty' }],
    })

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
    await expect(store.isInstitutionInPortfolio('org-sponsor', 'org-empty')).resolves.toBe(true)
  })
})
