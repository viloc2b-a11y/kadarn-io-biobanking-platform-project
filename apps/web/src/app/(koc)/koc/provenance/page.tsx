'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'

const DOMAINS = ['all', 'asset', 'logistics', 'consent', 'exchange', 'settlement', 'governance']

function integrityColor(status: string) {
  const colors: Record<string, string> = {
    complete: 'var(--teal)',
    warning: 'var(--amber)',
    missing_evidence: 'var(--red)',
  }
  return colors[status] ?? 'var(--txdd)'
}

export default function ProvenancePage() {
  const [events, setEvents] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [domain, setDomain] = useState('all')

  useEffect(() => {
    setLoading(true)
    setError(false)
    const params = new URLSearchParams()
    if (domain !== 'all') params.set('domain', domain)
    params.set('limit', '20')

    kocFetch(`/api/v1/operations/provenance?${params}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => {
        setEvents(d.data.events ?? [])
        setSummary(d.data.summary ?? null)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [domain])

  if (loading) return <div style={{padding:20,color:'var(--txd)'}}>Loading provenance events...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load provenance data</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The provenance endpoint could not be reached.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Provenance Explorer</h1>
          <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>
            Cross-entity lineage · {events.length} events
          </p>
        </div>

        {/* Domain filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {DOMAINS.map(d => (
            <button key={d} onClick={() => setDomain(d)} style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '5px 10px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              background: domain === d ? 'rgba(139,68,255,0.2)' : 'var(--card)',
              color: domain === d ? 'var(--purple)' : 'var(--txd)',
            }}>
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Integrity summary */}
      {summary && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {Object.entries(summary).map(([status, count]) => (
            <div key={status} style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: `${integrityColor(status)}12`,
              border: `1px solid ${integrityColor(status)}30`,
              fontSize: 11,
              fontWeight: 600,
              color: integrityColor(status),
            }}>
              {status.replace(/_/g, ' ')}: {count as number}
            </div>
          ))}
        </div>
      )}

      {/* Event timeline */}
      {events.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }}>
          No provenance events found for this domain.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {events.map((evt, i) => (
            <div key={evt.event_id} style={{ position: 'relative', paddingBottom: 14 }}>
              <div style={{
                position: 'absolute', left: -20, top: 4, width: 12, height: 12,
                borderRadius: '50%',
                background: integrityColor(evt.integrity_status),
                border: '2px solid var(--navy)',
              }} />
              {i < events.length - 1 && (
                <div style={{
                  position: 'absolute', left: -15, top: 16,
                  width: 2, height: 'calc(100% - 12px)',
                  background: 'var(--br)',
                }} />
              )}
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--br)',
                borderRadius: 8,
                padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {evt.domain} · {evt.event_type}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{evt.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
                      {evt.organization} · {evt.entity_id}
                      {evt.timestamp && ` · ${new Date(evt.timestamp).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {evt.evidence_count > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--txdd)' }}>
                        {evt.evidence_count} docs
                      </span>
                    )}
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 5,
                      color: integrityColor(evt.integrity_status),
                      background: `${integrityColor(evt.integrity_status)}15`,
                    }}>
                      {evt.integrity_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
