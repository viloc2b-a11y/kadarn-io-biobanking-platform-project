// ==========================================================================
// Kadarn Document Intake Engine — Provenance Types
// ==========================================================================
// Sprint 26F.
//
// Full document provenance: every artifact produced by the intake pipeline
// is linked to its source through an immutable chain of transformations.
//
// Chain: Original Document → NormalizedDocument → Classification →
//        DocumentSection → ExtractedEntity/Relationship/Claim/Capability/Asset
// ==========================================================================

// --------------------------------------------------------------------------
// Transformation steps
// --------------------------------------------------------------------------

/** The pipeline step that produced a provenance link. */
export type ProvenanceStep =
  | 'intake'           // DocumentArtifact → NormalizedDocument
  | 'classification'   // NormalizedDocument → DocumentClassification
  | 'segmentation'     // NormalizedDocument → DocumentSection[]
  | 'entity-extraction'     // DocumentSection → ExtractedEntity
  | 'relationship-extraction' // DocumentSection → ExtractedRelationship
  | 'claim-extraction'      // DocumentSection → ClaimCandidate
  | 'capability-extraction' // DocumentSection → CapabilityCandidate
  | 'asset-extraction'      // DocumentSection → ResearchAssetCandidate

// --------------------------------------------------------------------------
// Provenance link
// --------------------------------------------------------------------------

/**
 * A single directed edge in the provenance graph.
 *
 * Links a source artifact to a derived target artifact through a specific
 * pipeline transformation step.
 */
export interface ProvenanceLink {
  /** Unique link id */
  id: string
  /** The pipeline step that produced this link */
  step: ProvenanceStep
  /** Source artifact id (what was transformed) */
  sourceId: string
  /** Target artifact id (what was produced) */
  targetId: string
  /** ISO timestamp when the transformation happened */
  timestamp: string
  /** Which engine/program performed the transformation */
  engine: string
  /** Optional: version of the engine */
  engineVersion?: string
}

// --------------------------------------------------------------------------
// Provenance record
// --------------------------------------------------------------------------

/**
 * Complete provenance record for a document.
 *
 * All links from the original document through every pipeline step
 * to every derived artifact.
 */
export interface ProvenanceRecord {
  /** The original document artifact id */
  documentId: string
  /** ISO timestamp when the record was created */
  createdAt: string
  /** All provenance links in this record */
  links: ProvenanceLink[]
}

// --------------------------------------------------------------------------
// Trace result
// --------------------------------------------------------------------------

/**
 * Full backward trace from an artifact to the original document.
 *
 * Shows every transformation step and intermediate artifact in the chain.
 */
export interface ProvenanceTrace {
  /** The artifact being traced */
  targetId: string
  /** The original document at the root of the chain */
  documentId: string
  /** Ordered chain from original document → target artifact */
  chain: ProvenanceLink[]
  /** Whether the trace is complete (reached the document root) */
  complete: boolean
}

// --------------------------------------------------------------------------
// Forward expand result
// --------------------------------------------------------------------------

/**
 * Forward expansion from a source artifact to all derived artifacts.
 */
export interface ProvenanceForward {
  /** The source artifact being expanded */
  sourceId: string
  /** All artifacts directly derived from the source */
  derivedIds: string[]
  /** The links that produced each derived artifact */
  links: ProvenanceLink[]
}
