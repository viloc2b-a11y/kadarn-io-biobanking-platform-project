'use client'

import { useState, useCallback, useEffect } from 'react'
import { RequestCta } from '@/components/marketplace/request-cta'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'research' | 'services' | 'network'

interface SpecimenResult {
  id: string
  type: string
  title: string
  description: string | null
  disease_label: string | null
  disease_icd10: string | null
  sample_types: string[]
  country: string | null
  commercial_use_allowed: boolean
  org_name: string | null
}

interface ServiceResult {
  id: string
  type: string
  title: string
  description: string | null
  service_categories: string[]
  country: string | null
  org_name: string | null
}

interface NetworkResult {
  id: string
  name: string
  description: string | null
  country: string | null
  region: string | null
  capabilities: { key: string; name: string; category: string; primary: boolean }[]
  trust?: { overall: number } | null
}

interface SearchState {
  q: string
  country: string
  disease: string
  sample_type: string
  capability: string
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketplaceDiscovery({ initialTab = 'research' as Tab }: { initialTab?: Tab } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [filters, setFilters] = useState<SearchState>({ q: '', country: '', disease: '', sample_type: '', capability: '' })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<(SpecimenResult | ServiceResult | NetworkResult)[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (tab: Tab, f: SearchState) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (f.q)           params.set('q', f.q)
      if (f.country)     params.set('country', f.country)
      if (f.disease)     params.set('disease', f.disease)
      if (f.sample_type) params.set('sample_type', f.sample_type)
      if (f.capability)  params.set('capability', f.capability)

      const endpoint = tab === 'research' ? 'specimens' : tab === 'services' ? 'services' : 'network'
      const res = await fetch(`${API}/api/v1/marketplace/${endpoint}?${params}`)
      const json = await res.json()

      if (json.error) throw new Error(json.error.message)
      setResults(json.data.results)
      setTotal(json.data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { search(tab, filters) }, [tab, filters, search])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters(f => ({ ...f, q: draft }))
  }

  function switchTab(t: Tab) {
    setTab(t)
    setFilters({ q: '', country: '', disease: '', sample_type: '', capability: '' })
    setDraft('')
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 10 }}>
          Marketplace
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.5, marginBottom: 8 }}>
          Discover the network
        </h1>
        <p style={{ fontSize: 14, color: 'var(--txd)' }}>
          Find biospecimens, data, services, and partners across the Kadarn network.
        </p>
      </header>

      {/* Search bar */}
      <form onSubmit={submitSearch} style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={
            tab === 'research'  ? 'Search samples, collections, datasets…' :
            tab === 'services'  ? 'Search labs, logistics, processing…' :
                                  'Search biobanks, CROs, sites, partners…'
          }
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--navy2)',
            color: 'var(--tx)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button type="submit" style={{
          padding: '11px 24px',
          borderRadius: 10,
          border: 'none',
          background: 'var(--teal)',
          color: 'var(--navy)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}>
          Search
        </button>
      </form>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['research', 'services', 'network'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: tab === t ? 'rgba(12,197,193,0.1)' : 'transparent',
              color: tab === t ? 'var(--teal)' : 'var(--txd)',
              fontWeight: tab === t ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent',
              marginBottom: -1,
              textTransform: 'capitalize',
            }}
          >
            {t === 'research' ? 'Research' : t === 'services' ? 'Services' : 'Network'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {total > 0 && !loading && (
          <span style={{ fontSize: 12, color: 'var(--txdd)', alignSelf: 'center', paddingRight: 4 }}>
            {total} result{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <FilterSelect
          value={filters.country}
          onChange={v => setFilters(f => ({ ...f, country: v }))}
          placeholder="Country"
          options={[
            { value: 'US', label: 'United States' },
            { value: 'DE', label: 'Germany' },
            { value: 'GB', label: 'United Kingdom' },
            { value: 'FR', label: 'France' },
          ]}
        />
        {tab === 'research' && (
          <FilterSelect
            value={filters.sample_type}
            onChange={v => setFilters(f => ({ ...f, sample_type: v }))}
            placeholder="Sample type"
            options={[
              { value: 'ffpe', label: 'FFPE' },
              { value: 'fresh_frozen', label: 'Fresh Frozen' },
              { value: 'whole_blood', label: 'Whole Blood' },
              { value: 'serum', label: 'Serum' },
              { value: 'plasma', label: 'Plasma' },
              { value: 'urine', label: 'Urine' },
              { value: 'csf', label: 'CSF' },
            ]}
          />
        )}
        {tab === 'network' && (
          <FilterSelect
            value={filters.capability}
            onChange={v => setFilters(f => ({ ...f, capability: v }))}
            placeholder="Capability"
            options={[
              { value: 'biobank', label: 'Biobank' },
              { value: 'sponsor', label: 'Sponsor' },
              { value: 'cro', label: 'CRO' },
              { value: 'clinical_site', label: 'Clinical Site' },
              { value: 'processing_lab', label: 'Processing Lab' },
              { value: 'diagnostic_lab', label: 'Diagnostic Lab' },
              { value: 'logistics_vendor', label: 'Logistics' },
            ]}
          />
        )}
        {(filters.country || filters.sample_type || filters.capability) && (
          <button
            onClick={() => setFilters(f => ({ ...f, country: '', sample_type: '', capability: '' }))}
            style={{ fontSize: 12, color: 'var(--txdd)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading && <LoadingGrid />}

      {!loading && error && (
        <div style={{ padding: 20, borderRadius: 10, background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.15)', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <EmptyState tab={tab} />
      )}

      {!loading && !error && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {tab === 'research'  && (results as SpecimenResult[]).map(r => <SpecimenCard key={r.id} item={r} />)}
          {tab === 'services'  && (results as ServiceResult[]).map(r => <ServiceCard key={r.id} item={r} />)}
          {tab === 'network'   && (results as NetworkResult[]).map(r => <NetworkCard key={r.id} item={r} />)}
        </div>
      )}
    </div>
  )
}

// ─── Result cards ─────────────────────────────────────────────────────────────

function SpecimenCard({ item }: { item: SpecimenResult }) {
  return (
    <Card accent="var(--teal)">
      <TypeBadge label={item.type.replace(/_/g, ' ')} color="var(--teal)" />
      <CardTitle>{item.title}</CardTitle>
      {item.disease_label && <Detail>{item.disease_label}</Detail>}
      {item.description && <CardDesc>{item.description}</CardDesc>}
      <TagRow>
        {item.sample_types?.slice(0, 4).map(s => <Tag key={s} color="var(--teal)">{s}</Tag>)}
      </TagRow>
      <CardFooter orgName={item.org_name} country={item.country}>
        {item.commercial_use_allowed && <span style={{ fontSize: 10, color: 'var(--green)' }}>Commercial ✓</span>}
      </CardFooter>
    </Card>
  )
}

function ServiceCard({ item }: { item: ServiceResult }) {
  return (
    <Card accent="var(--blue)">
      <TypeBadge label={item.type.replace(/_/g, ' ')} color="var(--blue)" />
      <CardTitle>{item.title}</CardTitle>
      {item.description && <CardDesc>{item.description}</CardDesc>}
      <TagRow>
        {item.service_categories?.slice(0, 4).map(s => <Tag key={s} color="var(--blue)">{s}</Tag>)}
      </TagRow>
      <CardFooter orgName={item.org_name} country={item.country} />
    </Card>
  )
}

function NetworkCard({ item }: { item: NetworkResult }) {
  const primary = item.capabilities.find(c => c.primary)
  return (
    <Card accent="var(--purple)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {primary && <TypeBadge label={primary.name} color="var(--purple)" />}
          <CardTitle>{item.name}</CardTitle>
        </div>
      </div>
      {item.description && <CardDesc>{item.description}</CardDesc>}
      <TagRow>
        {item.capabilities.slice(0, 4).map(c => <Tag key={c.key} color="var(--purple)">{c.name}</Tag>)}
      </TagRow>
      <CardFooter orgName={null} country={item.country}>
        {item.region && <span style={{ fontSize: 11, color: 'var(--txdd)' }}>{item.region}</span>}
        <RequestCta type="feasibility" targetId={item.id} targetType="organization" />
        <RequestCta type="access" targetId={item.id} targetType="organization" />
      </CardFooter>
    </Card>
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 14,
      border: `1px solid ${accent}25`,
      background: `${accent}05`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {children}
    </div>
  )
}

function TypeBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 6,
      background: `${color}12`,
      color,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: 'capitalize',
      alignSelf: 'flex-start',
    }}>
      {label}
    </span>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', lineHeight: 1.4 }}>{children}</div>
}

function Detail({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--txd)' }}>{children}</div>
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12,
      color: 'var(--txd)',
      lineHeight: 1.6,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function TagRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{children}</div>
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10,
      padding: '2px 7px',
      borderRadius: 5,
      background: `${color}10`,
      color,
      textTransform: 'capitalize',
    }}>
      {children}
    </span>
  )
}

function CardFooter({ orgName, country, children }: { orgName: string | null; country: string | null; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--txdd)' }}>{orgName ?? '—'}{country ? ` · ${country}` : ''}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function FilterSelect({ value, onChange, placeholder, options }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '7px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--navy2)',
        color: value ? 'var(--tx)' : 'var(--txdd)',
        fontSize: 13,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ height: 180, borderRadius: 14, background: 'var(--navy2)', border: '1px solid var(--border)', opacity: 0.5 }} />
      ))}
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages = {
    research: 'No research assets match your search. Try different keywords or remove filters.',
    services: 'No service providers found. Try a different country or category.',
    network:  'No organizations found. Try searching by name or filtering by capability.',
  }
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--txdd)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
      <p style={{ fontSize: 14 }}>{messages[tab]}</p>
    </div>
  )
}
