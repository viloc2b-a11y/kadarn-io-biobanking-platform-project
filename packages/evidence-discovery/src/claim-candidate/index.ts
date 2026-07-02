// ==========================================================================
// Claim Candidate Detection — Public API
// ==========================================================================
// Sprint 20B.3.
// ==========================================================================

export { ClaimCandidateDetector } from './detector.js';

export { ClaimMappingRegistry } from './mapping.js';
export type { ClaimMappingRule } from './mapping.js';

export { ClaimGates } from './gates.js';
export type { GateResult, GateConfig, ClaimsGateConfig } from './gates.js';

export { ClaimStopConditionEvaluator } from './stop-conditions.js';
export type { ClaimStopCondition, StopConditionResult, StopConditionsConfig } from './stop-conditions.js';

export type {
  CandidateClaim,
  MissingEvidenceItem,
  ClaimStatus,
  ClaimCandidateDetectionResult,
} from './types.js';
