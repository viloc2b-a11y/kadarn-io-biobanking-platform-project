'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'

export default function EcosystemPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    kocFetch(`/api/v1/koc/ecosystem`)
      .then(r => { if (!r.ok) throw Error(); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading ecosystem data...</div>
  if (error) return <ErrorBox message="Failed to load ecosystem insights" />
  if (!data) return null

  const maxProg = Math.max(...(data.top_biobanks?.map((b: any) => b.program_count) ?? [1]))
  const maxDisease = Math.max(...(data.disease_distribution?.map((d: any) => d.count) ?? [1]))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ecosystem Insights</h1>
        <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>Network-wide analytics across all organizations and programs</p>
      </div>

      {/* Demand/Supply + Growth summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Active Requests" value={data.demand_supply?.requests ?? 0} />
        <StatCard label="Completed Deals" value={data.demand_supply?.deals ?? 0} color="var(--teal)" />
        <StatCard label="Conversion Rate" value={`${data.demand_supply?.ratio ?? 0}%`} color={(data.demand_supply?.ratio ?? 0) >= 50 ? 'var(--teal)' : 'var(--amber)'} />
        <StatCard label="Growth (12mo)" value={String(data.growth?.reduce((s: number, m: any) => s + m.new_programs, 0) ?? 0)} color="var(--blue)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Top Organizations */}
        <Section title="Top Organizations by Program Participation">
          {data.top_biobanks?.map((b: any, i: number) => (
            <div key={b.organization_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ width: 20, fontSize: 11, color: 'var(--txdd)', fontWeight: 700 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{b.name}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ width: `${(b.program_count / maxProg) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--purple)' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--purple)', width: 30, textAlign: 'right' }}>{b.program_count}</span>
            </div>
          ))}
        </Section>

        {/* Disease Distribution */}
        <Section title="Therapeutic Area Distribution">
          {data.disease_distribution?.map((d: any) => (
            <div key={d.area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--txd)' }}>{d.area}</span>
              <div style={{ width: 100, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ width: `${(d.count / maxDisease) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--teal)' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', width: 30, textAlign: 'right' }}>{d.count}</span>
            </div>
          ))}
        </Section>
      </div>

      {/* Growth chart */}
      <Section title="Program Growth (Monthly)">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '8px 0' }}>
          {data.growth?.map((m: any) => {
            const maxG = Math.max(...(data.growth?.map((g: any) => g.new_programs) ?? [1]))
            const h = (m.new_programs / maxG) * 100
            return (
              <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${h}%`, borderRadius: '4px 4px 0 0', background: h > 60 ? 'var(--teal)' : h > 30 ? 'var(--blue)' : 'var(--txdd)', minHeight: 4, transition: 'height 0.3s' }} />
                <span style={{ fontSize: 8, color: 'var(--txdd)', transform: 'rotate(-45deg)', transformOrigin: 'left', whiteSpace: 'nowrap', marginTop: 4 }}>{m.month.slice(5)}</span>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--card)' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
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
