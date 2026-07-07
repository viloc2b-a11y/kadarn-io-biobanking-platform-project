// ==========================================================================
// ORP-1.3 Derived Read Models — Public API
// ==========================================================================
// All exports are pure, deterministic, non-persistent read-model builders.
// They derive projections exclusively from canonical objects.
// No publication metadata. No A10 concepts. No Package Definitions.
// ==========================================================================

export { derivePassportReadModel } from './passport-read-model'
export type { PassportData, PassportReadModelInput } from './passport-read-model'

export { deriveCapabilityReadModel } from './capability-read-model'
export type { CapabilityReadModelInput } from './capability-read-model'

export { deriveReadinessReadModel } from './readiness-read-model'
export type { ReadinessReadModelInput } from './readiness-read-model'

export { deriveRoadmapReadModel } from './roadmap-read-model'
export type { RoadmapReadModelInput } from './roadmap-read-model'
