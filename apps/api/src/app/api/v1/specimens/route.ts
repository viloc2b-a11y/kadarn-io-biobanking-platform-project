import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { paginationSchema } from '@/lib/validation'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { requireValidatedActiveOrg } from '@/lib/workspace'
import { createCorrelationId } from '@/lib/logistics-helper'
import { runPipeline, createPipelineContext } from '@/lib/engine-orchestrator'
import { z } from 'zod'

const specimenCreateSchema = z.object({
  external_id: z.string().min(1),
  specimen_type: z.string().min(1),
  organization_id: z.string().uuid(),
  collection_id: z.string().uuid().optional(),
  program_id: z.string().uuid().optional(),
  status: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
})

type JsonObject = Record<string, unknown>

/**
 * GET /api/v1/specimens
 * List specimen_twins with pagination.
 */
export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const { limit, offset } = paginationSchema.parse({
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    })

    const orgId = await requireValidatedActiveOrg(user)

    const { data, error, count } = await supabase
      .from('specimen_twins')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
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
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const body = specimenCreateSchema.parse(await request.json())
    const correlationId = createCorrelationId()

    // Build metadata bundle for fields that don't have dedicated columns
    const extraMeta: Record<string, unknown> = {
      ...((body.properties as Record<string, unknown> | undefined) ?? {}),
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

    runPipeline(
      'specimen-twin',
      createPipelineContext({
        correlationId,
        actorId: user.id,
        organizationId: body.organization_id as string,
      }),
      {
        specimenId: data.id,
        externalId: body.external_id,
        specimenType: body.specimen_type,
        title: body.external_id,
        route: 'specimens',
      },
    )

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'specimens', 'kadarn.api.method': 'POST' } },
)
