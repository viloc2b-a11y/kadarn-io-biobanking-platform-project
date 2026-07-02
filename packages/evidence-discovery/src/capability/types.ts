// ==========================================================================
// Capability Detection — Domain Types
// ==========================================================================
// Sprint 20B.2.
//
// Candidate capabilities detected from Discovery outputs.
// No Claims. No Evidence Core modification. No promotion.
// Every capability is explainable and traceable.
// ==========================================================================

export type CapabilityCategory =
  | 'processing'
  | 'storage'
  | 'shipping'
  | 'regulatory'
  | 'operations'
  | 'therapeutic_area'
  | 'special';

export type CapabilityStatus = 'detected' | 'suspected' | 'insufficient_evidence';

export interface CandidateCapability {
  capabilityId: string;
  /** Claim Taxonomy ID this maps to (e.g. "biospecimen.storage.freezer_minus_80c") */
  claimTypeId: string;
  /** Human-readable name */
  name: string;
  /** Category */
  category: CapabilityCategory;
  /** How confident we are */
  status: CapabilityStatus;
  /** Numeric confidence (0–1) */
  confidence: number;
  /** Entity IDs that support this capability */
  supportingEntityIds: string[];
  /** Relationship IDs that support this */
  supportingRelationshipIds: string[];
  /** Document/artifact IDs that support this */
  supportingArtifactIds: string[];
  /** Timeline event IDs that support this */
  supportingEventIds: string[];
  /** Human-readable reasoning */
  reasoning: string;
}

export interface CapabilityDetectionResult {
  /** All detected capabilities */
  capabilities: CandidateCapability[];
  /** Number detected */
  totalDetected: number;
  /** Number suspected (lower confidence) */
  totalSuspected: number;
  /** When this was generated */
  generatedAt: string;
}
