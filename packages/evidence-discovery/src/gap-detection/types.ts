// ==========================================================================
// Evidence Gap Detection — Domain Types
// ==========================================================================
// Sprint 20B.4.
//
// Identifies what evidence is missing to fully support a Candidate Claim.
// Answers: what exists, what's missing, what would strengthen the claim,
// what external confirmations would be ideal.
// No Evidence Core modification. No fictitious evidence generation.
// Every gap is explainable.
// ==========================================================================

export type GapSeverity = 'critical' | 'significant' | 'moderate' | 'minor';

export type GapCategory =
  | 'missing_entity_type'
  | 'missing_document_type'
  | 'missing_relationship_type'
  | 'missing_event_category'
  | 'missing_external_confirmation'
  | 'low_confidence'
  | 'insufficient_coverage';

export interface EvidenceGap {
  /** Unique gap ID */
  gapId: string;
  /** Category of missing evidence */
  category: GapCategory;
  /** Human-readable description */
  description: string;
  /** How severe this gap is */
  severity: GapSeverity;
  /** What specific item is missing (entity type, doc type, etc.) */
  missingItem: string;
  /** Whether this gap can be filled by uploading additional documents */
  fillableByUpload: boolean;
}

export interface RecommendedEvidence {
  /** Unique recommendation ID */
  recommendationId: string;
  /** Type of evidence that would help */
  evidenceType: 'document_upload' | 'external_confirmation' | 'relationship_verification' | 'timeline_event';
  /** Description of what's needed */
  description: string;
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Why this would strengthen the claim */
  rationale: string;
}

export interface GapAnalysisResult {
  /** The claim this analysis applies to */
  claimId: string;
  /** Source capability that generated the claim */
  sourceCapabilityId: string;

  /** Overall coverage percentage (0–100) */
  coveragePercent: number;

  /** What evidence currently exists */
  existingEvidence: {
    entityTypes: string[];
    documentTypes: string[];
    relationshipTypes: string[];
    eventCategories: string[];
  };

  /** Gaps identified */
  gaps: EvidenceGap[];

  /** Recommended evidence to fill gaps */
  recommendedEvidence: RecommendedEvidence[];

  /** Count of gaps by severity */
  severityCounts: {
    critical: number;
    significant: number;
    moderate: number;
    minor: number;
  };

  /** Full human-readable explanation */
  humanExplanation: string;
}

export interface GapAnalysisReport {
  /** Results per claim */
  results: GapAnalysisResult[];
  /** Total claims analyzed */
  totalClaims: number;
  /** Average coverage across all claims */
  averageCoverage: number;
  /** Total gaps across all claims */
  totalGaps: number;
  /** When this was generated */
  generatedAt: string;
}
