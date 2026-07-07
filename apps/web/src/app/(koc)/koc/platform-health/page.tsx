'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'
export default function PlatformHealthPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    kocFetch(`/api/v1/koc/platform-health`).then(r => r.json()).then(d => { setData(d.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading platform health...</div>
  if (!data) return <div style={{ padding: 20, color: 'var(--txd)' }}>No health data available</div>
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Platform Health</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>System metrics and operational status</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <Stat label="Events/hr" value={data.events_per_hour} color="var(--blue)" />
        <Stat label="Events/day" value={data.events_per_day} />
        <Stat label="Active Orgs" value={data.active_orgs} color="var(--teal)" />
        <Stat label="Errors/hr" value={data.error_events} color={data.error_events > 0 ? 'var(--red)' : 'var(--teal)'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Shipments</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{data.total_shipments}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Exchanges</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{data.total_exchanges}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Last Updated</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}</div>
        </div>
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
