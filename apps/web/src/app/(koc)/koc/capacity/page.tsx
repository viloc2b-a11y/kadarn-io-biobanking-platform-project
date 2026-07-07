'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'

function utilizationColor(level: string) {
  const colors: Record<string, string> = {
    saturated: 'var(--red)',
    high: 'var(--amber)',
    normal: 'var(--teal)',
    underutilized: 'var(--txdd)',
  }
  return colors[level] ?? 'var(--txd)'
}

export default function CapacityPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    kocFetch(`/api/v1/operations/capacity`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading capacity data...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load capacity data</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The capacity endpoint could not be reached.</div>
    </div>
  )

  const network = data?.network
  const orgs = data?.organizations ?? []
  const recommendations = data?.recommendations ?? []

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Network Capacity</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Organization-level utilization and workload distribution</p>

      {/* Network summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Total Orgs</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{network?.total_orgs ?? 0}</div>
        </div>
        <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid rgba(255,80,80,0.3)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--red)', textTransform: 'uppercase' }}>Saturated</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--red)' }}>{network?.by_level?.saturated ?? 0}</div>
        </div>
        <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Normal</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--teal)' }}>{network?.by_level?.normal ?? 0}</div>
        </div>
        <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Avg Workload</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{network?.avg_workload ?? 0}</div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 22, padding: 14, borderRadius: 10, border: '1px solid rgba(139,68,255,0.2)', background: 'rgba(139,68,255,0.05)' }}>
          <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Recommendations</div>
          {recommendations.map((r: string, i: number) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--txd)', marginBottom: 4 }}>· {r}</div>
          ))}
        </div>
      )}

      {/* Org list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orgs.map((o: any) => (
          <div key={o.org_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{o.org_name}</div>
              <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>{o.country ?? '—'} · {o.capabilities?.join(', ') ?? '—'}</div>
            </div>
            <div style={{ width: 80, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Workload</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{o.workload_score}</div>
            </div>
            <div style={{ width: 90, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Milestones</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{o.active_milestones}</div>
            </div>
            <div style={{ width: 90, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Shipments</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{o.shipments_active}</div>
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 8,
              color: utilizationColor(o.utilization_level),
              background: `${utilizationColor(o.utilization_level)}15`,
            }}>
              {o.utilization_level}
            </span>
            {o.collections?.enrollment_pct !== null && (
              <div style={{ width: 80, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Enrolled</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{o.collections.enrollment_pct}%</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
