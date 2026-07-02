// ==========================================================================
// Claim Candidate Detection — Quality Gates
// ==========================================================================
// Sprint 20B.3.
//
// Quality gates filter claim candidates based on configurable thresholds.
// Ensures only sufficiently supported candidates pass through.
// No Claims. No Evidence Core writes. No promotion.
// ==========================================================================

import type { CandidateClaim } from './types.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface GateResult {
  gateId: string;
  passed: boolean;
  claimId: string;
  reason: string;
}

export interface GateConfig {
  /** Whether this gate is enabled */
  enabled: boolean;
  /** Gate parameters */
  params: Record<string, unknown>;
}

export interface ClaimsGateConfig {
  /** Minimum evidence coverage to pass */
  minCoverage: GateConfig;
  /** Minimum confidence to pass */
  minConfidence: GateConfig;
  /** Maximum missing evidence items allowed */
  maxMissingEvidence: GateConfig;
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

const DEFAULT_CONFIG: ClaimsGateConfig = {
  minCoverage: { enabled: true, params: { min: 0.3 } },
  minConfidence: { enabled: true, params: { min: 0.2 } },
  maxMissingEvidence: { enabled: false, params: { max: 5 } },
};

// --------------------------------------------------------------------------
// Gates
// --------------------------------------------------------------------------

export class ClaimGates {
  private config: ClaimsGateConfig;

  constructor(config?: Partial<ClaimsGateConfig>) {
    this.config = {
      minCoverage: { ...DEFAULT_CONFIG.minCoverage, ...config?.minCoverage },
      minConfidence: { ...DEFAULT_CONFIG.minConfidence, ...config?.minConfidence },
      maxMissingEvidence: { ...DEFAULT_CONFIG.maxMissingEvidence, ...config?.maxMissingEvidence },
    };
  }

  /** Run all enabled gates against a claim candidate */
  evaluate(candidate: CandidateClaim): GateResult[] {
    const results: GateResult[] = [];

    // Gate 1: Minimum evidence coverage
    if (this.config.minCoverage.enabled) {
      const min = (this.config.minCoverage.params.min as number) ?? 0.3;
      results.push({
        gateId: 'min_coverage',
        passed: candidate.evidenceCoverage >= min,
        claimId: candidate.claimId,
        reason: candidate.evidenceCoverage >= min
          ? `Evidence coverage ${(candidate.evidenceCoverage * 100).toFixed(0)}% ≥ ${(min * 100).toFixed(0)}%`
          : `Evidence coverage ${(candidate.evidenceCoverage * 100).toFixed(0)}% < ${(min * 100).toFixed(0)}%`,
      });
    }

    // Gate 2: Minimum confidence
    if (this.config.minConfidence.enabled) {
      const min = (this.config.minConfidence.params.min as number) ?? 0.2;
      results.push({
        gateId: 'min_confidence',
        passed: candidate.confidence >= min,
        claimId: candidate.claimId,
        reason: candidate.confidence >= min
          ? `Confidence ${(candidate.confidence * 100).toFixed(0)}% ≥ ${(min * 100).toFixed(0)}%`
          : `Confidence ${(candidate.confidence * 100).toFixed(0)}% < ${(min * 100).toFixed(0)}%`,
      });
    }

    // Gate 3: Max missing evidence items
    if (this.config.maxMissingEvidence.enabled) {
      const max = (this.config.maxMissingEvidence.params.max as number) ?? 5;
      results.push({
        gateId: 'max_missing_evidence',
        passed: candidate.missingEvidence.length <= max,
        claimId: candidate.claimId,
        reason: candidate.missingEvidence.length <= max
          ? `${candidate.missingEvidence.length} missing items ≤ ${max}`
          : `${candidate.missingEvidence.length} missing items > ${max}`,
      });
    }

    return results;
  }

  /** Check if a candidate passes all enabled gates */
  passesAll(candidate: CandidateClaim): boolean {
    return this.evaluate(candidate).every(r => r.passed);
  }

  /** Filter candidates, keeping only those that pass all enabled gates */
  filter(candidates: CandidateClaim[]): CandidateClaim[] {
    return candidates.filter(c => this.passesAll(c));
  }
}
