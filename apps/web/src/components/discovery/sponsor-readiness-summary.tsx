import type { DashboardData } from './types'
import { DISCOVERY_COPY } from './discovery-copy'
import { assessSponsorReadiness, type SponsorReadinessLabel } from './lib'
import { Badge, EmptyPanel, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

const LABEL_COPY: Record<
  SponsorReadinessLabel,
  { label: string; description: string; tone: 'green' | 'amber' | 'red' | 'default' }
> = {
  presentation_ready: {
    label: DISCOVERY_COPY.sponsorReadinessPresentationReady,
    description: DISCOVERY_COPY.sponsorReadinessPresentationReadyDescription,
    tone: 'green',
  },
  needs_additional_evidence: {
    label: DISCOVERY_COPY.sponsorReadinessNeedsAdditionalEvidence,
    description: DISCOVERY_COPY.sponsorReadinessNeedsAdditionalEvidenceDescription,
    tone: 'amber',
  },
  needs_human_review: {
    label: DISCOVERY_COPY.sponsorReadinessNeedsHumanReview,
    description: DISCOVERY_COPY.sponsorReadinessNeedsHumanReviewDescription,
    tone: 'amber',
  },
  not_enough_evidence: {
    label: DISCOVERY_COPY.sponsorReadinessNotEnoughEvidence,
    description: DISCOVERY_COPY.sponsorReadinessNotEnoughEvidenceDescription,
    tone: 'default',
  },
}

function extractCapabilities(data: DashboardData): Array<Record<string, unknown>> {
  const output = data.agentOutputs['capability_detector']?.output ?? null
  return (output?.capabilities as Array<Record<string, unknown>> | undefined) ?? []
}

function extractClaims(data: DashboardData): Array<Record<string, unknown>> {
  const output = data.agentOutputs['claim_candidate_detector']?.output ?? null
  return (output?.candidates as Array<Record<string, unknown>> | undefined) ?? []
}

function extractGaps(data: DashboardData): Array<Record<string, unknown>> {
  const output = data.agentOutputs['evidence_gap_detector']?.output ?? null
  const reports = (output?.reports as Array<Record<string, unknown>> | undefined) ?? []
  return reports.flatMap((report) => (report.gaps as Array<Record<string, unknown>> | undefined) ?? [])
}

export function SponsorReadinessSummary({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message={DISCOVERY_COPY.sponsorReadinessInsufficientData} />

  const capabilities = extractCapabilities(data)
  const claims = extractClaims(data)
  const gaps = extractGaps(data)
  const criticalGapCount = gaps.filter((gap) => String(gap.severity ?? '') === 'critical').length
  const hasNarrative = Boolean(data.agentOutputs['narrative_engine']?.output)
  const hasCurationReview = (data.curationEvents?.length ?? 0) > 0

  const assessment = assessSponsorReadiness({
    capabilityCount: capabilities.length,
    claimCount: claims.length,
    criticalGapCount,
    totalGapCount: gaps.length,
    hasNarrative,
    hasCurationReview,
  })

  const copy = LABEL_COPY[assessment.label]

  const strongest = capabilities
    .filter((cap) => String(cap.status ?? '').toLowerCase() !== 'tentative')
    .slice(0, 5)
  const needingEvidence = capabilities
    .filter((cap) => String(cap.status ?? '').toLowerCase() === 'tentative')
    .slice(0, 5)
  const riskAreas = gaps.filter((gap) => String(gap.severity ?? '') === 'critical').slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader title={DISCOVERY_COPY.sponsorReadinessTitle} description={DISCOVERY_COPY.sponsorReadinessDescription} />

      <div style={cardStyle}>
        <Badge label={copy.label} tone={copy.tone} />
        <p style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.6, margin: '10px 0 0' }}>{copy.description}</p>
      </div>

      {assessment.label === 'not_enough_evidence' ? null : (
        <>
          <SummarySection
            title={DISCOVERY_COPY.sponsorReadinessStrongestCapabilities}
            items={strongest.map((cap) => String(cap.name ?? cap.label ?? cap.capabilityId ?? DISCOVERY_COPY.notAvailableYet))}
            emptyMessage={DISCOVERY_COPY.notAvailableYet}
          />
          <SummarySection
            title={DISCOVERY_COPY.sponsorReadinessCapabilitiesNeedingEvidence}
            items={needingEvidence.map((cap) => String(cap.name ?? cap.label ?? cap.capabilityId ?? DISCOVERY_COPY.notAvailableYet))}
            emptyMessage={DISCOVERY_COPY.noEvidenceFoundYet}
          />
          <SummarySection
            title={DISCOVERY_COPY.sponsorReadinessRiskAreas}
            items={riskAreas.map((gap) => String(gap.description ?? DISCOVERY_COPY.needsReview))}
            emptyMessage={DISCOVERY_COPY.needsReview}
          />
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              {DISCOVERY_COPY.sponsorReadinessNextStep}
            </div>
            <p style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.6, margin: 0 }}>
              {nextStepFor(assessment.label)}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function nextStepFor(label: SponsorReadinessLabel): string {
  switch (label) {
    case 'needs_additional_evidence':
      return 'Resolve critical evidence gaps before presenting this profile to a sponsor.'
    case 'needs_human_review':
      return 'Have a reviewer curate the available capabilities and evidence claims.'
    case 'presentation_ready':
      return 'This profile can be presented; continue monitoring for new evidence gaps.'
    default:
      return DISCOVERY_COPY.needsReview
  }
}

function SummarySection({
  title,
  items,
  emptyMessage,
}: {
  title: string
  items: string[]
  emptyMessage: string
}) {
  return (
    <section style={cardStyle}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>{title}</h3>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--txdd)' }}>{emptyMessage}</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`} style={{ fontSize: 13, color: 'var(--txd)' }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
