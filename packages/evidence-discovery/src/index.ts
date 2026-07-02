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
