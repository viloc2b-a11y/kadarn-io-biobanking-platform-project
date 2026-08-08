'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'
import type {
  ClaimExtended,
  CapabilityInstance,
  SiteProfile,
} from '@kadarn/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface PassportEntry {
  id: string
  organization_id: string
  claim_id: string | null
  title: string | null
  version: number
  status: string
  publication_date: string | null
  metadata: unknown
  published_at: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

interface ApiPassportResponse {
  data: PassportEntry[]
}

interface ApiProfileResponse {
  data: SiteProfile
}

interface ApiReadinessResponse {
  data: {
    id: string
    organization_id: string
    overall_score: number
    level: string
    dimensions: Array<{ name: string; score: number; weight: number; reason: string }>
    computed_at: string
    cached?: boolean
  } | null
}

interface GapEntry {
  id: string
  severity: string
  gap_type: string
  title: string
  status: string
  description: string | null
}

interface ApiGapResponse { data: GapEntry[] }

interface ApiCapabilityResponse { data: CapabilityInstance[] }
interface ApiClaimResponse { data: ClaimExtended[] }

// ── Constants ───────────────────────────────────────────────────────────────

const SCORE_COLORS = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-red-400',
}

const LEVEL_LABELS: Record<string, string> = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PassportStep() {
  const { membership } = useSession()
  const [profile, setProfile] = useState<SiteProfile | null>(null)
  const [passportEntries, setPassportEntries] = useState<PassportEntry[]>([])
  const [capabilities, setCapabilities] = useState<CapabilityInstance[]>([])
  const [claims, setClaims] = useState<ClaimExtended[]>([])
  const [readiness, setReadiness] = useState<ApiReadinessResponse['data'] | null>(null)
  const [gaps, setGaps] = useState<GapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    Promise.all([
      apiGet<ApiPassportResponse>(`/api/v1/institutions/${institutionId}/passport-entries`).catch(() => ({ data: [] } as ApiPassportResponse)),
      apiGet<ApiReadinessResponse>(`/api/v1/institutions/${institutionId}/readiness`).catch(() => ({ data: null } as unknown as ApiReadinessResponse)),
      apiGet<ApiGapResponse>(`/api/v1/institutions/${institutionId}/gaps`).catch(() => ({ data: [] } as ApiGapResponse)),
      apiGet<ApiCapabilityResponse>(`/api/v1/institutions/${institutionId}/capabilities`).catch(() => ({ data: [] } as ApiCapabilityResponse)),
      apiGet<ApiClaimResponse>(`/api/v1/institutions/${institutionId}/claims`).catch(() => ({ data: [] } as ApiClaimResponse)),
    ])
      .then(([passportRes, readinessRes, gapsRes, capsRes, claimsRes]) => {
        if (cancelled) return
        setPassportEntries(passportRes.data ?? [])
        setReadiness(readinessRes.data ?? null)
        setGaps(gapsRes.data ?? [])
        setCapabilities(capsRes.data ?? [])
        setClaims(claimsRes.data ?? [])
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

  const evidenceBackedClaims = useMemo(() => claims.filter((c) => c.evidence_count > 0), [claims])
  const publishedEntries = useMemo(() => passportEntries.filter((e) => e.status === 'published'), [passportEntries])
  const openGaps = useMemo(() => gaps.filter((g) => g.status !== 'closed'), [gaps])
  const criticalGaps = useMemo(() => gaps.filter((g) => g.severity === 'critical' && g.status !== 'closed'), [gaps])
  const lastAttestedDate = useMemo(() => {
    const dates = passportEntries
      .map((e) => e.published_at)
      .filter(Boolean) as string[]
    if (dates.length === 0) return null
    return dates.sort().reverse()[0]
  }, [passportEntries])

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 animate-pulse space-y-6">
        <div className="h-10 w-72 bg-gray-700 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-2xl p-8">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-6 text-center text-red-300">
          <p className="font-semibold">Unable to load passport</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Passport Header / Identity */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 p-8 border-b border-purple-800/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono text-purple-300 bg-purple-800/50 px-2 py-0.5 rounded-full">
              INSTITUTION PASSPORT
            </span>
            {readiness?.dimensions && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-300">
                {readiness.dimensions.length} dimensions assessed
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {profile?.name || 'Institutional Passport'}
          </h1>
          {profile?.description && (
            <p className="text-purple-200/80 max-w-2xl text-sm">{profile.description}</p>
          )}

          {/* Identity meta */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-purple-300/70">
            <span>Version {profile?.current_version ?? '—'}</span>
            {lastAttestedDate && (
              <span>Last Attested: {new Date(lastAttestedDate).toLocaleDateString()}</span>
            )}
            {profile?.profile_type && (
              <span>Type: {profile.profile_type}</span>
            )}
            {profile?.tags && profile.tags.length > 0 && (
              <span>{profile.tags.length} tags</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <DarkStatBox label="Capabilities" value={capabilities.length} color="purple" />
          <DarkStatBox label="Claims" value={claims.length} color="indigo" />
          <DarkStatBox label="Evidence-Backed" value={evidenceBackedClaims.length} color="emerald" />
          <DarkStatBox label="Published" value={publishedEntries.length} color="sky" />
        </div>

        {/* Capabilities Grid */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
            Capabilities
          </h2>
          {capabilities.length === 0 ? (
            <DarkEmpty message="No capabilities declared." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map((cap) => (
                <DarkCapabilityCard key={cap.id} capability={cap} />
              ))}
            </div>
          )}
        </section>

        {/* Evidence-Backed Claims */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            Evidence-Backed Claims
          </h2>
          {evidenceBackedClaims.length === 0 ? (
            <DarkEmpty message="No claims with evidence backing." />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {evidenceBackedClaims.map((claim) => (
                <DarkClaimRow key={claim.id} claim={claim} />
              ))}
            </div>
          )}
        </section>

        {/* Limitations */}
        {claims.some((c) => c.limitations && c.limitations.length > 0) && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
              Limitations
            </h2>
            <div className="flex flex-wrap gap-2">
              {claims
                .filter((c) => c.limitations && c.limitations.length > 0)
                .flatMap((c) => c.limitations!)
                .filter((lim, i, arr) => arr.indexOf(lim) === i)
                .map((lim, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-900/30 text-amber-300 border border-amber-800/50 rounded-lg text-xs">
                    {lim}
                  </span>
                ))}
            </div>
          </section>
        )}

        {/* Readiness Score */}
        {readiness && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-cyan-500 rounded-full" />
              Readiness Score
            </h2>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Dimensions Assessed</div>
                  <div className="text-3xl font-bold text-white">
                    {readiness.dimensions?.length ?? 0}
                    <span className="text-xl text-gray-500"> dimensions</span>
                  </div>
                  <div className="text-sm mt-1 text-gray-400">
                    Factual readiness assessment
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Computed {new Date(readiness.computed_at).toLocaleDateString()}
                  {readiness.cached ? ' (cached)' : ''}
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                {(readiness.dimensions ?? []).map((dim) => (
                  <div key={dim.name} className="flex items-center gap-3">
                    <span className="w-32 text-xs text-gray-400 flex-shrink-0 capitalize">
                      {dim.name.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dim.score >= 0.7 ? 'bg-emerald-500' : dim.score >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(dim.score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-300 w-8 text-right">{Math.round(dim.score * 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gaps Summary */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-red-500 rounded-full" />
            Gaps
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <DarkStatBox label="Open" value={openGaps.length} color="red" />
            <DarkStatBox label="Critical" value={criticalGaps.length} color="orange" />
            <DarkStatBox label="Total" value={gaps.length} color="gray" />
          </div>
          {gaps.length === 0 ? (
            <DarkEmpty message="No gaps identified." />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {openGaps.slice(0, 5).map((gap) => (
                <div key={gap.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      gap.severity === 'critical' ? 'bg-red-500' :
                      gap.severity === 'high' ? 'bg-orange-500' :
                      gap.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm text-gray-300 truncate">{gap.title || gap.gap_type}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 capitalize">{gap.severity}</span>
                </div>
              ))}
              {openGaps.length > 5 && (
                <p className="text-xs text-gray-500 text-center">+{openGaps.length - 5} more open gaps</p>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="pt-6 border-t border-gray-700 text-xs text-gray-500">
          <p>
            Institution Passport — {profile?.current_version ?? 'v1'} — Governed projection from verified API sources.
            {lastAttestedDate && <> Last attested: {new Date(lastAttestedDate).toLocaleDateString()}.</>}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DarkStatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const classes: Record<string, string> = {
    purple: 'border-purple-800/50 bg-purple-900/20',
    indigo: 'border-indigo-800/50 bg-indigo-900/20',
    emerald: 'border-emerald-800/50 bg-emerald-900/20',
    sky: 'border-sky-800/50 bg-sky-900/20',
    red: 'border-red-800/50 bg-red-900/20',
    orange: 'border-orange-800/50 bg-orange-900/20',
    gray: 'border-gray-700 bg-gray-800/30',
  }
  const textColors: Record<string, string> = {
    purple: 'text-purple-300',
    indigo: 'text-indigo-300',
    emerald: 'text-emerald-300',
    sky: 'text-sky-300',
    red: 'text-red-300',
    orange: 'text-orange-300',
    gray: 'text-gray-300',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${classes[color] ?? classes.purple}`}>
      <div className={`text-2xl font-bold ${textColors[color] ?? textColors.purple}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}

function DarkEmpty({ message }: { message: string }) {
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 text-center text-gray-500 text-sm">
      {message}
    </div>
  )
}

function DarkCapabilityCard({ capability }: { capability: CapabilityInstance }) {
  const lifecycleColors: Record<string, string> = {
    verified: 'border-emerald-800/50 text-emerald-300',
    published: 'border-purple-800/50 text-purple-300',
    evidence_submitted: 'border-blue-800/50 text-blue-300',
    evidence_reviewed: 'border-indigo-800/50 text-indigo-300',
    under_review: 'border-amber-800/50 text-amber-300',
    declared: 'border-gray-700 text-gray-400',
    suspended: 'border-red-800/50 text-red-300',
    deprecated: 'border-gray-700 text-gray-500',
  }

  const state = capability.lifecycle_state || capability.status
  const stateColors = lifecycleColors[state] ?? lifecycleColors.declared

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-700/50 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-200 text-sm">{capability.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${stateColors}`}>
          {state?.replace(/_/g, ' ')}
        </span>
      </div>
      {capability.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{capability.description}</p>
      )}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>{capability.claim_count} claims</span>
        {capability.confidence_score != null && (
          <span>Confidence: {Math.round(capability.confidence_score * 100)}%</span>
        )}
      </div>
    </div>
  )
}

function DarkClaimRow({ claim }: { claim: ClaimExtended }) {
  return (
    <div className="flex items-center justify-between bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-2.5 hover:border-emerald-700/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-sm text-gray-200 truncate block">{claim.name}</span>
          {claim.statement && (
            <span className="text-xs text-gray-500 truncate block">&ldquo;{claim.statement}&rdquo;</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-500">{claim.evidence_count} evidence</span>
        <span className="text-xs text-gray-500">v{claim.version}</span>
      </div>
    </div>
  )
}
