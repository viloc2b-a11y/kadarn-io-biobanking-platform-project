// ==========================================================================
// Published View Service — API integration (Sprint 28D)
// Single public read entry point. ADR-030.
// ==========================================================================

import {
  PublishedViewService,
  type LegacyPassportBundle,
} from '@kadarn/published-view'
import {
  isLegacyPassportAdapterEnabled,
} from './phase8-cutover-status'

const legacyEnabled = isLegacyPassportAdapterEnabled()

let _service: PublishedViewService | undefined

export { getPhase8CutoverStatus, isLegacyPassportAdapterEnabled } from './phase8-cutover-status'

export function getPublishedViewService(): PublishedViewService {
  if (!_service) {
    _service = new PublishedViewService({ legacyAdapterEnabled: legacyEnabled })
    if (!legacyEnabled) {
      console.info('[phase8-cutover] Published View path active — LEGACY_PASSPORT_ENABLED=false')
    }
  }
  return _service
}

/** Reset for tests */
export function resetPublishedViewService(): void {
  _service = undefined
}

export type { LegacyPassportBundle }
