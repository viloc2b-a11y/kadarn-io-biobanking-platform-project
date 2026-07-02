// ==========================================================================
// Capability Detection — Quality Gates
// ==========================================================================
// Sprint 20B.2.
//
// Quality gates filter detected capabilities based on configurable thresholds.
// Ensures only sufficiently supported capabilities pass through.
// No Claims. No Evidence Core modification. No promotion.
// ==========================================================================

import type { CandidateCapability } from './types.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface GateResult {
  gateId: string;
  passed: boolean;
  capabilityId: string;
  reason: string;
}

export interface GateConfig {
  /** Whether this gate is enabled */
  enabled: boolean;
  /** Gate parameters */
  params: Record<string, unknown>;
}

export interface GatesConfig {
  /** Minimum confidence to pass detection */
  minConfidence: GateConfig;
  /** Minimum number of supporting entities */
  minSupportingEntities: GateConfig;
  /** Maximum capabilities per category */
  maxPerCategory: GateConfig;
  /** Require at least 1 artifact */
  requireArtifact: GateConfig;
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

const DEFAULT_CONFIG: GatesConfig = {
  minConfidence: { enabled: true, params: { min: 0.3 } },
  minSupportingEntities: { enabled: false, params: { min: 1 } },
  maxPerCategory: { enabled: false, params: { max: 10 } },
  requireArtifact: { enabled: true, params: {} },
};

// --------------------------------------------------------------------------
// Gates
// --------------------------------------------------------------------------

export class CapabilityGates {
  private config: GatesConfig;

  constructor(config?: Partial<GatesConfig>) {
    this.config = {
      minConfidence: { ...DEFAULT_CONFIG.minConfidence, ...config?.minConfidence },
      minSupportingEntities: { ...DEFAULT_CONFIG.minSupportingEntities, ...config?.minSupportingEntities },
      maxPerCategory: { ...DEFAULT_CONFIG.maxPerCategory, ...config?.maxPerCategory },
      requireArtifact: { ...DEFAULT_CONFIG.requireArtifact, ...config?.requireArtifact },
    };
  }

  /** Run all enabled gates against a capability */
  evaluate(capability: CandidateCapability): GateResult[] {
    const results: GateResult[] = [];

    // Gate 1: Minimum confidence
    if (this.config.minConfidence.enabled) {
      const min = (this.config.minConfidence.params.min as number) ?? 0.3;
      results.push({
        gateId: 'min_confidence',
        passed: capability.confidence >= min,
        capabilityId: capability.capabilityId,
        reason: capability.confidence >= min
          ? `Confidence ${capability.confidence} ≥ ${min}`
          : `Confidence ${capability.confidence} < ${min}`,
      });
    }

    // Gate 2: Minimum supporting entities
    if (this.config.minSupportingEntities.enabled) {
      const min = (this.config.minSupportingEntities.params.min as number) ?? 1;
      results.push({
        gateId: 'min_supporting_entities',
        passed: capability.supportingEntityIds.length >= min,
        capabilityId: capability.capabilityId,
        reason: capability.supportingEntityIds.length >= min
          ? `${capability.supportingEntityIds.length} supporting entities ≥ ${min}`
          : `${capability.supportingEntityIds.length} supporting entities < ${min}`,
      });
    }

    // Gate 3: Require at least one artifact
    if (this.config.requireArtifact.enabled) {
      results.push({
        gateId: 'require_artifact',
        passed: capability.supportingArtifactIds.length > 0,
        capabilityId: capability.capabilityId,
        reason: capability.supportingArtifactIds.length > 0
          ? `${capability.supportingArtifactIds.length} supporting artifact(s)`
          : 'No supporting artifacts',
      });
    }

    return results;
  }

  /** Check if a capability passes all enabled gates */
  passesAll(capability: CandidateCapability): boolean {
    const results = this.evaluate(capability);
    return results.every(r => r.passed);
  }

  /** Filter capabilities, keeping only those that pass all enabled gates */
  filter(capabilities: CandidateCapability[]): CandidateCapability[] {
    return capabilities.filter(c => this.passesAll(c));
  }
}
