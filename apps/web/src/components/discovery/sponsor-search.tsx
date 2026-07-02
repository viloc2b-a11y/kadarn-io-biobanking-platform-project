import { useState } from 'react'
import type { SponsorSearchResult, SponsorSearchFilters } from './types'
import { Badge, cardStyle } from './panel-primitives'

// ==========================================================================
// Sponsor Capability Search — Sprint 22C
// ==========================================================================
// The first sponsor-facing product in Kadarn.
// Sponsors search for capabilities, not institutions.
// Consumes canonical engine outputs. Owns nothing.
// ==========================================================================

const ALL_CAPABILITIES = [
  'PBMC Processing', 'Plasma Collection', 'Serum Extraction', 'FFPE Tissue Processing',
  'Whole Blood Collection', 'DNA Extraction', 'RNA Extraction', 'Frozen Tissue Storage',
  '-80°C Storage', 'Liquid Nitrogen Storage', 'Cold Chain Shipping', 'Dry Ice Shipping',
  'Phase I Experience', 'Oncology Research', 'Longitudinal Follow-up',
  'Digital Pathology', 'Whole Slide Imaging', 'Clinical Data Management',
  'Omics Analysis', 'AI-Ready Data', 'Patient Recruitment',
]

const ALL_RESEARCH_ASSETS = [
  'Plasma', 'Serum', 'Whole Blood', 'PBMC', 'FFPE Tissue', 'Frozen Tissue',
  'Digital Slides', 'Whole Slide Images', 'Clinical Dataset', 'Longitudinal Dataset',
  'Imaging Dataset', 'Pathology Dataset', 'Omics-ready Dataset', 'AI-ready Dataset',
]

const READINESS_OPTIONS = [
  'Presentation Ready', 'Needs Additional Evidence', 'Needs Human Review', 'Not Enough Evidence Yet',
]

const SAMPLE_RESULTS: SponsorSearchResult[] = [
  {
    institution_id: 'inst-001',
    institution_name: 'Vilo Research Center',
    location: 'Houston, TX',
    executive_profile_summary: 'Demonstrates 5 evidence-supported institutional capabilities enabling 8 research asset types.',
    matched_capabilities: ['Plasma Collection', 'PBMC Processing', 'Phase I Experience'],
    matched_research_assets: ['Plasma', 'PBMC', 'Longitudinal Dataset'],
    sponsor_readiness: {
      label: 'Needs Additional Evidence',
      summary: 'One blocking gap remains. Strong plasma and PBMC processing.',
      strengths: ['Strong biospecimen processing', 'Phase I study experience'],
      concerns: ['FFPE documentation missing'],
    },
    recommendations: [
      { priority: 'critical', title: 'Upload FFPE SOP', action: 'Upload SOP documentation' },
      { priority: 'high', title: 'Complete metadata for plasma storage', action: 'Complete missing metadata' },
    ],
    last_updated: '2026-07-02',
  },
  {
    institution_id: 'inst-002',
    institution_name: 'Coastal Clinical Research',
    location: 'San Diego, CA',
    executive_profile_summary: 'Demonstrates 8 evidence-supported capabilities across clinical operations and digital pathology.',
    matched_capabilities: ['FFPE Tissue Processing', 'Digital Pathology', 'Whole Slide Imaging'],
    matched_research_assets: ['FFPE Tissue', 'Digital Slides', 'Whole Slide Images', 'Pathology Dataset'],
    sponsor_readiness: {
      label: 'Presentation Ready',
      summary: 'Well-supported evidence profile. No blocking gaps.',
      strengths: ['Established digital pathology', 'Strong FFPE processing', 'Multiple supported capabilities'],
      concerns: [],
    },
    recommendations: [],
    last_updated: '2026-06-28',
  },
  {
    institution_id: 'inst-003',
    institution_name: 'Midwest Biospecimen Bank',
    location: 'Chicago, IL',
    executive_profile_summary: 'Large biospecimen repository with longitudinal datasets and clinical data management.',
    matched_capabilities: ['Plasma Collection', 'Serum Extraction', 'Longitudinal Follow-up', 'Clinical Data Management'],
    matched_research_assets: ['Plasma', 'Serum', 'Whole Blood', 'Clinical Dataset', 'Longitudinal Dataset'],
    sponsor_readiness: {
      label: 'Presentation Ready',
      summary: 'Strong multi-asset portfolio. Established operations.',
      strengths: ['Research asset portfolio', 'Longitudinal data', 'Clinical data management'],
      concerns: [],
    },
    recommendations: [],
    last_updated: '2026-07-01',
  },
]

