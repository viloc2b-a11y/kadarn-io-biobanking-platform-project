import { withAuth, ApiError } from '@/lib/supabase-server';
import { createOrganizationSchema, paginationSchema } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
  const url = new URL(request.url);
  const { limit, offset } = paginationSchema.parse({
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
  });

  const { data, error, count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  if (error) throw new ApiError(500, 'Failed to fetch organizations', error.message);

  return Response.json({
    data: data ?? [],
    pagination: { total: count ?? 0, limit, offset },
  });
});

export const POST = withAuth(async (request, user) => {
  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
  const body = await request.json();

  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Validation error', parsed.error.flatten().fieldErrors);
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation
    if (error.code === '23505') {
      throw new ApiError(409, 'An organization with this name already exists in this country');
    }
    throw new ApiError(500, 'Failed to create organization', error.message);
  }

  return Response.json({ data }, { status: 201 });
});
