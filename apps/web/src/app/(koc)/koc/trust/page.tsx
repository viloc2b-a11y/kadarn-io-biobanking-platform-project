'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function trustColor(score: number) {
  return score >= 0.80 ? 'var(--teal)' : score >= 0.60 ? 'var(--amber)' : 'var(--red)'
}

function riskLabel(level: string) {
  const colors: Record<string, string> = { low: 'var(--teal)', medium: 'var(--amber)', high: 'var(--red)' }
  return <span style={{ color: colors[level] ?? 'var(--txdd)', fontWeight: 700 }}>{level.toUpperCase()}</span>
}

// ---------------------------------------------------------------------------
// Detail panel — slide-in from right
// ---------------------------------------------------------------------------
function TrustDetailPanel({ org, onClose }: { org: any; onClose: () => void }) {
  const dims = [
    { key: 'Operational', value: org.trust?.operational ?? 0, desc: 'Fulfillment reliability & service quality' },
    { key: 'Regulatory', value: org.trust?.regulatory ?? 0, desc: 'Compliance with regulations & standards' },
    { key: 'Financial', value: org.trust?.financial ?? 0, desc: 'Payment history & financial stability' },
    { key: 'Technical', value: org.trust?.technical ?? 0, desc: 'Security posture & system reliability' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
          display: 'flex', justifyContent: 'flex-end',
        }}
      >
        {/* Panel */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 420, maxWidth: '100vw', height: '100vh', overflowY: 'auto',
            background: 'var(--navy2)', borderLeft: '1px solid var(--border)',
            padding: 28,
          }}
        >
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{org.org_name}</div>
              <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 2 }}>{org.country ?? '—'} · {riskLabel(org.risk_level)}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txdd)', fontSize: 18, cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          {/* Overall score ring */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900,
              background: `conic-gradient(${trustColor(org.trust?.overall ?? 0)} ${(org.trust?.overall ?? 0) * 100}%, var(--border) ${(org.trust?.overall ?? 0) * 100}%)`,
              color: 'var(--tx)',
            }}>
              {((org.trust?.overall ?? 0) * 100).toFixed(0)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
              Overall Trust Score
            </div>
          </div>

          {/* Dimension breakdown */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Dimension Scores
            </div>
            {dims.map(d => (
              <div key={d.key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{d.key}</span>
                  <span style={{ color: trustColor(d.value), fontWeight: 800 }}>{(d.value * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${d.value * 100}%`, height: '100%', borderRadius: 3, background: trustColor(d.value) }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>{d.desc}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <StatBox label="Fulfillments" value={String(org.fulfillments ?? 0)} />
            <StatBox label="Success Rate" value={org.success_rate !== null ? `${org.success_rate}%` : '—'} color={org.success_rate !== null && org.success_rate >= 90 ? 'var(--teal)' : org.success_rate !== null && org.success_rate >= 70 ? 'var(--amber)' : undefined} />
            <StatBox label="Incidents" value={String(org.incidents ?? 0)} color={(org.incidents ?? 0) > 0 ? 'var(--red)' : 'var(--teal)'} />
            <StatBox label="Last Event" value={org.last_event_at ? new Date(org.last_event_at).toLocaleDateString() : '—'} />
          </div>

          {/* Org ID */}
          <div style={{ fontSize: 10, color: 'var(--txdd)', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            Organization ID: {org.org_id}
          </div>
        </div>
      </div>
    </>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function TrustPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [networkIndex, setNetworkIndex] = useState<number | null>(null)
  const [atRisk, setAtRisk] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null)

  useEffect(() => {
    fetch(`${API}/api/v1/operations/trust`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => {
        setOrgs(d.data.organizations)
        setNetworkIndex(d.data.network_trust_index)
        setAtRisk(d.data.at_risk)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading trust data...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load trust data</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The trust endpoint could not be reached. Check your connection.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Trust Index</h1>
          <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>Click an organization to view detailed scores</p>
        </div>
        {networkIndex !== null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: trustColor(networkIndex / 100) }}>{networkIndex}</div>
            <div style={{ fontSize: 11, color: 'var(--txdd)' }}>network avg · {atRisk} at risk</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {orgs.map(o => {
          const overall = o.trust?.overall ?? 0
          return (
            <div
              key={o.org_id}
              onClick={() => setSelectedOrg(o)}
              style={{
                background: 'var(--card)', border: '1px solid var(--br)',
                borderRadius: 12, padding: 16, cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--br)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{o.org_name}</div>
              <div style={{ fontSize: 10, color: 'var(--txdd)', marginBottom: 8 }}>{o.country ?? '—'} · {riskLabel(o.risk_level)}</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0', color: trustColor(overall) }}>{(overall * 100).toFixed(0)}%</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--txdd)' }}>
                {o.trust && (
                  <>
                    <span>O: {(o.trust.operational * 100).toFixed(0)}</span>
                    <span>R: {(o.trust.regulatory * 100).toFixed(0)}</span>
                    <span>F: {(o.trust.financial * 100).toFixed(0)}</span>
                    <span>T: {(o.trust.technical * 100).toFixed(0)}</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 6 }}>
                {o.fulfillments} fulfillments · {o.incidents} incidents
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedOrg && (
        <TrustDetailPanel org={selectedOrg} onClose={() => setSelectedOrg(null)} />
      )}
    </div>
  )
}
