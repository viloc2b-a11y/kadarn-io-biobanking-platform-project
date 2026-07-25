// ==========================================================================
// KAD-006 — Review API
// ==========================================================================
// GET    /api/v1/claims/[id]/reviews — List reviews for a claim
// POST   /api/v1/claims/[id]/reviews — Assign a review
// PATCH  /api/v1/reviews/[id] — Update review status/decision
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateReviewSchema, UpdateReviewSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('review_tasks').select('*').eq('claim_id', id).order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'Failed to fetch reviews');
    return Response.json({ data, error: null });
  } catch (error) { return handleApiError(error); }
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateReviewSchema.safeParse({ ...body, claim_id: id });
    if (!parsed.success) {
      return Response.json({ data: null, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    const { data, error } = await supabase.from('review_tasks').insert({ ...parsed.data, status: 'pending' }).select().single();
    if (error) throw new ApiError(500, 'Failed to create review');
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) { return handleApiError(error); }
});
