'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'
export default function PolicyPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    kocFetch(`/api/v1/koc/policy`)
      .then(r => r.json()).then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading policy data...</div>
  if (!data) return <div style={{ padding: 20, color: 'var(--txd)' }}>No policy data available</div>
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Policy Dashboard</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Policy engine evaluations and compliance</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <Stat label="Active Policies" value={data.active_policies} color="var(--blue)" />
        <Stat label="Evaluations" value={data.total_evaluations} />
        <Stat label="Violations" value={data.violations} color={data.violations > 0 ? 'var(--red)' : 'var(--teal)'} />
        <Stat label="Pending Decisions" value={data.pending_decisions} color={data.pending_decisions > 0 ? 'var(--amber)' : 'var(--teal)'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {Object.entries(data.by_severity ?? {}).map(([k, v]) => (
          <div key={k} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
            <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k === 'critical' ? 'var(--red)' : k === 'high' ? 'var(--amber)' : 'var(--tx)' }}>{v as number}</div>
          </div>
        ))}
      </div>
      {data.policies?.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 10 }}>Policies</div>
          {data.policies.map((p: any) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--br)', fontSize: 12 }}>
              <span style={{ flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 10, color: 'var(--txd)' }}>{p.policy_type}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: p.status === 'active' ? 'var(--teal)' : 'var(--txdd)' }}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )
}
