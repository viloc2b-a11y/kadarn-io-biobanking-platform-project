import type { DashboardData } from './types'
import {
  mapCapabilitiesToResearchAssets,
  type ResearchAssetStatus,
} from './lib'
import { Badge, EmptyPanel, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

function statusTone(status: ResearchAssetStatus): 'green' | 'amber' | 'default' {
  if (status === 'Enabled by current evidence') return 'green'
  if (status === 'Needs additional evidence' || status === 'Needs human review') return 'amber'
  return 'default'
}

export function ResearchAssetsEnabledPanel({
  data,
  loading,
}: {
  data: DashboardData | null
  loading: boolean
}) {
  if (loading && !data) return <PanelSkeleton />

  if (!data) {
    return <EmptyPanel message="No discovery data available yet." />
  }

  const capabilityOutput = data.agentOutputs['capability_detector']?.output ?? null
  const capabilities =
    (capabilityOutput?.capabilities as Array<Record<string, unknown>> | undefined) ?? []

  const claimOutput = data.agentOutputs['claim_candidate_detector']?.output ?? null
  const claims =
    (claimOutput?.candidates as Array<Record<string, unknown>> | undefined) ?? []

  const gapOutput = data.agentOutputs['evidence_gap_detector']?.output ?? null
  const gapReports =
    (gapOutput?.reports as Array<Record<string, unknown>> | undefined) ?? []
  const gaps = gapReports.flatMap(
    (report) => (report.gaps as Array<Record<string, unknown>> | undefined) ?? [],
  )

  // Derive research assets from capabilities, claims, and gaps — no API calls, no backend changes.
  const assets = mapCapabilitiesToResearchAssets(capabilities, claims, gaps)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Research Assets Enabled"
        description="What types of research assets this institution appears prepared to generate, based on currently discovered capabilities and evidence. This is a derived view — it does not represent actual inventory."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {assets.map((entry) => (
          <ResearchAssetCard key={entry.asset} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function ResearchAssetCard({
  entry,
}: {
  entry: {
    asset: string
    status: ResearchAssetStatus
    supportingCapabilities: string[]
    supportingClaims: string[]
    missingRequirements: string[]
    nextStep: string
  }
}) {
  const tone = statusTone(entry.status)

  return (
    <div style={cardStyle}>
      {/* Asset name */}
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>
        {entry.asset}
      </div>

      {/* Status badge */}
      <Badge label={entry.status} tone={tone} />

      {/* Supporting capabilities */}
      {entry.supportingCapabilities.length > 0 ? (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--txdd)' }}>
          <span style={{ fontWeight: 600, color: 'var(--txd)' }}>
            Enabled by current evidence:{' '}
          </span>
          {entry.supportingCapabilities.join(', ')}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--txdd)' }}>
          <span style={{ fontWeight: 600, color: 'var(--txd)' }}>
            Potentially enabled
          </span>
          {' — '}no matching capability detected yet.
        </div>
      )}

      {/* Supporting claims */}
      {entry.supportingClaims.length > 0 ? (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txdd)' }}>
          <span style={{ fontWeight: 600, color: 'var(--txd)' }}>
            Supporting claims:{' '}
          </span>
          {entry.supportingClaims.join(', ')}
        </div>
      ) : null}

      {/* Missing requirements */}
      {entry.missingRequirements.length > 0 ? (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--amber)' }}>
          <span style={{ fontWeight: 600 }}>Missing requirements: </span>
          {entry.missingRequirements.map((req, i) => (
            <span key={i}>
              {i > 0 ? '; ' : ''}
              {req}
            </span>
          ))}
        </div>
      ) : null}

      {/* Next step */}
      <div
        style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(59,130,246,.08)',
          border: '1px solid rgba(59,130,246,.15)',
          fontSize: 12,
          color: 'var(--txd)',
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--tx)' }}>Recommended next step: </span>
        {entry.nextStep}
      </div>
    </div>
  )
}
