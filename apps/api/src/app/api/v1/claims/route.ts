// ==========================================================================
// KAD-094 — Claims API (Progressive Interview) — Slice 3 hardening
// GET  /api/v1/claims — List claims for active institution, enriched
// POST /api/v1/claims — Create a claim from interview answer
// ==========================================================================
// DB schema: migration 094 (interview claims with institution_id)
// Evidence links: migration 075 (claim_evidence_links with role column)
// ==========================================================================
// Slice 3 changes:
// - GET auto-resolves institution_id from session (was required param)
// - Response enriched with evidenceCount, hasExpiredEvidence, hasDispute
//   from real DB queries — never from guess or inference
// - Supabase { data, error } checked explicitly; failure ≠ absence
// - claim_evidence_links uses correct column: `role` (not relationship_type)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import crypto from 'crypto'

function hashClaim(question: string, answer: string): string {
  return crypto.createHash('sha256').update(`${question}::${answer}`).digest('hex')
}

// ─── Enriched claim response shape ─────────────────────────────────────────

interface EnrichedClaim {
  id: string
  statement: string
  confidence: string | null
  evidenceCount: number | null       // null = data unavailable
  hasExpiredEvidence: boolean | null // null = data unavailable
  hasDispute: boolean | null         // null = data unavailable
  institutionId: string
  category: string | null
  version: number
  createdAt: string | null
  updatedAt: string | null
  /** When evidence links failed to load, this is set per-claim. */
  _evidenceLoadFailed?: boolean
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

    // ── Batch-load evidence links ──────────────────────────────────────
    // Schema: migration 075 — claim_evidence_links (claim_id, evidence_id,
    // role, valid_until, created_at). No evidence_class column.
    // Role values: 'supports', 'contradicts', 'qualifies'.
    let linksOk = true
    let linksByClaim: Map<string, any[]> = new Map()
    try {
      const { data: rawLinks, error: linksErr } = await supabase
        .from('claim_evidence_links')
        .select('claim_id, role, valid_until, created_at')
        .in('claim_id', claimIds)
        .is('revoked_at', null) // only active links

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

    // ── Build enriched response ────────────────────────────────────────
    const now = new Date()

    const enriched: EnrichedClaim[] = (claims as any[]).map((c: any) => {
      // statement: from question_text or answer_value
      const statement = c.question_text || c.answer_value || 'Untitled claim'

      // Evidence count + freshness — from real links, not cached column
      if (!linksOk) {
        // Evidence data unavailable — do NOT fabricate zeros
        return {
          id: c.id,
          statement,
          confidence: c.confidence_level ?? null,
          evidenceCount: null,       // null = data unavailable
          hasExpiredEvidence: null,  // null = data unavailable
          hasDispute: null,          // null = data unavailable
          institutionId: c.institution_id,
          category: c.category ?? null,
          version: c.version ?? 1,
          createdAt: c.created_at ?? null,
          updatedAt: c.updated_at ?? null,
          _evidenceLoadFailed: true,
        }
      }

      const claimLinks = linksByClaim.get(c.id) ?? []
      const evidenceCount = claimLinks.length

      // Expired: any link with valid_until in the past
      const hasExpiredEvidence = claimLinks.some(
        (l: any) => l.valid_until && new Date(l.valid_until) < now,
      )

      // Dispute: from has_unresolved_counter_evidence column (migration 094)
      // or a contradicting link with role = 'contradicts'
      const hasDispute =
        Boolean(c.has_unresolved_counter_evidence) ||
        claimLinks.some((l: any) => l.role === 'contradicts')

      return {
        id: c.id,
        statement,
        confidence: c.confidence_level ?? null,
        evidenceCount,
        hasExpiredEvidence,
        hasDispute,
        institutionId: c.institution_id,
        category: c.category ?? null,
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
