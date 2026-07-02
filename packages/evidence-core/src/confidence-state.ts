// ==========================================================================
// Confidence State — Domain TYPE only (KEMS-001 §2 Component D)
// ==========================================================================
// This file defines the shape of ConfidenceState.
// No computation logic — confidence is not calculated in Sprint 17.1.
// Baseline AF-1.0 — ADR-011: Core does not interpret.
// ==========================================================================

import type { EvidenceClass } from './evidence-class.js';

/**
 * Confidence level per Claim.
 * Per KEMS-001 §2 Component D.
 */
export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'insufficient';

/**
 * An individual contribution to the overall confidence.
 * Used in the explainable inference (KEMS-001 §6).
 */
export interface ConfidenceContribution {
  /** Evidence Node ID that contributed */
  evidenceNodeId: string;
  /** Evidence Class of the contributing node */
  evidenceClass: EvidenceClass;
  /** Individual contribution weight */
  weight: number;
  /** Human-readable description of this contribution */
  description: string;
}

/**
 * Confidence State output per Claim.
 * Defined here as a domain type. Not computed in the Core.
 * Computation belongs to an Engine per ADR-011.
 */
export interface ConfidenceState {
  /** The Claim this state applies to */
  claimId: string;
  /** Confidence value 0–100 */
  value: number;
  /** Qualitative level */
  level: ConfidenceLevel;
  /** When this state was last updated (ISO 8601) */
  lastUpdated: string;
  /** Human-readable explanation (KEMS-001 §6 — mandatory) */
  explanation: string;
  /** Evidence contributions that produced this state */
  contributions: ConfidenceContribution[];
  /** Whether any Counter Evidence is unresolved */
  hasUnresolvedCounterEvidence: boolean;
}
