// ==========================================================================
// Kadarn Document Intake Engine — Public API
// ==========================================================================
// Sprint 26A — Foundation.
//
// This is the entry point for the @kadarn/document-intake package.
// Exposes contracts, engine, providers, and adapters.
// ==========================================================================

// Contracts
export type {
  DocumentSource,
  DocumentSourceKind,
  DocumentArtifact,
  IntakeDocumentFormat,
  NormalizedDocument,
  IntakeWarning,
  IntakeMetadata,
  IntakeProvider,
  IntakeProviderName,
} from './contracts.js'
export { MIME_TO_FORMAT } from './contracts.js'

// Engine
export {
  DocumentIntakeEngine,
  NoSuitableProviderError,
  IntakeNormalizationError,
} from './engine.js'

// Gateway (canonical entry point)
export {
  DocumentIntakeGateway,
  IntakeGatewayError,
} from './gateway.js'
export type {
  IntakeGatewayResult,
  GatewayConfig,
} from './gateway.js'

// Metrics
export {
  getIntakeMetrics,
  resetIntakeMetrics,
} from './metrics.js'
export type {
  IntakeMetrics,
} from './metrics.js'

// Providers
export type {
  IntakeProvider as DocumentIntakeProvider,
} from './providers/index.js'

export {
  MarkItDownAdapter,
  MarkItDownNotInstalledError,
  MarkItDownTimeoutError,
  MarkItDownExecutionError,
} from './providers/index.js'

// Adapters
export {
  ConnectorIntakeAdapter,
} from './adapters/index.js'
export type {
  ConnectorProviderInfo,
  ConnectorFetchResult,
} from './adapters/index.js'

// Classification
export { DocumentClassificationEngine } from './classification/index.js'
export type {
  ClassificationLabel,
  ClassificationMatch,
  DocumentClassification,
} from './classification/index.js'

// Segmentation
export { EvidenceSegmentationEngine } from './segmentation/index.js'
export type {
  DocumentSection,
  SectionPosition,
  SegmentationResult,
  SegmentationOptions,
} from './segmentation/index.js'

// Extraction
export { StructuredExtractionEngine } from './extraction/index.js'
export type {
  ExtractedEntity,
  EntityType,
  EntityMention,
  ExtractedRelationship,
  RelationshipType,
  ClaimCandidate,
  ClaimType,
  CapabilityCandidate,
  CapabilityCategory,
  ResearchAssetCandidate,
  AssetType,
  StructuredExtraction,
  ExtractionContext,
} from './extraction/index.js'

// Provenance
export { DocumentProvenanceEngine } from './provenance/index.js'
export type {
  ProvenanceLink,
  ProvenanceStep,
  ProvenanceRecord,
  ProvenanceTrace,
  ProvenanceForward,
} from './provenance/index.js'
