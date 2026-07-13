// ==========================================================================
// Institutional Knowledge — Public API v2 (IKM/EVM Sprint 3)
// ==========================================================================
//
// BOUNDARY: Sits BEFORE Evidence Core. Does not import from:
// - @kadarn/evidence-core
// - @kadarn/readiness-engine
// - @kadarn/capability-intelligence
// - @kadarn/sponsor-intelligence
//
// Pipeline: Knowledge → Evidence Candidates → (future) Evidence Objects → Claims → Readiness
// ==========================================================================

// Types
export type {
  KnowledgeItem,
  KnowledgeItemType,
  KnowledgeAssetStatus,
  KnowledgeRelationship,
  RelationshipType,
  DocumentReference,
  DocumentUploadInput,
  DocumentUploadResult,
  EvidenceCandidate,
  EvidenceCandidateType,
  EvidenceCandidateStatus,
  AcquisitionSession,
  AcquisitionChannel,
  ExpirationReminder,
  KnowledgeGraph,
  KnowledgeHealthReport,
  MissingDocument,
  MissingRelationship,
  KnowledgeDashboardState,
  KnowledgeExplorerState,
  MissingInformation,
} from './types'

export { REMINDER_WINDOWS } from './types'

// Runtime
export {
  declareKnowledgeItem,
  getKnowledgeItem,
  getItemsByOrg,
  updateItemStatus,
  createRelationship,
  getRelationships,
  generateEvidenceCandidates,
  getCandidatesByItem,
  getReadyCandidates,
  uploadDocument,
  startAcquisitionSession,
  completeAcquisitionSession,
  computeAssetStatus,
  scheduleReminders,
  getActiveReminders,
  getExpiringDocuments,
} from './runtime'

// Graph
export {
  buildKnowledgeGraph,
  findDuplicates,
  suggestRelationships,
} from './graph'

// Operations
export {
  generateHealthReport,
  buildKnowledgeDashboard,
  buildExplorerState,
} from './operations'

// Domains (Sprint 4)
export type {
  KnowledgeDomain,
  KnowledgeDomainId,
  DomainProgress,
  DomainRequiredItem,
  KnowledgeCompleteness,
  InstitutionDashboardState,
  DomainCompletionEntry,
} from './domain-types'

export { KNOWLEDGE_DOMAIN_CATALOG } from './domain-types'

export {
  buildDomains,
  getDomain,
  buildInstitutionDashboard,
} from './domain-runtime'

// Domain Models (IKM Domain Sprints)
export {
  ORGANIZATION_DOMAIN_CATALOG,
  ORGANIZATION_DOCUMENTS,
  ORGANIZATION_DOMAIN_STATS,
  ORGANIZATION_SECTIONS,
} from './domains/organization'

export type {
  OrganizationKnowledgeItem,
  OrganizationDocument,
} from './domains/organization'

export {
  PEOPLE_DOMAIN_CATALOG,
  PEOPLE_DOCUMENTS,
  PEOPLE_DOMAIN_STATS,
  PEOPLE_SECTIONS,
  PEOPLE_OPERATIONS,
} from './domains/people'

export type {
  PeopleKnowledgeItem,
  PeopleDocument,
} from './domains/people'

export {
  FACILITY_DOMAIN_CATALOG,
  FACILITY_DOCUMENTS,
  FACILITY_DOMAIN_STATS,
  FACILITY_SECTIONS,
  FACILITY_OPERATIONS,
} from './domains/facilities'

export type {
  FacilityKnowledgeItem,
  FacilityDocument,
} from './domains/facilities'

export {
  EQUIPMENT_DOMAIN_CATALOG,
  EQUIPMENT_DOCUMENTS,
  EQUIPMENT_DOMAIN_STATS,
  EQUIPMENT_SECTIONS,
  EQUIPMENT_OPERATIONS,
  EQUIPMENT_LIFECYCLE,
  EQUIPMENT_DASHBOARD_SECTIONS,
} from './domains/equipment'

