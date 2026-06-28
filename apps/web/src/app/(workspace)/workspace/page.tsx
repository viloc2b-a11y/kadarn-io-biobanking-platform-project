'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Overview {
  stats: { active_programs: number; pending_requests: number; active_deals: number }
  recent_programs: { id: string; name: string; status: string; updated_at: string }[]
  recent_activity: { id: string; type: string; summary: string; created_at: string }[]
  next_actions: { id: string; label: string; href: string; priority: 'high' | 'medium' | 'low' }[]
}

export default function WorkspacePage() {
  const { user } = useSession()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    const token = (user as { access_token?: string }).access_token
    fetch(`${API}/api/v1/workspace/overview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(json => { if (json.data) setOverview(json.data) })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <OverviewSkeleton />

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
          Overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txd)' }}>
          Your organization's active programs, requests, and recent activity.
        </p>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Active Programs"
          value={overview?.stats.active_programs ?? 0}
          href="/workspace/programs"
          accent="var(--teal)"
        />
        <StatCard
          label="Pending Requests"
          value={overview?.stats.pending_requests ?? 0}
          href="/workspace/exchange"
          accent={overview?.stats.pending_requests ? 'var(--amber)' : 'var(--blue)'}
        />
        <StatCard
          label="Active Deals"
          value={overview?.stats.active_deals ?? 0}
          href="/workspace/exchange"
          accent="var(--blue)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Next actions */}
          {overview && overview.next_actions.length > 0 && (
            <Section title="Next Actions">
              {overview.next_actions.map(action => (
                <Link key={action.id} href={action.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--navy2)',
                  marginBottom: 8,
                }}>
                  <PriorityDot priority={action.priority} />
                  <span style={{ fontSize: 13, color: 'var(--tx)' }}>{action.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--txdd)' }}>→</span>
                </Link>
              ))}
            </Section>
          )}

          {/* Recent programs */}
          <Section title="Active Programs">
            {overview && overview.recent_programs.length > 0 ? (
              overview.recent_programs.map(p => (
                <Link key={p.id} href={`/workspace/programs/${p.id}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--navy2)',
                  marginBottom: 6,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 2 }}>
                      {new Date(p.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))
            ) : (
              <EmptySection message="No active programs." cta="Browse marketplace" href="/marketplace" />
            )}
          </Section>
        </div>

        {/* Right column — activity feed */}
        <Section title="Recent Activity">
          {overview && overview.recent_activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {overview.recent_activity.map((a, i) => (
                <div key={a.id} style={{
                  padding: '10px 0',
                  borderBottom: i < overview.recent_activity.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--txd)', marginBottom: 2 }}>{a.summary}</div>
                  <div style={{ fontSize: 10, color: 'var(--txdd)' }}>
                    {a.type.replace(/_/g, ' ')} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection message="No activity yet." />
          )}
        </Section>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, href, accent }: { label: string; value: number; href: string; accent: string }) {
  return (
    <Link href={href} style={{
      padding: '18px 20px',
      borderRadius: 12,
      border: `1px solid ${accent}25`,
      background: `${accent}06`,
      display: 'block',
    }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: accent, marginBottom: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--txd)' }}>{label}</div>
    </Link>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--txdd)', marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function PriorityDot({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const color = priority === 'high' ? 'var(--red)' : priority === 'medium' ? 'var(--amber)' : 'var(--txdd)'
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? 'var(--green)' : status === 'on_hold' ? 'var(--amber)' : 'var(--txdd)'
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${color}12`, color, fontWeight: 700, textTransform: 'capitalize' }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function EmptySection({ message, cta, href }: { message: string; cta?: string; href?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--txdd)', fontSize: 13 }}>
      {message}
      {cta && href && (
        <>
          {' '}
          <Link href={href} style={{ color: 'var(--teal)' }}>{cta}</Link>
        </>
      )}
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div>
      <div style={{ height: 36, width: 160, borderRadius: 8, background: 'var(--navy2)', marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: 88, borderRadius: 12, background: 'var(--navy2)' }} />)}
      </div>
    </div>
  )
}
