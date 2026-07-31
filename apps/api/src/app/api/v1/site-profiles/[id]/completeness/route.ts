// ==========================================================================
// KEMS-SITE-PROFILE — Profile Completeness Metrics
// GET /api/v1/site-profiles/[id]/completeness
// Returns ProfileCompletionMetrics: field coverage, attestation %, evidence backing.
// ==========================================================================

import { withAuth, handleApiError } from '@/lib/supabase-server'
import { getProfileService } from '@/lib/profile-service-factory'
import { ProfileServiceError } from '@kadarn/platform-services'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().uuid() })

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params)
    const service = getProfileService()
    const metrics = await service.calculateCompleteness(id)
    return Response.json({ data: metrics, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ data: null, error: 'Invalid profile ID' }, { status: 400 })
    }
    if (error instanceof ProfileServiceError) {
      return Response.json({ data: null, error: error.message }, { status: mapServiceCode(error.code) })
    }
    return handleApiError(error)
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────

function mapServiceCode(code: string): number {
  switch (code) {
    case 'NOT_FOUND': return 404
    default: return 500
  }
}
