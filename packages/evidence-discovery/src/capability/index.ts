// ==========================================================================
// Capability Detection — Public API
// ==========================================================================
// Sprint 20B.2.
// ==========================================================================

export { CapabilityDetector } from './engine';

export { CapabilityNormalizer } from './normalization';
export type { NormalizedCapability } from './normalization';

export { CapabilityGates } from './gates';
export type { GateResult, GateConfig, GatesConfig } from './gates';

export { StopConditionEvaluator } from './stop-conditions';
export type { StopCondition, StopConditionResult, StopConditionsConfig } from './stop-conditions';

export type {
  CandidateCapability,
  CapabilityCategory,
  CapabilityStatus,
  CapabilityDetectionResult,
} from './types';
