// ==========================================================================
// Sponsor Readiness Engine — Domain Types (Sprint 21E)
// ==========================================================================
//
// A presentation layer over canonical assessment data.
// Translates institutional state into sponsor-facing language.
//
// Never evaluates. Never computes confidence. Never owns business logic.
// No "verified", "certified", "gold", "silver", "bronze", "pass", "fail".
// ==========================================================================

// --------------------------------------------------------------------------
// Allowed readiness labels
// --------------------------------------------------------------------------

export type SponsorReadinessLabel =
  | 'Presentation Ready'
  | 'Needs Additional Evidence'
  | 'Needs Human Review'
  | 'Not Enough Evidence Yet'

// --------------------------------------------------------------------------
// Engine input — consumes Assessment + read-only reference to CI/GI
// --------------------------------------------------------------------------

export interface SponsorReadinessInput {
  /** Institutional Capability Assessment output */
  assessment: Array<{
    capability_id: string
    capability_name: string
    category: string
    assessment_status: string
    operational_maturity: string
    research_assets_enabled: string[]
    blocking_gaps: string[]
    non_blocking_gaps: string[]
    recommended_actions: string[]
    assessment_summary: string
  }>
  /** Assessment summary counters */
  assessmentSummary: {
    healthy: number
    attention_needed: number
    limited: number
    blocked: number
    unknown: number
  }
  /** Capability Intelligence (read-only reference, for names/assets) */
  capabilities?: Array<{
    id: string
    name: string
    status: string
    supporting_claims: string[]
    research_assets_enabled: string[]
  }>
  /** Evidence Gap Intelligence (read-only reference, for gap details) */
  gaps?: Array<{
    id: string
    title: string
    severity: string
    blocking: boolean
    affected_research_assets: string[]
  }>
}

// --------------------------------------------------------------------------
// Engine output
// --------------------------------------------------------------------------

export interface SponsorReadiness {
  /** Overall readiness label */
  readiness_label: SponsorReadinessLabel
  /** Human-readable summary of readiness state */
  summary: string
  /** Institution strengths derived from assessment */
  strengths: string[]
  /** Concerns derived from gaps and limitations */
  concerns: string[]
  /** Items blocking presentation readiness */
  blocking_items: string[]
  /** Recommended preparation steps */
  recommended_preparation: string[]
  /** Research assets relevant to sponsors */
  relevant_research_assets: string[]
  /** Highlighted capabilities for sponsor view */
  capability_highlights: string[]
  /** References to the assessment that produced this output */
  assessment_references: string[]
  /** When this readiness was computed */
  last_updated: string
}
