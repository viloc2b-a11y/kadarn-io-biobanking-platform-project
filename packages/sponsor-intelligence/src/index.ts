// ==========================================================================
// Sponsor Intelligence Runtime — Public API (KTP-1.6 / Mission 7)
// ==========================================================================

// DTOs
export type {
  SponsorPortfolioView, SponsorInstitutionCard, PortfolioSummary,
  ProgramMatchResult, ProgramInstitutionMatch,
  ExecutiveSummary, CapabilitySummaryView, EvidenceHighlight,
  ConfidenceDistribution, ReadinessDistribution,
  SponsorAlert, RecommendationExplanation,
  ActorRole, VisibilityRule,
} from './dto'

// Modules
export { buildSponsorPortfolio } from './portfolio'
export { matchInstitutionsToProgram } from './program-matching'
export {
  buildExecutiveSummary,
  buildCapabilitySummary,
  buildEvidenceHighlights,
  buildConfidenceDistribution,
  buildReadinessDistribution,
} from './decision-views'
export { detectChanges } from './monitoring'
export { explainRecommendation } from './explainability'
export {
  canActorSeeInstitution,
  canActorSeeEvaluationDetail,
  getVisibleEvaluations,
} from './multi-actor'
