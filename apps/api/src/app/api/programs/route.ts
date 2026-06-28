import { withAuth, ApiError } from '@/lib/supabase-server';
import { createProgramSchema, paginationSchema } from '@/lib/validation';

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

export const POST = withAuth(async (request, user) => {
  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
  const body = (await request.json()) as Record<string, unknown>;

  const parsed = createProgramSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);
  }

  // Verify the sponsor organization exists (RLS will enforce visibility)
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

  return Response.json({ data }, { status: 201 });
});
