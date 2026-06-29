'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

export default function KpePage() {
  const [data, setData]     = useState<KpeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    fetch(`${API}/api/v1/operations/kpe`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: 40, color: 'var(--txd)' }}>Loading KPE...</div>
  if (error || !data) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load KPE report</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The operations KPE endpoint could not be reached.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Proof of Execution</h1>
          <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 0' }}>Network-wide KPE summary</p>
        </div>
        <span style={{ fontSize: 10, padding: '4px 12px', borderRadius: 10, background: 'rgba(34,211,122,.15)', color: 'var(--green)', fontWeight: 700 }}>
          {data.audit_ready} / {data.program_count} AUDIT READY
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiBox label="Network KPE" value={`${data.network_kpe}%`} color="teal" />
        <KpiBox label="Active Programs" value={data.program_count} />
        <KpiBox label="Audit Ready" value={data.audit_ready} color="green" />
      </div>

      {data.programs.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--br)', borderRadius: 12, padding: 14 }}>
          <h3 style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase', margin: '0 0 12px' }}>Programs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.programs.map(p => (
              <div key={p.program_name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--txd)', width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.program_name}
                </span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)' }}>
                  <div style={{ width: `${p.overall}%`, height: '100%', borderRadius: 3, background: kpeColor(p.overall) }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--txdd)', width: 36, textAlign: 'right' }}>{p.overall}%</span>
                {p.audit_ready && <span style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 20 }}>KPE v1.0 / {new Date().toISOString().split('T')[0]} / KRM-BNO Compliant</p>
    </div>
  )
}

function KpiBox({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const c = color === 'green' ? 'var(--green)' : color === 'teal' ? 'var(--teal)' : color === 'blue' ? 'var(--blue)' : 'var(--tx)'
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--br)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 10, color: 'var(--txd)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: c }}>{value}</div>
    </div>
  )
}

function kpeColor(pct: number) {
  return pct >= 80 ? 'var(--teal)' : pct >= 50 ? 'var(--blue)' : 'var(--amber)'
}
