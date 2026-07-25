// ==========================================================================
// KAD-LOOP-004 — Confidence Model Rules API (Phase 10)
// ==========================================================================
// GET  /api/v1/confidence-models/[id]/rules — List rules for a model
// POST /api/v1/confidence-models/[id]/rules — Create a rule for a model
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { CreateConfidenceRuleSchema, ConfidenceRuleStatus, ConfidenceRuleEffectType } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const RULE_STATUSES = ['draft', 'active', 'deprecated', 'retired'] as const;

const listQuerySchema = z.object({
  status: z.enum(RULE_STATUSES).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── GET — list rules for a confidence model ──────────────────────────────
export const GET = withAuth(async (request, _user, params) => {
  try {
    const { id: modelId } = paramsSchema.parse(params);
    const url = new URL(request.url);
    const qp = Object.fromEntries(url.searchParams.entries());
    const parsed = listQuerySchema.safeParse(qp);

    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Verify the parent model exists.
    const { data: model, error: modelErr } = await supabase
      .from('confidence_models')
      .select('id')
      .eq('id', modelId)
      .single();

    if (modelErr || !model) throw new ApiError(404, 'Confidence model not found');

    const { status, category, page, limit } = parsed.data;
    let query = supabase
      .from('confidence_rules')
      .select('*', { count: 'exact' })
      .eq('confidence_model_id', modelId);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('priority', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new ApiError(500, 'Failed to list confidence rules', error.message);

    return Response.json({
      data: {
        items: data ?? [],
        page,
        limit,
        total: count ?? 0,
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── POST — create rule for a confidence model ────────────────────────────
export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id: modelId } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateConfidenceRuleSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Verify the parent model exists and is not retired.
    const { data: model, error: modelErr } = await supabase
      .from('confidence_models')
      .select('id, status')
      .eq('id', modelId)
      .single();

    if (modelErr || !model) throw new ApiError(404, 'Confidence model not found');

    if (model.status === 'retired') {
      throw new ApiError(409, 'Cannot add rules to a retired confidence model');
    }

    // Ensure the rule is scoped to this model.
    const { data, error } = await supabase
      .from('confidence_rules')
      .insert({
        ...parsed.data,
        confidence_model_id: modelId,
        status: 'draft',
        version: 1,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError(409, 'Confidence rule with this key already exists for this model');
      }
      throw new ApiError(500, 'Failed to create confidence rule', error.message);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
