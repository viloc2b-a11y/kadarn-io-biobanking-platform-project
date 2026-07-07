// ==========================================================================
// Sponsor Intelligence — Decision Views (KTP-1.6 / Mission 7)
// ==========================================================================

import type {
  ExecutiveSummary, CapabilitySummaryView, EvidenceHighlight,
  ConfidenceDistribution, ReadinessDistribution,
} from './dto'

import type { ReadinessEvaluation } from '@kadarn/readiness-engine'

export function buildExecutiveSummary(
  target: { organization_id: string; organization_name?: string; readiness_status: string; overall_confidence: number | null; evaluation_snapshot?: any },
  targetType: 'institution' | 'program'
): ExecutiveSummary {
  const status = target.readiness_status
  const conf = target.overall_confidence ?? 0

  const headline = targetType === 'institution'
    ? `${target.organization_name ?? target.organization_id}: ${status.replace(/_/g, ' ')} for program readiness`
    : `Program readiness: ${status.replace(/_/g, ' ')}`

  const strengths = target.evaluation_snapshot?.strengths ?? []
  const concerns = target.evaluation_snapshot?.concerns ?? []
  const topFindings = [
    ...strengths.slice(0, 2).map((s: string) => `Strength: ${s}`),
    ...concerns.slice(0, 2).map((c: string) => `Gap: ${c}`),
  ].slice(0, 5)

  let riskLevel: ExecutiveSummary['riskLevel'] = 'low'
  if (status === 'not_ready') riskLevel = 'high'
  else if (status === 'partial' && conf < 0.5) riskLevel = 'elevated'
  else if (status === 'partial' || (status === 'conditionally_ready' && conf < 0.7)) riskLevel = 'moderate'

  const recommendedAction = status === 'ready'
    ? 'Ready for program engagement. Maintain current evidence levels.'
    : status === 'conditionally_ready'
      ? 'Close remaining evidence gaps to reach full readiness.'
      : 'Build core capabilities and submit evidence before program eligibility assessment.'

  return {
    targetId: target.organization_id,
    targetType,
    headline,
    readinessStatus: status,
    confidenceScore: conf,
    topFindings,
    riskLevel,
    recommendedAction,
    generatedAt: new Date().toISOString(),
  }
}

export function buildCapabilitySummary(evaluation: ReadinessEvaluation): CapabilitySummaryView {
  const caps = evaluation.evaluation_snapshot?.capabilities ?? []
  const capabilities = caps.map((c: any) => ({
    name: c.name ?? 'Unknown',
    status: c.status ?? 'not_detected',
    confidence: c.confidence ?? 0,
    evidenceStrength: mapEvidenceStrength(c.confidence ?? 0),
    trend: c.trend ?? 'stable',
  }))

  const supported = capabilities.filter((c: any) => c.status === 'supported').length
  const coveragePercent = capabilities.length > 0
    ? Math.round((supported / capabilities.length) * 100)
    : 0

  return { capabilities, coveragePercent }
}

export function buildEvidenceHighlights(evaluation: ReadinessEvaluation): EvidenceHighlight[] {
  const evidence = evaluation.evaluation_snapshot?.evidence_highlights ?? []
  return evidence.map((e: any) => ({
    evidenceId: e.id ?? '',
    description: e.description ?? '',
    evidenceClass: e.evidence_class ?? 'C',
    supportsCapability: e.supports_capability ?? '',
    confidence: e.confidence ?? 0,
  }))
}

export function buildConfidenceDistribution(evaluations: ReadinessEvaluation[]): ConfidenceDistribution {
  const buckets = [
    { range: '0.90-1.00', min: 0.90, max: 1.00, count: 0 },
    { range: '0.75-0.89', min: 0.75, max: 0.89, count: 0 },
    { range: '0.50-0.74', min: 0.50, max: 0.74, count: 0 },
    { range: '0.25-0.49', min: 0.25, max: 0.49, count: 0 },
    { range: '0.00-0.24', min: 0.00, max: 0.24, count: 0 },
  ]

  const confidences: number[] = []

  for (const e of evaluations) {
    const c = e.overall_confidence ?? 0
    confidences.push(c)
    for (const b of buckets) {
      if (c >= b.min && c <= b.max) { b.count++; break }
    }
  }

  confidences.sort((a, b) => a - b)
  const mid = Math.floor(confidences.length / 2)
  const median = confidences.length > 0
    ? (confidences.length % 2 === 0 ? (confidences[mid - 1] + confidences[mid]) / 2 : confidences[mid])
    : 0
  const mean = confidences.length > 0
    ? Math.round((confidences.reduce((s, v) => s + v, 0) / confidences.length) * 100) / 100
    : 0

  return { buckets, mean, median }
}

export function buildReadinessDistribution(evaluations: ReadinessEvaluation[]): ReadinessDistribution {
  let ready = 0, conditionallyReady = 0, partial = 0, notReady = 0
  for (const e of evaluations) {
    switch (e.readiness_status) {
      case 'ready': ready++; break
      case 'conditionally_ready': conditionallyReady++; break
      case 'partial': partial++; break
      default: notReady++
    }
  }
  return { ready, conditionallyReady, partial, notReady, total: evaluations.length }
}

function mapEvidenceStrength(confidence: number): string {
  if (confidence >= 0.90) return 'strong'
  if (confidence >= 0.70) return 'good'
  if (confidence >= 0.50) return 'moderate'
  return 'weak'
}
