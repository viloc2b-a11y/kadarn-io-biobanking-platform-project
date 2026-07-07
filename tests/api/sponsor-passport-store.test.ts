/**
 * RC-11.1+ — PassportStore factory and Evidence Core store tests.
 */

import { afterEach, describe, expect, it } from 'vitest'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import {
  createPassportStore,
  getPassportStore,
  resetPassportStoreCache,
  resolveSponsorPassportDataSource,
} from '../../apps/api/src/lib/sponsor-passport/factory'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'
import { MockPassportStore } from '../../apps/api/src/lib/sponsor-passport/mock-passport-store'
import { seedSponsorPortfolioMemberships } from './sponsor-passport-portfolio-fixtures'

const ENV_KEY = 'SPONSOR_PASSPORT_DATA_SOURCE'
const MOCK_OVERRIDE_ENV_KEY = 'SPONSOR_PASSPORT_ALLOW_MOCK_IN_PRODUCTION'

function createFakeDb(): DbClient {
  const tables: Record<string, Record<string, Record<string, unknown>>> = {}

  return {
    from(table: string) {
      if (!tables[table]) tables[table] = {}
      const rows = tables[table]

      return {
        async insert(data) {
          const record = Array.isArray(data) ? data[0] : data
          const id = (record.id as string) ?? crypto.randomUUID()
          rows[id] = { ...record, id }
          return { data: rows[id], error: null }
        },
        select() {
          return {
            async eq(col: string, val: unknown) {
              const results = Object.values(rows).filter((r) => r[col] === val)
              return { data: results, error: null }
            },
          }
        },
      }
    },
    async rpc() {
      return { data: null, error: null }
    },
  }
}

describe('PassportStore factory (RC-11.1)', () => {
  const originalEnv = process.env[ENV_KEY]
  const originalMockOverrideEnv = process.env[MOCK_OVERRIDE_ENV_KEY]
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_KEY]
    } else {
      process.env[ENV_KEY] = originalEnv
    }
    if (originalMockOverrideEnv === undefined) {
      delete process.env[MOCK_OVERRIDE_ENV_KEY]
    } else {
      process.env[MOCK_OVERRIDE_ENV_KEY] = originalMockOverrideEnv
    }
    process.env.NODE_ENV = originalNodeEnv
    resetPassportStoreCache()
  })

  it('defaults to mock when env is unset', () => {
    delete process.env[ENV_KEY]
    expect(resolveSponsorPassportDataSource()).toBe('mock')
    expect(createPassportStore()).toBeInstanceOf(MockPassportStore)
  })

  it('defaults to Evidence Core when env is unset in production', () => {
    process.env.NODE_ENV = 'production'
    delete process.env[ENV_KEY]
    expect(resolveSponsorPassportDataSource()).toBe('evidence-core')
    expect(createPassportStore()).toBeInstanceOf(EvidenceCorePassportStore)
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

  it('getPassportStore resolves to Evidence Core in production when source env is unset', () => {
    process.env.NODE_ENV = 'production'
    delete process.env[ENV_KEY]
    resetPassportStoreCache()

    expect(getPassportStore()).toBeInstanceOf(EvidenceCorePassportStore)
  })

  it('rejects mock data source in production without explicit override', () => {
    process.env.NODE_ENV = 'production'
    process.env[ENV_KEY] = 'mock'
    delete process.env[MOCK_OVERRIDE_ENV_KEY]

    expect(() => resolveSponsorPassportDataSource()).toThrow(
      'SPONSOR_PASSPORT_DATA_SOURCE=mock is not allowed in production',
    )
  })

  it('allows mock data source in production only with explicit override', () => {
    process.env.NODE_ENV = 'production'
    process.env[ENV_KEY] = 'mock'
    process.env[MOCK_OVERRIDE_ENV_KEY] = 'true'

    expect(resolveSponsorPassportDataSource()).toBe('mock')
  })

  it('rejects unsupported data source values', () => {
    process.env[ENV_KEY] = 'fixture'

    expect(() => resolveSponsorPassportDataSource()).toThrow(
      'Unsupported SPONSOR_PASSPORT_DATA_SOURCE value: fixture',
    )
  })

  it('EvidenceCorePassportStore does not fall back to mock data when the runtime source fails', async () => {
    const store = new EvidenceCorePassportStore(async () => {
      throw new Error('Evidence Core unavailable')
    })

    await expect(store.getPortfolioIndex('org-sponsor')).rejects.toThrow('Evidence Core unavailable')
  })

  it('EvidenceCorePassportStore returns undefined when institution is not in portfolio', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, 'org-sponsor', [{ institutionId: 'org-in-portfolio' }])

    const store = new EvidenceCorePassportStore(async () => db)

    await expect(store.getInstitutionalPassport('org-sponsor', 'org-outside')).resolves.toBeUndefined()
    await expect(store.isInstitutionInPortfolio('org-sponsor', 'org-outside')).resolves.toBe(false)
  })

  it('EvidenceCorePassportStore returns undefined for portfolio institution with no claims', async () => {
    const db = createFakeDb()
    await seedSponsorPortfolioMemberships(db, 'org-sponsor', [{ institutionId: 'org-empty' }])

    const store = new EvidenceCorePassportStore(async () => db)

    await expect(store.getInstitutionalPassport('org-sponsor', 'org-empty')).resolves.toBeUndefined()
    await expect(store.isInstitutionInPortfolio('org-sponsor', 'org-empty')).resolves.toBe(true)
    await expect(
      store.getClaimProvenanceDetail('org-sponsor', 'org-empty', 'claim-missing'),
    ).resolves.toBeUndefined()
  })
})

