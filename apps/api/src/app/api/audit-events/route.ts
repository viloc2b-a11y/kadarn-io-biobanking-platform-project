import { withAuth, ApiError } from '@/lib/supabase-server';
import { paginationSchema } from '@/lib/validation';

export const GET = withAuth(async (request, user) => {
  // RC-0.3: KOC access restricted
  if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
    return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
  }

  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());
  const url = new URL(request.url);
  const { limit, offset } = paginationSchema.parse({
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
  });

  // Users can only see audit events they generated (RLS enforced)
  const { data, error, count } = await supabase
    .from('audit_events')
    .select('*', { count: 'exact' })
    .eq('actor_id', user.id)
    .range(offset, offset + limit - 1);

  if (error) throw new ApiError(500, 'Failed to fetch audit events', error.message);

  return Response.json({
    data: data ?? [],
    pagination: { total: count ?? 0, limit, offset },
  });
});
