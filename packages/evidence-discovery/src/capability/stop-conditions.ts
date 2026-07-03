// ==========================================================================
// Capability Detection — Stop Conditions
// ==========================================================================
// Sprint 20B.2.
//
// Evaluates when to stop capability detection based on configurable conditions.
// Prevents runaway detection and ensures meaningful output.
// No Claims. No Evidence Core modification. No promotion.
// ==========================================================================

import type { CapabilityDetectionResult, CapabilityCategory } from './types';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type StopConditionDiscriminant =
  | { type: 'max_capabilities'; max: number }
  | { type: 'diminishing_returns'; minNewConfidence: number }
  | { type: 'max_per_category'; max: number }
  | { type: 'empty_input' }
  | { type: 'coverage_sufficient'; minCategoriesWithDetected: number };

/**
 * Union type for stop conditions using a branded discriminant.
 * This satisfies TypeScript's discriminated union requirements
 * while keeping the API clean.
 */
export type StopCondition = StopConditionDiscriminant & { __brand?: 'StopCondition' };

export interface StopConditionResult {
  shouldStop: boolean;
  reason: string;
  condition: StopCondition;
}

export interface StopConditionsConfig {
  conditions: StopCondition[];
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

const DEFAULT_CONFIG: StopConditionsConfig = {
  conditions: [
    { type: 'empty_input' } as StopCondition,
    { type: 'max_capabilities', max: 50 } as StopCondition,
  ],
};

// --------------------------------------------------------------------------
// Evaluator
// --------------------------------------------------------------------------

export class StopConditionEvaluator {
  private config: StopConditionsConfig;

  constructor(config?: Partial<StopConditionsConfig>) {
    this.config = {
      conditions: config?.conditions ?? DEFAULT_CONFIG.conditions,
    };
  }

  /** Evaluate all stop conditions against detection result */
  evaluate(result: CapabilityDetectionResult): StopConditionResult[] {
    return this.config.conditions.map(cond => this.evaluateOne(cond, result));
  }

  /** Whether ANY stop condition triggers */
  shouldStop(result: CapabilityDetectionResult): boolean {
    return this.evaluate(result).some(r => r.shouldStop);
  }

  /** All reasons for stopping */
  getStopReasons(result: CapabilityDetectionResult): string[] {
    return this.evaluate(result)
      .filter(r => r.shouldStop)
      .map(r => r.reason);
  }

  private evaluateOne(condition: StopCondition, result: CapabilityDetectionResult): StopConditionResult {
    switch (condition.type) {
      case 'empty_input':
        return {
          shouldStop: result.capabilities.length === 0,
          reason: 'No capabilities detected from provided input',
          condition,
        };

      case 'max_capabilities': {
        const max = condition.max;
        const should = result.totalDetected + result.totalSuspected >= max;
        return {
          shouldStop: should,
          reason: should
            ? `Capability count (${result.totalDetected + result.totalSuspected}) >= max (${max})`
            : `Capability count (${result.totalDetected + result.totalSuspected}) < max (${max})`,
          condition,
        };
      }

      case 'diminishing_returns': {
        // Check if we're still getting high-confidence detections
        const highConfidence = result.capabilities.filter(c => c.confidence >= condition.minNewConfidence);
        const should = highConfidence.length === 0 && result.capabilities.length > 0;
        return {
          shouldStop: should,
          reason: should
            ? `No capabilities with confidence >= ${condition.minNewConfidence}`
            : `${highConfidence.length} capabilities with confidence >= ${condition.minNewConfidence}`,
          condition,
        };
      }

      case 'max_per_category': {
        const max = condition.max;
        const categoryCounts = this.countByCategory(result.capabilities);
        const exceeded = Object.entries(categoryCounts).find(([_, count]) => count >= max);
        if (exceeded) {
          return {
            shouldStop: true,
            reason: `Category "${exceeded[0]}" has ${exceeded[1]} capabilities >= max (${max})`,
            condition,
          };
        }
        return {
          shouldStop: false,
          reason: 'No category exceeds maximum',
          condition,
        };
      }

      case 'coverage_sufficient': {
        const categoriesWithDetected = new Set(
          result.capabilities.filter(c => c.status === 'detected').map(c => c.category),
        );
        const should = categoriesWithDetected.size >= condition.minCategoriesWithDetected;
        return {
          shouldStop: should,
          reason: should
            ? `${categoriesWithDetected.size} categories with detected capabilities >= ${condition.minCategoriesWithDetected}`
            : `${categoriesWithDetected.size} categories with detected capabilities < ${condition.minCategoriesWithDetected}`,
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

  private countByCategory(capabilities: { category: CapabilityCategory }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const cap of capabilities) {
      counts[cap.category] = (counts[cap.category] ?? 0) + 1;
    }
    return counts;
  }
}
