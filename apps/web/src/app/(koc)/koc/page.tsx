'use client'

import { useEffect, useState } from 'react'
import { kocFetch } from '@/lib/koc-api'

type HealthData = {
  active_organizations: number
  active_programs: number
  pending_requests: number
  shipments_in_transit: number
}

type ExceptionsData = {
  total: number
  critical: number
  warning: number
  exceptions: Array<{
    id: string
    source: string
    severity: string
    type: string
    summary: string
    org_name: string | null
    created_at: string
  }>
}

type KpeData = {
  network_kpe: number
  program_count: number
  audit_ready: number
  programs: Array<{
    program_name: string
    overall: number
    audit_ready: boolean
  }>
}


async function get<T>(path: string): Promise<{ data: T | null; error: boolean }> {
  try {
    const res = await kocFetch(path)
    if (!res.ok) return { data: null, error: true }
    const json = await res.json()
    return { data: json.data ?? null, error: false }
  } catch {
    return { data: null, error: true }
  }
}

export default function KocPage() {
  const [health,     setHealth]     = useState<HealthData | null>(null)
  const [exceptions, setExceptions] = useState<ExceptionsData | null>(null)
  const [kpe,        setKpe]        = useState<KpeData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    Promise.all([
      get<HealthData>('/api/v1/operations/health'),
      get<ExceptionsData>('/api/v1/operations/exceptions'),
      get<KpeData>('/api/v1/operations/kpe'),
    ]).then(([h, e, k]) => {
      if (h.error && e.error && k.error) setFetchError(true)
      setHealth(h.data)
      setExceptions(e.data)
      setKpe(k.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <OverviewSkeleton />
  if (fetchError) return <FetchError onRetry={() => { setLoading(true); setFetchError(false) }} />

  const criticalCount = exceptions?.critical ?? 0

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Network Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>
          Real-time state of the Kadarn biospecimen network
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Active Organizations" value={health?.active_organizations ?? '—'} icon="◎" color="var(--teal)" />
        <StatCard label="Active Programs"      value={health?.active_programs ?? '—'}      icon="◈" color="var(--blue)" />
        <StatCard label="Shipments In Transit" value={health?.shipments_in_transit ?? '—'} icon="▱" color="var(--blue)" />
        <StatCard label="Pending Requests"     value={health?.pending_requests ?? '—'}     icon="⇄" color="var(--txdd)" />
      </div>

      {/* KPE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        <div style={{ padding: 24, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--navy2)' }}>
          <div style={{ fontSize: 11, color: 'var(--txdd)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            Kadarn Proof of Execution
          </div>
          {kpe ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: kpeColor(kpe.network_kpe) }}>{kpe.network_kpe}</span>
                <span style={{ fontSize: 13, color: 'var(--txdd)' }}>% avg completion</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 8 }}>
                {kpe.program_count} active programs · {kpe.audit_ready} audit-ready
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {kpe.programs.slice(0, 3).map(p => (
                  <div key={p.program_name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--txdd)', width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.program_name}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)' }}>
                      <div style={{ width: `${p.overall}%`, height: '100%', borderRadius: 2, background: kpeColor(p.overall) }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--txdd)', width: 28, textAlign: 'right' }}>{p.overall}%</span>
                    {p.audit_ready && <span style={{ fontSize: 9, color: 'var(--teal)', fontWeight: 700 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--txdd)', fontSize: 13 }}>No program data</div>
          )}
        </div>
      </div>

      {/* Exception queue */}
      <div style={{ padding: 24, borderRadius: 14, border: `1px solid ${criticalCount > 0 ? 'rgba(255,80,80,0.3)' : 'var(--border)'}`, background: 'var(--navy2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--txdd)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', flex: 1 }}>
            Exception Queue
          </div>
          {exceptions && (
            <div style={{ display: 'flex', gap: 10 }}>
              {exceptions.critical > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'rgba(255,80,80,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                  {exceptions.critical} critical
                </span>
              )}
              {exceptions.warning > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', background: 'rgba(255,190,0,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                  {exceptions.warning} warning
                </span>
              )}
              {exceptions.total === 0 && (
                <span style={{ fontSize: 11, color: 'var(--teal)' }}>All clear</span>
              )}
            </div>
          )}
        </div>
        {exceptions?.exceptions.length === 0 && (
          <div style={{ color: 'var(--txdd)', fontSize: 13 }}>No active exceptions</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(exceptions?.exceptions ?? []).slice(0, 6).map(ex => (
            <div key={ex.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 9,
              background: ex.severity === 'critical' ? 'rgba(255,80,80,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${ex.severity === 'critical' ? 'rgba(255,80,80,0.2)' : 'var(--border)'}`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: severityColor(ex.severity), width: 50 }}>
                {ex.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: 12, flex: 1, color: 'var(--txd)' }}>{ex.summary}</span>
              {ex.org_name && <span style={{ fontSize: 11, color: 'var(--txdd)' }}>{ex.org_name}</span>}
              <span style={{ fontSize: 10, color: 'var(--txdd)', width: 60, textAlign: 'right' }}>{ex.source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div style={{ padding: '20px 20px 18px', borderRadius: 13, border: '1px solid var(--border)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 18, marginBottom: 10, color }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1, color: 'var(--tx)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--txdd)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}


function OverviewSkeleton() {
  return (
    <div>
      <div style={{ height: 28, width: 220, borderRadius: 8, background: 'var(--navy2)', marginBottom: 10 }} />
      <div style={{ height: 16, width: 300, borderRadius: 6, background: 'var(--navy2)', marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 90, borderRadius: 13, background: 'var(--navy2)' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        {[1,2].map(i => <div key={i} style={{ height: 160, borderRadius: 14, background: 'var(--navy2)' }} />)}
      </div>
      <div style={{ height: 200, borderRadius: 14, background: 'var(--navy2)' }} />
    </div>
  )
}


function kpeColor(pct: number) {
  return pct >= 80 ? 'var(--teal)' : pct >= 50 ? 'var(--blue)' : 'var(--amber)'
}

function severityColor(s: string) {
  return s === 'critical' ? 'var(--red)' : s === 'warning' ? 'var(--amber)' : 'var(--txdd)'
}

function FetchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ maxWidth: 420, marginTop: 40 }}>
      <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load operations data</div>
        <div style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16 }}>
          The operations endpoints could not be reached. Check your connection or session.
        </div>
        <button onClick={onRetry} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--txd)', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    </div>
  )
}
