import { NextRequest } from 'next/server'
import { handleApiError } from '@/lib/auth-guards'
import { LegacyReadAdapter, EvidencePackGenerator } from '@kadarn/published-view'

/**
 * GET /api/v1/published-views/:claimId/evidence-pack
 * Sprint 28F — Evidence Pack for a claim (legacy adapter path during transition)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ claimId: string }> },
) {
  try {
    const { claimId } = await context.params

    // Minimal path: generate pack from synthetic legacy view until native store wired
    const adapter = new LegacyReadAdapter()
    const view = adapter.adaptClaim(
      {
        id: claimId,
        claim_type: 'unknown',
        category: 'unknown',
        title: claimId,
        description: '',
        verification_status: 'self_reported',
        confidence_score: 0,
      },
      'unknown-org',
    )

    const generator = new EvidencePackGenerator()
    const pack = generator.generate({ view, variant: 'public' })

    return Response.json({ data: pack, error: null })
  } catch (error) {
    return handleApiError(error)
  }
}
