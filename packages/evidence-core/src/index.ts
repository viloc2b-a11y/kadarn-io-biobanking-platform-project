// ==========================================================================
// Kadarn Evidence Core — Public API
// ==========================================================================
// Baseline AF-1.0. Sprint 17.1.
// ==========================================================================

// Types
export type {
  TemporalMetadata,
  ProvenanceMetadata,
  VisibilityScope,
  VisibilityMetadata,
  EvidenceNodeStatus,
  EvidenceNode,
  ClaimStatus,
  Claim,
  RelationshipType,
  EvidenceRelationship,
  CounterEvidence,
  RightOfResponse,
} from './types.js';

// Evidence Class
export { EvidenceClass, EVIDENCE_CLASS_NAMES, EVIDENCE_CLASS_DESCRIPTIONS, EVIDENCE_CLASS_DECAY_MONTHS, EVIDENCE_CLASS_DEFAULT_WEIGHT } from './evidence-class.js';

// Confidence State (type only — no computation)
export type { ConfidenceLevel, ConfidenceContribution, ConfidenceState } from './confidence-state.js';

// Claim (domain model — internal. Use lifecycle.createClaim for service-level)
export { isClaimActive, validateClaimBoundedness, validateClaimEvidenceClasses, validateClaimContradictable } from './claim.js';

// Evidence Node
export { createEvidenceNode, assertEvidenceNodeImmutable, validateEvidenceNodeWeight, validateNodeHasClaim } from './evidence-node.js';

// Evidence Relationship
export { createRelationship, validateRelationshipNoSelfReference } from './evidence-relationship.js';

// Counter Evidence
export { createCounterEvidence, attachResponse, validateCounterEvidenceWeight, assertCounterEvidenceIsImmutable } from './counter-evidence.js';

// Right of Response
export { createRightOfResponse, validateResponseHasCounterEvidence } from './right-of-response.js';

// Evidence Graph
export { createEmptyGraph } from './evidence-graph.js';
export type { EvidenceGraph } from './evidence-graph.js';

// Provenance
export { createProvenance } from './provenance.js';

// Visibility
export { siteVisibility, sponsorAuthorizedVisibility, systemVisibility } from './visibility.js';

// Temporal
export { createTemporal } from './temporal.js';

// Invariants
export { validateClaim } from './invariants.js';
export type { InvariantResult } from './invariants.js';

// Audit (Sprint 17.3)
export { recordAuditEntry, createAuditEntry } from './audit.js';
export type { AuditAction, AuditEntry } from './audit.js';

// Lifecycle (Sprint 17.3)
export {
  createClaim,
  submitEvidence,
  linkEvidenceToClaim,
  submitCounterEvidence,
  submitRightOfResponse,
  updateProcessState,
} from './lifecycle.js';
export type {
  ActorContext,
  CreateClaimCommand,
  SubmitEvidenceCommand,
  SubmitCounterEvidenceCommand,
  SubmitResponseCommand,
  ProcessStateUpdate,
} from './lifecycle.js';

// Boundary (Sprint 17.4)
export {
  testBoundary,
  isForbiddenInCore,
  assertNotForbiddenInCore,
  registerCoreFunction,
  getCoreFunctions,
  verifyCoreBoundary,
  FORBIDDEN_CORE_OPERATIONS,
} from './boundary.js';
export type { BoundaryTestResult, BoundaryCondition, CoreFunctionEntry, ForbiddenCoreOperation } from './boundary.js';

// DB + Repository (Sprint 17.2)
export type { DbClient, DbClientFactory } from './db.js';
export {
  insertClaim,
  getClaimById,
  getClaimsByOrganizationId,
  getOrganizationEvidenceRead,
  insertEvidenceNode,
  getEvidenceNodesByClaim,
  getEvidenceNodesByClaimIds,
  insertCounterEvidence,
  insertRightOfResponse,
  insertRelationship,
} from './repository.js';
export type {
  CreateClaimInput,
  CreateEvidenceNodeInput,
  CreateCounterEvidenceInput,
  CreateRightOfResponseInput,
  CreateRelationshipInput,
  OrganizationEvidenceRead,
} from './repository.js';

// API Contracts (Sprint 17.5)
export {
  apiCreateClaim,
  apiSubmitEvidence,
  apiSubmitCounterEvidence,
  apiSubmitResponse,
  apiCreateRelationship,
  apiUpdateProcessState,
  apiGetClaim,
  apiGetClaimEvidence,
} from './api.js';
export type {
  ApiCreateClaimInput,
  ApiSubmitEvidenceInput,
  ApiCounterEvidenceInput,
  ApiSubmitResponseInput,
  ApiCreateRelationshipInput,
  ApiUpdateProcessStateInput,
  ApiQueryClaimInput,
  ApiQueryEvidenceInput,
} from './api.js';

