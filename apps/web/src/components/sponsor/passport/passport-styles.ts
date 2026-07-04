import type React from 'react'

export const pageTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--tx)',
  marginBottom: 6,
}

export const pageSubtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--txdd)',
  lineHeight: 1.5,
  marginBottom: 24,
  maxWidth: 640,
}

export const cardStyle: React.CSSProperties = {
  background: 'var(--navy2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '16px 18px',
  marginBottom: 16,
}

export const cardTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--teal)',
  marginBottom: 12,
}

export const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

export const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 8,
  fontSize: 11,
  color: 'var(--txdd)',
}

export const badgeStyle = (tone: 'neutral' | 'attention' | 'fresh'): React.CSSProperties => {
  const colors = {
    neutral: { bg: 'rgba(68,103,242,0.12)', fg: 'var(--blue)' },
    attention: { bg: 'rgba(255,180,80,0.12)', fg: '#ffb450' },
    fresh: { bg: 'rgba(12,197,193,0.12)', fg: 'var(--teal)' },
  }
  const c = colors[tone]
  return {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    padding: '3px 8px',
    borderRadius: 6,
    background: c.bg,
    color: c.fg,
  }
}

export const confidenceStyle = (level: string): React.CSSProperties => {
  const map: Record<string, string> = {
    High: 'var(--teal)',
    Moderate: 'var(--blue)',
    Low: '#ffb450',
    Insufficient: 'var(--txdd)',
  }
  return {
    fontSize: 11,
    fontWeight: 700,
    color: map[level] ?? 'var(--txd)',
  }
}

export const disabledButtonStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--navy3)',
  color: 'var(--txdd)',
  cursor: 'not-allowed',
  opacity: 0.6,
}

export const linkCardStyle: React.CSSProperties = {
  display: 'block',
  background: 'var(--navy2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '16px 18px',
  marginBottom: 12,
  textDecoration: 'none',
  color: 'inherit',
  transition: 'border-color 0.15s',
}

export const sectionNavStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 20,
  position: 'sticky',
  top: 0,
  background: 'var(--navy)',
  paddingBottom: 8,
  zIndex: 1,
}

export function sectionNavLinkStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: active ? 'rgba(12,197,193,0.08)' : 'var(--navy2)',
    color: active ? 'var(--tx)' : 'var(--txd)',
    textDecoration: 'none',
    cursor: 'pointer',
  }
}

export const claimRowStyle = (selected: boolean): React.CSSProperties => ({
  padding: '12px 14px',
  borderRadius: 10,
  border: selected ? '1px solid var(--teal)' : '1px solid var(--border)',
  background: selected ? 'rgba(12,197,193,0.06)' : 'var(--navy3)',
  marginBottom: 10,
  cursor: 'pointer',
})

export const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: 'var(--txdd)',
  fontWeight: 700,
  marginBottom: 2,
}

export const fieldValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--txd)',
  marginBottom: 10,
}

export const sourceStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txdd)',
  fontStyle: 'italic',
}
