import type { DashboardData } from './types'
import { PanelHeader, PanelSkeleton, cardStyle, EmptyPanel } from './panel-primitives'

export function DiscoveryDocumentsPanel({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No source documents available." hint="Open an institutional discovery session." />

  const documents = data.artifacts ?? []

  if (documents.length === 0) {
    return (
      <EmptyPanel
        message="No Layer 0 artifacts ingested for this session yet."
        hint="Upload or connect source documents to begin reconstruction."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PanelHeader
        title="Evidence Documents"
        description="Layer 0 artifacts processed during institutional discovery. Reconstructed from available files — not canonical Evidence Core records."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {documents.map((doc) => (
          <div key={doc.id} style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{doc.file_name}</div>
            <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 6 }}>
              Type: {doc.artifact_type} · {formatBytes(doc.size_bytes)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>Source: {doc.source}</div>
            <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 4 }}>
              Received: {new Date(doc.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}
