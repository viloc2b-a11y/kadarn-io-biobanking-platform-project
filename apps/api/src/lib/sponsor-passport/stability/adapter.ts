/**
 * RC-12.2D - Stability Adapter Integration helper.
 *
 * Bridges Evidence Core source reads to the existing RC-10.2 StabilityIndicator
 * without changing public contract shape.
 */

import type { StabilityIndicator } from '../types'
import { evaluateStabilityDomain } from './domain'
import {
  buildStabilityLifecycleSnapshotFromSource,
  type BuildStabilitySourceSnapshotParams,
} from './source'

export function deriveStabilityIndicatorFromSource(
  params: BuildStabilitySourceSnapshotParams,
): StabilityIndicator {
  const snapshot = buildStabilityLifecycleSnapshotFromSource(params)
  return evaluateStabilityDomain(snapshot, {
    referenceDate: params.referenceDate,
  }).state
}
