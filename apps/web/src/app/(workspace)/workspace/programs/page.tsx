'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function ProgramsPage() {
  const { user } = useSession()
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    const token = (user as any).access_token
    fetch(`${API}/api/v1/workspace/programs`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(j => { setPrograms(j.data?.items ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [user])

  if (!user) return <div style={{padding:40,textAlign:'center',color:'var(--txd)'}}>Sign in to view Programs</div>
  if (loading) return <div style={{color:'var(--txd)'}}>Loading programs...</div>
  if (error) return (
    <div style={{ maxWidth: 420, marginTop: 24 }}>
      <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load programs</div>
        <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The programs endpoint could not be reached.</div>
      </div>
    </div>
  )

  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:800,margin:0}}>Programs</h1>
      <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 24px'}}>Active research programs for your organization</p>

      {programs.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'var(--txd)'}}>
          No programs found for your organization
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {programs.map((p: any) => (
            <Link
              key={p.id}
              href={`/workspace/programs/${p.id}`}
              style={{
                textDecoration: 'none',
                padding: 18,
                borderRadius: 13,
                border: '1px solid var(--br)',
                background: 'var(--card)',
                display: 'block',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{fontWeight:700,fontSize:14,color:'var(--tx)',marginBottom:4}}>{p.name}</div>
              {p.short_name && <div style={{fontSize:11,color:'var(--txdd)',marginBottom:4}}>{p.short_name}</div>}
              <div style={{display:'flex',gap:10,fontSize:11,color:'var(--txd)'}}>
                <span>Status: {p.status}</span>
                {p.sponsor_org_name && <span>· Sponsor: {p.sponsor_org_name}</span>}
              </div>
              <div style={{marginTop:10,fontSize:10,color:'var(--blue)',fontWeight:600}}>
                View Program Details →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
