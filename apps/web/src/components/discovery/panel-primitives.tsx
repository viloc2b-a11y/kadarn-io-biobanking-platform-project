import type { ReactNode } from 'react'

export const cardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148,163,184,.22)',
  background: 'rgba(15,23,42,.45)',
  padding: 16,
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(148,163,184,.35)',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'rgba(15,23,42,.65)',
  color: 'var(--tx)',
  fontSize: 13,
}

export const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--tx)',
  marginBottom: 10,
}

export const preStyle: React.CSSProperties = {
  ...cardStyle,
  maxHeight: 360,
  overflow: 'auto',
  fontSize: 12,
  fontFamily: 'ui-monospace, monospace',
  whiteSpace: 'pre-wrap',
}

export function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--txdd)' }}>{description}</p>
    </header>
  )
}

export function EmptyPanel({ message, hint }: { message: string; hint?: string }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }} role="status">
      <div style={{ color: 'var(--txdd)', fontSize: 13 }}>{message}</div>
      {hint ? (
        <div style={{ color: 'var(--txd)', fontSize: 11, marginTop: 8 }}>{hint}</div>
      ) : null}
    </div>
  )
}

export function PanelSkeleton({ rows = 3, label = 'Loading panel content' }: { rows?: number; label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,.18)',
            background: 'rgba(15,23,42,.35)',
            height: 120,
          }}
        />
      ))}
    </div>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      style={{ ...cardStyle, borderColor: 'rgba(255,77,106,.35)', textAlign: 'center' }}
      role="alert"
    >
      <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: onRetry ? 12 : 0 }}>{message}</div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry loading discovery data"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,.35)',
            background: 'rgba(59,130,246,.15)',
            color: 'var(--tx)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}

export function JsonBlock({ value }: { value: unknown }) {
  return <pre style={preStyle}>{JSON.stringify(value, null, 2)}</pre>
}

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'amber' | 'green' | 'red' }) {
  const colors = {
    default: { bg: 'rgba(148,163,184,.15)', fg: 'var(--txd)' },
    amber: { bg: 'rgba(245,166,35,.15)', fg: 'var(--amber)' },
    green: { bg: 'rgba(34,211,122,.15)', fg: 'var(--green)' },
    red: { bg: 'rgba(255,77,106,.15)', fg: 'var(--red)' },
  }[tone]

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: colors.bg,
        color: colors.fg,
      }}
    >
      {label}
    </span>
  )
}

export function ListCard({ title, meta, children }: { title: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{title}</div>
      {meta ? <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 6 }}>{meta}</div> : null}
      {children}
    </div>
  )
}

export function FormMessage({
  error,
  success,
  messageId = 'discovery-form-message',
}: {
  error?: string | null
  success?: string | null
  messageId?: string
}) {
  if (!error && !success) return null

  return (
    <div
      id={messageId}
      role="status"
      aria-live="polite"
      style={{
        fontSize: 12,
        color: error ? 'var(--red)' : 'var(--green)',
      }}
    >
      {error ?? success}
    </div>
  )
}

export function HelpTooltip({ label, text }: { label: string; text: string }) {
  const helpId = `${label.replace(/\s+/g, '-').toLowerCase()}-help`

  return (
    <button
      type="button"
      aria-label={`Help: ${label}`}
      aria-describedby={helpId}
      title={text}
      style={{
        fontSize: 11,
        color: 'var(--txdd)',
        border: '1px solid rgba(148,163,184,.3)',
        borderRadius: 999,
        padding: '2px 8px',
        cursor: 'help',
        flexShrink: 0,
        background: 'transparent',
      }}
    >
      ?
      <span id={helpId} className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {text}
      </span>
    </button>
  )
}
