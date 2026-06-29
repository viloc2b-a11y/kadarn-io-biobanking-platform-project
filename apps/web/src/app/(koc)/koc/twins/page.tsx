'use client'
import { useState, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
function healthColor(s: string) { return s === 'healthy' ? 'var(--teal)' : s === 'warning' ? 'var(--amber)' : s === 'critical' ? 'var(--red)' : 'var(--txdd)' }
export default function TwinsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`${API}/api/v1/koc/twins`, { credentials: 'include' }).then(r => r.json()).then(d => { setData(d.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading twins data...</div>
  if (!data) return <div style={{ padding: 20, color: 'var(--txd)' }}>No twin data available</div>
  const s = data.summary
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Digital Twins</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Twin health and status across all twin types</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <Stat label="Total Twins" value={s.total_twins} />
        <Stat label="Healthy" value={s.total_healthy} color="var(--teal)" />
        <Stat label="Warning" value={s.total_warning} color={s.total_warning > 0 ? 'var(--amber)' : 'var(--teal)'} />
        <Stat label="Critical" value={s.total_critical} color={s.total_critical > 0 ? 'var(--red)' : 'var(--teal)'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {Object.entries(data.by_type ?? {}).map(([type, info]: [string, any]) => (
          <div key={type} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 8 }}>{type}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{info.count}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(info.health ?? {}).filter(([k]) => k !== 'total').map(([k, v]: [string, any]) => (
                <span key={k} style={{ fontSize: 10, fontWeight: 600, color: healthColor(k), background: `${healthColor(k)}15`, padding: '2px 7px', borderRadius: 5 }}>
                  {k}: {v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
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
