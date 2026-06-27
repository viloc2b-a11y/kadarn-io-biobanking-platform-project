// ==========================================================================
// Kadarn Trust Engine — Score Computation
// ==========================================================================
// ADR-011: Evidence-Based Trust Computation
// KRM-RAO §2.7 (Trust), §4.4 (Trust Graph), §5.4 (Trust Engine)
//
// Pure functions for trust score computation. The scoring logic is
// stateless — all state lives in the database.
// ==========================================================================

import {
  ALL_DIMENSIONS,
  DEFAULT_DECAY_CONFIG,
  DEFAULT_IMPACT_SOURCES,
  SEVERITY_MULTIPLIERS,
} from './types.js';

import type {
  TrustDimension,
  DimensionScoreMap,
  TrustEventSeverity,
  TrustEvent,
  OrganizationTrust,
  DecayConfig,
  TrajectoryPoint,
} from './types.js';

// --------------------------------------------------------------------------
// computeOverall — weighted composite of dimension scores
// --------------------------------------------------------------------------
// Default weights: equal (0.25 each). Can be overridden per program.
// --------------------------------------------------------------------------

export function computeOverall(
  scores: DimensionScoreMap,
  weights?: Partial<Record<TrustDimension, number>>,
): number {
  const w = {
    operational: weights?.operational ?? 0.25,
    regulatory:  weights?.regulatory  ?? 0.25,
    financial:   weights?.financial   ?? 0.25,
    technical:   weights?.technical   ?? 0.25,
  };

  const total =
    scores.operational  * w.operational +
    scores.regulatory   * w.regulatory +
    scores.financial    * w.financial +
    scores.technical    * w.technical;

  return clamp(total, 0, 1);
}

// --------------------------------------------------------------------------
// applyDecay — apply time-based decay to a score
// --------------------------------------------------------------------------
// decayed = score × (1 - rate ^ days)
//
// The decay function is exponential: the longer since the last event,
// the more the score decays toward zero. A score with no events for
// 30 days at 1%/day: score × (1 - 0.01)^30 ≈ score × 0.74
// --------------------------------------------------------------------------

export function applyDecay(
  score: number,
  daysSinceLastEvent: number,
  config: DecayConfig = { rate: 0.01 },
): number {
  if (daysSinceLastEvent <= 0) return score;
  if (score <= 0) return 0;

  const decayFactor = Math.pow(1 - config.rate, daysSinceLastEvent);
  return clamp(score * decayFactor, 0, 1);
}

// --------------------------------------------------------------------------
// applyDecayToAll — apply decay to all dimensions
// --------------------------------------------------------------------------

export function applyDecayToAll(
  scores: DimensionScoreMap,
  daysSinceLastEvent: number,
  dimensionConfig?: Partial<Record<TrustDimension, DecayConfig>>,
): DimensionScoreMap {
  const result: DimensionScoreMap = { ...scores };

  for (const dim of ALL_DIMENSIONS) {
    const config = dimensionConfig?.[dim] ?? DEFAULT_DECAY_CONFIG[dim];
    result[dim] = applyDecay(scores[dim], daysSinceLastEvent, config);
  }

  return result;
}

// --------------------------------------------------------------------------
// computeImpact — calculate actual impact from an event
// --------------------------------------------------------------------------
// Formula: weighted_impact = base_impact × severity_mult × recency_mult
// The recency multiplier is handled at read time via decay.
// At write time, we compute: impact × severity_mult
// --------------------------------------------------------------------------

export function computeImpact(
  source: string,
  severity: TrustEventSeverity,
  customBaseImpact?: number,
): number {
  const baseImpact = customBaseImpact ?? DEFAULT_IMPACT_SOURCES[source]?.baseImpact ?? 0.01;
  const severityMult = SEVERITY_MULTIPLIERS[severity];
  return baseImpact * severityMult;
}

// --------------------------------------------------------------------------
// applyImpact — apply an impact to a dimension score
// --------------------------------------------------------------------------
// new_score = clamp(current_score + weighted_impact, 0.0, 1.0)
// --------------------------------------------------------------------------

export function applyImpact(
  currentScore: number,
  impact: number,
): number {
  return clamp(currentScore + impact, 0, 1);
}

// --------------------------------------------------------------------------
// getSourceDescription — human-readable description for a source
// --------------------------------------------------------------------------

export function getSourceDescription(source: string): string {
  return DEFAULT_IMPACT_SOURCES[source]?.description ?? `Trust event: ${source}`;
}

// --------------------------------------------------------------------------
// getDefaultScore — get the initial trust score for a new organization
// --------------------------------------------------------------------------

export function getDefaultScore(): DimensionScoreMap {
  return {
    operational: 0.5,
    regulatory: 0.5,
    financial: 0.5,
    technical: 0.5,
  };
}

// --------------------------------------------------------------------------
// computeScoreFromEvents — reconstruct current score from event history
// --------------------------------------------------------------------------
// Walks through events in chronological order, applying each impact.
// This is the authoritative score computation.
// --------------------------------------------------------------------------

export function computeScoreFromEvents(
  events: Array<{ impact: number; dimension: TrustDimension }>,
  startScores?: DimensionScoreMap,
): DimensionScoreMap {
  const scores = startScores ?? getDefaultScore();

  for (const event of events) {
    scores[event.dimension] = applyImpact(scores[event.dimension], event.impact);
  }

  return scores;
}

// --------------------------------------------------------------------------
// buildTrajectory — build score trajectory from event history
// --------------------------------------------------------------------------

export function buildTrajectory(
  events: Array<{
    impact: number;
    dimension: TrustDimension;
    source: string;
    created_at: string;
    description?: string;
  }>,
  startScores?: DimensionScoreMap,
): TrajectoryPoint[] {
  const scores = startScores ? { ...startScores } : getDefaultScore();
  const trajectory: TrajectoryPoint[] = [];

  for (const event of events) {
    scores[event.dimension] = applyImpact(scores[event.dimension], event.impact);
    trajectory.push({
      date: event.created_at,
      score: scores[event.dimension],
      dimension: event.dimension,
      eventSource: event.source,
      eventDescription: event.description,
    });
  }

  return trajectory;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// --------------------------------------------------------------------------
// daysBetween — calculate days between two dates
// --------------------------------------------------------------------------

export function daysBetween(from: Date, to: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / msPerDay));
}
