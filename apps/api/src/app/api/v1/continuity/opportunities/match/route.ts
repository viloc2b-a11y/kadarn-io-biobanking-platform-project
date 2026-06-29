import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { matchOpportunity } from '@/lib/continuity-claim-service'

/**
 * POST /api/v1/continuity/opportunities/match
 *
 * Match a sponsor opportunity against all available site profiles.
 * Returns ranked results with match %, reasoning, and opportunity score.
 *
 * Body:
 *   therapeuticArea (string)  — e.g. "Oncology", "Diabetes"
 *   population? (string)      — e.g. "Hispanic", "Pediatric"
 *   location? (string)        — e.g. "Houston", "Texas"
 *   specimenType? (string)    — e.g. "Serum", "FFPE"
 *   minConfidence? (number)   — minimum confidence threshold
 *   limit? (number)           — max results (default 10, max 50)
 */
export const POST = withAuth(async (request) => {
  try {
    const supabase = await createRouteClient()
    const body = await request.json() as {
      therapeuticArea?: string
      population?: string
      location?: string
      specimenType?: string
      minConfidence?: number
      limit?: number
    }

    if (!body.therapeuticArea && !body.specimenType) {
      return Response.json({
        error: { code: 400, message: 'At least therapeuticArea or specimenType is required' },
      }, { status: 400 })
    }

    const result = await matchOpportunity(supabase as any, {
      therapeuticArea: body.therapeuticArea,
      population: body.population,
      location: body.location,
      specimenType: body.specimenType,
      minConfidence: body.minConfidence,
      limit: body.limit,
    })

    return Response.json({ data: result, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
