// ==========================================================================
// KAD-094 — Claims API (Progressive Interview) — Slice 3 hardening
// GET  /api/v1/claims — List claims for active institution, enriched
// POST /api/v1/claims — Create a claim from interview answer
// ==========================================================================
// Slice 3 changes:
// - GET auto-resolves institution_id from session (was required param)
// - Response enriched with derivedState, evidenceCount, hasExpiredEvidence,
//   hasDispute, statement — all from canonical derivation, not client guess
// - Evidence links loaded in one batch query, not N+1
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { deriveClaimState } from '@kadarn/types'
import type { ClaimWorkflowState, DerivationEvidenceLink } from '@kadarn/types'
import crypto from 'crypto'

function hashClaim(question: string, answer: string): string {
  return crypto.createHash('sha256').update(`${question}::${answer}`).digest('hex')
}

// ─── GET — List claims enriched ────────────────────────────────────────────

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)

    // Slice 3: auto-resolve institution_id from session
    let institutionId = url.searchParams.get('institution_id')
    if (!institutionId) {
      institutionId = await requireValidatedActiveOrg(user)
    }

    const category = url.searchParams.get('category')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

    let query = supabase.from('claims').select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (category) query = query.eq('category', category)

    const { data: claims, error } = await query
    if (error) throw new ApiError(500, 'Failed to fetch claims')
    if (!claims || claims.length === 0) {
      return Response.json({ data: [], count: 0, error: null })
    }

    const claimIds = claims.map((c: any) => c.id)

    // Batch-load evidence links for all claims (one query, not N+1)
    let allLinks: any[] = []
    try {
      const { data: links } = await supabase
        .from('claim_evidence_links')
        .select('claim_id, relationship_type, evidence_class, expires_at, created_at')
        .in('claim_id', claimIds)
      if (links) allLinks = links
    } catch { /* graceful — empty links */ }

    // Batch-check for disputes
    let disputes: any[] = []
    try {
      const { data: disp } = await supabase
        .from('evidence_disputes')
        .select('target_entity_id')
        .in('target_entity_id', claimIds)
        .eq('status', 'submitted')
      if (disp) disputes = disp
    } catch { /* graceful — no disputes */ }

    const disputedIds = new Set((disputes ?? []).map((d: any) => d.target_entity_id))

    // Build enriched response
    const enriched = claims.map((c: any) => {
      const claimLinks: DerivationEvidenceLink[] = (allLinks ?? [])
        .filter((l: any) => l.claim_id === c.id)
        .map((l: any) => ({
          relationshipType: l.relationship_type as any,
          evidenceClass: l.evidence_class ?? null,
          expiresAt: l.expires_at ?? null,
          createdAt: l.created_at,
        }))

      const derivedState = deriveClaimState({
        workflowState: (c.workflow_state ?? 'draft') as ClaimWorkflowState,
        decays: Boolean(c.decays),
        decayPeriodMonths: c.decay_period_months ?? null,
        requiredEvidenceClasses: c.required_evidence_classes ?? [],
        evidenceLinks: claimLinks,
      })

      const now = new Date()
      const hasExpiredEvidence = claimLinks.some(
        (l) => l.expiresAt && new Date(l.expiresAt) < now,
      )

      return {
        id: c.id,
        statement: c.question_text || c.answer_value || 'Untitled claim',
        status: c.workflow_state ?? 'draft',
        derivedState,
        confidence: c.confidence_level ?? null,
        evidenceCount: claimLinks.length,
        hasExpiredEvidence,
        hasDispute: disputedIds.has(c.id),
        institutionId: c.institution_id,
        capabilityId: c.capability_id ?? null,
        category: c.category ?? null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }
    })

    return Response.json({ data: enriched, count: enriched.length, error: null })
  } catch (error) { return handleApiError(error) }
})

// ─── POST — Create a claim ─────────────────────────────────────────────────

export const POST = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json() as Record<string, unknown>
    const institutionId = body.institution_id as string
    const questionText = body.question_text as string
    const answerValue = body.answer_value
    const answerType = (body.answer_type as string) || 'text'
    const category = (body.category as string) || 'other'

    if (!institutionId || !questionText || answerValue === undefined) {
      throw new ApiError(400, 'institution_id, question_text, and answer_value are required')
    }

    const claimHash = hashClaim(questionText, String(answerValue))

    const { data: existing } = await supabase.from('claims').select('id')
      .eq('institution_id', institutionId).eq('claim_hash', claimHash)
      .order('version', { ascending: false }).limit(1)

    if (existing && existing.length > 0) {
      return Response.json({ data: existing[0], created: false, error: null })
    }

    const confidenceLevel = (answerValue === false || answerValue === 'no' || answerValue === '')
      ? 'unknown' : 'declared'

    const { data: claim, error } = await supabase.from('claims').insert({
      institution_id: institutionId, claim_hash: claimHash,
      question_text: questionText, answer_value: String(answerValue),
      answer_type: answerType, category,
      confidence_level: confidenceLevel, confidence_score: 0, evidence_count: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select().single()

    if (error) throw new ApiError(500, 'Failed to create claim')
    return Response.json({ data: claim, created: true, error: null }, { status: 201 })
  } catch (error) { return handleApiError(error) }
})
