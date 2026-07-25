// ==========================================================================
// KAD-LOOP-002 — Single Generation Rule API
// ==========================================================================
// GET    /api/v1/generation-rules/[id] — Retrieve rule
// PATCH  /api/v1/generation-rules/[id] — Update rule
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { UpdateGenerationRuleSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('evidence_generation_rules')
      .select('*')
      .eq('id', id)
      .single();
    if (!data) throw new ApiError(404, 'Generation rule not found');
    if (error) throw new ApiError(500, 'Failed to fetch rule');
    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = UpdateGenerationRuleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('evidence_generation_rules')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();
    if (!data) throw new ApiError(404, 'Generation rule not found');
    if (error) throw new ApiError(500, `Failed to update rule: ${error.message}`);
    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
