// ============================================================================
// Passport API
// ============================================================================
// GET  /api/v1/passport — Get aggregated passport for current org
// POST /api/v1/passport/publish — Publish selected claims
// ============================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { getClaimsByOrganizationId, getEvidenceNodesByClaim } from '@kadarn/evidence-core';
import { evaluateClaim } from '@kadarn/readiness-engine';

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);

    // Get all claims for this org
    const claims = await getClaimsByOrganizationId(supabase as any, organizationId);

    // Get published entries
    const { data: entries } = await supabase
      .from('passport_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    // Evaluate each published claim
    const publishedClaims = await Promise.all(
      (entries ?? []).map(async (entry: any) => {
        const claim = claims.find((c: any) => c.id === entry.claim_id);
        let confidence = null;
        try {
          const evidenceNodes = await getEvidenceNodesByClaim(supabase as any, entry.claim_id);
          if (claim) {
            confidence = evaluateClaim({
              claimId: entry.claim_id,
              claims: [claim],
              evidenceNodes,
              actorId: user.id,
              correlationId: crypto.randomUUID(),
            });
          }
        } catch { /* not evaluable */ }
        return {
          passportEntryId: entry.id,
          claimId: entry.claim_id,
          claimName: claim?.name ?? 'Unknown',
          domain: claim?.domain ?? '',
          publicationStatus: entry.publication_status,
          visibility: entry.visibility_scope,
          publishedAt: entry.published_at,
          confidence,
        };
      }),
    );

    // Count summary
    const summary = {
      totalClaims: claims.length,
      publishedClaims: publishedClaims.filter((c: any) => c.publicationStatus === 'published').length,
      draftClaims: publishedClaims.filter((c: any) => c.publicationStatus === 'draft').length,
      restrictedClaims: publishedClaims.filter((c: any) => c.publicationStatus === 'restricted').length,
      notPublished: claims.length - (entries?.length ?? 0),
    };

    return Response.json({ data: { summary, publishedClaims } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);
    const body = await request.json() as Record<string, unknown>;

    if (!body.claimIds || !Array.isArray(body.claimIds)) {
      return Response.json(
        { data: null, error: 'Missing required field: claimIds (array)' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const results = [];

    for (const claimId of body.claimIds as string[]) {
      // Upsert passport entry
      const { data: existing } = await supabase
        .from('passport_entries')
        .select('id')
        .eq('claim_id', claimId)
        .eq('organization_id', organizationId)
        .single();

      if (existing) {
        await supabase
          .from('passport_entries')
          .update({
            publication_status: 'published',
            visibility_scope: (body.visibility as string) ?? 'sponsor_authorized',
            authorized_sponsor_ids: (body.authorizedSponsorIds as string[]) ?? [],
            published_at: now,
            published_by: user.id,
            updated_at: now,
          })
          .eq('id', existing.id);
        results.push({ claimId, passportEntryId: existing.id, action: 'updated' });
      } else {
        const id = crypto.randomUUID();
        await supabase
          .from('passport_entries')
          .insert({
            id,
            organization_id: organizationId,
            claim_id: claimId,
            publication_status: 'published',
            visibility_scope: (body.visibility as string) ?? 'sponsor_authorized',
            authorized_sponsor_ids: (body.authorizedSponsorIds as string[]) ?? [],
            published_at: now,
            published_by: user.id,
          });
        results.push({ claimId, passportEntryId: id, action: 'created' });
      }
    }

    return Response.json({ data: { published: results.length, results } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
});
