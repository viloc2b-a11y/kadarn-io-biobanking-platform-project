// ==========================================================================
// KAD-011 — Readiness API (Score-Free)
// ==========================================================================
// GET /api/v1/institutions/[id]/readiness — Factual readiness dimensions only.
// No institutional aggregate score. No readiness "level" label.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { z } from 'zod';

interface ReadinessDimension {
  name: string;
  score: number;
  weight: number;
  reason: string;
}

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    // Count factual dimensions
    const [peopleCount, locationCount, capabilityCount, passportCount, evidenceCount] =
      await Promise.all([
        supabase.from('organization_memberships').select('id', { count: 'exact', head: true }).eq('organization_id', id),
        supabase.from('locations').select('id', { count: 'exact', head: true }).eq('institution_id', id),
        supabase.from('capabilities').select('id', { count: 'exact', head: true }).eq('organization_id', id),
        supabase.from('passport_entries').select('id', { count: 'exact', head: true }).eq('organization_id', id).eq('status', 'published'),
        supabase.from('evidence_nodes').select('id', { count: 'exact', head: true }),
      ]);

    const people = peopleCount.count ?? 0;
    const locations = locationCount.count ?? 0;
    const capabilities = capabilityCount.count ?? 0;
    const passport = passportCount.count ?? 0;
    const evidence = evidenceCount.count ?? 0;

    // Factual dimensions — no aggregate, no overall score, no level label
    const dimensions: ReadinessDimension[] = [
      { name: 'profile_completeness', score: Math.min((people * 0.1 + locations * 0.15), 1), weight: 0, reason: `${people} members, ${locations} locations` },
      { name: 'evidence_coverage', score: Math.min(evidence / 10, 1), weight: 0, reason: `${evidence} evidence nodes` },
      { name: 'credential_validity', score: 0, weight: 0, reason: 'Credential registry pending' },
      { name: 'recruitment_capability', score: Math.min(people * 0.1, 1), weight: 0, reason: `${people} members` },
      { name: 'passport_completeness', score: Math.min(passport / 5, 1), weight: 0, reason: `${passport} published entries` },
      { name: 'capability_coverage', score: Math.min(capabilities / 3, 1), weight: 0, reason: `${capabilities} capabilities declared` },
    ];

    return Response.json({
      data: {
        organization_id: id,
        dimensions,
        computed_at: new Date().toISOString(),
      },
      cached: false,
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
