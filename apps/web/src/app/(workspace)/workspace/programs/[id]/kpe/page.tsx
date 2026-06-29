'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface DimData {
  score: number
  threshold: number
  status: 'pass' | 'warn' | 'fail'
  total: number
  passed: number
  gaps: string[]
}

interface Milestone {
  id: string
  type: string
  title: string
  status: string
  planned_end: string | null
  actual_end: string | null
  assigned_org: string | null
}

interface EvidenceItem {
  id: string
  type: string
  external_id: string
  label: string
  has_evidence: boolean
  evidence_count: number
  recorded_at: string
}

interface KpeData {
  program: { id: string; name: string; short_name: string | null; status: string }
  kpe_score: number
  audit_ready: boolean
  dimensions: {
    evidence: DimData
    governance: DimData
    provenance: DimData
    settlement: DimData
  }
  gaps: string[]
  milestones: Milestone[]
  evidence_items: EvidenceItem[]
}

function dimColor(status: string) {
  const c: Record<string, string> = {
    pass: 'var(--teal)',
    warn: 'var(--amber)',
    fail: 'var(--red)',
  }
  return c[status] ?? 'var(--txdd)'
}

function dimBg(status: string) {
  const c: Record<string, string> = {
    pass: 'rgba(34,211,122,0.08)',
    warn: 'rgba(245,166,35,0.08)',
    fail: 'rgba(255,77,106,0.08)',
  }
  return c[status] ?? 'var(--card)'
}

