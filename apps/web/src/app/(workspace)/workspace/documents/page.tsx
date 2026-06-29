'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
export default function DocumentsPage() {
  const { user } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user) return
    const token = (user as any).access_token
    fetch(`${API}/api/v1/workspace/documents`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(j => setData(j.data)).finally(() => setLoading(false))
  }, [user])
  if (!user) return <div style={{padding:40,textAlign:'center',color:'var(--txd)'}}>Sign in to view Documents</div>
  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:800,margin:0}}>Documents</h1>
      <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 24px'}}>Governance documents and evidence</p>
      {loading && <div style={{color:'var(--txd)'}}>Loading...</div>}
      {!loading && data && <pre style={{fontSize:12,color:'var(--txd)'}}>{JSON.stringify(data, null, 2)}</pre>}
      {!loading && !data && <div style={{color:'var(--txd)'}}>No data available</div>}
    </div>
  )
}
