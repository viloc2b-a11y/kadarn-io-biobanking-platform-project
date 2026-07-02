// ==========================================================================
// Evidence Discovery — Public API
// ==========================================================================
// Sprint 20A.1.
// ==========================================================================

export { executeTransition, createCandidate, assertState, isTerminal, executeTransitionSequence, StateMachineError } from './state-machine.js';
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
} from './repository.js';
export type { DbClient } from './repository.js';
export { CapabilityDetector, CapabilityNormalizer, CapabilityGates, StopConditionEvaluator } from './capability/index.js';

export { ClaimCandidateDetector, ClaimMappingRegistry, ClaimGates, ClaimStopConditionEvaluator } from './claim-candidate/index.js';
export { EvidenceGapDetector } from './gap-detection/index.js';
export type { EvidenceGap, RecommendedEvidence, GapAnalysisResult, GapAnalysisReport, GapSeverity, GapCategory } from './gap-detection/index.js';
export { NarrativeEngine } from './narrative/index.js';
export type { InstitutionalNarrative, NarrativeSection, NarrativeParagraph, NarrativeCitation, NarrativeSectionType } from './narrative/index.js';
export { ProfileBuilder } from './profile/index.js';
export type { InstitutionalProfile, ProfileSummary, ProfileStatus } from './profile/index.js';
export { DiscoveryUXOrchestrator, DEFAULT_UX_CONFIG, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from './discovery-ux/index.js';
export { CapabilityIntelligenceEngine } from './capability-intelligence/index.js';
export type {
  CapabilityEntry,
  CapabilityIntelligence,
  CapabilityIntelligenceInput,
  CapabilityStatus as IntelligenceCapabilityStatus,
  CapabilitySummary as IntelligenceCapabilitySummary,
  CapabilityCategory as IntelligenceCapabilityCategory,
  ResearchAssetLabel as IntelligenceResearchAssetLabel,
} from './capability-intelligence/index.js';
export { EvidenceGapIntelligenceEngine } from './evidence-gap-intelligence/index.js';
export type {
  EvidenceGapEntry,
  EvidenceGapIntelligence,
  GapCategory,
  GapIntelligenceInput,
  GapReviewStatus,
  GapSeverity,
  GapSummary,
} from './evidence-gap-intelligence/index.js';
export { InstitutionalCapabilityAssessmentEngine } from './institutional-capability-assessment/index.js';
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
} from './institutional-capability-assessment/index.js';
export { SponsorReadinessEngine } from './sponsor-readiness/index.js';
export type {
  SponsorReadiness,
  SponsorReadinessInput,
  SponsorReadinessLabel,
} from './sponsor-readiness/index.js';
export { RecommendationEngine } from './recommendation-engine/index.js';
export type {
  Recommendation,
  RecommendationCategory,
  RecommendationEngineOutput,
  RecommendationInput,
  RecommendationPriority,
  RecommendationStatus,
  RecommendationSummary,
  SourceEngine,
} from './recommendation-engine/index.js';
export { InstitutionRecognitionReportGenerator } from './recognition-report/index.js';
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
} from './recognition-report/index.js';
export { ContinuousMonitoringOrchestrator } from './continuous-monitoring/index.js';
export type {
  MonitoringSource,
  MonitoringState,
  RefreshResult,
  RefreshStatus,
  SourceChange,
} from './continuous-monitoring/index.js';
export { NotificationCenter } from './notification-center/index.js';
export type {
  Notification,
  NotificationCategory,
  NotificationFeed,
  NotificationStatus,
} from './notification-center/index.js';

// ==========================================================================
// Connector Layer (Sprint 23A)
// ==========================================================================
export { BaseConnectorAdapter, ConnectorRegistry, connectorRegistry } from './connectors/index.js';
export type {
  ConnectorAdapter,
  ConnectorHealth,
  ConnectorHealthStatus,
  ConnectorMetadata,
  ConnectorRegistryEntry,
  ConnectorResponse,
  ProviderId,
} from './connectors/index.js';

// ==========================================================================
// Identity Resolution Engine (Sprint 23B)
// ==========================================================================
export { IdentityResolutionEngine } from './identity-resolution/index.js';
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
  ReviewItem,
} from './identity-resolution/index.js';

// ==========================================================================
// Evidence Firewall (Sprint 23C)
// ==========================================================================
export { EvidenceFirewall } from './evidence-firewall/index.js';
export type {
  EvidencePayload,
  EvidenceQuarantineEntry,
  FirewallDecision,
  FirewallDecisionOutput,
  FirewallReviewItem,
  FirewallStatus,
  FirewallValidationResult,
  ValidationRule,
} from './evidence-firewall/index.js';

// ==========================================================================
// Governance & Explainability (Sprint 23D)
// ==========================================================================
export { GovernanceExplainabilityService } from './governance/index.js';
export type {
  EngineId,
  EngineVersion,
  ExplainabilityRecord,
  GovernanceDomain,
  GovernanceVersion,
} from './governance/index.js';

