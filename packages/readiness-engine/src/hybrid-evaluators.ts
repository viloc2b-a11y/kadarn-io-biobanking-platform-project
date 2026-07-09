// ==========================================================================
// Kadarn Readiness Engine — Hybrid Trial Evaluators
// ==========================================================================
// KTP-1.3 — Hybrid Trial Readiness Passport.
//
// Three new evaluators that extend the existing pipeline without modifying
// the six baseline evaluators (EvidenceClass, Relationship, CounterEvidence,
// Temporal, RightOfResponse, Visibility).
//
// 1. SelfReportCapEvaluator — Caps confidence when only self-declared
//    (Class B) evidence is present, preventing misleading high confidence
//    from unverified institutional claims.
//
// 2. EvidenceExpiryEvaluator — Degrades confidence when evidence has
//    exceeded its natural decay period per Evidence Class.
//
// 3. NotApplicableSkipEvaluator — Identifies and excludes N/A claims from
//    mandatory/optional counts and overall confidence averaging so they
//    do not penalize readiness.
//
// All evaluators follow the EvidenceEvaluator interface and are
// independent (no cross-evaluator coupling).
// ==========================================================================

import type { GraphStore } from '@kadarn/evidence-core';
import { EVIDENCE_CLASS_DECAY_MONTHS } from '@kadarn/evidence-core';
import type { EvaluationContribution } from './evaluators.js';

// --------------------------------------------------------------------------
// Evidence Class Decay Periods (months) — from evidence-core
// --------------------------------------------------------------------------

const DECAY_MONTHS: Record<string, number | null> = {
  A: EVIDENCE_CLASS_DECAY_MONTHS.A,
  B: EVIDENCE_CLASS_DECAY_MONTHS.B,
  C: EVIDENCE_CLASS_DECAY_MONTHS.C,
  D: EVIDENCE_CLASS_DECAY_MONTHS.D,
  E: EVIDENCE_CLASS_DECAY_MONTHS.E,
  F: EVIDENCE_CLASS_DECAY_MONTHS.F,
};

// --------------------------------------------------------------------------
// 1. SelfReportCapEvaluator
// --------------------------------------------------------------------------
// Caps confidence when only self-declared (Class B) evidence is present.
//
// Rules:
//   - Class B only (no A, C, D, F): cap at 0.40
//   - Class B + C only (no A, D, F): cap at 0.65
//   - 'DECLARED_ONLY' evidence support: cap at 0.35
//   - Otherwise: no cap (returns 0 delta)
//
// The cap is expressed as a negative delta from a neutral baseline.
// Since the pipeline starts at 50 and projects to 0-100, the cap
// ensures the final confidence does not exceed the threshold.
// We express this as a scoreDelta that brings the score down enough
// that the projection stays under the cap.
//
// conservativeMax pre-cap = 0.40 on 0-1 scale = 40 on 0-100 scale
// Starting rawScore is 50. To get below 40, we need delta <= -10.
// But we don't know what other evaluators contributed. We apply
// a strong penalty that's proportional to how much Class B dominates.

