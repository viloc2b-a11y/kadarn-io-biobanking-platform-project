'use client'

import { useState, useMemo } from 'react'
import type { AuditEntry, AuditEventType } from '@kadarn/delivery-domain'
import { getUniqueArtifactIds, getArtifactById } from './mock-data'

// ─── Event colors ────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  'delivery.requested':    '#2563eb',
  'policy.evaluated':      '#7c3aed',
  'template.selected':     '#6366f1',
  'artifact.rendered':     '#06b6d4',
  'artifact.created':      '#16a34a',
  'artifact.queued':       '#ca8a04',
  'delivery.attempted':    '#ea580c',
  'delivery.succeeded':    '#0d9488',
  'delivery.failed':       '#dc2626',
  'delivery.retried':      '#d97706',
  'delivery.dlq':          '#991b1b',
  'receipt.received':      '#2563eb',
  'artifact.acknowledged': '#16a34a',
  'artifact.expired':      '#6b7280',
  'artifact.revoked':      '#7f1d1d',
}

const ALL_EVENT_TYPES: AuditEventType[] = [
  'delivery.requested', 'policy.evaluated', 'template.selected',
  'artifact.rendered', 'artifact.created', 'artifact.queued',
  'delivery.attempted', 'delivery.succeeded', 'delivery.failed',
  'delivery.retried', 'delivery.dlq', 'receipt.received',
  'artifact.acknowledged', 'artifact.expired', 'artifact.revoked',
]

function eventLabel(evt: AuditEventType): string {
  return evt.replace(/^(delivery|artifact)\./, '')
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface HistoryTimelineProps {
  entries: AuditEntry[]
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 20,
  flexWrap: 'wrap' as const,
  alignItems: 'center',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--navy2)',
  color: 'var(--tx)',
  outline: 'none',
}

const timelineStyle: React.CSSProperties = {
  position: 'relative' as const,
  paddingLeft: 32,
}

const lineStyle: React.CSSProperties = {
  position: 'absolute' as const,
  left: 11,
  top: 8,
  bottom: 8,
  width: 2,
  background: 'var(--border)',
}

const dotStyle = (color: string): React.CSSProperties => ({
  position: 'absolute' as const,
  left: 3,
  top: 14,
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: color,
  border: '2px solid var(--navy2)',
  zIndex: 1,
})

const entryCardStyle: React.CSSProperties = {
  position: 'relative' as const,
  marginBottom: 14,
  padding: '12px 16px',
  background: 'var(--navy2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
}

const entryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 6,
  flexWrap: 'wrap' as const,
}

const timeStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txd)',
  fontFamily: 'monospace',
}

const actorStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txd)',
}

const artifactIdStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txd)',
  fontFamily: 'monospace',
}

const payloadStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txd)',
  fontFamily: 'monospace',
  background: 'var(--navy1, #0f172a)',
  padding: '6px 10px',
  borderRadius: 6,
  marginTop: 6,
  maxHeight: 80,
  overflow: 'hidden',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
}

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '40px 20px',
  color: 'var(--txd)',
  fontSize: 14,
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncateId(id: string, length = 10): string {
  return id.slice(0, length) + '…'
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HistoryTimeline({ entries }: HistoryTimelineProps) {
  const [eventFilter, setEventFilter] = useState<AuditEventType | 'all'>('all')
  const [artifactIdFilter, setArtifactIdFilter] = useState<string>('all')

  const artifactIds = useMemo(() => getUniqueArtifactIds(entries), [entries])

  const filtered = useMemo(() => {
    return [...entries]
      .filter((e) => {
        if (eventFilter !== 'all' && e.eventType !== eventFilter) return false
        if (artifactIdFilter !== 'all' && e.artifactId !== artifactIdFilter) return false
        return true
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [entries, eventFilter, artifactIdFilter])

  return (
    <div>
      {/* ── Filters ── */}
      <div style={filterBarStyle}>
        <select
          style={selectStyle}
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value as AuditEventType | 'all')}
        >
          <option value="all">All Events</option>
          {ALL_EVENT_TYPES.map((et) => (
            <option key={et} value={et}>{eventLabel(et)}</option>
          ))}
        </select>

        <select
          style={selectStyle}
          value={artifactIdFilter}
          onChange={(e) => setArtifactIdFilter(e.target.value)}
        >
          <option value="all">All Artifacts</option>
          {artifactIds.map((id) => {
            const a = getArtifactById(id)
            const label = a?.metadata?.templateName
              ? `${(a.metadata.templateName as string)} (${truncateId(id, 8)})`
              : truncateId(id, 8)
            return (
              <option key={id} value={id}>{label}</option>
            )
          })}
        </select>

        <span style={{ fontSize: 12, color: 'var(--txd)', marginLeft: 'auto' }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Timeline ── */}
      {filtered.length === 0 ? (
        <div style={emptyStateStyle}>No events match filters</div>
      ) : (
        <div style={timelineStyle}>
          <div style={lineStyle} />
          {filtered.map((evt) => {
            const color = EVENT_COLORS[evt.eventType] ?? '#6b7280'
            return (
              <div key={evt.id} style={entryCardStyle}>
                <div style={dotStyle(color)} />
                <div style={entryHeaderStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      background: color,
                      padding: '2px 7px',
                      borderRadius: 5,
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {eventLabel(evt.eventType)}
                  </span>
                  <span style={timeStyle}>{formatDateTime(evt.timestamp)}</span>
                  <span style={artifactIdStyle}>{truncateId(evt.artifactId, 10)}</span>
                  {evt.actor && <span style={actorStyle}>by {evt.actor}</span>}
                </div>
                {Object.keys(evt.payload).length > 0 && (
                  <div style={payloadStyle}>
                    {JSON.stringify(evt.payload, null, 1).slice(0, 300)}
                    {JSON.stringify(evt.payload).length > 300 ? '…' : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
