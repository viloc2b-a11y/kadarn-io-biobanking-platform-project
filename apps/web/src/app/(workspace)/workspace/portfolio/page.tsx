'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'
import type { InstitutionCapability } from '@kadarn/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface ApiCapability extends InstitutionCapability {
  primary_claim?: { id: string; name: string; claim_type_id: string } | null
  capability_type?: { id: string; name: string } | null
}

interface ReadinessResponse {
  id: string
  organization_id: string
  overall_score: number
  level: string
  dimensions: Array<{ name: string; score: number; weight: number; reason: string }>
  profile_completeness: number | null
  evidence_coverage: number | null
  credential_validity: number | null
  operational_metrics: number | null
  recruitment_capability: number | null
  passport_completeness: number | null
  computed_at: string
  cached?: boolean
}

// ── Constants ───────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  declared: 'bg-gray-100 text-gray-700',
  evidence_submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  published: 'bg-indigo-100 text-indigo-700',
  deprecated: 'bg-gray-200 text-gray-500',
}

const statusLabels: Record<string, string> = {
  declared: 'Declared',
  evidence_submitted: 'Evidence Submitted',
  under_review: 'Under Review',
  verified: 'Verified',
  published: 'Published',
  deprecated: 'Deprecated',
}

const sufficiencyColors: Record<string, string> = {
  sufficient: 'bg-emerald-100 text-emerald-700',
  insufficient: 'bg-red-100 text-red-700',
  conflicting: 'bg-amber-100 text-amber-700',
  expired: 'bg-orange-100 text-orange-700',
  superseded: 'bg-purple-100 text-purple-700',
  manual_review_required: 'bg-sky-100 text-sky-700',
}

const sufficiencyLabels: Record<string, string> = {
  sufficient: 'Sufficient',
  insufficient: 'Insufficient',
  conflicting: 'Conflicting',
  expired: 'Expired',
  superseded: 'Superseded',
  manual_review_required: 'Manual Review',
}

const readinessLevelColors: Record<string, string> = {
  very_high: 'bg-emerald-100 text-emerald-700',
  high: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
}

