// ==========================================================================
// Evidence Gap Intelligence Engine — Domain Types (Sprint 21C)
// ==========================================================================
//
// Canonical evidence gap model.
// Gaps become structured, reusable intelligence — not scattered
// dashboard interpretation.
//
// No AI reasoning. No confidence computation. No Evidence Core writes.
// No "verified", "certified", "gold", "silver", "bronze".
// ==========================================================================

// --------------------------------------------------------------------------
// Allowed gap categories
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// Allowed severity labels
// --------------------------------------------------------------------------

export type GapSeverity = 'low' | 'moderate' | 'high' | 'blocking'

// --------------------------------------------------------------------------
// Allowed review statuses
// --------------------------------------------------------------------------

export type GapReviewStatus = 'open' | 'needs_review' | 'deferred' | 'resolved'

// --------------------------------------------------------------------------
// Single gap entry
// --------------------------------------------------------------------------

export interface EvidenceGapEntry {
  /** Unique gap identifier */
  id: string
  /** Human-readable title */
  title: string
  /** Gap category */
  category: GapCategory
  /** Severity level */
  severity: GapSeverity
  /** Whether this gap blocks presentation readiness */
  blocking: boolean
  /** Capability IDs affected by this gap */
  affected_capabilities: string[]
  /** Research asset labels affected by this gap */
  affected_research_assets: string[]
  /** Types of evidence needed to close this gap */
  evidence_needed: string[]
  /** Recommended next action */
  recommended_next_action: string
  /** Current review status */
  review_status: GapReviewStatus
  /** Source references (from Discovery aggregate) */
  source_refs: string[]
  /** When this gap was last updated */
  last_updated: string | null
}

// --------------------------------------------------------------------------
// Summary counters
// --------------------------------------------------------------------------

export interface GapSummary {
  total: number
  blocking: number
  high: number
  needs_review: number
  resolved: number
}

// --------------------------------------------------------------------------
// Full engine output
// --------------------------------------------------------------------------

export interface EvidenceGapIntelligence {
  /** All evidence gaps */
  gaps: EvidenceGapEntry[]
  /** Aggregate summary */
  summary: GapSummary
  /** When this intelligence was generated */
  generated_at: string
}

// --------------------------------------------------------------------------
// Engine input — consumes Discovery aggregate + CapabilityIntelligence
// --------------------------------------------------------------------------

export interface GapIntelligenceInput {
  /** Evidence gaps from Discovery GapDetector */
  discoveryGaps: Array<{
    gapId: string
    category: string
    description: string
    severity: string
    recommendation?: string
  }>
  /** Capability Intelligence output (Sprint 21B) — for cross-referencing */
  capabilities?: Array<{
    id: string
    name: string
    status: string
    research_assets_enabled: string[]
    gaps: string[]
    missing_requirements: string[]
    recommended_next_step: string
  }>
  /** Optional validation notes for review status determination */
  hasValidationNotes?: boolean
}
