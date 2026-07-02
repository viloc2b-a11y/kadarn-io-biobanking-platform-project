import type { DashboardData, ProvenanceTargetType } from './types'
import { Badge, EmptyPanel, JsonBlock, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'
import { ViewProvenanceLink } from './view-provenance-link'

export function DiscoveryRelationshipsPanel({
  data,
  loading,
  onViewProvenance,
}: {
  data: DashboardData | null
  loading: boolean
  onViewProvenance?: (targetType: ProvenanceTargetType, targetId: string) => void
}) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No relationship data available yet." />

  const relationshipOutput =
    data.agentOutputs['relationship-extractor']?.output
    ?? data.agentOutputs['relationship_extractor']?.output
    ?? null

  const relationships = (relationshipOutput?.relationships as Array<Record<string, unknown>> | undefined) ?? []

  if (!relationshipOutput) {
    return (
      <EmptyPanel
        message="Kadarn has not inferred relationships for this session yet."
        hint="Relationships appear once entity extraction completes."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Connections Found"
        description="Connections Kadarn found evidence suggesting between entities. Provisional — requires review."
      />

      {relationships.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {relationships.slice(0, 40).map((rel) => {
            const relId = String(rel.relationshipId ?? `${rel.type}-${rel.sourceEntityId}-${rel.targetEntityId}`)
            return (
              <div key={relId} style={cardStyle}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <Badge label={String(rel.type ?? 'RELATIONSHIP')} />
                  {rel.confidence != null ? (
                    <span style={{ fontSize: 11, color: 'var(--txdd)' }}>
                      {Math.round(Number(rel.confidence) * 100)}% discovery confidence
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 13, color: 'var(--tx)' }}>
                  {String(rel.sourceEntityId ?? 'source')} → {String(rel.targetEntityId ?? 'target')}
                </div>
                <ViewProvenanceLink targetType="RELATIONSHIP" targetId={relId} onViewProvenance={onViewProvenance} />
              </div>
            )
          })}
        </div>
      ) : (
        <JsonBlock value={relationshipOutput} />
      )}
    </div>
  )
}