const readinessLevelLabels: Record<string, string> = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { user, membership } = useSession()
  const [capabilities, setCapabilities] = useState<ApiCapability[]>([])
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const institutionId = membership?.org_id ?? ''

  useEffect(() => {
    if (!institutionId) {
      setLoading(false)
      setError('No active institution. Select an organization to view your portfolio.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      apiGet<{ data: ApiCapability[] }>(`/api/v1/institutions/${institutionId}/capabilities`),
      apiGet<{ data: ReadinessResponse }>(`/api/v1/institutions/${institutionId}/readiness`),
    ])
      .then(([capsRes, readinessRes]) => {
        if (cancelled) return
        setCapabilities(capsRes.data ?? [])
        setReadiness(readinessRes.data ?? null)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [institutionId])

  // ── Computed ──────────────────────────────────────────────────────────

  const filtered = useMemo(
    () => (statusFilter ? capabilities.filter((c) => c.status === statusFilter) : capabilities),
    [capabilities, statusFilter],
  )

  const verifiedCount = capabilities.filter((c) => c.status === 'verified' || c.status === 'published').length
  const sufficientCount = capabilities.filter((c) => c.evidence_sufficiency === 'sufficient').length
  const avgConfidence =
    capabilities.length > 0
      ? capabilities.reduce((sum, c) => sum + (c.confidence_score ?? 0), 0) / capabilities.length
      : 0

  // ── Render states ─────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Sign in to view your institution portfolio.</p>
      </div>
    )
  }

  if (!institutionId) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-700">
          <p className="font-semibold">No active institution selected.</p>
          <p className="text-sm mt-1">Use the organization selector in the sidebar to choose an institution.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-96 bg-gray-100 rounded" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to load portfolio</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
          Institution Portfolio
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Capability Portfolio</h1>
        <p className="text-gray-600 max-w-2xl">
          Evidence-backed capabilities with their verification state, evidence sufficiency,
          and confidence scores. This portfolio is what sponsors see in discovery.
        </p>
      </div>

      {/* Readiness banner */}
      {readiness && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-blue-200 uppercase tracking-wide mb-1">Institution Readiness</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{Math.round(readiness.overall_score * 100)}%</span>
                <span className="text-blue-200">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${readinessLevelColors[readiness.level] ?? 'bg-blue-100 text-blue-700'}`}>
                    {readinessLevelLabels[readiness.level] ?? readiness.level}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              {readiness.dimensions?.slice(0, 4).map((dim) => (
                <div key={dim.name} className="text-center">
                  <div className="text-xl font-semibold">{Math.round(dim.score * 100)}</div>
                  <div className="text-blue-200 text-xs capitalize">
                    {dim.name.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {readiness.computed_at && (
            <div className="text-xs text-blue-300 mt-3">
              Computed {new Date(readiness.computed_at).toLocaleDateString()}
              {readiness.cached ? ' (cached)' : ''}
            </div>
          )}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Capabilities" value={capabilities.length} />
        <KpiCard label="Verified / Published" value={verifiedCount} color="green" />
        <KpiCard label="Sufficient Evidence" value={sufficientCount} color="emerald" />
        <KpiCard label="Avg Confidence" value={`${Math.round(avgConfidence * 100)}%`} color="blue" />
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 mr-2">Filter:</span>
        {['', 'declared', 'evidence_submitted', 'under_review', 'verified', 'published', 'deprecated'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? statusLabels[s] ?? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      {/* Capability cards */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center text-gray-500">
          {capabilities.length === 0
            ? 'No capabilities yet. Capabilities are derived from claims and evidence submitted during onboarding.'
            : 'No capabilities match the selected filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cap) => (
            <div
              key={cap.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{cap.name}</h3>
                  {cap.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cap.description}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {/* Evidence sufficiency badge */}
                  {cap.evidence_sufficiency && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sufficiencyColors[cap.evidence_sufficiency] ?? 'bg-gray-100 text-gray-600'}`}>
                      {sufficiencyLabels[cap.evidence_sufficiency] ?? cap.evidence_sufficiency.replace(/_/g, ' ')}
                    </span>
                  )}
                  {/* Status badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[cap.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[cap.status] ?? cap.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                {cap.domain && <span>Domain: <strong className="text-gray-600">{cap.domain}</strong></span>}
                <span>Claims: <strong className="text-gray-600">{cap.claim_count}</strong></span>
                {cap.confidence_score != null && (
                  <span>
                    Confidence:{' '}
                    <strong className={`${cap.confidence_score >= 0.7 ? 'text-green-600' : cap.confidence_score >= 0.4 ? 'text-amber-600' : 'text-red-600'}`}>
                      {Math.round(cap.confidence_score * 100)}%
                    </strong>
                  </span>
                )}
                {cap.first_declared_at && (
                  <span>Declared: <strong className="text-gray-600">{new Date(cap.first_declared_at).toLocaleDateString()}</strong></span>
                )}
                {cap.last_verified_at && (
                  <span>Last verified: <strong className="text-gray-600">{new Date(cap.last_verified_at).toLocaleDateString()}</strong></span>
                )}
              </div>

              {/* Confidence bar */}
              {cap.confidence_score != null && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cap.confidence_score >= 0.7 ? 'bg-green-500' : cap.confidence_score >= 0.4 ? 'bg-amber-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.round(cap.confidence_score * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="mt-4 text-xs text-gray-400">
        Showing {filtered.length} of {capabilities.length} capabilities
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color = 'gray',
}: {
  label: string
  value: string | number
  color?: 'green' | 'emerald' | 'blue' | 'gray'
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? colorMap.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-75">{label}</div>
    </div>
  )
}
