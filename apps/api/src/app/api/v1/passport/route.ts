// ==========================================================================
// KEMS — Passport API (service-backed)
// ==========================================================================
// GET  /api/v1/passport?profileId=<uuid> — Get passport projection by profile
// POST /api/v1/passport — Publish a profile (validate eligibility + projection)
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import {
  PublicationService,
  CapabilityService,
  type ProfileServiceLike,
  type CapabilityServiceLike,
  type ClaimServiceLike,
  type CapabilityGap,
  type ProfileReadinessContribution,
} from '@kadarn/platform-services';
import { z } from 'zod';

// ─── Query params schema ──────────────────────────────────────────────────
const passportQuerySchema = z.object({
  profileId: z.string().uuid(),
});

// ─── POST body schema ─────────────────────────────────────────────────────
const publishBodySchema = z.object({
  profileId: z.string().uuid(),
});

// ─── ProfileServiceLike adapter ──────────────────────────────────────────

function createProfileServiceLike(supabase: ReturnType<typeof createServiceClient>): ProfileServiceLike {
  return {
    async getProfile(profileId: string) {
      const { data: profile, error } = await supabase
        .from('site_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      if (error || !profile) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      const { data: versions } = await supabase
        .from('site_profile_versions')
        .select('*')
        .eq('profile_id', profileId)
        .order('version', { ascending: false });

      const { data: attestations } = await supabase
        .from('profile_attestations')
        .select('*')
        .eq('profile_id', profileId);

      return {
        profile: profile as any,
        versions: (versions ?? []) as any[],
        attestations: (attestations ?? []) as any[],
      };
    },

    async calculateCompleteness(profileId: string) {
      const { data: profile } = await supabase
        .from('site_profiles')
        .select('content')
        .eq('id', profileId)
        .single();

      const content = (profile?.content as Record<string, unknown>) ?? {};
      const totalSections = Object.keys(content).length;
      const filled = Object.values(content).filter(
        (v) => v !== null && v !== undefined && v !== '' &&
          JSON.stringify(v) !== '{}' && JSON.stringify(v) !== '[]',
      ).length;
      const completenessPct = totalSections > 0 ? Math.round((filled / totalSections) * 100) : 0;

      const { count: attestationCount } = await supabase
        .from('profile_attestations')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId);

      return {
        completeness_pct: completenessPct,
        filled_sections: filled,
        total_sections: totalSections,
        attestation_pct: attestationCount ? Math.min(100, Math.round((attestationCount / 2) * 100)) : 0,
        required_sections_count: totalSections,
        optional_sections_count: 0,
      } as any;
    },
  };
}

// ─── CapabilityServiceLike adapter ───────────────────────────────────────

function createCapabilityServiceLike(supabase: ReturnType<typeof createServiceClient>): CapabilityServiceLike {
  const capabilityService = new CapabilityService(
    {} as any,
    {
      async findById(id: string) {
        const { data, error } = await supabase.from('kems_capabilities').select('*').eq('id', id).single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
        }
        return { data, error: null };
      },
      async listByProfile(profileId: string, filters?: { lifecycleState?: string; area?: string }) {
        let query = supabase.from('kems_capabilities').select('*').eq('profile_id', profileId);
        if (filters?.lifecycleState) query = query.eq('lifecycle_state', filters.lifecycleState);
        if (filters?.area) query = query.eq('area', filters.area);
        const { data, error } = await query;
        if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
        return { data: data ?? [], error: null };
      },
      async update() {
        return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only' } };
      },
    },
    // capability states
    {
      async create() { return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }; },
      async listByCapability() { return { data: [], error: null }; },
      async endCurrentState() { return { data: null, error: null }; },
    },
    // activation events
    {
      async create() { return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }; },
      async listByCapability() { return { data: [], error: null }; },
    },
    // readiness contributions
    {
      async findByCapability(capabilityId: string) {
        const { data, error } = await supabase.from('kems_readiness_contributions').select('*').eq('capability_id', capabilityId).single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
        }
        return { data, error: null };
      },
      async findByProfile(profileId: string) {
        const { data, error } = await supabase.from('kems_readiness_contributions').select('*').eq('profile_id', profileId);
        if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
        return { data: data ?? [], error: null };
      },
      async upsert() {
        return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only' } };
      },
    },
  );

  return {
    async getGaps(profileId: string): Promise<CapabilityGap[]> {
      return capabilityService.getGaps(profileId);
    },
    async getReadinessContribution(profileId: string): Promise<ProfileReadinessContribution> {
      return capabilityService.getReadinessContribution(profileId);
    },
  };
}

// ─── ClaimServiceLike adapter ────────────────────────────────────────────

function createClaimServiceLike(supabase: ReturnType<typeof createServiceClient>): ClaimServiceLike {
  return {
    async getClaimWithEvidence(claimId: string) {
      const { data: claim, error } = await supabase.from('claims').select('*').eq('id', claimId).single();
      if (error || !claim) {
        throw new Error(`Claim not found: ${claimId}`);
      }
      const { data: evidenceLinks } = await supabase
        .from('claim_evidence')
        .select('evidence_id')
        .eq('claim_id', claimId);
      return {
        claim: claim as any,
        evidenceLinks: (evidenceLinks ?? []) as any[],
      };
    },
  };
}

// ─── Service factory ──────────────────────────────────────────────────────

function getPublicationService(): PublicationService {
  const supabase = createServiceClient();
  return new PublicationService(
    createProfileServiceLike(supabase),
    createCapabilityServiceLike(supabase),
    createClaimServiceLike(supabase),
  );
}

// ─── GET — passport projection by profile ─────────────────────────────────
export const GET = withAuth(async (request, _user, _params) => {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = passportQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { profileId } = parsed.data;
    const service = getPublicationService();
    const passport = await service.generatePassportProjection(profileId);

    return Response.json({ data: passport, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});

// ─── POST — publish profile (validate eligibility + generate) ─────────────
export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = publishBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { profileId } = parsed.data;
    const service = getPublicationService();

    const eligibility = await service.validatePublicationEligibility(profileId);

    if (!eligibility.isEligible) {
      return Response.json(
        { data: null, error: 'Profile is not eligible for publication', eligibility },
        { status: 422 },
      );
    }

    const passport = await service.generatePassportProjection(profileId);

    return Response.json(
      { data: { passport, eligibility }, error: null },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
});
