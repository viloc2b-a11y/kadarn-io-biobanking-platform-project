// ==========================================================================
// Capability Intelligence Engine — Public API (Sprint 21B / KTP-1.5A)
// ==========================================================================

export { CapabilityIntelligenceEngine } from './engine'

// Core types
export type {
  CapabilityCategory,
  CapabilityEntry,
  CapabilityIntelligence,
  CapabilityIntelligenceInput,
  CapabilityStatus,
  CapabilitySummary,
  ResearchAssetLabel,
} from './types'

export { RESEARCH_ASSET_LABELS } from './types'

// Module outputs (KTP-1.5A Gap Closure)
export { buildCapabilityMatrix } from './matrix'
export type { CapabilityMatrix, CapabilityMatrixRow } from './matrix'

export { analyzeEvidenceGaps } from './gaps'
export type { EvidenceGap } from './gaps'

export { interpretReadiness } from './interpretation'
export type { ReadinessInterpretation } from './interpretation'

export { assessProgramFit } from './fit'
export type { ProgramFitAssessment } from './fit'

export { generateRecommendations } from './recommendations'
export type { ImprovementRecommendation } from './recommendations'

export { buildSponsorDecisionView } from './sponsor-view'
export type { SponsorDecisionView, SponsorDecisionViewMetadata } from './sponsor-view'
