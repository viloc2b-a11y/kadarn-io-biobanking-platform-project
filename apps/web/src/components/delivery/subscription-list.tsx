'use client'

import { useState } from 'react'
import type { DeliverySubscription, ScheduleTrigger, EventTrigger } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionListProps {
  subscriptions: DeliverySubscription[]
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  selectedId?: string
}

type TriggerFilter = 'all' | 'schedule' | 'event'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTrigger(sub: DeliverySubscription): string {
  const trigger = sub.trigger
  if (trigger.type === 'schedule') {
    const s = trigger as ScheduleTrigger
    const day = s.schedule === 'weekly'
      ? `day ${s.dayOfWeek ?? 1}`
      : s.schedule === 'monthly' || s.schedule === 'quarterly'
        ? `day ${s.dayOfMonth ?? 1}`
        : ''
    return `${s.schedule.charAt(0).toUpperCase() + s.schedule.slice(1)}${day ? ' — ' + day : ''} ${String(s.hour ?? 8).padStart(2, '0')}:00`
  }
  const e = trigger as EventTrigger
  return `Event: ${e.eventName}`
}

function formatLastTriggered(lastTriggeredAt: string | null): string {
  if (!lastTriggeredAt) return 'Never'
  const d = new Date(lastTriggeredAt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
}

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: active ? 700 : 500,
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: active ? 'var(--teal)' : 'transparent',
  color: active ? '#fff' : 'var(--txd)',
  cursor: 'pointer',
})

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 600,
  color: 'var(--txd)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid var(--border)',
  background: 'var(--navy1)',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--tx)',
}

const rowStyle = (selected: boolean): React.CSSProperties => ({
  cursor: 'pointer',
  background: selected ? 'var(--teal-alpha, rgba(20,184,166,.08))' : 'transparent',
  transition: 'background 100ms',
})

const dotStyle = (enabled: boolean): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: enabled ? '#22c55e' : '#6b7280',
  marginRight: 6,
})

const triggerBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  padding: '2px 6px',
  borderRadius: 4,
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40,
  color: 'var(--txd)',
  fontSize: 13,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SubscriptionList({ subscriptions, onToggle, onSelect, selectedId }: SubscriptionListProps) {
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all')

  const filtered = triggerFilter === 'all'
    ? subscriptions
    : subscriptions.filter((s) => s.trigger.type === triggerFilter)

  return (
    <div style={containerStyle}>
      {/* ── Filter bar ── */}
      <div style={filterBarStyle}>
        {(['all', 'schedule', 'event'] as TriggerFilter[]).map((f) => (
          <button
            key={f}
            style={filterBtnStyle(triggerFilter === f)}
            onClick={() => setTriggerFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'schedule' ? 'Schedule' : 'Event'}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Trigger</th>
              <th style={thStyle}>Template</th>
              <th style={thStyle}>Last Triggered</th>
              <th style={thStyle}>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={emptyStyle}>No subscriptions match filter</td>
              </tr>
            )}
            {filtered.map((sub) => (
              <tr
                key={sub.id}
                style={rowStyle(sub.id === selectedId)}
                onClick={(e) => { e.stopPropagation(); onSelect(sub.id) }}
              >
                <td style={tdStyle}>
                  <span style={dotStyle(sub.enabled)} />
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{sub.name}</td>
                <td style={tdStyle}>
                  <span style={{
                    ...triggerBadgeStyle,
                    background: sub.trigger.type === 'schedule' ? '#dbeafe' : '#fce7f3',
                    color: sub.trigger.type === 'schedule' ? '#1e40af' : '#9d174d',
                  }}>
                    {sub.trigger.type === 'schedule' ? 'Schedule' : 'Event'}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--txd)', marginTop: 3 }}>
                    {formatTrigger(sub)}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: 'var(--txd)' }}>{sub.templateName}</td>
                <td style={{ ...tdStyle, color: 'var(--txd)' }}>{formatLastTriggered(sub.lastTriggeredAt)}</td>
                <td style={tdStyle}>
                  <button
                    style={{
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: sub.enabled ? '#fef2f2' : '#f0fdf4',
                      color: sub.enabled ? '#dc2626' : '#16a34a',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => { e.stopPropagation(); onToggle(sub.id) }}
                  >
                    {sub.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
