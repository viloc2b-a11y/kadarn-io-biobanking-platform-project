// ==========================================================================
// Evidence Core — Explainable Confidence Output
// ==========================================================================
// Baseline AF-1.0. Sprint 18.4.
//
// The explanation IS the product. The numeric value is only a summary.
// Every Confidence Value must be traceable to Evidence Nodes and Relationships.
// ==========================================================================

import { EvaluationPipeline, projectConfidence } from './evaluation.js';
import {
  evidenceClassEvaluator,
  relationshipEvaluator,
  counterEvidenceEvaluator,
  temporalEvaluator,
  rightOfResponseEvaluator,
  visibilityEvaluator,
} from './evaluators.js';
import { buildGraphFromData, getEvidenceGraph } from '@kadarn/evidence-core';
import type { GraphStore } from '@kadarn/evidence-core';
import { createSkeletonEvaluation } from '@kadarn/evidence-core';
import type { EvaluationResult, Explanation } from '@kadarn/evidence-core';
import type { Claim, EvidenceNode, EvidenceRelationship, CounterEvidence, RightOfResponse } from '@kadarn/evidence-core';

// --------------------------------------------------------------------------
// ConfidenceReport
// --------------------------------------------------------------------------
// The complete, final output for a Claim evaluation.

export interface ConfidenceReport {
  /** Report metadata */
  reportId: string;
  claimId: string;
  evaluatedAt: string;
  evaluatorVersion: string;

  /** Final confidence state */
  confidenceValue: number;
  confidenceLevel: 'high' | 'moderate' | 'low' | 'insufficient';

  /** Full explanation (KEMS-001 §6 — mandatory) */
  explanation: Explanation;

  /** Contribution breakdown by evaluator */
  contributionBreakdown: ContributionBreakdownItem[];

  /** Whether this report has unresolved counter evidence */
  hasUnresolvedCounterEvidence: boolean;
}

export interface ContributionBreakdownItem {
  evaluatorName: string;
  scoreDelta: number;
  summary: string;
}

// --------------------------------------------------------------------------
// evaluateClaim
// --------------------------------------------------------------------------
// Evaluate a single Claim using the default pipeline and produce a report.

export function evaluateClaim(params: {
  claimId: string;
  claims?: Claim[];
  evidenceNodes?: EvidenceNode[];
  relationships?: EvidenceRelationship[];
  counterEvidence?: CounterEvidence[];
  responses?: RightOfResponse[];
  actorId: string;
  correlationId: string;
  evaluatorVersion?: string;
}): ConfidenceReport {
  const graph = buildGraphFromData({
    claims: params.claims,
    evidenceNodes: params.evidenceNodes,
    relationships: params.relationships,
    counterEvidence: params.counterEvidence,
    responses: params.responses,
  });

  return evaluateEvidenceGraph({
    graph,
    claimId: params.claimId,
    actorId: params.actorId,
    correlationId: params.correlationId,
    evaluatorVersion: params.evaluatorVersion,
  });
}

// --------------------------------------------------------------------------
// evaluateEvidenceGraph
// --------------------------------------------------------------------------
// Evaluate a pre-built Evidence Graph and produce a report.

export function evaluateEvidenceGraph(params: {
  graph: GraphStore;
  claimId: string;
  actorId: string;
  correlationId: string;
  evaluatorVersion?: string;
}): ConfidenceReport {
  const pipeline = new EvaluationPipeline(createDefaultEvaluators());
  const result = pipeline.evaluate(
    params.graph,
    params.claimId,
    params.actorId,
    params.correlationId,
    params.evaluatorVersion ?? 'evidence-core-v1.0.0',
  );

  // Build breakdown
  const breakdown: ContributionBreakdownItem[] = result.contributions.map(c => ({
    evaluatorName: c.evaluatorName,
    scoreDelta: c.scoreDelta,
    summary: c.summary,
  }));

  const hasUnresolvedCE = result.explanation.counterEvidenceConsidered.some(ce => !ce.resolved);

  return {
    reportId: `report-${params.claimId}-${Date.now()}`,
    claimId: params.claimId,
    evaluatedAt: result.explanation.provenance.generatedAt,
    evaluatorVersion: result.explanation.provenance.generatedByEvaluatorVersion,
    confidenceValue: result.confidenceValue,
    confidenceLevel: result.confidenceLevel,
    explanation: result.explanation,
    contributionBreakdown: breakdown,
    hasUnresolvedCounterEvidence: hasUnresolvedCE,
  };
}

// --------------------------------------------------------------------------
// Default evaluators
// --------------------------------------------------------------------------

function createDefaultEvaluators() {
  return [
    { name: 'EvidenceClassEvaluator', evaluate: evidenceClassEvaluator, description: 'Evaluates evidence by class weighting.' },
    { name: 'RelationshipEvaluator', evaluate: relationshipEvaluator, description: 'Evaluates relationship balance.' },
    { name: 'CounterEvidenceEvaluator', evaluate: counterEvidenceEvaluator, description: 'Evaluates unresolved counter evidence.' },
    { name: 'TemporalEvaluator', evaluate: temporalEvaluator, description: 'Evaluates temporal continuity.' },
    { name: 'RightOfResponseEvaluator', evaluate: rightOfResponseEvaluator, description: 'Evaluates response resolution.' },
    { name: 'VisibilityEvaluator', evaluate: visibilityEvaluator, description: 'Evaluates visibility state.' },
  ];
}
