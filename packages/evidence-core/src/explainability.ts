// ==========================================================================
// Evidence Core — Explainability Framework (KEMS-001 §6)
// ==========================================================================
// Baseline AF-1.0. Sprint 18.1.
//
// This module defines the canonical Explainability Model for the Evidence Core.
// Every future Confidence evaluation MUST produce an Explanation conforming to
// these types. The explanation IS the product — the numeric value is a summary.
//
// KEMS-001 §6 mandate:
//   "No Confidence Value is ever presented without its explanation."
//
// This module defines the shape of that explanation.
// It does NOT compute Confidence, weights, scores, or rankings.
// ==========================================================================

import type { EvidenceClass } from './evidence-class.js';

// --------------------------------------------------------------------------
// Omitted Evidence
// --------------------------------------------------------------------------
// Evidence that was considered but excluded from the evaluation, with reason.

export type EvidenceOmissionReason =
  | 'insufficient_weight'
  | 'outdated'
  | 'superseded'
  | 'outside_visibility_scope'
  | 'irrelevant_to_claim'
  | 'duplicate';

export interface OmittedEvidence {
  /** Evidence Node ID that was omitted */
  evidenceNodeId: string;
  /** Why this evidence was omitted from the evaluation */
  reason: EvidenceOmissionReason;
  /** Human-readable explanation of the omission */
  description: string;
}

// --------------------------------------------------------------------------
// Evidence Contribution
// --------------------------------------------------------------------------
// A single piece of evidence that contributed to the evaluation result.

export interface EvidenceContribution {
  /** Evidence Node ID */
  evidenceNodeId: string;
  /** Evidence Class (A–F) */
  evidenceClass: EvidenceClass;
  /** Human-readable content summary */
  content: string;
  /** Source of this evidence */
  source: string;
  /** Date evidence was produced */
  date: string;
  /** Current Evidence Class default weight (informational only — not computed) */
  defaultWeight: number;
  /** Whether this evidence was used or omitted */
  included: boolean;
  /** Omission details if not included */
  omission?: OmittedEvidence;
  /** Provenance: who submitted this evidence and when */
  submittedByActorId: string;
  submittedAt: string;
}

// --------------------------------------------------------------------------
// Relationship Contribution
// --------------------------------------------------------------------------
// A relationship between evidence nodes that was traversed.

export interface RelationshipContribution {
  /** Relationship ID */
  relationshipId: string;
  /** Source Evidence Node ID */
  sourceNodeId: string;
  /** Target Evidence Node ID */
  targetNodeId: string;
  /** Relationship type */
  relationshipType: 'supports' | 'contradicts' | 'corroborates' | 'responds_to' | 'supersedes';
  /** Human-readable description of the relationship */
  description: string;
}

// --------------------------------------------------------------------------
// Counter Evidence Contribution
// --------------------------------------------------------------------------
// Counter Evidence that was considered in the evaluation.

export interface CounterEvidenceContribution {
  /** Counter Evidence Node ID */
  counterEvidenceId: string;
  /** Content of the counter evidence */
  content: string;
  /** Its Evidence Class */
  evidenceClass: EvidenceClass;
  /** Whether a Right of Response exists */
  hasResponse: boolean;
  /** Response ID if one exists */
  responseId: string | null;
  /** Response status if one exists */
  responseStatus?: string | null;
  /** Human-readable description of the counter evidence */
  description: string;
  /** Whether this counter evidence is resolved */
  resolved: boolean;
}

// --------------------------------------------------------------------------
// Temporal Contribution
// --------------------------------------------------------------------------
// Temporal continuity assessment (KEMS-001 §9, Class E).

export interface TemporalContribution {
  /** The time range over which evidence was evaluated */
  evaluatedPeriodStart: string;
  evaluatedPeriodEnd: string;
  /** Number of evidence nodes in the evaluated period */
  evidenceNodeCount: number;
  /** Whether temporal continuity was detected */
  continuityDetected: boolean;
  /** Any temporal gaps or discontinuities found */
  gaps: string[];
  /** Human-readable temporal summary */
  summary: string;
}

// --------------------------------------------------------------------------
// Response Contribution
// --------------------------------------------------------------------------
// Right of Response considered in the evaluation.

