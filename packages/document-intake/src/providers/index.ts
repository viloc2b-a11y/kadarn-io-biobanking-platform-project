// ==========================================================================
// Kadarn Document Intake Engine — Providers index
// ==========================================================================
// Sprint 26A — Foundation.
// Sprint 26B — MarkItDown concrete adapter added.
//
// Future sprints:
//   - providers/azure-document-intelligence/
//   - providers/unstructured/
//   - providers/ocr/
// ==========================================================================

export type {
  IntakeProvider,
  IntakeProviderName,
} from './provider.interface.js'

export {
  MarkItDownAdapter,
  MarkItDownNotInstalledError,
  MarkItDownTimeoutError,
  MarkItDownExecutionError,
} from './markitdown/index.js'