export type {
  EquipmentKnowledgeItem,
  EquipmentDocument,
} from './domains/equipment'

export {
  LAB_DOMAIN_CATALOG,
  LAB_DOCUMENTS,
  LAB_DOMAIN_STATS,
  LAB_SECTIONS,
  LAB_OPERATIONS_CHECKS,
  LAB_LIFECYCLE,
  LAB_DASHBOARD_SECTIONS,
} from './domains/laboratory'

export type {
  LabKnowledgeItem,
  LabDocument,
} from './domains/laboratory'

export {
  BIOSPECIMEN_DOMAIN_CATALOG,
  BIOSPECIMEN_DOCUMENTS,
  BIOSPECIMEN_DOMAIN_STATS,
  BIOSPECIMEN_SECTIONS,
  BIOSPECIMEN_OPERATIONS,
  BIOSPECIMEN_CAPABILITY_MATRIX_SECTIONS,
  BIOSPECIMEN_DASHBOARD_SECTIONS,
} from './domains/biospecimen'

export type {
  BiospecimenKnowledgeItem,
  BiospecimenDocument,
} from './domains/biospecimen'

export {
  ORG_STRUCTURE_CATALOG,
  ORG_STRUCTURE_STATS,
  ORG_STRUCTURE_SECTIONS,
  CAPABILITY_SCOPES,
} from './domains/organization-structure'

export type {
  OrgStructureItem,
  CapabilityScope,
} from './domains/organization-structure'

export {
  CAPABILITY_CATALOG,
  CAPABILITY_CATEGORY_LABELS,
  CAPABILITY_DOMAIN_STATS,
  CAPABILITY_SECTIONS,
  CAPABILITY_OPERATIONS,
  getDependencyTree,
} from './domains/research-capability'

export type {
  CapabilityItem,
  CapabilityCategory,
} from './domains/research-capability'

export {
  EXPERIENCE_DOMAIN_CATALOG,
  EXPERIENCE_DOCUMENTS,
  EXPERIENCE_DOMAIN_STATS,
  EXPERIENCE_SECTIONS,
} from './domains/research-experience'

export type {
  ExperienceItem,
  ExperienceCategory,
  ExperienceDocument,
  DerivedExperienceMetrics,
} from './domains/research-experience'

export {
  PROGRAM_TYPES,
  PROGRAM_REQUIREMENTS,
  PROGRAM_DOMAIN_STATS,
  PROGRAM_SECTIONS,
  PROGRAM_CATEGORY_LABELS,
  getProgramRequirements,
} from './domains/program-catalog'

export type {
  ProgramCatalogItem,
  ProgramCategory,
  ProgramRequirement,
} from './domains/program-catalog'

// Questionnaire Engine (Sprint 3D)
export {
  createQuestionnaireFromDomain,
  addQuestionsToSection,
  recordAnswer,
  submitQuestionnaire,
  approveQuestionnaire,
  computeQuestionnaireProgress,
  validateAnswer,
  isQuestionVisible,
  getVisibleQuestions,
  isDocumentQuestion,
  getDocumentQuestions,
} from './questionnaire-engine'

export type {
  QuestionType, QuestionOption, QuestionValidation,
  QuestionCondition, QuestionDestination, QuestionDefinition,
  QuestionnaireSection, QuestionnaireDefinition, QuestionnaireType,
  QuestionnaireStatus, QuestionAnswer, QuestionnaireInstance,
  SectionProgress, QuestionnaireProgress,
  ValidationResult, DocumentQuestionConfig,
} from './questionnaire-engine'

// Content — Production Questionnaires (IKM Content Sprints)
export {
  ORGANIZATION_QUESTIONNAIRE,
  ORGANIZATION_QUESTIONNAIRE_STATS,
  buildOrganizationQuestionnaire,
} from './content/org-questionnaire'

