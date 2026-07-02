import type { DashboardData } from './types'
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
  if (!data) return <EmptyPanel message="No evidence gap analysis available yet." />

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
