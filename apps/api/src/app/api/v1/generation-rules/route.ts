// ==========================================================================
// KAD-LOOP-002 — Generation Rules API
// ==========================================================================
// GET    /api/v1/generation-rules      — List rules
// POST   /api/v1/generation-rules      — Create rule
// GET    /api/v1/generation-rules/[id] — Retrieve rule
// PATCH  /api/v1/generation-rules/[id] — Update rule
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateGenerationRuleSchema, UpdateGenerationRuleSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// GET — List rules
export const GET = withAuth(async (request, _user, _params) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    const supabase = await createRouteClient();
    let query = supabase
      .from('evidence_generation_rules')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('rule_status', status);
    }

    const { data, error, count } = await query;
    if (error) throw new ApiError(500, 'Failed to fetch generation rules');
    return Response.json({ data, error: null, pagination: { page, limit, total: count } });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST — Create rule
export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateGenerationRuleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('evidence_generation_rules')
      .insert(parsed.data)
      .select()
      .single();
    if (error) throw new ApiError(500, `Failed to create rule: ${error.message}`);
    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
