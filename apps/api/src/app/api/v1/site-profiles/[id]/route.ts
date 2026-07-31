// ==========================================================================
// KEMS-SITE-PROFILE — Single Site Profile API
// GET   /api/v1/site-profiles/[id] — Get a single site profile with versions & attestations
// PATCH /api/v1/site-profiles/[id] — Update a site profile
// ==========================================================================

import { withAuth, handleApiError, ApiError } from '@/lib/supabase-server'
import { getProfileService, getServiceClient } from '@/lib/profile-service-factory'
import { UpdateSiteProfileSchema } from '@kadarn/types'
import { ProfileServiceError } from '@kadarn/platform-services'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().uuid() })

// ─── GET — single site profile (with versions & attestations) ────────────

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params)
    const service = getProfileService()
    const result = await service.getProfile(id)
    return Response.json({ data: result, error: null })
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

// ─── PATCH — update site profile ─────────────────────────────────────────

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params)
    const body = await request.json() as Record<string, unknown>

    const parsed = UpdateSiteProfileSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // If the update targets a specific content section, delegate to updateSection.
    const section = (body.section as string) ?? null
    const sectionData = (body.data as Record<string, unknown>) ?? null

    if (section && sectionData) {
      const service = getProfileService()
      const updated = await service.updateSection(id, section, sectionData)
      return Response.json({ data: updated, error: null })
    }

    // Full profile metadata update via direct Supabase update
    const supabase = getServiceClient()
    const { data: updated, error } = await supabase
      .from('site_profiles')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json({ data: null, error: 'Profile not found' }, { status: 404 })
      }
      throw new ApiError(500, 'Failed to update profile', error.message)
    }

    return Response.json({ data: updated, error: null })
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
    case 'CREATE_FAILED':
    case 'UPDATE_FAILED':
    case 'VERSION_FAILED': return 500
    case 'IMMUTABLE':
    case 'TERMINAL_STATE':
    case 'INVALID_STATE': return 409
    default: return 500
  }
}
