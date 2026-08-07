'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'
import {
  deriveClaimState,
  type ClaimStateInput,
  type ClaimWorkflowState,
  type DerivedClaimState,
} from '@kadarn/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Claim {
  id: string; claim_type_id: string; name: string; description: string | null
  organization_id: string; claim_category: string | null; claim_scope: string | null
  priority: string; version: number; lifecycle_status: string; review_status: string
  workflow_state: string; evidence_count: number; expires_at: string | null
  superseded_by: string | null; created_at: string; updated_at: string
}

// ─── dashboard-next-best-action CRITICAL #2 fix (verify-report id 1010) ──
// Wires this list page onto the PR-A canonical mapping layer
// (`deriveClaimState()`/`DerivedClaimState`, packages/types/src/
// claim-derived-state.ts) instead of the bare `lifecycle_status` badge, per
// design D2's "one shared renderer over ClaimConfidenceState" intent
// (design id 982) and spec R7 ("Identical state renders identical terms").
//
// This list endpoint returns `workflow_state` + `evidence_count` per claim,
// not a per-evidence-item relationship breakdown (SUPPORTS/
// PARTIALLY_SUPPORTS/CONTRADICTS) — that requires a claim-detail evidence
// join (`/api/v1/claims/[id]/evidence`), which is out of this fix's scope
// (see apply-progress: tasks 3.2-3.4 stay blocked pending the
// `claims/[id]/page.tsx` branch-lineage decision; this fix touches ONLY the
// list page).
//
// `deriveClaimState()`'s rules 1-3 (disputed / archived / awaiting_evidence)
// need only `workflow_state` + evidence presence and are derived exactly,
// honestly, from real data with nothing invented. Rules 4-6 (stale /
// partially_supported / supported) need real relationship-type + freshness
// data this list view doesn't have; rather than fabricate that signal,
// claims with `evidence_count > 0` that are not disputed/archived are
// conservatively floored at `partially_supported` (never the stronger,
// unverifiable `supported` claim), and the explanation says so plainly —
// state is never rendered as a bare label either way.
function deriveListDisplayState(claim: Claim): { state: DerivedClaimState; explanation: string } {
  const input: ClaimStateInput = {
    workflowState: claim.workflow_state as ClaimWorkflowState,
    decays: false,
    decayPeriodMonths: null,
    requiredEvidenceClasses: [],
    evidenceLinks: claim.evidence_count > 0
      ? [{ relationshipType: 'PARTIALLY_SUPPORTS', createdAt: claim.updated_at }]
      : [],
  }
  const state = deriveClaimState(input)
  const explanation = claim.evidence_count > 0
    ? `${claim.evidence_count} evidence item${claim.evidence_count === 1 ? '' : 's'} linked — open the claim for the full evidence and contradiction breakdown`
    : 'no evidence linked yet'
  return { state, explanation }
}

const DERIVED_STATE_LABELS: Record<DerivedClaimState, string> = {
  disputed: 'Disputed',
  archived: 'Archived',
  awaiting_evidence: 'Awaiting evidence',
  stale: 'Stale',
  partially_supported: 'Partially supported',
  supported: 'Supported',
}

const DERIVED_STATE_COLORS: Record<DerivedClaimState, string> = {
  disputed: 'bg-red-100 text-red-700',
  archived: 'bg-gray-200 text-gray-500',
  awaiting_evidence: 'bg-gray-100 text-gray-600',
  stale: 'bg-orange-100 text-orange-700',
  partially_supported: 'bg-yellow-100 text-yellow-700',
  supported: 'bg-green-100 text-green-700',
}

export default function ClaimsPage() {
  const { user } = useSession()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const fetchClaims = async (token: string) => {
    try {
      const url = statusFilter
        ? `${API}/api/v1/claims?orgId=${user?.organization_id}&status=${statusFilter}`
        : `${API}/api/v1/claims?orgId=${user?.organization_id}`
      const res = await fetch(url, { headers: headers(token) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setClaims(json.data ?? json.claims ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.token) return
    fetchClaims(user.token)
  }, [user, statusFilter])

  if (loading) return <div className="p-8 text-gray-500">Loading claims...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Claims</h1>
        <p className="text-gray-600">Institutional claims backed by verified evidence.</p>
      </div>

      <div className="mb-6 flex gap-2">
        {['', 'draft', 'review', 'approved', 'rejected', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {claims.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center text-gray-500">
          No claims found. Claims are generated from reviewed evidence.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => {
            // CRITICAL #2 fix — canonical `deriveClaimState()` state + a
            // factual explanation, never the bare `lifecycle_status` label
            // this page used to render alone.
            const { state, explanation } = deriveListDisplayState(claim)
            return (
              <div key={claim.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{claim.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DERIVED_STATE_COLORS[state]}`}>
                    {DERIVED_STATE_LABELS[state]}
                  </span>
                </div>
                {claim.description && <p className="text-sm text-gray-600 mb-2">{claim.description}</p>}
                <p className="text-xs text-gray-500 mb-2">{explanation}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>v{claim.version}</span>
                  <span>{claim.claim_category ?? 'uncategorized'}</span>
                  <span>{claim.evidence_count} evidence items</span>
                  <span>{claim.workflow_state}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}