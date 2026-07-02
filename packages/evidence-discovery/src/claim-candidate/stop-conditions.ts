// ==========================================================================
// Claim Candidate Detection — Stop Conditions
// ==========================================================================
// Sprint 20B.3.
//
// Evaluates when to stop claim candidate detection based on configurable
// conditions. Prevents runaway detection.
// No Claims. No Evidence Core writes. No promotion.
// ==========================================================================

import type { ClaimCandidateDetectionResult } from './types.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ClaimStopConditionDiscriminant =
  | { type: 'max_candidates'; max: number }
  | { type: 'diminishing_returns'; minNewConfidence: number }
  | { type: 'empty_input' };

export type ClaimStopCondition = ClaimStopConditionDiscriminant & { __brand?: 'ClaimStopCondition' };

export interface StopConditionResult {
  shouldStop: boolean;
  reason: string;
  condition: ClaimStopCondition;
}

export interface StopConditionsConfig {
  conditions: ClaimStopCondition[];
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

const DEFAULT_CONFIG: StopConditionsConfig = {
  conditions: [
    { type: 'empty_input' } as ClaimStopCondition,
    { type: 'max_candidates', max: 30 } as ClaimStopCondition,
  ],
};

// --------------------------------------------------------------------------
// Evaluator
// --------------------------------------------------------------------------

export class ClaimStopConditionEvaluator {
  private config: StopConditionsConfig;

  constructor(config?: Partial<StopConditionsConfig>) {
    this.config = {
      conditions: config?.conditions ?? DEFAULT_CONFIG.conditions,
    };
  }

  /** Evaluate all stop conditions against detection result */
  evaluate(result: ClaimCandidateDetectionResult): StopConditionResult[] {
    return this.config.conditions.map(cond => this.evaluateOne(cond, result));
  }

  /** Whether ANY stop condition triggers */
  shouldStop(result: ClaimCandidateDetectionResult): boolean {
    return this.evaluate(result).some(r => r.shouldStop);
  }

  /** All reasons for stopping */
  getStopReasons(result: ClaimCandidateDetectionResult): string[] {
    return this.evaluate(result)
      .filter(r => r.shouldStop)
      .map(r => r.reason);
  }

  private evaluateOne(
    condition: ClaimStopCondition,
    result: ClaimCandidateDetectionResult,
  ): StopConditionResult {
    switch (condition.type) {
      case 'empty_input':
        return {
          shouldStop: result.candidates.length === 0,
          reason: result.candidates.length === 0
            ? 'No claim candidates from provided input'
            : `${result.candidates.length} claim candidates detected`,
          condition,
        };

      case 'max_candidates': {
        const max = condition.max;
        const should = result.totalCandidates >= max;
        return {
          shouldStop: should,
          reason: should
            ? `Candidate count (${result.totalCandidates}) >= max (${max})`
            : `Candidate count (${result.totalCandidates}) < max (${max})`,
          condition,
        };
      }

      case 'diminishing_returns': {
        const highConfidence = result.candidates.filter(c => c.confidence >= condition.minNewConfidence);
        const should = highConfidence.length === 0 && result.candidates.length > 0;
        return {
          shouldStop: should,
          reason: should
            ? `No candidates with confidence >= ${condition.minNewConfidence}`
            : `${highConfidence.length} candidates with confidence >= ${condition.minNewConfidence}`,
          condition,
        };
      }

      default:
        return {
          shouldStop: false,
          reason: `Unknown stop condition: ${(condition as any).type}`,
          condition,
        };
    }
  }
}
