'use client'

import type { DeliveryArtifact, AuditEntry } from '@kadarn/delivery-domain'

// ─── Status badge (replicated from artifact-list for standalone use) ─────────

const STATUS_COLORS: Record<string, { bg: string; tx: string }> = {
  draft:        { bg: '#374151', tx: '#9ca3af' },
  generated:    { bg: '#1e3a5f', tx: '#60a5fa' },
  queued:       { bg: '#5c4a00', tx: '#fbbf24' },
  delivered:    { bg: '#14532d', tx: '#4ade80' },
  acknowledged: { bg: '#134e4a', tx: '#2dd4bf' },
  expired:      { bg: '#5c3d00', tx: '#fb923c' },
  revoked:      { bg: '#450a0a', tx: '#f87171' },
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#374151', tx: '#9ca3af' }
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
        color: c.tx,
        background: c.bg,
        padding: '3px 10px',
        borderRadius: 6,
      }}
    >
      {status}
    </span>
  )
}

// ─── Event type badge ────────────────────────────────────────────────────────

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

function EventBadge({ eventType }: { eventType: string }) {
  const color = EVENT_COLORS[eventType] ?? '#6b7280'
  const label = eventType.replace(/^delivery\./, '').replace(/^artifact\./, '')
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 600,
        color: '#fff',
        background: color,
        padding: '2px 7px',
        borderRadius: 5,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ArtifactDetailProps {
  artifact: DeliveryArtifact
  auditTrail: AuditEntry[]
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--navy2)',
  padding: 24,
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 20,
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase' as const,
  color: 'var(--txd)',
  marginBottom: 4,
}

const valueStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--tx)',
  wordBreak: 'break-all' as const,
}

const monoStyle: React.CSSProperties = {
  ...valueStyle,
  fontFamily: 'monospace',
  fontSize: 12,
}

const metadataKeyStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--txd)',
  marginBottom: 2,
}

const metadataValueStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--tx)',
  wordBreak: 'break-word' as const,
}

const miniTimelineStyle: React.CSSProperties = {
  marginTop: 12,
  paddingLeft: 16,
  borderLeft: '2px solid var(--border)',
}

const miniEventStyle: React.CSSProperties = {
  marginBottom: 8,
  fontSize: 12,
  color: 'var(--tx)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ArtifactDetail({ artifact, auditTrail }: ArtifactDetailProps) {
  const last5 = [...auditTrail]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return (
    <div style={cardStyle}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>📦</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)', margin: 0 }}>
          Artifact Detail
        </h3>
        <StatusBadge status={artifact.status} />
      </div>

      {/* ── Core fields ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>ID</div>
        <div style={monoStyle}>{artifact.id}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, ...sectionStyle }}>
        <div>
          <div style={labelStyle}>Type</div>
          <div style={valueStyle}>{artifact.type.toUpperCase()}</div>
        </div>
        <div>
          <div style={labelStyle}>Template Version</div>
          <div style={valueStyle}>v{artifact.templateVersion}</div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Content Hash</div>
        <div style={monoStyle}>{artifact.contentHash}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Template ID</div>
        <div style={monoStyle}>{artifact.templateId}</div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Compiled At</div>
        <div style={valueStyle}>{formatDateTime(artifact.compiledAt)}</div>
      </div>

      {/* ── Metadata ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Metadata</div>
        <div style={{
          background: 'var(--navy1, #0f172a)',
          borderRadius: 8,
          padding: 12,
          marginTop: 6,
        }}>
          {Object.entries(artifact.metadata).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 6 }}>
              <div style={metadataKeyStyle}>{key}</div>
              <div style={metadataValueStyle}>
                {Array.isArray(value)
                  ? value.join(', ')
                  : typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audit summary ── */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Audit Events ({auditTrail.length})</div>
        <div style={miniTimelineStyle}>
          {last5.map((evt) => (
            <div key={evt.id} style={miniEventStyle}>
              <EventBadge eventType={evt.eventType} />
              <span style={{ color: 'var(--txd)', fontSize: 11 }}>
                {formatDateTime(evt.timestamp)}
              </span>
              {evt.actor && (
                <span style={{ color: 'var(--txd)', fontSize: 11 }}>
                  — {evt.actor}
                </span>
              )}
            </div>
          ))}
          {auditTrail.length > 5 && (
            <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 4 }}>
              + {auditTrail.length - 5} more events
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