export interface ResponseContribution {
  /** Right of Response ID */
  responseId: string;
  /** The Counter Evidence this responds to */
  counterEvidenceId: string;
  /** Description of the corrective action */
  description: string;
  /** Resolution date */
  resolutionDate: string;
  /** Current status */
  status: string;
  /** Whether the response was accepted */
  accepted: boolean;
}

// --------------------------------------------------------------------------
// Explanation
// --------------------------------------------------------------------------
// The complete reasoning chain for an evaluation (KEMS-001 §6).

export interface Explanation {
  /** Unique identifier for this explanation */
  id: string;

  /** The Claim that was evaluated */
  claimId: string;

  /** All evidence used in the evaluation */
  evidenceUsed: EvidenceContribution[];

  /** Evidence considered but omitted, with reasons */
  evidenceOmitted: OmittedEvidence[];

  /** Relationships traversed during evaluation */
  relationshipsTraversed: RelationshipContribution[];

  /** Counter Evidence considered */
  counterEvidenceConsidered: CounterEvidenceContribution[];

  /** Rights of Response considered */
  responsesConsidered: ResponseContribution[];

  /** Temporal continuity assessment */
  temporalContinuity: TemporalContribution;

  /** Visibility filtering that was applied */
  visibilityFilterApplied: {
    viewerOrganizationId: string;
    accessibleEvidenceCount: number;
    filteredOutCount: number;
  };

  /** Provenance of this explanation itself */
  provenance: {
    generatedAt: string;
    generatedByActorId: string;
    generatedByEvaluatorVersion: string;
    correlationId: string;
  };

  /** Human-readable reasoning chain */
  reasoningChain: string;
}

// --------------------------------------------------------------------------
// Evaluation Result
// --------------------------------------------------------------------------
// Top-level container for an evaluation result (KEMS-001 §2 Component D).

export interface EvaluationResult {
  /** Unique evaluation ID */
  id: string;

  /** The Claim evaluated */
  claimId: string;

  /** Confidence Level — stored as type only. NOT computed in this layer. */
  confidenceLevel: 'high' | 'moderate' | 'low' | 'insufficient';

  /** Confidence Value 0–100 — stored as type only. NOT computed in this layer. */
  confidenceValue: number;

  /** The full explanation (KEMS-001 §6 — always mandatory) */
  explanation: Explanation;

  /** When this evaluation was produced */
  evaluatedAt: string;

  /** Evaluator version identifier */
  evaluatorVersion: string;

  /** Whether this evaluation has unresolved counter evidence */
  hasUnresolvedCounterEvidence: boolean;
}

// --------------------------------------------------------------------------
// Factory function — create a skeleton EvaluationResult
// --------------------------------------------------------------------------
// This creates a placeholder evaluation result. No computation is performed.
// Confidence values are placeholders (0, 'insufficient') until an Engine
// computes them in a future sprint.

export function createSkeletonEvaluation(params: {
  claimId: string;
  actorId: string;
  correlationId: string;
  evaluatorVersion?: string;
}): EvaluationResult {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const explanation: Explanation = {
    id: `${id}-explanation`,
    claimId: params.claimId,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: {
      evaluatedPeriodStart: '',
      evaluatedPeriodEnd: '',
      evidenceNodeCount: 0,
      continuityDetected: false,
      gaps: [],
      summary: 'No temporal assessment performed.',
    },
    visibilityFilterApplied: {
      viewerOrganizationId: '',
      accessibleEvidenceCount: 0,
      filteredOutCount: 0,
    },
    provenance: {
      generatedAt: now,
      generatedByActorId: params.actorId,
      generatedByEvaluatorVersion: params.evaluatorVersion ?? '0.0.0',
      correlationId: params.correlationId,
    },
    reasoningChain: 'No reasoning computed yet.',
  };

  return {
    id,
    claimId: params.claimId,
    confidenceLevel: 'insufficient',
    confidenceValue: 0,
    explanation,
    evaluatedAt: now,
    evaluatorVersion: params.evaluatorVersion ?? '0.0.0',
    hasUnresolvedCounterEvidence: false,
  };
}
