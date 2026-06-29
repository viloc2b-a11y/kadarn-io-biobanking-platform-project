'use client'
import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SEV_COLORS: Record<string, string> = { critical: 'var(--red)', warning: 'var(--amber)', info: 'var(--teal)' }

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------
function FilterBar({ severity, source, onSeverityChange, onSourceChange }: {
  severity: string; source: string
  onSeverityChange: (s: string) => void; onSourceChange: (s: string) => void
}) {
  const SEV_OPTS = ['all', 'critical', 'warning', 'info']
  const SRC_OPTS = ['all', 'trust', 'logistics', 'exchange']

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1 }}>Severity</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {SEV_OPTS.map(s => (
          <button key={s} onClick={() => onSeverityChange(s)} style={{
            fontSize: 11, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontWeight: severity === s ? 700 : 400,
            background: severity === s ? `${SEV_COLORS[s] ?? 'var(--blue)'}20` : 'var(--card)',
            color: severity === s ? (SEV_COLORS[s] ?? 'var(--blue)') : 'var(--txd)',
          }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 }}>Source</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {SRC_OPTS.map(s => (
          <button key={s} onClick={() => onSourceChange(s)} style={{
            fontSize: 11, padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontWeight: source === s ? 700 : 400,
            background: source === s ? 'rgba(68,103,242,0.15)' : 'var(--card)',
            color: source === s ? 'var(--blue)' : 'var(--txd)',
          }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------
function ActionButtons({ exceptionId, onAction, actionLoading }: {
  exceptionId: string; onAction: (id: string, action: string) => void; actionLoading: string | null
}) {
  const actions = [
    { key: 'resolve', label: 'Resolve', color: 'var(--teal)' },
    { key: 'escalate', label: 'Escalate', color: 'var(--amber)' },
    { key: 'dismiss', label: 'Dismiss', color: 'var(--txdd)' },
  ]

  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {actions.map(a => (
        <button
          key={a.key}
          onClick={e => { e.stopPropagation(); onAction(exceptionId, a.key) }}
          disabled={actionLoading === exceptionId}
          style={{
            fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 5,
            border: `1px solid ${a.color}30`, cursor: 'pointer',
            background: `${a.color}10`, color: a.color,
            opacity: actionLoading === exceptionId ? 0.5 : 1,
          }}
        >
          {actionLoading === exceptionId ? '...' : a.key}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------
function ExceptionModal({ exception, onClose }: { exception: any; onClose: () => void }) {
  if (!exception) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto',
        background: 'var(--navy2)', borderRadius: 16, border: '1px solid var(--border)', padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Exception Detail</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txdd)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DetailField label="ID" value={exception.id} />
          <DetailField label="Source" value={exception.source} />
          <DetailField label="Severity" value={exception.severity} />
          <DetailField label="Type" value={exception.type} />
          <DetailField label="Summary" value={exception.summary} />
          <DetailField label="Organization" value={exception.org_name ?? 'N/A'} />
          <DetailField label="Status" value={exception.status} />
          <DetailField label="Created" value={exception.created_at ? new Date(exception.created_at).toLocaleString() : '—'} />
        </div>
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
      <span style={{ width: 120, color: 'var(--txdd)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--tx)' }}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ExceptionsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedException, setSelectedException] = useState<any | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch(`${API}/api/v1/operations/exceptions`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = useCallback(async (id: string, action: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`${API}/api/v1/operations/exceptions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: `Actioned via KOC` }),
      })
      if (res.ok) {
        fetchData() // Refresh list
      }
    } catch { /* ignore */ }
    setActionLoading(null)
  }, [fetchData])

  if (loading && !data) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading exceptions...</div>
  if (error && !data) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load exceptions</div>
      <button onClick={fetchData} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--txd)', cursor: 'pointer', marginTop: 8 }}>
        Retry
      </button>
    </div>
  )

  const exceptions = data?.exceptions ?? []
  const filtered = exceptions.filter((e: any) => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false
    if (sourceFilter !== 'all' && e.source !== sourceFilter) return false
    return true
  })

  // Compute filtered counts
  const filteredTotal = filtered.length
  const filteredCritical = filtered.filter((e: any) => e.severity === 'critical').length
  const filteredWarning = filtered.filter((e: any) => e.severity === 'warning').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Exception Queue</h1>
        <button onClick={fetchData} style={{
          fontSize: 10, padding: '5px 10px', borderRadius: 6,
          border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txd)', cursor: 'pointer',
        }}>
          ↻ Refresh
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 20px' }}>
        Network exceptions from trust challenges, logistics, and disputes
        {data.total !== filteredTotal && <span style={{ color: 'var(--txd)' }}> · {filteredTotal} shown of {data.total}</span>}
      </p>

      {/* Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--br)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{filteredTotal}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid rgba(255,77,106,.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--red)', textTransform: 'uppercase' }}>Critical</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--red)' }}>{filteredCritical}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid rgba(245,166,35,.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--amber)', textTransform: 'uppercase' }}>Warnings</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--amber)' }}>{filteredWarning}</div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        severity={severityFilter} source={sourceFilter}
        onSeverityChange={setSeverityFilter} onSourceChange={setSourceFilter}
      />

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txd)' }}>
          {exceptions.length === 0 ? '✓ No exceptions — network is healthy' : 'No exceptions match the current filters'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((e: any) => (
            <div
              key={e.id}
              onClick={() => setSelectedException(e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--card)', border: '1px solid var(--br)',
                borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={el => { el.currentTarget.style.borderColor = 'rgba(68,103,242,0.3)' }}
              onMouseLeave={el => { el.currentTarget.style.borderColor = 'var(--br)' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEV_COLORS[e.severity] || 'var(--txdd)', flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: SEV_COLORS[e.severity] || 'var(--txdd)', textTransform: 'uppercase', width: 60, flexShrink: 0 }}>
                {e.severity}
              </span>
              <span style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase', width: 70, flexShrink: 0 }}>{e.source}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.summary}
              </span>
              <span style={{ fontSize: 10, color: 'var(--txdd)', width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {e.org_name ?? '—'}
              </span>
              <span style={{ fontSize: 9, color: 'var(--txdd)', width: 75, flexShrink: 0 }}>
                {e.created_at?.split('T')[0] ?? ''}
              </span>

              {/* Action buttons */}
              <ActionButtons exceptionId={e.id} onAction={handleAction} actionLoading={actionLoading} />
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedException && (
        <ExceptionModal exception={selectedException} onClose={() => setSelectedException(null)} />
      )}
    </div>
  )
}
