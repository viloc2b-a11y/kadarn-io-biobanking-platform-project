// ==========================================================================
// Kadarn Document Intake Engine — Document Intelligence Pipeline
// ==========================================================================
// Sprint 27D.
//
// Canonical orchestrator for all document processing in Kadarn.
// Coordinates: Gateway → MarkItDown → Classification → Segmentation →
//              Extraction → Provenance → Discovery Ready.
//
// Handles all failure modes deterministically. No new engines.
// ==========================================================================

import { DocumentIntakeGateway } from '../gateway.js'
import type { IntakeGatewayResult } from '../gateway.js'
import { DocumentClassificationEngine } from '../classification/engine.js'
import { EvidenceSegmentationEngine } from '../segmentation/engine.js'
import { StructuredExtractionEngine } from '../extraction/engine.js'
import { DocumentProvenanceEngine } from '../provenance/engine.js'
import type { DocumentArtifact, NormalizedDocument, IntakeProvider } from '../contracts.js'
import type {
  DocumentPipelineResult,
  PipelineStatus,
  FailureMode,
  FailureEvent,
  PipelineWarning,
  ReviewQueueEntry,
  ReviewReason,
  AuditEvent,
  AuditEventType,
  PipelineMetrics,
  PipelineConfig,
} from './types.js'
import { DEFAULT_PIPELINE_CONFIG } from './types.js'

// ==========================================================================
// Pipeline
// ==========================================================================

export class DocumentIntelligencePipeline {
  private readonly gateway: DocumentIntakeGateway
  private readonly classifier: DocumentClassificationEngine
  private readonly segmenter: EvidenceSegmentationEngine
  private readonly extractor: StructuredExtractionEngine
  private readonly provenance: DocumentProvenanceEngine
  private readonly config: Required<PipelineConfig>

  // State
  private readonly reviewQueue: ReviewQueueEntry[] = []
  private readonly auditLog: AuditEvent[] = []
  private metrics: PipelineMetrics = this.emptyMetrics()
  private auditCounter = 0
  private reviewCounter = 0

