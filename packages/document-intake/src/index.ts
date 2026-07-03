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

// Providers
export type {
  IntakeProvider as DocumentIntakeProvider,
} from './providers/index.js'

// Adapters
export {
  ConnectorIntakeAdapter,
} from './adapters/index.js'
export type {
  ConnectorProviderInfo,
  ConnectorFetchResult,
} from './adapters/index.js'
