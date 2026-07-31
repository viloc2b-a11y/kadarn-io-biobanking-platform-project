// ==========================================================================
// KEMS — Capabilities API (Profile-scoped, service-backed)
// ==========================================================================
// GET  /api/v1/capabilities?profileId=<uuid> — List capabilities for a profile
// POST /api/v1/capabilities — Evaluate a capability by { capabilityId }
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { CapabilityService } from '@kadarn/platform-services';
import { z } from 'zod';

// ─── Query params schema (GET list) ───────────────────────────────────────
const listQuerySchema = z.object({
  profileId: z.string().uuid(),
  lifecycleState: z
    .enum(['declared', 'evidence_submitted', 'under_review', 'verified', 'published', 'suspended', 'deprecated'])
    .optional(),
  area: z.string().optional(),
});

// ─── POST body schema (evaluate) ──────────────────────────────────────────
const evaluateBodySchema = z.object({
  capabilityId: z.string().uuid(),
});

// ─── GET — list capabilities for a profile ────────────────────────────────
export const GET = withAuth(async (request, _user, _params) => {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = listQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { profileId, lifecycleState, area } = parsed.data;
    const supabase = createServiceClient();

    let query = supabase
      .from('kems_capabilities')
      .select('*')
      .eq('profile_id', profileId);

    if (lifecycleState) query = query.eq('lifecycle_state', lifecycleState);
    if (area) query = query.eq('area', area);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, 'Failed to list capabilities', error.message);
    }

    return Response.json({
      data: data ?? [],
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── POST — evaluate a capability ─────────────────────────────────────────
export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = evaluateBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { capabilityId } = parsed.data;
    const supabase = createServiceClient();

    // Wire a minimal CapabilityService with only the KEMS repos it needs
    const service = new CapabilityService(
      // stub base CRUD repo (not used by evaluate)
      {} as any,
      // KEMS capability instance repo
      {
        async findById(id: string) {
          const { data, error } = await supabase.from('kems_capabilities').select('*').eq('id', id).single();
          if (error) {
            if (error.code === 'PGRST116') return { data: null, error: null };
            return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
          }
          return { data, error: null };
        },
        async listByProfile() {
          return { data: [], error: null };
        },
        async update() {
          return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only' } };
        },
      },
    );

    const evaluation = await service.evaluateCapability(capabilityId);

    return Response.json({ data: evaluation, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