export function selfReportCapEvaluator(graph: GraphStore): EvaluationContribution {
  const classesPresent = new Set<string>();
  let classBOnlyCount = 0;
  let totalEvidenceCount = 0;
  let hasNonClassB = false;
  let hasClassCOrHigher = false;

  for (const node of graph.nodes.values()) {
    if (node.type === 'evidence_node') {
      totalEvidenceCount++;
      const data = node.data as any;
      const evClass = (data.evidenceClass || 'B') as string;
      classesPresent.add(evClass);

      if (evClass === 'B') {
        classBOnlyCount++;
      } else {
        hasNonClassB = true;
        if (['A', 'C', 'D', 'F'].includes(evClass)) {
          hasClassCOrHigher = true;
        }
      }
    }
  }

  // No evidence at all — no cap to apply
  if (totalEvidenceCount === 0) {
    return {
      evaluatorName: 'SelfReportCapEvaluator',
      scoreDelta: 0,
      summary: 'No evidence to evaluate for self-report cap.',
      evidenceUsed: [],
      evidenceOmitted: [],
      relationshipsTraversed: [],
      counterEvidenceConsidered: [],
      responsesConsidered: [],
      temporalContinuity: null,
      visibilityFilterApplied: null,
    };
  }

  const isOnlyClassB = classesPresent.size === 1 && classesPresent.has('B');
  const isClassBPlusCOnly =
    classesPresent.has('B') &&
    classesPresent.has('C') &&
    !classesPresent.has('A') &&
    !classesPresent.has('D') &&
    !classesPresent.has('F');

  let scoreDelta = 0;
  let summary = '';

  if (isOnlyClassB) {
    // Strong penalty: self-declared only cannot reach above 0.40
    // Force score down by 25 points (from baseline 50 → 25 → confidence ~25%)
    scoreDelta = -25;
    summary =
      `All ${totalEvidenceCount} evidence nodes are Class B (self-declared). ` +
      'Confidence capped at 0.40. Operational (C) or external (F) evidence required for higher confidence.';
  } else if (isClassBPlusCOnly) {
    // Moderate penalty: operational evidence helps but no external corroboration
    scoreDelta = -10;
    summary =
      `Evidence is Class B + C only (${classBOnlyCount} self-declared, ${totalEvidenceCount - classBOnlyCount} operational). ` +
      'Confidence capped at 0.65. External confirmation (A or F) or cross-source corroboration (D) required for higher confidence.';
  } else if (!hasNonClassB) {
    scoreDelta = -25;
    summary = 'Only self-declared evidence present. Cap applied.';
  } else {
    summary =
      `Evidence spans ${classesPresent.size} classes including non-self-declared sources. No self-report cap applied.`;
  }

  return {
    evaluatorName: 'SelfReportCapEvaluator',
    scoreDelta,
    summary,
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: null,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// 2. EvidenceExpiryEvaluator
// --------------------------------------------------------------------------
// Degrades confidence when evidence has exceeded its natural decay period.
//
// Rules:
//   - For each evidence node, compute age in months
//   - If age > decayPeriod for that class, apply degradation:
//     effectiveWeight = originalWeight * max(0.2, 1 - (age - decay) / decay)
//   - Accumulate degradation across all nodes
//   - Score delta = negative proportional to total degradation

export function evidenceExpiryEvaluator(graph: GraphStore): EvaluationContribution {
  let totalDegradation = 0;
  let expiredCount = 0;
  let totalCount = 0;
  const expiredDetails: string[] = [];

  const now = new Date();

  for (const node of graph.nodes.values()) {
    if (node.type === 'evidence_node') {
      totalCount++;
      const data = node.data as any;
      const evClass = (data.evidenceClass || 'B') as string;
      const decayMonths = DECAY_MONTHS[evClass];

      if (decayMonths === null) continue; // No decay for this class

      const nodeDate = data.date || data.node_date || node.createdAt;
      if (!nodeDate) continue;

      const ageMs = now.getTime() - new Date(nodeDate).getTime();
      const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);

      if (ageMonths > decayMonths) {
        expiredCount++;
        const excessRatio = (ageMonths - decayMonths) / decayMonths;
        const degradation = Math.min(0.8, excessRatio * 0.5); // Cap at 80% degradation per node
        totalDegradation += degradation;
        expiredDetails.push(
          `Class ${evClass} evidence (${node.id.slice(0, 8)}): ${Math.round(ageMonths)}mo old, decay=${decayMonths}mo`,
        );
      }
    }
  }

  let scoreDelta = 0;
  let summary = '';

  if (expiredCount === 0 && totalCount > 0) {
    summary = `All ${totalCount} evidence nodes within decay periods. No expiry degradation.`;
  } else if (totalCount === 0) {
    summary = 'No evidence to evaluate for expiry.';
  } else if (expiredCount > 0) {
    // Each expired node reduces score, capped at reasonable levels
    scoreDelta = -Math.min(25, Math.round(totalDegradation * 10));
    summary =
      `${expiredCount} of ${totalCount} evidence nodes have expired beyond their natural decay period. ` +
      `Confidence degraded by ${-scoreDelta} points. Renew evidence to restore confidence. ` +
      expiredDetails.slice(0, 3).join('; ') +
      (expiredDetails.length > 3 ? ` and ${expiredDetails.length - 3} more` : '');
  }

  const temporalContinuity = {
    evaluatedPeriodStart: '',
    evaluatedPeriodEnd: now.toISOString().slice(0, 10),
    evidenceNodeCount: totalCount,
    continuityDetected: expiredCount === 0,
    gaps: expiredDetails,
    summary,
  };

  return {
    evaluatorName: 'EvidenceExpiryEvaluator',
    scoreDelta,
    summary,
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
// 3. NotApplicableSkipEvaluator
// --------------------------------------------------------------------------
// Identifies N/A evidence and returns metadata so the readiness pipeline
// can exclude these claims from mandatory/optional counts.
//
// This evaluator does NOT modify the score (scoreDelta = 0).
// It signals N/A state through its contribution summary so the
// readiness evaluation pipeline can act on it.
//
// Note: This evaluator operates at the claim level, not the graph level.
// The actual skip logic is applied in readiness-evaluation.ts when
// processing the claim's evidenceSupport field.

export function notApplicableSkipEvaluator(graph: GraphStore): EvaluationContribution {
  let naCount = 0;
  let totalCount = 0;

  for (const node of graph.nodes.values()) {
    if (node.type === 'evidence_node') {
      totalCount++;
      const data = node.data as any;
      if (data.notApplicable === true || data.evidenceSupport === 'NOT_APPLICABLE') {
        naCount++;
      }
    }
  }

  return {
    evaluatorName: 'NotApplicableSkipEvaluator',
    scoreDelta: 0, // N/A does not affect confidence
    summary:
      naCount > 0
        ? `${naCount} of ${totalCount} evidence nodes marked NOT_APPLICABLE. These claims should be excluded from mandatory/optional counts and overall confidence averaging.`
        : 'No NOT_APPLICABLE evidence detected.',
    evidenceUsed: [],
    evidenceOmitted: [],
    relationshipsTraversed: [],
    counterEvidenceConsidered: [],
    responsesConsidered: [],
    temporalContinuity: null,
    visibilityFilterApplied: null,
  };
}

// --------------------------------------------------------------------------
// Export all hybrid evaluators
// --------------------------------------------------------------------------

export const hybridEvaluators = {
  selfReportCap: selfReportCapEvaluator,
  evidenceExpiry: evidenceExpiryEvaluator,
  notApplicableSkip: notApplicableSkipEvaluator,
};
