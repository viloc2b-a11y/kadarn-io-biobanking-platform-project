import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'

/**
 * GET /api/v1/marketplace/requests
 * List exchange requests for the current user's organization.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()
    const orgId = user.user_metadata?.active_org_id as string | null

    if (!orgId) {
      return Response.json({ data: [], error: null })
    }

    const { data, error } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw new ApiError(500, 'Failed to fetch requests', error.message)
    }

    return Response.json({ data: data ?? [], error: null })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/marketplace/requests
 * Create a new exchange request (access request).
 */
export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient()
    const orgId = user.user_metadata?.active_org_id as string | null

    if (!orgId) {
      throw new ApiError(400, 'No active organization selected')
    }

    const body = (await request.json()) as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title : ''

    const payload = {
      requester_id: user.id,
      organization_id: orgId,
      program_id: body.program_id ?? null,
      supply_item_id: body.supply_item_id ?? null,
      title,
      description: body.description ?? null,
      status: 'submitted',
      target_org_ids: body.target_org_ids ?? [],
      requested_sample_count: body.requested_sample_count ?? null,
      requested_data_categories: body.requested_data_categories ?? [],
      requested_timeline_days: body.requested_timeline_days ?? null,
      budget_range_min: body.budget_range_min ?? null,
      budget_range_max: body.budget_range_max ?? null,
      commercial_use: body.commercial_use ?? false,
      nonprofit_use: body.nonprofit_use ?? true,
      submitted_at: new Date().toISOString(),
    }

    if (!title.trim()) {
      throw new ApiError(400, 'Title is required')
    }

    const { data, error } = await supabase
      .from('exchange_requests')
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to create request', error.message)
    }

    return Response.json({ data, error: null }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
})
