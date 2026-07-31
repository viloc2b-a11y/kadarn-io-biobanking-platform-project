'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'
import type {
  ClaimExtended,
} from '@kadarn/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface ApiResponse {
  data: ClaimExtended[]
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Extended claim support states per the task spec */
const SUPPORT_STATE_BADGE: Record<string, { label: string; className: string; icon: string }> = {
  DECLARED_UNSUPPORTED: { label: 'Unsupported', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: '📝' },
  EVIDENCE_ASSOCIATED: { label: 'Evidence Associated', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📎' },
  SUPPORTED: { label: 'Supported', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
  CONTRADICTED: { label: 'Contradicted', className: 'bg-red-100 text-red-700 border-red-200', icon: '⚠️' },
}

const CLAIM_STATE_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  declared: { label: 'Declared', className: 'bg-amber-100 text-amber-700' },
  pending_evidence: { label: 'Pending Evidence', className: 'bg-blue-100 text-blue-700' },
  evidence_gathered: { label: 'Evidence Gathered', className: 'bg-indigo-100 text-indigo-700' },
  under_review: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700' },
  review_escalated: { label: 'Escalated', className: 'bg-orange-100 text-orange-700' },
  disputed: { label: 'Disputed', className: 'bg-red-100 text-red-700' },
  resolved: { label: 'Resolved', className: 'bg-teal-100 text-teal-700' },
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  published: { label: 'Published', className: 'bg-purple-100 text-purple-700' },
  rejected: { label: 'Rejected', className: 'bg-red-200 text-red-800' },
  superseded: { label: 'Superseded', className: 'bg-gray-200 text-gray-600' },
  archived: { label: 'Archived', className: 'bg-gray-300 text-gray-500' },
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  medium: { label: 'Medium', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  high: { label: 'High', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
}

const VISIBILITY_BADGE: Record<string, { label: string; className: string }> = {
  internal: { label: 'Internal', className: 'bg-slate-100 text-slate-600' },
  restricted: { label: 'Restricted', className: 'bg-purple-100 text-purple-700' },
  public: { label: 'Public', className: 'bg-emerald-100 text-emerald-700' },
  registry: { label: 'Registry', className: 'bg-sky-100 text-sky-700' },
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function deriveSupportState(claim: ClaimExtended): string {
  if (claim.claim_state === 'disputed') return 'CONTRADICTED'
  if (claim.claim_state === 'verified' || claim.claim_state === 'approved' || claim.claim_state === 'published') {
    return claim.evidence_count > 0 ? 'SUPPORTED' : 'EVIDENCE_ASSOCIATED'
  }
  if (claim.claim_state === 'evidence_gathered' || claim.claim_state === 'pending_evidence') return 'EVIDENCE_ASSOCIATED'
  return 'DECLARED_UNSUPPORTED'
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ClaimsStep() {
  const { membership } = useSession()
  const [claims, setClaims] = useState<ClaimExtended[]>([])
  const [loading, setLoading] = useState(true)
  const noInstitution = !membership?.org_id
  const [error, setError] = useState(noInstitution ? 'No active institution selected.' : '')
  const [supportFilter, setSupportFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const institutionId = membership?.org_id ?? ''

  useEffect(() => {
    if (noInstitution) return

    let cancelled = false
    setLoading(true)
    setError('')

    apiGet<ApiResponse>(`/api/v1/institutions/${institutionId}/claims`)
      .then((res) => {
        if (cancelled) return
        setClaims(res.data ?? [])
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

  const claimsWithSupportState = useMemo(() => {
    return claims.map((c) => ({ ...c, _supportState: deriveSupportState(c) }))
  }, [claims])

  const filtered = useMemo(() => {
    return claimsWithSupportState.filter((c) => {
      if (supportFilter !== 'all' && c._supportState !== supportFilter) return false
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
      return true
    })
  }, [claimsWithSupportState, supportFilter, priorityFilter])

  const supportedCount = claimsWithSupportState.filter((c) => c._supportState === 'SUPPORTED').length
  const unsupportedCount = claimsWithSupportState.filter((c) => c._supportState === 'DECLARED_UNSUPPORTED').length
  const contradictedCount = claimsWithSupportState.filter((c) => c._supportState === 'CONTRADICTED').length

  // ── Render states ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to load claims</p>
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
        <h2 className="text-xl font-bold text-gray-900">Claims</h2>
        <p className="text-sm text-gray-500 mt-1">
          Declared claims with statements, scope, limitations, support status, authority, and review due dates.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Supported" value={supportedCount} color="emerald" />
        <StatPill label="Needs Evidence" value={unsupportedCount} color="gray" />
        <StatPill label="Contradicted" value={contradictedCount} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={supportFilter}
          onChange={(e) => setSupportFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Support States</option>
          {Object.entries(SUPPORT_STATE_BADGE).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Claims list */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No claims match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colors[color] ?? colors.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}

function ClaimCard({ claim }: { claim: ClaimExtended & { _supportState: string } }) {
  const support = SUPPORT_STATE_BADGE[claim._supportState] ?? SUPPORT_STATE_BADGE.DECLARED_UNSUPPORTED
  const stateBadge = CLAIM_STATE_BADGE[claim.claim_state] ?? CLAIM_STATE_BADGE.draft
  const priorityBadge = PRIORITY_BADGE[claim.priority] ?? PRIORITY_BADGE.medium
  const visibilityBadge = claim.visibility ? VISIBILITY_BADGE[claim.visibility] : null

  return (
    <div className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
      claim._supportState === 'CONTRADICTED' ? 'border-red-200' :
      claim._supportState === 'SUPPORTED' ? 'border-emerald-200' : 'border-gray-200'
    }`}>
      {/* Top row: name + support state */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{claim.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${support.className}`}>
          {support.icon} {support.label}
        </span>
      </div>

      {/* Statement */}
      {claim.statement && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-3 italic border-l-2 border-purple-200 pl-3">
          &ldquo;{claim.statement}&rdquo;
        </p>
      )}

      {/* Description fallback */}
      {!claim.statement && claim.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{claim.description}</p>
      )}

      {/* Limitations */}
      {claim.limitations && claim.limitations.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {claim.limitations.map((lim, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium">
              {lim}
            </span>
          ))}
        </div>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mb-2">
        {claim.claim_scope && <span className="uppercase">Scope: {claim.claim_scope}</span>}
        {claim.claim_category && <span>Category: {claim.claim_category}</span>}
        {claim.authority_basis && <span>Authority: {claim.authority_basis}</span>}
        {claim.claim_type && <span>Type: {claim.claim_type}</span>}
        {claim.evidence_count != null && <span>{claim.evidence_count} evidence</span>}
      </div>

      {/* Review due dates */}
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        {claim.review_due_at && (
          <span className={`px-1.5 py-0.5 rounded-full font-medium ${
            new Date(claim.review_due_at) < new Date()
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            Review due: {new Date(claim.review_due_at).toLocaleDateString()}
          </span>
        )}
        {claim.expires_at && (
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            Expires: {new Date(claim.expires_at).toLocaleDateString()}
          </span>
        )}
        {claim.valid_from && (
          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            Valid from: {new Date(claim.valid_from).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${stateBadge.className}`}>
          {stateBadge.label}
        </span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${priorityBadge.className}`}>
          {priorityBadge.label}
        </span>
        {visibilityBadge && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${visibilityBadge.className}`}>
            {visibilityBadge.label}
          </span>
        )}
        <span className="text-[10px] text-gray-400 ml-auto">v{claim.version}</span>
      </div>
    </div>
  )
}
