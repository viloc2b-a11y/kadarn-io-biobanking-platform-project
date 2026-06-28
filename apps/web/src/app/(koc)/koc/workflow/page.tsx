'use client'
import { useState, useEffect } from 'react'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
export default function WorkflowPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`${API}/api/v1/koc/workflow`, { credentials: 'include' }).then(r => r.json()).then(d => { setData(d.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading workflow data...</div>
  if (!data) return <div style={{ padding: 20, color: 'var(--txd)' }}>No workflow data available</div>
  const s = data.summary
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Workflow Orchestration</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Workflow instances, tasks, and automation status</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <Stat label="Running" value={s.running} color="var(--blue)" />
        <Stat label="Waiting" value={s.waiting} color="var(--txdd)" />
        <Stat label="Blocked" value={s.blocked} color={s.blocked > 0 ? 'var(--red)' : 'var(--teal)'} />
        <Stat label="Overdue" value={s.overdue} color={s.overdue > 0 ? 'var(--amber)' : 'var(--teal)'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal)' }}>{s.completed}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Definitions</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{data.definitions}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--br)', background: 'var(--card)' }}>
          <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{s.total}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {data.by_type && <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 8 }}>By Type</div>
          {Object.entries(data.by_type as Record<string, number>).slice(0, 8).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--br)' }}>
              <span style={{ color: 'var(--txd)' }}>{k}</span>
              <span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>}
        {data.tasks && <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 8 }}>Tasks</div>
          {Object.entries(data.tasks as Record<string, number>).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--br)' }}>
              <span style={{ color: 'var(--txd)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
              <span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>}
      </div>
    </div>
  )
}
function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )
}
