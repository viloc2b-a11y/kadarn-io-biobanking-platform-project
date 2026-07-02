// ==========================================================================
// Discovery Dashboard — Shared Types
// ==========================================================================

export interface DiscoverySession {
  id: string;
  organization_id: string;
  site_id: string | null;
  status: string;
  created_by: string;
  correlation_id: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryRun {
  id: string;
  session_id: string;
  status: string;
  pipeline_version: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface DiscoveryArtifact {
  id: string;
  run_id: string;
  file_name: string;
  artifact_type: string;
  size_bytes: number;
  file_hash: string;
  source: string;
  storage_ref: string;
  created_at: string;
}

export interface DiscoveryCandidate {
  id: string;
  run_id: string;
  current_state: string;
  proposed_evidence_class: string | null;
  content: string;
  discovery_confidence: number;
  source: string;
  created_at: string;
}

export interface CurationEvent {
  id: string;
  target_type: string;
  target_id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  reason: string | null;
  enrichment_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface ValidationNote {
  id: string;
  discovery_session_id: string;
  discovery_run_id: string | null;
  author_id: string;
  category: string;
  note: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
}

export interface AgentOutput {
  output: Record<string, unknown>;
  confidence: number;
  status: string;
  created_at: string;
}

export interface DiscoveryMetrics {
  artifactsProcessed: number;
  documentsClassified: number;
  entitiesDetected: number;
  relationshipsDetected: number;
  capabilitiesDetected: number;
  claimCandidatesDetected: number;
  evidenceGapsDetected: number;
  unknownDocuments: number;
  lowConfidenceItems: number;
  curationEvents: number;
  validationNotes: number;
  nextBestActionPresent: boolean;
  ttfvMinutes: number | null;
  institutionReconstructionCoverage: number | null;
  evidenceLeverageScore: number | null;
}

export interface DashboardData {
  session: DiscoverySession;
  latestRun: DiscoveryRun | null;
  counts: {
    artifacts: number;
    entities: number;
    relationships: number;
    candidates: number;
  };
  metrics: DiscoveryMetrics;
  agentOutputs: Record<string, AgentOutput>;
  curationEvents: CurationEvent[];
  validationNotes: ValidationNote[];
  artifacts: DiscoveryArtifact[];
  candidates: DiscoveryCandidate[];
      /** Sprint 21B: Capability Intelligence Engine output (canonical capability model) */
      capabilityIntelligence?: CapabilityIntelligenceData;
      /** Sprint 21C: Evidence Gap Intelligence Engine output (canonical gap model) */
      gapIntelligence?: GapIntelligenceData;
      /** Sprint 21D: Institutional Capability Assessment Engine output */
      assessmentIntelligence?: AssessmentIntelligenceData;
      /** Sprint 21E: Sponsor Readiness Engine output */
      sponsorReadiness?: SponsorReadinessData;
}

export type DashboardTab =
  | 'overview'
  | 'pipeline'
  | 'snapshot'
  | 'profile'
  | 'documents'
  | 'entities'
  | 'relationships'
  | 'timeline'
  | 'capabilities'
  | 'claims'
  | 'gaps'
  | 'narrative'
  | 'curation'
  | 'notes'
  | 'provenance'
  | 'sponsor_readiness'
  | 'research_assets';

export type ProvenanceTargetType = 'ENTITY' | 'RELATIONSHIP' | 'CAPABILITY' | 'CLAIM_CANDIDATE';

export interface ProvenanceSelection {
  targetType: ProvenanceTargetType;
  targetId: string;
}

export interface ProvenanceChainStep {
  label: string;
  detail: string;
  id?: string;
}

export interface ProvenanceLayer0 {
  id: string;
  file_name: string;
  artifact_type: string;
  size_bytes: number;
  file_hash: string;
  source: string;
  storage_ref: string;
  created_at: string;
}

export interface ProvenanceLayer1 {
  id: string;
  artifact_id: string;
  extractor: string;
  extractor_version: string;
  original_hash: string;
  status: string;
  extracted_at: string;
  markdown_preview: string;
}

export interface ProvenanceAgentOutput {
  agent_name: string;
  agent_version: string;
  status: string;
  confidence: number;
  created_at: string;
  pipeline_version: string;
}

export interface ProvenanceRelatedItem {
  type: string;
  id: string;
  label: string;
}

export interface ProvenanceData {
  targetType: ProvenanceTargetType;
  targetId: string;
  itemSummary: {
    label: string;
    type: string;
    details: Record<string, unknown>;
  };
  chain: ProvenanceChainStep[];
  agentOutput: ProvenanceAgentOutput | null;
  pipelineVersion: string | null;
  layer1: ProvenanceLayer1 | null;
  layer0: ProvenanceLayer0 | null;
  sourceSpan: string | null;
  relatedEntities: ProvenanceRelatedItem[];
  relatedRelationships: ProvenanceRelatedItem[];
  relatedCapabilities: ProvenanceRelatedItem[];
  relatedClaims: ProvenanceRelatedItem[];
  curationHistory: CurationEvent[];
}

export interface PipelineStatusData {
  sessionId: string;
  runId: string | null;
  runStatus: string | null;
  pipelineVersion: string | null;
  stages: PipelineStageView[];
}

export type PipelineStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'not_available';

export interface PipelineStageView {
  id: string;
  label: string;
  status: PipelineStageStatus;
  count: number | null;
  latestAt: string | null;
  warnings: string[];
  errors: string[];
  dashboardTab: DashboardTab | null;
}

export const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Recognition Overview' },
  { id: 'pipeline', label: 'Discovery Pipeline' },
  { id: 'snapshot', label: 'Evidence Snapshot' },
  { id: 'profile', label: 'Institution Profile' },
  { id: 'documents', label: 'Evidence Documents' },
  { id: 'entities', label: 'People, Sites & Studies' },
  { id: 'relationships', label: 'Connections Found' },
  { id: 'timeline', label: 'Evidence Timeline' },
  { id: 'capabilities', label: 'Capabilities Found' },
  { id: 'claims', label: 'Evidence Claims' },
  { id: 'gaps', label: 'Evidence Gaps' },
  { id: 'narrative', label: 'Institutional Story' },
  { id: 'curation', label: 'Review & Improve Evidence' },
  { id: 'notes', label: 'Validation Notes' },
  { id: 'provenance', label: 'Source Trace' },
  { id: 'sponsor_readiness', label: 'Sponsor Readiness' },
  { id: 'research_assets', label: 'Research Assets Enabled' },
];

// Role-specific default tab ordering (Task 6). DASHBOARD_TABS above remains
// the canonical id -> label map; these arrays only reorder for display.
export const SITE_DIRECTOR_TAB_ORDER: DashboardTab[] = [
  'overview',
  'narrative',
  'sponsor_readiness',
  'research_assets',
  'gaps',
  'capabilities',
  'claims',
  'documents',
  'entities',
  'relationships',
  'timeline',
  'notes',
  'provenance',
];

export const KADARN_REVIEWER_TAB_ORDER: DashboardTab[] = [
  'overview',
  'gaps',
  'research_assets',
  'curation',
  'notes',
  'narrative',
  'capabilities',
  'claims',
  'documents',
  'entities',
  'relationships',
  'timeline',
  'pipeline',
  'provenance',
];

// ==================================================================
// Engine output contracts (Sprints 21B, 21C, 21D)
// ==================================================================

export type CapabilityStatus =
  | 'supported'
  | 'partially_supported'
  | 'needs_more_evidence'
  | 'needs_human_review'
  | 'not_detected'

export interface CapabilityEntry {
  id: string
  name: string
  category: string
  status: CapabilityStatus
  summary: string
  supporting_claims: string[]
  supporting_evidence: string[]
  research_assets_enabled: string[]
  missing_requirements: string[]
  gaps: string[]
  recommended_next_step: string
  last_updated: string
}

export interface CapabilitySummary {
  total: number
  supported: number
  partial: number
  needs_evidence: number
  needs_review: number
  not_detected: number
}

export interface CapabilityIntelligenceData {
  capabilities: CapabilityEntry[]
  summary: CapabilitySummary
  generated_at: string
}

export type GapCategory =
  | 'missing_evidence'
  | 'weak_evidence'
  | 'expired_evidence'
  | 'inconsistent_evidence'
  | 'needs_external_confirmation'
  | 'needs_human_review'
  | 'insufficient_metadata'
  | 'governance_gap'
  | 'operational_gap'

export type GapSeverity = 'low' | 'moderate' | 'high' | 'blocking'

export type GapReviewStatus = 'open' | 'needs_review' | 'deferred' | 'resolved'

export interface GapEntry {
  id: string
  title: string
  category: GapCategory
  severity: GapSeverity
  blocking: boolean
  affected_capabilities: string[]
  affected_research_assets: string[]
  evidence_needed: string[]
  recommended_next_action: string
  review_status: GapReviewStatus
  source_refs: string[]
  last_updated: string | null
}

export interface GapSummary {
  total: number
  blocking: number
  high: number
  needs_review: number
  resolved: number
}

export interface GapIntelligenceData {
  gaps: GapEntry[]
  summary: GapSummary
  generated_at: string
}

export type AssessmentStatus =
  | 'healthy'
  | 'attention_needed'
  | 'limited'
  | 'blocked'
  | 'unknown'

export type OperationalMaturity =
  | 'emerging'
  | 'developing'
  | 'established'
  | 'advanced'

export type DashboardPriority =
  | 'critical'
  | 'high'
  | 'normal'
  | 'informational'

export type SponsorRelevance =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown'

export interface AssessmentEntry {
  capability_id: string
  capability_name: string
  category: string
  assessment_status: AssessmentStatus
  operational_maturity: OperationalMaturity
  assessment_summary: string
  research_assets_enabled: string[]
  blocking_gaps: string[]
  non_blocking_gaps: string[]
  missing_requirements: string[]
  recommended_actions: string[]
  dashboard_priority: DashboardPriority
  future_sponsor_relevance: SponsorRelevance
  last_updated: string
}

export interface AssessmentSummaryData {
  healthy: number
  attention_needed: number
  limited: number
  blocked: number
  unknown: number
}

export interface AssessmentIntelligenceData {
  assessment: AssessmentEntry[]
  summary: AssessmentSummaryData
  generated_at: string
}

// ==================================================================
// Sponsor Readiness Engine output contract (Sprint 21E)
// ==================================================================

export type SponsorReadinessLabel =
  | 'Presentation Ready'
  | 'Needs Additional Evidence'
  | 'Needs Human Review'
  | 'Not Enough Evidence Yet'

export interface SponsorReadinessData {
  readiness_label: SponsorReadinessLabel
  summary: string
  strengths: string[]
  concerns: string[]
  blocking_items: string[]
  recommended_preparation: string[]
  relevant_research_assets: string[]
  capability_highlights: string[]
  assessment_references: string[]
  last_updated: string
}
