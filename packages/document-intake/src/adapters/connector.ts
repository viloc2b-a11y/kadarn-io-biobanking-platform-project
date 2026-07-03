// ==========================================================================
// Kadarn Document Intake Engine — Connector Layer Adapter
// ==========================================================================
// Sprint 26A — Foundation.
//
// Bridges the Connector Layer (evidence-discovery/src/connectors) with KDIE.
// When a connector fetches a document from an external provider (PubMed,
// ClinicalTrials.gov, etc.), this adapter transforms the connector response
// into a DocumentArtifact ready for intake.
//
// This adapter does NOT depend on evidence-discovery types directly.
// It defines its own minimal connector contract so KDIE stays decoupled.
// ==========================================================================

import type { DocumentArtifact, DocumentSource, DocumentSourceKind } from '../contracts.js'

// --------------------------------------------------------------------------
// Connector contract (KDIE's own — decoupled from evidence-discovery)
// --------------------------------------------------------------------------

/** Minimal connector metadata that KDIE needs. */
export interface ConnectorProviderInfo {
  providerId: string
  version: string
}

/** Minimal connector fetch result that KDIE needs. */
export interface ConnectorFetchResult {
  externalId: string
  sourceUrl?: string
  filename: string
  mimeType: string
  content: Buffer
  metadata?: Record<string, unknown>
}

// --------------------------------------------------------------------------
// Adapter
// --------------------------------------------------------------------------

/**
 * Transforms connector output into KDIE intake artifacts.
 *
 * Usage:
 *   const adapter = new ConnectorIntakeAdapter()
 *   const artifact = adapter.toArtifact(fetchResult, providerInfo)
 *   const normalized = await engine.intake(artifact)
 */
export class ConnectorIntakeAdapter {
  /**
   * Convert a connector fetch result into a DocumentArtifact.
   *
   * IMPORTANT: This does NOT write to disk. The caller is responsible for
   * writing content to a file and providing the filePath.
   */
  toArtifact(
    result: ConnectorFetchResult,
    provider: ConnectorProviderInfo,
    filePath: string,
    sha256: string,
  ): DocumentArtifact {
    const source: DocumentSource = {
      kind: 'connector' as DocumentSourceKind,
      providerId: provider.providerId,
      externalId: result.externalId,
      sourceUrl: result.sourceUrl,
      acquiredAt: new Date().toISOString(),
      metadata: result.metadata,
    }

    const format = this.detectFormat(result.mimeType)

    return {
      id: `artifact-${provider.providerId}-${result.externalId}`,
      filename: result.filename,
      format,
      mimeType: result.mimeType,
      sizeBytes: result.content.length,
      sha256,
      filePath,
      source,
      registeredAt: new Date().toISOString(),
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private detectFormat(mimeType: string): DocumentArtifact['format'] {
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('docx') || mimeType.includes('wordprocessingml')) return 'docx'
    if (mimeType.includes('zip')) return 'zip'
    if (mimeType.includes('html')) return 'html'
    return 'txt'
  }
}
