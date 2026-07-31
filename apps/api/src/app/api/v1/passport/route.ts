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
  type CapabilityInstanceRepositoryLike,
  type CapabilityStateRepositoryLike,
  type CapabilityActivationEventRepositoryLike,
  type ReadinessContributionRepositoryLike,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

// ─── ProfileServiceLike adapter ──────────────────────────────────────────

function createProfileServiceLike(db: DbClient): ProfileServiceLike {
  return {
    async getProfile(profileId: string) {
      const { data: profile, error } = await db
        .from('site_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      if (error || !profile) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      const { data: versions } = await db
        .from('site_profile_versions')
        .select('*')
        .eq('profile_id', profileId)
        .order('version', { ascending: false });

      const { data: attestations } = await db
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
      const { data: profile } = await db
        .from('site_profiles')
        .select('content')
        .eq('id', profileId)
        .single();

      const content = (profile?.content as Record<string, unknown>) ?? {};
      const totalSections = Object.keys(content).length;

      // Simple completeness: count non-null, non-empty sections
      const filled = Object.values(content).filter(
        (v) => v !== null && v !== undefined && v !== '' && JSON.stringify(v) !== '{}' && JSON.stringify(v) !== '[]',
      ).length;

      const completenessPct = totalSections > 0 ? Math.round((filled / totalSections) * 100) : 0;

      // Attestation coverage
      const { count: attestationCount } = await db
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

function createCapabilityServiceLike(db: DbClient): CapabilityServiceLike {
  // Build a minimal CapabilityService with KEMS repos for gaps + readiness
  const instanceRepo: CapabilityInstanceRepositoryLike = {
    async findById(id: string) {
      const { data, error } = await db.from('kems_capabilities').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return { data: null, error: null };
        return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
      }
      return { data, error: null };
    },
    async listByProfile(profileId: string, filters?) {
      let query = db.from('kems_capabilities').select('*').eq('profile_id', profileId);
      if (filters?.lifecycleState) query = query.eq('lifecycle_state', filters.lifecycleState as string);
      if (filters?.area) query = query.eq('area', filters.area as string);
      const { data, error } = await query;
      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
      return { data: data ?? [], error: null };
    },
    async update(_id: string, _patch: any) {
      return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only adapter' } };
    },
  };

  const stateRepo: CapabilityStateRepositoryLike = {
    async create(_input: any) {
      return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only adapter' } };
    },
    async listByCapability(_capabilityId: string) {
      return { data: [], error: null };
    },
    async endCurrentState(_capabilityId: string, _validUntil: string) {
      return { data: null, error: null };
    },
  };

  const eventRepo: CapabilityActivationEventRepositoryLike = {
    async create(_input: any) {
      return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only adapter' } };
    },
    async listByCapability(_capabilityId: string) {
      return { data: [], error: null };
    },
  };

  const readinessRepo: ReadinessContributionRepositoryLike = {
    async findByCapability(capabilityId: string) {
      const { data, error } = await db.from('kems_readiness_contributions').select('*').eq('capability_id', capabilityId).single();
      if (error) {
        if (error.code === 'PGRST116') return { data: null, error: null };
        return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
      }
      return { data, error: null };
    },
    async findByProfile(profileId: string) {
      const { data, error } = await db.from('kems_readiness_contributions').select('*').eq('profile_id', profileId);
      if (error) return { data: null, error: { code: error.code ?? 'DB_ERROR', message: error.message } };
      return { data: data ?? [], error: null };
    },
    async upsert(_capabilityId: string, _input: any) {
      return { data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Read-only adapter' } };
    },
  };

  const stubCapRepo = {
    findById: async () => ({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }),
    create: async () => ({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }),
    update: async () => ({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }),
    list: async () => ({ data: [] as any[], error: null }),
    addClaimLink: async () => ({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }),
    removeClaimLink: async () => ({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }),
    listClaimLinks: async () => ({ data: [] as any[], error: null }),
    setClaimCount: async () => ({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not used' } }),
  } as any;

  const capabilityService = new CapabilityService(
    stubCapRepo,
    instanceRepo,
    stateRepo,
    eventRepo,
    readinessRepo,
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

function createClaimServiceLike(db: DbClient): ClaimServiceLike {
  return {
    async getClaimWithEvidence(claimId: string) {
      const { data: claim, error } = await db.from('claims').select('*').eq('id', claimId).single();
      if (error || !claim) {
        throw new Error(`Claim not found: ${claimId}`);
      }

      const { data: evidenceLinks } = await db
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
  const db = createServiceClient() as unknown as DbClient;
  return new PublicationService(
    createProfileServiceLike(db),
    createCapabilityServiceLike(db),
    createClaimServiceLike(db),
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

// ─── POST — publish profile (validate eligibility) ────────────────────────
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

    // Step 1: Validate eligibility
    const eligibility = await service.validatePublicationEligibility(profileId);

    if (!eligibility.isEligible) {
      return Response.json(
        {
          data: null,
          error: 'Profile is not eligible for publication',
          eligibility,
        },
        { status: 422 },
      );
    }

    // Step 2: Generate the passport projection
    const passport = await service.generatePassportProjection(profileId);

    return Response.json(
      {
        data: {
          passport,
          eligibility,
        },
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
});
