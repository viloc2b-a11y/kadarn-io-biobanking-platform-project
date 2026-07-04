/**
 * RC-10.5 — Sponsor Institutional Passport web types.
 *
 * Mirror of apps/api/src/lib/sponsor-passport/types.ts (canonical wire DTOs).
 * Keep field names, nesting, and enum values in sync until packages/types (RC-10.6+).
 */

export type StabilityIndicator =
  | 'Stable'
  | 'Evolving'
  | 'Under Review'
  | 'Evidence Refresh Needed'

export type ConfidenceLevel = 'High' | 'Moderate' | 'Low' | 'Insufficient'

export type CapabilityTemporalState = 'fresh' | 'aging' | 'decayed'

/** UI-only — section nav anchors; not part of API wire schema. */
export type PassportSectionId =
  | 'identity'
  | 'capabilities'
  | 'claims'
  | 'recommendations'
  | 'history'

export interface PassportInstitutionSummary {
  institutionId: string
  passportId: string
  displayName: string
  location: string
  stability: StabilityIndicator
  memberSince: string
  summary: string
}

export interface PassportIdentityField {
  label: string
  value: string
  source: string
}

export interface PassportIdentity {
  names: PassportIdentityField[]
  locations: PassportIdentityField[]
  relationships: PassportIdentityField[]
}

export interface PassportCapability {
  id: string
  taxonomyId: string
  label: string
  candidateStatement: string
  confidence: ConfidenceLevel
  temporalState: CapabilityTemporalState
  supportingClaimIds: string[]
}

export interface PassportClaimProvenanceMinimal {
  documentTitle: string
  documentDate: string
  evidenceClass: string
  excerpt: string
}

export interface PassportClaim {
  id: string
  taxonomyId: string
  statement: string
  confidence: ConfidenceLevel
  confidenceExplanation: string
  contested: boolean
  asOf: string
  provenance: PassportClaimProvenanceMinimal
}

export interface PassportRecommendation {
  id: string
  action: string
  reason: string
  expectedImpact: string
  isNextAction: boolean
}

export interface PassportHistoryEvent {
  id: string
  occurredAt: string
  eventType: string
  description: string
  actor?: string
}

export interface InstitutionalPassport {
  passportId: string
  institutionId: string
  displayName: string
  stability: StabilityIndicator
  asOf: string
  identity: PassportIdentity
  capabilities: PassportCapability[]
  claims: PassportClaim[]
  recommendations: PassportRecommendation[]
  history: PassportHistoryEvent[]
}

export interface PassportPortfolioIndexResponse {
  items: PassportInstitutionSummary[]
}

export interface PassportEvidenceNode {
  id: string
  evidenceClass: string
  label: string
  sourceDocumentId?: string
  supportsClaim: boolean
  excerpt?: string
}

export interface PassportSourceDocument {
  id: string
  title: string
  documentDate: string
  evidenceClass: string
}

export interface PassportClaimProvenanceDetail {
  claimId: string
  institutionId: string
  statement: string
  confidence: ConfidenceLevel
  confidenceExplanation: string
  contested: boolean
  asOf: string
  minimal: PassportClaimProvenanceMinimal
  evidenceNodes: PassportEvidenceNode[]
  sourceDocuments: PassportSourceDocument[]
  contradictingNodeIds?: string[]
}