// --------------------------------------------------------------------------
// Main page
// --------------------------------------------------------------------------

export function SponsorCapabilitySearch() {
  const [capabilityFilter, setCapabilityFilter] = useState('')
  const [assetFilter, setAssetFilter] = useState('')
  const [readinessFilter, setReadinessFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  // In a real implementation, this would query the backend aggregation endpoint.
  // For Sprint 22C, we define the UI contract with sample data.
  const results = searchPerformed
    ? filterResults(SAMPLE_RESULTS, { capabilities: parseTokens(capabilityFilter), research_assets: parseTokens(assetFilter), readiness_label: readinessFilter || undefined })
    : []

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx)', margin: '0 0 4px' }}>Sponsor Capability Search</h1>
        <p style={{ fontSize: 14, color: 'var(--txd)', margin: 0 }}>
          Find institutions that can support your research requirements.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ ...cardStyle, padding: '20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SearchField
            label="Capabilities"
            placeholder="e.g. PBMC, Phase I, Digital Pathology"
            value={capabilityFilter}
            onChange={setCapabilityFilter}
            suggestions={ALL_CAPABILITIES}
          />
          <SearchField
            label="Research Assets"
            placeholder="e.g. Plasma, Whole Slide Images"
            value={assetFilter}
            onChange={setAssetFilter}
            suggestions={ALL_RESEARCH_ASSETS}
          />
          <button
            type="button"
            onClick={() => setSearchPerformed(true)}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: 'var(--blue, #3b82f6)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              alignSelf: 'flex-end',
            }}
          >
            Search
          </button>
        </div>

        {/* Filters toggle */}
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: 'none', border: 'none', color: 'var(--txd)',
              fontSize: 12, cursor: 'pointer', padding: 0,
            }}
          >
            {showFilters ? '− Hide filters' : '+ More filters'}
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">Any readiness</option>
              {READINESS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results */}
      {searchPerformed && results.length === 0 ? (
        <EmptySearch />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {searchPerformed && (
            <div style={{ fontSize: 13, color: 'var(--txd)' }}>
              {results.length} institution{results.length !== 1 ? 's' : ''} found
            </div>
          )}
          {results.map((result) => (
            <ResultCard key={result.institution_id} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// Search field with suggestions
// --------------------------------------------------------------------------

function SearchField({
  label, placeholder, value, onChange, suggestions,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  suggestions: string[]
}) {
  const [focused, setFocused] = useState(false)
  const filtered = value
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : []

  return (
    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--txdd)', display: 'block', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 6,
          border: '1px solid rgba(148,163,184,.35)', background: 'var(--bg)',
          color: 'var(--tx)', fontSize: 13, boxSizing: 'border-box',
        }}
      />
      {focused && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg)', border: '1px solid rgba(148,163,184,.25)',
          borderRadius: 6, marginTop: 4, zIndex: 10, maxHeight: 160, overflowY: 'auto',
        }}>
          {filtered.map((s) => (
            <div
              key={s}
              onMouseDown={() => { onChange(s); setFocused(false) }}
              style={{
                padding: '6px 12px', fontSize: 12, color: 'var(--tx)',
                cursor: 'pointer', borderBottom: '1px solid var(--border)',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------------------------------
// Result card
// --------------------------------------------------------------------------

function ResultCard({ result }: { result: SponsorSearchResult }) {
  return (
    <div style={{ ...cardStyle, padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)', margin: '0 0 2px' }}>
            {result.institution_name}
          </h3>
          {result.location && (
            <span style={{ fontSize: 12, color: 'var(--txdd)' }}>{result.location}</span>
          )}
        </div>
        {result.sponsor_readiness && (
          <Badge
            label={result.sponsor_readiness.label}
            tone={
              result.sponsor_readiness.label === 'Presentation Ready' ? 'green'
              : result.sponsor_readiness.label === 'Not Enough Evidence Yet' ? 'default'
              : 'amber'
            }
          />
        )}
      </div>

      {/* Summary */}
      <p style={{ fontSize: 13, color: 'var(--txd)', lineHeight: 1.5, margin: '0 0 12px' }}>
        {result.executive_profile_summary}
      </p>

      {/* Matched capabilities */}
      {result.matched_capabilities.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txdd)' }}>Matched capabilities: </span>
          {result.matched_capabilities.map((c, i) => (
            <span key={c} style={{ fontSize: 12, color: 'var(--tx)' }}>
              {c}{i < result.matched_capabilities.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Matched research assets */}
      {result.matched_research_assets.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txdd)' }}>Research assets: </span>
          {result.matched_research_assets.map((a, i) => (
            <span key={a} style={{ fontSize: 12, color: 'var(--tx)' }}>
              {a}{i < result.matched_research_assets.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* Strengths */}
      {result.sponsor_readiness?.strengths && result.sponsor_readiness.strengths.length > 0 && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(34,197,94,.06)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green, #22c55e)' }}>Strengths: </span>
          <span style={{ fontSize: 12, color: 'var(--txd)' }}>
            {result.sponsor_readiness.strengths.join(' · ')}
          </span>
        </div>
      )}

      {/* Concerns */}
      {result.sponsor_readiness?.concerns && result.sponsor_readiness.concerns.length > 0 && (
        <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: 'rgba(245,158,11,.06)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber, #f59e0b)' }}>Areas for improvement: </span>
          <span style={{ fontSize: 12, color: 'var(--txd)' }}>
            {result.sponsor_readiness.concerns.join(' · ')}
          </span>
        </div>
      )}

      {/* Top recommendations */}
      {result.recommendations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {result.recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--txdd)', marginTop: 4 }}>
              <Badge label={rec.priority} tone={rec.priority === 'critical' ? 'red' : 'amber'} />
              <span style={{ marginLeft: 6 }}>{rec.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <QuickAction label="Open Executive Profile" />
        <QuickAction label="Generate Report" />
        <QuickAction label="View Timeline" />
      </div>

      {/* Last updated */}
      {result.last_updated && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--txdd)' }}>
          Updated: {result.last_updated}
        </div>
      )}
    </div>
  )
}

function QuickAction({ label }: { label: string }) {
  return (
    <button
      type="button"
      style={{
        padding: '6px 12px', borderRadius: 6,
        border: '1px solid rgba(148,163,184,.25)', background: 'transparent',
        color: 'var(--txd)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

// --------------------------------------------------------------------------
// Empty state
// --------------------------------------------------------------------------

function EmptySearch() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tx)', margin: '0 0 8px' }}>
        No institutions match these requirements
      </h2>
      <p style={{ fontSize: 14, color: 'var(--txdd)', maxWidth: 400, margin: '0 auto' }}>
        Try adjusting your search criteria. Different combinations of capabilities and research assets may yield results.
      </p>
    </div>
  )
}

// --------------------------------------------------------------------------
// Search logic (thin orchestration only — no business rules)
// --------------------------------------------------------------------------

function parseTokens(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function filterResults(
  results: SponsorSearchResult[],
  filters: SponsorSearchFilters,
): SponsorSearchResult[] {
  let filtered = [...results]

  if (filters.capabilities && filters.capabilities.length > 0) {
    filtered = filtered.filter((r) =>
      filters.capabilities!.some((cap) =>
        r.matched_capabilities.some((mc) => mc.toLowerCase().includes(cap.toLowerCase())),
      ),
    )
  }

  if (filters.research_assets && filters.research_assets.length > 0) {
    filtered = filtered.filter((r) =>
      filters.research_assets!.some((asset) =>
        r.matched_research_assets.some((ma) => ma.toLowerCase().includes(asset.toLowerCase())),
      ),
    )
  }

  if (filters.readiness_label) {
    filtered = filtered.filter((r) =>
      r.sponsor_readiness?.label === filters.readiness_label,
    )
  }

  // Deterministic ordering: Presentation Ready → Needs Add. Evidence → Needs Human Review → Not Enough
  const readinessOrder: Record<string, number> = {
    'Presentation Ready': 0,
    'Needs Additional Evidence': 1,
    'Needs Human Review': 2,
    'Not Enough Evidence Yet': 3,
  }

  filtered.sort((a, b) => {
    const ra = readinessOrder[a.sponsor_readiness?.label ?? ''] ?? 4
    const rb = readinessOrder[b.sponsor_readiness?.label ?? ''] ?? 4
    return ra - rb
  })

  return filtered
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid rgba(148,163,184,.35)', background: 'var(--bg)',
  color: 'var(--tx)', fontSize: 13, minWidth: 180,
}
