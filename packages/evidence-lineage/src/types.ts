// ==========================================================================
// Kadarn Evidence Lineage — Types
// ==========================================================================
// Sprint 28A. Phase 8.
//
// Separates document origin from semantic origin.
// Source → SourceVersion → Artifact → ExtractionRun → ExtractedFact.
//
// Types are self-contained (no dependency on @kadarn/document-intake)
// to keep the lineage package independently testable.
// ==========================================================================

// --------------------------------------------------------------------------
// Minimal document artifact (mirrors @kadarn/document-intake contracts)
// --------------------------------------------------------------------------

export interface DocumentArtifact {
  id: string
  filename: string
  format: string
  mimeType: string
  sizeBytes: number
  sha256: string
  filePath: string
  source: { kind: string; providerId?: string; externalId?: string; sourceUrl?: string; acquiredAt: string; metadata?: Record<string, unknown> }
  registeredAt: string
}

export interface NormalizedDocument {
  artifactId: string
  markdown: string
  metadata: {
    provider: string
    providerVersion: string
    startedAt: string
    completedAt: string
    processingTimeMs: number
    warnings: Array<{ code: string; message: string }>
  }
  sourceHash: string
  normalizedAt: string
}

// --------------------------------------------------------------------------
// Source
// --------------------------------------------------------------------------

export interface Source {
  sourceId: string
  providerId: string
  sourceType: 'connector' | 'upload' | 'api' | 'internal'
  externalId?: string
  sourceUrl?: string
  acquiredAt: string
  metadata?: Record<string, unknown>
}

// --------------------------------------------------------------------------
// SourceVersion
// --------------------------------------------------------------------------

export interface SourceVersion {
  sourceVersionId: string
  sourceId: string
  version: number
  snapshot: Record<string, unknown>
  connectorVersion: string
  ingestedAt: string
}

// --------------------------------------------------------------------------
// Artifact (wraps KDIE DocumentArtifact with lineage context)
// --------------------------------------------------------------------------

export interface LineageArtifact {
  artifactId: string
  sourceVersionId: string
  documentArtifact: DocumentArtifact
  normalizedDocument: NormalizedDocument
  registeredAt: string
}

// --------------------------------------------------------------------------
// ExtractionRun
// --------------------------------------------------------------------------

export interface ExtractionRun {
  extractionRunId: string
  artifactId: string
  parserName: string
  parserVersion: string
  modelName?: string
  modelVersion?: string
  startedAt: string
  completedAt: string
  processingTimeMs: number
  warnings: ExtractionRunWarning[]
}

export interface ExtractionRunWarning {
  code: string
  message: string
}

// --------------------------------------------------------------------------
// ExtractedFact
// --------------------------------------------------------------------------

export type FactType = 'entity' | 'relationship' | 'claim' | 'capability' | 'asset' | 'biomarker' | 'identifier'

export interface ExtractedFact {
  factId: string
  extractionRunId: string
  factType: FactType
  content: Record<string, unknown>
  offset: { startLine: number; endLine: number; order: number }
  extractedAt: string
}

// --------------------------------------------------------------------------
// Lineage chain
// --------------------------------------------------------------------------

export interface EvidenceLineage {
  source: Source
  sourceVersion: SourceVersion
  artifact: LineageArtifact
  extractionRun: ExtractionRun
  facts: ExtractedFact[]
  chainId: string
  createdAt: string
}

// --------------------------------------------------------------------------
// Engine output
// --------------------------------------------------------------------------

export interface LineageResult {
  lineage: EvidenceLineage
  /** All facts extracted from this artifact */
  facts: ExtractedFact[]
  /** Whether every fact knows its SourceVersion, Parser, and Offset */
  complete: boolean
}
