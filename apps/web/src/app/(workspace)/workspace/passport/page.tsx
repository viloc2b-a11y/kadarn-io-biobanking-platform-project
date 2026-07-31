'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'

// ── Types ───────────────────────────────────────────────────────────────────

interface PassportEntry {
  id: string
  organization_id: string
  title: string
  section: string
  content: Record<string, unknown> | null
  status: string
  claim_id: string | null
  claim?: { id: string; name: string; claim_type_id: string } | null
  shares?: Array<{ id: string; shared_with: string; status: string }>
  created_at: string
  updated_at: string
}

interface ReadinessData {
  id: string
  organization_id: string
  overall_score: number
  level: string
  dimensions: Array<{ name: string; score: number; weight: number; reason: string }>
  computed_at: string
  cached?: boolean
}

interface GapEntry {
  id: string
  assessment_result_id: string
  severity: string
  gap_type: string
  title: string
  description: string
  status: string
  mitigation: string | null
  created_at: string
  updated_at: string
  assessment_result?: { id: string; assessment_id: string } | null
  assessment?: { id: string } | null
}

interface ApiCapability {
  id: string
  name: string
  description: string | null
  domain: string | null
  organization_id: string
  status: string
  evidence_sufficiency: string | null
  claim_count: number
  confidence_score: number | null
  first_declared_at: string
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const statusBadge: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-gray-200 text-gray-500',
}