export {
  QUALITY_DOMAIN_CATALOG,
  QUALITY_DOCUMENTS,
  QUALITY_DOMAIN_STATS,
  QUALITY_SECTIONS,
  QUALITY_OPERATIONS,
} from './domains/quality'

export type {
  QualityItem,
  QualityDocument,
} from './domains/quality'

export {
  REGULATORY_DOMAIN_CATALOG,
  REGULATORY_DOCUMENTS,
  REGULATORY_DOMAIN_STATS,
  REGULATORY_SECTIONS,
  REGULATORY_LIFECYCLE,
  REGULATORY_OPERATIONS,
} from './domains/regulatory'

export type {
  RegulatoryItem,
  RegulatoryDocument,
} from './domains/regulatory'

// Compliance Ecosystem (IKM Integration Sprint)
export {
  buildComplianceCatalog,
  createComplianceKnowledgeState,
  detectComplianceRisks,
  generateComplianceTimeline,
  buildComplianceDashboard,
  COMPLIANCE_UX_STATES,
  COMPLIANCE_ECOSYSTEM,
  renewDocument,
  replaceDocument,
  markDocumentReviewed,
  assignItemOwner,
  recordItemDocumented,
  uploadDocument as uploadComplianceDocument,
  archiveObsoleteItem,
} from './compliance-ecosystem'

export type {
  ComplianceDomain,
  ComplianceSeverity,
  ComplianceGapType,
  ComplianceStatus,
  ComplianceItem,
  ComplianceDocument,
  ComplianceGap,
  ComplianceRisk,
  TimelineEntry,
  ComplianceDashboardState,
  ComplianceKnowledgeState,
  ComplianceOperation,
  UXStateDefinition,
} from './compliance-ecosystem'

// Evidence Promotion Pipeline (IKM/EVM Sprint)
export {
  evaluatePromotionEligibility,
  promoteCandidateToEvidence,
  createClaimCandidate,
  linkDocumentToEvidence,
  createPromotionHistory,
  recordPromotionEvent,
  promoteBatch,
  PROMOTION_UX_STATES,
  PROMOTION_PIPELINE,
} from './promotion-pipeline'

export type {
  EligibilityDecision,
  EligibilityResult,
  BlockingReason,
  PromotionCommand,
  PromotionResult,
  ClaimCandidateStatus,
  ClaimCandidate,
  DocumentPromotionLink,
  PromotionUXState,
  PromotionUXDefinition,
  PromotionHistory,
  PromotionHistoryEvent,
  BatchPromotionInput,
  BatchPromotionResult,
} from './promotion-pipeline'

// Claim Review & Readiness Synchronization (IKM/EVM Sprint)
export {
  reviewClaimCandidate,
  prepareClaimFromAcceptedCandidate,
  supersedeClaimCandidate,
  signalConfidenceRecalculation,
  signalReadinessRecalculation,
  createPipelineEvent,
  orchestratePipeline,
  CLAIM_PIPELINE_UX_STATES,
  CLAIM_REVIEW_PIPELINE,
} from './claim-review-pipeline'

export type {
  ReviewerRole,
  ReviewDecision,
  ReviewResult,
  ReviewCommand,
  ClaimCreationFromCandidate,
  ClaimCommandForEvidenceCore,
  SupersedeResult,
  ConfidenceSyncEvent,
  ReadinessSyncEvent,
  PipelineEventType,
  PipelineEvent,
  PipelineStep,
  PipelineRun,
  ClaimPipelineUXState,
  ClaimPipelineUXDefinition,
} from './claim-review-pipeline'

// Institutional Memory & Continuous Intelligence (IKM/EVM Sprint)
export {
  recordTemporalEvent,
  buildItemTimeline,
  recordMemoryEvent,
  detectDeltas,
  generateContinuousInsights,
  calculateMemoryHealth,
  compareInstitutionalState,
  INSTITUTIONAL_MEMORY,
} from './institutional-memory'

