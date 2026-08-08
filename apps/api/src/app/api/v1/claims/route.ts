// ==========================================================================
// KAD-094 — Claims API — Slice 4 runtime-verified against live Supabase schema
// GET  /api/v1/claims — List claims for active institution, enriched
// POST /api/v1/claims — Create a claim (simplified for pilot)
// ==========================================================================
// Live schema (verified 2026-08-08 against supabase_db_kadarn-platform):
//   claims: organization_id, name, description, workflow_state, evidence_count,
//           expires_at, claim_type_id, domain, status, version
//   claim_evidence_links: claim_id, evidence_id, relationship_type
//     (SUPPORTS, PARTIALLY_SUPPORTS, CONTRADICTS, REQUIRES_REVIEW, OBSOLETES)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'

// ─── Derived state from live schema fields ─────────────────────────────────
// Maps workflow_state + evidence links to a simplified derivedState
// compatible with the Home aggregator's expectations.

function deriveStateFromWorkflow(
  workflowState: string | null,
  links: any[],
  isExpired: boolean
): string {
  if (workflowState === 'disputed') return 'disputed'
  if (workflowState === 'archived') return 'archived'
  if (isExpired) return 'stale'
  const hasContradicts = links.some(
    (l: any) => l.relationship_type === 'CONTRADICTS'
  )
  if (hasContradicts) return 'disputed'
  const supportingCount = links.filter(
    (l: any) => l.relationship_type === 'SUPPORTS' || l.relationship_type === 'PARTIALLY_SUPPORTS'
  ).length
  if (supportingCount === 0) return 'awaiting_evidence'
  if (supportingCount >= 1) return 'substantiated'
  return 'unknown'
}

interface EnrichedClaim {
  id: string
  statement: string
  workflowState: string | null
  derivedState: string
  evidenceCount: number | null
  hasExpiredEvidence: boolean | null
  hasDispute: boolean | null
  institutionId: string
  domain: string | null
  version: number
  createdAt: string | null
  updatedAt: string | null
  _evidenceLoadFailed?: boolean
}

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)

    // Auto-resolve organization_id from session
    let institutionId = url.searchParams.get('institution_id')
    if (!institutionId) {
      institutionId = await requireValidatedActiveOrg(user)
    }

    const domain = url.searchParams.get('category') || url.searchParams.get('domain')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

    let query = supabase.from('claims')
      .select('*')
      .eq('organization_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (domain) query = query.eq('domain', domain)

    const { data: claims, error: claimsErr } = await query
    if (claimsErr) {
      return Response.json({
        data: [],
        count: 0,
        error: { code: 'CLAIMS_FETCH_FAILED', message: 'Failed to load claims' },
      }, { status: 500 })
    }
    if (!claims || claims.length === 0) {
      return Response.json({ data: [], count: 0, error: null })
    }

    const claimIds = (claims as any[]).map((c: any) => c.id)

    // Batch-load evidence links — live schema uses relationship_type, claim_id, evidence_id
    let linksOk = true
    let linksByClaim: Map<string, any[]> = new Map()
    try {
      const { data: rawLinks, error: linksErr } = await supabase
        .from('claim_evidence_links')
        .select('claim_id, evidence_id, relationship_type, created_at')
        .in('claim_id', claimIds)

      if (linksErr) {
        linksOk = false
      } else if (rawLinks) {
        for (const l of rawLinks as any[]) {
          if (!linksByClaim.has(l.claim_id)) linksByClaim.set(l.claim_id, [])
          linksByClaim.get(l.claim_id)!.push(l)
        }
      }
    } catch {
      linksOk = false
    }

    // Build enriched response
    const now = new Date()

    const enriched: EnrichedClaim[] = (claims as any[]).map((c: any) => {
      const statement = c.name || c.description || 'Untitled claim'

      if (!linksOk) {
        return {
          id: c.id,
          statement,
          workflowState: c.workflow_state ?? null,
          derivedState: deriveStateFromWorkflow(c.workflow_state, [], false),
          evidenceCount: null,
          hasExpiredEvidence: null,
          hasDispute: null,
          institutionId: c.organization_id,
          domain: c.domain ?? null,
          version: c.version ?? 1,
          createdAt: c.created_at ?? null,
          updatedAt: c.updated_at ?? null,
          _evidenceLoadFailed: true,
        }
      }

      const claimLinks = linksByClaim.get(c.id) ?? []
      const evidenceCount = claimLinks.length
      const actuallyExpired = Boolean(c.expires_at && new Date(c.expires_at) < now)
      const hasDispute = claimLinks.some(
        (l: any) => l.relationship_type === 'CONTRADICTS' || l.relationship_type === 'REQUIRES_REVIEW'
      )

      return {
        id: c.id,
        statement,
        workflowState: c.workflow_state ?? null,
        derivedState: deriveStateFromWorkflow(c.workflow_state, claimLinks, actuallyExpired),
        evidenceCount,
        hasExpiredEvidence: actuallyExpired,
        hasDispute,
        institutionId: c.organization_id,
        domain: c.domain ?? null,
        version: c.version ?? 1,
        createdAt: c.created_at ?? null,
        updatedAt: c.updated_at ?? null,
      }
    })

    return Response.json({
      data: enriched,
      count: enriched.length,
      error: null,
      _meta: { evidenceLoadOk: linksOk },
    })
  } catch (error) { return handleApiError(error) }
})

// POST — simplified for pilot (no hash dedup needed for smoke testing)
export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json() as Record<string, unknown>
    const institutionId = body.institution_id as string || await requireValidatedActiveOrg(user)
    const name = (body.question_text || body.name || 'Untitled claim') as string
    const description = (body.answer_value || body.description || '') as string
    const domain = (body.category || body.domain || 'other') as string

    const { data: claim, error } = await supabase.from('claims').insert({
      organization_id: institutionId,
      name,
      description,
      domain,
      claim_type_id: body.claim_type_id || 'custom',
      status: 'active',
      workflow_state: 'draft',
      evidence_count: 0,
      created_by_org_id: institutionId,
      owning_org_id: institutionId,
      visibility_scope: 'site',
    }).select().single()

    if (error) throw new ApiError(500, 'Failed to create claim: ' + error.message)
    return Response.json({ data: claim, created: true, error: null }, { status: 201 })
  } catch (error) { return handleApiError(error) }
})
