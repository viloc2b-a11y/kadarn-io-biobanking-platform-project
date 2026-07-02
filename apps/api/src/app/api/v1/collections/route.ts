import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { paginationSchema } from '@/lib/validation'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { emitCollectionCreated, recordCollectionProvenance, createCorrelationId } from '@/lib/logistics-helper'

type JsonObject = Record<string, unknown>

/**
 * GET /api/v1/collections — List collection_twins with pagination.
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
      .from('collection_twins')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (error) throw new ApiError(500, 'Failed to fetch collections', error.message)

    return Response.json({
      data: data ?? [],
      pagination: { total: count ?? 0, limit, offset },
    })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/collections — Create a new collection_twin.
 */
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = (await request.json()) as JsonObject
      const correlationId = createCorrelationId()

      if (!body.name) throw new ApiError(400, 'name is required')

      const organizationId = await requireValidatedActiveOrg(user)

      const payload: Record<string, unknown> = {
        organization_id: organizationId,
        status: body.status ?? 'active',
        target_enrollment: body.target_enrollment ?? null,
        actual_enrollment: body.actual_enrollment ?? 0,
        metadata: {
          ...((body.metadata as JsonObject | undefined) ?? {}),
          name: body.name,
          ...(body.program_id ? { program_id: body.program_id } : {}),
          created_by: user.id,
        },
      }

      const { data, error } = await supabase
        .from('collection_twins')
        .insert(payload)
        .select()
        .single()

      if (error) throw new ApiError(500, 'Failed to create collection twin', error.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      recordCollectionProvenance(data.id, organizationId, body.name as string, user.id, correlationId)

      emitCollectionCreated(data.id, organizationId, body.name as string, user.id, correlationId)

      return Response.json({ data }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'collections', 'kadarn.api.method': 'POST' } },
)
