// ==========================================================================
// Kadarn Evidence Lineage — Engine
// ==========================================================================
// Sprint 28A. Phase 8.
//
// Converts KDIE output into the Source → SourceVersion → Artifact →
// ExtractionRun → ExtractedFact provenance chain.
//
// Every Fact knows: its SourceVersion, its Parser, and its Offset.
// No Claim is generated directly from a document — only through Facts.
// ==========================================================================

import type {
  DocumentArtifact,
  NormalizedDocument,
  Source,
  SourceVersion,
  LineageArtifact,
  ExtractionRun,
  ExtractedFact,
  EvidenceLineage,
  LineageResult,
  FactType,
} from './types.js'

// ==========================================================================
// Engine
// ==========================================================================

export class EvidenceLineageEngine {
  private sourceVersionCounter = 0
  private extractionRunCounter = 0
  private factCounter = 0

  /**
   * Build the complete evidence lineage chain from a KDIE-normalized document
   * and its extraction results.
   */
  buildLineage(
    documentArtifact: DocumentArtifact,
    normalized: NormalizedDocument,
    extraction: {
      entities: Array<{ id: string; name: string; type: string; mentions: Array<{ line: number; rule: string }>; sectionId: string }>
      relationships: Array<{ id: string; type: string; line: number; sectionId: string }>
      claims: Array<{ id: string; statement: string; type: string; line: number; sectionId: string }>
      capabilities: Array<{ id: string; name: string; category: string; line: number; sectionId: string }>
      assets: Array<{ id: string; name: string; type: string; line: number; sectionId: string }>
    },
  ): LineageResult {
    // ── 1. Source ──
    const source: Source = {
      sourceId: `src:${documentArtifact.id}`,
      providerId: documentArtifact.source.providerId ?? 'upload',
      sourceType: documentArtifact.source.kind as Source['sourceType'],
      externalId: documentArtifact.source.externalId,
      sourceUrl: documentArtifact.source.sourceUrl,
      acquiredAt: documentArtifact.source.acquiredAt,
      metadata: documentArtifact.source.metadata,
    }

    // ── 2. SourceVersion ──
    this.sourceVersionCounter++
    const sourceVersion: SourceVersion = {
      sourceVersionId: `sv:${documentArtifact.id}:v${this.sourceVersionCounter}`,
      sourceId: source.sourceId,
      version: this.sourceVersionCounter,
      snapshot: {
        filename: documentArtifact.filename,
        mimeType: documentArtifact.mimeType,
        sizeBytes: documentArtifact.sizeBytes,
        sha256: documentArtifact.sha256,
      },
      connectorVersion: normalized.metadata.providerVersion,
      ingestedAt: normalized.metadata.startedAt,
    }

    // ── 3. Artifact ──
    const artifact: LineageArtifact = {
      artifactId: documentArtifact.id,
      sourceVersionId: sourceVersion.sourceVersionId,
      documentArtifact,
      normalizedDocument: normalized,
      registeredAt: documentArtifact.registeredAt,
    }

    // ── 4. ExtractionRun ──
    this.extractionRunCounter++
    const extractionRun: ExtractionRun = {
      extractionRunId: `er:${documentArtifact.id}:r${this.extractionRunCounter}`,
      artifactId: artifact.artifactId,
      parserName: normalized.metadata.provider,
      parserVersion: normalized.metadata.providerVersion,
      startedAt: normalized.metadata.startedAt,
      completedAt: normalized.metadata.completedAt,
      processingTimeMs: normalized.metadata.processingTimeMs,
      warnings: normalized.metadata.warnings.map(w => ({ code: w.code, message: w.message })),
    }

    // ── 5. Facts ──
    const facts = this.extractFacts(extractionRun.extractionRunId, extraction)

    // ── 6. Lineage ──
    const lineage: EvidenceLineage = {
      source,
      sourceVersion,
      artifact,
      extractionRun,
      facts,
      chainId: `chain:${documentArtifact.id}`,
      createdAt: new Date().toISOString(),
    }

    return {
      lineage,
      facts,
      complete: this.verifyCompleteness(facts, extractionRun),
    }
  }

  // --------------------------------------------------------------------------
  // Fact extraction
  // --------------------------------------------------------------------------

  private extractFacts(
    extractionRunId: string,
    extraction: LineageResult extends never ? never : Parameters<EvidenceLineageEngine['buildLineage']>[2],
  ): ExtractedFact[] {
    const facts: ExtractedFact[] = []

    // Entities → Facts
    for (const e of extraction.entities) {
      facts.push({
        factId: this.nextFactId(),
        extractionRunId,
        factType: 'entity',
        content: { id: e.id, name: e.name, type: e.type, sectionId: e.sectionId },
        offset: { startLine: e.mentions[0]?.line ?? 0, endLine: e.mentions[0]?.line ?? 0, order: facts.length },
        extractedAt: new Date().toISOString(),
      })
    }

    // Relationships → Facts
    for (const r of extraction.relationships) {
      facts.push({
        factId: this.nextFactId(),
        extractionRunId,
        factType: 'relationship',
        content: { id: r.id, type: r.type, sectionId: r.sectionId },
        offset: { startLine: r.line, endLine: r.line, order: facts.length },
        extractedAt: new Date().toISOString(),
      })
    }

    // Claims → Facts (these are Claim Candidates at this stage)
    for (const c of extraction.claims) {
      facts.push({
        factId: this.nextFactId(),
        extractionRunId,
        factType: 'claim',
        content: { id: c.id, statement: c.statement, type: c.type, sectionId: c.sectionId },
        offset: { startLine: c.line, endLine: c.line, order: facts.length },
        extractedAt: new Date().toISOString(),
      })
    }

    // Capabilities → Facts
    for (const c of extraction.capabilities) {
      facts.push({
        factId: this.nextFactId(),
        extractionRunId,
        factType: 'capability',
        content: { id: c.id, name: c.name, category: c.category, sectionId: c.sectionId },
        offset: { startLine: c.line, endLine: c.line, order: facts.length },
        extractedAt: new Date().toISOString(),
      })
    }

    // Assets → Facts
    for (const a of extraction.assets) {
      facts.push({
        factId: this.nextFactId(),
        extractionRunId,
        factType: 'asset',
        content: { id: a.id, name: a.name, type: a.type, sectionId: a.sectionId },
        offset: { startLine: a.line, endLine: a.line, order: facts.length },
        extractedAt: new Date().toISOString(),
      })
    }

    return facts
  }

  // --------------------------------------------------------------------------
  // Verification
  // --------------------------------------------------------------------------

  private verifyCompleteness(facts: ExtractedFact[], run: ExtractionRun): boolean {
    // Every fact must know its source version (via extractionRun), parser, and offset
    for (const fact of facts) {
      if (!fact.extractionRunId || fact.extractionRunId !== run.extractionRunId) return false
      if (fact.offset.startLine === 0 && fact.offset.endLine === 0) continue // preamble or root — acceptable
      if (!fact.offset.startLine) return false
    }
    return true
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private nextFactId(): string {
    return `fact:${++this.factCounter}`
  }
}
