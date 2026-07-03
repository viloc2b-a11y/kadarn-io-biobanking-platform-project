'use client'

import type { DeliverySubscription, ScheduleTrigger, EventTrigger } from '@kadarn/delivery-domain'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionDetailProps {
  subscription: DeliverySubscription
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTriggerDetail(sub: DeliverySubscription): { label: string; detail: string; extra?: string } {
  const trigger = sub.trigger
  if (trigger.type === 'schedule') {
    const s = trigger as ScheduleTrigger
    const sch = s.schedule.charAt(0).toUpperCase() + s.schedule.slice(1)
    let detail: string
    if (s.schedule === 'daily') detail = `Every day at ${String(s.hour ?? 8).padStart(2, '0')}:00`
    else if (s.schedule === 'weekly') detail = `Every Monday at ${String(s.hour ?? 8).padStart(2, '0')}:00`
    else if (s.schedule === 'monthly') detail = `Day ${s.dayOfMonth ?? 1} of each month at ${String(s.hour ?? 8).padStart(2, '0')}:00`
    else detail = `Day ${s.dayOfMonth ?? 1} of Q1/Q2/Q3/Q4 at ${String(s.hour ?? 9).padStart(2, '0')}:00`
    return { label: sch, detail }
  }
  const e = trigger as EventTrigger
  return {
    label: 'Event',
    detail: e.eventName,
    extra: e.condition
      ? `Condition: ${e.condition.field} ${e.condition.operator} ${e.condition.value ?? ''}`
      : 'No condition (fires on every event)',
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--navy2)',
  padding: 20,
}

const headerStyle: React.CSSProperties = {
  marginBottom: 16,
}

const nameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 4,
}

const descStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
  lineHeight: 1.5,
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  color: 'var(--txd)',
  marginBottom: 6,
}

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: 12,
}

const fieldLabelStyle: React.CSSProperties = {
  color: 'var(--txd)',
  fontWeight: 500,
}

const fieldValueStyle: React.CSSProperties = {
  color: 'var(--tx)',
  fontWeight: 600,
}

const badgeStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  padding: '2px 8px',
  borderRadius: 6,
  background: active ? '#f0fdf4' : '#fef2f2',
  color: active ? '#16a34a' : '#dc2626',
})

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40,
  color: 'var(--txd)',
  fontSize: 13,
  border: '1px solid var(--border)',
  borderRadius: 10,
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SubscriptionDetail({ subscription }: SubscriptionDetailProps) {
  const trigger = formatTriggerDetail(subscription)

  return (
    <div style={cardStyle}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        <div style={nameStyle}>{subscription.name}</div>
        <div style={descStyle}>{subscription.description}</div>
      </div>

      {/* ── Status ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Status</div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Enabled</span>
          <span style={badgeStyle(subscription.enabled)}>
            {subscription.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Last Triggered</span>
          <span style={fieldValueStyle}>
            {subscription.lastTriggeredAt
              ? new Date(subscription.lastTriggeredAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : 'Never'}
          </span>
        </div>
      </div>

      {/* ── Trigger ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Trigger</div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Type</span>
          <span style={fieldValueStyle}>{trigger.label}</span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Detail</span>
          <span style={fieldValueStyle}>{trigger.detail}</span>
        </div>
        {trigger.extra && (
          <div style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Extra</span>
            <span style={{ ...fieldValueStyle, fontSize: 11 }}>{trigger.extra}</span>
          </div>
        )}
      </div>

      {/* ── Template ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Template</div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Name</span>
          <span style={fieldValueStyle}>{subscription.templateName}</span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Artifact Type</span>
          <span style={fieldValueStyle}>{subscription.artifactType}</span>
        </div>
      </div>

      {/* ── Recipients ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Recipients ({subscription.recipients.length})</div>
        {subscription.recipients.map((r, i) => (
          <div key={i} style={fieldRowStyle}>
            <span style={fieldLabelStyle}>Channel {i + 1}</span>
            <span style={fieldValueStyle}>{r.channelType} → {r.recipientId}</span>
          </div>
        ))}
      </div>

      {/* ── Created ── */}
      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Meta</div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>Created</span>
          <span style={fieldValueStyle}>
            {new Date(subscription.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>ID</span>
          <span style={{ ...fieldValueStyle, fontSize: 10, fontFamily: 'monospace' }}>
            {subscription.id.slice(0, 12)}...
          </span>
        </div>
      </div>
    </div>
  )
}
