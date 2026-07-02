import type { DashboardData } from './types'
import { EmptyPanel, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

export function DiscoveryProfilePanel({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) {
    return <PanelSkeleton />
  }

  if (!data) {
    return <EmptyPanel message="No Institution Profile available yet." hint="Open a session and run the pipeline." />
  }

  const profileOutput = data.agentOutputs['profile_builder']?.output ?? data.agentOutputs['institutional_profile']?.output ?? null

  if (!profileOutput) {
    return (
      <EmptyPanel
        message="Institution Profile has not been assembled for this session."
        hint="Pipeline outputs appear here once reconstruction completes."
      />
    )
  }

  const summary = (profileOutput as Record<string, unknown>).summary as Record<string, unknown> | null
  const components = (profileOutput as Record<string, unknown>).components ?? {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Institution Profile"
        description="Combined view of timeline, capabilities found, evidence claims, gaps, and story — reconstructed from available artifacts and requiring review."
      />

      {summary ? (
        <section style={cardStyle}>
          <h3 style={sectionTitle}>Summary</h3>
          <dl style={dlStyle}>
            <dt>Institution</dt>
            <dd>{String(summary.institutionName ?? '—')}</dd>
            <dt>Active years</dt>
            <dd>
              {String(summary.activeYears && typeof summary.activeYears === 'object'
                ? (summary.activeYears as Record<string, unknown>).start ?? '—'
                : '—')}{' '}
              –{' '}
              {String(summary.activeYears && typeof summary.activeYears === 'object'
                ? (summary.activeYears as Record<string, unknown>).end ?? 'present'
                : 'present')}
            </dd>
            <dt>Capabilities found</dt>
            <dd>
              {String(summary.confirmedCapabilities ?? 0)} supported by extraction signals ·{' '}
              {String(summary.suspectedCapabilities ?? 0)} tentative
            </dd>
            <dt>Evidence claims</dt>
            <dd>{String(summary.totalClaimCandidates ?? 0)}</dd>
            <dt>Evidence gaps</dt>
            <dd>{String(summary.totalGaps ?? 0)}</dd>
            <dt>Narrative</dt>
            <dd>{String(summary.narrativeSummary ?? '—')}</dd>
          </dl>
        </section>
      ) : null}

      <section style={cardStyle}>
        <h3 style={sectionTitle}>Components</h3>
        <pre style={preStyle}>{JSON.stringify(components, null, 2)}</pre>
      </section>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 10,
}

const preStyle: React.CSSProperties = {
  background: 'rgba(2,6,23,.65)',
  borderRadius: 12,
  padding: 14,
  border: '1px solid rgba(148,163,184,.2)',
  color: 'var(--tx)',
  fontSize: 12,
  maxHeight: 360,
  overflow: 'auto',
}

const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: '6px 12px',
  fontSize: 13,
  color: 'var(--txd)',
}
