// ==========================================================================
// Discovery Engine API — Search and filter supply items
// ==========================================================================

import { withAuth, ApiError, createRouteClient } from '@/lib/supabase-server';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().optional(),
  types: z.string().optional(), // comma-separated
  sample_types: z.string().optional(), // comma-separated
  disease: z.string().optional(),
  country: z.string().optional(),
  commercial_only: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = withAuth(async (request) => {
  const supabase = await createRouteClient();
  const url = new URL(request.url);
  const params = searchSchema.parse(Object.fromEntries(url.searchParams));

  // Build the RPC call to discovery_search
  const { data, error } = await supabase.rpc('discovery_search', {
    p_search_text: params.q || null,
    p_types: params.types ? params.types.split(',').map(t => t.trim()) as any : null,
    p_sample_types: params.sample_types ? params.sample_types.split(',').map(s => s.trim()) : null,
    p_disease_icd10: params.disease || null,
    p_country: params.country || null,
    p_commercial_only: params.commercial_only || null,
    p_limit: params.limit,
    p_offset: params.offset,
  });

  if (error) {
    throw new ApiError(500, 'Search failed', error.message);
  }

  const results = data ?? [];
  const total = results.length > 0 ? results[0].total_count : 0;

  return Response.json({
    data: results,
    pagination: {
      total: Number(total),
      limit: params.limit,
      offset: params.offset,
    },
  });
});
