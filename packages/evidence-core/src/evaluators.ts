// ==========================================================================
// Confidence Evaluation — Built-in Evaluators
// ==========================================================================
// Baseline AF-1.0. Sprint 18.3.
//
// Six independent evaluators. Each evaluates one aspect of the Evidence Graph.
// All contributions are explainable. No cross-evaluator coupling.
// ==========================================================================

import type { GraphStore, GraphNode } from './graph.js';
import type { EvidenceClass } from './evidence-class.js';
import { getClassContribution } from './policy.js';
import type { EvidenceContribution, OmittedEvidence, RelationshipContribution, CounterEvidenceContribution, ResponseContribution, TemporalContribution } from './explainability.js';

// --------------------------------------------------------------------------
// Evaluation Contribution
// --------------------------------------------------------------------------
// Output of a single evaluator. Contains score adjustment and
// explainability data.

export interface EvaluationContribution {
  evaluatorName: string;
  scoreDelta: number;
  summary: string;
  evidenceUsed: EvidenceContribution[];
  evidenceOmitted: OmittedEvidence[];
  relationshipsTraversed: RelationshipContribution[];
  counterEvidenceConsidered: CounterEvidenceContribution[];
  responsesConsidered: ResponseContribution[];
  temporalContinuity: TemporalContribution | null;
  visibilityFilterApplied: { viewerOrganizationId: string; accessibleEvidenceCount: number; filteredOutCount: number } | null;
}

// --------------------------------------------------------------------------
// 1. EvidenceClassEvaluator
// --------------------------------------------------------------------------
// Evaluates based on the Evidence Classes present.
// Higher classes (A, F) contribute more than lower classes (B, E).
// Uses EVIDENCE_CLASS_DEFAULT_WEIGHT from the domain model.

