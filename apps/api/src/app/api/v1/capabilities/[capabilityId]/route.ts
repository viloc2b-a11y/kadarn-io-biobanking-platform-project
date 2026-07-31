// ==========================================================================
// KEMS — Single Capability API (service-backed)
// ==========================================================================
// GET /api/v1/capabilities/[capabilityId] — Get a single capability
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ capabilityId: z.string().uuid() });

// ─── GET — single capability by ID ────────────────────────────────────────
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { capabilityId } = paramsSchema.parse(params);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('kems_capabilities')
      .select('*')
      .eq('id', capabilityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Capability not found');
      throw new ApiError(500, 'Failed to fetch capability', error.message);
    }
    if (!data) throw new ApiError(404, 'Capability not found');

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
