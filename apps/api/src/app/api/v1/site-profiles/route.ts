// ==========================================================================
// KEMS-SITE-PROFILE — Site Profiles API (collection)
// POST /api/v1/site-profiles — Create a new site profile
// GET  /api/v1/site-profiles — List site profiles
// ==========================================================================

import { withAuth, handleApiError, ApiError } from '@/lib/supabase-server'
import { getProfileService, getServiceClient } from '@/lib/profile-service-factory'
import { CreateSiteProfileSchema, ProfileState } from '@kadarn/types'
import { ProfileServiceError } from '@kadarn/platform-services'

// ─── GET — list site profiles ────────────────────────────────────────────

export const GET = withAuth(async (request) => {
  try {
    const service = getProfileService()
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organization_id') ?? undefined
    const stateRaw = url.searchParams.get('state')
    const page = parseInt(url.searchParams.get('page') ?? '1', 10)
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)

    // Validate and narrow state filter
    let state: ProfileState | undefined
    if (stateRaw) {
      const parsed = ProfileState.safeParse(stateRaw)
      if (!parsed.success) {
        throw new ApiError(400, `Invalid state filter: ${stateRaw}`)
      }
      state = parsed.data
    }

    const result = await service.listProfiles(
      { organizationId, state },
      page,
      limit,
    )

    return Response.json({ data: result, error: null })
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      return Response.json({ data: null, error: error.message }, { status: mapServiceCode(error.code) })
    }
    return handleApiError(error)
  }
})

// ─── POST — create site profile ──────────────────────────────────────────

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const parsed = CreateSiteProfileSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const service = getProfileService()
    const profile = await service.createProfile(
      parsed.data.organization_id,
      parsed.data.profile_type ?? 'general',
    )

    // Apply any extra fields (name, description, content, tags, metadata)
    // that weren't set by createProfile's defaults.
    const supabase = getServiceClient()
    const patch: Record<string, unknown> = {}
    if (parsed.data.name) patch.name = parsed.data.name
    if (parsed.data.description !== undefined) patch.description = parsed.data.description
    if (parsed.data.content && Object.keys(parsed.data.content).length > 0) patch.content = parsed.data.content
    if (parsed.data.tags && parsed.data.tags.length > 0) patch.tags = parsed.data.tags
    if (parsed.data.metadata) patch.metadata = parsed.data.metadata

    if (Object.keys(patch).length > 0) {
      const { data: updated, error } = await supabase
        .from('site_profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select('*')
        .single()

      if (!error && updated) {
        return Response.json({ data: updated, error: null }, { status: 201 })
      }
    }

    return Response.json({ data: profile, error: null }, { status: 201 })
  } catch (error) {
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
    case 'CREATE_FAILED': return 500
    case 'IMMUTABLE':
    case 'TERMINAL_STATE':
    case 'INVALID_STATE': return 409
    case 'NO_VERSION':
    case 'NO_ATTESTATIONS': return 422
    default: return 500
  }
}
