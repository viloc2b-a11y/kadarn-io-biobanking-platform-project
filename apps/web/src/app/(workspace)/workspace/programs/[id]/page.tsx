'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProgramData {
  id: string; name: string; short_name: string | null; description: string | null
  status: string; sponsor_org_id: string | null; lead_org_id: string | null
  start_date: string | null; end_date: string | null
  program_type: string[]; therapeutic_areas: string[]
  created_at: string; updated_at: string
}
interface Participant {
  id: string; role: string; status: string
  invited_at: string | null; joined_at: string | null
  organization: { id: string; name: string; country: string; is_active: boolean } | null
}
interface Milestone {
  id: string; type: string; title: string; status: string
  planned_end: string | null; actual_end: string | null
}
interface ExchangeDeal {
  id: string; title: string; description: string | null; status: string
  total_value: number | null; currency: string
  sponsor_org_id: string; provider_org_id: string
  mta: { sponsor_signed: boolean; provider_signed: boolean }
  timeline: { expected_start: string | null; expected_end: string | null }
  samples: { expected: number | null; delivered: number | null; delivery_pct: number | null }
  escrow: { status: string; total_amount: number; released_amount: number } | null
  created_at: string
}
interface ActivityEvent {
  id: string; action: string; summary: string | null
  actor: { id: string; email: string | null }
  resource: { type: string; id: string | null }
  created_at: string
}
interface KpeData {
  program: { id: string; name: string; short_name: string | null; status: string }
  kpe_score: number; audit_ready: boolean
  dimensions: { evidence: DimData; governance: DimData; provenance: DimData; settlement: DimData }
  gaps: string[]; milestones: Milestone[]; evidence_items: any[]
}
interface DimData {
  score: number; threshold: number; status: 'pass' | 'warn' | 'fail'
  total: number; passed: number; gaps: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
function dimColor(status: string) {
  const c: Record<string, string> = { pass: 'var(--teal)', warn: 'var(--amber)', fail: 'var(--red)' }
  return c[status] ?? 'var(--txdd)'
}
function statusColor(s: string) {
  const c: Record<string, string> = {
    active: 'var(--teal)', draft: 'var(--txdd)', paused: 'var(--amber)',
    completed: 'var(--blue)', archived: 'var(--txdd)', cancelled: 'var(--red)',
    invited: 'var(--txdd)', pending_acceptance: 'var(--amber)', disputed: 'var(--red)',
  }
  return c[s] ?? 'var(--txd)'
}

function Badge({ text, color }: { text: string; color?: string }) {
  const c = color ?? statusColor(text)
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: `${c}18`, color: c }}>
      {text.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

function SkeletonBlock({ h = 180 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 12, background: 'var(--navy2)' }} />
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
type TabId = 'overview' | 'participants' | 'milestones' | 'exchange' | 'kpe' | 'activity'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'participants', label: 'Participants' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'exchange', label: 'Exchange' },
  { id: 'kpe', label: 'KPE' },
  { id: 'activity', label: 'Activity' },
]

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------
function OverviewTab({ program, participantCount, milestones }: {
  program: ProgramData; participantCount: number; milestones: Milestone[]
}) {
  const completedM = milestones.filter(m => m.status === 'completed').length
  const activeM = milestones.filter(m => m.status === 'in_progress').length
  const overdueM = milestones.filter(m =>
    m.status !== 'completed' && m.planned_end && new Date(m.planned_end) < new Date()
  ).length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Participants" value={String(participantCount)} />
        <StatCard label="Milestones" value={String(milestones.length)} sub={`${completedM} done · ${activeM} active`} />
        <StatCard label="Overdue" value={String(overdueM)} color={overdueM > 0 ? 'var(--red)' : 'var(--teal)'} />
        <StatCard label="Status" value={program.status.replace(/_/g, ' ')} color={statusColor(program.status)} />
      </div>

      <div style={{
        padding: 20, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--navy2)',
      }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Program Details
        </h3>
        <DetailRow label="Description" value={program.description ?? 'No description'} />
        <DetailRow label="Duration" value={`${fmtDate(program.start_date)} — ${fmtDate(program.end_date)}`} />
        <DetailRow label="Program Type" value={program.program_type?.join(', ') || '—'} />
        <DetailRow label="Therapeutic Areas" value={program.therapeutic_areas?.join(', ') || '—'} />
        <DetailRow label="Sponsor Org ID" value={program.sponsor_org_id ?? '—'} />
        <DetailRow label="Created" value={fmtDate(program.created_at)} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--txd)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
      <span style={{ width: 140, color: 'var(--txdd)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--txd)' }}>{value}</span>
    </div>
  )
}

