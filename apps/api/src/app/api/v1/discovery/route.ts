// ==========================================================================
// Discovery Engine API — Semantic search with knowledge expansion
// ==========================================================================

import { withAuth, ApiError, createRouteClient } from '@/lib/supabase-server';
import { semanticDiscoverySearch } from '@/lib/knowledge-runtime';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().optional(),
  types: z.string().optional(),
  sample_types: z.string().optional(),
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

  const { data, error } = await semanticDiscoverySearch(supabase, {
    q: params.q ?? null,
    types: params.types ? params.types.split(',').map(type => type.trim()) : null,
    sampleTypes: params.sample_types ? params.sample_types.split(',').map(type => type.trim()) : null,
    disease: params.disease ?? null,
    country: params.country ?? null,
    commercialOnly: params.commercial_only ?? null,
    limit: params.limit,
    offset: params.offset,
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
    meta: {
      semantic: true,
    },
  });
});
