import type { DashboardData, ProvenanceTargetType } from './types'
import { Badge, EmptyPanel, JsonBlock, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'
import { ViewProvenanceLink } from './view-provenance-link'

export function DiscoveryEntitiesPanel({
  data,
  loading,
  onViewProvenance,
}: {
  data: DashboardData | null
  loading: boolean
  onViewProvenance?: (targetType: ProvenanceTargetType, targetId: string) => void
}) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No entity extraction results yet." hint="Pipeline may still be running." />

  const entityOutput =
    data.agentOutputs['entity-extractor']?.output
    ?? data.agentOutputs['entity_extractor']?.output
    ?? null

  const entities = (entityOutput?.entities as Array<Record<string, unknown>> | undefined) ?? []

  if (!entityOutput) {
    return (
      <EmptyPanel
        message="Kadarn has not extracted entities for this session yet."
        hint="Entities appear once Layer 1 extraction and entity extraction complete."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="People, Sites & Studies"
        description="People, sites, and studies Kadarn found evidence suggesting across source documents. Reconstructed from available artifacts — needs human review."
      />

      {entities.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {entities.slice(0, 40).map((entity) => (
            <div key={String(entity.entityId ?? entity.value)} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{String(entity.value ?? 'Unknown')}</div>
                <Badge label={String(entity.type ?? 'ENTITY')} />
              </div>
              {entity.confidence != null ? (
                <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 6 }}>
                  Discovery confidence: {Math.round(Number(entity.confidence) * 100)}%
                </div>
              ) : null}
              <ViewProvenanceLink
                targetType="ENTITY"
                targetId={String(entity.entityId ?? '')}
                onViewProvenance={onViewProvenance}
              />
            </div>
          ))}
        </div>
      ) : (
        <JsonBlock value={entityOutput} />
      )}
    </div>
  )
}
