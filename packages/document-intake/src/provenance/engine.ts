// ==========================================================================
// Kadarn Document Intake Engine — Document Provenance Engine
// ==========================================================================
// Sprint 26F.
//
// Records and queries the full provenance chain for every artifact
// produced by the document intake pipeline.
//
// Every transformation (intake → classification → segmentation → extraction)
// is recorded as a ProvenanceLink. The engine supports:
//   - Recording links as pipeline steps execute
//   - Backward tracing: any artifact → original document
//   - Forward expansion: any source → all derived artifacts
//   - Full chain queries: document → everything
// ==========================================================================

import type {
  ProvenanceLink,
  ProvenanceRecord,
  ProvenanceStep,
  ProvenanceTrace,
  ProvenanceForward,
} from './types.js'

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

/**
 * Immutable provenance recorder and tracer.
 *
 * Usage:
 *   const engine = new DocumentProvenanceEngine()
 *   engine.recordIntake(artifact.id, normalized.artifactId)
 *   engine.recordSegmentation(normalized.artifactId, sections)
 *   const trace = engine.traceBack('artifact-1/s3')  // section → document
 */
export class DocumentProvenanceEngine {
  private readonly links: ProvenanceLink[] = []
  private linkCounter = 0

  // ==========================================================================
  // Recording
  // ==========================================================================

  /** Record: DocumentArtifact → NormalizedDocument */
  recordIntake(documentId: string, normalizedId: string): void {
    this.addLink('intake', documentId, normalizedId, 'DocumentIntakeEngine')
  }

  /** Record: NormalizedDocument → DocumentClassification */
  recordClassification(normalizedId: string, classificationId: string): void {
    this.addLink('classification', normalizedId, classificationId, 'DocumentClassificationEngine')
  }

  /** Record: NormalizedDocument → DocumentSection[] */
  recordSegmentation(normalizedId: string, sectionIds: string[]): void {
    for (const sectionId of sectionIds) {
      this.addLink('segmentation', normalizedId, sectionId, 'EvidenceSegmentationEngine')
    }
  }

  /** Record: DocumentSection → ExtractedEntity */
  recordEntityExtraction(sectionId: string, entityId: string): void {
    this.addLink('entity-extraction', sectionId, entityId, 'StructuredExtractionEngine')
  }

  /** Record: DocumentSection → ExtractedRelationship */
  recordRelationshipExtraction(sectionId: string, relationshipId: string): void {
    this.addLink('relationship-extraction', sectionId, relationshipId, 'StructuredExtractionEngine')
  }

  /** Record: DocumentSection → ClaimCandidate */
  recordClaimExtraction(sectionId: string, claimId: string): void {
    this.addLink('claim-extraction', sectionId, claimId, 'StructuredExtractionEngine')
  }

  /** Record: DocumentSection → CapabilityCandidate */
  recordCapabilityExtraction(sectionId: string, capabilityId: string): void {
    this.addLink('capability-extraction', sectionId, capabilityId, 'StructuredExtractionEngine')
  }

  /** Record: DocumentSection → ResearchAssetCandidate */
  recordAssetExtraction(sectionId: string, assetId: string): void {
    this.addLink('asset-extraction', sectionId, assetId, 'StructuredExtractionEngine')
  }

  // ==========================================================================
  // Queries
  // ==========================================================================

  /**
   * Trace backward from any artifact to the original document.
   *
   * Walks the provenance chain in reverse: targetId → ... → documentId.
   * Returns the ordered chain from document to target.
   */
  traceBack(targetId: string): ProvenanceTrace {
    const chain: ProvenanceLink[] = []
    const visited = new Set<string>()
    let current = targetId

    while (current) {
      visited.add(current)
      const link = this.links.find(l => l.targetId === current)

      if (!link) break

      chain.unshift(link) // prepend to build document → target order
      current = link.sourceId

      // Safety: prevent infinite loops
      if (visited.has(current)) break
    }

    return {
      targetId,
      documentId: chain.length > 0 ? chain[0].sourceId : targetId,
      chain,
      complete: chain.length > 0 && this.isDocumentRoot(chain[0].sourceId),
    }
  }

  /**
   * Expand forward from a source artifact to all directly derived artifacts.
   */
  expandForward(sourceId: string): ProvenanceForward {
    const derived = this.links.filter(l => l.sourceId === sourceId)

    return {
      sourceId,
      derivedIds: derived.map(l => l.targetId),
      links: [...derived],
    }
  }

  /**
   * Get all links for a document as a ProvenanceRecord.
   */
  getRecord(documentId: string): ProvenanceRecord {
    const docLinks = this.findAllLinks(documentId)

    return {
      documentId,
      createdAt: new Date().toISOString(),
      links: docLinks,
    }
  }

  /**
   * Check if a target is directly traceable to a source document.
   */
  belongsTo(targetId: string, documentId: string): boolean {
    const trace = this.traceBack(targetId)
    return trace.documentId === documentId && trace.complete
  }

  /**
   * Count all links in the engine.
   */
  get linkCount(): number {
    return this.links.length
  }

  // ==========================================================================
  // Bulk recording helpers
  // ==========================================================================

  /**
   * Record all extractions from a StructuredExtraction result for one section.
   */
  recordSectionExtractions(
    sectionId: string,
    extraction: {
      entities: Array<{ id: string }>
      relationships: Array<{ id: string }>
      claimCandidates: Array<{ id: string }>
      capabilityCandidates: Array<{ id: string }>
      researchAssetCandidates: Array<{ id: string }>
    },
  ): void {
    for (const entity of extraction.entities) {
      this.recordEntityExtraction(sectionId, entity.id)
    }
    for (const rel of extraction.relationships) {
      this.recordRelationshipExtraction(sectionId, rel.id)
    }
    for (const claim of extraction.claimCandidates) {
      this.recordClaimExtraction(sectionId, claim.id)
    }
    for (const cap of extraction.capabilityCandidates) {
      this.recordCapabilityExtraction(sectionId, cap.id)
    }
    for (const asset of extraction.researchAssetCandidates) {
      this.recordAssetExtraction(sectionId, asset.id)
    }
  }

  // ==========================================================================
  // Internal
  // ==========================================================================

  private addLink(
    step: ProvenanceStep,
    sourceId: string,
    targetId: string,
    engine: string,
  ): void {
    this.links.push({
      id: `prov-${++this.linkCounter}`,
      step,
      sourceId,
      targetId,
      timestamp: new Date().toISOString(),
      engine,
    })
  }

  /**
   * Collect all links reachable from a document root by walking forward.
   */
  private findAllLinks(documentId: string): ProvenanceLink[] {
    const result: ProvenanceLink[] = []
    const queue = [documentId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const derived = this.links.filter(l => l.sourceId === current)
      for (const link of derived) {
        result.push(link)
        queue.push(link.targetId)
      }
    }

    return result
  }

  /**
   * Check if an id appears as a source in any intake link (is a document root).
   */
  private isDocumentRoot(id: string): boolean {
    return this.links.some(l => l.sourceId === id && l.step === 'intake')
  }
}
