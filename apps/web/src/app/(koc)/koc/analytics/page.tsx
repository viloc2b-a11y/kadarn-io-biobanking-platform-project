'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    kocFetch(`/api/v1/koc/analytics`)
      .then(r => { if (!r.ok) throw Error(); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading analytics...</div>
  if (error) return <ErrorBox message="Failed to load analytics" />
  if (!data) return null

  const p = data.programs
  const f = data.fulfillment
  const c = data.collections
  const r = data.revenue

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Platform Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>Program success, fulfillment, collections, and network metrics</p>
      </div>

      {/* Row 1: Program metrics */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle title="Program Success" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="Total Programs" value={p.total} />
          <StatCard label="Active" value={p.active} color="var(--teal)" />
          <StatCard label="Completed" value={p.completed} color="var(--blue)" />
          <StatCard label="Cancelled" value={p.cancelled} color={p.cancelled > 0 ? 'var(--red)' : 'var(--txdd)'} />
        </div>
      </div>

      {/* Row 2: Fulfillment + Collections side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Section title="Fulfillment">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <MiniCard label="Total Deals" value={f.total_deals} />
            <MiniCard label="Completed" value={f.completed_deals} color="var(--teal)" />
            <MiniCard label="Disputed" value={f.disputed_deals} color={f.disputed_deals > 0 ? 'var(--red)' : 'var(--txdd)'} />
            <MiniCard label="Fulfillment Rate" value={`${f.rate}%`} color={f.rate >= 80 ? 'var(--teal)' : f.rate >= 50 ? 'var(--amber)' : 'var(--red)'} />
          </div>
          <Bar label="Samples Delivered" value={f.samples_delivered} max={f.samples_expected} color="var(--teal)" />
          <Bar label="Samples Expected" value={f.samples_expected} max={f.samples_expected} color="var(--txdd)" />
        </Section>

        <Section title="Collections">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <MiniCard label="Total" value={c.total} />
            <MiniCard label="Active" value={c.active} color="var(--teal)" />
            <MiniCard label="Target Enrollment" value={c.target_enrollment} />
            <MiniCard label="Enrollment Rate" value={`${c.enrollment_rate}%`} color={c.enrollment_rate >= 80 ? 'var(--teal)' : c.enrollment_rate >= 50 ? 'var(--amber)' : 'var(--red)'} />
          </div>
          <Bar label="Enrolled" value={c.actual_enrollment} max={c.target_enrollment} color="var(--blue)" />
          <Bar label="Target" value={c.target_enrollment} max={c.target_enrollment} color="var(--txdd)" />
        </Section>
      </div>

      {/* Row 3: Network + Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Section title="Network">
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--blue)', marginBottom: 4 }}>{data.network?.active_orgs ?? 0}</div>
          <div style={{ fontSize: 11, color: 'var(--txdd)' }}>Active Organizations in the Kadarn network</div>
        </Section>

        <Section title="Revenue">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <MiniCard label="Total (escrow)" value={`$${(r.total / 1000).toFixed(0)}k`} color="var(--teal)" />
            <MiniCard label="Released" value={`$${(r.released / 1000).toFixed(0)}k`} color="var(--blue)" />
            <MiniCard label="Pending" value={`$${(r.pending / 1000).toFixed(0)}k`} color={r.pending > 0 ? 'var(--amber)' : 'var(--txdd)'} />
            <MiniCard label="Release Rate" value={r.total > 0 ? `${Math.round((r.released / r.total) * 100)}%` : '—'} color={r.total > 0 && (r.released / r.total) >= 0.8 ? 'var(--teal)' : 'var(--amber)'} />
          </div>
        </Section>
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{title}</div>
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--card)' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function MiniCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--br)', background: 'var(--card)' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--txdd)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
        <span style={{ color: 'var(--txdd)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ maxWidth: 420, padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>{message}</div>
    </div>
  )
}
