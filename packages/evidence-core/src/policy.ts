// ==========================================================================
// Evaluation Policy — Contribution weights per Evidence Class
// ==========================================================================
// Baseline AF-1.0. Implementation concept (not architectural).
//
// EvaluationPolicy separates evaluation logic from evidence ingestion.
// Connectors ingest evidence with attributes. The policy decides how
// each Evidence Class contributes to confidence.
//
// This policy is NOT an ADR-level concept. It is an implementation detail
// of the Evaluation Layer that can change without architectural review.
// ==========================================================================

import { EvidenceClass, EVIDENCE_CLASS_DEFAULT_WEIGHT } from './evidence-class.js';

// --------------------------------------------------------------------------
// Contribution policy per Evidence Class
// --------------------------------------------------------------------------

export interface ClassContributionPolicy {
  /** Default contribution weight (0.0–1.0) */
  defaultContribution: number;
  /** Human-readable description */
  description: string;
  /** Whether this class requires corroboration (Class D) */
  requiresCorroboration: boolean;
  /** Whether this class modulates other weights (Class D, E) */
  isModulator: boolean;
}

// --------------------------------------------------------------------------
// Default evaluation policy
// --------------------------------------------------------------------------
// These values match the original EVIDENCE_CLASS_DEFAULT_WEIGHT from the
// domain model, but are now a configurable policy instead of hardcoded
// constants in the connector layer.

export const DEFAULT_EVALUATION_POLICY: Record<EvidenceClass, ClassContributionPolicy> = {
  [EvidenceClass.A]: {
    defaultContribution: 0.8,
    description: 'Public Independent Evidence — maximum weight, minimum corroboration needed.',
    requiresCorroboration: false,
    isModulator: false,
  },
  [EvidenceClass.B]: {
    defaultContribution: 0.5,
    description: 'Institutional Documentary Evidence — medium weight, benefits from corroboration.',
    requiresCorroboration: false,
    isModulator: false,
  },
  [EvidenceClass.C]: {
    defaultContribution: 0.7,
    description: 'Operational Evidence — high weight, generated automatically by execution.',
    requiresCorroboration: false,
    isModulator: false,
  },
  [EvidenceClass.D]: {
    defaultContribution: 0.0,
    description: 'Cross-Source Corroboration — modulates weight of corroborated nodes, not a standalone source.',
    requiresCorroboration: false,
    isModulator: true,
  },
  [EvidenceClass.E]: {
    defaultContribution: 0.0,
    description: 'Temporal Continuity — modulates weight based on history coherence, not a standalone source.',
    requiresCorroboration: false,
    isModulator: true,
  },
  [EvidenceClass.F]: {
    defaultContribution: 1.0,
    description: 'External Confirmation — highest weight, maximum independence.',
    requiresCorroboration: false,
    isModulator: false,
  },
};

// --------------------------------------------------------------------------
// Policy accessor
// --------------------------------------------------------------------------

export function getClassContribution(evidenceClass: EvidenceClass): number {
  return DEFAULT_EVALUATION_POLICY[evidenceClass]?.defaultContribution ?? 0.5;
}

export function getClassPolicy(evidenceClass: EvidenceClass): ClassContributionPolicy {
  return DEFAULT_EVALUATION_POLICY[evidenceClass] ?? {
    defaultContribution: 0.5,
    description: 'Unknown class — default weight applied.',
    requiresCorroboration: false,
    isModulator: false,
  };
}
