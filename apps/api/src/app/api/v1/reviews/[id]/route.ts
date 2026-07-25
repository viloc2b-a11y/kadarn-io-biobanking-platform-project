// ==========================================================================
// KAD-006 — Single Review API
// ==========================================================================
// GET    /api/v1/reviews/[id] — Get a review
// PATCH  /api/v1/reviews/[id] — Update decision/status
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdateReviewSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('review_tasks').select('*').eq('id', id).single();
    if (!data) throw new ApiError(404, 'Review not found');
    if (error) throw new ApiError(500, 'Failed to fetch review');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'approved' || parsed.data.status === 'rejected') {
      update.completed_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('review_tasks').update(update).eq('id', id).select().single();
    if (!data) throw new ApiError(404, 'Review not found');
    if (error) throw new ApiError(500, 'Failed to update review');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});
