'use client'

import { useEffect, useState } from 'react'
import { kocFetch } from '@/lib/koc-api'

type CutoverStatus = {
  legacy_passport_enabled: boolean
  published_view_path: string
  migrated_routes?: string[]
  deferred_routes?: string[]
  timestamp?: string
}

export default function Phase8CutoverPage() {
  const [status, setStatus] = useState<CutoverStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    kocFetch('/api/v1/operations/phase8-cutover')
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json() })
      .then(json => { setStatus(json.data ?? null); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{ color: 'var(--txd)' }}>Loading cutover status…</div>
  if (error || !status) {
    return (
      <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
        <div style={{ fontWeight: 700, color: 'var(--red)' }}>Unable to load Phase 8 cutover status</div>
        <p style={{ fontSize: 12, color: 'var(--txdd)', margin: '8px 0 0' }}>Requires Kadarn internal access.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Phase 8 Cutover</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Read-only ops view — Published View path and deferred routes</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        <Metric label="Published View path" value={status.published_view_path} />
        <Metric label="Legacy passport" value={status.legacy_passport_enabled ? 'enabled' : 'disabled'} />
      </div>

      <Section title="Migrated routes" items={status.migrated_routes ?? []} />
      <Section title="Deferred routes" items={status.deferred_routes ?? []} />

      {status.timestamp ? (
        <p style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 24 }}>As of {new Date(status.timestamp).toLocaleString()}</p>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--br)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: 'var(--txd)' }}>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}
