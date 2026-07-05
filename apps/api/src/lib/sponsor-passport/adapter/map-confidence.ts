/**
 * RC-11.3 — Evidence Core confidence → Sponsor Passport wire enum.
 */

import type { ConfidenceLevel as PassportConfidenceLevel } from '../types'

type CoreConfidenceLevel = 'high' | 'moderate' | 'low' | 'insufficient'

const CORE_TO_PASSPORT: Record<CoreConfidenceLevel, PassportConfidenceLevel> = {
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  insufficient: 'Insufficient',
}

export function mapConfidenceLevel(level: CoreConfidenceLevel): PassportConfidenceLevel {
  return CORE_TO_PASSPORT[level]
}
