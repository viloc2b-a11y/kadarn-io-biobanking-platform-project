'use client'
import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const ACTION_COLORS: Record<string, string> = {
  create: 'var(--teal)', read: 'var(--blue)', update: 'var(--amber)',
  delete: 'var(--red)', login: 'var(--txdd)', logout: 'var(--txdd)',
  submit: 'var(--purple)', approve: 'var(--green)', reject: 'var(--red)',
  complete: 'var(--teal)', cancel: 'var(--txdd)',
}

function fmtTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [filters, setFilters] = useState<{ actions: string[]; resource_types: string[] }>({ actions: [], resource_types: [] })
  const [actionFilter, setActionFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchEvents = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (actionFilter) params.set('action', actionFilter)
    if (typeFilter) params.set('resource_type', typeFilter)

    fetch(`${API}/api/v1/koc/events?${params}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw Error(); return r.json() })
      .then(d => { setEvents(d.data.events ?? []); setFilters(d.data.filters); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [actionFilter, typeFilter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Event Stream</h1>
          <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>Live audit trail across the entire platform</p>
        </div>
        <button onClick={fetchEvents} style={{ fontSize: 10, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txd)', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={selectStyle}>
          <option value="">All Actions</option>
          {filters.actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All Resources</option>
          {filters.resource_types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(actionFilter || typeFilter) && (
          <button onClick={() => { setActionFilter(''); setTypeFilter('') }} style={{ fontSize: 11, color: 'var(--txdd)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear filters
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--txdd)', alignSelf: 'center' }}>{events.length} events</span>
      </div>

      {loading && <div style={{ padding: 20, color: 'var(--txd)' }}>Loading events...</div>}
      {error && <ErrorBox message="Failed to load events" />}

      {!loading && !error && events.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }}>No events match the current filters</div>
      )}

      {!loading && !error && events.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {events.map((e: any) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--br)', background: 'var(--card)',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: ACTION_COLORS[e.action] ?? 'var(--txdd)', flexShrink: 0,
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: ACTION_COLORS[e.action] ?? 'var(--txdd)', width: 65, flexShrink: 0,
              }}>
                {e.action}
              </span>
              <span style={{ fontSize: 10, color: 'var(--txd)', width: 100, flexShrink: 0 }}>
                {e.resource.type?.replace(/_/g, ' ')}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.summary ?? `${e.action} ${e.resource.type}`}
              </span>
              <span style={{ fontSize: 10, color: 'var(--txdd)', width: 140, textAlign: 'right' }}>
                {e.actor.email ?? e.actor.id?.slice(0, 8) ?? 'system'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--txdd)', width: 70, textAlign: 'right', flexShrink: 0 }}>
                {fmtTime(e.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--card)', color: 'var(--tx)', fontSize: 11, cursor: 'pointer', outline: 'none',
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>{message}</div>
    </div>
  )
}
