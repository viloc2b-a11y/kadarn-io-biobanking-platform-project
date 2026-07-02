// ==========================================================================
// Confidence Evaluation — Evaluator Interface + Pipeline
// ==========================================================================
// Baseline AF-1.0. Sprint 18.3.
//
// Deterministic evaluation pipeline. Every evaluator:
//   - Receives only the Evidence Graph
//   - Is independent (no cross-evaluator coupling)
//   - Produces explainable contributions
//   - Does NOT use AI, ML, or probabilistic models
// ==========================================================================

import type { GraphStore } from './graph.js';
import type { EvaluationContribution } from './evaluators.js';
import type { EvaluationResult, Explanation } from './explainability.js';

// --------------------------------------------------------------------------
// Evaluator interface
// --------------------------------------------------------------------------

export interface EvidenceEvaluator {
  /** Unique evaluator name */
  name: string;

  /** Evaluate the Evidence Graph and produce a contribution */
  evaluate(graph: GraphStore): EvaluationContribution;

  /** Human-readable description of what this evaluator does */
  description: string;
}

// --------------------------------------------------------------------------
// Pipeline result
// --------------------------------------------------------------------------

export interface PipelineResult {
  /** The evaluated claim ID */
  claimId: string;

  /** All contributions from each evaluator */
  contributions: EvaluationContribution[];

  /** The aggregated raw score (0–100, before projection) */
  rawScore: number;

  /** The final Confidence Value (0–100) */
  confidenceValue: number;

  /** The final Confidence Level */
  confidenceLevel: 'high' | 'moderate' | 'low' | 'insufficient';

  /** The full explanation */
  explanation: Explanation;
}

// --------------------------------------------------------------------------
// Pipeline
// --------------------------------------------------------------------------

export class EvaluationPipeline {
  private evaluators: EvidenceEvaluator[] = [];

  constructor(evaluators?: EvidenceEvaluator[]) {
    if (evaluators) {
      this.evaluators = evaluators;
    }
  }

  /** Register an evaluator */
  register(evaluator: EvidenceEvaluator): void {
    this.evaluators.push(evaluator);
  }

  /** Get all registered evaluators */
  getEvaluators(): EvidenceEvaluator[] {
    return [...this.evaluators];
  }

  /**
   * Run the full evaluation pipeline.
   * Each evaluator produces an independent contribution.
   * Contributions are aggregated into a raw score.
   * The raw score is projected into a ConfidenceValue and ConfidenceLevel.
   * An EvaluationResult with full Explanation is produced.
   */
  evaluate(
    graph: GraphStore,
    claimId: string,
    actorId: string,
    correlationId: string,
    evaluatorVersion?: string,
  ): PipelineResult {
    // Step 1: Run each evaluator independently
    const contributions = this.evaluators.map(evaluator => {
      const contribution = evaluator.evaluate(graph);
      return contribution;
    });

    // Step 2: Aggregate contributions into raw score
    const { rawScore, contributionDetails } = aggregateContributions(contributions);

    // Step 3: Project raw score into confidence value and level
    const { confidenceValue, confidenceLevel } = projectConfidence(rawScore);

    // Step 4: Build the explanation
    const now = new Date().toISOString();
    const expId = `${claimId}-exp-${Date.now()}`;

    // Collect evidence used from all contributions
    const evidenceUsed = contributionDetails.evidenceUsed;
    const evidenceOmitted = contributionDetails.evidenceOmitted;
    const relationshipsTraversed = contributionDetails.relationshipsTraversed;
    const counterEvidenceConsidered = contributionDetails.counterEvidenceConsidered;
    const responsesConsidered = contributionDetails.responsesConsidered;
    const hasUnresolvedCE = counterEvidenceConsidered.some(ce => !ce.resolved);

    const explanation: Explanation = {
      id: expId,
      claimId,
      evidenceUsed,
      evidenceOmitted,
      relationshipsTraversed,
      counterEvidenceConsidered,
      responsesConsidered,
      temporalContinuity: contributionDetails.temporalContinuity,
      visibilityFilterApplied: contributionDetails.visibilityFilterApplied,
      provenance: {
        generatedAt: now,
        generatedByActorId: actorId,
        generatedByEvaluatorVersion: evaluatorVersion ?? '0.0.0',
        correlationId,
      },
      reasoningChain: buildReasoningChain(contributions),
    };

    return {
      claimId,
      contributions,
      rawScore,
      confidenceValue,
      confidenceLevel,
      explanation,
    };
  }
}

