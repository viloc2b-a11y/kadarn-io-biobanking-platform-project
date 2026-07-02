// ==========================================================================
// Identity Resolution API
// ==========================================================================
// Baseline AF-1.0. Sprint 19.0A.
// ACR-001: Institution → Site hierarchy.
// POST /api/v1/evidence-core/identity/resolve
//
// NOT IMPLEMENTED: identity resolution requires an org-scoped, per-request
// load of known institutions and the cross-source index from durable
// storage. A previous version of this route resolved against permanently
// empty module-level state (shared across all requests/tenants), which
// silently produced meaningless "unresolved" results for every caller.
// Returning 501 here is more honest than a silent no-op resolution.
// ==========================================================================

import { withAuth } from '@/lib/supabase-server';

export const POST = withAuth(async () => {
  return Response.json(
    {
      error: 'Identity resolution is not implemented. Resolving institution identity ' +
        'requires org-scoped lookup of known institutions and cross-source index data ' +
        'from durable storage, which has not been built yet.',
    },
    { status: 501 },
  );
});