export function evidenceClassEvaluator(graph: GraphStore): EvaluationContribution {
  const evidenceUsed: EvidenceContribution[] = [];
  const evidenceOmitted: OmittedEvidence[] = [];

  let totalWeight = 0;
  let maxPossibleWeight = 0;
  let nodeCount = 0;

  for (const node of graph.nodes.values()) {
    if (node.type === 'evidence_node') {
      nodeCount++;
      const data = node.data as any;
      const evClass = data.evidenceClass as EvidenceClass;
      const weight = getClassContribution(evClass);
      totalWeight += weight;
      maxPossibleWeight += 1.0;

      evidenceUsed.push({
        evidenceNodeId: node.id,
        evidenceClass: evClass,
        content: (data.content ?? '').slice(0, 200),
        source: data.source ?? 'unknown',
        date: data.date ?? data.node_date ?? '',
        defaultWeight: weight,
        included: true,
        submittedByActorId: data.provenance?.createdByActorId ?? '',
        submittedAt: data.temporal?.createdAt ?? '',
      });
    }
  }

  // Score: ratio of achieved weight to max possible, scaled to 0–30 range
  const classScore = nodeCount > 0 ? (totalWeight / maxPossibleWeight) * 30 : 0;
  const scoreDelta = classScore - 15; // Center at midpoint

  return {
    evaluatorName: 'EvidenceClassEvaluator',
    scoreDelta,
    summary: `Evaluated ${nodeCount} evidence nodes across ${nodeCount > 0 ? 'multiple' : 'no'} classes. Weight score: ${classScore.toFixed(1)}/30.`,
    evidenceUsed,
    evidenceOmitted,
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: null,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// 2. RelationshipEvaluator
// --------------------------------------------------------------------------
// Evaluates the balance of supporting vs. contradicting relationships.
// Positive relationships increase confidence; contradictions decrease it.

export function relationshipEvaluator(graph: GraphStore): EvaluationContribution {
  const relationshipsTraversed: RelationshipContribution[] = [];
  let supportCount = 0;
  let contradictCount = 0;

  for (const edge of graph.edges.values()) {
    if (edge.type === 'supports' || edge.type === 'corroborates') {
      supportCount++;
      relationshipsTraversed.push({
        relationshipId: edge.id,
        sourceNodeId: edge.sourceId,
        targetNodeId: edge.targetId,
        relationshipType: edge.type as any,
        description: edge.label,
      });
    } else if (edge.type === 'contradicts') {
      contradictCount++;
      relationshipsTraversed.push({
        relationshipId: edge.id,
        sourceNodeId: edge.sourceId,
        targetNodeId: edge.targetId,
        relationshipType: 'contradicts',
        description: edge.label,
      });
    }
  }

  const total = supportCount + contradictCount;
  let scoreDelta = 0;
  if (total > 0) {
    const ratio = (supportCount - contradictCount) / total;
    scoreDelta = ratio * 15; // -15 to +15
  }

  return {
    evaluatorName: 'RelationshipEvaluator',
    scoreDelta,
    summary: `${supportCount} supporting, ${contradictCount} contradicting relationships. Balance: ${((supportCount - contradictCount) / Math.max(total, 1)).toFixed(2)}`,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed,
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: null,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// 3. CounterEvidenceEvaluator
// --------------------------------------------------------------------------
// Unresolved counter evidence decreases confidence.
// Each unresolved CE reduces score.

export function counterEvidenceEvaluator(graph: GraphStore): EvaluationContribution {
  const counterEvidenceConsidered: CounterEvidenceContribution[] = [];
  let unresolvedCount = 0;

  for (const node of graph.nodes.values()) {
    if (node.type === 'counter_evidence') {
      const data = node.data as any;
      const hasResponse = data.hasResponse ?? false;
      const resolved = hasResponse && data.responseId;
      if (!resolved) unresolvedCount++;

      counterEvidenceConsidered.push({
        counterEvidenceId: node.id,
        content: (data.content ?? '').slice(0, 200),
        evidenceClass: data.evidenceClass as EvidenceClass,
        hasResponse,
        responseId: data.responseId ?? null,
        description: `Counter evidence: ${(data.content ?? '').slice(0, 100)}`,
        resolved: !!resolved,
      });
    }
  }

  // Each unresolved CE reduces score by 10
  const scoreDelta = -unresolvedCount * 10;

  return {
    evaluatorName: 'CounterEvidenceEvaluator',
    scoreDelta,
    summary: `${unresolvedCount} unresolved counter evidence nodes found. Impact: -${unresolvedCount * 10} points.`,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered,
    responsesConsidered: [],
    temporalContinuity: null,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// 4. TemporalEvaluator
// --------------------------------------------------------------------------
// Evaluates temporal continuity. Gaps or discontinuity reduce confidence.

export function temporalEvaluator(graph: GraphStore): EvaluationContribution {
  // Collect all evidence node dates
  const dates: string[] = [];
  let earliestDate = '';
  let latestDate = '';

  for (const node of graph.nodes.values()) {
    if (node.type === 'evidence_node' || node.type === 'counter_evidence') {
      const createdAt = node.createdAt;
      dates.push(createdAt);
      if (!earliestDate || createdAt < earliestDate) earliestDate = createdAt;
      if (!latestDate || createdAt > latestDate) latestDate = createdAt;
    }
  }

  // Simple continuity check: are dates spread across a reasonable period?
  let scoreDelta = 0;
  let continuityDetected = true;
  const gaps: string[] = [];

  if (dates.length < 2) {
    scoreDelta = -5;
    continuityDetected = false;
    gaps.push('Insufficient temporal data (fewer than 2 dates).');
  }

  // Check for large gaps (more than 18 months between any two consecutive dates)
  if (dates.length >= 2) {
    const sorted = [...dates].sort();
    for (let i = 1; i < sorted.length; i++) {
      const diffMs = new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      if (diffMonths > 18) {
        continuityDetected = false;
        gaps.push(`Gap of ~${Math.round(diffMonths)} months between ${sorted[i - 1].slice(0, 10)} and ${sorted[i].slice(0, 10)}`);
      }
    }
  }

  if (gaps.length > 0) {
    scoreDelta = -Math.min(gaps.length * 3, 10);
  } else if (dates.length >= 2) {
    scoreDelta = 5; // Positive for temporal continuity
  }

  const temporalContinuity: TemporalContribution = {
    evaluatedPeriodStart: earliestDate.slice(0, 10),
    evaluatedPeriodEnd: latestDate.slice(0, 10),
    evidenceNodeCount: dates.length,
    continuityDetected,
    gaps,
    summary: gaps.length > 0
      ? `Temporal discontinuity detected: ${gaps.join('; ')}`
      : `Temporal continuity verified across ${dates.length} data points from ${earliestDate.slice(0, 10)} to ${latestDate.slice(0, 10)}.`,
  };

  return {
    evaluatorName: 'TemporalEvaluator',
    scoreDelta,
    summary: temporalContinuity.summary,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// 5. RightOfResponseEvaluator
// --------------------------------------------------------------------------
// Resolved responses increase confidence. Unresolved or rejected responses
// may decrease it.

export function rightOfResponseEvaluator(graph: GraphStore): EvaluationContribution {
  const responsesConsidered: ResponseContribution[] = [];
  let resolvedCount = 0;
  let unresolvedCount = 0;

  for (const node of graph.nodes.values()) {
    if (node.type === 'right_of_response') {
      const data = node.data as any;
      const status = data.status ?? 'submitted';
      const accepted = status === 'accepted' || status === 'confirmed';

      if (accepted) resolvedCount++;
      else unresolvedCount++;

      responsesConsidered.push({
        responseId: node.id,
        counterEvidenceId: data.counterEvidenceId ?? '',
        description: (data.description ?? '').slice(0, 200),
        resolutionDate: data.resolutionDate ?? '',
        status,
        accepted,
      });
    }
  }

  // Resolved responses contribute positively; unresolved negatively
  const scoreDelta = (resolvedCount * 3) - (unresolvedCount * 2);

  return {
    evaluatorName: 'RightOfResponseEvaluator',
    scoreDelta,
    summary: `${resolvedCount} resolved, ${unresolvedCount} unresolved responses.`,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered,
    temporalContinuity: null,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// 6. VisibilityEvaluator
// --------------------------------------------------------------------------
// Evaluates the visibility state of evidence. Does not interpret content.

export function visibilityEvaluator(graph: GraphStore): EvaluationContribution {
  let totalCount = 0;
  let siteScopeCount = 0;
  let sponsorScopeCount = 0;
  let systemScopeCount = 0;

  for (const node of graph.nodes.values()) {
    if (node.type === 'evidence_node' || node.type === 'counter_evidence') {
      totalCount++;
      const data = node.data as any;
      const scope = data.visibility?.scope ?? data.visibility_scope ?? 'site';
      if (scope === 'site') siteScopeCount++;
      else if (scope === 'sponsor_authorized') sponsorScopeCount++;
      else if (scope === 'system') systemScopeCount++;
    }
  }

  // Visibility quality: more restricted is better for multi-tenant platforms
  const restrictedRatio = totalCount > 0 ? (siteScopeCount + sponsorScopeCount) / totalCount : 1;
  const scoreDelta = (restrictedRatio - 0.5) * 5; // -2.5 to +2.5

  return {
    evaluatorName: 'VisibilityEvaluator',
    scoreDelta,
    summary: `${totalCount} evidence nodes: ${siteScopeCount} site-scoped, ${sponsorScopeCount} sponsor-authorized, ${systemScopeCount} system. Restricted ratio: ${(restrictedRatio * 100).toFixed(0)}%.`,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: null,
    visibilityFilterApplied: {
      viewerOrganizationId: '',
      accessibleEvidenceCount: siteScopeCount + sponsorScopeCount,
      filteredOutCount: systemScopeCount,
    },
  };
}