// --------------------------------------------------------------------------
// Aggregation
// --------------------------------------------------------------------------

export interface ContributionDetails {
  evidenceUsed: import('./explainability.js').EvidenceContribution[];
  evidenceOmitted: import('./explainability.js').OmittedEvidence[];
  relationshipsTraversed: import('./explainability.js').RelationshipContribution[];
  counterEvidenceConsidered: import('./explainability.js').CounterEvidenceContribution[];
  responsesConsidered: import('./explainability.js').ResponseContribution[];
  temporalContinuity: import('./explainability.js').TemporalContribution;
  visibilityFilterApplied: { viewerOrganizationId: string; accessibleEvidenceCount: number; filteredOutCount: number };
}

export function aggregateContributions(contributions: EvaluationContribution[]): {
  rawScore: number;
  contributionDetails: ContributionDetails;
} {
  // Start at midpoint (50) and let contributions adjust
  let score = 50;
  let maxScore = 100;
  let minScore = 0;

  const details: ContributionDetails = {
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: {
      evaluatedPeriodStart: '', evaluatedPeriodEnd: '',
      evidenceNodeCount: 0, continuityDetected: true, gaps: [],
      summary: 'Temporal assessment performed.',
    },
    visibilityFilterApplied: { viewerOrganizationId: '', accessibleEvidenceCount: 0, filteredOutCount: 0 },
  };

  for (const contrib of contributions) {
    score += contrib.scoreDelta;

    // Collect explainability data
    if (contrib.evidenceUsed) details.evidenceUsed.push(...contrib.evidenceUsed);
    if (contrib.evidenceOmitted) details.evidenceOmitted.push(...contrib.evidenceOmitted);
    if (contrib.relationshipsTraversed) details.relationshipsTraversed.push(...contrib.relationshipsTraversed);
    if (contrib.counterEvidenceConsidered) details.counterEvidenceConsidered.push(...contrib.counterEvidenceConsidered);
    if (contrib.responsesConsidered) details.responsesConsidered.push(...contrib.responsesConsidered);
    if (contrib.temporalContinuity) details.temporalContinuity = contrib.temporalContinuity;
    if (contrib.visibilityFilterApplied) details.visibilityFilterApplied = contrib.visibilityFilterApplied;
  }

  // Clamp
  const rawScore = Math.max(minScore, Math.min(maxScore, Math.round(score)));

  return { rawScore, contributionDetails: details };
}

// --------------------------------------------------------------------------
// Projection
// --------------------------------------------------------------------------

export function projectConfidence(rawScore: number): {
  confidenceValue: number;
  confidenceLevel: 'high' | 'moderate' | 'low' | 'insufficient';
} {
  const confidenceValue = Math.max(0, Math.min(100, Math.round(rawScore)));

  let confidenceLevel: 'high' | 'moderate' | 'low' | 'insufficient';
  if (confidenceValue >= 70) {
    confidenceLevel = 'high';
  } else if (confidenceValue >= 40) {
    confidenceLevel = 'moderate';
  } else if (confidenceValue >= 15) {
    confidenceLevel = 'low';
  } else {
    confidenceLevel = 'insufficient';
  }

  return { confidenceValue, confidenceLevel };
}

// --------------------------------------------------------------------------
// Reasoning chain
// --------------------------------------------------------------------------

function buildReasoningChain(contributions: EvaluationContribution[]): string {
  const parts: string[] = [];
  for (const c of contributions) {
    parts.push(`[${c.evaluatorName}] ${c.summary} (Δ${c.scoreDelta >= 0 ? '+' : ''}${c.scoreDelta.toFixed(1)})`);
  }
  return parts.join('\n');
}