  constructor(providers: IntakeProvider[], config: PipelineConfig = {}) {
    this.gateway = new DocumentIntakeGateway(providers)
    this.classifier = new DocumentClassificationEngine()
    this.segmenter = new EvidenceSegmentationEngine()
    this.extractor = new StructuredExtractionEngine()
    this.provenance = new DocumentProvenanceEngine()
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config }
  }

  // ==========================================================================
  // Public API — process a single document through the full pipeline
  // ==========================================================================

  async process(artifact: DocumentArtifact): Promise<DocumentPipelineResult> {
    const warnings: PipelineWarning[] = []
    const pipelineStart = Date.now()

    this.audit('PIPELINE_START', artifact.id, 'pending')

    // ── Stage 1: Normalization ──
    const normResult = await this.normalize(artifact, warnings)
    if (!normResult) {
      return this.buildFailureResult(artifact, warnings)
    }

    const normalized = normResult.document

    // Propagate adapter warnings to pipeline warnings
    for (const w of normalized.metadata.warnings) {
      warnings.push({ code: w.code, message: w.message, stage: 'normalizing', occurredAt: normalized.metadata.completedAt })
      this.metrics.documents_warning++
    }

    this.audit('NORMALIZATION_COMPLETE', artifact.id, 'normalizing')

    // ── Stage 2: Classification ──
    const classificationStart = Date.now()
    const classification = this.classifier.classify(artifact, normalized)
    this.metrics.classification_duration_ms_total += Date.now() - classificationStart
    this.audit('CLASSIFICATION_COMPLETE', artifact.id, 'classifying')

    // ── Stage 3: Segmentation ──
    const segmentationStart = Date.now()
    const { sections } = this.segmenter.segment(normalized)
    this.metrics.segmentation_duration_ms_total += Date.now() - segmentationStart
    this.audit('SEGMENTATION_COMPLETE', artifact.id, 'segmenting')

    // ── Stage 4: Extraction ──
    const extractionStart = Date.now()
    const extraction = this.extractor.extract(sections)
    this.metrics.extraction_duration_ms_total += Date.now() - extractionStart
    this.audit('EXTRACTION_COMPLETE', artifact.id, 'extracting')

    // ── Stage 5: Provenance ──
    this.recordProvenance(artifact.id, normalized, sections, extraction)

    // ── Stage 6: Complete ──
    this.audit('DISCOVERY_READY', artifact.id, 'complete')
    this.metrics.documents_processed++
    this.metrics.provider_duration_ms_total += normResult.durationMs
    this.metrics.pipeline_duration_ms_total += Date.now() - pipelineStart

    return {
      artifact,
      normalizedDocument: normalized,
      classification,
      sections,
      entities: extraction.entities,
      relationships: extraction.relationships,
      claims: extraction.claimCandidates,
      capabilities: extraction.capabilityCandidates,
      assets: extraction.researchAssetCandidates,
      provenanceDocumentId: artifact.id,
      warnings,
      metrics: { ...this.metrics },
    }
  }

  // ==========================================================================
  // Failure orchestration — Stage 1: Normalization
  // ==========================================================================

  private async normalize(
    artifact: DocumentArtifact,
    warnings: PipelineWarning[],
  ): Promise<IntakeGatewayResult | null> {
    const MAX_RETRIES = this.config.maxRetries

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.gateway.intake(artifact)
        this.metrics.normalization_duration_ms_total += result.durationMs
        return result
      } catch (err: unknown) {
        const failure = this.classifyFailure(err, artifact)

        if (attempt < MAX_RETRIES && failure.mode === 'TIMEOUT') {
          // Retry on timeout
          this.metrics.documents_retry++
          this.auditFailure(artifact.id, failure)
          await this.delay(this.config.retryDelayMs)
          continue
        }

        // Irrecoverable — handle by mode
        this.auditFailure(artifact.id, failure)
        this.handleFailure(failure, artifact, warnings)
        return null // Stop pipeline for this document
      }
    }

    // Exhausted retries
    const timeoutFailure: FailureEvent = {
      mode: 'TIMEOUT',
      message: `Exhausted ${MAX_RETRIES + 1} retry attempts for ${artifact.id}`,
      stage: 'normalizing',
      recoverable: false,
      occurredAt: new Date().toISOString(),
    }
    this.auditFailure(artifact.id, timeoutFailure)
    this.handleFailure(timeoutFailure, artifact, warnings)
    return null
  }

  // ==========================================================================
  // Failure classification
  // ==========================================================================

  private classifyFailure(err: unknown, _artifact: DocumentArtifact): FailureEvent {
    const message = err instanceof Error ? err.message : String(err)
    const name = err instanceof Error ? err.name : 'Error'

    // Check IntakeGatewayError codes first (they wrap upstream errors)
    if (name === 'IntakeGatewayError') {
      const gwe = err as any
      if (gwe.code === 'PROVIDER_TIMEOUT') {
        return { mode: 'TIMEOUT', message, stage: 'normalizing', recoverable: true, occurredAt: new Date().toISOString() }
      }
      if (gwe.code === 'NO_SUITABLE_PROVIDER') {
        return { mode: 'UNSUPPORTED_FORMAT', message, stage: 'normalizing', recoverable: false, occurredAt: new Date().toISOString() }
      }
      return { mode: 'NON_ZERO_EXIT', message, stage: 'normalizing', recoverable: false, occurredAt: new Date().toISOString() }
    }

    if (name === 'MarkItDownNotInstalledError') {
      return { mode: 'CLI_NOT_INSTALLED', message, stage: 'normalizing', recoverable: false, occurredAt: new Date().toISOString() }
    }
    if (name === 'MarkItDownTimeoutError') {
      return { mode: 'TIMEOUT', message, stage: 'normalizing', recoverable: true, occurredAt: new Date().toISOString() }
    }
    if (name === 'MarkItDownExecutionError') {
      const execErr = err as any
      return {
        mode: 'NON_ZERO_EXIT',
        message,
        stage: 'normalizing',
        recoverable: false,
        occurredAt: new Date().toISOString(),
        details: { exitCode: execErr.exitCode, stderr: execErr.stderr?.slice(0, 500) },
      }
    }
    if (name === 'MarkItDownUnsupportedFormatError') {
      return { mode: 'UNSUPPORTED_FORMAT', message, stage: 'normalizing', recoverable: false, occurredAt: new Date().toISOString() }
    }

    return { mode: 'NON_ZERO_EXIT', message, stage: 'normalizing', recoverable: false, occurredAt: new Date().toISOString() }
  }

  // ==========================================================================
  // Failure handling — deterministic per mode
  // ==========================================================================

  private handleFailure(
    failure: FailureEvent,
    artifact: DocumentArtifact,
    warnings: PipelineWarning[],
  ): void {
    switch (failure.mode) {
      case 'CLI_NOT_INSTALLED':
        this.metrics.documents_failed++
        break

      case 'TIMEOUT':
        this.metrics.documents_timeout++
        this.metrics.documents_failed++
        break

      case 'NON_ZERO_EXIT':
        this.metrics.documents_failed++
        this.queueForReview(artifact.id, 'EXECUTION_ERROR', 'normalizing')
        break

      case 'UNSUPPORTED_FORMAT':
        this.metrics.documents_rejected++
        break

      case 'EMPTY_OUTPUT':
        this.queueForReview(artifact.id, 'EMPTY_OUTPUT', 'normalizing')
        break

      case 'HASH_MISMATCH':
        warnings.push({ code: 'HASH_MISMATCH', message: failure.message, stage: 'normalizing', occurredAt: failure.occurredAt })
        this.metrics.documents_warning++
        if (this.config.queueHashMismatch) {
          this.queueForReview(artifact.id, 'HASH_MISMATCH', 'normalizing')
        }
        break
    }
  }

  // ==========================================================================
  // Review queue
  // ==========================================================================

  private queueForReview(artifactId: string, reason: ReviewReason, stage: PipelineStatus): void {
    if (this.reviewQueue.length >= this.config.maxQueueSize) {
      // Queue full — auto-reject
      this.metrics.documents_rejected++
      return
    }

    const entry: ReviewQueueEntry = {
      reviewId: `review-${++this.reviewCounter}`,
      artifactId,
      reason,
      stage,
      partialResult: null,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    }

    this.reviewQueue.push(entry)
    this.metrics.documents_review++
    this.audit('REVIEW_QUEUED', artifactId, stage, { reviewId: entry.reviewId, reason })
  }

  /** Get current review queue entries. */
  getReviewQueue(): ReadonlyArray<ReviewQueueEntry> {
    return [...this.reviewQueue]
  }

  /** Resolve a review queue entry. */
  resolveReview(reviewId: string, status: 'resolved' | 'dismissed'): boolean {
    const entry = this.reviewQueue.find(e => e.reviewId === reviewId)
    if (!entry) return false
    entry.status = status
    return true
  }

  // ==========================================================================
  // Provenance
  // ==========================================================================

  private recordProvenance(
    documentId: string,
    normalized: NormalizedDocument,
    sections: Array<{ sectionId: string }>,
    extraction: {
      entities: Array<{ id: string }>
      relationships: Array<{ id: string }>
      claimCandidates: Array<{ id: string }>
      capabilityCandidates: Array<{ id: string }>
      researchAssetCandidates: Array<{ id: string }>
    },
  ): void {
    const normId = normalized.artifactId
    this.provenance.recordIntake(documentId, normId)
    this.provenance.recordSegmentation(normId, sections.map(s => s.sectionId))
    for (const s of sections) {
      this.provenance.recordSectionExtractions(s.sectionId, extraction)
    }
  }

  /** Get the provenance engine for external queries. */
  getProvenanceEngine(): DocumentProvenanceEngine {
    return this.provenance
  }

  // ==========================================================================
  // Audit
  // ==========================================================================

  private audit(type: AuditEventType, artifactId: string, stage: PipelineStatus, data?: Record<string, unknown>): void {
    this.auditLog.push({
      eventId: `audit-${++this.auditCounter}`,
      type,
      artifactId,
      stage,
      timestamp: new Date().toISOString(),
      data,
    })
  }

  private auditFailure(artifactId: string, failure: FailureEvent): void {
    this.audit('FAILURE_OCCURRED', artifactId, failure.stage, {
      mode: failure.mode,
      message: failure.message,
      recoverable: failure.recoverable,
      details: failure.details,
    })
  }

  /** Get the full audit log. */
  getAuditLog(): ReadonlyArray<AuditEvent> {
    return [...this.auditLog]
  }

  // ==========================================================================
  // Metrics
  // ==========================================================================

  getMetrics(): Readonly<PipelineMetrics> {
    return { ...this.metrics }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private buildFailureResult(artifact: DocumentArtifact, warnings: PipelineWarning[]): DocumentPipelineResult {
    return {
      artifact,
      normalizedDocument: {
        artifactId: artifact.id,
        markdown: '',
        metadata: { provider: 'markitdown' as const, providerVersion: '', startedAt: '', completedAt: '', processingTimeMs: 0, warnings: [] },
        sourceHash: artifact.sha256,
        normalizedAt: new Date().toISOString(),
      },
      classification: { artifactId: artifact.id, label: 'unknown', confidence: 0, matches: [], alternatives: [], classifiedAt: new Date().toISOString() },
      sections: [],
      entities: [],
      relationships: [],
      claims: [],
      capabilities: [],
      assets: [],
      provenanceDocumentId: artifact.id,
      warnings,
      metrics: { ...this.metrics },
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private emptyMetrics(): PipelineMetrics {
    return {
      documents_processed: 0, documents_failed: 0, documents_review: 0,
      documents_rejected: 0, documents_timeout: 0, documents_retry: 0,
      documents_warning: 0, pipeline_duration_ms_total: 0,
      normalization_duration_ms_total: 0, classification_duration_ms_total: 0,
      segmentation_duration_ms_total: 0, extraction_duration_ms_total: 0,
      provider_duration_ms_total: 0,
    }
  }
}