// ==========================================================================
// Private Evidence Layer (Sprint 23E)
// ==========================================================================
export { PrivateEvidenceService } from './private-evidence/index.js';
export type {
  AuthorizationState,
  EvidenceVisibility,
  PrivateEvidenceRecord,
  ViewerRole,
  VisibilitySummary,
} from './private-evidence/index.js';

// ==========================================================================
// Visibility Policy Engine (Sprint 24A — Phase 5)
// ==========================================================================
export { VisibilityPolicyEngine } from './visibility-policy/index.js';
export type {
  ActorType,
  VisibilityLevel,
  VisibilityPolicy,
  VisibilityResolution,
} from './visibility-policy/index.js';

// ==========================================================================
// Capability Graph (Sprint 24B — Phase 5)
// ==========================================================================
export { CapabilityGraphEngine } from './capability-graph/index.js';
export type {
  AnonymousInstitutionResult,
  CapabilityGraphResult,
  CapabilityQuery,
  InstitutionRecord,
} from './capability-graph/index.js';

// ==========================================================================
// Discovery Workspace (Sprint 24C — Phase 5)
// ==========================================================================
export { DiscoveryWorkspaceEngine } from './discovery-workspace/index.js';
export type {
  CompatibilitySummary,
  DiscoveryWorkspace,
  WorkspaceInput,
  WorkspaceStatus,
} from './discovery-workspace/index.js';

// ==========================================================================
// Opportunity Brief Engine (Sprint 24D — Phase 5)
// ==========================================================================
export { OpportunityBriefGenerator } from './opportunity-brief/index.js';
export type {
  BriefStatus,
  OpportunityBrief,
  SiteDecision,
  SponsorDisplayMode,
  VisibilityAccessRequest,
} from './opportunity-brief/index.js';

// ==========================================================================
// Institutional Consent Engine (Sprint 24E — Phase 5)
// ==========================================================================
export { InstitutionalConsentEngine } from './institutional-consent/index.js';
export type {
  AuditEvent,
  AuthorizationState,
  ConsentPurpose,
  ConsentScope,
  InstitutionalConsent,
} from './institutional-consent/index.js';

// ==========================================================================
// Feasibility Passport (Sprint 24F — Phase 5)
// ==========================================================================
export { FeasibilityPassportEngine } from './feasibility-passport/index.js';
export type {
  CollaborationWorkspace,
  FeasibilityPassport,
  MutualReveal,
  PassportCapability,
  RevealStatus,
  WorkspaceSection,
} from './feasibility-passport/index.js';
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
} from './discovery-ux/index.js';
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
} from './claim-candidate/index.js';
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
} from './capability/index.js';
export { TimelineEngine } from './timeline/index.js';
export type { InstitutionalTimeline, TimelineEvent, TimelineDate, DatePrecision, EventCategory } from './timeline/index.js';
export { CurationService, CurationError, ALL_CURATION_ACTIONS } from './curation/index.js';
export type { CurationAction, CurationTargetType, CurationEvent, CurationRequest } from './curation/index.js';
export { SnapshotBuilder } from './snapshot.js';
export type { InstitutionalEvidenceSnapshot, SnapshotSummary, SnapshotDocumentInventoryItem, SnapshotEntityGroup, SnapshotRelationshipItem, SnapshotTimelineEvent, SnapshotUncertaintyItem, SnapshotNextBestAction } from './snapshot.js';
export { DiscoveryOrchestrator } from './orchestrator.js';
export type { DiscoveryResult, DiscoveryArtifactInfo, DocumentClassification, Entity, Relationship, OrchestratorStores } from './orchestrator.js';
export { MarkItDownProvider, DocumentExtractionRegistry, DocumentExtractionService } from './extraction/index.js';
export { AgentRegistry, AgentRunner, DocumentClassifierAgent, EntityExtractorAgent, RelationshipExtractorAgent } from './agents/index.js';
export type { DiscoveryAgent, AgentContext, AgentResult, AgentProvenance, AgentResultStatus, DocumentType, ClassifierOutput } from './agents/index.js';
export type { DocumentExtractionProvider, ExtractionInput, ExtractionResult, ExtractionMetadata, ExtractionWarning, ExtractionProviderName, SupportedDocumentType, Layer1Repository } from './extraction/index.js';
export { createRequest, transitionRequest, InvalidRequestTransitionError, ALL_REQUEST_TYPES, ALLOWED_REQUEST_TRANSITIONS, insertRequest, updateRequestStatus, getPendingRequests, getRequestById, getRequestsByRun } from './preparation/index.js';
export type { SemanticExtractionRequest, SemanticRequestType, SemanticRequestStatus, RequestPriority } from './preparation/index.js';
export { ALLOWED_TRANSITIONS } from './types.js';
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
  TimelineEvent,
  ArtifactType,
  EvidenceClass,
} from './types.js';