const sufficiencyBadge: Record<string, string> = {
  sufficient: 'bg-emerald-100 text-emerald-700',
  insufficient: 'bg-red-100 text-red-700',
  conflicting: 'bg-amber-100 text-amber-700',
  expired: 'bg-orange-100 text-orange-700',
  superseded: 'bg-purple-100 text-purple-700',
  manual_review_required: 'bg-sky-100 text-sky-700',
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PassportPage() {
  const { user, membership } = useSession()
  const [entries, setEntries] = useState<PassportEntry[]>([])
  const [readiness, setReadiness] = useState<ReadinessData | null>(null)
  const [gaps, setGaps] = useState<GapEntry[]>([])
  const [capabilities, setCapabilities] = useState<ApiCapability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const institutionId = membership?.org_id ?? ''

  useEffect(() => {
    if (!institutionId) {
      setLoading(false)
      setError('No active institution. Select an organization to view your passport.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      apiGet<{ data: PassportEntry[] }>(`/api/v1/institutions/${institutionId}/passport-entries`),
      apiGet<{ data: ReadinessData }>(`/api/v1/institutions/${institutionId}/readiness`),
      apiGet<{ data: GapEntry[] }>(`/api/v1/institutions/${institutionId}/gaps`),
      apiGet<{ data: ApiCapability[] }>(`/api/v1/institutions/${institutionId}/capabilities`),
    ])
      .then(([entriesRes, readinessRes, gapsRes, capsRes]) => {
        if (cancelled) return
        setEntries(entriesRes.data ?? [])
        setReadiness(readinessRes.data ?? null)
        setGaps(gapsRes.data ?? [])
        setCapabilities(capsRes.data ?? [])
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

  // ── Computed sections ─────────────────────────────────────────────────

  const sections = useMemo(() => {
    return {
      overview: entries.filter((e) => e.section === 'overview' || !e.section),
      capabilities: entries.filter((e) => e.section === 'capabilities'),
      evidence: entries.filter((e) => e.section === 'evidence'),
      readiness: entries.filter((e) => e.section === 'readiness'),
    }
  }, [entries])

  const publishedEntries = entries.filter((e) => e.status === 'published')
  const draftEntries = entries.filter((e) => e.status === 'draft')

  const openGaps = gaps.filter((g) => g.status !== 'closed')
  const criticalGaps = gaps.filter((g) => g.severity === 'critical' && g.status !== 'closed')

  // ── Render states ─────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Sign in to view your institution passport.</p>
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
      <div className="max-w-5xl mx-auto py-8 px-4 animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to load passport</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Passport Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-8 text-white mb-8">
        <p className="text-sm text-indigo-200 uppercase tracking-wider mb-1">
          Institution Passport
        </p>
        <h1 className="text-3xl font-bold mb-2">Governed Institutional Passport</h1>
        <p className="text-indigo-100 max-w-2xl">
          A governed projection of this institution — who they are, what they can do,
          what evidence backs their claims, their readiness, and current gaps.
          Not a free-form profile. Every data point comes from verified API sources.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm">
            {publishedEntries.length} published entries
          </span>
          <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm">
            {draftEntries.length} drafts
          </span>
          <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm">
            {capabilities.length} capabilities
          </span>
          {readiness && (
            <span className="px-3 py-1 bg-indigo-600 rounded-full text-sm">
              Readiness: {Math.round(readiness.overall_score * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Section 1: Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
            1
          </span>
          Overview
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Current identity, operating profile, and institution metadata from the governed data layer.
        </p>

        {sections.overview.length > 0 ? (
          <div className="space-y-3">
            {sections.overview.map((entry) => (
              <PassportEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState message="No overview entries have been published yet. Complete onboarding to populate the overview." />
        )}

        {/* Quick stats grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <StatBox label="Total Passport Entries" value={entries.length} />
          <StatBox label="Published" value={publishedEntries.length} color="green" />
          <StatBox label="Draft" value={draftEntries.length} color="gray" />
        </div>
      </section>

      {/* Section 2: Capabilities */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
            2
          </span>
          Capabilities
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Derived capabilities from verified claims and evidence. Each capability shows its evidence backing.
        </p>

        {capabilities.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <div
                key={cap.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{cap.name}</h3>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {cap.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[cap.status] ?? 'bg-gray-100'}`}>
                        {cap.status}
                      </span>
                    )}
                  </div>
                </div>
                {cap.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{cap.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {cap.evidence_sufficiency && (
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${sufficiencyBadge[cap.evidence_sufficiency] ?? 'bg-gray-100'}`}>
                      {cap.evidence_sufficiency.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span>{cap.claim_count} claims</span>
                  {cap.confidence_score != null && (
                    <span>
                      Confidence: <strong>{Math.round(cap.confidence_score * 100)}%</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No capabilities recorded yet." />
        )}

        {/* Passport capability entries */}
        {sections.capabilities.length > 0 && (
          <div className="mt-4 space-y-3">
            {sections.capabilities.map((entry) => (
              <PassportEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Evidence Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
            3
          </span>
          Evidence Summary
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Evidence entries linked to claims and capabilities. Each entry contributes to capability confidence scores.
        </p>

        {sections.evidence.length > 0 ? (
          <div className="space-y-3">
            {sections.evidence.map((entry) => (
              <PassportEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <EmptyState message="No evidence entries have been linked yet. Upload documents during onboarding to populate evidence." />
        )}
      </section>

      {/* Section 4: Readiness */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
            4
          </span>
          Readiness
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Computed institutional readiness score across dimensions. Determines eligibility for programs.
        </p>

        {readiness ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-sm text-amber-700 uppercase tracking-wide mb-1">Overall Readiness Score</div>
                  <div className="text-5xl font-bold text-gray-900">{Math.round(readiness.overall_score * 100)}<span className="text-xl text-gray-400">/100</span></div>
                  <div className="text-sm text-amber-600 mt-1 capitalize">{readiness.level.replace(/_/g, ' ')}</div>
                </div>
                {readiness.computed_at && (
                  <div className="text-xs text-gray-400">
                    Computed {new Date(readiness.computed_at).toLocaleDateString()}
                    {readiness.cached ? ' (cached)' : ''}
                  </div>
                )}
              </div>

              {/* Dimension bars */}
              {readiness.dimensions?.map((dim) => (
                <div key={dim.name} className="flex items-center gap-3 mb-2">
                  <span className="w-36 text-xs text-gray-600 flex-shrink-0 capitalize">
                    {dim.name.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        dim.score >= 0.7 ? 'bg-green-500' : dim.score >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(dim.score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-10 text-right">
                    {Math.round(dim.score * 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="Readiness data not yet available. Complete institution setup to compute readiness." />
        )}

        {/* Readiness passport entries */}
        {sections.readiness.length > 0 && (
          <div className="mt-4 space-y-3">
            {sections.readiness.map((entry) => (
              <PassportEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Gaps */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold">
            5
          </span>
          Gaps
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Identified gaps between current state and program requirements. Open gaps block readiness improvements.
        </p>

        {gaps.length > 0 ? (
          <div>
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <GapStatBox label="Open Gaps" value={openGaps.length} color="red" />
              <GapStatBox label="Critical" value={criticalGaps.length} color="orange" />
              <GapStatBox label="Total" value={gaps.length} color="gray" />
            </div>

            <div className="space-y-3">
              {gaps.map((gap) => (
                <div
                  key={gap.id}
                  className={`rounded-xl border p-4 ${severityColors[gap.severity] ?? severityColors.low}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h4 className="font-semibold text-sm">{gap.title || 'Untitled gap'}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      gap.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {gap.status}
                    </span>
                  </div>
                  {gap.description && (
                    <p className="text-xs opacity-80 mb-2">{gap.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="font-bold capitalize">{gap.severity}</span>
                    <span>{gap.gap_type?.replace(/_/g, ' ')}</span>
                    {gap.mitigation && <span>Mitigation: {gap.mitigation}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="No gaps identified. This institution meets all current program requirements, or no assessments have been run yet." />
        )}
      </section>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400">
        <p>
          Institution Passport — Governed projection. Data sourced from verified API endpoints.
          Last updated: {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PassportEntryCard({ entry }: { entry: PassportEntry }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h4 className="font-semibold text-gray-900 text-sm">{entry.title}</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[entry.status] ?? 'bg-gray-100'}`}>
          {entry.status}
        </span>
      </div>
      {entry.content && (
        <pre className="text-xs text-gray-500 mt-2 max-h-32 overflow-auto whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
          {JSON.stringify(entry.content, null, 2)}
        </pre>
      )}
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
        <span>Section: {entry.section || 'overview'}</span>
        {entry.claim && <span>Claim: {entry.claim.name}</span>}
        {entry.shares && entry.shares.length > 0 && (
          <span>{entry.shares.length} share(s)</span>
        )}
        <span>Created: {new Date(entry.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
      {message}
    </div>
  )
}

function StatBox({
  label,
  value,
  color = 'gray',
}: {
  label: string
  value: string | number
  color?: 'green' | 'gray'
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200',
  }

  return (
    <div className={`rounded-xl border p-4 text-center ${colorMap[color] ?? colorMap.gray}`}>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function GapStatBox({
  label,
  value,
  color = 'gray',
}: {
  label: string
  value: string | number
  color?: 'red' | 'orange' | 'gray'
}) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  }

  return (
    <div className={`rounded-xl border p-4 text-center ${colorMap[color] ?? colorMap.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-75">{label}</div>
    </div>
  )
}
