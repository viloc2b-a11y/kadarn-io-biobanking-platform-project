// ==========================================================================
// KAD-LOOP-003 — Capabilities API (Phase 9)
// ==========================================================================
// POST /api/v1/capabilities — Create a capability
// GET  /api/v1/capabilities — List capabilities (filters: orgId, status,
//                              page, limit)
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { CreateInstitutionCapabilitySchema } from '@kadarn/types';
import { z } from 'zod';

// ─── Local enum value array (mirrors InstitutionCapabilityStatus) ──────────
// Defined locally because @kadarn/types ships Zod v4 schemas while apps/api
// resolves Zod v3; composing the foreign enum into a local z.object triggers
// TS2740. Using the raw string values with a local z.enum() avoids the
// cross-version class mismatch while validating the same value set.
const CAPABILITY_STATUSES = [
  'declared', 'evidence_submitted', 'under_review', 'verified', 'published', 'deprecated',
] as const;

// ─── Query params schema (GET list) ───────────────────────────────────────
const listQuerySchema = z.object({
  orgId: z.string().uuid().optional(),
  status: z.enum(CAPABILITY_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── POST — create capability ─────────────────────────────────────────────
export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateInstitutionCapabilitySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('capabilities')
      .insert({
        ...parsed.data,
        status: 'declared',
        review_status: 'pending',
        claim_count: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Capability already exists for this organization');
      throw new ApiError(500, 'Failed to create capability', error.message);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── GET — list capabilities ──────────────────────────────────────────────
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

    const { orgId, status, page, limit } = parsed.data;
    const supabase = createServiceClient();

    // Tenant safety: orgId is required.
    if (!orgId) {
      return Response.json(
        { data: null, error: 'orgId query parameter is required for tenant safety' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('capabilities')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId);

    if (status) query = query.eq('status', status);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new ApiError(500, 'Failed to list capabilities', error.message);

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
