import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { paginationSchema } from '@/lib/validation'

type JsonObject = Record<string, unknown>

/**
 * GET /api/v1/specimens
 * List specimen_twins with pagination.
 */
export const GET = withAuth(async (request) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const { limit, offset } = paginationSchema.parse({
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    })

    const { data, error, count } = await supabase
      .from('specimen_twins')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError(500, 'Failed to fetch specimens', error.message)

    return Response.json({
      data: data ?? [],
      pagination: { total: count ?? 0, limit, offset },
    })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/specimens
 * Create a new specimen_twin.
 *
 * Accepts:
 *   external_id (string)     — external identifier (stored in notes/metadata)
 *   specimen_type (string)   — type of specimen (ffpe, fresh_frozen, whole_blood, etc.)
 *   collection_id? (UUID)    — associated collection (stored in metadata)
 *   organization_id (UUID)   — owning organization
 *   program_id? (UUID)       — associated program (stored in metadata)
 *   status? (string)         — defaults to 'collected'
 *   properties? (jsonb)      — arbitrary properties (stored as current_location or metadata)
 *
 * Auto-sets: status='collected' if not provided, collected_at = now()
 */
export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = (await request.json()) as JsonObject

    if (!body.external_id) {
      throw new ApiError(400, 'external_id is required')
    }
    if (!body.specimen_type) {
      throw new ApiError(400, 'specimen_type is required')
    }
    if (!body.organization_id) {
      throw new ApiError(400, 'organization_id is required')
    }

    // Build metadata bundle for fields that don't have dedicated columns
    const extraMeta: Record<string, unknown> = {
      ...((body.properties as JsonObject | undefined) ?? {}),
      external_id: body.external_id,
      ...(body.collection_id ? { collection_id: body.collection_id } : {}),
      ...(body.program_id ? { program_id: body.program_id } : {}),
      created_by: user.id,
    }

    const payload: Record<string, unknown> = {
      organization_id: body.organization_id,
      specimen_type: body.specimen_type,
      status: body.status ?? 'collected',
      collected_at: new Date().toISOString(),
      collected_by: user.id,
      notes: `external_id: ${body.external_id}`,
      current_location: extraMeta,
    }

    const { data, error } = await supabase
      .from('specimen_twins')
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to create specimen twin', error.message)
    }

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
})
