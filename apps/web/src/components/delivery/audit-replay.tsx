'use client'

import { useState, useMemo } from 'react'
import type { AuditEntry } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditReplayProps {
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

const controlBarStyle: React.CSSProperties = {
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

const buttonStyle: React.CSSProperties = {
  padding: '6px 16px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: 'none',
  background: 'var(--teal)',
  color: '#fff',
  cursor: 'pointer',
}

const summaryCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 12,
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
}

const summaryItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txd)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const summaryValueStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--tx)',
}

const timelineStyle: React.CSSProperties = {
  padding: '16px 20px',
  position: 'relative',
}

const timelineItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  position: 'relative',
  minHeight: 48,
}

const timelineLeftStyle: React.CSSProperties = {
  width: 110,
  flexShrink: 0,
  textAlign: 'right',
  paddingTop: 2,
}

const timelineCenterStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 16,
  flexShrink: 0,
  position: 'relative',
}

const dotStyle = (color: string): React.CSSProperties => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: color,
  zIndex: 1,
  flexShrink: 0,
  marginTop: 4,
})

const lineStyle: React.CSSProperties = {
  width: 2,
  flex: 1,
  background: 'var(--border)',
  marginTop: -2,
}

const timelineRightStyle: React.CSSProperties = {
  flex: 1,
  paddingBottom: 20,
}

const badgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  color: '#fff',
  background: color,
  marginBottom: 4,
})

const emptyStateStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: 'var(--txd)',
  fontSize: 14,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AuditReplay({ entries, artifactIds }: AuditReplayProps) {
  const [selectedArtifact, setSelectedArtifact] = useState('')
  const [replayed, setReplayed] = useState(false)

  const timeline = useMemo(() => {
    if (!selectedArtifact) return []
    return entries
      .filter(e => e.artifactId === selectedArtifact)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }, [entries, selectedArtifact])

  const summary = useMemo(() => {
    if (timeline.length === 0) return null
    const first = timeline[0]
    const last = timeline[timeline.length - 1]
    const start = new Date(first.timestamp).getTime()
    const end = new Date(last.timestamp).getTime()

    // Derive current status and final outcome
    const statusEvents = ['artifact.created', 'artifact.queued', 'delivery.succeeded', 'artifact.acknowledged', 'artifact.expired', 'artifact.revoked']
    const currentStatus = [...timeline].reverse().find(e => statusEvents.includes(e.eventType))
    const outcomeEvents = ['delivery.succeeded', 'delivery.failed', 'delivery.dlq', 'artifact.revoked', 'artifact.expired']
    const finalOutcome = [...timeline].reverse().find(e => outcomeEvents.includes(e.eventType))

    return {
      totalEvents: timeline.length,
      duration: end - start,
      currentStatus: currentStatus?.eventType ?? 'unknown',
      finalOutcome: finalOutcome?.eventType ?? 'in-progress',
      successCount: timeline.filter(e => e.eventType === 'delivery.succeeded').length,
      failCount: timeline.filter(e => e.eventType === 'delivery.failed').length,
    }
  }, [timeline])

  const handleReplay = () => {
    if (selectedArtifact) setReplayed(true)
  }

  return (
    <section style={sectionStyle}>
      {/* Header */}
      <div style={sectionHeaderStyle}>
        <h3 style={sectionTitleStyle}>Artifact Replay</h3>
      </div>

      {/* Controls */}
      <div style={controlBarStyle}>
        <label style={{ fontSize: 12, color: 'var(--txd)' }}>Artifact:</label>
        <select
          value={selectedArtifact}
          onChange={e => { setSelectedArtifact(e.target.value); setReplayed(false) }}
          style={selectStyle}
        >
          <option value="">Select artifact...</option>
          {artifactIds.map(id => (
            <option key={id} value={id}>{id.slice(0, 12)}...</option>
          ))}
        </select>
        <button onClick={handleReplay} disabled={!selectedArtifact} style={{ ...buttonStyle, opacity: selectedArtifact ? 1 : 0.5 }}>
          ▶ Replay
        </button>
      </div>

      {/* Content */}
      {!selectedArtifact ? (
        <div style={emptyStateStyle}>Select an artifact to replay its delivery timeline</div>
      ) : !replayed ? (
        <div style={emptyStateStyle}>Click Replay to reconstruct the delivery timeline for this artifact</div>
      ) : timeline.length === 0 ? (
        <div style={emptyStateStyle}>No events found for this artifact</div>
      ) : (
        <>
          {/* Summary */}
          {summary && (
            <div style={summaryCardStyle}>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Total Events</span>
                <span style={summaryValueStyle}>{summary.totalEvents}</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Duration</span>
                <span style={summaryValueStyle}>{Math.round(summary.duration / 1000)}s</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Current Status</span>
                <span style={summaryValueStyle}>{summary.currentStatus}</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Final Outcome</span>
                <span style={summaryValueStyle}>{summary.finalOutcome}</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={summaryLabelStyle}>Success / Fail</span>
                <span style={summaryValueStyle}>{summary.successCount} / {summary.failCount}</span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div style={timelineStyle}>
            {timeline.map((e, i) => (
              <div key={e.sequenceNumber} style={timelineItemStyle}>
                {/* Left: seq + time */}
                <div style={timelineLeftStyle}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx)' }}>#{e.sequenceNumber}</div>
                  <div style={{ fontSize: 10, color: 'var(--txd)' }}>{e.timestamp.slice(11, 16)}</div>
                </div>

                {/* Center: dot + line */}
                <div style={timelineCenterStyle}>
                  <div style={dotStyle(EVENT_COLORS[e.eventType] ?? '#6B7280')} />
                  {i < timeline.length - 1 && <div style={lineStyle} />}
                </div>

                {/* Right: event info */}
                <div style={timelineRightStyle}>
                  <span style={badgeStyle(EVENT_COLORS[e.eventType] ?? '#6B7280')}>{e.eventType}</span>
                  <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 2 }}>
                    Actor: <strong style={{ color: 'var(--tx)' }}>{e.actor}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txd)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {JSON.stringify(e.payload).slice(0, 120)}{JSON.stringify(e.payload).length > 120 ? '...' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
