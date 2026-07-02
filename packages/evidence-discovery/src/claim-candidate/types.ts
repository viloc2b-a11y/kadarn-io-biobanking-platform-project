// ==========================================================================
// Claim Candidate Detection — Domain Types
// ==========================================================================
// Sprint 20B.3.
//
// Candidate Claims derived from detected capabilities.
// No official Claims. No Evidence Core writes. No promotion.
// Every candidate is explainable and traceable.
// ==========================================================================

export interface MissingEvidenceItem {
  /** What kind of evidence is missing */
  category: 'entity_type' | 'document_type' | 'relationship_type' | 'event_type';
  /** Human-readable description */
  description: string;
  /** How critical this gap is */
  priority: 'high' | 'medium' | 'low';
}

export type ClaimStatus = 'candidate' | 'insufficient_evidence';

export interface CandidateClaim {
  /** Unique claim candidate ID */
  claimId: string;
  /** Source capability that generated this claim */
  sourceCapabilityId: string;
  /** Suggested taxonomy path for this claim */
  suggestedTaxonomy: string;
  /** Human-readable summary */
  summary: string;
  /** Supporting evidence references */
  supportingEvidence: {
    entityIds: string[];
    relationshipIds: string[];
    artifactIds: string[];
    eventIds: string[];
  };
  /** Blended confidence score (0–1) */
  confidence: number;
  /** What evidence is still missing to promote this claim */
  missingEvidence: MissingEvidenceItem[];
  /** Ratio of present vs. required evidence (0–1) */
  evidenceCoverage: number;
  /** Full human-readable explanation */
  humanExplanation: string;
}

export interface ClaimCandidateDetectionResult {
  /** All claim candidates */
  candidates: CandidateClaim[];
  /** How many reached 'candidate' status */
  totalCandidates: number;
  /** How many remain 'insufficient_evidence' */
  insufficientCount: number;
  /** When this was generated */
  generatedAt: string;
}
