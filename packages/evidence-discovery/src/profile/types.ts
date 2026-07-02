// ==========================================================================
// Institutional Profile — Domain Types
// ==========================================================================
// Sprint 20B.6.
//
// Combines all Sprint 20B components into a single structured profile
// ready for human review.
// No Evidence Core promotion. Everything remains editable.
// ==========================================================================

import type { InstitutionalTimeline } from '../timeline/types.js';
import type { CapabilityDetectionResult } from '../capability/types.js';
import type { ClaimCandidateDetectionResult } from '../claim-candidate/types.js';
import type { GapAnalysisReport } from '../gap-detection/types.js';
import type { InstitutionalNarrative } from '../narrative/types.js';

export type ProfileStatus = 'draft' | 'needs_review' | 'ready';

export interface ProfileSummary {
  /** Institution display name */
  institutionName: string;
  /** Years of documented activity */
  activeYears: { start: number | null; end: number | null };
  /** Total capabilities detected */
  totalCapabilities: number;
  /** Confirmed (detected) capabilities */
  confirmedCapabilities: number;
  /** Suspected capabilities */
  suspectedCapabilities: number;
  /** Total claim candidates */
  totalClaimCandidates: number;
  /** Average evidence coverage across claims (0–100) */
  averageEvidenceCoverage: number;
  /** Total evidence gaps identified */
  totalGaps: number;
  /** Critical evidence gaps */
  criticalGaps: number;
  /** Narrative summary sentence */
  narrativeSummary: string;
  /** Overall readiness score (0–100) */
  readinessScore: number;
  /** Status */
  status: ProfileStatus;
}

export interface InstitutionalProfile {
  /** Site/institution identifier */
  siteId: string;
  /** Profile version */
  profileVersion: string;
  /** When this profile was generated */
  generatedAt: string;
  /** Human-readable institution name */
  institutionName: string;

  /** All components assembled */
  components: {
    timeline: InstitutionalTimeline;
    capabilities: CapabilityDetectionResult;
    claims: ClaimCandidateDetectionResult;
    gapAnalysis: GapAnalysisReport;
    narrative: InstitutionalNarrative;
  };

  /** Consolidated summary */
  summary: ProfileSummary;
}
