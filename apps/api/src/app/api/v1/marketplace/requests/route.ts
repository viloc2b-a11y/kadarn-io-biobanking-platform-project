import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import {
  createCorrelationId,
} from '@/lib/exchange-helper'
import { runPipeline, createPipelineContext } from '@/lib/engine-orchestrator'

/**
 * GET /api/v1/marketplace/requests
 * List exchange requests for the current user's organization.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()
    const orgId = user.user_metadata?.active_org_id as string | null

    if (!orgId) return Response.json({ data: [], error: null })

    const { data, error } = await supabase
      .from('exchange_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new ApiError(500, 'Failed to fetch requests', error.message)

    return Response.json({ data: data ?? [], error: null })
  } catch (err) {
    return handleApiError(err)
  }
})

/**
 * POST /api/v1/marketplace/requests
 * Create a new exchange request (access request).
 */
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const orgId = user.user_metadata?.active_org_id as string | null
      const correlationId = createCorrelationId()

      if (!orgId) throw new ApiError(400, 'No active organization selected')

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

      if (!title.trim()) throw new ApiError(400, 'Title is required')

      const { data, error } = await supabase
        .from('exchange_requests')
        .insert(payload)
        .select()
        .single()

      if (error) throw new ApiError(500, 'Failed to create request', error.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      runPipeline(
        'exchange-request',
        createPipelineContext({
          correlationId,
          actorId: user.id,
          organizationId: orgId,
          programId: data.program_id,
        }),
        {
          requestId: data.id,
          title,
          programId: data.program_id,
          sampleCount: data.requested_sample_count,
          providerOrgId: (data.target_org_ids as string[] | undefined)?.[0] ?? 'unknown',
          requesterName: user.email ?? user.id,
          route: 'marketplace.requests',
        },
      )

      return Response.json({ data, error: null }, { status: 201 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'marketplace.requests', 'kadarn.api.method': 'POST' } },
)

/**
 * PATCH /api/v1/marketplace/requests — Approve or reject an exchange request.
 * This is the Approval step in the retrospective flow.
 */
export const PATCH = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = (await request.json()) as Record<string, unknown>
      const correlationId = createCorrelationId()
      const requestId = body.request_id as string | undefined
      const action = body.action as string | undefined  // 'approve' | 'reject'
      const reason = (body.reason as string) ?? ''

      if (!requestId) throw new ApiError(400, 'request_id is required')
      if (!action || !['approve', 'reject'].includes(action))
        throw new ApiError(400, 'action must be "approve" or "reject"')

      // Verify the request exists
      const { data: existing } = await supabase
        .from('exchange_requests')
        .select('id, status, organization_id, title, target_org_ids, program_id')
        .eq('id', requestId)
        .single()

      if (!existing) throw new ApiError(404, 'Exchange request not found')
      if (existing.status !== 'submitted' && existing.status !== 'under_review')
        throw new ApiError(409, `Cannot ${action} a request with status "${existing.status}"`)

      // Update the request status
      const newStatus = action === 'approve' ? 'accepted' : 'declined'
      const { error: updateError } = await supabase
        .from('exchange_requests')
        .update({ status: newStatus })
        .eq('id', requestId)

      if (updateError) throw new ApiError(500, 'Failed to update request', updateError.message)

      // ── Cross-engine hooks (fire-and-forget) ──────────────────────────
      runPipeline(
        'exchange-request-decision',
        createPipelineContext({
          correlationId,
          actorId: user.id,
          organizationId: (user.user_metadata?.active_org_id as string) ?? existing.organization_id,
          programId: existing.program_id,
        }),
        {
          requestId,
          action: action === 'approve' ? 'approve' : 'reject',
          programId: existing.program_id ?? '',
          reason,
          route: 'marketplace.requests',
        },
      )

      return Response.json({
        data: { id: requestId, status: newStatus, action, correlationId },
        error: null,
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'marketplace.requests', 'kadarn.api.method': 'PATCH' } },
)
