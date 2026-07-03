'use client'

import { useState, useMemo, useEffect } from 'react'
import type { AuditEntry, AuditEventType } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditViewerProps {
  entries: AuditEntry[]
  artifactIds: string[]
}

const EVENT_COLORS: Record<string, string> = {
  'delivery.requested': '#3B82F6',
  'policy.evaluated': '#8B5CF6',
  'template.selected': '#6366F1',
  'artifact.rendered': '#06B6D4',
  'artifact.created': '#10B981',
  'artifact.queued': '#F59E0B',
  'delivery.attempted': '#F97316',
  'delivery.succeeded': '#14B8A6',
  'delivery.failed': '#EF4444',
  'delivery.retried': '#EAB308',
  'delivery.dlq': '#DC2626',
  'receipt.received': '#3B82F6',
  'artifact.acknowledged': '#22C55E',
  'artifact.expired': '#6B7280',
  'artifact.revoked': '#991B1B',
}

const EVENT_TYPES: AuditEventType[] = [
  'delivery.requested', 'policy.evaluated', 'template.selected',
  'artifact.rendered', 'artifact.created', 'artifact.queued',
  'delivery.attempted', 'delivery.succeeded', 'delivery.failed',
  'delivery.retried', 'delivery.dlq', 'receipt.received',
  'artifact.acknowledged', 'artifact.expired', 'artifact.revoked',
]

// ─── Styles ─────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--navy2)',
  overflow: 'hidden',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--tx)',
}

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  padding: '12px 20px',
  borderBottom: '1px solid var(--border)',
  flexWrap: 'wrap',
  alignItems: 'center',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--navy1)',
  color: 'var(--tx)',
  cursor: 'pointer',
}

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  padding: '12px 20px',
  borderBottom: '1px solid var(--border)',
}

const statStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
}

const statValueStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--tx)',
  marginRight: 4,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: '2px solid var(--border)',
  color: 'var(--txd)',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--tx)',
  cursor: 'pointer',
}

const badgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  color: '#fff',
  background: color,
})

const integrityBadgeStyle = (valid: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  color: valid ? '#065F46' : '#991B1B',
  background: valid ? '#D1FAE5' : '#FEE2E2',
})

const expandedRowStyle: React.CSSProperties = {
  padding: '12px 14px',
  background: 'var(--navy1)',
  borderBottom: '1px solid var(--border)',
}

const payloadStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: 'var(--txd)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: 200,
  overflowY: 'auto',
}

const emptyStateStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: 'var(--txd)',
  fontSize: 14,
}

// ─── Hash verification ──────────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function serializeEntryForHash(e: AuditEntry): string {
  return `${e.sequenceNumber}|${e.eventType}|${e.artifactId}|${e.timestamp}|${e.actor}|${JSON.stringify(e.payload)}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AuditViewer({ entries, artifactIds }: AuditViewerProps) {
  const [artifactFilter, setArtifactFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('all')
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null)
  const [integrity, setIntegrity] = useState<{ valid: boolean; brokenAt?: number; computing: boolean }>({ valid: true, computing: true })

  // Compute integrity
  useEffect(() => {
    let cancelled = false
    async function check() {
      const sorted = [...entries].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      let previousHash: string | null = null
      for (const entry of sorted) {
        if (cancelled) return
        const serialized = serializeEntryForHash(entry)
        const expectedHash = await sha256(serialized + (previousHash ?? ''))
        if (entry.hash !== expectedHash) {
          setIntegrity({ valid: false, brokenAt: entry.sequenceNumber, computing: false })
          return
        }
        previousHash = entry.hash
      }
      if (!cancelled) setIntegrity({ valid: true, computing: false })
    }
    check()
    return () => { cancelled = true }
  }, [entries])

  // Filter
  const filtered = useMemo(() => {
    let result = entries
    if (artifactFilter !== 'all') result = result.filter(e => e.artifactId === artifactFilter)
    if (eventFilter !== 'all') result = result.filter(e => e.eventType === eventFilter)
    if (timeRange !== 'all') {
      const now = Date.now()
      const ranges: Record<string, number> = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }
      const cutoff = now - (ranges[timeRange] ?? 0)
      result = result.filter(e => new Date(e.timestamp).getTime() >= cutoff)
    }
    return result.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }, [entries, artifactFilter, eventFilter, timeRange])

  const artifactCount = new Set(entries.map(e => e.artifactId)).size

  return (
    <section style={sectionStyle}>
      {/* Header */}
      <div style={sectionHeaderStyle}>
        <h3 style={sectionTitleStyle}>Audit Trail</h3>
        <span style={integrityBadgeStyle(integrity.valid)}>
          {integrity.computing ? '⏳ Computing...' : integrity.valid ? '🔒 Chain Valid' : `🔓 Chain Broken at seq ${integrity.brokenAt}`}
        </span>
      </div>

      {/* Filters */}
      <div style={filterBarStyle}>
        <label style={{ fontSize: 12, color: 'var(--txd)' }}>Artifact:</label>
        <select value={artifactFilter} onChange={e => setArtifactFilter(e.target.value)} style={selectStyle}>
          <option value="all">All artifacts</option>
          {artifactIds.map(id => (
            <option key={id} value={id}>{id.slice(0, 12)}...</option>
          ))}
        </select>

        <label style={{ fontSize: 12, color: 'var(--txd)', marginLeft: 8 }}>Event:</label>
        <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={selectStyle}>
          <option value="all">All events</option>
          {EVENT_TYPES.map(et => (
            <option key={et} value={et}>{et}</option>
          ))}
        </select>

        <label style={{ fontSize: 12, color: 'var(--txd)', marginLeft: 8 }}>Time:</label>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={selectStyle}>
          <option value="all">All time</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
        </select>
      </div>

      {/* Stats */}
      <div style={statsRowStyle}>
        <span style={statStyle}><span style={statValueStyle}>{filtered.length}</span>Total events</span>
        <span style={statStyle}><span style={statValueStyle}>{artifactCount}</span>Artifacts tracked</span>
        {filtered.length > 0 && (
          <span style={statStyle}><span style={statValueStyle}>{filtered[filtered.length - 1].timestamp.slice(0, 16).replace('T', ' ')}</span>Latest event</span>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={emptyStateStyle}>No audit entries match filters</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Seq#</th>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Event Type</th>
                <th style={thStyle}>Artifact ID</th>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Hash</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <>
                  <tr
                    key={e.sequenceNumber}
                    style={{ background: e.sequenceNumber === integrity.brokenAt ? '#FEE2E2' : expandedSeq === e.sequenceNumber ? 'var(--navy1)' : 'transparent' }}
                    onClick={() => setExpandedSeq(expandedSeq === e.sequenceNumber ? null : e.sequenceNumber)}
                  >
                    <td style={tdStyle}>{e.sequenceNumber}</td>
                    <td style={tdStyle}>{e.timestamp.slice(0, 16).replace('T', ' ')}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(EVENT_COLORS[e.eventType] ?? '#6B7280')}>{e.eventType}</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{e.artifactId.slice(0, 12)}...</td>
                    <td style={tdStyle}>{e.actor}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{e.hash.slice(0, 8)}...</td>
                  </tr>
                  {expandedSeq === e.sequenceNumber && (
                    <tr key={`expanded-${e.sequenceNumber}`}>
                      <td colSpan={6} style={expandedRowStyle}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txd)', marginBottom: 6 }}>Payload + Hash Chain</div>
                        <div style={payloadStyle}>{JSON.stringify({ payload: e.payload, previousHash: e.previousHash, hash: e.hash }, null, 2)}</div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
