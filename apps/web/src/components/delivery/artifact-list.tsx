'use client'

import { useState, useMemo } from 'react'
import type { DeliveryArtifact, ArtifactStatus, ArtifactType } from '@kadarn/delivery-domain'

// ─── Status / Type badges ───────────────────────────────────────────────────

const STATUS_COLORS: Record<ArtifactStatus, { bg: string; tx: string }> = {
  draft:        { bg: '#374151', tx: '#9ca3af' },
  generated:    { bg: '#1e3a5f', tx: '#60a5fa' },
  queued:       { bg: '#5c4a00', tx: '#fbbf24' },
  delivered:    { bg: '#14532d', tx: '#4ade80' },
  acknowledged: { bg: '#134e4a', tx: '#2dd4bf' },
  expired:      { bg: '#5c3d00', tx: '#fb923c' },
  revoked:      { bg: '#450a0a', tx: '#f87171' },
}

const TYPE_COLORS: Record<ArtifactType, string> = {
  pdf:  '#991b1b',
  json: '#1e3a5f',
  zip:  '#3b0764',
  html: '#134e4a',
  csv:  '#14532d',
}

function StatusBadge({ status }: { status: ArtifactStatus }) {
  const c = STATUS_COLORS[status]
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
        color: c.tx,
        background: c.bg,
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: ArtifactType }) {
  const color = TYPE_COLORS[type]
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        color: '#fff',
        background: color,
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {type}
    </span>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ArtifactListProps {
  artifacts: DeliveryArtifact[]
  onSelectArtifact: (id: string) => void
  selectedArtifactId?: string
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 16,
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

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: 13,
  minWidth: 650,
}

function thStyle(): React.CSSProperties {
  return {
    textAlign: 'left' as const,
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: 'var(--txd)',
    borderBottom: '2px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  }
}

function tdStyle(isEven: boolean): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    background: isEven ? 'var(--navy1, #0f172a)' : 'var(--navy2, #0a0f1e)',
    color: 'var(--tx)',
    verticalAlign: 'middle' as const,
  }
}

function tdMonoStyle(isEven: boolean): React.CSSProperties {
  return {
    ...tdStyle(isEven),
    fontFamily: 'monospace',
    fontSize: 12,
  }
}

function emptyStateStyle(): React.CSSProperties {
  return {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'var(--txd)',
    fontSize: 14,
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const ALL_STATUSES: ArtifactStatus[] = ['draft', 'generated', 'queued', 'delivered', 'acknowledged', 'expired', 'revoked']
const ALL_TYPES: ArtifactType[] = ['pdf', 'json', 'zip', 'html', 'csv']

// ─── Component ───────────────────────────────────────────────────────────────

export function ArtifactList({ artifacts, onSelectArtifact, selectedArtifactId }: ArtifactListProps) {
  const [statusFilter, setStatusFilter] = useState<ArtifactStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ArtifactType | 'all'>('all')

  const filtered = useMemo(() => {
    return artifacts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      return true
    })
  }, [artifacts, statusFilter, typeFilter])

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* ── Filters ── */}
      <div style={filterBarStyle}>
        <select
          style={selectStyle}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ArtifactStatus | 'all')}
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          style={selectStyle}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ArtifactType | 'all')}
        >
          <option value="all">All Types</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>

        <span style={{ fontSize: 12, color: 'var(--txd)', marginLeft: 'auto' }}>
          {filtered.length} artifact{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div style={emptyStateStyle()}>No artifacts match filters</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle()}>Type</th>
              <th style={thStyle()}>Status</th>
              <th style={thStyle()}>Template</th>
              <th style={thStyle()}>Compiled</th>
              <th style={thStyle()}>Hash</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((artifact, idx) => {
              const isEven = idx % 2 === 0
              const isSelected = artifact.id === selectedArtifactId
              const templateName = (artifact.metadata?.templateName as string) ?? '—'
              const hashShort = artifact.contentHash.slice(0, 8) + '...'

              return (
                <tr
                  key={artifact.id}
                  onClick={() => onSelectArtifact(artifact.id)}
                  style={{
                    cursor: 'pointer',
                    outline: isSelected ? '2px solid var(--teal)' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  <td style={tdStyle(isEven)}><TypeBadge type={artifact.type} /></td>
                  <td style={tdStyle(isEven)}><StatusBadge status={artifact.status} /></td>
                  <td style={tdStyle(isEven)}>{templateName}</td>
                  <td style={tdMonoStyle(isEven)}>{formatDate(artifact.compiledAt)}</td>
                  <td style={tdMonoStyle(isEven)} title={artifact.contentHash}>{hashShort}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
