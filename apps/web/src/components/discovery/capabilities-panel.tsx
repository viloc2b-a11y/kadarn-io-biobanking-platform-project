import type { DashboardData, ProvenanceTargetType } from './types'
import { Badge, EmptyPanel, JsonBlock, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'
import { ViewProvenanceLink } from './view-provenance-link'

export function DiscoveryCapabilitiesPanel({
  data,
  loading,
  onViewProvenance,
}: {
  data: DashboardData | null
  loading: boolean
  onViewProvenance?: (targetType: ProvenanceTargetType, targetId: string) => void
}) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No capabilities found yet." />

  const capabilityOutput = data.agentOutputs['capability_detector']?.output ?? null
  const capabilities = (capabilityOutput?.capabilities as Array<Record<string, unknown>> | undefined) ?? []

  if (!capabilityOutput) {
    return (
      <EmptyPanel
        message="Kadarn has not found capabilities for this session yet."
        hint="Capabilities found appear after the capability detector runs."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Capabilities Found"
        description="Kadarn found evidence suggesting operational capabilities. Each item is a possible capability — not a confirmed institutional claim."
      />

      {capabilities.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {capabilities.slice(0, 30).map((cap) => (
            <div key={String(cap.capabilityId ?? cap.name)} style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>
                {String(cap.name ?? cap.label ?? cap.capabilityId ?? 'Possible capability')}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cap.status ? <Badge label={String(cap.status)} tone="amber" /> : null}
                {cap.category ? <Badge label={String(cap.category)} /> : null}
              </div>
              {cap.reasoning ? (
                <div style={{ fontSize: 12, color: 'var(--txdd)', marginTop: 8, lineHeight: 1.5 }}>
                  {String(cap.reasoning)}
                </div>
              ) : null}
              <ViewProvenanceLink
                targetType="CAPABILITY"
                targetId={String(cap.capabilityId ?? '')}
                onViewProvenance={onViewProvenance}
              />
            </div>
          ))}
        </div>
      ) : (
        <JsonBlock value={capabilityOutput} />
      )}
    </div>
  )
}