// Connector Framework (Sprint 19.4A)
export { ConnectorOrchestrator, withRetry, RateLimiter, buildProvenance, InMemoryIdempotencyStore, MetricsCollector, DEFAULT_RETRY_POLICY, SOURCE_RATE_LIMITS } from './connectors/framework/index.js';
export type { EvidenceConnector, ConnectorManifest, ConnectorSearchParams, ExternalRecord, NormalizedRecord, ConnectorIngestResult, ConnectorLogEntry, OrchestratorDeps, RetryPolicy, RateLimitConfig, IdempotencyStore, ProvenanceInput, BuiltProvenance, ConnectorMetrics } from './connectors/framework/index.js';

// FDA Connector (Sprint 19.3)
export { ingestFDA, createMockFDAClient, createFDAClient, createFDAAdapter, FDA_MANIFEST } from './connectors/fda/index.js';
export type { FDAApiClient, FDAInspection, FDAForm483, FDAWarningLetter, FDAIngestionResult } from './connectors/fda/index.js';

// PubMed Connector (Sprint 19.2)
export { ingestPubMed, createMockPubMedClient, createPubMedClient, mapArticleToClaims, createPubMedAdapter, PUBMED_MANIFEST } from './connectors/pubmed/index.js';
export type { PubMedArticle, PubMedSearchParams, PubMedIngestionResult, IngestedArticle } from './connectors/pubmed/index.js';

// ClinicalTrials.gov Connector (Sprint 19.1)
export { ingestClinicalTrials, createMockClient, createCTGovClient, mapStudyToClaims, createCTGovAdapter, CTGOV_MANIFEST } from './connectors/clinicaltrials/index.js';
export type { CTGovStudy, CTGovSearchParams, CTGovIngestionResult, IngestedStudy, UnresolvedStudy, IdentityResolver, EvidenceNodeCreator, UnresolvedStager, DuplicateChecker } from './connectors/clinicaltrials/index.js';

// Identity Resolution (Sprint 19.0)
export {
  resolveIdentity,
  resolveTier1,
  resolveTier2,
  resolveTier3,
  resolveTier4,
  normalizeName,
  normalizeForMatching,
  expandAbbreviations,
  detectConflicts,
  requireSiteId,
  detectMergeCandidates,
  detectSplitCandidates,
  requireKadarnId,
} from './identity/index.js';
export type {
  InstitutionIdentity,
  ExternalIdentifier,
  ExternalIdentifierType,
  UnresolvedIdentity,
  IdentityResolution,
  IdentityConflict,
  MergeCandidate,
  SplitCandidate,
  IdentityPipelineResult,
  IdentityStatus,
  IdentityTier,
  SiteIdentity,
  SiteStatus,
  InstitutionAlias,
  IdentityConfidence,
  ExternalIdentifierHistoryEntry,
  IdentifierHistoryEvent,
} from './identity/index.js';

    // Explainable Output — MOVED to @kadarn/readiness-engine (AMB-3 / ADR-011)
    // @deprecated Import from @kadarn/readiness-engine instead.
    // These re-exports will be removed in Mission 3.
    export { evaluateClaim, evaluateEvidenceGraph } from '@kadarn/readiness-engine';
    export type { ConfidenceReport, ContributionBreakdownItem } from '@kadarn/readiness-engine';
export { DEFAULT_EVALUATION_POLICY, getClassContribution, getClassPolicy } from './policy.js';
export type { ClassContributionPolicy } from './policy.js';

// Evaluation Pipeline (Sprint 18.3)
export { EvaluationPipeline, aggregateContributions, projectConfidence } from './evaluation.js';
export type { EvidenceEvaluator, PipelineResult, ContributionDetails } from './evaluation.js';

// Evaluators (Sprint 18.3)
export {
  evidenceClassEvaluator,
  relationshipEvaluator,
  counterEvidenceEvaluator,
  temporalEvaluator,
  rightOfResponseEvaluator,
  visibilityEvaluator,
} from './evaluators.js';
export type { EvaluationContribution } from './evaluators.js';

// Graph Traversal (Sprint 18.2)
export {
  createGraphStore,
  addNode,
  addEdge,
  buildGraphFromData,
  getEvidenceGraph,
  getClaimEvidence,
  getSupportingEvidence,
  getContradictingEvidence,
  getResponseChain,
  getEvidenceLineage,
  getTemporalHistory,
  getRelationshipGraph,
  findDisconnectedNodes,
  findCycles,
  findBrokenReferences,
  validateGraphIntegrity,
} from './graph.js';
export type {
  GraphNode,
  GraphNodeType,
  GraphEdge,
  GraphStore,
  LineageEntry,
  GraphIntegrityReport,
} from './graph.js';

// Explainability Framework (Sprint 18.1)
export {
  createSkeletonEvaluation,
} from './explainability.js';
export type {
  EvaluationResult,
  Explanation,
  EvidenceContribution,
  RelationshipContribution,
  CounterEvidenceContribution,
  TemporalContribution,
  ResponseContribution,
  OmittedEvidence,
  EvidenceOmissionReason,
} from './explainability.js';