function DimCard({ title, dim }: { title: string; dim: DimData }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 14,
      border: `1px solid ${dimColor(dim.status)}30`,
      background: dimBg(dim.status),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{title}</div>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 6,
          color: dimColor(dim.status),
          background: `${dimColor(dim.status)}18`,
        }}>
          {dim.status === 'pass' ? 'PASS' : dim.status === 'warn' ? 'WARN' : 'FAIL'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: dimColor(dim.status) }}>{dim.score}</span>
        <span style={{ fontSize: 12, color: 'var(--txdd)' }}>/ {dim.threshold}</span>
      </div>

      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(dim.score, 100)}%`,
          height: '100%',
          borderRadius: 3,
          background: dimColor(dim.status),
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--txdd)' }}>
        {dim.passed}/{dim.total} items passing
      </div>

      {dim.gaps.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {dim.gaps.slice(0, 3).map((g, i) => (
            <div key={i} style={{ fontSize: 11, color: dimColor(dim.status), marginBottom: 3, lineHeight: 1.4 }}>
              ⚠ {g}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MilestoneIcon(status: string) {
  const icons: Record<string, string> = {
    completed: '✓',
    in_progress: '◑',
    pending: '○',
    blocked: '▲',
    cancelled: '✕',
  }
  const colors: Record<string, string> = {
    completed: 'var(--teal)',
    in_progress: 'var(--blue)',
    pending: 'var(--txdd)',
    blocked: 'var(--red)',
    cancelled: 'var(--txdd)',
  }
  return (
    <span style={{
      display: 'inline-flex',
      width: 22,
      height: 22,
      borderRadius: '50%',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      background: `${colors[status] ?? 'var(--border)'}18`,
      color: colors[status] ?? 'var(--txdd)',
    }}>
      {icons[status] ?? '○'}
    </span>
  )
}

function KpeSkeleton() {
  return (
    <div>
      <div style={{ height: 32, width: 260, borderRadius: 8, background: 'var(--navy2)', marginBottom: 6 }} />
      <div style={{ height: 16, width: 180, borderRadius: 6, background: 'var(--navy2)', marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 180, borderRadius: 14, background: 'var(--navy2)' }} />)}
      </div>
      <div style={{ height: 200, borderRadius: 14, background: 'var(--navy2)' }} />
    </div>
  )
}

export default function KpePage() {
  const params = useParams()
  const programId = params.id as string
  const { user } = useSession()
  const [data, setData] = useState<KpeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user || !programId) return
    const token = (user as any).access_token

    fetch(`${API}/api/v1/programs/${programId}/kpe`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [user, programId])

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }}>Sign in to view KPE</div>
  if (loading) return <KpeSkeleton />
  if (error) return (
    <div style={{ maxWidth: 420, marginTop: 40 }}>
      <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load KPE</div>
        <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The KPE endpoint could not be reached for program {programId.slice(0, 8)}.</div>
      </div>
    </div>
  )
  if (!data) return <div style={{ color: 'var(--txd)' }}>No KPE data available</div>

  const dims = data.dimensions
  const dimEntries: [string, DimData, string][] = [
    ['Evidence', dims.evidence, '📋'],
    ['Governance', dims.governance, '⚖️'],
    ['Provenance', dims.provenance, '🔗'],
    ['Settlement', dims.settlement, '💰'],
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            {data.program.short_name ?? data.program.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>
            Kadarn Proof of Execution · {data.program.status}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* KPE Score ring */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 900,
              background: `conic-gradient(${dimColor(data.audit_ready ? 'pass' : data.kpe_score >= 70 ? 'warn' : 'fail')} ${data.kpe_score}%, var(--border) ${data.kpe_score}%)`,
              color: 'var(--tx)',
            }}>
              {data.kpe_score}
            </div>
            <div style={{ fontSize: 9, color: 'var(--txdd)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>
              KPE Score
            </div>
          </div>
          {/* Audit Ready badge */}
          {data.audit_ready ? (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(34,211,122,0.12)',
              color: 'var(--teal)',
              letterSpacing: 1,
            }}>
              ✓ AUDIT READY
            </span>
          ) : (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(245,166,35,0.12)',
              color: 'var(--amber)',
              letterSpacing: 1,
            }}>
              ⚠ GAPS FOUND
            </span>
          )}
          <Link href={`/report/kpe/${programId}`} style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: 10,
            background: 'var(--blue)',
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: 0.5,
          }}>
            ↓ Download Report
          </Link>
        </div>
      </div>

      {/* 4 dimension cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {dimEntries.map(([title, dim]) => (
          <DimCard key={title} title={title} dim={dim} />
        ))}
      </div>

      {/* Gaps list */}
      {data.gaps.length > 0 && (
        <div style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          border: '1px solid rgba(245,166,35,0.2)',
          background: 'rgba(245,166,35,0.04)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {data.gaps.length} Gap{data.gaps.length > 1 ? 's' : ''} to resolve
          </div>
          {data.gaps.map((g, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--txd)', marginBottom: 5, paddingLeft: 12 }}>
              · {g}
            </div>
          ))}
        </div>
      )}

      {/* Milestone timeline */}
      <div style={{
        marginBottom: 24,
        padding: 20,
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'var(--navy2)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Milestone Timeline
        </div>
        {data.milestones.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--txdd)' }}>No milestones defined yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.milestones.map(m => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 9,
                background: 'var(--card)',
                border: '1px solid var(--br)',
              }}>
                {MilestoneIcon(m.status)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
                    {m.type.replace(/_/g, ' ')}
                    {m.planned_end && ` · Due: ${new Date(m.planned_end).toLocaleDateString()}`}
                    {m.actual_end && ` · Done: ${new Date(m.actual_end).toLocaleDateString()}`}
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 5,
                  textTransform: 'capitalize',
                  color: m.status === 'completed' ? 'var(--teal)' : m.status === 'blocked' ? 'var(--red)' : m.status === 'in_progress' ? 'var(--blue)' : 'var(--txdd)',
                  background: m.status === 'completed' ? 'rgba(34,211,122,0.1)' : m.status === 'blocked' ? 'rgba(255,77,106,0.1)' : m.status === 'in_progress' ? 'rgba(68,103,242,0.1)' : 'transparent',
                }}>
                  {m.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence items */}
      <div style={{
        padding: 20,
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'var(--navy2)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Evidence Items ({data.evidence_items.length})
        </div>
        {data.evidence_items.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--txdd)' }}>No evidence items found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.evidence_items.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--card)',
                border: '1px solid var(--br)',
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: item.has_evidence ? 'var(--teal)' : 'var(--red)',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.label ?? item.external_id}</div>
                  <div style={{ fontSize: 10, color: 'var(--txdd)' }}>
                    {item.type} · {item.external_id}
                    {item.recorded_at && ` · ${new Date(item.recorded_at).toLocaleDateString()}`}
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 5,
                  color: item.has_evidence ? 'var(--teal)' : 'var(--red)',
                  background: item.has_evidence ? 'rgba(34,211,122,0.1)' : 'rgba(255,77,106,0.1)',
                }}>
                  {item.has_evidence ? `${item.evidence_count} refs` : 'no evidence'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
