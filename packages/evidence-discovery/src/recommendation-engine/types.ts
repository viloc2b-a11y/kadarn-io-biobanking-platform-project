// ==========================================================================
// Recommendation Engine — Domain Types (Sprint 21F)
// ==========================================================================
//
// Canonical action orchestration layer of Kadarn.
// Translates assessment, gaps, and readiness into prioritized actions.
//
// Never evaluates. Never computes confidence. Never infers evidence.
// Every recommendation is explainable and traceable.
// No "verified", "certified", "gold", "silver", "bronze".
// ==========================================================================

// --------------------------------------------------------------------------
// Allowed categories
// --------------------------------------------------------------------------

export type RecommendationCategory =
  | 'documentation'
  | 'evidence'
  | 'operations'
  | 'governance'
  | 'metadata'
  | 'external_confirmation'
  | 'manual_review'
  | 'quality'
  | 'training'

// --------------------------------------------------------------------------
// Allowed priority levels
// --------------------------------------------------------------------------

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

// --------------------------------------------------------------------------
// Allowed statuses
// --------------------------------------------------------------------------

export type RecommendationStatus =
  | 'pending'
  | 'recommended'
  | 'in_progress'
  | 'completed'
  | 'dismissed'

// --------------------------------------------------------------------------
// Source engine reference
// --------------------------------------------------------------------------

export type SourceEngine =
  | 'institutional_capability_assessment'
  | 'evidence_gap_intelligence'
  | 'sponsor_readiness'

// --------------------------------------------------------------------------
// Single recommendation
// --------------------------------------------------------------------------

export interface Recommendation {
  /** Unique recommendation ID */
  id: string
  /** Human-readable title */
  title: string
  /** Full description */
  description: string
  /** Category */
  category: RecommendationCategory
  /** Priority level */
  priority: RecommendationPriority
  /** Current status */
  status: RecommendationStatus
  /** Why this recommendation exists */
  reason: string
  /** Capabilities affected */
  affected_capabilities: string[]
  /** Research assets affected */
  affected_research_assets: string[]
  /** Readiness label affected */
  affected_readiness: string
  /** Whether this blocks presentation */
  blocking: boolean
  /** The recommended action to take */
  recommended_action: string
  /** Which engine produced the source data */
  source_engine: SourceEngine
  /** References to source data (gap IDs, assessment capability IDs) */
  references: string[]
  /** Where this should appear in the dashboard */
  dashboard_section: string
  /** When this recommendation was last updated */
  last_updated: string
}

// --------------------------------------------------------------------------
// Summary counters
// --------------------------------------------------------------------------

export interface RecommendationSummary {
  critical: number
  high: number
  medium: number
  low: number
  blocking: number
  completed: number
  pending: number
}

// --------------------------------------------------------------------------
// Full engine output
// --------------------------------------------------------------------------

export interface RecommendationEngineOutput {
  /** All recommendations */
  recommendations: Recommendation[]
  /** Aggregate summary */
  summary: RecommendationSummary
  /** When generated */
  generated_at: string
}

// --------------------------------------------------------------------------
// Engine input
// --------------------------------------------------------------------------

export interface RecommendationInput {
  /** Institutional Capability Assessment */
  assessment: Array<{
    capability_id: string
    capability_name: string
    assessment_status: string
    blocking_gaps: string[]
    non_blocking_gaps: string[]
    research_assets_enabled: string[]
    recommended_actions: string[]
    missing_requirements: string[]
  }>
  /** Evidence Gap Intelligence */
  gaps?: Array<{
    id: string
    title: string
    category: string
    severity: string
    blocking: boolean
    affected_capabilities: string[]
    affected_research_assets: string[]
    recommended_next_action: string
  }>
  /** Sponsor Readiness */
  readiness?: {
    readiness_label: string
    blocking_items: string[]
    recommended_preparation: string[]
  }
}
