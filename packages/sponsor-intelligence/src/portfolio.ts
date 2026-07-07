// ==========================================================================
// Sponsor Intelligence — Portfolio View (KTP-1.6 / Mission 7)
// ==========================================================================

import type {
  SponsorPortfolioView, SponsorInstitutionCard, PortfolioSummary,
} from './dto'

import type { ReadinessEvaluation } from '@kadarn/readiness-engine'

export function buildSponsorPortfolio(
  sponsorId: string,
  programTypeKey: string,
  evaluations: ReadinessEvaluation[]
): SponsorPortfolioView {
  const institutions: SponsorInstitutionCard[] = evaluations.map((e) => {
    const strengths = e.evaluation_snapshot?.strengths ?? []
    const gaps = e.evaluation_snapshot?.concerns ?? []

    return {
      institutionId: e.organization_id,
      institutionName: e.organization_name ?? e.organization_id,
      readinessStatus: e.readiness_status,
      overallConfidence: e.overall_confidence ?? 0,
      fitAssessment: mapReadinessToFit(e.readiness_status),
      keyStrengths: strengths.slice(0, 3),
      keyRisks: gaps.slice(0, 3),
      evidenceCompleteness: e.evaluation_snapshot?.evidence_completeness ?? 0,
      trend: 'stable',
      lastEvaluatedAt: e.computed_at ?? new Date().toISOString(),
    }
  })

  // Sort: ready first, then conditionally_ready, partial, not_ready
  institutions.sort((a, b) => {
    const order: Record<string, number> = { ready: 0, conditionally_ready: 1, partial: 2, not_ready: 3 }
    const aOrd = order[a.readinessStatus] ?? 99
    const bOrd = order[b.readinessStatus] ?? 99
    if (aOrd !== bOrd) return aOrd - bOrd
    return b.overallConfidence - a.overallConfidence
  })

  const summary = buildPortfolioSummary(institutions)

  return {
    sponsorId,
    programTypeKey,
    institutions,
    summary,
    generatedAt: new Date().toISOString(),
  }
}

function mapReadinessToFit(status: string): string {
  switch (status) {
    case 'ready': return 'strong_fit'
    case 'conditionally_ready': return 'adequate_fit'
    case 'partial': return 'developing_fit'
    default: return 'poor_fit'
  }
}

function buildPortfolioSummary(institutions: SponsorInstitutionCard[]): PortfolioSummary {
  let ready = 0, conditionallyReady = 0, partial = 0, notReady = 0
  let totalConf = 0, improving = 0, declining = 0

  for (const inst of institutions) {
    switch (inst.readinessStatus) {
      case 'ready': ready++; break
      case 'conditionally_ready': conditionallyReady++; break
      case 'partial': partial++; break
      default: notReady++
    }
    totalConf += inst.overallConfidence
    if (inst.trend === 'improving') improving++
    if (inst.trend === 'declining') declining++
  }

  const total = institutions.length

  return {
    totalInstitutions: total,
    ready,
    conditionallyReady,
    partial,
    notReady,
    averageConfidence: total > 0 ? Math.round((totalConf / total) * 100) / 100 : 0,
    improvingCount: improving,
    decliningCount: declining,
  }
}
