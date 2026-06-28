'use client'
import { useState, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
export default function CompliancePage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch(`${API}/api/v1/operations/compliance`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setPolicies(d.data?.policies ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])
  if (loading) return <div style={{padding:20,color:'var(--txd)'}}>Loading compliance data...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load compliance data</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The compliance endpoint could not be reached.</div>
    </div>
  )
  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:800,margin:0}}>Compliance</h1>
      <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 24px'}}>Policy evaluations and compliance status across the network</p>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {policies.length === 0 && <div style={{padding:20,color:'var(--txd)'}}>No compliance data available yet</div>}
        {policies.map((p:any) => {
          const violationRate = p.evaluations > 0 ? Math.round((p.violations / p.evaluations) * 100) : 0
          return (
            <div key={p.id} style={{background:'var(--card)',border:'1px solid var(--br)',borderRadius:10,padding:'12px 16px',display:'flex',alignItems:'center',gap:14}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:p.violations > 0 ? 'var(--red)' : 'var(--teal)'}} />
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                <div style={{fontSize:11,color:'var(--txd)',marginTop:2}}>{p.domain} · {p.status} · {p.evaluations} evaluations · {violationRate}% violation rate</div>
              </div>
              <span style={{fontSize:10,padding:'3px 8px',borderRadius:6,background:p.violations > 0 ? 'rgba(255,80,80,0.1)' : 'rgba(34,211,122,0.1)',color:p.violations > 0 ? 'var(--red)' : 'var(--teal)',fontWeight:700}}>
                {p.violations > 0 ? `${p.violations} violations` : 'PASS'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
