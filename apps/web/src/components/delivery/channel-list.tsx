'use client'

import { useState } from 'react'
import type { DeliveryChannel, ChannelType } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChannelListProps {
  channels: DeliveryChannel[]
  onSelect: (id: string) => void
  selectedId?: string
}

type ChannelTypeFilter = 'all' | ChannelType
type StatusFilter = 'all' | 'active' | 'inactive'

// ─── Helpers ────────────────────────────────────────────────────────────────

function channelTypeColor(type: string): string {
  const map: Record<string, string> = {
    email: '#3b82f6', webhook: '#a855f7', sftp: '#f97316',
    api: '#14b8a6', portal: '#22c55e', s3: '#eab308',
  }
  return map[type] ?? '#6b7280'
}

function configSummary(config: Record<string, unknown>): string {
  if (config.from) return `from: ${config.from}`
  if (config.url) return String(config.url).slice(0, 45) + (String(config.url).length > 45 ? '…' : '')
  if (config.endpoint) return String(config.endpoint).slice(0, 45) + (String(config.endpoint).length > 45 ? '…' : '')
  if (config.bucket) return `s3://${config.bucket}`
  if (config.workspaceId) return `workspace: ${config.workspaceId}`
  return '—'
}

function retryLabel(policy: { maxAttempts: number; backoffMs: number }): string {
  if (policy.maxAttempts === 0) return 'No retry'
  return `${policy.maxAttempts}× / ${policy.backoffMs}ms`
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--navy2)',
  overflow: 'hidden',
}

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--navy1)',
  flexWrap: 'wrap',
}

const separatorStyle: React.CSSProperties = {
  width: 1,
  background: 'var(--border)',
  margin: '0 4px',
}

function filterBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--tx)' : 'var(--txd)',
    background: active ? 'var(--border)' : 'transparent',
    border: '1px solid transparent',
    borderRadius: 6,
    cursor: 'pointer',
  }
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: 420,
  overflowY: 'auto',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--txd)',
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: 0,
  background: 'var(--navy2)',
  zIndex: 1,
}

function tdStyle(last = false): React.CSSProperties {
  return {
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--tx)',
    borderBottom: last ? 'none' : '1px solid var(--border)',
  }
}

function rowStyle(selected: boolean): React.CSSProperties {
  return {
    cursor: 'pointer',
    background: selected ? 'rgba(20,184,166,.08)' : 'transparent',
    borderLeft: selected ? '3px solid var(--teal)' : '3px solid transparent',
    transition: 'background 100ms',
  }
}

const badgeStyle = (bg: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 4,
  color: '#fff',
  background: bg,
  letterSpacing: 0.3,
  textTransform: 'uppercase' as const,
})

const dotStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: active ? '#22c55e' : '#6b7280',
  marginRight: 6,
  flexShrink: 0,
})

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: 'var(--txd)',
  fontSize: 13,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChannelList({ channels, onSelect, selectedId }: ChannelListProps) {
  const [typeFilter, setTypeFilter] = useState<ChannelTypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const channelTypes: ChannelTypeFilter[] = ['all', 'email', 'webhook', 'sftp', 'api', 'portal', 's3']
  const statusFilters: StatusFilter[] = ['all', 'active', 'inactive']

  const filtered = channels.filter((ch) => {
    if (typeFilter !== 'all' && ch.channelType !== typeFilter) return false
    if (statusFilter === 'active' && !ch.isActive) return false
    if (statusFilter === 'inactive' && ch.isActive) return false
    return true
  })

  const countByType: Record<string, number> = {}
  for (const t of channelTypes) {
    countByType[t] = t === 'all' ? channels.length : channels.filter((ch) => ch.channelType === t).length
  }
  const activeCount = channels.filter((ch) => ch.isActive).length
  const inactiveCount = channels.length - activeCount

  return (
    <div style={containerStyle}>
      {/* Filter bar — type */}
      <div style={filterBarStyle}>
        {channelTypes.map((t) => (
          <button
            key={t}
            style={filterBtnStyle(typeFilter === t)}
            onClick={() => setTypeFilter(t)}
          >
            {t === 'all' ? 'All' : t}
            &nbsp;
            <span style={{ opacity: 0.5, fontSize: 10 }}>({countByType[t]})</span>
          </button>
        ))}
      </div>

      {/* Filter bar — status */}
      <div style={{ ...filterBarStyle, borderTop: 'none', paddingTop: 0 }}>
        {statusFilters.map((s) => (
          <button
            key={s}
            style={filterBtnStyle(statusFilter === s)}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'active' && (
              <span style={{ opacity: 0.5, fontSize: 10, marginLeft: 2 }}>({activeCount})</span>
            )}
            {s === 'inactive' && (
              <span style={{ opacity: 0.5, fontSize: 10, marginLeft: 2 }}>({inactiveCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={tableStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Config</th>
              <th style={thStyle}>Retry</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ch) => {
              const isSelected = ch.id === selectedId
              return (
                <tr
                  key={ch.id}
                  style={rowStyle(isSelected)}
                  onClick={() => onSelect(ch.id)}
                >
                  <td style={tdStyle()}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={dotStyle(ch.isActive)} />
                      <span style={{ fontSize: 12, color: ch.isActive ? '#22c55e' : '#6b7280' }}>
                        {ch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle()}>
                    <span style={badgeStyle(channelTypeColor(ch.channelType))}>
                      {ch.channelType}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--txd)' }}>
                      {configSummary(ch.config as Record<string, unknown>)}
                    </span>
                  </td>
                  <td style={tdStyle(true)}>
                    <span style={{ fontSize: 12, color: 'var(--txd)' }}>
                      {retryLabel(ch.retryPolicy)}
                    </span>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={emptyStyle}>
                  No channels match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
