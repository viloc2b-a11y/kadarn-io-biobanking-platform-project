import type { DashboardData, DashboardTab } from './types'
import { DISCOVERY_COPY } from './discovery-copy'
import { EmptyPanel, PanelSkeleton, cardStyle } from './panel-primitives'

export function RecognitionOverviewPanel({
  data,
  loading,
  variant,
  onNavigateTab,
}: {
  data: DashboardData | null
  loading: boolean
  variant: 'site' | 'koc'
  onNavigateTab?: (tab: DashboardTab) => void
}) {
  if (loading && !data) return <PanelSkeleton rows={3} />
  if (!data) return <EmptyPanel message={DISCOVERY_COPY.firstRunEmpty} />

  const headline = variant === 'koc' ? DISCOVERY_COPY.reviewHeadline : DISCOVERY_COPY.recognitionHeadline
  const subheadline = variant === 'koc' ? DISCOVERY_COPY.reviewSubheadline : DISCOVERY_COPY.recognitionSubheadline

  const profileOutput =
    data.agentOutputs['profile_builder']?.output ?? data.agentOutputs['institutional_profile']?.output ?? null
  const profileSummary = (profileOutput as Record<string, unknown> | null)?.summary as Record<string, unknown> | null
  const institutionName = profileSummary?.institutionName ? String(profileSummary.institutionName) : null

  const capabilityOutput = data.agentOutputs['capability_detector']?.output ?? null
  const capabilities = (capabilityOutput?.capabilities as Array<Record<string, unknown>> | undefined) ?? []
  const strengths = capabilities.slice(0, 3).map((cap) => String(cap.name ?? cap.label ?? cap.capabilityId ?? DISCOVERY_COPY.notAvailableYet))

  const gapOutput = data.agentOutputs['evidence_gap_detector']?.output ?? null
  const gapReports = (gapOutput?.reports as Array<Record<string, unknown>> | undefined) ?? []
  const gaps = gapReports.flatMap((report) => (report.gaps as Array<Record<string, unknown>> | undefined) ?? [])
  const keyGaps = gaps.slice(0, 3).map((gap) => String(gap.description ?? DISCOVERY_COPY.needsReview))

  const narrativeOutput = data.agentOutputs['narrative_engine']?.output ?? null
  const narrativeSummary = (narrativeOutput as Record<string, unknown> | null)?.summary as string | undefined

  const evidenceFoundSummary = `${data.counts.artifacts} artifacts, ${data.counts.entities} entities, ${data.counts.relationships} relationships, ${data.counts.candidates} claim candidates found.`

  const validationNoteCount = data.validationNotes?.length ?? 0
  const curationEventCount = data.curationEvents?.length ?? 0
  const pendingReviewCount = data.candidates?.length ?? 0

  const recommendedNextAction = deriveRecommendedNextAction({
    variant,
    hasGaps: gaps.length > 0,
    hasCapabilities: capabilities.length > 0,
    pendingReviewCount,
    onNavigateTab,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--tx)', marginBottom: 6 }}>{headline}</h2>
        <p style={{ fontSize: 13, color: 'var(--txdd)', maxWidth: 720 }}>{subheadline}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <SummaryCard label="Institution" value={institutionName ?? DISCOVERY_COPY.notAvailableYet} />
        <SummaryCard label="Session status" value={data.session.status.replace(/_/g, ' ')} />
        <SummaryCard label="Evidence found" value={evidenceFoundSummary} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <ListSummaryCard
          title="Key strengths"
          items={strengths}
          emptyMessage={narrativeSummary ? narrativeSummary : DISCOVERY_COPY.noEvidenceFoundYet}
        />
        <ListSummaryCard title="Key gaps" items={keyGaps} emptyMessage={DISCOVERY_COPY.noEvidenceFoundYet} />
      </div>

      {variant === 'koc' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <SummaryCard label="Pending review" value={pendingReviewCount} />
          <SummaryCard label="Curation events recorded" value={curationEventCount} />
          <SummaryCard label="Validation notes" value={validationNoteCount} />
        </div>
      ) : null}

      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
          {DISCOVERY_COPY.recommendedNextAction}
        </div>
        <p style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.6, margin: 0 }}>{recommendedNextAction}</p>
      </div>
    </div>
  )
}

function deriveRecommendedNextAction({
  variant,
  hasGaps,
  hasCapabilities,
  pendingReviewCount,
}: {
  variant: 'site' | 'koc'
  hasGaps: boolean
  hasCapabilities: boolean
  pendingReviewCount: number
  onNavigateTab?: (tab: DashboardTab) => void
}): string {
  if (variant === 'koc') {
    if (pendingReviewCount > 0) return 'Review pending claim candidates in Review & Improve Evidence.'
    if (hasGaps) return 'Assess outstanding evidence gaps for curation priority.'
    return 'No pending review items right now.'
  }
  if (hasGaps) return 'Review Evidence Gaps and upload evidence where possible.'
  if (hasCapabilities) return 'Review Capabilities Found and confirm accuracy with a validation note.'
  return DISCOVERY_COPY.notAvailableYet
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{value}</div>
    </div>
  )
}

function ListSummaryCard({ title, items, emptyMessage }: { title: string; items: string[]; emptyMessage: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        {title}
      </div>
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
    </div>
  )
}
