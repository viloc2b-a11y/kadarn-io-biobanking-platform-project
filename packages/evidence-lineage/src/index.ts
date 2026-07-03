export { EvidenceLineageEngine } from './engine.js'
export type {
  Source, SourceVersion, LineageArtifact,
  ExtractionRun, ExtractionRunWarning,
  ExtractedFact, FactType,
  EvidenceLineage, LineageResult,
} from './types.js'

export { EntityResolutionEngine } from './entity-resolution.js'
export type {
  EntityType, EntityTimelineEntry, EntityIdentifier,
  NormalizedEntity, ResolutionInput, ResolutionResult,
} from './entity-resolution.js'

export { ClaimGenerationEngine } from './claim-generation.js'
export type {
  ClaimType, ClaimCandidate, ConfidenceInput,
  ClaimDefinition, Claim, GenerationRule,
} from './claim-generation.js'

export { ClaimProvenanceEngine } from './claim-provenance.js'
export type {
  ProvenanceStep, ProvenanceInput, ProvenanceOutput,
  ClaimProvenance,
} from './claim-provenance.js'
