import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { createCorrelationId } from '@/lib/exchange-helper'

const supplyItemTypeEnum = [
  'existing_collection',
  'prospective_collection',
  'laboratory_service',
  'clinical_service',
  'data_resource',
  'storage_logistics',
  'equipment_capability',
] as const

const createSupplyItemSchema = z.object({
  type: z.enum(supplyItemTypeEnum, {
    errorMap: () => ({ message: `Type must be one of: ${supplyItemTypeEnum.join(', ')}` }),
  }),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  program_id: z.string().uuid().optional(),
  collection_id: z.string().uuid().optional(),
  disease_icd10: z.string().max(20).optional(),
  disease_label: z.string().max(200).optional(),
  sample_types: z.array(z.string()).default([]),
  data_categories: z.array(z.string()).default([]),
  service_categories: z.array(z.string()).default([]),
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  commercial_use_allowed: z.boolean().default(false),
  non_profit_use_allowed: z.boolean().default(true),
  prospective_available: z.boolean().default(false),
  estimated_recruitment_per_month: z.number().int().positive().optional(),
  estimated_turnaround_days: z.number().int().positive().optional(),
  processing_available: z.boolean().default(false),
})

/**
 * GET /api/v1/marketplace/supply-items
 * List supply items for the caller's organization.
 */
export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const url = new URL(request.url)
    const orgId = url.searchParams.get('organization_id') ?? user.user_metadata?.active_org_id as string

    if (!orgId) return Response.json({ data: [], error: null })

    const { data, error } = await supabase
      .from('supply_items')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new ApiError(500, 'Failed to fetch supply items', error.message)

    return Response.json({ data: data ?? [], error: null })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/marketplace/supply-items
 * Create a new supply item. Makes the hospital "discovery ready".
 */
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const orgId = user.user_metadata?.active_org_id as string | null
      const correlationId = createCorrelationId()

      if (!orgId) throw new ApiError(400, 'No active organization selected')

      const body = (await request.json()) as Record<string, unknown>
      const parsed = createSupplyItemSchema.safeParse(body)

      if (!parsed.success) throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors)

      const { data, error } = await supabase
        .from('supply_items')
        .insert({ organization_id: orgId, created_by: user.id, ...parsed.data })
        .select()
        .single()

      if (error) throw new ApiError(500, 'Failed to create supply item', error.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      console.log(JSON.stringify({
        type: 'domain_event',
        event: {
          type: 'SupplyItemCreated',
          payload: { supplyItemId: data.id, organizationId: orgId, type: parsed.data.type, title: parsed.data.title, createdBy: user.id },
          actorId: user.id, organizationId: orgId, correlationId,
        },
        timestamp: new Date().toISOString(),
      }))

      return Response.json({ data, error: null }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'marketplace.supply-items', 'kadarn.api.method': 'POST' } },
)
