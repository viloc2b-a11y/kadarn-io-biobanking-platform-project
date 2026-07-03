// ==========================================================================
// Kadarn Document Intake Engine — Pipeline Types
// ==========================================================================
// Sprint 27D.
//
// Types for the Document Intelligence Pipeline orchestrator,
// failure orchestration, review queue, and audit events.
// ==========================================================================

import type { NormalizedDocument, DocumentArtifact } from '../contracts.js'
import type { DocumentClassification } from '../classification/types.js'
import type { DocumentSection } from '../segmentation/types.js'
import type {
  ExtractedEntity,
  ExtractedRelationship,
  ClaimCandidate,
  CapabilityCandidate,
  ResearchAssetCandidate,
} from '../extraction/types.js'

// --------------------------------------------------------------------------
// Pipeline result
// --------------------------------------------------------------------------

export interface DocumentPipelineResult {
  /** The original artifact */
  artifact: DocumentArtifact
  /** The normalized document */
  normalizedDocument: NormalizedDocument
  /** Classification result */
  classification: DocumentClassification
  /** Extracted sections */
  sections: DocumentSection[]
  /** Extracted entities */
  entities: ExtractedEntity[]
  /** Extracted relationships */
  relationships: ExtractedRelationship[]
  /** Claim candidates */
  claims: ClaimCandidate[]
  /** Capability candidates */
  capabilities: CapabilityCandidate[]
  /** Research asset candidates */
  assets: ResearchAssetCandidate[]
  /** Provenance record ID (document ID) */
  provenanceDocumentId: string
  /** Non-fatal warnings collected during processing */
  warnings: PipelineWarning[]
  /** Pipeline execution metrics */
  metrics: PipelineMetrics
}

// --------------------------------------------------------------------------
// Pipeline status — per-document processing state
// --------------------------------------------------------------------------

export type PipelineStatus =
  | 'pending'
  | 'normalizing'
  | 'classifying'
  | 'segmenting'
  | 'extracting'
  | 'complete'
  | 'failed'
  | 'degraded'
  | 'rejected'
  | 'review_required'

// --------------------------------------------------------------------------
// Failure modes — deterministic states, not errors
// --------------------------------------------------------------------------

export type FailureMode =
  | 'CLI_NOT_INSTALLED'
  | 'TIMEOUT'
  | 'NON_ZERO_EXIT'
  | 'UNSUPPORTED_FORMAT'
  | 'EMPTY_OUTPUT'
  | 'HASH_MISMATCH'

export interface FailureEvent {
  /** The failure mode */
  mode: FailureMode
  /** Human-readable description */
  message: string
  /** The pipeline stage where it occurred */
  stage: PipelineStatus
  /** Whether the document can continue processing */
  recoverable: boolean
  /** ISO timestamp */
  occurredAt: string
  /** Additional details (exit code, stderr, etc.) */
  details?: Record<string, unknown>
}

// --------------------------------------------------------------------------
// Pipeline warnings (non-fatal)
// --------------------------------------------------------------------------

export interface PipelineWarning {
  code: string
  message: string
  stage: PipelineStatus
  occurredAt: string
}

// --------------------------------------------------------------------------
// Review queue
// --------------------------------------------------------------------------

export type ReviewReason =
  | 'EMPTY_OUTPUT'
  | 'EXECUTION_ERROR'
  | 'HASH_MISMATCH'

export interface ReviewQueueEntry {
  /** Unique review ID */
  reviewId: string
  /** The artifact that needs review */
  artifactId: string
  /** Why it was queued */
  reason: ReviewReason
  /** What stage produced the issue */
  stage: PipelineStatus
  /** Any partial results available */
  partialResult: Partial<DocumentPipelineResult> | null
  /** ISO timestamp when queued */
  queuedAt: string
  /** Current review status */
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed'
}

// --------------------------------------------------------------------------
// Audit events
// --------------------------------------------------------------------------

export type AuditEventType =
  | 'PIPELINE_START'
  | 'NORMALIZATION_COMPLETE'
  | 'CLASSIFICATION_COMPLETE'
  | 'SEGMENTATION_COMPLETE'
  | 'EXTRACTION_COMPLETE'
  | 'DISCOVERY_READY'
  | 'FAILURE_OCCURRED'
  | 'DOCUMENT_REJECTED'
  | 'REVIEW_QUEUED'

export interface AuditEvent {
  /** Unique event ID */
  eventId: string
  /** Event type */
  type: AuditEventType
  /** Document artifact ID */
  artifactId: string
  /** Pipeline stage */
  stage: PipelineStatus
  /** ISO timestamp */
  timestamp: string
  /** Additional event data */
  data?: Record<string, unknown>
}

// --------------------------------------------------------------------------
// Pipeline metrics
// --------------------------------------------------------------------------

export interface PipelineMetrics {
  /** Total documents processed */
  documents_processed: number
  /** Documents that failed irrecoverably */
  documents_failed: number
  /** Documents sent to review queue */
  documents_review: number
  /** Documents rejected (unsupported format) */
  documents_rejected: number
  /** Documents that timed out */
  documents_timeout: number
  /** Documents that required retry */
  documents_retry: number
  /** Documents with non-fatal warnings */
  documents_warning: number
  /** Total pipeline duration (all documents) */
  pipeline_duration_ms_total: number
  /** Normalization duration */
  normalization_duration_ms_total: number
  /** Classification duration */
  classification_duration_ms_total: number
  /** Segmentation duration */
  segmentation_duration_ms_total: number
  /** Extraction duration */
  extraction_duration_ms_total: number
  /** Provider processing time */
  provider_duration_ms_total: number
}

// --------------------------------------------------------------------------
// Pipeline configuration
// --------------------------------------------------------------------------

export interface PipelineConfig {
  /** Maximum retry attempts for timeout failures */
  maxRetries?: number
  /** Retry delay in milliseconds */
  retryDelayMs?: number
  /** Whether to auto-queue hash mismatches for review */
  queueHashMismatch?: boolean
  /** Maximum review queue size before auto-rejection */
  maxQueueSize?: number
}

export const DEFAULT_PIPELINE_CONFIG: Required<PipelineConfig> = {
  maxRetries: 1,
  retryDelayMs: 1000,
  queueHashMismatch: false, // hash mismatches are warning-only by default
  maxQueueSize: 1000,
}
