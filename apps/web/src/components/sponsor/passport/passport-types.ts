/** RC-10.1 — Sponsor Institutional Passport mock types (KUX-008 aligned, web-local). */

export type StabilityIndicator =
  | 'Stable'
  | 'Evolving'
  | 'Under Review'
  | 'Evidence Refresh Needed'

export type ConfidenceLevel = 'High' | 'Moderate' | 'Low' | 'Insufficient'

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

export interface PassportIdentity {
  names: Array<{ label: string; value: string; source: string }>
  locations: Array<{ label: string; value: string; source: string }>
  relationships: Array<{ label: string; value: string; source: string }>
}

export interface PassportCapability {
  id: string
  taxonomyId: string
  label: string
  candidateStatement: string
  confidence: ConfidenceLevel
  temporalState: 'fresh' | 'aging' | 'decayed'
  supportingClaimIds: string[]
}

export interface PassportClaim {
  id: string
  taxonomyId: string
  statement: string
  confidence: ConfidenceLevel
  confidenceExplanation: string
  contested: boolean
  asOf: string
  provenance: {
    documentTitle: string
    documentDate: string
    evidenceClass: string
    excerpt: string
  }
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
