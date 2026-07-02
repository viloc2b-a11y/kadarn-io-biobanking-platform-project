// ==========================================================================
// Institutional Capability Assessment Engine — Domain Types (Sprint 21D)
// ==========================================================================
//
// Canonical assessment layer of Kadarn.
// Evaluates the current state of institutional capabilities using
// outputs from Discovery, Capability Intelligence, and Evidence Gap Intelligence.
//
// All future readiness modules must consume this engine.
//
// No AI reasoning. No confidence computation. No Evidence Core writes.
// No "verified", "certified", "gold", "silver", "bronze", "pass", "fail".
// ==========================================================================

// --------------------------------------------------------------------------
// Allowed assessment states
// --------------------------------------------------------------------------

export type AssessmentStatus =
  | 'healthy'
  | 'attention_needed'
  | 'limited'
  | 'blocked'
  | 'unknown'

// --------------------------------------------------------------------------
// Allowed operational maturity levels
// --------------------------------------------------------------------------

export type OperationalMaturity =
  | 'emerging'
  | 'developing'
  | 'established'
  | 'advanced'

// --------------------------------------------------------------------------
// Allowed dashboard priorities (presentation ordering only, not scoring)
// --------------------------------------------------------------------------

export type DashboardPriority =
  | 'critical'
  | 'high'
  | 'normal'
  | 'informational'

// --------------------------------------------------------------------------
// Future sponsor relevance (preparation for Sprint 21E)
// --------------------------------------------------------------------------

export type SponsorRelevance =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown'

// --------------------------------------------------------------------------
// Allowed recommended actions
// --------------------------------------------------------------------------

export type RecommendedAction =
  | 'Upload evidence'
  | 'Update documentation'
  | 'Review inconsistency'
  | 'Request external confirmation'
  | 'Complete missing metadata'
  | 'Review manually'
  | 'No action required'

// --------------------------------------------------------------------------
// Single capability assessment entry
// --------------------------------------------------------------------------

export interface CapabilityAssessmentEntry {
  /** Capability ID from Capability Intelligence */
  capability_id: string
  /** Human-readable capability name */
  capability_name: string
  /** Organizational category */
  category: string
  /** Current assessment status */
  assessment_status: AssessmentStatus
  /** Operational maturity level */
  operational_maturity: OperationalMaturity
  /** Human-readable assessment summary */
  assessment_summary: string
  /** Research assets enabled by this capability */
  research_assets_enabled: string[]
  /** Blocking gaps affecting this capability */
  blocking_gaps: string[]
  /** Non-blocking gaps affecting this capability */
  non_blocking_gaps: string[]
  /** Missing requirements that need to be addressed */
  missing_requirements: string[]
  /** Recommended actions based on current state */
  recommended_actions: RecommendedAction[]
  /** Dashboard presentation priority */
  dashboard_priority: DashboardPriority
  /** Future sponsor relevance (preparation for Sprint 21E) */
  future_sponsor_relevance: SponsorRelevance
  /** When this assessment was last updated */
  last_updated: string
}

// --------------------------------------------------------------------------
// Assessment summary counters
// --------------------------------------------------------------------------

export interface AssessmentSummary {
  healthy: number
  attention_needed: number
  limited: number
  blocked: number
  unknown: number
}

// --------------------------------------------------------------------------
// Full engine output
// --------------------------------------------------------------------------

export interface InstitutionCapabilityAssessment {
  /** Per-capability assessments */
  assessment: CapabilityAssessmentEntry[]
  /** Aggregate summary */
  summary: AssessmentSummary
  /** When this assessment was generated */
  generated_at: string
}

// --------------------------------------------------------------------------
// Engine input — consumes Capability Intelligence + Evidence Gap Intelligence
// --------------------------------------------------------------------------

export interface AssessmentInput {
  /** Capability Intelligence output (Sprint 21B) */
  capabilities: Array<{
    id: string
    name: string
    category: string
    status: string
    summary: string
    supporting_claims: string[]
    supporting_evidence: string[]
    research_assets_enabled: string[]
    missing_requirements: string[]
    gaps: string[]
    recommended_next_step: string
  }>
  /** Evidence Gap Intelligence output (Sprint 21C) */
  gaps?: Array<{
    id: string
    title: string
    category: string
    severity: string
    blocking: boolean
    affected_capabilities: string[]
    affected_research_assets: string[]
    evidence_needed: string[]
    recommended_next_action: string
  }>
}
