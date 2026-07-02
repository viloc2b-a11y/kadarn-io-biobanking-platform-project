// ==========================================================================
// Evidence Discovery — Extraction Provider Public API
// ==========================================================================
// Sprint 20A.3A.
// ==========================================================================

export { DocumentExtractionRegistry } from './document-extraction-registry.js';
export { DocumentExtractionService } from './document-extraction-service.js';
export type { Layer1Repository } from './document-extraction-service.js';
export { MarkItDownProvider } from './providers/markitdown-provider.js';
export type {
  DocumentExtractionProvider,
  ExtractionInput,
  ExtractionResult,
  ExtractionMetadata,
  ExtractionWarning,
  ExtractionProviderName,
  SupportedDocumentType,
} from './document-extraction-provider.js';