function ParticipantsTab({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) return <EmptyState message="No participants for this program" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {participants.map(p => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--card)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.organization?.name ?? 'Unknown Org'}</div>
            <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
              {p.organization?.country ?? '—'} · {p.organization?.id.slice(0, 8)}
            </div>
          </div>
          <Badge text={p.role} color={statusColor(p.role)} />
          <Badge text={p.status} />
          <div style={{ fontSize: 10, color: 'var(--txdd)', width: 80, textAlign: 'right' }}>
            {p.joined_at ? fmtDate(p.joined_at) : 'Invited'}
          </div>
        </div>
      ))}
    </div>
  )
}

function MilestonesTab({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return <EmptyState message="No milestones defined for this program" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {milestones.map(m => (
        <div key={m.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 9,
          border: '1px solid var(--border)', background: 'var(--card)',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
            background: `${statusColor(m.status)}18`, color: statusColor(m.status),
          }}>
            {m.status === 'completed' ? '✓' : m.status === 'in_progress' ? '◑' : '○'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</div>
            <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
              {m.type.replace(/_/g, ' ')}
              {m.planned_end && ` · Due: ${fmtDate(m.planned_end)}`}
              {m.actual_end && ` · Done: ${fmtDate(m.actual_end)}`}
            </div>
          </div>
          <Badge text={m.status} />
        </div>
      ))}
    </div>
  )
}

