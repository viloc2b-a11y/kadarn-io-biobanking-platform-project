// ==========================================================================
// Temporal metadata helpers (KEMS-001 §9)
// ==========================================================================

import type { TemporalMetadata } from './types.js';

/**
 * Create temporal metadata.
 */
export function createTemporal(params?: {
  decayPeriodMonths?: number | null;
}): TemporalMetadata {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    decayPeriodMonths: params?.decayPeriodMonths ?? null,
  };
}
