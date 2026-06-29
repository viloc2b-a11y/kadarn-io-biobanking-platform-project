'use client'
import { useState, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch(`${API}/api/programs`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setPrograms(d.data ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])
  if (loading) return <div style={{padding:20,color:'var(--txd)',gridColumn:'span 3'}}>Loading programs...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load programs</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The programs endpoint could not be reached.</div>
    </div>
  )
  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:800,margin:0}}>Programs</h1>
      <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 24px'}}>Active research programs across the Kadarn network</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {programs.length === 0 && <div style={{padding:20,color:'var(--txd)',gridColumn:'span 3'}}>No programs loaded</div>}
        {programs.map((p:any) => (
          <div key={p.id} style={{background:'var(--card)',border:'1px solid var(--br)',borderRadius:12,padding:14}}>
            <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
            <div style={{fontSize:11,color:'var(--txd)',marginTop:4}}>Sponsor: {p.sponsor_org_name ?? 'N/A'}</div>
            <div style={{fontSize:10,color:'var(--txdd)',marginTop:2}}>{p.status} · {p.specimen_count ?? 0} specimens</div>
          </div>
        ))}
      </div>
    </div>
  )
}
