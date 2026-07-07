'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'
export default function KnowledgePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    kocFetch(`/api/v1/koc/knowledge`).then(r => r.json()).then(d => { setData(d.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ padding: 20, color: 'var(--txd)' }}>Loading knowledge data...</div>
  if (!data) return <div style={{ padding: 20, color: 'var(--txd)' }}>No knowledge data available</div>
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Knowledge Graph</h1>
      <p style={{ fontSize: 13, color: 'var(--txdd)', margin: '4px 0 24px' }}>Ontology, mappings, and knowledge coverage</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <Stat label="Terms" value={data.total_terms} color="var(--purple)" />
        <Stat label="Synonyms" value={data.total_synonyms} />
        <Stat label="Mappings" value={data.total_mappings} color="var(--blue)" />
        <Stat label="Coverage" value={`${data.term_coverage}%`} color={data.term_coverage >= 80 ? 'var(--teal)' : 'var(--amber)'} />
      </div>
      {data.by_domain && Object.keys(data.by_domain).length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txdd)', textTransform: 'uppercase', marginBottom: 10 }}>By Domain</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(data.by_domain as Record<string, number>).map(([k, v]) => (
              <span key={k} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(139,68,255,0.1)', color: 'var(--purple)' }}>
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--br)', background: 'var(--navy2)' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: color ?? 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txdd)', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )
}
