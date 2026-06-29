// ==========================================================================
// Exchange Engine API
// ==========================================================================

import { withAuth, ApiError, createRouteClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { paginationSchema } from '@/lib/validation';
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry';
import { createCorrelationId } from '@/lib/exchange-helper';
import { runPipeline, createPipelineContext } from '@/lib/engine-orchestrator';

const createRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  program_id: z.string().uuid().optional(),
  supply_item_id: z.string().uuid().optional(),
  target_org_ids: z.array(z.string().uuid()).optional(),
  requested_sample_count: z.number().int().positive().optional(),
  requested_timeline_days: z.number().int().positive().optional(),
  budget_range_min: z.number().positive().optional(),
  budget_range_max: z.number().positive().optional(),
  commercial_use: z.boolean().optional(),
});

// GET /api/exchange — list requests
export const GET = withAuth(async (request, user) => {
  const supabase = await createRouteClient();
  const url = new URL(request.url);
  const { limit, offset } = paginationSchema.parse({
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
  });

  const { data, error, count } = await supabase
    .from('exchange_requests')
    .select('*', { count: 'exact' })
    .eq('requester_id', user.id)
    .range(offset, offset + limit - 1);

  if (error) throw new ApiError(500, 'Failed to fetch requests', error.message);
  return Response.json({ data: data ?? [], pagination: { total: count ?? 0, limit, offset } });
});

// POST /api/exchange — create a new request
export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    const supabase = await createRouteClient();
    const body = (await request.json()) as Record<string, unknown>;
    const correlationId = createCorrelationId();
    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);

    // Get user's active org
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (!membership || membership.length === 0) {
      throw new ApiError(400, 'You must belong to an active organization');
    }

    const { data, error } = await supabase
      .from('exchange_requests')
      .insert({
        requester_id: user.id,
        organization_id: membership[0].organization_id,
        title: parsed.data.title,
        description: parsed.data.description,
        program_id: parsed.data.program_id,
        supply_item_id: parsed.data.supply_item_id,
        target_org_ids: parsed.data.target_org_ids ?? [],
        requested_sample_count: parsed.data.requested_sample_count,
        requested_timeline_days: parsed.data.requested_timeline_days,
        budget_range_min: parsed.data.budget_range_min,
        budget_range_max: parsed.data.budget_range_max,
        commercial_use: parsed.data.commercial_use ?? false,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) throw new ApiError(500, 'Failed to create request', error.message);

    // ── Cross-engine hooks (fire-and-forget) ────────────────────────────
    const orgId = membership[0].organization_id;

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
        title: data.title,
        programId: data.program_id,
        sampleCount: data.requested_sample_count,
        providerOrgId: data.target_org_ids?.[0] ?? 'unknown',
        requesterName: user.email ?? user.id,
        route: 'exchange',
      },
    );

    return Response.json({ data }, { status: 201 });
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'exchange', 'kadarn.api.method': 'POST' } },
);
