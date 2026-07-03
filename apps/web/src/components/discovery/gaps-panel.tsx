import type { DashboardData, GapIntelligenceData, GapEntry } from './types'
import { DISCOVERY_COPY } from './discovery-copy'
import { Badge, EmptyPanel, JsonBlock, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

function severityTone(severity: string): 'red' | 'amber' | 'default' {
  if (severity === 'critical') return 'red'
  if (severity === 'significant' || severity === 'moderate') return 'amber'
  return 'default'
}

/**
 * Suggested action for a gap, derived only from existing gap fields
 * (category / fillableByUpload). Never invents new gap facts — only maps
 * known signals to one of the fixed action labels from discovery-copy.
 */
function suggestedAction(gap: Record<string, unknown>): string {
  const category = String(gap.category ?? '').toLowerCase()
  if (gap.fillableByUpload) return DISCOVERY_COPY.actionUploadEvidence
  if (category.includes('external') || category.includes('confirmation')) return DISCOVERY_COPY.actionRequestExternalConfirmation
  if (category.includes('inconsistent') || category.includes('conflict')) return DISCOVERY_COPY.actionReviewInconsistency
  if (category.includes('expired') || category.includes('stale') || category.includes('outdated')) {
    return DISCOVERY_COPY.actionUpdateExpiredEvidence
  }
  return DISCOVERY_COPY.actionAddValidationNote
}

export function DiscoveryGapsPanel({
  data,
  loading,
  onAddNote,
}: {
  data: DashboardData | null
  loading: boolean
  onAddNote?: (targetType: string, targetId: string) => void
}) {
  if (loading && !data) return <PanelSkeleton />
  // Pre-21C fallback: derive from agent outputs
  if (!data) return <EmptyPanel message="No evidence gap analysis available yet." />

  // Sprint 21C: Prefer Evidence Gap Intelligence Engine output
  if (data.gapIntelligence) {
    return <EngineDrivenGapsPanel intelligence={data.gapIntelligence} onAddNote={onAddNote} />
  }

  const gapOutput = data.agentOutputs['evidence_gap_detector']?.output ?? null
  const reports = (gapOutput?.reports as Array<Record<string, unknown>> | undefined) ?? []
  const flatGaps = reports.flatMap((report) => (report.gaps as Array<Record<string, unknown>> | undefined) ?? [])

  if (!gapOutput) {
    return (
      <EmptyPanel
        message="Kadarn has not identified evidence gaps for this session yet."
        hint="Gaps appear once evidence claims and capabilities found are analyzed."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader title={DISCOVERY_COPY.evidenceGapsTitle} description={DISCOVERY_COPY.evidenceGapsDescription} />

      {flatGaps.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {flatGaps.slice(0, 30).map((gap) => (
            <GapCard
              key={String(gap.gapId ?? gap.description)}
              gap={gap}
              onAddNote={onAddNote}
            />
          ))}
        </div>
      ) : (
        <JsonBlock value={gapOutput} />
      )}
    </div>
  )
}

function GapCard({
  gap,
  onAddNote,
}: {
  gap: Record<string, unknown>
  onAddNote?: (targetType: string, targetId: string) => void
}) {
  const severity = String(gap.severity ?? 'unknown')
  const blocksReadiness = severity === 'critical'
  const gapId = String(gap.gapId ?? gap.description ?? '')
  const action = suggestedAction(gap)

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{String(gap.description ?? 'Evidence gap')}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge label={severity} tone={severityTone(severity)} />
        <span style={{ fontSize: 11, color: 'var(--txdd)' }}>{String(gap.category ?? 'gap')}</span>
        <Badge
          label={blocksReadiness ? DISCOVERY_COPY.gapBlocksSponsorReadiness : DISCOVERY_COPY.gapDoesNotBlockSponsorReadiness}
          tone={blocksReadiness ? 'red' : 'default'}
        />
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--txdd)' }}>
        <strong style={{ color: 'var(--txd)' }}>{DISCOVERY_COPY.gapWhyItMatters}: </strong>
        {blocksReadiness
          ? 'Critical gaps must be resolved before this evidence profile can be presented to a sponsor.'
          : 'This gap reduces confidence in the reconstructed evidence but does not block presentation on its own.'}
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txdd)' }}>
        <strong style={{ color: 'var(--txd)' }}>{DISCOVERY_COPY.gapNextAction}: </strong>
        {action}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <ActionButton label={DISCOVERY_COPY.actionUploadEvidence} enabled={false} />
        <ActionButton label={DISCOVERY_COPY.actionRequestExternalConfirmation} enabled={false} />
        <ActionButton label={DISCOVERY_COPY.actionReviewInconsistency} enabled={false} />
        <ActionButton label={DISCOVERY_COPY.actionUpdateExpiredEvidence} enabled={false} />
        <ActionButton
          label={DISCOVERY_COPY.actionAddValidationNote}
          enabled={Boolean(onAddNote && gapId)}
          onClick={() => onAddNote?.('EVIDENCE_GAP', gapId)}
        />
        <ActionButton label={DISCOVERY_COPY.actionDeferReview} enabled={false} />
      </div>
    </div>
  )
}

