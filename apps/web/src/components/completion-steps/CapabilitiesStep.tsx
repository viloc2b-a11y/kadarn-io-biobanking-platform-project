'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'
import type {
  CapabilityInstance,
} from '@kadarn/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse {
  data: CapabilityInstance[]
}

// ── Constants ───────────────────────────────────────────────────────────────

const LIFECYCLE_BADGE: Record<string, { label: string; className: string }> = {
  declared: { label: 'Declared', className: 'bg-gray-100 text-gray-700' },
  evidence_submitted: { label: 'Evidence Submitted', className: 'bg-blue-100 text-blue-700' },
  evidence_reviewed: { label: 'Evidence Reviewed', className: 'bg-indigo-100 text-indigo-700' },
  under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-700' },
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700' },
  published: { label: 'Published', className: 'bg-purple-100 text-purple-700' },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-700' },
  deprecated: { label: 'Deprecated', className: 'bg-gray-200 text-gray-500' },
}

const SUFFICIENCY_BADGE: Record<string, { label: string; className: string }> = {
  sufficient: { label: 'Sufficient', className: 'bg-emerald-100 text-emerald-700' },
  insufficient: { label: 'Insufficient', className: 'bg-red-100 text-red-700' },
  conflicting: { label: 'Conflicting', className: 'bg-amber-100 text-amber-700' },
  expired: { label: 'Expired', className: 'bg-orange-100 text-orange-700' },
  superseded: { label: 'Superseded', className: 'bg-purple-100 text-purple-700' },
  manual_review_required: { label: 'Manual Review', className: 'bg-sky-100 text-sky-700' },
}

const AREA_BADGE: Record<string, { label: string; className: string }> = {
  clinical_operations: { label: 'Clinical Ops', className: 'bg-teal-100 text-teal-700' },
  quality_management: { label: 'Quality Mgmt', className: 'bg-cyan-100 text-cyan-700' },
  regulatory_compliance: { label: 'Regulatory', className: 'bg-violet-100 text-violet-700' },
  workforce: { label: 'Workforce', className: 'bg-pink-100 text-pink-700' },
  infrastructure: { label: 'Infrastructure', className: 'bg-orange-100 text-orange-700' },
  data_management: { label: 'Data Mgmt', className: 'bg-slate-100 text-slate-700' },
  patient_experience: { label: 'Patient Exp', className: 'bg-green-100 text-green-700' },
  financial_operations: { label: 'Financial', className: 'bg-yellow-100 text-yellow-700' },
  research: { label: 'Research', className: 'bg-indigo-100 text-indigo-700' },
  other: { label: 'Other', className: 'bg-gray-100 text-gray-600' },
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CapabilitiesStep() {
  const { membership } = useSession()
  const [capabilities, setCapabilities] = useState<CapabilityInstance[]>([])
  const [loading, setLoading] = useState(true)
  const noInstitution = !membership?.org_id
  const [error, setError] = useState(noInstitution ? 'No active institution selected.' : '')
  const [filter, setFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')

  const institutionId = membership?.org_id ?? ''

  useEffect(() => {
    if (noInstitution) return

    let cancelled = false
    setLoading(true)
    setError('')

    apiGet<ApiResponse>(`/api/v1/institutions/${institutionId}/capabilities`)
      .then((res) => {
        if (cancelled) return
        setCapabilities(res.data ?? [])
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

  // ── Computed ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return capabilities.filter((c) => {
      if (filter !== 'all' && c.lifecycle_state !== filter) return false
      if (areaFilter !== 'all' && c.area !== areaFilter) return false
      return true
    })
  }, [capabilities, filter, areaFilter])

  const areas = useMemo(() => {
    const set = new Set(capabilities.map((c) => c.area).filter(Boolean) as string[])
    return Array.from(set)
  }, [capabilities])

  const lifecycleStates = useMemo(() => {
    const set = new Set(capabilities.map((c) => c.lifecycle_state))
    return Array.from(set)
  }, [capabilities])

  const verifiedCount = capabilities.filter((c) => c.lifecycle_state === 'verified' || c.lifecycle_state === 'published').length
  const pendingCount = capabilities.filter((c) => c.lifecycle_state === 'under_review' || c.lifecycle_state === 'evidence_submitted').length

  // ── Render states ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to load capabilities</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Capabilities</h2>
        <p className="text-sm text-gray-500 mt-1">
          Declared institutional capabilities with activation state, readiness, and evidence sufficiency.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatPill label="Total" value={capabilities.length} color="purple" />
        <StatPill label="Verified" value={verifiedCount} color="emerald" />
        <StatPill label="In Progress" value={pendingCount} color="amber" />
        <StatPill label="Areas" value={areas.length} color="indigo" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All States</option>
          {lifecycleStates.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Capabilities grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No capabilities match the current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((cap) => (
            <CapabilityCard key={cap.id} capability={cap} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colors[color] ?? colors.purple}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}

function CapabilityCard({ capability }: { capability: CapabilityInstance }) {
  const lifecycle = LIFECYCLE_BADGE[capability.lifecycle_state] ?? LIFECYCLE_BADGE.declared
  const sufficiency = capability.evidence_sufficiency
    ? SUFFICIENCY_BADGE[capability.evidence_sufficiency]
    : null
  const area = capability.area ? AREA_BADGE[capability.area] : null
  const readiness = capability.readiness_contribution
  const confidence = capability.confidence_score

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{capability.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${lifecycle.className}`}>
          {lifecycle.label}
        </span>
      </div>

      {capability.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{capability.description}</p>
      )}

      {/* Badge row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {area && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${area.className}`}>
            {area.label}
          </span>
        )}
        {sufficiency && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${sufficiency.className}`}>
            {sufficiency.label}
          </span>
        )}
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span title="Claim count">{capability.claim_count} claims</span>
        <span title="Dependencies">{capability.dependency_count} deps</span>
        {capability.dependency_status && (
          <span className="capitalize">deps: {capability.dependency_status}</span>
        )}
        {capability.last_activated_at && (
          <span>Active: {new Date(capability.last_activated_at).toLocaleDateString()}</span>
        )}
      </div>

      {/* Readiness indicator */}
      {readiness != null && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase">Readiness:</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                readiness >= 0.7 ? 'bg-emerald-500' : readiness >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.round(readiness * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-gray-500">{Math.round(readiness * 100)}%</span>
        </div>
      )}

      {/* Confidence indicator */}
      {confidence != null && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase">Confidence:</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                confidence >= 0.7 ? 'bg-purple-500' : confidence >= 0.4 ? 'bg-purple-400' : 'bg-purple-300'
              }`}
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-gray-500">{Math.round(confidence * 100)}%</span>
        </div>
      )}
    </div>
  )
}