function ExchangeTab({ deals }: { deals: ExchangeDeal[] }) {
  if (deals.length === 0) return <EmptyState message="No exchange deals for this program" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {deals.map(d => {
        const releasePct = d.escrow && d.escrow.total_amount > 0
          ? Math.round((d.escrow.released_amount / d.escrow.total_amount) * 100) : null
        return (
          <div key={d.id} style={{
            padding: '14px 16px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{d.title}</div>
                <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>{d.id.slice(0, 8)}</div>
              </div>
              <Badge text={d.status} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--txd)' }}>
              <span>Value: {d.currency} {d.total_value?.toLocaleString() ?? '—'}</span>
              <span>MTA: {d.mta.sponsor_signed ? '✓ Sponsor' : '○ Sponsor'} · {d.mta.provider_signed ? '✓ Provider' : '○ Provider'}</span>
              <span>Delivery: {d.samples.delivery_pct ?? 0}%</span>
              {releasePct !== null && <span>Escrow: {releasePct}% released</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KpeTab({ programId }: { programId: string }) {
  const [data, setData] = useState<KpeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/v1/programs/${programId}/kpe`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [programId])

  if (loading) return <SkeletonBlock h={300} />
  if (error || !data) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--txd)' }}>
      Could not load KPE data.
      <br />
      <Link href={`/workspace/programs/${programId}/kpe`} style={{ color: 'var(--blue)', fontSize: 12, marginTop: 8, display: 'inline-block' }}>
        Open full KPE page →
      </Link>
    </div>
  )

  const ds = data.dimensions
  const dimEntries: [string, DimData][] = [
    ['Evidence', ds.evidence], ['Governance', ds.governance],
    ['Provenance', ds.provenance], ['Settlement', ds.settlement],
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 18, fontWeight: 900,
          background: `conic-gradient(${data.audit_ready ? 'var(--teal)' : 'var(--amber)'} ${data.kpe_score}%, var(--border) ${data.kpe_score}%)`,
        }}>
          {data.kpe_score}
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>KPE Score</span>
          {data.audit_ready ? (
            <span style={{ marginLeft: 10, fontSize: 10, fontWeight: 700, color: 'var(--teal)', padding: '2px 8px', borderRadius: 5, background: 'rgba(34,211,122,0.12)' }}>
              AUDIT READY
            </span>
          ) : (
            <span style={{ marginLeft: 10, fontSize: 10, fontWeight: 700, color: 'var(--amber)', padding: '2px 8px', borderRadius: 5, background: 'rgba(245,166,35,0.12)' }}>
              {data.gaps.length} GAP(S)
            </span>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <Link href={`/workspace/programs/${programId}/kpe`} style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
          Full KPE Report →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {dimEntries.map(([title, dim]) => (
          <div key={title} style={{ padding: 16, borderRadius: 12, border: `1px solid ${dimColor(dim.status)}30`, background: `${dimColor(dim.status)}08` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: dimColor(dim.status) }}>{dim.score}</div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(dim.score, 100)}%`, height: '100%', borderRadius: 3, background: dimColor(dim.status) }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 4 }}>{dim.passed}/{dim.total} · {dim.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityTab({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <EmptyState message="No activity recorded for this program" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {events.map(e => (
        <div key={e.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 9,
          border: '1px solid var(--border)', background: 'var(--card)',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: e.action === 'create' ? 'var(--teal)' : e.action === 'update' ? 'var(--blue)' : e.action === 'delete' ? 'var(--red)' : 'var(--txdd)',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--tx)' }}>
              <strong>{e.action}</strong> {e.resource.type}
              {e.summary && <span style={{ color: 'var(--txd)' }}> — {e.summary}</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
              {e.actor.email ?? e.actor.id.slice(0, 8)} · {fmtDate(e.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)', fontSize: 13 }}>
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProgramDetailPage() {
  const params = useParams()
  const programId = params.id as string
  const { user } = useSession()
  const token = (user as any)?.access_token
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [program, setProgram] = useState<ProgramData | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [deals, setDeals] = useState<ExchangeDeal[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Fetch all data once
  useEffect(() => {
    if (!user || !programId) return

    Promise.all([
      fetch(`${API}/api/v1/programs/${programId}`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API}/api/v1/programs/${programId}/participants`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API}/api/v1/programs/${programId}/kpe`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API}/api/v1/programs/${programId}/exchange`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API}/api/v1/programs/${programId}/activity`, { headers: authHeaders }).then(r => r.json()),
    ])
      .then(([pRes, partRes, kpeRes, exRes, actRes]) => {
        if (pRes.data) setProgram(pRes.data)
        if (partRes.data) setParticipants(partRes.data)
        if (kpeRes.data) setMilestones(kpeRes.data.milestones ?? [])
        if (exRes.data) setDeals(exRes.data)
        if (actRes.data) setActivity(actRes.data)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [user, programId])

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }}>Sign in to view program details</div>
  if (loading) return <SkeletonBlock h={400} />
  if (error) return (
    <div style={{ maxWidth: 420, marginTop: 24, padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load program details</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>Could not reach one or more endpoints for this program.</div>
    </div>
  )
  if (!program) return <EmptyState message="Program not found" />

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
            {program.short_name ?? program.name}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--txdd)', margin: '4px 0 0' }}>
            {program.name !== program.short_name && <>{program.name} · </>}
            {program.program_type?.join(', ') || 'Program'} · {fmtDate(program.created_at)}
          </p>
        </div>
        <Badge text={program.status} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--blue)' : 'var(--txdd)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--blue)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 0.1s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && <OverviewTab program={program} participantCount={participants.length} milestones={milestones} />}
        {activeTab === 'participants' && <ParticipantsTab participants={participants} />}
        {activeTab === 'milestones' && <MilestonesTab milestones={milestones} />}
        {activeTab === 'exchange' && <ExchangeTab deals={deals} />}
        {activeTab === 'kpe' && <KpeTab programId={programId} />}
        {activeTab === 'activity' && <ActivityTab events={activity} />}
      </div>
    </div>
  )
}
