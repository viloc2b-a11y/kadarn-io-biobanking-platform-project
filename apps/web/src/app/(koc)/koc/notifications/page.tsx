'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TYPE_COLORS: Record<string, string> = {
  alert: 'var(--red)',
  mention: 'var(--blue)',
  task: 'var(--amber)',
  info: 'var(--teal)',
  policy: 'var(--purple)',
  trust: 'var(--teal)',
  workflow: 'var(--blue)',
}

function fmtDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    fetch(`${API}/api/v1/notifications`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setNotifications(d.data ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useSupabaseRealtime({
    table: 'audit_events',
    onChange: fetchNotifications,
  })

  const markRead = async (id: string) => {
    try {
      await fetch(`${API}/api/v1/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading notifications...</div>
  if (error) return (
    <div style={{ maxWidth: 420, marginTop: 24, padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load notifications</div>
      <button onClick={fetchNotifications} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--txd)', cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  )

  const unread = notifications.filter(n => !n.read).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>
            {notifications.length} total{unread > 0 ? ` · ${unread} unread` : ''}
          </p>
        </div>
        <button onClick={fetchNotifications} style={{ fontSize: 10, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txd)', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txd)' }}>
          ✓ No notifications
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifications.map((n: any) => {
            const type = n.type ?? 'info'
            const color = TYPE_COLORS[type] ?? 'var(--txdd)'
            return (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                background: n.read ? 'var(--card)' : 'rgba(68,103,242,0.06)',
                border: `1px solid ${n.read ? 'var(--br)' : 'rgba(68,103,242,0.15)'}`,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, flexShrink: 0,
                  opacity: n.read ? 0.5 : 1,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 600, color: 'var(--tx)' }}>
                    {n.title ?? n.message ?? 'Notification'}
                  </div>
                  {n.message && n.title && (
                    <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 2 }}>{n.message}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
                    {type} · {fmtDate(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} style={{
                    fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 5,
                    border: '1px solid var(--border)', background: 'var(--navy2)',
                    color: 'var(--txdd)', cursor: 'pointer',
                  }}>
                    Dismiss
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
