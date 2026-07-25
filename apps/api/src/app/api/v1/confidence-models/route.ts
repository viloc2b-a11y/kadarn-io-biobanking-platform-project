// ==========================================================================
// KAD-LOOP-004 — Confidence Models API (Phase 10)
// ==========================================================================
// GET  /api/v1/confidence-models        — List confidence models
// POST /api/v1/confidence-models        — Create a confidence model
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { CreateConfidenceModelSchema, ConfidenceModelStatus } from '@kadarn/types';
import { z } from 'zod';

const MODEL_STATUSES = ['draft', 'active', 'deprecated', 'retired'] as const;

const listQuerySchema = z.object({
  tenantId: z.string().uuid().optional(),
  status: z.enum(MODEL_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── POST — create confidence model ────────────────────────────────────────
export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateConfidenceModelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('confidence_models')
      .insert({
        ...parsed.data,
        status: 'draft',
        version: 1,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError(409, 'Confidence model with this name already exists for this tenant');
      }
      throw new ApiError(500, 'Failed to create confidence model', error.message);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── GET — list confidence models ──────────────────────────────────────────
export const GET = withAuth(async (request, _user, _params) => {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsed = listQuerySchema.safeParse(params);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { tenantId, status, page, limit } = parsed.data;

    // Tenant safety: tenantId is required.
    if (!tenantId) {
      return Response.json(
        { data: null, error: 'tenantId query parameter is required for tenant safety' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('confidence_models')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (status) query = query.eq('status', status);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new ApiError(500, 'Failed to list confidence models', error.message);

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
