'use client'

import { useState, useEffect } from 'react'
import { RequestCta } from '@/components/marketplace/request-cta'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Org {
  id: string
  name: string
  description: string | null
  country: string | null
  region: string | null
  certifications: string[]
  capabilities: { key: string; name: string; category: string; primary: boolean }[]
  trust: {
    overall: number
    operational: number
    regulatory: number
    financial: number
    technical: number
    fulfillments: number
    success_rate: number | null
  } | null
}

export default function OrganizationsPage() {
  const [orgs, setOrgs]         = useState<Org[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [draft, setDraft]       = useState('')
  const [capability, setCap]    = useState('')
  const [country, setCountry]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q)          params.set('q', q)
    if (capability) params.set('capability', capability)
    if (country)    params.set('country', country)

    fetch(`${API}/api/v1/marketplace/organizations?${params}`)
      .then(r => r.json())
      .then(json => { setOrgs(json.data?.results ?? []); setTotal(json.data?.total ?? 0) })
      .finally(() => setLoading(false))
  }, [q, capability, country])

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8 }}>
          Network Marketplace
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Organizations</h1>
        <p style={{ fontSize: 13, color: 'var(--txd)' }}>
          Discover biobanks, labs, CROs, sites, and service providers across the network.
        </p>
      </header>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <form onSubmit={e => { e.preventDefault(); setQ(draft) }} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Search organizations…"
            style={{ flex: 1, padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--tx)', fontSize: 13, outline: 'none', minWidth: 200 }}
          />
          <button type="submit" style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--teal)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Search
          </button>
        </form>
        <select value={capability} onChange={e => setCap(e.target.value)} style={selectStyle}>
          <option value="">All capabilities</option>
          <option value="biobank">Biobank</option>
          <option value="sponsor">Sponsor</option>
          <option value="cro">CRO</option>
          <option value="clinical_site">Clinical Site</option>
          <option value="processing_lab">Processing Lab</option>
          <option value="diagnostic_lab">Diagnostic Lab</option>
          <option value="logistics_vendor">Logistics</option>
          <option value="irb">IRB</option>
        </select>
        <select value={country} onChange={e => setCountry(e.target.value)} style={selectStyle}>
          <option value="">All countries</option>
          <option value="US">United States</option>
          <option value="DE">Germany</option>
          <option value="GB">United Kingdom</option>
          <option value="FR">France</option>
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <p style={{ fontSize: 12, color: 'var(--txdd)', marginBottom: 16 }}>
          {total} organization{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Results */}
      {loading && <SkeletonList />}

      {!loading && orgs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--txdd)' }}>
          No organizations found.
        </div>
      )}

      {!loading && orgs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orgs.map(org => (
            <OrgCard
              key={org.id}
              org={org}
              expanded={expanded === org.id}
              onToggle={() => setExpanded(expanded === org.id ? null : org.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrgCard({ org, expanded, onToggle }: { org: Org; expanded: boolean; onToggle: () => void }) {
  const primary = org.capabilities.find(c => c.primary) ?? org.capabilities[0]

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid var(--border)',
      background: 'var(--navy2)',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>{org.name}</span>
            {primary && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(12,197,193,0.1)', color: 'var(--teal)', fontWeight: 700 }}>
                {primary.name}
              </span>
            )}
          </div>
          {org.description && (
            <p style={{ fontSize: 12, color: 'var(--txd)', lineHeight: 1.6, marginBottom: 8, maxWidth: 600, display: '-webkit-box', WebkitLineClamp: expanded ? undefined : 2, WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>
              {org.description}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {org.capabilities.slice(0, 5).map(c => (
              <span key={c.key} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, background: 'rgba(68,103,242,0.1)', color: 'var(--blue)' }}>
                {c.name}
              </span>
            ))}
            {org.country && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', color: 'var(--txdd)' }}>
                {org.country}{org.region ? ` · ${org.region}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Trust badge */}
        <div style={{ flexShrink: 0 }}>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <RequestCta type="feasibility" targetId={org.id} targetType="organization" />
          <RequestCta type="access" targetId={org.id} targetType="organization" />
          <button onClick={onToggle} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--txdd)', cursor: 'pointer', fontSize: 12 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded trust details */}
      {expanded && org.trust && (
        <div style={{ padding: '0 20px 18px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--txdd)', marginBottom: 12, fontWeight: 700 }}>
            Trust Score Breakdown
          </p>
        </div>
      )}
    </div>
  )
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ height: 90, borderRadius: 14, background: 'var(--navy2)', border: '1px solid var(--border)', opacity: 0.5 }} />
      ))}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderRadius: 9,
  border: '1px solid var(--border)',
  background: 'var(--navy2)',
  color: 'var(--txd)',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
}
