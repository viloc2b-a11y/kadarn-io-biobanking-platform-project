import type { DashboardData } from './types'
import { Badge, EmptyPanel, ListCard, PanelHeader, PanelSkeleton } from './panel-primitives'

function resolveSnapshotOutput(data: DashboardData) {
  return (
    data.agentOutputs['evidence_snapshot']?.output
    ?? data.agentOutputs['snapshot_builder']?.output
    ?? data.agentOutputs['institutional_timeline_engine']?.output
    ?? null
  )
}

export function DiscoverySnapshotPanel({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No snapshot available." hint="Open a discovery session and run the pipeline." />

  const snapshotOutput = resolveSnapshotOutput(data)
  const summary = snapshotOutput?.summary as Record<string, unknown> | undefined
  const inventory = (snapshotOutput?.documentInventory as Array<Record<string, unknown>> | undefined) ?? []
  const uncertainty = (snapshotOutput?.uncertainty as Array<Record<string, unknown>> | undefined) ?? []

  if (!snapshotOutput) {
    return (
      <EmptyPanel
        message="Evidence Snapshot has not been generated for this session yet."
        hint="Run the pipeline to reconstruct a snapshot from available artifacts."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Evidence Snapshot"
        description="Kadarn found evidence suggesting an institutional evidence footprint, reconstructed from available artifacts. Provisional until reviewed — not canonical evidence."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        <SnapshotStat label="Artifacts Processed" value={statValue(summary?.artifactsProcessed, data.counts.artifacts)} />
        <SnapshotStat label="Documents Classified" value={statValue(summary?.documentsClassified, '—')} />
        <SnapshotStat label="Entities inferred" value={statValue(summary?.entitiesDetected, data.counts.entities)} />
        <SnapshotStat label="Relationships" value={statValue(summary?.relationshipsDetected, data.counts.relationships)} />
        <SnapshotStat label="Unknown Documents" value={statValue(summary?.unknownDocuments, '—')} />
        <SnapshotStat label="Requires Review" value={statValue(summary?.requiresReview, '—')} />
      </div>

      {inventory.length > 0 ? (
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Document inventory</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {inventory.slice(0, 12).map((doc) => (
              <ListCard
                key={String(doc.sourceArtifactId ?? doc.filename)}
                title={String(doc.filename ?? 'Unknown document')}
                meta={
                  <>
                    Type: {String(doc.documentType ?? 'unknown')}
                    {doc.confidence != null ? ` · Discovery confidence: ${Math.round(Number(doc.confidence) * 100)}%` : null}
                  </>
                }
              >
                {doc.requiresHumanReview ? <Badge label="Requires review" tone="amber" /> : null}
              </ListCard>
            ))}
          </div>
        </section>
      ) : null}

      {uncertainty.length > 0 ? (
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 10 }}>Uncertainty signals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {uncertainty.slice(0, 8).map((item, idx) => (
              <ListCard
                key={`${item.type}-${idx}`}
                title={String(item.description ?? 'Uncertainty')}
                meta={String(item.type ?? 'unknown')}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function statValue(value: unknown, fallback: string | number): string | number {
  if (value == null) return fallback
  if (typeof value === 'number' || typeof value === 'string') return value
  return fallback
}

function SnapshotStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(15,23,42,.35)', padding: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}>{value}</div>
    </div>
  )
}
