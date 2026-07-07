'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'
export default function ActivityPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    kocFetch(`/api/v1/feed`)
      .then(r => r.json()).then(d => { setEvents(Array.isArray(d.data) ? d.data : d.data?.events ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading activity feed...</div>
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Global Activity</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Platform-wide audit trail</p>
      {events.length === 0 ? <div style={{ padding: 20, color: 'var(--txd)' }}>No events recorded yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--br)', fontSize: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.action === 'create' ? 'var(--teal)' : e.action === 'update' ? 'var(--blue)' : 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--txdd)', width: 60, flexShrink: 0 }}>{e.action}</span>
              <span style={{ width: 80, flexShrink: 0, color: 'var(--txd)', fontSize: 10 }}>{e.resource?.type ?? '—'}</span>
              <span style={{ flex: 1 }}>{e.summary ?? '—'}</span>
              <span style={{ fontSize: 10, color: 'var(--txdd)', width: 80, textAlign: 'right' }}>{e.created_at?.split('T')[0]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
