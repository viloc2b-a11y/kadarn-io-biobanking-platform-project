// ==========================================================================
// Capability Detection — Public API
// ==========================================================================
// Sprint 20B.2.
// ==========================================================================

export { CapabilityDetector } from './engine.js';

export { CapabilityNormalizer } from './normalization.js';
export type { NormalizedCapability } from './normalization.js';

export { CapabilityGates } from './gates.js';
export type { GateResult, GateConfig, GatesConfig } from './gates.js';

export { StopConditionEvaluator } from './stop-conditions.js';
export type { StopCondition, StopConditionResult, StopConditionsConfig } from './stop-conditions.js';

export type {
  CandidateCapability,
  CapabilityCategory,
  CapabilityStatus,
  CapabilityDetectionResult,
} from './types.js';
