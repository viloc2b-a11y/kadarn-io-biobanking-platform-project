// ==========================================================================
// ORP-1.5 Derived Read Models — Public API (FROZEN)
// ==========================================================================
// All exports are pure, deterministic, non-persistent read-model builders.
// They derive projections exclusively from canonical objects.
// KnowledgeContext is the single enrichment point (ORP-1.5, FROZEN).
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

export type {
  KnowledgeContext,
  ClaimReference,
  EvidenceReference,
  ProvenanceReference,
  ConfidenceContext,
  LimitationContext,
  QualityContext,
  ReadModelEnrichment,
  EvidenceSupport,
  ConditionalRequirement,
} from './types'
export {
  buildEnrichment,
  EVIDENCE_SUPPORT_LABELS,
  CONDITIONAL_REQUIREMENTS,
  getActiveConditionalRequirements,
} from './types'
