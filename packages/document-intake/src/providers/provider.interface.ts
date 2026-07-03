// ==========================================================================
// Kadarn Document Intake Engine — Provider Interface
// ==========================================================================
// Sprint 26A — Foundation.
//
// This re-exports the IntakeProvider contract as the canonical boundary
// for all document normalization backends (MarkItDown, Azure DI, Unstructured, OCR).
//
// In Sprint 26A this is interface-only. Concrete adapters come later.
// ==========================================================================

export type {
  IntakeProvider,
  IntakeProviderName,
} from '../contracts.js'
