// ==========================================================================
// Kadarn Document Intake Engine — Contracts
// ==========================================================================
// Sprint 26A — Foundation.
//
// KDIE is the architectural layer that normalizes raw documents into
// structured markdown + metadata BEFORE they enter the Discovery Pipeline.
//
// Boundaries:
//   - NEVER creates Evidence Candidates.
//   - NEVER creates Claims.
//   - NEVER calls AI agents.
//   - NEVER writes to Evidence Core.
//   - Is PURE infrastructure — domain-agnostic.
// ==========================================================================

// --------------------------------------------------------------------------
// DocumentSource — Where the document originated
// --------------------------------------------------------------------------

/** Identifies the origin system that provided the document. */
export type DocumentSourceKind =
  | 'connector'   // Fetched from an external data provider (PubMed, CT.gov, etc.)
  | 'upload'      // Direct user upload
  | 'api'         // Programmatic API submission
  | 'internal'    // Generated internally by Kadarn

/** Describes the provenance of a document before intake. */
export interface DocumentSource {
  /** Origin kind */
  kind: DocumentSourceKind

  /** Connector provider id when kind === 'connector' */
  providerId?: string

  /** External identifier in the source system */
  externalId?: string

  /** URL where the document was retrieved from */
  sourceUrl?: string

  /** ISO timestamp when the document was acquired */
  acquiredAt: string

  /** Arbitrary source-specific metadata */
  metadata?: Record<string, unknown>
}

// --------------------------------------------------------------------------
// DocumentArtifact — The raw document entering the intake pipeline
// --------------------------------------------------------------------------

/** Supported document formats for intake. */
export type IntakeDocumentFormat = 'pdf' | 'docx' | 'zip' | 'html' | 'txt'

/** MIME type to IntakeDocumentFormat mapping helper. */
export const MIME_TO_FORMAT: Record<string, IntakeDocumentFormat> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'text/html': 'html',
  'text/plain': 'txt',
}

/**
 * A raw document that enters the Kadarn Document Intake Engine.
 *
 * KDIE accepts this artifact and produces a NormalizedDocument.
 */
export interface DocumentArtifact {
  /** Unique identifier for this artifact within Kadarn */
  id: string

  /** Original filename (including extension) */
  filename: string

  /** Detected format — derived from MIME type */
  format: IntakeDocumentFormat

  /** MIME type as reported by the source */
  mimeType: string

  /** File size in bytes */
  sizeBytes: number

  /** SHA-256 hash of the raw content */
  sha256: string

  /** Absolute path to the file on disk */
  filePath: string

  /** Where this document came from */
  source: DocumentSource

  /** ISO timestamp when the artifact was registered */
  registeredAt: string
}

// --------------------------------------------------------------------------
// NormalizedDocument — The output of the intake pipeline
// --------------------------------------------------------------------------

/** Warning emitted during normalization. */
export interface IntakeWarning {
  code: string
  message: string
}

/** Metadata about the normalization process. */
export interface IntakeMetadata {
  /** Provider that performed the normalization */
  provider: IntakeProviderName
  /** Provider version identifier */
  providerVersion: string
  /** ISO timestamp when normalization started */
  startedAt: string
  /** ISO timestamp when normalization completed */
  completedAt: string
  /** Total processing time in milliseconds */
  processingTimeMs: number
  /** Detected page count (when available) */
  pages?: number
  /** Detected table count (when available) */
  tablesDetected?: number
  /** Detected image count (when available) */
  imagesDetected?: number
  /** Whether OCR was used */
  ocrUsed?: boolean
  /** Detected primary language code */
  language?: string
  /** Non-fatal warnings */
  warnings: IntakeWarning[]
}

/**
 * The normalized output of a document after intake processing.
 *
 * This is what feeds into the Discovery Pipeline.
 */
export interface NormalizedDocument {
  /** The artifact id this normalization is for */
  artifactId: string
  /** The markdown content extracted from the document */
  markdown: string
  /** Metadata about the normalization process */
  metadata: IntakeMetadata
  /** SHA-256 of the source artifact (for traceability) */
  sourceHash: string
  /** ISO timestamp when normalization was produced */
  normalizedAt: string
}

// --------------------------------------------------------------------------
// IntakeProvider — The adapter interface for normalization backends
// --------------------------------------------------------------------------

/** Known intake provider implementations. */
export type IntakeProviderName =
  | 'markitdown'
  | 'azure-document-intelligence'
  | 'unstructured'
  | 'ocr'

/**
 * Interface that every document normalization backend must implement.
 *
 * This is the KDIE-native contract — independent from evidence-discovery.
 * Sprint 26A defines the interface; concrete adapters come in later sprints.
 */
export interface IntakeProvider {
  /** Unique provider name */
  readonly name: IntakeProviderName

  /** Whether this provider can handle the given artifact */
  supports(artifact: DocumentArtifact): boolean

  /** Normalize a raw document artifact into a NormalizedDocument */
  normalize(artifact: DocumentArtifact): Promise<NormalizedDocument>
}
