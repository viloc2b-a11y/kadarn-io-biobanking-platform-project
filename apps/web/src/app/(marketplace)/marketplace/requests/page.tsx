'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type RequestItem = {
  id: string; title: string; description: string | null
  status: string; supply_item_id: string | null
  requested_sample_count: number | null
  requested_timeline_days: number | null
  budget_range_min: number | null; budget_range_max: number | null
  commercial_use: boolean; nonprofit_use: boolean
  submitted_at: string | null; created_at: string
}

type FeasibilityItem = {
  id: string; program_name: string; program_description: string | null
  status: string; therapeutic_area: string | null
  estimated_sample_count: number | null
  urgency: string; created_at: string
}

function statusColor(s: string) {
  const c: Record<string, string> = {
    draft: 'var(--txdd)', submitted: 'var(--blue)', under_review: 'var(--amber)',
    negotiation: 'var(--purple)', accepted: 'var(--teal)', declined: 'var(--red)', withdrawn: 'var(--txdd)',
  }
  return c[s] ?? 'var(--txd)'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function RequestsPage() {
  const { user, loading: authLoading } = useSession()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [feasibilities, setFeasibilities] = useState<FeasibilityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'access' | 'feasibility'>('access')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    const token = (user as any)?.access_token
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined

    Promise.all([
      fetch(`${API}/api/v1/marketplace/requests`, { headers }).then(r => r.json()),
      fetch(`${API}/api/v1/marketplace/feasibility`, { headers }).then(r => r.json()),
    ])
      .then(([reqRes, feasRes]) => {
        if (reqRes.data) setRequests(reqRes.data)
        if (feasRes.data) setFeasibilities(feasRes.data)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [user, authLoading])

  if (authLoading) return null

  if (!user) {
    return (
      <div style={{ padding: '80px 32px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>◎</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Sign in to view requests</h2>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginBottom: 24 }}>
          Access requests and feasibility studies require a Kadarn account.
        </p>
        <Link href="/login?next=/marketplace/requests" style={{
          display: 'inline-block', padding: '10px 24px', borderRadius: 10,
          background: 'var(--teal)', color: 'var(--navy)', fontWeight: 800, fontSize: 14,
        }}>
          Sign in
        </Link>
      </div>
    )
  }

  const items = tab === 'access' ? requests : feasibilities

  return (
    <div style={{ padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8 }}>
          Marketplace
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>My Requests</h1>
      </header>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {(['access', 'feasibility'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px', fontSize: 12, fontWeight: tab === t ? 700 : 500,
            color: tab === t ? 'var(--teal)' : 'var(--txdd)',
            background: 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1, textTransform: 'capitalize',
          }}>
            {t === 'access' ? 'Access Requests' : 'Feasibility Assessments'}
            {items.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--txdd)' }}>({items.length})</span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab === 'access' && (
          <Link href="/marketplace" style={{ fontSize: 12, color: 'var(--teal)', alignSelf: 'center', paddingBottom: 10 }}>
            + New Request
          </Link>
        )}
      </div>

      {loading && <div style={{ padding: 20, color: 'var(--txd)' }}>Loading...</div>}

      {error && (
        <div style={{ padding: 20, borderRadius: 10, background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.15)', color: 'var(--red)', fontSize: 13 }}>
          Failed to load requests. Try again later.
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--txd)', fontSize: 13 }}>
          No {tab === 'access' ? 'access requests' : 'feasibility assessments'} yet. Browse the{' '}
          <Link href="/marketplace" style={{ color: 'var(--teal)' }}>marketplace</Link>
          {' '}to submit one.
        </div>
      )}

      {!loading && !error && items.length > 0 && tab === 'access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(items as RequestItem[]).map(r => (
            <div key={r.id} style={{
              padding: '14px 16px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{r.title}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, color: statusColor(r.status), background: `${statusColor(r.status)}18` }}>
                  {r.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              {r.description && <div style={{ fontSize: 11, color: 'var(--txd)', marginBottom: 6 }}>{r.description}</div>}
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--txdd)' }}>
                {r.requested_sample_count && <span>{r.requested_sample_count} samples</span>}
                {r.requested_timeline_days && <span>{r.requested_timeline_days} days</span>}
                {(r.budget_range_min || r.budget_range_max) && (
                  <span>Budget: ${r.budget_range_min?.toLocaleString() ?? 0}–${r.budget_range_max?.toLocaleString() ?? '—'}</span>
                )}
                <span>{r.commercial_use ? 'Commercial' : 'Non-profit'}</span>
                <span>{fmtDate(r.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && items.length > 0 && tab === 'feasibility' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(items as FeasibilityItem[]).map(f => (
            <div key={f.id} style={{
              padding: '14px 16px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{f.program_name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, color: statusColor(f.status), background: `${statusColor(f.status)}18` }}>
                  {f.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              {f.program_description && <div style={{ fontSize: 11, color: 'var(--txd)', marginBottom: 6 }}>{f.program_description}</div>}
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--txdd)' }}>
                {f.therapeutic_area && <span>{f.therapeutic_area}</span>}
                {f.estimated_sample_count && <span>{f.estimated_sample_count} samples</span>}
                <span style={{ textTransform: 'capitalize' }}>{f.urgency}</span>
                <span>{fmtDate(f.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
