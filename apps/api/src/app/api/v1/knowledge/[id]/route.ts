// ==========================================================================
// KAD-008 — Single Knowledge Entry API
// ==========================================================================
// GET    /api/v1/knowledge/[id] — Public read
// PATCH  /api/v1/knowledge/[id] — Update (publish/archive)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdatePublishedKnowledgeSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('published_knowledge').select('*').eq('id', id).single();
    if (!data) throw new ApiError(404, 'Knowledge entry not found');
    if (error) throw new ApiError(500, 'Failed to fetch');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdatePublishedKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data?.status === 'published') update.published_at = new Date().toISOString();
    if (parsed.data?.status === 'archived') update.archived_at = new Date().toISOString();
    const { data, error } = await supabase.from('published_knowledge').update(update).eq('id', id).select().single();
    if (!data) throw new ApiError(404, 'Knowledge entry not found');
    if (error) throw new ApiError(500, 'Failed to update');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});
