// ==========================================================================
// Claim Candidate Detection — Public API
// ==========================================================================
// Sprint 20B.3.
// ==========================================================================

export { ClaimCandidateDetector } from './detector';

export { ClaimMappingRegistry } from './mapping';
export type { ClaimMappingRule } from './mapping';

export { ClaimGates } from './gates';
export type { GateResult, GateConfig, ClaimsGateConfig } from './gates';

export { ClaimStopConditionEvaluator } from './stop-conditions';
export type { ClaimStopCondition, StopConditionResult, StopConditionsConfig } from './stop-conditions';

export type {
  CandidateClaim,
  MissingEvidenceItem,
  ClaimStatus,
  ClaimCandidateDetectionResult,
} from './types';
