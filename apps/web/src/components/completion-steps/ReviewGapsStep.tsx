'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'

// ── Types ───────────────────────────────────────────────────────────────────

interface GapEntry {
  id: string
  assessment_result_id: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  gap_type: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'mitigated' | 'closed' | 'accepted'
  mitigation: string | null
  created_at: string
  updated_at: string
}

interface ApiGapResponse {
  data: GapEntry[]
}

// ── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-300' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  mitigated: { label: 'Mitigated', className: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Closed', className: 'bg-emerald-100 text-emerald-700' },
  accepted: { label: 'Accepted', className: 'bg-gray-100 text-gray-600' },
}

const GAP_TYPE_LABELS: Record<string, string> = {
  missing_data: 'Missing Data',
  unsupported_claim: 'Unsupported Claim',
  expired_evidence: 'Expired Evidence',
  contradiction: 'Contradiction',
  inactive_dependency: 'Inactive Dependency',
  credential_gap: 'Credential Gap',
  regulatory_gap: 'Regulatory Gap',
  evidence_gap: 'Evidence Gap',
  capability_gap: 'Capability Gap',
  readiness_gap: 'Readiness Gap',
}

interface RecommendedAction {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string
  sourceId: string
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ReviewGapsStep() {
  const { membership } = useSession()
  const [gaps, setGaps] = useState<GapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const institutionId = membership?.org_id ?? ''

  useEffect(() => {
    if (!institutionId) {
      setLoading(false)
      setError('No active institution selected.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    apiGet<ApiGapResponse>(`/api/v1/institutions/${institutionId}/gaps`)
      .then((res) => {
        if (cancelled) return
        setGaps(res.data ?? [])
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
    return gaps.filter((g) => {
      if (severityFilter !== 'all' && g.severity !== severityFilter) return false
      if (statusFilter !== 'all' && g.status !== statusFilter) return false
      return true
    })
  }, [gaps, severityFilter, statusFilter])

  const openCount = gaps.filter((g) => g.status === 'open' || g.status === 'in_progress').length
  const criticalCount = gaps.filter((g) => g.severity === 'critical' && g.status !== 'closed').length
  const closedCount = gaps.filter((g) => g.status === 'closed').length

  // Derived recommended actions from gaps
  const recommendedActions = useMemo<RecommendedAction[]>(() => {
    return gaps
      .filter((g) => g.status !== 'closed')
      .map((g) => ({
        id: `action-${g.id}`,
        title: `Resolve: ${g.title || g.gap_type.replace(/_/g, ' ')}`,
        description: g.description || g.mitigation || `Address ${g.gap_type} gap at ${g.severity} severity.`,
        priority: g.severity,
        source: 'gap',
        sourceId: g.id,
      }))
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
      })
  }, [gaps])

  // ── Render states ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to load gaps</p>
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
        <h2 className="text-xl font-bold text-gray-900">Review Gaps</h2>
        <p className="text-sm text-gray-500 mt-1">
          Missing data, unsupported claims, expired evidence, contradictions, inactive dependencies, and recommended actions.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatPill label="Total Gaps" value={gaps.length} color="purple" />
        <StatPill label="Open" value={openCount} color="red" />
        <StatPill label="Critical" value={criticalCount} color="orange" />
        <StatPill label="Resolved" value={closedCount} color="emerald" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="mitigated">Mitigated</option>
          <option value="closed">Closed</option>
          <option value="accepted">Accepted</option>
        </select>
      </div>

      {/* Gaps list */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No gaps match the current filters. {gaps.length > 0 ? 'Try adjusting filters.' : 'No gaps have been identified.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((gap) => (
            <GapCard key={gap.id} gap={gap} />
          ))}
        </div>
      )}

      {/* Recommended actions */}
      {recommendedActions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🔧</span> Recommended Actions
            <span className="text-sm font-normal text-gray-400">({recommendedActions.length})</span>
          </h3>
          <div className="space-y-2">
            {recommendedActions.map((action) => (
              <RecommendedActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colors[color] ?? colors.purple}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}

function GapCard({ gap }: { gap: GapEntry }) {
  const severity = SEVERITY_BADGE[gap.severity] ?? SEVERITY_BADGE.low
  const status = STATUS_BADGE[gap.status] ?? STATUS_BADGE.open
  const typeLabel = GAP_TYPE_LABELS[gap.gap_type] ?? gap.gap_type?.replace(/_/g, ' ') ?? 'Unknown'

  return (
    <div className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
      gap.severity === 'critical' ? 'border-red-300 bg-red-50/30' :
      gap.severity === 'high' ? 'border-orange-200' : 'border-gray-200'
    }`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">
          {gap.title || `Untitled ${typeLabel.toLowerCase()} gap`}
        </h3>
        <div className="flex gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${severity.className}`}>
            {severity.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Description */}
      {(gap.description || gap.mitigation) && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-3">
          {gap.description || gap.mitigation}
        </p>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
        <span className="font-medium uppercase">{typeLabel}</span>
        {gap.gap_type && <span>Type: {gap.gap_type.replace(/_/g, ' ')}</span>}
        {gap.created_at && (
          <span>Identified: {new Date(gap.created_at).toLocaleDateString()}</span>
        )}
        {gap.mitigation && gap.description && (
          <span className="text-amber-600">Mitigation available</span>
        )}
      </div>
    </div>
  )
}

function RecommendedActionCard({ action }: { action: RecommendedAction }) {
  const priorityColors: Record<string, string> = {
    critical: 'border-red-300 bg-red-50/30',
    high: 'border-orange-200 bg-orange-50/30',
    medium: 'border-amber-200 bg-amber-50/30',
    low: 'border-gray-200 bg-gray-50/30',
  }

  const priorityBadge: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className={`border rounded-xl p-3 flex items-start gap-3 ${priorityColors[action.priority] ?? priorityColors.medium}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">
        {action.priority === 'critical' ? '🔴' : action.priority === 'high' ? '🟠' : action.priority === 'medium' ? '🟡' : '⚪'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${priorityBadge[action.priority]}`}>
            {action.priority}
          </span>
        </div>
        <p className="text-xs text-gray-500">{action.description}</p>
      </div>
    </div>
  )
}
