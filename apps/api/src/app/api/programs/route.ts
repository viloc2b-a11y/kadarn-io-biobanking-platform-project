import { withAuth, ApiError } from '@/lib/supabase-server';
import { createProgramSchema, paginationSchema } from '@/lib/validation';
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry';
import { createCorrelationId } from '@/lib/exchange-helper';

export const GET = withAuth(async (request) => {
  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
  const url = new URL(request.url);
  const { limit, offset } = paginationSchema.parse({
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
  });

  const { data, error, count } = await supabase
    .from('programs')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  if (error) throw new ApiError(500, 'Failed to fetch programs', error.message);

  return Response.json({
    data: data ?? [],
    pagination: { total: count ?? 0, limit, offset },
  });
});

export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
    const body = (await request.json()) as Record<string, unknown>;
    const correlationId = createCorrelationId();

    const parsed = createProgramSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);
    }

    const { data: sponsorOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', parsed.data.sponsor_org_id)
      .single();

    if (!sponsorOrg) {
      throw new ApiError(400, 'Sponsor organization not found or not accessible');
    }

    const { data, error } = await supabase
      .from('programs')
      .insert({
        name: parsed.data.name,
        short_name: parsed.data.short_name,
        description: parsed.data.description,
        status: parsed.data.status,
        sponsor_org_id: parsed.data.sponsor_org_id,
        default_data_scope: parsed.data.default_data_scope,
        created_by: user.id,
        created_by_organization_id: parsed.data.sponsor_org_id,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to create program', error.message);
    }

    // ── Cross-engine hooks (fire-and-forget) ────────────────────────────
    console.log(JSON.stringify({
      type: 'domain_event',
      event: {
        type: 'ProgramCreated',
        payload: {
          programId: data.id,
          name: data.name,
          sponsorOrganizationId: parsed.data.sponsor_org_id,
          leadOrganizationId: null,
          createdBy: user.id,
        },
        actorId: user.id,
        organizationId: parsed.data.sponsor_org_id,
        correlationId,
      },
      timestamp: new Date().toISOString(),
    }));

    return Response.json({ data }, { status: 201 });
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'programs', 'kadarn.api.method': 'POST' } },
);
