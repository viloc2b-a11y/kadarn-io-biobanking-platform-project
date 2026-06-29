import { withAuth, ApiError } from '@/lib/supabase-server';
import { uuidParamSchema } from '@/lib/validation';

export const GET = withAuth(async (_request, _user, params) => {
  const { id } = uuidParamSchema.parse(params);
  const supabase = await import('@/lib/supabase-server').then(m => m.createRouteClient());

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new ApiError(404, 'Program not found');
    }
    throw new ApiError(500, 'Failed to fetch program', error.message);
  }

  return Response.json({ data });
});
