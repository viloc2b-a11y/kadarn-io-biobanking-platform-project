// ==========================================================================
// KAD-LOOP-003 — Claims API (Phase 9)
// ==========================================================================
// POST /api/v1/claims           — Create a claim
// GET  /api/v1/claims           — List claims (filters: orgId, status, typeId,
//                                  scope, page, limit)
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { CreateClaimSchema } from '@kadarn/types';
import { z } from 'zod';

// ─── Local enum value arrays (mirror @kadarn/types enums) ─────────────────
// Defined locally because @kadarn/types ships Zod v4 schemas while apps/api
// resolves Zod v3; composing the foreign enum schemas into a local z.object
// triggers TS2740. Using the raw string values with a local z.enum() avoids
// the cross-version class mismatch while validating the same value set.
const CLAIM_LIFECYCLE_STATUSES = [
  'draft', 'review', 'approved', 'rejected', 'superseded', 'expired', 'archived',
] as const;
const CLAIM_SCOPES = ['institution', 'location', 'person'] as const;

// ─── Query params schema (GET list) ───────────────────────────────────────
const listQuerySchema = z.object({
  orgId: z.string().uuid().optional(),
  status: z.enum(CLAIM_LIFECYCLE_STATUSES).optional(),
  typeId: z.string().min(1).optional(),
  scope: z.enum(CLAIM_SCOPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── POST — create claim ──────────────────────────────────────────────────
export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = CreateClaimSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Insert in draft state; defaults are applied by the DB + Zod schema.
    const { data, error } = await supabase
      .from('claims')
      .insert({
        ...parsed.data,
        lifecycle_status: 'draft',
        review_status: 'pending',
        workflow_state: 'draft',
        version: 1,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Claim already exists');
      throw new ApiError(500, 'Failed to create claim', error.message);
    }

    // Snapshot initial version (v1) into claim_versions for immutable history.
    await supabase.from('claim_versions').insert({
      claim_id: data.id,
      version: 1,
      claim_type_id: data.claim_type_id,
      name: data.name,
      description: data.description ?? null,
      organization_id: data.organization_id,
      location_id: data.location_id ?? null,
      person_id: data.person_id ?? null,
      claim_category: data.claim_category ?? null,
      claim_scope: data.claim_scope ?? null,
      priority: data.priority ?? 'medium',
      owner_id: data.owner_id ?? null,
      source_event_id: data.source_event_id ?? null,
      workflow_state: data.workflow_state,
      lifecycle_status: data.lifecycle_status,
      review_status: data.review_status,
      evidence_count: data.evidence_count ?? 0,
      expires_at: data.expires_at ?? null,
      tags: data.tags ?? null,
      created_by_actor_id: data.created_by_actor_id ?? null,
    });

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── GET — list claims ────────────────────────────────────────────────────
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

    const { orgId, status, typeId, scope, page, limit } = parsed.data;
    const supabase = createServiceClient();

    // Tenant safety: if orgId is not provided we refuse to return an unscoped
    // cross-tenant dump. Callers must specify orgId.
    if (!orgId) {
      return Response.json(
        { data: null, error: 'orgId query parameter is required for tenant safety' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('claims')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId);

    if (status) query = query.eq('lifecycle_status', status);
    if (typeId) query = query.eq('claim_type_id', typeId);
    if (scope) query = query.eq('claim_scope', scope);

    const offset = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new ApiError(500, 'Failed to list claims', error.message);

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
