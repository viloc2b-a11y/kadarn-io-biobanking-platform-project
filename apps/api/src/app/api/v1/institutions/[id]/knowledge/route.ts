// ==========================================================================
// KAD-008 — Knowledge Publication API
// ==========================================================================
// GET  /api/v1/institutions/[id]/knowledge — List published knowledge
// POST /api/v1/institutions/[id]/knowledge — Create knowledge entry
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreatePublishedKnowledgeSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status') ?? 'published';

    let query = supabase.from('published_knowledge').select('*').eq('organization_id', id);
    if (type) query = query.eq('knowledge_type', type);
    query = query.eq('status', status).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new ApiError(500, 'Failed to fetch knowledge');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreatePublishedKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, error } = await supabase.from('published_knowledge').insert({ ...parsed.data, organization_id: id }).select().single();
    if (error) throw new ApiError(500, 'Failed to create knowledge entry');
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
