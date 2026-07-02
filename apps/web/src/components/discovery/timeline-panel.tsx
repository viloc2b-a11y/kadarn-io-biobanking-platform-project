import type { DashboardData } from './types'
import { EmptyPanel, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'

export function DiscoveryTimelinePanel({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No timeline reconstructed yet." />

  const timelineOutput = data.agentOutputs['institutional_timeline_engine']?.output ?? null
  const timeline = timelineOutput?.timeline as Array<Record<string, unknown>> | undefined

  if (!timeline || timeline.length === 0) {
    return (
      <EmptyPanel
        message="Kadarn has not reconstructed a timeline for this session yet."
        hint="Timeline events are inferred from dates and entities in available artifacts."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <PanelHeader
        title="Evidence Timeline"
        description="Chronological reconstruction Kadarn inferred from available artifacts. Provisional — needs human review."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeline.slice(0, 40).map((event, idx) => (
          <div key={`${String(event.date)}-${String(event.description)}-${idx}`} style={cardStyle}>
            <div style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 4 }}>
              {event.date ? new Date(String(event.date)).toLocaleDateString() : 'Date unknown'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{String(event.description ?? '')}</div>
            {event.sourceEntityValues && Array.isArray(event.sourceEntityValues) && event.sourceEntityValues.length > 0 ? (
              <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>
                Entities: {(event.sourceEntityValues as string[]).join(', ')}
              </div>
            ) : null}
            <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>
              Discovery confidence: {Math.round(Number(event.confidence ?? 0) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