export type {
  TemporalState,
  TemporalEvent,
  ChangeCategory,
  MemoryEventType,
  MemoryEvent,
  MemoryCategory,
  EvolutionSnapshot,
  EvolutionMetrics,
  InstitutionalDelta,
  DeltaType,
  ContinuousInsight,
  InsightCategory,
  MemoryHealthReport,
  MemoryGap,
  TimelineDashboardState,
  TimelineViewMode,
  TimelineFilter,
  HistoricalComparison,
} from './institutional-memory'

// Sprint A0 — Canonical Taxonomy & Controlled Vocabulary
export {
  THERAPEUTIC_AREAS, DISEASE_AREAS, SPECIMEN_TYPES, LABORATORY_TECHNIQUES,
  EQUIPMENT_CATEGORIES, FACILITY_TYPES, CAPABILITY_TYPES, DOCUMENT_TYPES,
  CERTIFICATION_TYPES, TRAINING_TYPES, ORGANIZATION_TYPES, RESEARCH_ROLES,
  PROGRAM_TYPES as TAXONOMY_PROGRAM_TYPES, RELATIONSHIP_TYPES, STORAGE_CONDITIONS,
  TAXONOMY_STATS, validateTaxonomyTerm,
  getAllTherapeuticAreaKeys, getAllCapabilityTypeKeys,
  getAllSpecimenTypeKeys, getAllDocumentTypeKeys,
} from './taxonomy'

export type {
  TherapeuticAreaKey, DiseaseAreaKey, SpecimenTypeKey, LaboratoryTechniqueKey,
  EquipmentCategoryKey, FacilityTypeKey, CapabilityTypeKey, DocumentTypeKey,
  CertificationTypeKey, TrainingTypeKey, OrganizationTypeKey, ResearchRoleKey,
  ProgramTypeKey, RelationshipTypeKey, StorageConditionKey,
} from './taxonomy'

// Sprint A1 — People Intelligence (extends People Domain)
export {
  computePersonMetrics,
  detectPeopleRisks,
  buildPeopleDashboard,
  calculatePeopleHealth,
  PEOPLE_INTELLIGENCE,
} from './people-intelligence'

export type {
  PersonProfile, PersonIdentity, ProfessionalProfile, EducationRecord,
  LicenseRecord, CertificationRecord, TrainingRecord, LanguageProficiency,
  ResearchExperienceRecord, TherapeuticExperience, ProgramParticipationRecord,
  PersonCapability, PersonDocument, PersonAvailability, SuccessionPlan,
  PersonTimelineEventType, PersonTimelineEvent, PersonDerivedMetrics,
  PeopleRisk, PeopleDashboardState, PeopleExplorerView, PeopleExplorerState,
  PeopleHealthReport,
} from './people-intelligence'

// Sprint A2 — Laboratory & Biospecimen Intelligence
export {
  detectLabRisks,
  buildLabDashboard,
  calculateLabHealth,
  buildSpecimenIntelligence,
  LAB_INTELLIGENCE,
} from './lab-intelligence'

export type {
  StorageUnit, TemperatureMonitoring, TemperatureExcursion, StoredSpecimen,
  ProcessingWorkflow, ProcessingStep, SpecimenIntelligence, LabInventory,
  CustodyEvent, ChainOfCustody, CustodyBreach,
  ShippingCapability, ShipmentRecord,
  LabProfile, LabArea, LabEquipment, LabCapacityDashboard,
  LabRisk, LabDashboardState, LabHealthReport,
  LabExplorerView, LabExplorerState,
} from './lab-intelligence'

