// ==========================================================================
// Evidence Discovery — Public API
// ==========================================================================
// Sprint 20A.1.
// ==========================================================================

export { executeTransition, createCandidate, assertState, isTerminal, executeTransitionSequence, StateMachineError } from './state-machine';
export {
  createSession,
  createRun,
  createArtifact,
  createLayer1,
  createCandidate as persistCandidate,
  createTransitionEvent,
  getCandidateById,
  getTransitionEvents,
  getCandidatesByRun,
  updateCandidateState,
} from './repository';
export type { DbClient } from './repository';
export { CapabilityDetector, CapabilityNormalizer, CapabilityGates, StopConditionEvaluator } from './capability/index';

export { ClaimCandidateDetector, ClaimMappingRegistry, ClaimGates, ClaimStopConditionEvaluator } from './claim-candidate/index';
export { agentOutputsToLineageExtraction } from './lineage/agent-output-mapper';
export type { AgentOutputMap, LineageExtractionInput } from './lineage/agent-output-mapper';
export { EvidenceGapDetector } from './gap-detection/index';
export type { EvidenceGap, RecommendedEvidence, GapAnalysisResult, GapAnalysisReport } from './gap-detection/index';
export type { GapSeverity as DetectionGapSeverity, GapCategory as DetectionGapCategory } from './gap-detection/index';
export { NarrativeEngine } from './narrative/index';
export type { InstitutionalNarrative, NarrativeSection, NarrativeParagraph, NarrativeCitation, NarrativeSectionType } from './narrative/index';
export { ProfileBuilder } from './profile/index';
export type { InstitutionalProfile, ProfileSummary, ProfileStatus } from './profile/index';
export { DiscoveryUXOrchestrator, DEFAULT_UX_CONFIG, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from './discovery-ux/index';
export { CapabilityIntelligenceEngine } from './capability-intelligence/index';
export type {
  CapabilityEntry,
  CapabilityIntelligence,
  CapabilityIntelligenceInput,
  CapabilityStatus as IntelligenceCapabilityStatus,
  CapabilitySummary as IntelligenceCapabilitySummary,
  CapabilityCategory as IntelligenceCapabilityCategory,
  ResearchAssetLabel as IntelligenceResearchAssetLabel,
} from './capability-intelligence/index';
export { EvidenceGapIntelligenceEngine } from './evidence-gap-intelligence/index';
export type {
  EvidenceGapEntry,
  EvidenceGapIntelligence,
  GapCategory,
  GapIntelligenceInput,
  GapReviewStatus,
  GapSeverity,
  GapSummary,
} from './evidence-gap-intelligence/index';
export { InstitutionalCapabilityAssessmentEngine } from './institutional-capability-assessment/index';
export type {
  AssessmentInput,
  AssessmentStatus,
  AssessmentSummary,
  CapabilityAssessmentEntry,
  DashboardPriority,
  InstitutionCapabilityAssessment,
  OperationalMaturity,
  RecommendedAction,
  SponsorRelevance,
} from './institutional-capability-assessment/index';
export { SponsorReadinessEngine } from './sponsor-readiness/index';
export type {
  SponsorReadiness,
  SponsorReadinessInput,
  SponsorReadinessLabel,
} from './sponsor-readiness/index';
export { RecommendationEngine } from './recommendation-engine/index';
export type {
  Recommendation,
  RecommendationCategory,
  RecommendationEngineOutput,
  RecommendationInput,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationSummary,
  SourceEngine,
} from './recommendation-engine/index';
export { InstitutionRecognitionReportGenerator } from './recognition-report/index';
export type {
  CapabilitySection,
  EvidenceGapSection,
  EvidenceHighlight,
  InstitutionOverview,
  InstitutionRecognitionReport,
  RecommendationSection,
  ReportAppendix,
  ReportInput,
  ResearchAssetSection,
  SponsorReadinessSection,
} from './recognition-report/index';
export { ContinuousMonitoringOrchestrator } from './continuous-monitoring/index';
export type {
  MonitoringSource,
  MonitoringState,
  RefreshResult,
  RefreshStatus,
  SourceChange,
} from './continuous-monitoring/index';
export { NotificationCenter } from './notification-center/index';
export type {
  Notification,
  NotificationCategory,
  NotificationFeed,
  NotificationStatus,
} from './notification-center/index';

// ==========================================================================
// Connector Layer (Sprint 23A)
// ==========================================================================
export { BaseConnectorAdapter, ConnectorRegistry, connectorRegistry } from './connectors/index';
export type {
  ConnectorAdapter,
  ConnectorHealth,
  ConnectorHealthStatus,
  ConnectorMetadata,
  ConnectorRegistryEntry,
  ConnectorResponse,
  ProviderId,
} from './connectors/index';

// ==========================================================================
// Identity Resolution Engine (Sprint 23B)
// ==========================================================================
export { IdentityResolutionEngine } from './identity-resolution/index';
export type {
  AffiliationEntry,
  CanonicalIdentity,
  EntityType,
  ExternalIdSource,
  ExternalIdentifier,
  IdentityAlias,
  IdentityMatch,
  IdentityState,
  IdentityTimelineEvent,
  ResolutionInput,
  ReviewItem as IdentityReviewItem,
} from './identity-resolution/index';

// ==========================================================================
// Evidence Firewall (Sprint 23C)
// ==========================================================================
export { EvidenceFirewall } from './evidence-firewall/index';
export type {
  EvidencePayload,
  EvidenceQuarantineEntry,
  FirewallDecision,
  FirewallDecisionOutput,
  FirewallReviewItem,
  FirewallStatus,
  FirewallValidationResult,
  ValidationRule,
} from './evidence-firewall/index';

// ==========================================================================
// Governance & Explainability (Sprint 23D)
// ==========================================================================
export { GovernanceExplainabilityService } from './governance/index';
export type {
  EngineId,
  EngineVersion,
  ExplainabilityRecord,
  GovernanceDomain,
  GovernanceVersion,
} from './governance/index';

// ==========================================================================
// Private Evidence Layer (Sprint 23E)
// ==========================================================================
export { PrivateEvidenceService } from './private-evidence/index';
export type {
  AuthorizationState,
  EvidenceVisibility,
  PrivateEvidenceRecord,
  ViewerRole,
  VisibilitySummary,
} from './private-evidence/index';

// ==========================================================================
// Visibility Policy Engine (Sprint 24A — Phase 5)
// ==========================================================================
export { VisibilityPolicyEngine } from './visibility-policy/index';
export type {
  ActorType,
  VisibilityLevel,
  VisibilityPolicy,
  VisibilityResolution,
} from './visibility-policy/index';

// ==========================================================================
// Capability Graph (Sprint 24B — Phase 5)
// ==========================================================================
export { CapabilityGraphEngine } from './capability-graph/index';
export type {
  AnonymousInstitutionResult,
  CapabilityGraphResult,
  CapabilityQuery,
  InstitutionRecord,
} from './capability-graph/index';

// ==========================================================================
// Discovery Workspace (Sprint 24C — Phase 5)
// ==========================================================================
export { DiscoveryWorkspaceEngine } from './discovery-workspace/index';
export type {
  CompatibilitySummary,
  DiscoveryWorkspace,
  WorkspaceInput,
  WorkspaceStatus,
} from './discovery-workspace/index';

// ==========================================================================
// Opportunity Brief Engine (Sprint 24D — Phase 5)
// ==========================================================================
export { OpportunityBriefGenerator } from './opportunity-brief/index';
export type {
  BriefStatus,
  OpportunityBrief,
  SiteDecision,
  SponsorDisplayMode,
  VisibilityAccessRequest,
} from './opportunity-brief/index';

// ==========================================================================
// Institutional Consent Engine (Sprint 24E — Phase 5)
// ==========================================================================
export { InstitutionalConsentEngine } from './institutional-consent/index';
export type {
  AuditEvent,
  AuthorizationState as ConsentAuthorizationState,
  ConsentPurpose,
  ConsentScope,
  InstitutionalConsent,
} from './institutional-consent/index';

// ==========================================================================
// Feasibility Passport (Sprint 24F — Phase 5)
// ==========================================================================
export { FeasibilityPassportEngine } from './feasibility-passport/index';
export type {
  CollaborationWorkspace,
  FeasibilityPassport,
  MutualReveal,
  PassportCapability,
  RevealStatus,
  WorkspaceSection,
} from './feasibility-passport/index';
export type {
  DiscoveryPhase,
  DiscoveryPhaseStatus,
  DiscoveryUXEvent,
  DiscoveryUXState,
  DiscoveryUXConfig,
  UXMessage,
  UXMessageType,
  ReviewAction,
  ReviewItem,
  ReviewedItem,
  PipelineStage,
} from './discovery-ux/index';
export type {
  CandidateClaim,
  MissingEvidenceItem,
  ClaimStatus,
  ClaimCandidateDetectionResult,
  ClaimMappingRule,
  GateResult as ClaimGateResult,
  GateConfig as ClaimGateConfig,
  ClaimsGateConfig,
  ClaimStopCondition,
  StopConditionResult as ClaimStopConditionResult,
  StopConditionsConfig as ClaimStopConditionsConfig,
} from './claim-candidate/index';
export type {
  CandidateCapability,
  CapabilityCategory,
  CapabilityStatus,
  CapabilityDetectionResult,
  NormalizedCapability,
  GateResult,
  GateConfig,
  GatesConfig,
  StopCondition,
  StopConditionResult,
  StopConditionsConfig,
} from './capability/index';
export { TimelineEngine } from './timeline/index';
export type { InstitutionalTimeline, TimelineEvent, TimelineDate, DatePrecision, EventCategory } from './timeline/index';
export { CurationService, CurationError, ALL_CURATION_ACTIONS } from './curation/index';
export type { CurationAction, CurationTargetType, CurationEvent, CurationRequest } from './curation/index';
export { SnapshotBuilder } from './snapshot';
export type { InstitutionalEvidenceSnapshot, SnapshotSummary, SnapshotDocumentInventoryItem, SnapshotEntityGroup, SnapshotRelationshipItem, SnapshotTimelineEvent, SnapshotUncertaintyItem, SnapshotNextBestAction } from './snapshot';
export { DiscoveryOrchestrator } from './orchestrator';
export type { DiscoveryResult, DiscoveryArtifactInfo, DocumentClassification, Entity, Relationship, OrchestratorStores } from './orchestrator';
export { AgentRegistry, AgentRunner, DocumentClassifierAgent, EntityExtractorAgent, RelationshipExtractorAgent } from './agents/index';
export type { DiscoveryAgent, AgentContext, AgentResult, AgentProvenance, AgentResultStatus, DocumentType, ClassifierOutput } from './agents/index';
export { createRequest, transitionRequest, InvalidRequestTransitionError, ALL_REQUEST_TYPES, ALLOWED_REQUEST_TRANSITIONS, insertRequest, updateRequestStatus, getPendingRequests, getRequestById, getRequestsByRun } from './preparation/index';
export type { SemanticExtractionRequest, SemanticRequestType, SemanticRequestStatus, RequestPriority } from './preparation/index';
export { ALLOWED_TRANSITIONS } from './types';
export type {
  Layer0Artifact,
  Layer1Markdown,
  DiscoveryState,
  TerminalState,
  TransitionEvent,
  EvidenceCandidate,
  ClaimCandidate,
  ProvenanceEntry,
  ProvenanceStepType,
  EvidenceSnapshot,
  TimelineEvent as CoreTimelineEvent,
  ArtifactType,
  EvidenceClass,
} from './types';
