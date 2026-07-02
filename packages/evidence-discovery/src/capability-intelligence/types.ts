// ==========================================================================
// Capability Intelligence Engine — Domain Types (Sprint 21B)
// ==========================================================================
//
// Canonical institutional capability model.
// Every future module must consume this engine instead of implementing
// its own capability logic.
//
// No AI reasoning. No confidence computation. No Evidence Core writes.
// No "verified", "certified", "gold", "silver", "bronze".
// ==========================================================================

// --------------------------------------------------------------------------
// Allowed capability categories (organizational only — do not infer)
// --------------------------------------------------------------------------

export type CapabilityCategory =
  | 'Biospecimen Processing'
  | 'Storage'
  | 'Shipping'
  | 'Clinical Operations'
  | 'Clinical Data'
  | 'Digital Pathology'
  | 'Imaging'
  | 'Laboratory'
  | 'Regulatory'
  | 'Quality'
  | 'Infrastructure'
  | 'Personnel'
  | 'Research Operations'
  | 'AI Readiness Foundations'

// --------------------------------------------------------------------------
// Allowed capability statuses
// --------------------------------------------------------------------------

export type CapabilityStatus =
  | 'supported'
  | 'partially_supported'
  | 'needs_more_evidence'
  | 'needs_human_review'
  | 'not_detected'

// --------------------------------------------------------------------------
// Research asset labels (from Sprint 21A — consumed, not owned)
// --------------------------------------------------------------------------

export const RESEARCH_ASSET_LABELS = [
  'Plasma',
  'Serum',
  'Whole Blood',
  'PBMC',
  'FFPE Tissue',
  'Frozen Tissue',
  'Digital Slides',
  'Whole Slide Images',
  'Clinical Dataset',
  'Longitudinal Dataset',
  'Imaging Dataset',
  'Pathology Dataset',
  'Omics-ready Dataset',
  'AI-ready Dataset',
] as const

export type ResearchAssetLabel = (typeof RESEARCH_ASSET_LABELS)[number]

// --------------------------------------------------------------------------
// Single capability entry
// --------------------------------------------------------------------------

export interface CapabilityEntry {
  /** Unique capability identifier */
  id: string
  /** Human-readable name */
  name: string
  /** Organizational category */
  category: CapabilityCategory
  /** Current status */
  status: CapabilityStatus
  /** Human-readable summary */
  summary: string
  /** Supporting claims (from Discovery claim candidates) */
  supporting_claims: string[]
  /** Supporting evidence references (entity/artifact IDs) */
  supporting_evidence: string[]
  /** Research assets enabled by this capability */
  research_assets_enabled: ResearchAssetLabel[]
  /** Missing requirements (from gap descriptions) */
  missing_requirements: string[]
  /** Evidence gaps that affect this capability */
  gaps: string[]
  /** Recommended next action */
  recommended_next_step: string
  /** When this capability was last updated */
  last_updated: string
}

// --------------------------------------------------------------------------
// Summary counters
// --------------------------------------------------------------------------

export interface CapabilitySummary {
  total: number
  supported: number
  partial: number
  needs_evidence: number
  needs_review: number
  not_detected: number
}

// --------------------------------------------------------------------------
// Full engine output
// --------------------------------------------------------------------------

export interface CapabilityIntelligence {
  /** All institutional capabilities */
  capabilities: CapabilityEntry[]
  /** Aggregate summary */
  summary: CapabilitySummary
  /** When this intelligence was generated */
  generated_at: string
}

// --------------------------------------------------------------------------
// Engine input — consumes existing Discovery aggregate only
// --------------------------------------------------------------------------

export interface CapabilityIntelligenceInput {
  /** Detected candidate capabilities (from CapabilityDetector) */
  candidateCapabilities: Array<{
    capabilityId: string
    claimTypeId: string
    name: string
    category: string
    status: string
    supportingEntityIds: string[]
    supportingRelationshipIds: string[]
    supportingArtifactIds: string[]
    reasoning: string
  }>
  /** Claim candidates (from ClaimCandidateDetector) */
  claimCandidates: Array<{
    id: string
    proposedClaimTypeId: string
    reasoning: string
  }>
  /** Evidence gaps (from EvidenceGapDetector) */
  gaps: Array<{
    gapId: string
    category: string
    description: string
    severity: string
  }>
  /** Optional entity names for richer summaries */
  entityNames?: Record<string, string>
}
