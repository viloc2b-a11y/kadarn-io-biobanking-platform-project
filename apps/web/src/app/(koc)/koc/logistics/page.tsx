'use client'
import { useState, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
export default function LogisticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`${API}/api/v1/koc/logistics`, { credentials: 'include' }).then(r => r.json()).then(d => { setData(d.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading logistics data...</div>
  if (!data) return <div style={{ padding: 20, color: 'var(--txd)' }}>No logistics data available</div>
  const s = data.summary
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Logistics</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Shipment tracking, delays, and temperature monitoring</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <Stat label="In Transit" value={s.in_transit} color="var(--blue)" />
        <Stat label="Delayed" value={s.delayed} color={s.delayed > 0 ? 'var(--red)' : 'var(--teal)'} />
        <Stat label="Customs" value={s.customs_hold} color={s.customs_hold > 0 ? 'var(--amber)' : 'var(--teal)'} />
        <Stat label="Delivered Today" value={s.delivered_today} color="var(--teal)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Total Shipments</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{s.total}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: s.temperature_excursions > 0 ? 'var(--red)' : 'var(--txdd)', textTransform: 'uppercase' }}>Temp Excursions</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.temperature_excursions > 0 ? 'var(--red)' : 'var(--tx)' }}>{s.temperature_excursions}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Delivered</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal)' }}>{s.delivered}</div>
        </div>
      </div>
      {data.carriers && Object.keys(data.carriers).length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 8 }}>Carriers</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(data.carriers as Record<string, number>).map(([k, v]) => (
              <span key={k} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(68,103,242,0.1)', color: 'var(--blue)' }}>
                {k}: {v}
              </span>
            ))}
          </div>
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
