// ==========================================================================
// KTP-1.4 — Readiness API DTOs (FROZEN)
// ==========================================================================
// Stable contract for all consumers: API, Sponsor Intelligence, Marketplace,
// Certified Engines, Vilo OS, external integrations.
//
// DO NOT BREAK THESE TYPES. Add new optional fields only.
// Versioned under /api/v1/readiness/
// ==========================================================================

// --------------------------------------------------------------------------
// Status type
// --------------------------------------------------------------------------

export type ReadinessStatus =
  | 'not_ready'
  | 'partial'
  | 'conditionally_ready'
  | 'ready'

// --------------------------------------------------------------------------
// Evidence gap — what's missing
// --------------------------------------------------------------------------

export interface EvidenceGap {
  capabilityTypeId: string
  capabilityTypeName: string
  evidenceClass: string // A-F
  required: number
  present: number
  missing: number
  isMandatory: boolean
  /** Human-readable suggestions for what evidence to provide */
  suggestions: string[]
}

// --------------------------------------------------------------------------
// Capability evaluation within a program
// --------------------------------------------------------------------------

export interface CapabilitySummary {
  capabilityTypeId: string
  capabilityTypeName: string
  isMandatory: boolean
  /** 0.00-1.00 confidence for this capability */
  confidence: number
  metRequirements: boolean
  evidenceCount: number
  mandatoryEvidenceMet: number
  mandatoryEvidenceTotal: number
}

// --------------------------------------------------------------------------
// Evidence requirement as defined by Program Type
// --------------------------------------------------------------------------

export interface EvidenceRequirement {
  evidenceClass: string // A-F
  isMandatory: boolean
  minimumCount: number
  description: string
}

// --------------------------------------------------------------------------
// Capability requirement as defined by Program Type
// --------------------------------------------------------------------------

export interface CapabilityRequirement {
  capabilityTypeId: string
  capabilityTypeName: string
  isMandatory: boolean
  /** Per-capability confidence threshold override, nullable */
  minimumConfidence: number | null
  evidenceRequirements: EvidenceRequirement[]
}

// --------------------------------------------------------------------------
// Per-program-type readiness for an institution
// --------------------------------------------------------------------------

export interface ProgramReadiness {
  programTypeKey: string
  programTypeName: string
  readinessStatus: ReadinessStatus
  /** 0.00-1.00 */
  overallConfidence: number
  capabilities: CapabilitySummary[]
  evidenceGaps: EvidenceGap[]
  lastEvaluatedAt: string // ISO 8601
  evaluationId: string
}

// --------------------------------------------------------------------------
// Readiness Summary — all evaluations for one institution
// --------------------------------------------------------------------------

export interface ReadinessSummary {
  organizationId: string
  organizationName: string
  evaluations: ProgramReadiness[]
  /** Worst status across all evaluations */
  overallReadiness: ReadinessStatus
}

// --------------------------------------------------------------------------
// Full evaluation object (persisted)
// --------------------------------------------------------------------------

export interface ReadinessEvaluation {
  evaluationId: string | null // null if never evaluated
  organizationId: string
  programTypeKey: string
  programTypeName: string
  status: ReadinessStatus
  /** 0.00-1.00 */
  overallConfidence: number
  capabilitiesBreakdown: CapabilitySummary[]
  evidenceGaps: EvidenceGap[]
  computedAt: string | null // ISO 8601, null if never evaluated
  evidenceGraphCorrelationId: string | null
  visibilityScope: string
}

// --------------------------------------------------------------------------
// Sponsor Projection — read-only snapshot for external consumers
// --------------------------------------------------------------------------

export interface ReadinessReport {
  organizationId: string
  organizationName: string
  programTypeKey: string
  programTypeName: string
  readinessStatus: ReadinessStatus
  /** 0.00-1.00 */
  overallConfidence: number
  capabilityMatrix: Array<{
    capability: string
    mandatory: boolean
    confidence: number
    status: 'met' | 'partial' | 'unmet'
  }>
  evidenceGaps: EvidenceGap[]
  confidenceSummary: Array<{
    label: string
    value: number
    trend?: 'improving' | 'stable' | 'declining'
  }>
  recommendations: string[]
  generatedAt: string // ISO 8601
  /** Provenance reference — verifiable via evidence graph */
  verifiableVia: string
}
