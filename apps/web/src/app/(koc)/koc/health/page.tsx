'use client'
import { useState, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const LABELS: Record<string, string> = {
  active_organizations: 'Active Organizations',
  active_programs: 'Active Programs',
  pending_requests: 'Pending Requests',
  shipments_in_transit: 'In Transit',
  shipments_pending: 'Pending Pickup',
  shipments_customs: 'Customs Hold',
}

export default function HealthPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/v1/operations/health`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{padding:20,color:'var(--txd)'}}>Loading network health...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load health data</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The health endpoint could not be reached.</div>
    </div>
  )

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:800,margin:0}}>Network Health</h1>
      <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 24px'}}>Real-time operational metrics across the Kadarn network</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {Object.entries(data).map(([k,v]) => {
          const label = LABELS[k] ?? k.replace(/([A-Z])/g,' $1').trim()
          const val = v as number
          return (
            <div key={k} style={{background:'var(--card)',border:'1px solid var(--br)',borderRadius:12,padding:16}}>
              <div style={{fontSize:10,color:'var(--txd)',textTransform:'uppercase',letterSpacing:1}}>{label}</div>
              <div style={{fontSize:24,fontWeight:700,marginTop:6}}>
                {val !== null ? val.toLocaleString() : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