// Sprint A3 — Document Intelligence
export {
  computeDocumentLifecycle,
  computeReviewStatus,
  renewDocument as renewIntelligenceDocument,
  replaceDocument as replaceIntelligenceDocument,
  approveDocument,
  archiveDocument,
  linkDocumentToEntity,
  unlinkDocumentFromEntity,
  detectDocumentGaps,
  buildDocumentDashboard,
  DOCUMENT_INTELLIGENCE,
} from './document-intelligence'

export type {
  DocumentLifecycleStatus,
  DocumentIntelligence,
  DocumentDemonstration,
  DocumentSupport,
  DocumentImpact,
  LinkedEntity,
  DocumentOperation,
  DocumentGap,
  DocumentDashboardState,
  DocumentExplorerView,
  DocumentExplorerState,
} from './document-intelligence'

// Sprint A4 — Institutional Relationship Graph
export {
  buildRelationshipGraph,
  findPaths,
  getNeighborhood,
  explainRelevance,
  impactAnalysis,
  calculateGraphHealth,
  RELATIONSHIP_GRAPH,
} from './relationship-graph'

export type {
  GraphNode, NodeType, GraphEdge, EdgeStrength,
  RelationshipGraph, GraphStats,
  RelationshipPath, Subgraph, RelevanceChain, ImpactReport,
  GraphHealthReport,
  GraphExplorerView, GraphExplorerState,
} from './relationship-graph'

// Sprint A5 — Knowledge Explorer
export {
  searchKnowledge,
  calculateKnowledgeCoverage,
  KNOWLEDGE_EXPLORER,
} from './knowledge-explorer'

export type {
  ExplorerDomain, KnowledgeExplorerState, ExplorerFilters,
  ExplorerSortField, RelatedItem, DependencyChain, ImpactSummary,
  PeopleExplorerDetail, CapabilityExplorerDetail, ProgramExplorerDetail,
  DocumentExplorerDetail, EquipmentExplorerDetail,
  FacilityExplorerDetail, LaboratoryExplorerDetail,
  SearchResult, SearchIndex, SearchEntry,
  KnowledgeCoverage, DomainCoverage,
  TimelineExplorerState, TimelineEvent, TimelineMilestone, GrowthIndicator,
} from './knowledge-explorer'

// Sprint A6 — Guided Knowledge Acquisition
export {
  generateNextBestActions,
  buildProgressPath,
  generateCompletionRoadmap,
  determineGrowthPath,
  GUIDED_ACQUISITION,
} from './guided-acquisition'

export type {
  ActionType, NextBestAction, ActionImpact,
  ProgressPath, ProgressStep,
  CompletionRoadmap, CompletionPhase,
  InstitutionMaturityStage, InstitutionGrowthPath,
  StageRequirement, GrowthPathIndicator,
} from './guided-acquisition'

// Sprint A7 — Institution Digital Twin
export {
  assembleDigitalTwin,
  quickHealthAssessment,
  captureTwinSnapshot,
  DIGITAL_TWIN,
} from './institution-twin'

export type {
  InstitutionDigitalTwin, InstitutionIdentity,
  DomainSnapshots, IntelligenceLayers, CrossDomainMaps,
  InstitutionalProfile, ResearchProfile, OperationsProfile,
  ComplianceProfile, GrowthProfile,
  TwinExplorers, TwinGuidance, TwinHealth,
  TwinBuildInput, TwinSnapshot,
} from './institution-twin'

// Sprint A8 — Institution Operating System (IOS)
export {
  observe,
  analyzeImpact,
  generateRecommendations,
  createActionPlan,
  generateGrowthPath,
  buildIOSDashboard,
  computeIOSHealth,
  INSTITUTION_OS,
} from './institution-os'

export type {
  InstitutionIntelligenceGraph,
  InstitutionOperatingSystem,
  ObservationType, Observation,
  ImpactAnalysis,
  RecommendationType, Recommendation,
  GoalType, ActionPlan, ActionPlanStep,
  GrowthPath, GrowthPathState,
  IOSDashboardState, IOSHealth,
} from './institution-os'