function ActionButton({
  label,
  enabled,
  onClick,
}: {
  label: string
  enabled: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={enabled ? onClick : undefined}
      aria-disabled={!enabled}
      title={enabled ? undefined : 'Not available for this gap yet — contextual guidance only.'}
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid rgba(148,163,184,.35)',
        background: enabled ? 'rgba(59,130,246,.12)' : 'transparent',
        color: enabled ? 'var(--tx)' : 'var(--txdd)',
        fontSize: 11,
        fontWeight: 600,
        cursor: enabled ? 'pointer' : 'not-allowed',
        opacity: enabled ? 1 : 0.55,
      }}
    >
      {label}
    </button>
  )
}

/** Sprint 21C: Render gaps from Evidence Gap Intelligence Engine output. */
function EngineDrivenGapsPanel({
  intelligence,
  onAddNote,
}: {
  intelligence: GapIntelligenceData
  onAddNote?: (targetType: string, targetId: string) => void
}) {
  if (intelligence.gaps.length === 0) {
    return (
      <EmptyPanel
        message="The evidence gap analysis found no significant gaps."
        hint="Gaps appear once evidence claims and capabilities are analyzed against expected standards."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title={DISCOVERY_COPY.evidenceGapsTitle}
        description={DISCOVERY_COPY.evidenceGapsDescription}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {intelligence.gaps.slice(0, 30).map((gap) => (
          <EngineGapCard key={gap.id} gap={gap} onAddNote={onAddNote} />
        ))}
      </div>
    </div>
  )
}

function EngineGapCard({
  gap,
  onAddNote,
}: {
  gap: GapEntry
  onAddNote?: (targetType: string, targetId: string) => void
}) {
  const blocksReadiness = gap.blocking
  const severityTone = gap.severity === 'blocking' || gap.severity === 'high' ? 'red'
    : gap.severity === 'moderate' ? 'amber' : 'default'

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{gap.title}</div>

      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge label={gap.severity} tone={severityTone} />
        <span style={{ fontSize: 11, color: 'var(--txdd)' }}>{gap.category.replace(/_/g, ' ')}</span>
        <Badge
          label={blocksReadiness ? DISCOVERY_COPY.gapBlocksSponsorReadiness : DISCOVERY_COPY.gapDoesNotBlockSponsorReadiness}
          tone={blocksReadiness ? 'red' : 'default'}
        />
        <Badge label={gap.review_status.replace(/_/g, ' ')} tone={gap.review_status === 'open' ? 'amber' : 'default'} />
      </div>

      {/* Affected capabilities */}
      {gap.affected_capabilities.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--txdd)' }}>
          <strong style={{ color: 'var(--txd)' }}>Affects: </strong>
          {gap.affected_capabilities.slice(0, 3).join(', ')}
        </div>
      )}

      {/* Affected research assets */}
      {gap.affected_research_assets.length > 0 && (
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--txdd)' }}>
          <strong style={{ color: 'var(--txd)' }}>Research assets at risk: </strong>
          {gap.affected_research_assets.join(', ')}
        </div>
      )}

      {/* Why it matters */}
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--txdd)' }}>
        <strong style={{ color: 'var(--txd)' }}>{DISCOVERY_COPY.gapWhyItMatters}: </strong>
        {blocksReadiness
          ? 'This gap blocks presentation readiness and must be resolved before this evidence profile can be presented to a sponsor.'
          : gap.severity === 'high'
            ? 'This is a high-severity gap that significantly impacts the evidence profile.'
            : 'This gap reduces completeness of the evidence profile but does not block presentation on its own.'}
      </div>

      {/* Evidence needed */}
      {gap.evidence_needed.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txdd)' }}>
          <strong style={{ color: 'var(--txd)' }}>Evidence needed: </strong>
          {gap.evidence_needed.slice(0, 2).join('; ')}
        </div>
      )}

      {/* Next action */}
      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txdd)' }}>
        <strong style={{ color: 'var(--txd)' }}>{DISCOVERY_COPY.gapNextAction}: </strong>
        {gap.recommended_next_action}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <ActionButton label={DISCOVERY_COPY.actionUploadEvidence} enabled={false} />
        <ActionButton label={DISCOVERY_COPY.actionRequestExternalConfirmation} enabled={false} />
        <ActionButton label={DISCOVERY_COPY.actionReviewInconsistency} enabled={false} />
        <ActionButton label={DISCOVERY_COPY.actionUpdateExpiredEvidence} enabled={false} />
        <ActionButton
          label={DISCOVERY_COPY.actionAddValidationNote}
          enabled={Boolean(onAddNote && gap.id)}
          onClick={() => onAddNote?.('EVIDENCE_GAP', gap.id)}
        />
        <ActionButton label={DISCOVERY_COPY.actionDeferReview} enabled={false} />
      </div>
    </div>
  )
}
