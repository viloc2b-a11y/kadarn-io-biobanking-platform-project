import Link from 'next/link'

export function KocStubPage({ title, description, sprint }: {
  title: string
  description: string
  sprint: string
}) {
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>{description}</p>
      </div>
      <div style={{
        padding: 24, borderRadius: 14,
        border: '1px solid rgba(139,68,255,0.2)',
        background: 'rgba(139,68,255,0.04)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Planned — {sprint}
        </div>
        <p style={{ fontSize: 13, color: 'var(--txd)', margin: 0 }}>
          This view is part of the next sprint. The API endpoint and data layer are ready.
        </p>
        <Link href="/koc" style={{ display: 'inline-block', marginTop: 14, fontSize: 12, color: 'var(--purple)' }}>
          ← Back to Overview
        </Link>
      </div>
    </div>
  )
}
