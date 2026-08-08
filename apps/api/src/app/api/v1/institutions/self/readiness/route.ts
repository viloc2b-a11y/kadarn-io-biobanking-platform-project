// ==========================================================================
// KAD-011 — Self Readiness API
// GET /api/v1/institutions/self/readiness — resolves active org from session
// ==========================================================================

import { withAuth, handleApiError } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { NextResponse } from 'next/server';

export const GET = withAuth(async (_request, user) => {
  try {
    const orgId = await requireValidatedActiveOrg(user);
    // Redirect internally to the standard readiness endpoint
    const url = new URL(_request.url);
    const targetUrl = new URL(`/api/v1/institutions/${orgId}/readiness`, url.origin);
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    return handleApiError(error);
  }
});
