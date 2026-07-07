/**
 * RC-11.1+ — PassportStore factory (explicit runtime data source).
 *
 * SPONSOR_PASSPORT_DATA_SOURCE=mock | evidence-core
 * Local default: mock. Production default: evidence-core.
 */

import { EvidenceCorePassportStore } from './evidence-core-passport-store'
import { MockPassportStore } from './mock-passport-store'
import type { PassportStore } from './store'

export type SponsorPassportDataSource = 'mock' | 'evidence-core'

let cachedStore: PassportStore | null = null

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

function isMockAllowedInProduction(): boolean {
  return process.env.SPONSOR_PASSPORT_ALLOW_MOCK_IN_PRODUCTION === 'true'
}

export function resolveSponsorPassportDataSource(): SponsorPassportDataSource {
  const raw = process.env.SPONSOR_PASSPORT_DATA_SOURCE
  if (!raw) {
    return isProductionRuntime() ? 'evidence-core' : 'mock'
  }

  if (raw === 'evidence-core') return 'evidence-core'

  if (raw === 'mock' && isProductionRuntime() && !isMockAllowedInProduction()) {
    throw new Error('SPONSOR_PASSPORT_DATA_SOURCE=mock is not allowed in production')
  }

  if (raw !== 'mock') {
    throw new Error(`Unsupported SPONSOR_PASSPORT_DATA_SOURCE value: ${raw}`)
  }

  return 'mock'
}

export function createPassportStore(source: SponsorPassportDataSource = resolveSponsorPassportDataSource()): PassportStore {
  if (source === 'evidence-core') {
    return new EvidenceCorePassportStore()
  }
  return new MockPassportStore()
}

export function getPassportStore(): PassportStore {
  if (!cachedStore) {
    cachedStore = createPassportStore()
  }
  return cachedStore
}

/** Reset singleton — for unit tests only. */
export function resetPassportStoreCache(): void {
  cachedStore = null
}
