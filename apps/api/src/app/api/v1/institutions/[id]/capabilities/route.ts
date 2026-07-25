// ==========================================================================
// KAD-003 — Capability API
// ==========================================================================
// POST /api/v1/institutions/[id]/capabilities — Create a Capability
// GET  /api/v1/institutions/[id]/capabilities — List Capabilities
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { CreateInstitutionCapabilitySchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    const { data, error } = await supabase
      .from('capabilities')
      .select('*, primary_claim:primary_claim_id(id, name, claim_type_id)')
      .eq('organization_id', id)
      .order('name', { ascending: true });

    if (error) return handleApiError(error);

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    const parsed = CreateInstitutionCapabilitySchema.safeParse({ ...body, organization_id: id });
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('capabilities')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError(409, 'This capability already exists for this organization');
      }
      return handleApiError(error);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
