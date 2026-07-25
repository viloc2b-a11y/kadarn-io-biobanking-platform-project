// ==========================================================================
// KAD-011 — Readiness API
// ==========================================================================
// GET  /api/v1/institutions/[id]/readiness — Get/Compute readiness score
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import type { ReadinessDimension } from '@kadarn/types';
import { computeReadinessLevel } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    // 1. Try cache
    const { data: cached } = await supabase
      .from('readiness_scores')
      .select('*')
      .eq('organization_id', id)
      .single();

    // If cached less than 1 hour old, return it
    if (cached) {
      const age = Date.now() - new Date(cached.computed_at).getTime();
      if (age < 3_600_000) {
        return Response.json({ data: cached, cached: true, error: null });
      }
    }

    // 2. Compute dimensions
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

    const dimensions: ReadinessDimension[] = [
      { name: 'profile_completeness', score: Math.min((people * 0.1 + locations * 0.15) / 1, 1), weight: 0.20, reason: `${people} members, ${locations} locations` },
      { name: 'evidence_coverage', score: Math.min(evidence / 10, 1), weight: 0.20, reason: `${evidence} evidence nodes` },
      { name: 'credential_validity', score: 0.5, weight: 0.15, reason: 'Credential registry pending' },
      { name: 'recruitment_capability', score: Math.min(people * 0.1, 1), weight: 0.15, reason: `${people} members` },
      { name: 'passport_completeness', score: Math.min(passport / 5, 1), weight: 0.15, reason: `${passport} published entries` },
      { name: 'capability_coverage', score: Math.min(capabilities / 3, 1), weight: 0.15, reason: `${capabilities} capabilities declared` },
    ];

    const overall = dimensions.reduce((s, d) => s + d.score * d.weight, 0);

    // 3. Store
    const { data: saved } = await supabase
      .from('readiness_scores')
      .upsert({
        organization_id: id,
        overall_score: Math.round(overall * 100) / 100,
        profile_completeness: dimensions[0].score,
        evidence_coverage: dimensions[1].score,
        credential_validity: dimensions[2].score,
        recruitment_capability: dimensions[3].score,
        passport_completeness: dimensions[4].score,
        operational_metrics: dimensions[5].score,
        breakdown: { dimensions },
        computed_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' })
      .select()
      .single();

    return Response.json({
      data: {
        ...saved,
        level: computeReadinessLevel(overall),
        dimensions,
      },
      cached: false,
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
