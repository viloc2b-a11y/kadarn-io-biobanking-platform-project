// ==========================================================================
// Sponsor Intelligence — DTO Catalog (KTP-1.6 / Mission 7)
// ==========================================================================

// === Sponsor Portfolio ===

export interface SponsorPortfolioView {
  sponsorId: string
  programTypeKey: string
  institutions: SponsorInstitutionCard[]
  summary: PortfolioSummary
  generatedAt: string
}

export interface SponsorInstitutionCard {
  institutionId: string
  institutionName: string
  readinessStatus: string
  overallConfidence: number
  fitAssessment: string
  keyStrengths: string[]
  keyRisks: string[]
  evidenceCompleteness: number
  trend: 'improving' | 'stable' | 'declining'
  lastEvaluatedAt: string
}

export interface PortfolioSummary {
  totalInstitutions: number
  ready: number
  conditionallyReady: number
  partial: number
  notReady: number
  averageConfidence: number
  improvingCount: number
  decliningCount: number
}

// === Program Matching (Inverse Query) ===

export interface ProgramMatchResult {
  programTypeKey: string
  programTypeName: string
  matchedInstitutions: ProgramInstitutionMatch[]
  totalCandidates: number
  generatedAt: string
}

export interface ProgramInstitutionMatch {
  institutionId: string
  institutionName: string
  readinessStatus: string
  overallConfidence: number
  matchStrength: 'excellent' | 'good' | 'adequate' | 'limited'
  matchRationale: string
  capabilityCoverage: number
  evidenceQuality: string
  criticalGaps: string[]
  recommendation: string
}

// === Decision Views ===

export interface ExecutiveSummary {
  targetId: string
  targetType: 'institution' | 'program'
  headline: string
  readinessStatus: string
  confidenceScore: number
  topFindings: string[]
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high'
  recommendedAction: string
  generatedAt: string
}

export interface CapabilitySummaryView {
  capabilities: {
    name: string
    status: string
    confidence: number
    evidenceStrength: string
    trend: string
  }[]
  coveragePercent: number
}

export interface EvidenceHighlight {
  evidenceId: string
  description: string
  evidenceClass: string
  supportsCapability: string
  confidence: number
}

export interface ConfidenceDistribution {
  buckets: { range: string; min: number; max: number; count: number }[]
  mean: number
  median: number
}

export interface ReadinessDistribution {
  ready: number
  conditionallyReady: number
  partial: number
  notReady: number
  total: number
}

// === Portfolio Monitoring ===

export interface SponsorAlert {
  alertId: string
  alertType: 'readiness_increased' | 'readiness_declined' | 'capability_lost' | 'evidence_expired' | 'new_institution'
  institutionId: string
  institutionName: string
  programTypeKey: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  triggeredAt: string
  previousValue: string | null
  newValue: string
}

// === Explainability ===

export interface RecommendationExplanation {
  recommendationId: string
  institutionId: string
  whyRecommended: string
  supportingEvidence: {
    evidenceClass: string
    description: string
    confidence: number
  }[]
  whatIsMissing: string[]
  whatChanged: string | null
  traceChain: string[]
}

// === Multi-Actor ===

export type ActorRole = 'sponsor' | 'cro' | 'institution' | 'admin'

export interface VisibilityRule {
  actorRole: ActorRole
  canSeeInstitution: (institutionId: string, visibilityScope: string, portfolioIds?: string[], programIds?: string[]) => boolean
  canSeeEvaluationDetail: (actorRole: ActorRole, institutionId: string, visibilityScope: string) => boolean
}
