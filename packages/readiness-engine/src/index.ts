// ==========================================================================
// Kadarn Readiness Engine — Public API
// ==========================================================================
// KTP-1.2. Mission 3.
//
// Consumes Evidence Core. Computes readiness confidence from evidence graphs.
// AMB-3: evaluateClaim moved here from Evidence Core to preserve ADR-011 boundary.
// ==========================================================================

// Explainable Confidence Output
export { evaluateClaim, evaluateEvidenceGraph } from './output.js';
export type { ConfidenceReport, ContributionBreakdownItem } from './output.js';

// Evaluation Pipeline
export { EvaluationPipeline, aggregateContributions, projectConfidence } from './evaluation.js';
export type { EvidenceEvaluator, PipelineResult, ContributionDetails } from './evaluation.js';

// Evaluators
export {
  evidenceClassEvaluator,
  relationshipEvaluator,
  counterEvidenceEvaluator,
  temporalEvaluator,
  rightOfResponseEvaluator,
  visibilityEvaluator,
} from './evaluators.js';
export type { EvaluationContribution } from './evaluators.js';

// Hybrid Trial Evaluators (KTP-1.3)
export {
  selfReportCapEvaluator,
  evidenceExpiryEvaluator,
  notApplicableSkipEvaluator,
  hybridEvaluators,
} from './hybrid-evaluators.js';

// Readiness Evaluation Pipeline (KTP-1.3 Mission 4)
export { evaluateReadiness, persistReadinessEvaluation, determineReadinessStatus, computeOverallConfidence } from './readiness-evaluation.js';
export type {
  ReadinessStatus,
  CapabilityRequirement,
  EvidenceRequirement,
  CapabilityReadinessResult,
  ClaimAssessment,
  EvidenceGap,
  EvidenceSupport,
  ReadinessEvaluationResult,
  ReadinessEvaluationInput,
} from './readiness-evaluation.js';

// Sponsor Projection / Readiness Report (KTP-1.3 Mission 4)
export { projectReadinessReport } from './projection.js';
export type {
  ReadinessReport,
  ReadinessReportCapability,
  ReadinessReportGap,
  ReadinessReportSummary,
} from './projection.js';

// Frozen DTOs — Public API Contract (KTP-1.4 Mission 5)
export type {
  ReadinessSummary,
  ProgramReadiness,
  CapabilitySummary,
  CapabilityRequirement as CapabilityRequirementDTO,
  EvidenceRequirement as EvidenceRequirementDTO,
  EvidenceGap as EvidenceGapDTO,
  ReadinessEvaluation,
  ReadinessReport as ReadinessReportDTO,
  ReadinessStatus as DtoReadinessStatus,
} from './dto.js';

// Shared Readiness Helpers (KTP-1.3) — canonical source of truth for evidence support, filtering, met-checks
export {
  computeEvidenceSupportLevel,
  filterActiveClaims,
  isClaimMet,
} from './readiness-helpers.js';
export type { EvidenceSupportResult } from './readiness-helpers.js';
