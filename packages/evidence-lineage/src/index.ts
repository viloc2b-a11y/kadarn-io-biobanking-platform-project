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

export { ReviewLifecycleEngine } from './review-lifecycle.js'
export type { ReviewEventType, ReviewEvent } from './review-lifecycle.js'

export { ConfidenceStateEngine } from './confidence-state.js'
export type { EvidenceGraphNode, EvidenceGraphEdge, ConfidenceState } from './confidence-state.js'

export { PublishedViewEngine } from './published-view.js'
export type { ViewType, PublishedView } from './published-view.js'

export { EvidencePackEngine } from './evidence-pack.js'
export type { EvidencePack } from './evidence-pack.js'

export { SchemaEvolutionEngine } from './schema-evolution.js'
export type { ClaimTypeDefinition, MigrationRule, ReadAdapter } from './schema-evolution.js'

export { SystemsIntegrationEngine } from './systems-integration.js'
export type { IntegrationSystem, IntegrationContract, WebhookEvent } from './systems-integration.js'

export { HybridIndexingEngine } from './hybrid-indexing.js'
export type { IndexConfig, MaterializedEdge } from './hybrid-indexing.js'

export { ArchitectureFreezeEngine } from './architecture-freeze.js'
export type { ArchitectureFreezeRecord } from './architecture-freeze.js'
