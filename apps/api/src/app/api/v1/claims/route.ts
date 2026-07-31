// ==========================================================================
// KAD-094 — Claims API (Progressive Interview)
// POST /api/v1/claims — Create a claim from interview answer
// GET  /api/v1/claims?institution_id=id&category=infrastructure — List claims
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import crypto from 'crypto'

function hashClaim(question: string, answer: string): string {
  return crypto.createHash('sha256').update(`${question}::${answer}`).digest('hex')
}

export const GET = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const institutionId = url.searchParams.get('institution_id')
    const category = url.searchParams.get('category')

    if (!institutionId) throw new ApiError(400, 'institution_id is required')

    let query = supabase.from('claims').select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw new ApiError(500, 'Failed to fetch claims')
    return Response.json({ data, count: data.length, error: null })
  } catch (error) { return handleApiError(error) }
})

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
