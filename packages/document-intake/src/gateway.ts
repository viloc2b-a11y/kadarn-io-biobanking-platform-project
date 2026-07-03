// ==========================================================================
// Kadarn Document Intake Engine — Document Intake Gateway
// ==========================================================================
// Sprint 27A.
//
// Canonical single entry point for all document intake in Kadarn.
//
// After this sprint, no document enters Discovery without passing through
// this Gateway. It wraps the DocumentIntakeEngine with:
//   - Metrics / observability
//   - Structured logging
//   - Error categorization
//   - Request ID propagation
//   - Backward-compatible adapter for legacy extraction
//
// Architecture:
//   Connector Layer → ConnectorIntakeAdapter → Gateway → Engine → NormalizedDocument
// ==========================================================================

import { DocumentIntakeEngine, NoSuitableProviderError, IntakeNormalizationError } from './engine.js'
import type { DocumentArtifact, NormalizedDocument, IntakeProvider } from './contracts.js'
import {
  recordDocumentReceived,
  recordDocumentNormalized,
  recordDocumentFailed,
  recordProviderTimeout,
  recordProviderFallback,
  getIntakeMetrics,
} from './metrics.js'

// ---------------------------------------------------------------------------
// Gateway result — enriched NormalizedDocument with provenance
// ---------------------------------------------------------------------------

export interface IntakeGatewayResult {
  /** The normalized document */
  document: NormalizedDocument
  /** The provider that performed normalization */
  provider: string
  /** Processing duration in milliseconds */
  durationMs: number
  /** Whether a fallback provider was used */
  usedFallback: boolean
  /** Gateway request ID for traceability */
  gatewayRequestId: string
}

// ---------------------------------------------------------------------------
// Gateway error types
// ---------------------------------------------------------------------------

export class IntakeGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly artifactId: string,
    public readonly gatewayRequestId: string,
  ) {
    super(message)
    this.name = 'IntakeGatewayError'
  }
}

// ---------------------------------------------------------------------------
// Gateway configuration
// ---------------------------------------------------------------------------

export interface GatewayConfig {
  /** Default timeout for intake operations (ms) */
  timeoutMs?: number
  /** Whether to enable fallback providers */
  enableFallback?: boolean
  /** Custom request ID prefix */
  requestIdPrefix?: string
}

const DEFAULT_CONFIG: Required<GatewayConfig> = {
  timeoutMs: 120_000, // 2 minutes
  enableFallback: true,
  requestIdPrefix: 'kdie',
}

// ---------------------------------------------------------------------------
// DocumentIntakeGateway
// ---------------------------------------------------------------------------

/**
 * Canonical entry point for all Kadarn document intake.
 *
 * Usage:
 *   const gateway = new DocumentIntakeGateway({ providers: [markitdown] })
 *   const result = await gateway.intake(artifact)
 *   // result.document → NormalizedDocument
 *   // result.provider → 'markitdown'
 */
export class DocumentIntakeGateway {
  private readonly engine: DocumentIntakeEngine
  private readonly config: Required<GatewayConfig>
  private requestCounter = 0

  constructor(
    providers: IntakeProvider[],
    config: GatewayConfig = {},
  ) {
    this.engine = new DocumentIntakeEngine(providers)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Intake a document artifact through the canonical pipeline.
   *
   * This is the ONLY method that should be called to normalize documents.
   * All other paths are deprecated.
   */
  async intake(artifact: DocumentArtifact): Promise<IntakeGatewayResult> {
    const gatewayRequestId = this.nextRequestId()
    const startedAt = Date.now()

    // Metrics: document received
    recordDocumentReceived()

    try {
      const normalized = await this.engine.intake(artifact)
      const durationMs = Date.now() - startedAt
      const provider = normalized.metadata.provider

      // Metrics: success
      recordDocumentNormalized(provider, durationMs)

      return {
        document: normalized,
        provider,
        durationMs,
        usedFallback: this.hasFallbackWarnings(normalized),
        gatewayRequestId,
      }
    } catch (error) {
      const durationMs = Date.now() - startedAt

      // Categorize and record the error
      if (error instanceof IntakeNormalizationError) {
        recordDocumentFailed(error.providerName)

        // Detect timeout vs other failures
        if (this.isTimeout(error)) {
          recordProviderTimeout(error.providerName)
          throw new IntakeGatewayError(
            `Provider ${error.providerName} timed out processing ${artifact.id}`,
            'PROVIDER_TIMEOUT',
            artifact.id,
            gatewayRequestId,
          )
        }
      }

      if (error instanceof NoSuitableProviderError) {
        throw new IntakeGatewayError(
          error.message,
          'NO_SUITABLE_PROVIDER',
          artifact.id,
          gatewayRequestId,
        )
      }

      // Unknown error
      const message = error instanceof Error ? error.message : 'Unknown intake error'
      throw new IntakeGatewayError(message, 'INTAKE_FAILED', artifact.id, gatewayRequestId)
    }
  }

  /**
   * Register an additional provider at runtime.
   */
  registerProvider(provider: IntakeProvider): void {
    this.engine.register(provider)
  }

  /**
   * Get current intake metrics snapshot.
   * Safe for health endpoint exposure.
   */
  getMetrics() {
    return getIntakeMetrics()
  }

  // --------------------------------------------------------------------------
  // Backward compatibility — adapter for legacy extraction
  // --------------------------------------------------------------------------

  /**
   * Adapter: legacy ExtractionInput → NormalizedDocument.
   *
   * While the old `packages/evidence-discovery/src/extraction/` still exists,
   * this adapter converts its ExtractionInput shape to a DocumentArtifact
   * and routes it through KDIE.
   *
   * Usage (in legacy code):
   *   const result = await gateway.intakeFromLegacyInput(extractionInput)
   */
  async intakeFromLegacyInput(input: {
    artifactId: string
    filePath: string
    filename: string
    mimeType: string
    sizeBytes: number
    sha256: string
  }): Promise<IntakeGatewayResult> {
    const artifact: DocumentArtifact = {
      id: input.artifactId,
      filename: input.filename,
      format: this.detectFormatFromMime(input.mimeType),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256: input.sha256,
      filePath: input.filePath,
      source: {
        kind: 'internal',
        acquiredAt: new Date().toISOString(),
      },
      registeredAt: new Date().toISOString(),
    }

    return this.intake(artifact)
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private nextRequestId(): string {
    return `${this.config.requestIdPrefix}-${Date.now()}-${++this.requestCounter}`
  }

  private hasFallbackWarnings(doc: NormalizedDocument): boolean {
    return doc.metadata.warnings.some(w => w.code === 'FALLBACK_PYTHON_MODULE' || w.code === 'FALLBACK_MOCK')
  }

  private isTimeout(error: unknown): boolean {
    return error instanceof Error &&
      (error.message.includes('timed out') || error.message.includes('TIMEOUT'))
  }

  private detectFormatFromMime(mimeType: string): DocumentArtifact['format'] {
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('docx') || mimeType.includes('wordprocessingml')) return 'docx'
    if (mimeType.includes('spreadsheetml') || mimeType.includes('xlsx')) return 'xlsx'
    if (mimeType.includes('presentationml') || mimeType.includes('pptx')) return 'pptx'
    if (mimeType.includes('html')) return 'html'
    if (mimeType.includes('csv')) return 'csv'
    if (mimeType.includes('json')) return 'json'
    if (mimeType.includes('xml')) return 'xml'
    if (mimeType.includes('epub')) return 'epub'
    if (mimeType.includes('zip')) return 'zip'
    return 'txt'
  }
}
