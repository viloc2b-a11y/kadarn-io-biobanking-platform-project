// ==========================================================================
// KEMS-SITE-PROFILE — Publish Site Profile
// POST /api/v1/site-profiles/[id]/publish
// Publishes an attested profile at a given visibility level.
// Requires profile to be in 'attested' state with ≥1 attestation.
// ==========================================================================

import { withAuth, handleApiError } from '@/lib/supabase-server'
import { getProfileService } from '@/lib/profile-service-factory'
import type { ProfileVisibilityLevel } from '@kadarn/platform-services'
import { ProfileServiceError } from '@kadarn/platform-services'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().uuid() })

const publishBodySchema = z.object({
  visibility: z.enum(['private', 'restricted', 'public']).default('restricted'),
})

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params)
    const body = await request.json() as Record<string, unknown>

    const parsed = publishBodySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const service = getProfileService()
    const publication = await service.publishProfile(
      id,
      parsed.data.visibility as ProfileVisibilityLevel,
    )

    return Response.json({ data: publication, error: null }, { status: 201 })
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
    case 'INVALID_STATE': return 409
    case 'NO_VERSION':
    case 'NO_ATTESTATIONS': return 422
    case 'PUBLISH_FAILED': return 500
    default: return 500
  }
}
