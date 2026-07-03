// ==========================================================================
// Kadarn Document Intake Engine — Structured Extraction Types
// ==========================================================================
// Sprint 26E.
//
// Bridges DocumentSections with the Discovery Pipeline by producing
// structured candidate types from section content. Deterministic rule-based
// extraction — no AI, no confidence scoring, no Evidence Core writes.
// ==========================================================================

import type { DocumentSection } from '../segmentation/types.js'

// --------------------------------------------------------------------------
// Extracted Entity
// --------------------------------------------------------------------------

export type EntityType =
  | 'person'
  | 'organization'
  | 'drug'
  | 'disease'
  | 'location'
  | 'date'
  | 'identifier'
  | 'biomarker'
  | 'procedure'

export interface ExtractedEntity {
  /** Unique id: `${sectionId}/e${index}` */
  id: string
  /** The entity name/normalized value */
  name: string
  /** Entity category */
  type: EntityType
  /** The text spans where this entity was found */
  mentions: EntityMention[]
  /** The section that produced this entity */
  sectionId: string
}

export interface EntityMention {
  /** The exact text matched */
  text: string
  /** 1-based line number in the section content */
  line: number
  /** The extraction rule that produced this mention */
  rule: string
}

// --------------------------------------------------------------------------
// Extracted Relationship
// --------------------------------------------------------------------------

export type RelationshipType =
  | 'employs'
  | 'studies'
  | 'treats'
  | 'located_at'
  | 'sponsors'
  | 'collaborates_with'
  | 'measures'

export interface ExtractedRelationship {
  /** Unique id: `${sectionId}/r${index}` */
  id: string
  /** Relationship category */
  type: RelationshipType
  /** Source entity reference (entity id) */
  sourceEntityId: string
  /** Target entity reference (entity id) */
  targetEntityId: string
  /** The evidence text */
  evidence: string
  /** 1-based line number */
  line: number
  /** The section that produced this relationship */
  sectionId: string
}

// --------------------------------------------------------------------------
// Claim Candidate
// --------------------------------------------------------------------------

export type ClaimType =
  | 'efficacy'
  | 'safety'
  | 'demographic'
  | 'methodological'
  | 'regulatory'
  | 'operational'

export interface ClaimCandidate {
  /** Unique id: `${sectionId}/c${index}` */
  id: string
  /** The claim statement */
  statement: string
  /** Claim category */
  type: ClaimType
  /** 1-based line number */
  line: number
  /** The section that produced this claim */
  sectionId: string
}

// --------------------------------------------------------------------------
// Capability Candidate
// --------------------------------------------------------------------------

export type CapabilityCategory =
  | 'sample_collection'
  | 'sample_processing'
  | 'laboratory_testing'
  | 'data_management'
  | 'regulatory_support'
  | 'clinical_operations'
  | 'logistics'
  | 'imaging'
  | 'biobanking'

export interface CapabilityCandidate {
  /** Unique id: `${sectionId}/cap${index}` */
  id: string
  /** The capability name */
  name: string
  /** Capability category */
  category: CapabilityCategory
  /** Evidence from the document */
  evidence: string
  /** 1-based line number */
  line: number
  /** The section that produced this capability */
  sectionId: string
}

// --------------------------------------------------------------------------
// Research Asset Candidate
// --------------------------------------------------------------------------

export type AssetType =
  | 'biospecimen'
  | 'dataset'
  | 'cohort'
  | 'protocol'
  | 'assay'
  | 'equipment'
  | 'facility'

export interface ResearchAssetCandidate {
  /** Unique id: `${sectionId}/a${index}` */
  id: string
  /** Human-readable asset name */
  name: string
  /** Asset category */
  type: AssetType
  /** Description extracted from the document */
  description: string
  /** Quantities or counts mentioned */
  quantity?: string
  /** Evidence from the document */
  evidence: string
  /** 1-based line number */
  line: number
  /** The section that produced this asset */
  sectionId: string
}

// --------------------------------------------------------------------------
// Structured Extraction result
// --------------------------------------------------------------------------

export interface StructuredExtraction {
  /** The document artifact id */
  documentId: string
  /** Extracted entities */
  entities: ExtractedEntity[]
  /** Extracted relationships (may reference entities by id) */
  relationships: ExtractedRelationship[]
  /** Claim candidates for Discovery Pipeline */
  claimCandidates: ClaimCandidate[]
  /** Capability candidates for Discovery Pipeline */
  capabilityCandidates: CapabilityCandidate[]
  /** Research asset candidates for Discovery Pipeline */
  researchAssetCandidates: ResearchAssetCandidate[]
  /** ISO timestamp when extraction was performed */
  extractedAt: string
}

// --------------------------------------------------------------------------
// Extraction context
// --------------------------------------------------------------------------

/** Context passed to extractors for richer extraction. */
export interface ExtractionContext {
  /** The full list of sections being processed */
  sections: DocumentSection[]
  /** Document-level metadata */
  documentId: string
  /** Classification label from Sprint 26C (if available) */
  classificationLabel?: string
}
